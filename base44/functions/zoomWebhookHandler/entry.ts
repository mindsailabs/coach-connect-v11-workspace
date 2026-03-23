import { createClientFromRequest, createClient } from 'npm:@base44/sdk@0.8.6';

// =====================================================
// AI ANALYSIS — same prompt as Google Meet handler
// =====================================================
async function analyzeSession(base44, transcriptText, sessionTitle, contactName) {
    const prompt = `You are an expert health coaching analyst reviewing a coaching session between a health coach and their client${contactName ? ` (${contactName})` : ''}.

SESSION: "${sessionTitle || 'Coaching Session'}"

CONTENT TO ANALYZE:
FULL TRANSCRIPT:
${transcriptText}

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

    return await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
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
}

// =====================================================
// FIND SESSION BY ZOOM MEETING ID
// =====================================================
async function findSessionByMeetingId(base44, meetingId) {
    // Try exact zoom_meeting_id match first
    const sessions = await base44.asServiceRole.entities.Session.filter({
        zoom_meeting_id: String(meetingId)
    });
    if (sessions.length > 0) return sessions[0];

    // Fallback: search by meeting join URL containing the meeting ID
    const allZoom = await base44.asServiceRole.entities.Session.filter({
        video_provider: 'zoom'
    });
    const byUrl = allZoom.find(s =>
        (s.meet_join_link || s.meet_link || s.meeting_link || '').includes(String(meetingId))
    );
    if (byUrl) {
        // Save the zoom_meeting_id so future lookups are fast
        await base44.asServiceRole.entities.Session.update(byUrl.id, {
            zoom_meeting_id: String(meetingId)
        });
        console.log('✓ Found session by URL fallback, saved zoom_meeting_id:', byUrl.id);
        return byUrl;
    }

    return null;
}

// =====================================================
// MAIN HANDLER
// =====================================================
Deno.serve(async (req) => {
    try {
        console.log('=== Zoom Webhook Handler ===');

        // Read body first (can only be consumed once)
        const rawBody = await req.text();

        // Zoom sends its own Authorization header (not Bearer format),
        // which causes createClientFromRequest to fail. Strip it before creating the client.
        const cleanHeaders = new Headers(req.headers);
        cleanHeaders.delete('authorization');
        const cleanReq = new Request(req.url, {
            method: req.method,
            headers: cleanHeaders,
        });
        const base44 = createClientFromRequest(cleanReq);
        let body;
        try {
            body = JSON.parse(rawBody);
        } catch (e) {
            return Response.json({ error: 'Invalid JSON' }, { status: 200 });
        }

        const event = body.event;
        console.log('Zoom event:', event);

        // =====================================================
        // 1. VERIFICATION CHALLENGE
        // =====================================================
        if (event === 'endpoint.url_validation') {
            const plainToken = body.payload?.plainToken;
            const secret = Deno.env.get('ZOOM_WEBHOOK_SECRET_TOKEN');

            const crypto = await import('node:crypto');
            const encryptedToken = crypto
                .createHmac('sha256', secret)
                .update(plainToken)
                .digest('hex');

            console.log('Responding to URL validation challenge');
            return Response.json({ plainToken, encryptedToken }, { status: 200 });
        }

        // =====================================================
        // WEBHOOK SIGNATURE VERIFICATION
        // =====================================================
        const secret = Deno.env.get('ZOOM_WEBHOOK_SECRET_TOKEN');
        const timestamp = req.headers.get('x-zm-request-timestamp');
        const signature = req.headers.get('x-zm-signature');

        if (secret && timestamp && signature) {
            const crypto = await import('node:crypto');
            const message = `v0:${timestamp}:${rawBody}`;
            const expectedSig = 'v0=' + crypto.createHmac('sha256', secret).update(message).digest('hex');

            if (signature !== expectedSig) {
                console.error('Webhook signature mismatch — rejecting request');
                return Response.json({ error: 'Invalid signature' }, { status: 200 });
            }
            console.log('✓ Webhook signature verified');
        } else {
            console.log('Warning: Missing signature headers — processing anyway');
        }

        // =====================================================
        // 2. MEETING STARTED
        // =====================================================
        if (event === 'meeting.started') {
            const meetingId = body.payload?.object?.id;
            console.log('meeting.started, id:', meetingId);

            const session = await findSessionByMeetingId(base44, meetingId);
            if (session) {
                await base44.asServiceRole.entities.Session.update(session.id, { status: 'live' });
                console.log('✓ Session → live:', session.id);
            } else {
                console.log('No session found for meeting:', meetingId);
            }

            return Response.json({ success: true }, { status: 200 });
        }

        // =====================================================
        // 3. MEETING ENDED
        // =====================================================
        if (event === 'meeting.ended') {
            const meetingId = body.payload?.object?.id;
            console.log('meeting.ended, id:', meetingId);

            const session = await findSessionByMeetingId(base44, meetingId);
            if (session) {
                await base44.asServiceRole.entities.Session.update(session.id, {
                    status: 'processing',
                    ended_at: new Date().toISOString()
                });
                console.log('✓ Session → processing:', session.id);
            } else {
                console.log('No session found for meeting:', meetingId);
            }

            return Response.json({ success: true }, { status: 200 });
        }

        // =====================================================
        // 4. RECORDING COMPLETED
        // =====================================================
        if (event === 'recording.completed') {
            const meetingId = body.payload?.object?.id;
            const recordingFiles = body.payload?.object?.recording_files || [];
            const recordingPassword = body.payload?.object?.password || '';
            console.log('recording.completed, id:', meetingId, 'files:', recordingFiles.length);
            console.log('Recording files detail:', JSON.stringify(recordingFiles.map(f => ({ file_type: f.file_type, recording_type: f.recording_type, status: f.status, file_extension: f.file_extension }))));

            const session = await findSessionByMeetingId(base44, meetingId);
            if (session) {
                // Find MP4 file (shared_screen_with_speaker_view or active_speaker)
                const mp4File = recordingFiles.find(f => f.file_type === 'MP4');
                // Find audio transcript file
                const transcriptFile = recordingFiles.find(f =>
                    f.recording_type === 'audio_transcript' || f.file_type === 'TRANSCRIPT' || f.file_type === 'VTT'
                );

                const updateData = {
                    recording_password: recordingPassword,
                    recording_generated_at: new Date().toISOString(),
                    status: 'completed',
                    ended_at: session.ended_at || new Date().toISOString()
                };

                if (mp4File?.download_url) {
                    updateData.recording_url = mp4File.download_url;
                    console.log('✓ MP4 recording URL saved');
                }

                if (transcriptFile?.download_url) {
                    updateData.transcript_url = transcriptFile.download_url;
                    updateData.transcript_generated_at = new Date().toISOString();
                    console.log('✓ Transcript URL saved from recording.completed');
                }

                await base44.asServiceRole.entities.Session.update(session.id, updateData);
                console.log('✓ Recording info saved for session:', session.id);

                // If transcript was included in recording.completed, try to fetch and analyze
                if (transcriptFile?.download_url) {
                    await fetchTranscriptAndAnalyze(base44, session, transcriptFile.download_url);
                }
            } else {
                console.log('No session found for meeting:', meetingId);
            }

            return Response.json({ success: true }, { status: 200 });
        }

        // =====================================================
        // 5. TRANSCRIPT COMPLETED
        // =====================================================
        if (event === 'recording.transcript_completed') {
            const meetingId = body.payload?.object?.id;
            const recordingFiles = body.payload?.object?.recording_files || [];
            console.log('recording.transcript_completed, id:', meetingId, 'files:', recordingFiles.length);
            console.log('Transcript files detail:', JSON.stringify(recordingFiles.map(f => ({ file_type: f.file_type, recording_type: f.recording_type, status: f.status, file_extension: f.file_extension }))));

            const session = await findSessionByMeetingId(base44, meetingId);
            if (!session) {
                console.log('No session found for meeting:', meetingId);
                return Response.json({ success: true }, { status: 200 });
            }

            // Find transcript file — Zoom uses recording_type "audio_transcript" and file_type "TRANSCRIPT" or "VTT"
            const transcriptFile = recordingFiles.find(f =>
                f.recording_type === 'audio_transcript' || f.file_type === 'TRANSCRIPT' || f.file_type === 'VTT'
            );

            if (transcriptFile?.download_url) {
                await base44.asServiceRole.entities.Session.update(session.id, {
                    transcript_url: transcriptFile.download_url,
                    transcript_generated_at: new Date().toISOString()
                });
                console.log('✓ Transcript URL saved');

                await fetchTranscriptAndAnalyze(base44, session, transcriptFile.download_url);
            } else {
                console.log('No transcript file found in recording_files');
            }

            return Response.json({ success: true }, { status: 200 });
        }

        // Unknown event — always return 200
        console.log('Unhandled Zoom event:', event);
        return Response.json({ success: true, message: 'Unhandled event' }, { status: 200 });

    } catch (error) {
        console.error('=== Zoom Webhook Error ===');
        console.error(error.message);
        // Always return 200 to prevent Zoom retries
        return Response.json({ error: error.message }, { status: 200 });
    }
});

// =====================================================
// HELPER: Fetch transcript and run AI analysis
// =====================================================
async function fetchTranscriptAndAnalyze(base44, session, downloadUrl) {
    let transcriptText = null;

    try {
        if (session.coach_email) {
            const users = await base44.asServiceRole.entities.User.filter({ email: session.coach_email });
            const coach = users[0];

            if (coach?.zoom_access_token) {
                let accessToken = coach.zoom_access_token;

                // Refresh token if expired
                if (coach.zoom_token_expiry && new Date(coach.zoom_token_expiry) <= new Date()) {
                    console.log('Coach Zoom token expired, refreshing...');
                    const clientId = Deno.env.get('ZOOM_CLIENT_ID');
                    const clientSecret = Deno.env.get('ZOOM_CLIENT_SECRET');
                    const credentials = btoa(`${clientId}:${clientSecret}`);

                    const refreshResp = await fetch('https://zoom.us/oauth/token', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Authorization': `Basic ${credentials}`
                        },
                        body: new URLSearchParams({
                            grant_type: 'refresh_token',
                            refresh_token: coach.zoom_refresh_token
                        })
                    });

                    if (refreshResp.ok) {
                        const refreshData = await refreshResp.json();
                        accessToken = refreshData.access_token;
                        const newExpiry = new Date();
                        newExpiry.setSeconds(newExpiry.getSeconds() + (refreshData.expires_in || 3600));
                        const tokenUpdate = {
                            zoom_access_token: accessToken,
                            zoom_token_expiry: newExpiry.toISOString()
                        };
                        if (refreshData.refresh_token) {
                            tokenUpdate.zoom_refresh_token = refreshData.refresh_token;
                        }
                        await base44.asServiceRole.entities.User.update(coach.id, tokenUpdate);
                        console.log('✓ Coach Zoom token refreshed');
                    } else {
                        console.error('Token refresh failed:', refreshResp.status);
                        return;
                    }
                }

                // Download transcript text
                const transcriptResp = await fetch(downloadUrl, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });

                if (transcriptResp.ok) {
                    transcriptText = await transcriptResp.text();
                    console.log('✓ Transcript text fetched, length:', transcriptText.length);
                } else {
                    console.log('Transcript download failed:', transcriptResp.status);
                    // Try without auth (some Zoom URLs include access token in query params)
                    const retryResp = await fetch(downloadUrl);
                    if (retryResp.ok) {
                        transcriptText = await retryResp.text();
                        console.log('✓ Transcript fetched without auth, length:', transcriptText.length);
                    } else {
                        console.log('Transcript retry also failed:', retryResp.status);
                    }
                }
            } else {
                console.log('Coach has no Zoom access token stored');
            }
        } else {
            console.log('Session has no coach_email — cannot fetch transcript');
        }
    } catch (fetchErr) {
        console.error('Transcript fetch error (non-fatal):', fetchErr.message);
    }

    // Run AI analysis if transcript was retrieved
    if (transcriptText && transcriptText.length > 50) {
        try {
            let contactName = null;
            if (session.contact_id) {
                try {
                    const contact = await base44.asServiceRole.entities.Contact.get(session.contact_id);
                    contactName = contact?.full_name || null;
                } catch (e) {
                    console.log('Could not fetch contact name');
                }
            }

            console.log('Running AI analysis on transcript...');
            const analysis = await analyzeSession(base44, transcriptText, session.title, contactName);

            if (analysis) {
                await base44.asServiceRole.entities.Session.update(session.id, {
                    summary: JSON.stringify(analysis),
                    summary_source: 'transcript',
                    status: 'summary_ready'
                });
                console.log('✓ AI analysis saved, session → summary_ready');

                // Create Task entities from action items
                if (analysis.action_items?.length > 0) {
                    for (const item of analysis.action_items) {
                        try {
                            await base44.asServiceRole.entities.Task.create({
                                session_id: session.id,
                                contact_id: session.contact_id || '',
                                title: item.title,
                                status: 'open',
                                priority: item.priority || 'medium',
                                taskContext: 'session'
                            });
                        } catch (taskErr) {
                            console.error('Task creation error:', taskErr.message);
                        }
                    }
                    console.log('✓ Created', analysis.action_items.length, 'tasks');
                }
            }
        } catch (analysisErr) {
            console.error('AI analysis error (non-fatal):', analysisErr.message);
            // Still mark as completed even if analysis fails
            await base44.asServiceRole.entities.Session.update(session.id, { status: 'completed' });
        }
    } else {
        console.log('Transcript too short or empty — skipping AI analysis');
    }
}