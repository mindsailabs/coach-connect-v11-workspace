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

        // Resolve the redirect to get a temporary signed URL that works without auth
        let streamUrl;
        try {
            const downloadResponse = await fetch(
                `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
                {
                    headers: { 'Authorization': `Bearer ${accessToken}` },
                    redirect: 'manual'  // Don't follow redirect, capture the Location header
                }
            );

            if (downloadResponse.status === 302 || downloadResponse.status === 303 || downloadResponse.status === 307) {
                // Google returns a temporary signed URL — this works without auth
                streamUrl = downloadResponse.headers.get('Location');
                console.log('Got redirect URL (first 100 chars):', streamUrl?.substring(0, 100));
            } else if (downloadResponse.ok) {
                // No redirect — unusual, but the original URL works directly
                // Fall back to the access_token approach
                streamUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&access_token=${accessToken}`;
                console.log('No redirect, using direct URL with token');
            } else {
                const errText = await downloadResponse.text();
                console.error('Download URL error:', downloadResponse.status, errText);
                return Response.json({ success: false, error: 'Cannot access recording file for streaming' }, { status: 500 });
            }
        } catch (dlErr) {
            console.error('Download redirect error:', dlErr.message);
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
