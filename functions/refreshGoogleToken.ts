import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function refreshAccessToken(refreshToken) {
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token'
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error_description || data.error || 'Failed to refresh token');
    }

    return data;
}

Deno.serve(async (req) => {
    try {
        console.log('=== Refresh Token Started ===');
        
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user.google_refresh_token) {
            return Response.json({ error: 'No refresh token available' }, { status: 400 });
        }

        const tokenData = await refreshAccessToken(user.google_refresh_token);

        const expiryDate = new Date();
        expiryDate.setSeconds(expiryDate.getSeconds() + tokenData.expires_in);

        await base44.asServiceRole.entities.User.update(user.id, {
            google_access_token: tokenData.access_token,
            google_token_expiry: expiryDate.toISOString()
        });

        console.log('Token refreshed successfully');

        return Response.json({ 
            access_token: tokenData.access_token,
            expires_in: tokenData.expires_in 
        });
    } catch (error) {
        console.error('=== Refresh Token Error ===');
        console.error('Error:', error.message);
        
        return Response.json({ error: error.message }, { status: 500 });
    }
});