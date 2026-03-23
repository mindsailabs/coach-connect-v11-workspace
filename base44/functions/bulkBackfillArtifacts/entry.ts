import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        console.log('=== Bulk Backfill Artifacts ===');
        
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all completed/processing/summary_ready Google Meet sessions missing artifacts
        const allSessions = await base44.asServiceRole.entities.Session.list('-date_time', 200);
        
        const candidates = allSessions.filter(s => {
            const isGoogleMeet = s.video_provider === 'google_meet' || 
                (s.meet_link || s.meet_join_link || s.meeting_link || '').includes('meet.google');
            const missingArtifacts = !s.recording_file_id && !s.transcript_doc_id && !s.gemini_notes_doc_id;
            const isPast = s.status === 'completed' || s.status === 'processing' || 
                           s.status === 'summary_ready' || s.status === 'live' ||
                           (s.date_time && new Date(s.date_time) < new Date());
            return isGoogleMeet && missingArtifacts && isPast;
        });

        console.log(`Found ${candidates.length} sessions to backfill`);

        const results = [];
        for (const session of candidates) {
            try {
                const res = await base44.asServiceRole.functions.invoke('backfillArtifacts', { sessionId: session.id });
                results.push({ 
                    sessionId: session.id, 
                    title: session.title,
                    success: res.success, 
                    foundArtifacts: res.foundArtifacts,
                    error: res.error || null
                });
                console.log(`Session ${session.id} (${session.title}): foundArtifacts=${res.foundArtifacts}`);
            } catch (e) {
                results.push({ sessionId: session.id, title: session.title, success: false, error: e.message });
                console.error(`Session ${session.id} failed:`, e.message);
            }
        }

        const found = results.filter(r => r.foundArtifacts).length;
        return Response.json({ 
            success: true, 
            total: candidates.length,
            artifactsFound: found,
            results 
        });

    } catch (error) {
        console.error('Bulk backfill error:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
});