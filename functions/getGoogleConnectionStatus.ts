import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Use service role to read the full user record (which has google_connected)
        let userRecord;
        try {
            userRecord = await base44.asServiceRole.entities.User.get(user.id);
        } catch (e) {
            console.error('Failed to read user record:', e.message);
            return Response.json({ connected: false, email: user.email });
        }

        return Response.json({
            connected: userRecord?.google_connected === true,
            email: user.email
        });
    } catch (error) {
        console.error('getGoogleConnectionStatus error:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
});