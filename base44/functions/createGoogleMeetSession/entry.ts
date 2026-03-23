import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function getValidAccessToken(base44, user) {
    if (!user.google_access_token || !user.google_token_expiry) {
        throw new Error('Google account not connected');
    }

    const now = new Date();
    const expiry = new Date(user.google_token_expiry);

    if (now >= expiry) {
        console.log('Access token expired, refreshing...');
        const refreshResponse = await base44.functions.invoke('refreshGoogleToken');
        if (refreshResponse.status !== 200) {
            throw new Error('Failed to refresh Google token. Please reconnect your Google account.');
        }
        return refreshResponse.data.access_token;
    }

    return user.google_access_token;
}

Deno.serve(async (req) => {
    try {
        console.log('=== Create Google Meet Session (Path A - Coach OAuth) ===');
        
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user.google_connected) {
            return Response.json({ 
                error: 'Please connect your Google account first',
                needsAuth: true 
            }, { status: 400 });
        }

        const { contact_id, title, date_time, duration, notes } = await req.json();

        if (!contact_id || !title || !date_time) {
            return Response.json({ 
                error: 'Missing required fields: contact_id, title, date_time' 
            }, { status: 400 });
        }

        const contact = await base44.entities.Contact.get(contact_id);
        if (!contact) {
            return Response.json({ error: 'Contact not found' }, { status: 404 });
        }

        console.log('Contact found:', contact.full_name, contact.email);

        const accessToken = await getValidAccessToken(base44, user);

        const startDate = new Date(date_time);
        const endDate = new Date(startDate.getTime() + (duration || 60) * 60000);
        const requestId = crypto.randomUUID();

        const calendarEvent = {
            summary: title,
            description: notes || `Coaching session with ${contact.full_name}`,
            attendees: [
                { email: contact.email, displayName: contact.full_name }
            ],
            conferenceData: {
                createRequest: {
                    requestId: requestId,
                    conferenceSolutionKey: { type: 'hangoutsMeet' }
                }
            },
            start: {
                dateTime: startDate.toISOString(),
                timeZone: 'Europe/London'
            },
            end: {
                dateTime: endDate.toISOString(),
                timeZone: 'Europe/London'
            },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 },
                    { method: 'popup', minutes: 30 }
                ]
            },
            sendUpdates: 'all'
        };

        console.log('Creating calendar event from coach account...');

        const calendarResponse = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(calendarEvent)
            }
        );

        const eventData = await calendarResponse.json();

        if (!calendarResponse.ok) {
            if (eventData.error?.code === 401 || eventData.error?.message?.includes('invalid_grant')) {
                await base44.asServiceRole.entities.User.update(user.id, {
                    google_connected: false,
                    google_access_token: null,
                    google_token_expiry: null
                });
                return Response.json({ 
                    error: 'Your Google authorization has expired. Please reconnect your account.',
                    needsAuth: true 
                }, { status: 401 });
            }
            throw new Error(eventData.error?.message || 'Failed to create calendar event');
        }

        const meetLink = eventData.hangoutLink || eventData.conferenceData?.entryPoints?.find(
            ep => ep.entryPointType === 'video'
        )?.uri;

        console.log('Meet link generated:', meetLink);

        const session = await base44.entities.Session.create({
            contact_id,
            title,
            date_time: startDate.toISOString(),
            scheduled_end_time: endDate.toISOString(),
            duration: duration || 60,
            meet_link: meetLink,
            google_event_id: eventData.id,
            google_calendar_status: eventData.status,
            contact_response_status: eventData.attendees?.[0]?.responseStatus || 'needsAction',
            coach_email: user.email,
            status: 'upcoming',
            notes: notes || ''
        });

        console.log('Session created:', session.id);

        return Response.json({ 
            success: true,
            session,
            meet_link: meetLink,
            event_id: eventData.id
        });

    } catch (error) {
        console.error('=== Create Session Error ===');
        console.error('Error:', error.message);
        
        return Response.json({ 
            error: error.message,
            needsAuth: error.message.includes('connect') || error.message.includes('authorization')
        }, { status: 500 });
    }
});