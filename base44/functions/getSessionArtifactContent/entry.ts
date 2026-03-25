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
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
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

    // Detects standalone short timestamps: "0:00", "1:23", "0:00:00", "1:23:45"
    const isStandaloneTimestamp = (s) => /^\d{1,2}:\d{2}(:\d{2})?$/.test(s.trim());
    // Detects section-header timestamps (HH:MM:SS at start of a section): "00:00:00", "00:00:58"
    const isSectionTimestamp = (s) => /^\d{2}:\d{2}:\d{2}$/.test(s.trim());
    const isBulletLine = (s) => /^\*\s/.test(s.trim());
    const isSpeakerLine = (s) => /^[A-Za-z].+:\s*.+$/.test(s.trim()); // "Speaker: text"

    // --- Detect transcript format ---

    // Format C: Section-based — HH:MM:SS header, then multiple "Speaker: text" lines
    // e.g. "00:00:00\n \nMindsai Media: Yes.\nA S: Hello\n\n00:00:58\n \nA S: ..."
    // Detect by finding a line that is a section timestamp (HH:MM:SS) followed eventually by Speaker: text lines
    let formatCSectionStart = -1;
    for (let i = 0; i < lines.length; i++) {
        if (isSectionTimestamp(lines[i].trim())) {
            // Check that at least one of the next few lines is a speaker line
            for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
                if (isSpeakerLine(lines[j].trim())) {
                    formatCSectionStart = i;
                    break;
                }
            }
            if (formatCSectionStart !== -1) break;
        }
    }

    // Format B: Speaker name alone, then standalone timestamp, then text
    // Find the first standalone timestamp NOT inside a bullet point
    let formatBTranscriptStart = -1;
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (isStandaloneTimestamp(line)) {
            let prevIdx = i - 1;
            while (prevIdx >= 0 && !lines[prevIdx].trim()) prevIdx--;
            if (prevIdx >= 0 && !isBulletLine(lines[prevIdx]) && lines[prevIdx].trim().length > 0) {
                formatBTranscriptStart = Math.max(0, prevIdx);
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

    // Prefer Format C if detected
    let transcriptStartIdx = -1;
    if (formatCSectionStart !== -1) {
        transcriptStartIdx = formatCSectionStart;
    } else if (formatBTranscriptStart !== -1) {
        transcriptStartIdx = formatBTranscriptStart;
    }

    const notesEndIdx = transcriptStartIdx !== -1 ? transcriptStartIdx : lines.length;
    const notesText = summaryIdx !== -1
        ? cleanContent(lines.slice(summaryIdx, notesEndIdx).join('\n'))
        : '';
    const transcriptText = transcriptStartIdx !== -1
        ? lines.slice(transcriptStartIdx).join('\n')
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