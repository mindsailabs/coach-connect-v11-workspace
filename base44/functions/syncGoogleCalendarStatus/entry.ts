import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function getValidAccessToken(base44, user) {
    if (!user.google_access_token || !user.google_token_expiry) {
        throw new Error('Google account not connected');
    }

    const now = new Date();
    const expiry = new Date(user.google_token_expiry);

    if (now >= expiry) {
        const refreshResponse = await base44.functions.invoke('refreshGoogleToken');
        if (refreshResponse.status !== 200) {
            throw new Error('Failed to refresh Google token.');
        }
        return refreshResponse.data.access_token;
    }

    return user.google_access_token;
}

Deno.serve(async (req) => {
    try {
        console.log('=== Sync Google Calendar Status ===');
        
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

        const { sessionId } = await req.json();

        if (!sessionId) {
            return Response.json({ error: 'Missing required field: sessionId' }, { status: 400 });
        }

        const session = await base44.entities.Session.get(sessionId);
        if (!session) {
            return Response.json({ error: 'Session not found' }, { status: 404 });
        }

        if (!session.google_event_id) {
            return Response.json({ error: 'No Google event ID found for this session' }, { status: 400 });
        }

        const accessToken = await getValidAccessToken(base44, user);

        const eventResponse = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events/${session.google_event_id}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!eventResponse.ok) {
            if (eventResponse.status === 404) {
                return Response.json({ error: 'Event not found in Google Calendar.' }, { status: 404 });
            }
            const errorData = await eventResponse.json();
            throw new Error(errorData.error?.message || 'Failed to fetch event');
        }

        const eventData = await eventResponse.json();

        const contactResponseStatus = eventData.attendees?.[0]?.responseStatus || 'needsAction';

        const updatedSession = await base44.entities.Session.update(sessionId, {
            google_calendar_status: eventData.status,
            contact_response_status: contactResponseStatus
        });

        return Response.json({ 
            success: true,
            session: updatedSession,
            google_calendar_status: eventData.status,
            contact_response_status: contactResponseStatus
        });

    } catch (error) {
        console.error('=== Sync Status Error ===');
        console.error('Error:', error.message);
        
        return Response.json({ 
            error: error.message,
            needsAuth: error.message.includes('connect') || error.message.includes('authorization')
        }, { status: 500 });
    }
});