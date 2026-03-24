import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        console.log('=== OAuth Callback Started ===');

        const url = new URL(req.url);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const error = url.searchParams.get('error');

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
                        window.opener?.postMessage({ type: 'google-oauth-error', error: '${error.replace(/'/g, "\\'")}' }, '*');
                        setTimeout(() => window.close(), 2000);
                    </script>
                </body>
                </html>
            `, { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }

        if (!code || !state) {
            return new Response(`
                <!doctype html>
                <html>
                <head><meta charset="utf-8"><title>OAuth Error</title></head>
                <body>
                    <h3>Invalid Request</h3>
                    <p>Missing authorization code or state</p>
                    <script>
                        window.opener?.postMessage({ type: 'google-oauth-error', error: 'Missing authorization parameters' }, '*');
                        setTimeout(() => window.close(), 2000);
                    </script>
                </body>
                </html>
            `, { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }

        const base44 = createClientFromRequest(req);

        let targetUser = null;
        try {
            const users = await base44.asServiceRole.entities.User.list();
            for (const user of users) {
                if (user.google_token_expiry) {
                    try {
                        const stateData = JSON.parse(user.google_token_expiry);
                        if (stateData.state === state && stateData.expires > Date.now()) {
                            targetUser = user;
                            break;
                        }
                    } catch (e) {
                        continue;
                    }
                }
            }
        } catch (err) {
            console.error('Error finding user by state:', err.message);
        }

        if (!targetUser) {
            return new Response(`
                <!doctype html>
                <html>
                <head><meta charset="utf-8"><title>OAuth Error</title></head>
                <body>
                    <h3>Session Expired</h3>
                    <p>Please try connecting your Google account again</p>
                    <script>
                        window.opener?.postMessage({ type: 'google-oauth-error', error: 'Session expired. Please try again.' }, '*');
                        setTimeout(() => window.close(), 2000);
                    </script>
                </body>
                </html>
            `, { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }

        console.log('State validated for user:', targetUser.id);

        const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
        const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
        const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI');

        if (!clientId || !clientSecret || !redirectUri) {
            return new Response(`
                <!doctype html>
                <html>
                <head><meta charset="utf-8"><title>Configuration Error</title></head>
                <body>
                    <h3>Server Configuration Error</h3>
                    <p>Please contact support</p>
                    <script>
                        window.opener?.postMessage({ type: 'google-oauth-error', error: 'Server configuration error' }, '*');
                        setTimeout(() => window.close(), 2000);
                    </script>
                </body>
                </html>
            `, { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }

        console.log('Exchanging code for tokens...');
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            })
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            return new Response(`
                <!doctype html>
                <html>
                <head><meta charset="utf-8"><title>Token Exchange Failed</title></head>
                <body>
                    <h3>Authentication Failed</h3>
                    <p>${(tokenData.error_description || tokenData.error || 'Unknown error').replace(/</g, '&lt;')}</p>
                    <script>
                        window.opener?.postMessage({ type: 'google-oauth-error', error: '${(tokenData.error_description || tokenData.error || 'Token exchange failed').replace(/'/g, "\\'")}' }, '*');
                        setTimeout(() => window.close(), 2000);
                    </script>
                </body>
                </html>
            `, { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }

        const expiryDate = new Date();
        expiryDate.setSeconds(expiryDate.getSeconds() + (tokenData.expires_in || 3600));

        const updateData = {
            google_access_token: tokenData.access_token,
            google_token_expiry: expiryDate.toISOString(),
            google_connected: true
        };

        if (tokenData.refresh_token) {
            updateData.google_refresh_token = tokenData.refresh_token;
        }

        await base44.asServiceRole.entities.User.update(targetUser.id, updateData);

        console.log('User tokens stored successfully for:', targetUser.id);

        return new Response(`
            <!doctype html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Connected Successfully</title>
                <style>
                    body { font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; }
                    .container { text-align: center; padding: 2rem; }
                    .checkmark { width: 80px; height: 80px; border-radius: 50%; background: white; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; font-size: 48px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="checkmark">✓</div>
                    <h2>Google Account Connected!</h2>
                    <p>This window will close automatically...</p>
                </div>
                <script>
                    window.opener?.postMessage({ type: 'google-oauth-success' }, '*');
                    setTimeout(() => window.close(), 1500);
                </script>
            </body>
            </html>
        `, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });

    } catch (error) {
        console.error('=== OAuth Callback Error ===');
        console.error('Error:', error.message);
        
        return new Response(`
            <!doctype html>
            <html>
            <head><meta charset="utf-8"><title>Error</title></head>
            <body>
                <h3>Something went wrong</h3>
                <p>${error.message.replace(/</g, '&lt;')}</p>
                <script>
                    window.opener?.postMessage({ type: 'google-oauth-error', error: '${error.message.replace(/'/g, "\\'")}' }, '*');
                    setTimeout(() => window.close(), 2000);
                </script>
            </body>
            </html>
        `, { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
});