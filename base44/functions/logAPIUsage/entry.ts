import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const MODEL_PRICING = {
  'gpt-4o-mini': { input: 0.00000015, output: 0.0000006 },
  'gpt-4o': { input: 0.0000025, output: 0.00001 },
  'gpt-4-turbo': { input: 0.00001, output: 0.00003 }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      functionName, objectType = null, objectId = null, model,
      promptTokens, completionTokens, requestedBy,
      responseTime = null, success = true, errorMessage = null
    } = await req.json();

    const totalTokens = promptTokens + completionTokens;
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-4o-mini'];
    const estimatedCost = (promptTokens * pricing.input) + (completionTokens * pricing.output);

    const logEntry = await base44.asServiceRole.entities.APIUsageLog.create({
      functionName, objectType, objectId, model,
      promptTokens, completionTokens, totalTokens, estimatedCost,
      requestedBy, requestedAt: new Date().toISOString(),
      responseTime, success, errorMessage
    });

    return Response.json({ success: true, logEntry });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});