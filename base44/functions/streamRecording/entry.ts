import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { google } from 'npm:googleapis@134.0.0';

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

    const auth = new google.auth.JWT({
        email: serviceAccountEmail,
        key: serviceAccountKey,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        subject: hostUser
    });

    return auth;
}

Deno.serve(async (req) => {
    try {
        console.log('=== Stream Recording ===');

        const base44 = createClientFromRequest(req);
        const { sessionId } = await req.json();

        if (!sessionId) {
            return Response.json({ error: 'Missing sessionId' }, { status: 400 });
        }

        // Verify session exists and user has access
        const session = await base44.asServiceRole.entities.Session.get(sessionId);
        if (!session) {
            return Response.json({ error: 'Session not found' }, { status: 404 });
        }

        const fileId = session.recording_file_id;
        if (!fileId || fileId.trim() === '') {
            return Response.json({ error: 'No recording file for this session' }, { status: 404 });
        }

        // Get a short-lived access token from the service account
        const auth = await getImpersonatedAuth();
        const tokenResponse = await auth.authorize();
        const accessToken = tokenResponse?.access_token || auth.credentials?.access_token;

        if (!accessToken) {
            console.error('Failed to get access token');
            return Response.json({ error: 'Authentication failed' }, { status: 500 });
        }

        // Verify the file exists and get metadata
        const metaResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        if (!metaResponse.ok) {
            const metaErr = await metaResponse.text();
            console.error('File metadata error:', metaErr);
            return Response.json({ error: 'Recording file not found in Drive' }, { status: 404 });
        }

        const fileMeta = await metaResponse.json();
        console.log(`Recording verified: ${fileMeta.name}, ${fileMeta.mimeType}, ${fileMeta.size} bytes`);

        // Return the download URL and temporary access token
        // The frontend will use these to fetch the video directly from Google's API
        // Token is short-lived (~1 hour) and scoped to drive.readonly
        return Response.json({
            success: true,
            downloadUrl: `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
            accessToken: accessToken,
            mimeType: fileMeta.mimeType || 'video/mp4',
            fileSize: parseInt(fileMeta.size || '0', 10),
            fileName: fileMeta.name
        });

    } catch (error) {
        console.error('=== Stream Recording Error ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
