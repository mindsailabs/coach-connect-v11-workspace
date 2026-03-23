import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        console.log('=== Zoom OAuth Init Started ===');

        const base44 = createClientFromRequest(req);

        let user;
        try {
            user = await base44.auth.me();
        } catch (authError) {
            console.error('Auth error:', authError.message);
        }

        if (!user) {
            return Response.json({
                error: 'Please sign in to connect your Zoom account'
            }, { status: 401 });
        }

        console.log('User authenticated:', user.id, user.email);

        const clientId = Deno.env.get('ZOOM_CLIENT_ID');
        const redirectUri = Deno.env.get('ZOOM_REDIRECT_URI');

        if (!clientId || !redirectUri) {
            return Response.json({
                error: 'Zoom OAuth not configured. Please add ZOOM_CLIENT_ID and ZOOM_REDIRECT_URI to environment variables.'
            }, { status: 500 });
        }

        const authUrl = new URL('https://zoom.us/oauth/authorize');
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('state', user.id);

        console.log('Generated Zoom auth URL successfully');

        return Response.json({ authUrl: authUrl.toString() });
    } catch (error) {
        console.error('=== Zoom OAuth Init Error ===');
        console.error('Error:', error.message);

        return Response.json({
            error: 'Failed to initialize Zoom connection. Please try again.'
        }, { status: 500 });
    }
});
