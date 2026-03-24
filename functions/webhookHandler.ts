import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { google } from 'npm:googleapis@134.0.0';

const processedMessageIds = new Set();

// =====================================================
// AUTH
// =====================================================
function formatServiceAccountKey() {
    let serviceAccountKey = Deno.env.get('SERVICE_ACCOUNT_KEY');
    if (!serviceAccountKey) throw new Error('Missing SERVICE_ACCOUNT_KEY');

    let keyContent = serviceAccountKey;
    if (keyContent.includes('\\n')) {
        keyContent = keyContent.replace(/\\n/g, '\n');
    }
    const beginMarker = '-----BEGIN PRIVATE KEY-----';
    const endMarker = '-----END PRIVATE KEY-----';
    let base64Content = keyContent;
    if (keyContent.includes(beginMarker) && keyContent.includes(endMarker)) {
        const startIdx = keyContent.indexOf(beginMarker) + beginMarker.length;
        const endIdx = keyContent.indexOf(endMarker);
        base64Content = keyContent.substring(startIdx, endIdx);
    }
    base64Content = base64Content.replace(/\s/g, '');
    const chunks = [];
    for (let i = 0; i < base64Content.length; i += 64) {
        chunks.push(base64Content.substring(i, i + 64));
    }
    return beginMarker + '\n' + chunks.join('\n') + '\n' + endMarker;
}

function getMeetAuth() {
    const serviceAccountEmail = Deno.env.get('SERVICE_ACCOUNT_EMAIL');
    const hostUser = Deno.env.get('MEET_HOST_USER');
    if (!serviceAccountEmail || !hostUser) throw new Error('Missing SERVICE_ACCOUNT_EMAIL or MEET_HOST_USER');

    return new google.auth.JWT({
        email: serviceAccountEmail,
        key: formatServiceAccountKey(),
        scopes: [
            'https://www.googleapis.com/auth/meetings.space.readonly',
            'https://www.googleapis.com/auth/meetings.space.created',
            'https://www.googleapis.com/auth/drive.readonly'
        ],
        subject: hostUser
    });
}

function getDriveAuth() {
    const serviceAccountEmail = Deno.env.get('SERVICE_ACCOUNT_EMAIL');
    const hostUser = Deno.env.get('MEET_HOST_USER');
    if (!serviceAccountEmail || !hostUser) throw new Error('Missing SERVICE_ACCOUNT_EMAIL or MEET_HOST_USER');

    return new google.auth.JWT({
        email: serviceAccountEmail,
        key: formatServiceAccountKey(),
        scopes: ['https://www.googleapis.com/auth/drive'],
        subject: hostUser
    });
}

// =====================================================
// EVENT PARSING
// =====================================================
function resolveEventType(req, rawBody) {
    const ceType = req.headers.get('ce-type');
    if (ceType) return ceType;
    if (rawBody.type && typeof rawBody.type === 'string' && rawBody.type.includes('google.workspace')) return rawBody.type;
    if (rawBody.eventType) return rawBody.eventType;
    if (rawBody.message?.attributes) {
        const attrType = rawBody.message.attributes['ce-type'] || rawBody.message.attributes['type'];
        if (attrType) return attrType;
    }
    if (rawBody.recording) return 'google.workspace.meet.recording.v2.fileGenerated';
    if (rawBody.transcript) return 'google.workspace.meet.transcript.v2.fileGenerated';
    if (rawBody.conferenceRecord) return 'google.workspace.meet.conference.v2.ambiguous';
    return null;
}

function extractEventData(rawBody) {
    if (rawBody.message && rawBody.message.data) {
        try {
            const decoded = atob(rawBody.message.data);
            return { data: JSON.parse(decoded), messageId: rawBody.message.messageId };
        } catch (e) {
            return { data: rawBody, messageId: rawBody.message?.messageId };
        }
    }
    if (rawBody.data && rawBody.specversion) {
        return { data: rawBody.data, messageId: rawBody.id };
    }
    return { data: rawBody, messageId: null };
}

