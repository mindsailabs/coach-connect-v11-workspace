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

        // Use the service account to fetch the video binary from Drive
        const auth = await getImpersonatedAuth();
        const drive = google.drive({ version: 'v3', auth });

        // First get file metadata to know the size and mime type
        const fileMeta = await drive.files.get({
            fileId,
            fields: 'id, name, mimeType, size'
        });
        const mimeType = fileMeta.data.mimeType || 'video/mp4';
        const fileSize = parseInt(fileMeta.data.size || '0', 10);
        console.log(`Recording: ${fileMeta.data.name}, ${mimeType}, ${fileSize} bytes`);

        // Download the file content as a stream
        const response = await drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'stream' }
        );

        // Convert the Node-style readable stream to a web ReadableStream
        const nodeStream = response.data;
        const webStream = new ReadableStream({
            start(controller) {
                nodeStream.on('data', (chunk) => {
                    controller.enqueue(chunk);
                });
                nodeStream.on('end', () => {
                    controller.close();
                });
                nodeStream.on('error', (err) => {
                    controller.error(err);
                });
            }
        });

        // Return the video as a streaming response
        const headers = new Headers({
            'Content-Type': mimeType,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'private, max-age=3600',
        });
        if (fileSize > 0) {
            headers.set('Content-Length', String(fileSize));
        }

        return new Response(webStream, { status: 200, headers });

    } catch (error) {
        console.error('=== Stream Recording Error ===');
        console.error('Error:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
