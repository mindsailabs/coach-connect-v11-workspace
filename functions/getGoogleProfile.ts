import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const accessToken = user.google_access_token;
        const refreshToken = user.google_refresh_token;

        if (!accessToken) {
            return Response.json({ connected: false });
        }

        async function getValidToken() {
            // Try current token first
            const testRes = await fetch('https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=' + accessToken);
            if (testRes.ok) return accessToken;

            // Token expired — refresh
            if (!refreshToken) return null;
            const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
            const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

            const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                    client_id: clientId,
                    client_secret: clientSecret
                })
            });

            const refreshData = await refreshRes.json();
            if (!refreshRes.ok) return null;

            const newAccessToken = refreshData.access_token;
            const expiryDate = new Date();
            expiryDate.setSeconds(expiryDate.getSeconds() + (refreshData.expires_in || 3600));

            await base44.asServiceRole.entities.User.update(user.id, {
                google_access_token: newAccessToken,
                google_token_expiry: expiryDate.toISOString()
            });

            return newAccessToken;
        }

        const validToken = await getValidToken();
        if (!validToken) {
            return Response.json({ connected: false, error: 'Could not obtain valid token' });
        }

        // Try People API — works with basic scopes and returns name, photo, email
        const peopleRes = await fetch(
            'https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,photos,locales',
            { headers: { Authorization: `Bearer ${validToken}` } }
        );

        if (peopleRes.ok) {
            const data = await peopleRes.json();
            const primaryName = data.names?.find(n => n.metadata?.primary) || data.names?.[0];
            const primaryEmail = data.emailAddresses?.find(e => e.metadata?.primary) || data.emailAddresses?.[0];
            const primaryPhoto = data.photos?.find(p => p.metadata?.primary) || data.photos?.[0];
            const primaryLocale = data.locales?.find(l => l.metadata?.primary) || data.locales?.[0];

            return Response.json({
                connected: true,
                profile: {
                    name: primaryName?.displayName || null,
                    email: primaryEmail?.value || user.email,
                    picture: primaryPhoto?.url || null,
                    locale: primaryLocale?.value || null,
                }
            });
        }

        // Fallback: userinfo endpoint
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${validToken}` }
        });

        if (!userInfoRes.ok) {
            return Response.json({ connected: false, error: 'Failed to fetch profile' });
        }

        const profile = await userInfoRes.json();
        return Response.json({
            connected: true,
            profile: {
                name: profile.name || null,
                email: profile.email || user.email,
                picture: profile.picture || null,
                locale: profile.locale || null,
            }
        });

    } catch (error) {
        console.error('getGoogleProfile error:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
});