// =====================================================
// SPACE RESOLUTION
// =====================================================
async function resolveSpaceName(eventData, meetAuth) {
    if (eventData.space?.name) return eventData.space.name;
    if (eventData.conferenceRecord?.space) return eventData.conferenceRecord.space;

    let conferenceRecordName = null;
    if (eventData.conferenceRecord?.name) conferenceRecordName = eventData.conferenceRecord.name;
    if (eventData.recording?.name) {
        const match = eventData.recording.name.match(/(conferenceRecords\/[^/]+)/);
        if (match) conferenceRecordName = match[1];
    }
    if (eventData.transcript?.name) {
        const match = eventData.transcript.name.match(/(conferenceRecords\/[^/]+)/);
        if (match) conferenceRecordName = match[1];
    }

    if (conferenceRecordName) {
        console.log('Looking up space from:', conferenceRecordName);
        try {
            const accessToken = await meetAuth.getAccessToken();
            const crResponse = await fetch(`https://meet.googleapis.com/v2/${conferenceRecordName}`, {
                headers: { 'Authorization': `Bearer ${accessToken.token}` }
            });
            if (crResponse.ok) {
                const crData = await crResponse.json();
                return crData.space || null;
            }
        } catch (e) {
            console.error('ConferenceRecord lookup error:', e.message);
        }
    }
    return null;
}

async function getConferenceState(conferenceRecordName, meetAuth) {
    try {
        const accessToken = await meetAuth.getAccessToken();
        const response = await fetch(`https://meet.googleapis.com/v2/${conferenceRecordName}`, {
            headers: { 'Authorization': `Bearer ${accessToken.token}` }
        });
        if (response.ok) {
            const data = await response.json();
            return data.endTime ? 'ended' : 'started';
        }
    } catch (e) {
        console.error('Conference state error:', e.message);
    }
    return 'unknown';
}

// =====================================================
// DRIVE HELPERS
// =====================================================
async function shareFileWithCoach(driveClient, fileId, coachEmail) {
    try {
        await driveClient.permissions.create({
            fileId,
            requestBody: { type: 'user', role: 'reader', emailAddress: coachEmail },
            sendNotificationEmail: false
        });
        console.log('✓ Shared', fileId, 'with', coachEmail);
    } catch (e) {
        console.error('Share failed for', fileId, ':', e.message);
    }
}

async function fetchDocPlainText(driveClient, docId) {
    const textResponse = await driveClient.files.export({ fileId: docId, mimeType: 'text/plain' });
    return textResponse.data;
}

