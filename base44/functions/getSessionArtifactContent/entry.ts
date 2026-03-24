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

    const auth = new google.auth.JWT({
        email: serviceAccountEmail,
        key: serviceAccountKey,
        scopes: ['https://www.googleapis.com/auth/drive'],
        subject: hostUser
    });

    return auth;
}

function cleanContent(text) {
    if (!text) return '';
    return text
        .replace(/You should review Gemini's notes to make sure they're accurate[^\n]*/gi, '')
        .replace(/Get tips and learn how Gemini takes notes[^\n]*/gi, '')
        .replace(/Please provide feedback about using Gemini to take notes in a short survey[^\n]*/gi, '')
        .replace(/This editable transcript was computer generated and might contain errors[^\n]*/gi, '')
        .replace(/People can also change the text after it was created[^\n]*/gi, '')
        .replace(/Learn more about Gemini[^\n]*/gi, '')
        .replace(/Give feedback about Gemini[^\n]*/gi, '')
        .replace(/Meeting records[^\n]*/gi, '')
        .replace(/https:\/\/docs\.google\.com[^\s]*/gi, '')
        .replace(/https:\/\/drive\.google\.com[^\s]*/gi, '')
        .replace(/https:\/\/support\.google\.com[^\s]*/gi, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function extractNotesAndTranscript(plainText) {
    const lines = plainText.split('\n');

    // Google Meet Gemini Notes doc structure:
    // [header: 📝 Notes, date, meeting title]
    // Summary
    // [summary paragraph]
    // Details
    // * bullet (timestamp)
    // * bullet (timestamp)
    // [blank]
    // [ACTUAL TRANSCRIPT STARTS HERE]
    // Speaker Name
    // 0:00
    // spoken text
    // Speaker Name
    // 0:05
    // spoken text ...

    // The raw per-speaker transcript starts after the Details section.
    // We detect it by finding a standalone timestamp line (e.g. "0:00" or "0:05:30")
    // that is preceded by a non-bullet, non-header speaker name line.
    const isStandaloneTimestamp = (s) => /^\d{1,2}:\d{2}(:\d{2})?$/.test(s.trim());
    const isBulletLine = (s) => /^\*\s/.test(s.trim());

    // Find the first standalone timestamp that is NOT inside a bullet point
    let transcriptStartIdx = -1;
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (isStandaloneTimestamp(line)) {
            // Make sure the previous non-empty line is a speaker name (not a bullet)
            let prevIdx = i - 1;
            while (prevIdx >= 0 && !lines[prevIdx].trim()) prevIdx--;
            if (prevIdx >= 0 && !isBulletLine(lines[prevIdx]) && lines[prevIdx].trim().length > 0) {
                // This looks like a real speaker/timestamp pair — start of transcript
                transcriptStartIdx = Math.max(0, prevIdx);
                break;
            }
        }
    }

    // Find the Summary section for notes
    let summaryIdx = -1;
    for (let i = 0; i < lines.length; i++) {
        const l = lines[i].trim().toLowerCase();
        if (l === 'summary' || l === 'summary:') { summaryIdx = i; break; }
    }

    const notesEndIdx = transcriptStartIdx !== -1 ? transcriptStartIdx : lines.length;
    const notesText = summaryIdx !== -1
        ? cleanContent(lines.slice(summaryIdx, notesEndIdx).join('\n'))
        : '';
    const transcriptText = transcriptStartIdx !== -1
        ? lines.slice(transcriptStartIdx).join('\n')  // keep raw, normalizer handles cleanup
        : '';

    return { notesText, transcriptText };
}

Deno.serve(async (req) => {
    let session = null;
    try {
        console.log('=== Get Session Artifact Content ===');
        
        const base44 = createClientFromRequest(req);
        const { sessionId } = await req.json();

        if (!sessionId) {
            return Response.json({ error: 'Missing sessionId' }, { status: 400 });
        }

        session = await base44.asServiceRole.entities.Session.get(sessionId);
        if (!session) {
            return Response.json({ error: 'Session not found' }, { status: 404 });
        }

        const result = {
            transcript: '', notes: '', recordingEmbedUrl: null,
            hasTranscript: false, hasNotes: false, hasRecording: false, message: null
        };

        if (session.edited_transcript && session.edited_transcript.trim() !== '') {
            result.transcript = session.edited_transcript;
            result.hasTranscript = true;
        }

        const hasGeminiNotes = session.gemini_notes_doc_id && session.gemini_notes_doc_id.trim() !== '';
        const hasTranscriptDoc = session.transcript_doc_id && session.transcript_doc_id.trim() !== '';
        const hasRecording = session.recording_file_id && session.recording_file_id.trim() !== '';

        if (!hasGeminiNotes && !hasTranscriptDoc && !hasRecording) {
            result.message = 'No artifacts available';
            return Response.json(result);
        }

        const needsDriveFetch = hasGeminiNotes || (!result.hasTranscript && hasTranscriptDoc);

        if (needsDriveFetch) {
            try {
                const auth = await getImpersonatedAuth();
                const drive = google.drive({ version: 'v3', auth });

                if (hasGeminiNotes) {
                    try {
                        const response = await drive.files.export({ fileId: session.gemini_notes_doc_id, mimeType: 'text/plain' });
                        console.log('--- GEMINI NOTES RAW (first 2000) ---');
                        console.log(response.data.substring(0, 2000));
                        console.log('--- END ---');
                        const { notesText, transcriptText } = extractNotesAndTranscript(response.data);
                        if (notesText) { result.notes = notesText; result.hasNotes = true; }
                        if (transcriptText && !result.hasTranscript) { result.transcript = transcriptText; result.hasTranscript = true; }
                    } catch (e) {
                        console.error('Error fetching Gemini Notes:', e.message);
                    }
                }

                if (!result.hasTranscript && hasTranscriptDoc) {
                    try {
                        const response = await drive.files.export({ fileId: session.transcript_doc_id, mimeType: 'text/plain' });
                        const raw = response.data;
                        console.log('--- TRANSCRIPT DOC RAW (chars 0-2000) ---');
                        console.log(raw.substring(0, 2000));
                        console.log('--- END ---');
                        const { notesText, transcriptText } = extractNotesAndTranscript(raw);
                        console.log('--- EXTRACTED TRANSCRIPT (first 500) ---');
                        console.log(transcriptText.substring(0, 500));
                        console.log('--- END ---');
                        if (notesText && !result.hasNotes) { result.notes = notesText; result.hasNotes = true; }
                        if (transcriptText) { result.transcript = transcriptText; result.hasTranscript = true; }
                        else if (!transcriptText) { result.transcript = cleanContent(raw); result.hasTranscript = true; }
                    } catch (e) {
                        console.error('Error fetching transcript:', e.message);
                    }
                }
            } catch (authError) {
                console.error('Google Drive auth error:', authError.message);
            }
        }

        if (hasRecording) {
            // Ensure the recording file is shared with the coach's email
            // so the Drive embed doesn't prompt for Google sign-in
            const coachEmail = session.coach_email;
            if (coachEmail) {
                try {
                    const recordingAuth = await getImpersonatedAuth();
                    const recordingDrive = google.drive({ version: 'v3', auth: recordingAuth });
                    await recordingDrive.permissions.create({
                        fileId: session.recording_file_id,
                        requestBody: {
                            type: 'user',
                            role: 'reader',
                            emailAddress: coachEmail
                        },
                        sendNotificationEmail: false
                    });
                    console.log('Shared recording with coach:', coachEmail);
                } catch (permError) {
                    if (!permError.message?.includes('already has access')) {
                        console.error('Could not share recording with coach:', permError.message);
                    }
                }
            }
            result.recordingEmbedUrl = `https://drive.google.com/file/d/${session.recording_file_id}/preview`;
            result.hasRecording = true;
        }

        return Response.json(result);

    } catch (error) {
        console.error('=== Get Artifact Content Error ===');
        console.error('Error:', error.message);
        return Response.json({
            transcript: '', notes: '', recordingEmbedUrl: session?.recording_file_id ? `https://drive.google.com/file/d/${session.recording_file_id}/preview` : null,
            hasTranscript: false, hasNotes: false, hasRecording: !!session?.recording_file_id,
            message: 'Error fetching artifacts'
        });
    }
});