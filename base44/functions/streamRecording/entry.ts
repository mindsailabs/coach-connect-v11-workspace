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

        // Use the service account to get an access token
        const auth = await getImpersonatedAuth();
        await auth.authorize();
        const accessToken = auth.credentials.access_token;

        // Get file metadata first
        const metaResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        if (!metaResponse.ok) {
            const metaErr = await metaResponse.text();
            console.error('Metadata fetch error:', metaErr);
            return Response.json({ error: 'Failed to get file metadata' }, { status: 500 });
        }
        const fileMeta = await metaResponse.json();
        const mimeType = fileMeta.mimeType || 'video/mp4';
        const fileSize = fileMeta.size ? parseInt(fileMeta.size, 10) : 0;
        console.log(`Recording: ${fileMeta.name}, ${mimeType}, ${fileSize} bytes`);

        // Download the file binary using native fetch (Deno-compatible)
        const downloadResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        if (!downloadResponse.ok) {
            const dlErr = await downloadResponse.text();
            console.error('Download error:', dlErr);
            return Response.json({ error: 'Failed to download recording' }, { status: 500 });
        }

        // Return the video as a streaming response using the native fetch body
        const headers = new Headers({
            'Content-Type': mimeType,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'private, max-age=3600',
        });
        if (fileSize > 0) {
            headers.set('Content-Length', String(fileSize));
        }

        // Pass through the readable stream from the Drive download directly
        return new Response(downloadResponse.body, { status: 200, headers });

    } catch (error) {
        console.error('=== Stream Recording Error ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
