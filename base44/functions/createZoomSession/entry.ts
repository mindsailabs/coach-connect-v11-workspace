import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        console.log('=== createZoomSession Started ===');

        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user.zoom_access_token) {
            return Response.json({ error: 'Zoom account not connected. Please connect Zoom in Settings.' }, { status: 400 });
        }

        const { contact_id, title, date_time, duration, notes, participant_emails } = await req.json();

        if (!contact_id || !title || !date_time) {
            return Response.json({ error: 'Missing required fields: contact_id, title, date_time' }, { status: 400 });
        }

        const clientId = Deno.env.get('ZOOM_CLIENT_ID');
        const clientSecret = Deno.env.get('ZOOM_CLIENT_SECRET');

        // Refresh token if expired
        let accessToken = user.zoom_access_token;
        if (user.zoom_token_expiry && new Date(user.zoom_token_expiry) <= new Date()) {
            console.log('Zoom token expired, refreshing...');

            const credentials = btoa(`${clientId}:${clientSecret}`);
            const refreshResponse = await fetch('https://zoom.us/oauth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${credentials}`
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: user.zoom_refresh_token
                })
            });

            const refreshData = await refreshResponse.json();

            if (!refreshResponse.ok) {
                return Response.json({ error: 'Failed to refresh Zoom token: ' + (refreshData.reason || refreshData.error || 'Unknown error') }, { status: 401 });
            }

            accessToken = refreshData.access_token;

            const newExpiry = new Date();
            newExpiry.setSeconds(newExpiry.getSeconds() + (refreshData.expires_in || 3600));

            const updateData = {
                zoom_access_token: refreshData.access_token,
                zoom_token_expiry: newExpiry.toISOString()
            };
            if (refreshData.refresh_token) {
                updateData.zoom_refresh_token = refreshData.refresh_token;
            }

            await base44.asServiceRole.entities.User.update(user.id, updateData);
            console.log('Zoom token refreshed and saved for user:', user.id);
        }

        const durationMinutes = duration || 30;
        const start = new Date(date_time);
        const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

        // Create Zoom meeting
        console.log('Creating Zoom meeting...');
        const meetingResponse = await fetch('https://api.zoom.us/v2/users/me/meetings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                topic: title,
                type: 2,
                start_time: start.toISOString(),
                duration: durationMinutes,
                timezone: 'UTC',
                settings: {
                    auto_recording: 'cloud',
                    host_video: true,
                    participant_video: true,
                    join_before_host: true,
                    waiting_room: false
                }
            })
        });

        const meetingData = await meetingResponse.json();

        if (!meetingResponse.ok) {
            throw new Error(meetingData.message || 'Failed to create Zoom meeting');
        }

        const { id, join_url, start_url, password } = meetingData;
        console.log('Zoom meeting created:', id);

        // Create Session entity record
        const session = await base44.asServiceRole.entities.Session.create({
            contact_id,
            title,
            date_time: start.toISOString(),
            start_datetime: start.toISOString(),
            end_datetime: end.toISOString(),
            scheduled_end_time: end.toISOString(),
            duration: durationMinutes,
            notes: notes || '',
            status: 'scheduled',
            coach_email: user.email,
            platform: 'Zoom',
            meeting_type: 'Video Call',
            participant_emails: Array.isArray(participant_emails)
                ? participant_emails.join(', ')
                : (participant_emails || ''),
            video_provider: 'zoom',
            zoom_meeting_id: String(id),
            meet_link: join_url,
            meet_join_link: join_url,
            meeting_link: join_url,
            zoom_start_url: start_url || '',
            zoom_password: password || ''
        });

        console.log('Session created:', session.id);

        return Response.json({
            success: true,
            session,
            join_url,
            start_url,
            zoom_meeting_id: id,
            password
        });

    } catch (error) {
        console.error('=== createZoomSession Error ===');
        console.error('Error:', error.message);
        return Response.json({ error: error.message || 'Failed to create Zoom session' }, { status: 500 });
    }
});