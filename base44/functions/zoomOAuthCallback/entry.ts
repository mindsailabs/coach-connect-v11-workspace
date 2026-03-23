import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        console.log('=== Zoom OAuth Callback Started ===');
        console.log('Full req.url:', req.url);
        console.log('Method:', req.method);

        // Handle POST body as fallback (some OAuth flows POST the params)
        let code, state, error;

        const url = new URL(req.url);
        code = url.searchParams.get('code');
        state = url.searchParams.get('state');
        error = url.searchParams.get('error');

        console.log('From URL params - code:', code ? 'present' : 'missing', 'state:', state ? 'present' : 'missing');

        // Fallback: try reading from POST body if not in URL
        if (!code && req.method === 'POST') {
            try {
                const bodyText = await req.text();
                console.log('POST body:', bodyText);
                const bodyParams = new URLSearchParams(bodyText);
                code = code || bodyParams.get('code');
                state = state || bodyParams.get('state');
                error = error || bodyParams.get('error');
                console.log('From POST body - code:', code ? 'present' : 'missing', 'state:', state ? 'present' : 'missing');
            } catch (e) {
                console.log('Could not parse POST body:', e.message);
            }
        }

        if (error) {
            return new Response(`
                <!doctype html>
                <html>
                <head><meta charset="utf-8"><title>OAuth Error</title></head>
                <body>
                    <h3>Authentication Error</h3>
                    <p>${error}</p>
                    <p>This window will close automatically...</p>
                    <script>
                        window.opener?.postMessage({ type: 'zoom-oauth-error', error: '${error.replace(/'/g, "\\'")}' }, '*');
                        setTimeout(() => window.close(), 2000);
                    </script>
                </body>
                </html>
            `, { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }

        if (!code || !state) {
            console.log('Missing params. Full URL was:', req.url);
            return new Response(`
                <!doctype html>
                <html>
                <head><meta charset="utf-8"><title>OAuth Error</title></head>
                <body>
                    <h3>Invalid Request</h3>
                    <p>Missing authorization code or state</p>
                    <p>URL: ${req.url.replace(/</g, '&lt;')}</p>
                    <script>
                        window.opener?.postMessage({ type: 'zoom-oauth-error', error: 'Missing authorization parameters' }, '*');
                        setTimeout(() => window.close(), 2000);
                    </script>
                </body>
                </html>
            `, { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }

        const clientId = Deno.env.get('ZOOM_CLIENT_ID');
        const clientSecret = Deno.env.get('ZOOM_CLIENT_SECRET');
        const redirectUri = Deno.env.get('ZOOM_REDIRECT_URI');

        if (!clientId || !clientSecret || !redirectUri) {
            return new Response(`
                <!doctype html>
                <html>
                <head><meta charset="utf-8"><title>Configuration Error</title></head>
                <body>
                    <h3>Server Configuration Error</h3>
                    <p>Please contact support</p>
                    <script>
                        window.opener?.postMessage({ type: 'zoom-oauth-error', error: 'Server configuration error' }, '*');
                        setTimeout(() => window.close(), 2000);
                    </script>
                </body>
                </html>
            `, { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }

        console.log('Exchanging code for Zoom tokens...');
        console.log('redirect_uri being sent to Zoom:', redirectUri);
        console.log('DEBUG redirect_uri:', redirectUri);
        console.log('DEBUG client_id:', clientId);

        const credentials = btoa(`${clientId}:${clientSecret}`);
        const tokenResponse = await fetch('https://zoom.us/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${credentials}`
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri
            })
        });

        const tokenData = await tokenResponse.json();
        console.log('DEBUG Zoom token response:', JSON.stringify(tokenData));

        if (!tokenResponse.ok) {
            return new Response(`
                <!doctype html>
                <html>
                <head><meta charset="utf-8"><title>Token Exchange Failed</title></head>
                <body>
                    <h3>Authentication Failed</h3>
                    <p>${(tokenData.reason || tokenData.error || 'Unknown error').replace(/</g, '&lt;')}</p>
                    <script>
                        window.opener?.postMessage({ type: 'zoom-oauth-error', error: '${(tokenData.reason || tokenData.error || 'Token exchange failed').replace(/'/g, "\\'")}' }, '*');
                        setTimeout(() => window.close(), 2000);
                    </script>
                </body>
                </html>
            `, { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }

        const base44 = createClientFromRequest(req);

        const expiryDate = new Date();
        expiryDate.setSeconds(expiryDate.getSeconds() + (tokenData.expires_in || 3600));

        const updateData = {
            zoom_access_token: tokenData.access_token,
            zoom_token_expiry: expiryDate.toISOString(),
            zoom_connected: true
        };

        if (tokenData.refresh_token) {
            updateData.zoom_refresh_token = tokenData.refresh_token;
        }

        await base44.asServiceRole.entities.User.update(state, updateData);

        console.log('Zoom tokens stored successfully for user:', state);

        return new Response(`
            <!doctype html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Connected Successfully</title>
                <style>
                    body { font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #2D8CFF 0%, #1a6fd4 100%); color: white; }
                    .container { text-align: center; padding: 2rem; }
                    .checkmark { width: 80px; height: 80px; border-radius: 50%; background: white; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; font-size: 48px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="checkmark">✓</div>
                    <h2>Zoom Account Connected!</h2>
                    <p>This window will close automatically...</p>
                </div>
                <script>
                    window.opener?.postMessage({ type: 'zoom-oauth-success' }, '*');
                    setTimeout(() => window.close(), 1500);
                </script>
            </body>
            </html>
        `, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });

    } catch (error) {
        console.error('=== Zoom OAuth Callback Error ===');
        console.error('Error:', error.message);

        return new Response(`
            <!doctype html>
            <html>
            <head><meta charset="utf-8"><title>Error</title></head>
            <body>
                <h3>Something went wrong</h3>
                <p>${error.message.replace(/</g, '&lt;')}</p>
                <script>
                    window.opener?.postMessage({ type: 'zoom-oauth-error', error: '${error.message.replace(/'/g, "\\'")}' }, '*');
                    setTimeout(() => window.close(), 2000);
                </script>
            </body>
            </html>
        `, { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
});
