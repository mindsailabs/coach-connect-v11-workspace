import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { google } from 'npm:googleapis@134.0.0';

// Exact copy of getImpersonatedAuth from getSessionArtifactContent/entry.ts
async function getImpersonatedAuth() {
    const serviceAccountEmail = Deno.env.get('SERVICE_ACCOUNT_EMAIL');
    let serviceAccountKey = Deno.env.get('SERVICE_ACCOUNT_KEY');
    const hostUser = Deno.env.get('MEET_HOST_USER');

    let keyContent = serviceAccountKey;
    if (keyContent.includes('\\n')) {
        keyContent = keyContent.replace(/\\n/g, '\n');
    }
    const beginMarker = '-----BEGIN PRIVATE KEY-----';
    const endMarker = '-----END PRIVATE KEY-----';
    let base64Content = keyContent;
    if (keyContent.includes(beginMarker) && keyContent.includes(endMarker)) {
        const startIdx = keyContent.indexOf(beginMarker) + beginMarker.length;
        const endIdx = keyContent.indexOf(endMarker);
        base64Content = keyContent.substring(startIdx, endIdx);
    }
    base64Content = base64Content.replace(/\s/g, '');
    const chunks = [];
    for (let i = 0; i < base64Content.length; i += 64) {
        chunks.push(base64Content.substring(i, i + 64));
    }
    serviceAccountKey = beginMarker + '\n' + chunks.join('\n') + '\n' + endMarker;

    return new google.auth.JWT({
        email: serviceAccountEmail,
        key: serviceAccountKey,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        subject: hostUser
    });
}

Deno.serve(async (req) => {
    try {
        console.log('=== streamRecording ===');

        const base44 = createClientFromRequest(req);
        const { sessionId } = await req.json();

        if (!sessionId) {
            return Response.json({ success: false, error: 'Missing sessionId' }, { status: 400 });
        }

        // Get session
        const session = await base44.asServiceRole.entities.Session.get(sessionId);
        if (!session) {
            return Response.json({ success: false, error: 'Session not found' }, { status: 404 });
        }

        const fileId = session.recording_file_id;
        if (!fileId || fileId.trim() === '') {
            return Response.json({ success: false, error: 'No recording file ID on this session' }, { status: 404 });
        }

        // Validate env vars before attempting auth
        const saEmail = Deno.env.get('SERVICE_ACCOUNT_EMAIL');
        const saKey = Deno.env.get('SERVICE_ACCOUNT_KEY');
        const hostUser = Deno.env.get('MEET_HOST_USER');
        if (!saEmail || !saKey || !hostUser) {
            console.error('Missing env vars:', { saEmail: !!saEmail, saKey: !!saKey, hostUser: !!hostUser });
            return Response.json({ success: false, error: 'Service account not configured' }, { status: 500 });
        }

        // Authenticate with service account
        let accessToken;
        try {
            const auth = await getImpersonatedAuth();
            const tokenResponse = await auth.authorize();
            accessToken = tokenResponse?.access_token || auth.credentials?.access_token;
        } catch (authErr) {
            console.error('Google auth error:', authErr.message, authErr.stack);
            return Response.json({ success: false, error: 'Google authentication failed: ' + authErr.message }, { status: 500 });
        }

        if (!accessToken) {
            console.error('No access token obtained after auth.authorize()');
            return Response.json({ success: false, error: 'Failed to obtain access token' }, { status: 500 });
        }

        console.log('Access token obtained, verifying file:', fileId);

        // Verify file exists and get metadata
        let fileMeta;
        try {
            const metaResponse = await fetch(
                `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size`,
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );

            if (!metaResponse.ok) {
                const errText = await metaResponse.text();
                console.error('Drive metadata error:', metaResponse.status, errText);
                return Response.json({ success: false, error: 'Recording file not accessible in Drive' }, { status: 404 });
            }

            fileMeta = await metaResponse.json();
            console.log('File metadata:', JSON.stringify(fileMeta));
        } catch (fetchErr) {
            console.error('Drive fetch error:', fetchErr.message);
            return Response.json({ success: false, error: 'Failed to verify recording file: ' + fetchErr.message }, { status: 500 });
        }

        // Follow the redirect to get the final signed googleusercontent.com URL.
        // Deno's fetch follows redirects by default. response.url gives the final URL.
        // We cancel the body immediately so we don't download the whole file.
        let streamUrl;
        try {
            console.log('Fetching download redirect for file:', fileId);
            const downloadResponse = await fetch(
                `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );

            // response.url is the FINAL URL after all redirects
            streamUrl = downloadResponse.url;
            console.log('Final URL after redirects (first 120 chars):', streamUrl?.substring(0, 120));
            console.log('Response status:', downloadResponse.status);
            console.log('Response type:', downloadResponse.type);

            // Cancel the body - we only needed the final URL
            try { await downloadResponse.body?.cancel(); } catch (_) { /* ignore */ }

            if (!downloadResponse.ok) {
                console.error('Download response not ok:', downloadResponse.status);
                return Response.json({ success: false, error: 'Cannot access recording file: HTTP ' + downloadResponse.status }, { status: 500 });
            }
        } catch (dlErr) {
            console.error('Download redirect error:', dlErr.message, dlErr.stack);
            return Response.json({ success: false, error: 'Failed to get streaming URL: ' + dlErr.message }, { status: 500 });
        }

        if (!streamUrl) {
            return Response.json({ success: false, error: 'No streaming URL obtained' }, { status: 500 });
        }

        return Response.json({
            success: true,
            streamUrl,
            mimeType: fileMeta.mimeType || 'video/mp4',
            fileSize: parseInt(fileMeta.size || '0', 10),
            fileName: fileMeta.name || 'recording'
        });

    } catch (error) {
        console.error('streamRecording unexpected error:', error.message, error.stack);
        return Response.json({ success: false, error: 'Unexpected error: ' + error.message }, { status: 500 });
    }
});
