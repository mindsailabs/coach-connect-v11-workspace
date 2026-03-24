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
        'https://www.googleapis.com/auth/meetings.space.readonly',
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

async function shareFileWithCoach(drive, fileId, coachEmail) {
    try {
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                type: 'user',
                role: 'reader',
                emailAddress: coachEmail
            },
            sendNotificationEmail: false
        });
        console.log('Shared file', fileId, 'with coach:', coachEmail);
    } catch (e) {
        if (e.message && e.message.includes('already has access')) {
            console.log('File already shared with coach');
        } else {
            console.error('Failed to share file with coach:', e.message);
        }
    }
}

Deno.serve(async (req) => {
    try {
        console.log('=== Backfill Session Artifacts ===');
        
        const base44 = createClientFromRequest(req);
        const { sessionId } = await req.json();

        if (!sessionId) {
            return Response.json({ error: 'Missing sessionId' }, { status: 400 });
        }

        const session = await base44.asServiceRole.entities.Session.get(sessionId);
        if (!session) {
            return Response.json({ error: 'Session not found' }, { status: 404 });
        }

        // Use service account impersonating MEET_HOST_USER to access their Drive
        const auth = await getImpersonatedAuth();
        const drive = google.drive({ version: 'v3', auth });
        console.log('Using service account to search MEET_HOST_USER Drive');

        console.log('Session fields:', JSON.stringify({ meet_link: session.meet_link, meet_join_link: session.meet_join_link, meet_space_name: session.meet_space_name, id: session.id, title: session.title, keys: Object.keys(session) }));
        const meetUrl = session.meet_link || session.meet_join_link || session.meetLink || session.meetJoinLink;
        let meetingCode = null;
        if (meetUrl) {
            try {
                const url = new URL(meetUrl);
                meetingCode = url.pathname.split('/').filter(p => p).pop();
            } catch (e) {}
        }

        // Fallback: try to get from meet_link field directly as string
        if (!meetingCode) {
            const allFields = JSON.stringify(session);
            const meetMatch = allFields.match(/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/);
            if (meetMatch) {
                meetingCode = meetMatch[1];
            }
        }

        if (!meetingCode) {
            return Response.json({ success: false, error: 'No meeting code available', debug: { meet_link: session.meet_link, meet_join_link: session.meet_join_link, meetUrl, keys: Object.keys(session).join(', ') } }, { status: 400 });
        }

        const updates = {};
        let foundAny = false;

        // Search for recording
        if (!session.recording_file_id) {
            try {
                let results = await drive.files.list({
                    q: `mimeType='video/mp4' and name contains '${meetingCode}'`,
                    orderBy: 'createdTime desc', pageSize: 1,
                    fields: 'files(id, name, createdTime)'
                });
                
                if ((!results.data.files || results.data.files.length === 0) && session.title) {
                    results = await drive.files.list({
                        q: `mimeType='video/mp4' and name contains '${session.title}'`,
                        orderBy: 'createdTime desc', pageSize: 1,
                        fields: 'files(id, name, createdTime)'
                    });
                }
                
                if (results.data.files?.length > 0) {
                    updates.recording_file_id = results.data.files[0].id;
                    updates.recording_generated_at = results.data.files[0].createdTime;
                    foundAny = true;
                    console.log('Found recording:', results.data.files[0].name);
                }
            } catch (e) { console.error('Recording search error:', e.message); }
        }

        // Search for transcript
        if (!session.transcript_doc_id) {
            try {
                let results = await drive.files.list({
                    q: `(mimeType='application/vnd.google-apps.document' or mimeType='text/vtt') and name contains '${meetingCode}'`,
                    orderBy: 'modifiedTime desc', pageSize: 1,
                    fields: 'files(id, name, modifiedTime)'
                });
                
                if ((!results.data.files || results.data.files.length === 0) && session.title) {
                    results = await drive.files.list({
                        q: `mimeType='application/vnd.google-apps.document' and name contains '${session.title}' and name contains 'Transcript'`,
                        orderBy: 'modifiedTime desc', pageSize: 1,
                        fields: 'files(id, name, modifiedTime)'
                    });
                }
                
                if (results.data.files?.length > 0) {
                    updates.transcript_doc_id = results.data.files[0].id;
                    updates.transcript_generated_at = results.data.files[0].modifiedTime;
                    foundAny = true;
                    console.log('Found transcript:', results.data.files[0].name);
                }
            } catch (e) { console.error('Transcript search error:', e.message); }
        }

        // Search for Gemini Notes
        if (!session.gemini_notes_doc_id) {
            console.log('Searching for Gemini Notes...');
            try {
                let results = null;
                if (session.title) {
                    results = await drive.files.list({
                        q: `mimeType='application/vnd.google-apps.document' and name contains '${session.title}' and name contains 'Notes by Gemini'`,
                        orderBy: 'modifiedTime desc', pageSize: 3,
                        fields: 'files(id, name, modifiedTime, createdTime)'
                    });
                    console.log('Gemini Notes search by title:', JSON.stringify(results.data.files || []));
                }
                
                if (!results?.data?.files?.length) {
                    results = await drive.files.list({
                        q: `mimeType='application/vnd.google-apps.document' and name contains 'Notes by Gemini'`,
                        orderBy: 'modifiedTime desc', pageSize: 5,
                        fields: 'files(id, name, modifiedTime, createdTime)'
                    });
                    console.log('Gemini Notes broad search:', JSON.stringify(results.data.files || []));
                }
                
                if (!results?.data?.files?.length) {
                    results = await drive.files.list({
                        q: `mimeType='application/vnd.google-apps.document' and name contains 'Meeting notes'`,
                        orderBy: 'modifiedTime desc', pageSize: 5,
                        fields: 'files(id, name, modifiedTime, createdTime)'
                    });
                    console.log('Gemini Notes "Meeting notes" search:', JSON.stringify(results.data.files || []));
                }

                if (results.data.files?.length > 0) {
                    const sessionTime = new Date(session.date_time || session.created_date);
                    let bestMatch = null;
                    let minTimeDiff = Infinity;
                    const TIME_WINDOW_MS = 24 * 60 * 60 * 1000;

                    for (const file of results.data.files) {
                        const fileTime = new Date(file.createdTime || file.modifiedTime);
                        const timeDiff = Math.abs(fileTime - sessionTime);
                        console.log(`Gemini Notes candidate: "${file.name}" created=${file.createdTime} diff=${Math.round(timeDiff/60000)}min`);
                        if (timeDiff < minTimeDiff && timeDiff < TIME_WINDOW_MS) {
                            minTimeDiff = timeDiff;
                            bestMatch = file;
                        }
                    }

                    if (bestMatch) {
                        console.log('Found Gemini Notes:', bestMatch.name);
                        updates.gemini_notes_doc_id = bestMatch.id;
                        updates.gemini_notes_generated_at = bestMatch.modifiedTime;
                        foundAny = true;
                    } else {
                        console.log('No Gemini Notes matched within time window');
                    }
                } else {
                    console.log('No Gemini Notes files found in any search');
                }
            } catch (e) { console.error('Gemini Notes search error:', e.message); }
        } else {
            console.log('Gemini Notes already set:', session.gemini_notes_doc_id);
        }

        if (foundAny) {
            await base44.asServiceRole.entities.Session.update(sessionId, updates);
        }

        // Share all artifact files with the coach's email so they can view them
        // without needing to request access each time
        const coachEmail = session.coach_email;
        if (coachEmail) {
            const sessionAfterUpdate = await base44.asServiceRole.entities.Session.get(sessionId);
            if (sessionAfterUpdate.recording_file_id) {
                await shareFileWithCoach(drive, sessionAfterUpdate.recording_file_id, coachEmail);
            }
            if (sessionAfterUpdate.transcript_doc_id) {
                await shareFileWithCoach(drive, sessionAfterUpdate.transcript_doc_id, coachEmail);
            }
            if (sessionAfterUpdate.gemini_notes_doc_id) {
                await shareFileWithCoach(drive, sessionAfterUpdate.gemini_notes_doc_id, coachEmail);
            }
        } else {
            console.warn('No coach_email on session — cannot share artifact files');
        }

        // Update status - set to completed if we have any artifact
        const updatedSession = await base44.asServiceRole.entities.Session.get(sessionId);
        const hasRecording = !!updatedSession.recording_file_id;
        const hasTranscriptOrNotes = !!updatedSession.transcript_doc_id || !!updatedSession.gemini_notes_doc_id;
        const hasAnyArtifact = hasRecording || hasTranscriptOrNotes;

        if (hasAnyArtifact) {
            await base44.asServiceRole.entities.Session.update(sessionId, {
                status: 'completed',
                ended_at: updatedSession.ended_at || new Date().toISOString()
            });
        }

        const finalSession = await base44.asServiceRole.entities.Session.get(sessionId);

        const debugInfo = {
            coachEmail: session.coach_email,
            searchingDrive: Deno.env.get('MEET_HOST_USER'),
            authMethod: 'service_account_impersonation',
            meetingCode,
            sharedWithCoach: !!coachEmail
        };

        return Response.json({
            success: true, sessionId, meetingCode, foundArtifacts: foundAny, updates,
            final_status: finalSession.status,
            debug: debugInfo
        });

    } catch (error) {
        console.error('=== Backfill Error ===');
        console.error('Error:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
});