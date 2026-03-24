import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { google } from 'npm:googleapis@134.0.0';

async function getImpersonatedAuth() {
    const serviceAccountEmail = Deno.env.get('SERVICE_ACCOUNT_EMAIL');
    let serviceAccountKey = Deno.env.get('SERVICE_ACCOUNT_KEY');
    const hostUser = Deno.env.get('MEET_HOST_USER');

    if (!serviceAccountEmail || !serviceAccountKey || !hostUser) {
        throw new Error('Missing service account credentials');
    }

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

    const scopes = [
        'https://www.googleapis.com/auth/meetings.space.readonly',
        'https://www.googleapis.com/auth/meetings.space.created',
        'https://www.googleapis.com/auth/drive.readonly'
    ];

    const auth = new google.auth.JWT({
        email: serviceAccountEmail,
        key: serviceAccountKey,
        scopes,
        subject: hostUser
    });

    return auth;
}

Deno.serve(async (req) => {
    try {
        console.log('=== Subscribe to Workspace Events for Google Meet ===');

        const pubsubTopic = Deno.env.get('PUBSUB_TOPIC');
        if (!pubsubTopic) {
            return Response.json({ error: 'Missing PUBSUB_TOPIC secret' }, { status: 500 });
        }

        const auth = await getImpersonatedAuth();
        const accessToken = await auth.getAccessToken();

        const targetUserId = Deno.env.get('WSE_TARGET_USER_ID');
        if (!targetUserId) {
            return Response.json({ error: 'Missing WSE_TARGET_USER_ID secret' }, { status: 500 });
        }

        // Step 1: Delete the known existing subscription directly by name
        // Then also try listing and deleting any others
        let deletedCount = 0;
        const knownSubNames = [
            'subscriptions/meet-users-5ed80e14-5e5b-40b0-b25b-3473f782eb8e'
        ];

        for (const subName of knownSubNames) {
            try {
                console.log('Deleting known subscription:', subName);
                const delRes = await fetch(`https://workspaceevents.googleapis.com/v1/${subName}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${accessToken.token}` }
                });
                const delBody = await delRes.text();
                console.log('Delete response:', delRes.status, delBody);
                if (delRes.ok || delRes.status === 200) deletedCount++;
            } catch (e) {
                console.log('Delete error for', subName, ':', e.message);
            }
        }

        // Also try listing and deleting any others
        try {
            const listResponse = await fetch('https://workspaceevents.googleapis.com/v1/subscriptions', {
                headers: { 'Authorization': `Bearer ${accessToken.token}` }
            });
            if (listResponse.ok) {
                const listResult = await listResponse.json();
                const allSubs = listResult.subscriptions || [];
                console.log('Found', allSubs.length, 'subscriptions via list');
                for (const sub of allSubs) {
                    if (!knownSubNames.includes(sub.name)) {
                        console.log('Deleting listed subscription:', sub.name);
                        await fetch(`https://workspaceevents.googleapis.com/v1/${sub.name}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${accessToken.token}` }
                        });
                        deletedCount++;
                    }
                }
            }
        } catch (e) {
            console.log('List/delete error:', e.message);
        }

        // Wait for deletions to propagate
        if (deletedCount > 0) {
            console.log('Deleted', deletedCount, 'subscriptions, waiting 5s...');
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        // Step 2: Create new subscription with ALL 4 event types
        const requestBody = {
            target_resource: `//cloudidentity.googleapis.com/users/${targetUserId}`,
            event_types: [
                'google.workspace.meet.conference.v2.started',
                'google.workspace.meet.conference.v2.ended',
                'google.workspace.meet.recording.v2.fileGenerated',
                'google.workspace.meet.transcript.v2.fileGenerated'
            ],
            notification_endpoint: {
                pubsub_topic: pubsubTopic
            }
        };

        console.log('Creating subscription:', JSON.stringify(requestBody, null, 2));

        const response = await fetch('https://workspaceevents.googleapis.com/v1/subscriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Subscription error:', JSON.stringify(result));
            return Response.json({
                ok: false,
                error: result.error?.message || 'Failed to create subscription',
                deletedOldSubscriptions: deletedCount,
                details: result
            }, { status: response.status });
        }

        console.log('Subscription created:', JSON.stringify(result));

        return Response.json({
            ok: true,
            subscription: result,
            event_types: requestBody.event_types,
            deletedOldSubscriptions: deletedCount,
            targetResource: requestBody.target_resource,
            pubsubTopic
        });

    } catch (error) {
        console.error('=== Subscription Error ===');
        console.error('Error:', error.message);
        return Response.json({ ok: false, error: error.message }, { status: 500 });
    }
});