import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const session = await base44.asServiceRole.entities.Session.get("69aaad050e5904fcea0bbee9");
        
        const res = await base44.asServiceRole.functions.invoke('getSessionArtifactContent', { sessionId: session.id });
        
        return Response.json({ 
            transcript: res.data.transcript.substring(0, 2000)
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});