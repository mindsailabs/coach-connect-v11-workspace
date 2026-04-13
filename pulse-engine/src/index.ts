// ══════════════════════════════════════════════════════════════════════════════
// Pulse Engine — Cloudflare Worker Entry Point
// POST /api/pulse → SSE stream with 3 parallel Groq calls
// ══════════════════════════════════════════════════════════════════════════════

import { Env, PulseRequest, ConversationMessage } from './types';
import { fetchPulseContext } from './context';
import { searchSessions } from './search';
import { groqComplete, MODELS } from './inference';
import { buildSuggestionsPrompt, buildCardsPrompt, buildKnowledgePrompt } from './prompts';

// ── Unicode dash cleanup — applied to ALL Groq output before sending to client
// Catches: em dash (U+2014), en dash (U+2013), non-breaking hyphen (U+2011),
// figure dash (U+2012), horizontal bar (U+2015), minus sign (U+2212)
function cleanDashes(text: string): string {
  return text.replace(/[\u2011\u2012\u2013\u2014\u2015\u2212]/g, '-');
}

// Deep-clean an object: recursively replace dashes in all string values
function cleanDashesDeep(obj: any): any {
  if (typeof obj === 'string') return cleanDashes(obj);
  if (Array.isArray(obj)) return obj.map(cleanDashesDeep);
  if (obj && typeof obj === 'object') {
    const cleaned: any = {};
    for (const [k, v] of Object.entries(obj)) {
      cleaned[k] = cleanDashesDeep(v);
    }
    return cleaned;
  }
  return obj;
}

// ── CORS headers ─────────────────────────────────────────────────────────────
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-pulse-api-key, Authorization',
  'Access-Control-Max-Age': '86400',
};

// ── SSE helper: write a typed event ──────────────────────────────────────────
function sseEvent(event: string, data: any): string {
  const json = typeof data === 'string' ? data : JSON.stringify(data);
  return `event: ${event}\ndata: ${json}\n\n`;
}

