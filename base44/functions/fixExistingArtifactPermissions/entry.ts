import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { google } from 'npm:googleapis@134.0.0';

async function getImpersonatedAuth() {
    const serviceAccountEmail = Deno.env.get('SERVICE_ACCOUNT_EMAIL');
    let serviceAccountKey = Deno.env.get('SERVICE_ACCOUNT_KEY');
    const hostUser = Deno.env.get('MEET_HOST_USER');

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
    serviceAccountKey = beginMarker + '\n' + chunks.join('\n') + '\n' + endMarker;

    const scopes = [
        'https://www.googleapis.com/auth/drive'
    ];

    const auth = new google.auth.JWT({
        email: serviceAccountEmail,
        key: serviceAccountKey,
        scopes,
        subject: hostUser
    });

    return auth;
}

async function shareFileWithEmail(drive, fileId, email) {
    try {
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                type: 'user',
                role: 'reader',
                emailAddress: email
            },
            sendNotificationEmail: false
        });
        return { fileId, status: 'shared', email };
    } catch (e) {
        if (e.message && e.message.includes('already has access')) {
            return { fileId, status: 'already_shared', email };
        }
        return { fileId, status: 'error', error: e.message, email };
    }
}

Deno.serve(async (req) => {
    try {
        console.log('=== Fix Existing Artifact Permissions ===');

        const base44 = createClientFromRequest(req);
        const auth = await getImpersonatedAuth();
        const drive = google.drive({ version: 'v3', auth });

        // Fetch all sessions
        const sessions = await base44.asServiceRole.entities.Session.list();
        console.log(`Found ${sessions.length} total sessions`);

        let sessionsProcessed = 0;
        let sessionsWithArtifacts = 0;
        let filesShared = 0;
        let filesAlreadyShared = 0;
        let filesErrored = 0;
        let sessionsSkippedNoEmail = 0;
        const errors = [];
        const details = [];

        for (const session of sessions) {
            const hasRecording = session.recording_file_id && session.recording_file_id.trim() !== '';
            const hasTranscript = session.transcript_doc_id && session.transcript_doc_id.trim() !== '';
            const hasGeminiNotes = session.gemini_notes_doc_id && session.gemini_notes_doc_id.trim() !== '';

            if (!hasRecording && !hasTranscript && !hasGeminiNotes) {
                continue;
            }

            sessionsWithArtifacts++;
            const coachEmail = session.coach_email;

            if (!coachEmail) {
                sessionsSkippedNoEmail++;
                details.push({
                    sessionId: session.id,
                    title: session.title,
                    status: 'skipped',
                    reason: 'no coach_email on session'
                });
                continue;
            }

            sessionsProcessed++;
            const sessionResults = [];

            if (hasRecording) {
                const result = await shareFileWithEmail(drive, session.recording_file_id, coachEmail);
                sessionResults.push({ type: 'recording', ...result });
                if (result.status === 'shared') filesShared++;
                else if (result.status === 'already_shared') filesAlreadyShared++;
                else { filesErrored++; errors.push({ sessionId: session.id, ...result }); }
            }

            if (hasTranscript) {
                const result = await shareFileWithEmail(drive, session.transcript_doc_id, coachEmail);
                sessionResults.push({ type: 'transcript', ...result });
                if (result.status === 'shared') filesShared++;
                else if (result.status === 'already_shared') filesAlreadyShared++;
                else { filesErrored++; errors.push({ sessionId: session.id, ...result }); }
            }

            if (hasGeminiNotes) {
                const result = await shareFileWithEmail(drive, session.gemini_notes_doc_id, coachEmail);
                sessionResults.push({ type: 'gemini_notes', ...result });
                if (result.status === 'shared') filesShared++;
                else if (result.status === 'already_shared') filesAlreadyShared++;
                else { filesErrored++; errors.push({ sessionId: session.id, ...result }); }
            }

            details.push({
                sessionId: session.id,
                title: session.title,
                coachEmail,
                files: sessionResults
            });

            console.log(`Processed session ${session.id} (${session.title}): ${sessionResults.length} files`);
        }

        const summary = {
            totalSessions: sessions.length,
            sessionsWithArtifacts,
            sessionsProcessed,
            sessionsSkippedNoEmail,
            filesShared,
            filesAlreadyShared,
            filesErrored,
            totalFilesTouched: filesShared + filesAlreadyShared + filesErrored
        };

        console.log('=== Summary ===', JSON.stringify(summary));

        return Response.json({
            success: true,
            summary,
            errors: errors.length > 0 ? errors : undefined,
            details
        });

    } catch (error) {
        console.error('=== Fix Permissions Error ===');
        console.error('Error:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
