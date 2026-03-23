import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { google } from 'npm:googleapis@134.0.0';

async function getImpersonatedAuth() {
    const serviceAccountEmail = Deno.env.get('SERVICE_ACCOUNT_EMAIL');
    let serviceAccountKey = Deno.env.get('SERVICE_ACCOUNT_KEY');
    const hostUser = Deno.env.get('MEET_HOST_USER');

    if (!serviceAccountEmail || !serviceAccountKey || !hostUser) {
        throw new Error('Missing service account credentials or host user');
    }

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
        'https://www.googleapis.com/auth/meetings.space.created',
        'https://www.googleapis.com/auth/meetings.space.readonly',
        'https://www.googleapis.com/auth/meetings.space.settings',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/calendar.events'
    ];

    const auth = new google.auth.JWT({
        email: serviceAccountEmail,
        key: serviceAccountKey,
        scopes,
        subject: hostUser
    });

    return auth;
}

async function getCoachCalendarClient(base44) {
    const user = await base44.auth.me();
    
    if (!user.google_access_token) {
        throw new Error('Coach must connect Google account first');
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
        access_token: user.google_access_token
    });

    return google.calendar({ version: 'v3', auth: oauth2Client });
}

Deno.serve(async (req) => {
    try {
        console.log('=== Create Instant Meet Session (v6 - Co-Host Email Fix) ===');
        
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { contact_id, title, coach_email, participant_emails, date_time, duration, notes } = await req.json();

        if (!contact_id || !title) {
            return Response.json({ 
                error: 'Missing required fields: contact_id, title' 
            }, { status: 400 });
        }

        const contact = await base44.entities.Contact.get(contact_id);
        if (!contact) {
            return Response.json({ error: 'Contact not found' }, { status: 404 });
        }

        const finalCoachEmail = coach_email || user.email;
        const finalParticipants = participant_emails || [contact.email];
        const hostUser = Deno.env.get('MEET_HOST_USER');

        console.log('Coach email:', finalCoachEmail);
        console.log('Participants:', finalParticipants);
        
        const auth = await getImpersonatedAuth();
        const accessToken = await auth.getAccessToken();

        // =====================================================
        // STEP 1: Create Meet space with:
        //   - OPEN access (no waiting room)
        //   - Moderation ON (required for co-host management)
        //   - Auto-recording, transcription, smart notes ON
        // =====================================================
        console.log('Step 1: Creating Meet space with ArtifactConfig + Moderation...');
        const spaceResponse = await fetch('https://meet.googleapis.com/v2/spaces', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                config: {
                    accessType: 'OPEN',
                    entryPointAccess: 'ALL',
                    moderation: 'ON',
                    artifactConfig: {
                        recordingConfig: {
                            autoRecordingGeneration: 'ON'
                        },
                        transcriptionConfig: {
                            autoTranscriptionGeneration: 'ON'
                        },
                        smartNotesConfig: {
                            autoSmartNotesGeneration: 'ON'
                        }
                    }
                }
            })
        });

        if (!spaceResponse.ok) {
            const errorData = await spaceResponse.json();
            console.error('Space creation error:', JSON.stringify(errorData));
            throw new Error(`Failed to create Meet space: ${errorData.error?.message || 'Unknown error'}`);
        }

        const spaceData = await spaceResponse.json();
        const spaceName = spaceData.name;
        const meetCode = spaceData.meetingCode;
        const meetJoinLink = `https://meet.google.com/${meetCode}`;

        console.log('Meet space created:', spaceName);
        console.log('Meet link:', meetJoinLink);
        console.log('Space config:', JSON.stringify(spaceData.config));

        // =====================================================
        // STEP 2: Add coach as CO-HOST via spaces.members API (v2beta)
        // IMPORTANT: Use "email" field directly (not "user" field)
        // The API requires email as a top-level string field
        // Moderation must be ON for co-host to work
        // =====================================================
        console.log('Step 2: Adding coach as co-host...');
        const cohostPayload = { email: finalCoachEmail, role: 'COHOST' };
        console.log('Step 2 payload:', JSON.stringify(cohostPayload));
        let cohostSuccess = false;
        try {
            const memberUrl = `https://meet.googleapis.com/v2beta/${spaceName}/members`;
            console.log('Step 2 URL:', memberUrl);
            const memberResponse = await fetch(memberUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(cohostPayload)
            });

            if (memberResponse.ok) {
                const memberData = await memberResponse.json();
                console.log('Coach added as co-host SUCCESS:', JSON.stringify(memberData));
                cohostSuccess = true;
            } else {
                const memberError = await memberResponse.json();
                console.error('Co-host assignment failed:', JSON.stringify(memberError));
            }
        } catch (memberErr) {
            console.error('Co-host error:', memberErr.message);
        }

        // Calculate timing
        const start = date_time ? new Date(date_time) : new Date();
        const durationMs = (duration || 30) * 60 * 1000;
        const end = new Date(start.getTime() + durationMs);

        // =====================================================
        // STEP 3: Create calendar event on info@mindsailabs.com with the Meet link
        // =====================================================
        console.log('Step 3: Creating host calendar event...');
        let googleEventId = null;
        try {
            const hostCalendar = google.calendar({ version: 'v3', auth });
            const hostEvent = await hostCalendar.events.insert({
                calendarId: 'primary',
                conferenceDataVersion: 1,
                sendUpdates: 'none',
                requestBody: {
                    summary: title,
                    description: 'Coaching session - Auto-recorded and transcribed',
                    start: { dateTime: start.toISOString(), timeZone: 'UTC' },
                    end: { dateTime: end.toISOString(), timeZone: 'UTC' },
                    attendees: [
                        { email: finalCoachEmail },
                        ...finalParticipants.map(email => ({ email }))
                    ],
                    conferenceData: {
                        conferenceId: meetCode,
                        conferenceSolution: {
                            key: { type: 'hangoutsMeet' },
                            name: 'Google Meet'
                        },
                        entryPoints: [{
                            entryPointType: 'video',
                            uri: meetJoinLink,
                            label: meetCode
                        }]
                    },
                    guestsCanModify: false,
                    guestsCanInviteOthers: false
                }
            });
            googleEventId = hostEvent.data.id;
            console.log('Host calendar event created:', googleEventId);
        } catch (hostCalError) {
            console.error('Host calendar event failed:', hostCalError.message);
        }

        // =====================================================
        // STEP 4: Send calendar invite from coach's email (client sees coach as organizer)
        // =====================================================
        console.log('Step 4: Sending coach calendar invite...');
        try {
            const calendar = await getCoachCalendarClient(base44);
            await calendar.events.insert({
                calendarId: 'primary',
                sendUpdates: 'all',
                requestBody: {
                    summary: title,
                    start: { dateTime: start.toISOString(), timeZone: 'UTC' },
                    end: { dateTime: end.toISOString(), timeZone: 'UTC' },
                    attendees: [
                        ...finalParticipants.map(email => ({ email }))
                    ],
                    location: meetJoinLink,
                    description: `Coaching session\n\nMeet link: ${meetJoinLink}\n\nThis session will be automatically recorded and transcribed.\nBy joining, you consent to recording and processing.`
                }
            });
            console.log('Coach calendar invite sent to clients');
        } catch (calError) {
            console.error('Coach calendar invite failed:', calError.message);
        }

        // =====================================================
        // STEP 5: Create session record in database
        // =====================================================
        console.log('Step 5: Creating session record...');
        const session = await base44.entities.Session.create({
            contact_id,
            title,
            coach_email: finalCoachEmail,
            participant_emails: Array.isArray(finalParticipants) ? finalParticipants.join(', ') : finalParticipants,
            meet_space_name: spaceName,
            meet_link: meetJoinLink,
            meet_join_link: meetJoinLink,
            google_event_id: googleEventId || '',
            duration: duration || 30,
            scheduled_end_time: end.toISOString(),
            status: 'scheduled',
            cohost_granted: cohostSuccess,
            notes: notes || '',
            date_time: date_time ? new Date(date_time).toISOString() : new Date().toISOString()
        });

        console.log('Session created:', session.id);

        return Response.json({ 
            success: true,
            session,
            meet_join_link: meetJoinLink,
            host: hostUser,
            cohost: finalCoachEmail,
            cohost_assigned: cohostSuccess,
            auto_recording_enabled: true,
            auto_transcription_enabled: true,
            smart_notes_enabled: true,
            space_config: spaceData.config
        });

    } catch (error) {
        console.error('=== Create Instant Session Error ===');
        console.error('Error:', error.message);
        return Response.json({ 
            error: error.message || 'Failed to create instant session'
        }, { status: 500 });
    }
});