// =====================================================
// AI ANALYSIS — Enhanced health coaching summary
// =====================================================
async function analyzeSession(base44, notesText, transcriptText, sessionTitle, contactName) {
    try {
        let contentToAnalyze = '';
        let analysisSource = '';

        if (notesText && transcriptText) {
            contentToAnalyze = `GEMINI MEETING NOTES:\n${notesText}\n\nFULL TRANSCRIPT:\n${transcriptText}`;
            analysisSource = 'merged';
        } else if (notesText) {
            contentToAnalyze = `GEMINI MEETING NOTES:\n${notesText}`;
            analysisSource = 'gemini_notes';
        } else if (transcriptText) {
            contentToAnalyze = `FULL TRANSCRIPT:\n${transcriptText}`;
            analysisSource = 'transcript';
        } else {
            return null;
        }

        const prompt = `You are an expert health coaching analyst reviewing a coaching session between a health coach and their client${contactName ? ` (${contactName})` : ''}.

SESSION: "${sessionTitle || 'Coaching Session'}"

CONTENT TO ANALYZE:
${contentToAnalyze}

Provide a comprehensive analysis of this health coaching session. Be specific, insightful, and actionable. Use the client's actual words and situations when possible. Do NOT be generic — every point should directly reference something discussed in the session.

Return a JSON object with the following structure:

{
  "overview": "A 2-3 sentence executive summary of the session — what was the main focus, what was accomplished, and the overall tone/energy of the session.",
  
  "key_topics": ["List the 3-5 main topics/themes discussed in the session"],
  
  "client_goals": [
    {
      "goal": "Specific goal discussed",
      "status": "new | in_progress | achieved | struggling",
      "notes": "Context about this goal from the session"
    }
  ],
  
  "progress_indicators": [
    {
      "area": "Area of progress or concern",
      "direction": "positive | negative | neutral",
      "detail": "What specifically indicates this progress or concern"
    }
  ],
  
  "action_items": [
    {
      "title": "Specific action to take",
      "assignee": "coach | client",
      "priority": "high | medium | low",
      "due_context": "When this should be done (e.g., 'before next session', 'this week', 'daily')",
      "category": "nutrition | exercise | mindset | sleep | stress | habits | medical | other"
    }
  ],
  
  "coaching_observations": {
    "client_engagement": "How engaged was the client? What signs of motivation or resistance were present?",
    "breakthroughs": "Any aha moments, mindset shifts, or notable realizations during the session?",
    "concerns": "Any red flags, health risks, or areas needing professional referral?"
  },
  
  "follow_up": {
    "recommended_focus": "What should the next session primarily focus on?",
    "questions_to_explore": ["Questions the coach should ask in the next session"],
    "resources_to_share": ["Any articles, tools, or exercises that might help the client"]
  },
  
  "session_metrics": {
    "dominant_topics": ["Top 2-3 topics by time spent"],
    "client_talk_ratio": "Estimate: mostly client | balanced | mostly coach",
    "emotional_tone": "Overall emotional tone of the session (e.g., optimistic, frustrated, motivated, anxious)"
  }
}

Be thorough and specific. Every observation should be grounded in what was actually said during the session. If the content is too brief for a detailed analysis, still fill in what you can and note the limitations.

Respond with valid JSON only — no markdown, no backticks, no explanation.`;

        const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: prompt,
            response_json_schema: {
                type: "object",
                properties: {
                    overview: { type: "string" },
                    key_topics: { type: "array", items: { type: "string" } },
                    client_goals: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                goal: { type: "string" },
                                status: { type: "string" },
                                notes: { type: "string" }
                            },
                            required: ["goal", "status"]
                        }
                    },
                    progress_indicators: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                area: { type: "string" },
                                direction: { type: "string" },
                                detail: { type: "string" }
                            },
                            required: ["area", "direction"]
                        }
                    },
                    action_items: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                title: { type: "string" },
                                assignee: { type: "string" },
                                priority: { type: "string" },
                                due_context: { type: "string" },
                                category: { type: "string" }
                            },
                            required: ["title", "assignee", "priority"]
                        }
                    },
                    coaching_observations: {
                        type: "object",
                        properties: {
                            client_engagement: { type: "string" },
                            breakthroughs: { type: "string" },
                            concerns: { type: "string" }
                        }
                    },
                    follow_up: {
                        type: "object",
                        properties: {
                            recommended_focus: { type: "string" },
                            questions_to_explore: { type: "array", items: { type: "string" } },
                            resources_to_share: { type: "array", items: { type: "string" } }
                        }
                    },
                    session_metrics: {
                        type: "object",
                        properties: {
                            dominant_topics: { type: "array", items: { type: "string" } },
                            client_talk_ratio: { type: "string" },
                            emotional_tone: { type: "string" }
                        }
                    }
                },
                required: ["overview", "key_topics", "client_goals", "action_items", "coaching_observations", "follow_up", "session_metrics"]
            }
        });

        return { analysis: response, analysisSource };
    } catch (error) {
        console.error('Analysis error:', error.message || error);
        return null;
    }
}

