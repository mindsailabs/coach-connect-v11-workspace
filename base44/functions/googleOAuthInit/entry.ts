import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        console.log('=== OAuth Init Started ===');
        
        const base44 = createClientFromRequest(req);
        
        let user;
        try {
            user = await base44.auth.me();
        } catch (authError) {
            console.error('Auth error:', authError.message);
        }

        if (!user) {
            return Response.json({ 
                error: 'Please sign in to connect your Google account' 
            }, { status: 401 });
        }

        console.log('User authenticated:', user.id, user.email);

        const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
        const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI');

        if (!clientId || !redirectUri) {
            return Response.json({ 
                error: 'Google OAuth not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URI to environment variables.' 
            }, { status: 500 });
        }

        const state = crypto.randomUUID();
        
        // Store state using service role to avoid auth issues
        await base44.asServiceRole.entities.User.update(user.id, { 
            google_token_expiry: JSON.stringify({ state, expires: Date.now() + 600000, userId: user.id })
        });

        const scopes = [
            'openid',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/drive.readonly'
        ].join(' ');

        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', scopes);
        authUrl.searchParams.set('access_type', 'offline');
        authUrl.searchParams.set('prompt', 'consent');
        authUrl.searchParams.set('state', state);

        console.log('Generated auth URL successfully');

        return Response.json({ authUrl: authUrl.toString() });
    } catch (error) {
        console.error('=== OAuth Init Error ===');
        console.error('Error:', error.message);
        
        return Response.json({ 
            error: 'Failed to initialize Google connection. Please try again.' 
        }, { status: 500 });
    }
});