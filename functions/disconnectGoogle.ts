import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Read current user record to see what fields exist
        const userRecord = await base44.asServiceRole.entities.User.get(user.id);
        console.log('Current user google fields:', JSON.stringify({
            google_connected: userRecord?.google_connected,
            has_access_token: !!userRecord?.google_access_token,
            has_refresh_token: !!userRecord?.google_refresh_token,
            google_token_expiry: userRecord?.google_token_expiry,
        }));

        // Clear all Google-related fields
        const updateData = {
            google_access_token: '',
            google_refresh_token: '',
            google_token_expiry: '',
            google_connected: false,
        };

        console.log('Updating user with:', JSON.stringify(updateData));
        await base44.asServiceRole.entities.User.update(user.id, updateData);

        // Verify the update
        const updatedUser = await base44.asServiceRole.entities.User.get(user.id);
        console.log('After update google_connected:', updatedUser?.google_connected);

        return Response.json({ 
            success: true, 
            google_connected_after: updatedUser?.google_connected 
        });
    } catch (error) {
        console.error('Disconnect error:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
});