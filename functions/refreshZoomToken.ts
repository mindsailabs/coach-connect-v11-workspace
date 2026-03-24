import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user.zoom_refresh_token) {
            return Response.json({ error: 'No Zoom refresh token available' }, { status: 400 });
        }

        const clientId = Deno.env.get('ZOOM_CLIENT_ID');
        const clientSecret = Deno.env.get('ZOOM_CLIENT_SECRET');
        const credentials = btoa(`${clientId}:${clientSecret}`);

        const response = await fetch('https://zoom.us/oauth/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: user.zoom_refresh_token
            })
        });

        const tokenData = await response.json();

        if (!response.ok) {
            throw new Error(tokenData.reason || tokenData.error || 'Failed to refresh Zoom token');
        }

        const expiryDate = new Date();
        expiryDate.setSeconds(expiryDate.getSeconds() + (tokenData.expires_in || 3600));

        const updateData = {
            zoom_access_token: tokenData.access_token,
            zoom_token_expiry: expiryDate.toISOString()
        };

        if (tokenData.refresh_token) {
            updateData.zoom_refresh_token = tokenData.refresh_token;
        }

        await base44.asServiceRole.entities.User.update(user.id, updateData);

        return Response.json({
            access_token: tokenData.access_token,
            expires_in: tokenData.expires_in
        });
    } catch (error) {
        console.error('refreshZoomToken error:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