// ── Main handler ─────────────────────────────────────────────────────────────
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Only accept POST /api/pulse
    const url = new URL(request.url);
    if (url.pathname !== '/api/pulse' || request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    // Parse and validate request
    let body: PulseRequest;
    try {
      body = await request.json() as PulseRequest;
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    const { client_id, coach_id = 'default', message, api_key } = body;
    // Trim conversation history to last 4 messages max, and cap each message at 300 chars
    const conversation_history: ConversationMessage[] = (body.conversation_history || [])
      .slice(-4)
      .map((m: any) => ({ role: m.role, content: (m.content || '').slice(0, 300) }));

    // Auth check
    if (!api_key || api_key !== env.PULSE_API_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    if (!client_id || !message) {
      return new Response(JSON.stringify({ error: 'client_id and message are required' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    // ── SSE Stream ─────────────────────────────────────────────────────
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const write = (event: string, data: any) => {
      writer.write(encoder.encode(sseEvent(event, data))).catch(() => {});
    };

    // Start the async pipeline — use waitUntil to keep isolate alive for KV writes
    const pipelinePromise = runPipeline(env, client_id, coach_id, message, conversation_history, write, writer).catch((err: any) => {
      write('error', { message: err.message || 'Pipeline error' });
      writer.close().catch(() => {});
    });
    ctx.waitUntil(pipelinePromise);

    return new Response(readable, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });
  }
} satisfies ExportedHandler<Env>;

// ── Async pipeline (standalone function) ─────────────────────────────────────
async function runPipeline(
  env: Env,
  clientId: string,
  coachId: string,
  message: string,
  history: ConversationMessage[],
  write: (event: string, data: any) => void,
  writer: WritableStreamDefaultWriter
): Promise<void> {
    const pipelineStart = Date.now();

    // ── STEP 1: Fetch context (KV cache ~5ms, Base44 fallback ~900ms) ──
    let contextData;
    let cacheHit = false;
    try {
      const ctxStart = Date.now();
      const result = await fetchPulseContext(clientId, coachId, env);
      contextData = result.context;
      cacheHit = result.cacheHit;
      write('timing', { phase: 'context_fetch', ms: Date.now() - ctxStart, cache: cacheHit ? 'hit' : 'miss' });
    } catch (err: any) {
      write('error', { tier: 'context', message: err.message });
      write('done', {});
      await writer.close();
      return;
    }

    const { client_context, coach_context, search_index, knowledge_documents } = contextData;

    // ── STEP 2: BM25 search (~5ms) ─────────────────────────────────────
    const { results: searchResults, matchCount, searchTimeMs } = searchSessions(
      search_index,
      message,
      clientId
    );
    write('timing', { phase: 'bm25_search', ms: searchTimeMs, matches: matchCount });

    // ── STEP 3: Build knowledge docs string for prompt ─────────────────
    const knowledgeStr = knowledge_documents
      .map(d => `[${d.title}]\n${d.content.slice(0, 500)}`)
      .join('\n\n');

    // ── STEP 4: Build prompts ──────────────────────────────────────────
    const suggestionsPrompt = buildSuggestionsPrompt(client_context, coach_context, history, message);
    const cardsPrompt = buildCardsPrompt(client_context, coach_context, history, message, searchResults);
    const knowledgePrompt = buildKnowledgePrompt(client_context, coach_context, history, message, searchResults, knowledgeStr);

    // ── STEP 5: Fire 3 parallel Groq calls ─────────────────────────────
    // Task 1: Streaming suggestions (FAST model, 200 tokens)
    // Task 2: Complete cards (FULL model, 400 tokens)
    // Task 3: Complete knowledge (FULL model, 500 tokens)
    // Emit prompt diagnostics BEFORE calling Groq
    write('diagnostic', {
      prompts: {
        suggestions: {
          systemChars: suggestionsPrompt.system.length,
          userChars: suggestionsPrompt.user.length,
          estTokens: Math.ceil((suggestionsPrompt.system.length + suggestionsPrompt.user.length) / 4),
          maxTokens: 500,
          model: MODELS.FULL,
          systemPrompt: suggestionsPrompt.system,
          userPrompt: suggestionsPrompt.user,
        },
        cards: {
          systemChars: cardsPrompt.system.length,
          userChars: cardsPrompt.user.length,
          estTokens: Math.ceil((cardsPrompt.system.length + cardsPrompt.user.length) / 4),
          maxTokens: 800,
          model: MODELS.FULL,
          systemPrompt: cardsPrompt.system,
          userPrompt: cardsPrompt.user,
        },
        knowledge: {
          systemChars: knowledgePrompt.system.length,
          userChars: knowledgePrompt.user.length,
          estTokens: Math.ceil((knowledgePrompt.system.length + knowledgePrompt.user.length) / 4),
          maxTokens: 700,
          model: MODELS.FULL,
          systemPrompt: knowledgePrompt.system,
          userPrompt: knowledgePrompt.user,
        }
      }
    });

    const UNAVAILABLE_MSG = 'Suggestions unavailable for this message. Try sending another message.';
    const sugParams = { system: suggestionsPrompt.system, user: suggestionsPrompt.user, maxTokens: 700, stream: false as const, model: MODELS.FULL };
    const cardParams = { system: cardsPrompt.system, user: cardsPrompt.user, maxTokens: 800, stream: false as const, model: MODELS.FULL };

    // ── Parse suggestions from plain text ────────────────────────────────
    function parseSuggestions(result: any): { strategy: string; message: string }[] {
      const text = cleanDashes(result.content || '');
      const suggestions: { strategy: string; message: string }[] = [];
      const labels = ['EXPLORE', 'CONNECT', 'REDIRECT'];

      // Strategy 1: Split by label markers — handles preamble, varied spacing, multi-line responses
      for (let i = 0; i < labels.length; i++) {
        const label = labels[i];
        const nextLabel = labels[i + 1];
        // Match label with optional numbering like "1." or "1)" before it, capture everything until next label or end
        const boundary = nextLabel
          ? `(?=\\s*(?:\\d+[.\\)\\s]*)?${nextLabel}\\s*:)`
          : '$';
        const pattern = new RegExp(
          `(?:^|\\n)\\s*(?:\\d+[.\\)\\s]*)?${label}\\s*:\\s*(.+?)${boundary}`, 'is'
        );
        const match = text.match(pattern);
        if (match) {
          const msg = match[1].trim().replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ');
          if (msg.length > 20) {
            suggestions.push({ strategy: label.charAt(0) + label.slice(1).toLowerCase(), message: msg });
          }
        }
      }

      // Strategy 2: Try numbered format "1. ...\n2. ...\n3. ..." if labels not found
      if (suggestions.length < 2) {
        const numbered = text.match(/(?:^|\n)\s*(\d+)[.\)]\s+(.{25,})/g);
        if (numbered && numbered.length >= 2) {
          const strategyNames = ['Explore', 'Connect', 'Redirect'];
          suggestions.length = 0;
          numbered.slice(0, 3).forEach((line, idx) => {
            const msg = line.replace(/^\s*\d+[.\)]\s*/, '').trim().replace(/\n+/g, ' ');
            if (msg.length > 20) {
              suggestions.push({ strategy: strategyNames[idx] || 'Response', message: msg });
            }
          });
        }
      }

      // Strategy 3: Fallback — try JSON parse
      if (suggestions.length < 2 && result.parsed) {
        let jsonSugs = result.parsed;
        if (!Array.isArray(jsonSugs) && jsonSugs?.responses) jsonSugs = jsonSugs.responses;
        if (Array.isArray(jsonSugs)) {
          const valid = jsonSugs.filter((s: any) => s?.message && s.message.length > 20);
          if (valid.length >= 2) {
            suggestions.length = 0;
            valid.forEach((s: any) => suggestions.push({ strategy: s.strategy || 'Response', message: cleanDashes(s.message) }));
          }
        }
      }
      return suggestions;
    }

    // ── Parse cards from JSON ────────────────────────────────────────────
    function parseCards(result: any): any {
      let cardData = result.parsed;
      if (!cardData && result.content) {
        try {
          const raw = result.content.trim();
          const objMatch = raw.match(/\{[\s\S]*\}/);
          if (objMatch) cardData = JSON.parse(objMatch[0]);
        } catch { /* continue */ }
      }
      return cardData;
    }

    // ── Task 1: Suggestions with 1 retry ─────────────────────────────────
    const task1 = (async () => {
      const totalStart = Date.now();
      let attempt = 0;
      let lastResult: any = null;

      for (attempt = 1; attempt <= 2; attempt++) {
        try {
          const result = await groqComplete(sugParams, env);
          lastResult = result;
          const suggestions = parseSuggestions(result);

          if (suggestions.length >= 2) {
            write('suggestions_complete', { responses: suggestions, timing: Date.now() - totalStart, retried: attempt > 1 });
            write('timing', { phase: 'suggestions', ms: Date.now() - totalStart, attempt });
            write('diagnostic_result', { task: 'suggestions', inputTokens: result.diagnostics.inputTokens, outputTokens: result.diagnostics.outputTokens, totalMs: Date.now() - totalStart, attempt });
            return;
          }

          // If only 1 suggestion on first attempt, retry
          if (attempt === 1 && suggestions.length < 2) {
            write('timing', { phase: 'suggestions_retry', ms: result.latencyMs, reason: `only ${suggestions.length} valid` });
            continue;
          }

          // Second attempt: accept whatever we got
          if (suggestions.length >= 1) {
            write('suggestions_complete', { responses: suggestions, timing: Date.now() - totalStart, retried: true });
          } else {
            write('suggestions_complete', { responses: [{ strategy: 'Info', message: UNAVAILABLE_MSG }], timing: Date.now() - totalStart, retried: true });
          }
          write('timing', { phase: 'suggestions', ms: Date.now() - totalStart, attempt });
          write('diagnostic_result', { task: 'suggestions', inputTokens: result.diagnostics.inputTokens, outputTokens: result.diagnostics.outputTokens, totalMs: Date.now() - totalStart, attempt });
          return;

        } catch (err: any) {
          if (attempt === 1) {
            write('timing', { phase: 'suggestions_retry', ms: Date.now() - totalStart, reason: err.message });
            continue;
          }
          write('suggestions_complete', { responses: [{ strategy: 'Info', message: UNAVAILABLE_MSG }], timing: Date.now() - totalStart, retried: true });
          write('error', { tier: 'suggestions', message: err.message, attempt });
          return;
        }
      }
    })();

    // ── Task 2: Cards with 1 retry ───────────────────────────────────────
    const task2 = (async () => {
      const totalStart = Date.now();
      let attempt = 0;

      for (attempt = 1; attempt <= 2; attempt++) {
        try {
          const result = await groqComplete(cardParams, env);
          const cardData = parseCards(result);

          if (cardData && (cardData.approach || cardData.connections || cardData.cautionary)) {
            write('cards', { coaching: cleanDashesDeep(cardData), timing: Date.now() - totalStart, retried: attempt > 1 });
            write('timing', { phase: 'cards', ms: Date.now() - totalStart, attempt });
            write('diagnostic_result', { task: 'cards', inputTokens: result.diagnostics.inputTokens, outputTokens: result.diagnostics.outputTokens, totalMs: Date.now() - totalStart, attempt });
            return;
          }

          if (attempt === 1) {
            write('timing', { phase: 'cards_retry', ms: result.latencyMs, reason: 'parse failed', contentLength: (result.content || '').length });
            continue;
          }

          // Second attempt still failed
          write('error', { tier: 'cards', message: 'Parse failed after retry', raw: (result.content || '').slice(0, 200) });
          write('timing', { phase: 'cards', ms: Date.now() - totalStart, attempt });
          write('diagnostic_result', { task: 'cards', inputTokens: result.diagnostics.inputTokens, outputTokens: result.diagnostics.outputTokens, totalMs: Date.now() - totalStart, attempt });
          return;

        } catch (err: any) {
          if (attempt === 1) {
            write('timing', { phase: 'cards_retry', ms: Date.now() - totalStart, reason: err.message });
            continue;
          }
          write('error', { tier: 'cards', message: err.message, attempt });
          return;
        }
      }
    })();

    const task3 = groqComplete(
      { system: knowledgePrompt.system, user: knowledgePrompt.user, maxTokens: 700, stream: false, model: MODELS.FULL },
      env
    ).then(result => {
      if (result.parsed) {
        write('context', { knowledge: cleanDashesDeep(result.parsed), timing: result.latencyMs });
      } else {
        write('error', { tier: 'knowledge', message: 'Parse failed', raw: result.content?.slice(0, 300) });
      }
      write('timing', { phase: 'knowledge', ms: result.latencyMs });
      write('diagnostic_result', {
        task: 'knowledge',
        inputTokens: result.diagnostics.inputTokens,
        outputTokens: result.diagnostics.outputTokens,
        totalMs: result.diagnostics.totalMs,
      });
    }).catch(err => {
      write('error', { tier: 'knowledge', message: err.message });
    });

    // Wait for all 3 to complete
    await Promise.allSettled([task1, task2, task3]);

    // ── STEP 6: Done ───────────────────────────────────────────────────
    write('timing', { phase: 'total', ms: Date.now() - pipelineStart });
    write('done', {});

    await writer.close();
}
