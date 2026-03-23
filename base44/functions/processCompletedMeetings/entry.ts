import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function isValidDate(dateString) {
    if (!dateString) return false;
    return !isNaN(new Date(dateString).getTime());
}

Deno.serve(async (req) => {
    try {
        console.log('=== Process Completed Meetings ===');
        console.log('Execution time:', new Date().toISOString());
        
        const base44 = createClientFromRequest(req);
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

        const allSessions = await base44.asServiceRole.entities.Session.list();
        console.log(`Fetched ${allSessions.length} total sessions`);
        
        const sessionsToProcess = allSessions.filter(session => {
            if (session.status === 'completed' || session.status === 'cancelled') return false;

            let effectiveEndTime = null;
            if (session.ended_at && isValidDate(session.ended_at)) {
                effectiveEndTime = new Date(session.ended_at);
            } else if (session.scheduled_end_time && isValidDate(session.scheduled_end_time)) {
                effectiveEndTime = new Date(session.scheduled_end_time);
            } else {
                return false;
            }

            if (effectiveEndTime > tenMinutesAgo) return false;

            return !session.recording_file_id || !session.gemini_notes_doc_id;
        });

        console.log(`Found ${sessionsToProcess.length} sessions to process`);

        if (sessionsToProcess.length === 0) {
            return Response.json({ 
                success: true, message: 'No sessions need processing',
                totalSessionsChecked: allSessions.length, sessionsProcessed: 0
            });
        }

        const results = [];

        for (const session of sessionsToProcess) {
            try {
                const backfillResult = await base44.asServiceRole.functions.invoke('backfillArtifacts', {
                    sessionId: session.id
                });

                const result = {
                    sessionId: session.id, title: session.title,
                    success: backfillResult.data?.success || false,
                    foundArtifacts: backfillResult.data?.foundArtifacts || false,
                    final_status: backfillResult.data?.final_status || session.status,
                    ai_analysis_status: null
                };

                // Trigger AI analysis if session is now completed
                if (result.final_status === 'completed') {
                    try {
                        const analysisResult = await base44.asServiceRole.functions.invoke('generateSessionAnalysis', {
                            session_id: session.id
                        });
                        result.ai_analysis_status = analysisResult.data?.success ? 'success' : 'failed';
                    } catch (aiError) {
                        result.ai_analysis_status = 'error';
                        console.error('AI Analysis error:', aiError.message);
                    }
                }

                results.push(result);
            } catch (error) {
                console.error(`Error processing session ${session.id}:`, error.message);
                results.push({ sessionId: session.id, title: session.title, success: false, error: error.message });
            }
        }

        return Response.json({ 
            success: true,
            totalSessionsChecked: allSessions.length,
            sessionsProcessed: results.length,
            summary: {
                success: results.filter(r => r.success && r.foundArtifacts).length,
                pending: results.filter(r => r.success && !r.foundArtifacts).length,
                failed: results.filter(r => !r.success).length,
                ai_triggered: results.filter(r => r.ai_analysis_status === 'success').length
            },
            details: results
        });

    } catch (error) {
        console.error('=== Process Completed Meetings Error ===');
        console.error('Error:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
});