// =====================================================
// MAIN HANDLER
// =====================================================
Deno.serve(async (req) => {
    try {
        console.log('=== Workspace Events Webhook v6 ===');

        const base44 = createClientFromRequest(req);
        const rawBody = await req.json();

        console.log('Body keys:', Object.keys(rawBody));

        const eventType = resolveEventType(req, rawBody);
        console.log('Resolved event type:', eventType);

        if (!eventType) {
            console.log('No event type. Body:', JSON.stringify(rawBody).substring(0, 500));
            return Response.json({ success: false, error: 'No event type' });
        }

        const { data: eventData, messageId } = extractEventData(rawBody);

        const ceId = req.headers.get('ce-id');
        const dedupeKey = ceId || messageId || JSON.stringify(rawBody).substring(0, 300);
        if (processedMessageIds.has(dedupeKey)) {
            console.log('Duplicate, skipping');
            return Response.json({ success: true, message: 'Duplicate' });
        }
        processedMessageIds.add(dedupeKey);
        if (processedMessageIds.size > 1000) {
            const oldest = processedMessageIds.values().next().value;
            processedMessageIds.delete(oldest);
        }

        const meetAuth = getMeetAuth();
        let driveClient = null;
        try {
            const driveAuth = getDriveAuth();
            driveClient = google.drive({ version: 'v3', auth: driveAuth });
        } catch (e) {
            console.error('Drive auth failed:', e.message);
        }

        const spaceName = await resolveSpaceName(eventData, meetAuth);

        if (!spaceName) {
            console.log('Could not resolve space');
            return Response.json({ success: true, message: 'No space resolved' });
        }

        console.log('Space:', spaceName);

        const sessions = await base44.asServiceRole.entities.Session.filter({ meet_space_name: spaceName });

        if (sessions.length === 0) {
            console.log('No session for space:', spaceName);
            return Response.json({ success: true, message: 'No session found' });
        }

        const session = sessions[0];
        console.log('Session:', session.id, '-', session.title, '- status:', session.status);

        // Fetch contact name for better AI analysis
        let contactName = null;
        try {
            if (session.contact_id) {
                const contact = await base44.asServiceRole.entities.Contact.get(session.contact_id);
                contactName = contact?.full_name || contact?.name || null;
            }
        } catch (e) {
            // Non-critical
        }

        // =====================================================
        // HANDLE: Conference Started
        // =====================================================
        if (eventType.includes('conference') && eventType.includes('started')) {
            console.log('→ conference.started');
            await base44.asServiceRole.entities.Session.update(session.id, { status: 'live' });
            console.log('✓ Session → live');
        }

        // =====================================================
        // HANDLE: Conference Ended
        // =====================================================
        else if (eventType.includes('conference') && eventType.includes('ended')) {
            console.log('→ conference.ended');
            await base44.asServiceRole.entities.Session.update(session.id, {
                status: 'completed',
                ended_at: new Date().toISOString()
            });
            console.log('✓ Session → completed');
        }

        // =====================================================
        // HANDLE: Ambiguous conference event
        // =====================================================
        else if (eventType.includes('ambiguous')) {
            console.log('→ ambiguous conference event');
            const crName = eventData.conferenceRecord?.name;
            if (crName) {
                const state = await getConferenceState(crName, meetAuth);
                if (state === 'ended') {
                    await base44.asServiceRole.entities.Session.update(session.id, {
                        status: 'completed',
                        ended_at: new Date().toISOString()
                    });
                    console.log('✓ Session → completed (from ambiguous)');
                } else if (state === 'started') {
                    await base44.asServiceRole.entities.Session.update(session.id, { status: 'live' });
                    console.log('✓ Session → live (from ambiguous)');
                }
            }
        }

        // =====================================================
        // HANDLE: Recording File Generated
        // =====================================================
        else if (eventType.includes('recording') && eventType.includes('fileGenerated')) {
            console.log('→ recording.fileGenerated');

            let fileId = eventData.recording?.driveDestination?.file;

            if (!fileId && eventData.recording?.name) {
                try {
                    const accessToken = await meetAuth.getAccessToken();
                    const recResponse = await fetch(`https://meet.googleapis.com/v2/${eventData.recording.name}`, {
                        headers: { 'Authorization': `Bearer ${accessToken.token}` }
                    });
                    if (recResponse.ok) {
                        const recData = await recResponse.json();
                        fileId = recData.driveDestination?.file;
                    }
                } catch (e) {
                    console.error('Recording fetch error:', e.message);
                }
            }

            if (fileId) {
                await base44.asServiceRole.entities.Session.update(session.id, {
                    recording_file_id: fileId,
                    recording_generated_at: new Date().toISOString(),
                    status: 'completed'
                });
                console.log('✓ Recording saved:', fileId);

                if (driveClient && session.coach_email) {
                    await shareFileWithCoach(driveClient, fileId, session.coach_email);
                }
            }
        }

        // =====================================================
        // HANDLE: Transcript File Generated
        // =====================================================
        else if (eventType.includes('transcript') && eventType.includes('fileGenerated')) {
            console.log('→ transcript.fileGenerated');

            let docId = eventData.transcript?.docsDestination?.document;

            if (!docId && eventData.transcript?.name) {
                try {
                    const accessToken = await meetAuth.getAccessToken();
                    const trResponse = await fetch(`https://meet.googleapis.com/v2/${eventData.transcript.name}`, {
                        headers: { 'Authorization': `Bearer ${accessToken.token}` }
                    });
                    if (trResponse.ok) {
                        const trData = await trResponse.json();
                        docId = trData.docsDestination?.document;
                    }
                } catch (e) {
                    console.error('Transcript fetch error:', e.message);
                }
            }

            if (docId) {
                // Save transcript + mark completed FIRST
                await base44.asServiceRole.entities.Session.update(session.id, {
                    transcript_doc_id: docId,
                    transcript_generated_at: new Date().toISOString(),
                    status: 'completed',
                    ended_at: session.ended_at || new Date().toISOString()
                });
                console.log('✓ Transcript saved:', docId);

                if (driveClient && session.coach_email) {
                    await shareFileWithCoach(driveClient, docId, session.coach_email);
                }

                // AI Analysis (non-blocking — failure doesn't affect status)
                if (driveClient) {
                    try {
                        console.log('Fetching transcript for AI analysis...');
                        const transcriptText = await fetchDocPlainText(driveClient, docId);
                        let notesText = null;

                        if (session.gemini_notes_doc_id) {
                            try {
                                notesText = await fetchDocPlainText(driveClient, session.gemini_notes_doc_id);
                                if (session.coach_email) {
                                    await shareFileWithCoach(driveClient, session.gemini_notes_doc_id, session.coach_email);
                                }
                            } catch (e) {}
                        }

                        console.log('Running AI analysis...');
                        const result = await analyzeSession(base44, notesText, transcriptText, session.title, contactName);

                        if (result) {
                            await base44.asServiceRole.entities.Session.update(session.id, {
                                summary: JSON.stringify(result.analysis),
                                summary_source: result.analysisSource
                            });
                            console.log('✓ AI analysis saved');

                            // Create tasks from action items
                            if (result.analysis.action_items?.length > 0) {
                                for (const item of result.analysis.action_items) {
                                    try {
                                        await base44.asServiceRole.entities.Task.create({
                                            session_id: session.id,
                                            contact_id: session.contact_id || '',
                                            title: item.title,
                                            status: 'open',
                                            priority: item.priority || 'medium',
                                            category: item.category || 'other',
                                            assigned_to: item.assignee || 'client',
                                            due_context: item.due_context || ''
                                        });
                                    } catch (taskErr) {
                                        console.error('Task creation error:', taskErr.message);
                                    }
                                }
                                console.log('✓ Created', result.analysis.action_items.length, 'tasks');
                            }
                        }
                    } catch (analysisError) {
                        console.error('Analysis error (non-fatal):', analysisError.message);
                    }
                }
            }
        }

        else {
            console.log('Unhandled event type:', eventType);
        }

        return Response.json({ success: true, eventType, spaceName, sessionId: session.id });

    } catch (error) {
        console.error('=== Webhook Error ===');
        console.error(error.message);
        return Response.json({ error: error.message }, { status: 200 });
    }
});