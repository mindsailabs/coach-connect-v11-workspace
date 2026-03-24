import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if Tony Robinson already exists
        const existing = await base44.entities.Contact.list();
        const alreadyExists = existing.some(
            (c: any) => c.full_name === 'Tony Robinson'
        );

        if (alreadyExists) {
            return Response.json({
                success: false,
                message: 'Tony Robinson already exists — skipping creation'
            });
        }

        // Create test contact with fields matching the Contact entity schema
        const contact = await base44.entities.Contact.create({
            full_name: 'Tony Robinson',
            email: 'tony.robinson@example.com',
            phone: '+44 7700 900123',
            contact_type: 'Client',
            status: 'active',
            gender: 'Male',
            date_of_birth: '1985-03-12',
            address: '42 Kensington High Street, London W8 4PT',
            emergency_contact: 'Laura Robinson',
            emergency_phone: '+44 7700 900456',
            registered_date: new Date().toISOString().split('T')[0],
            preferred_contact_method: 'Email, Phone Call',
            preferred_support_type: 'Accountability, Education',
            focus_areas: 'Weight loss, Stress, Sleep',
            contact_source: 'Referral',
            referred_by: 'Sarah Mitchell',
            tags: 'New Client, Evening',
            health_goals: 'Lose 10kg over the next 6 months, manage work-related stress through mindfulness and exercise, improve sleep quality by establishing a consistent evening routine.',
            notes: 'Tony is a 41-year-old software engineer relocating from Manchester. He has a sedentary desk job and recently received a wake-up call from his GP about elevated cholesterol. Highly motivated but needs structured guidance. Prefers evening sessions after 6 PM. No major injuries but reports occasional knee discomfort from an old football injury. Test contact created to verify GitHub → Base44 integration pipeline.'
        });

        return Response.json({
            success: true,
            message: 'Test contact Tony Robinson created successfully',
            contact_id: contact.id,
            contact
        });

    } catch (error) {
        console.error('seedTestContact error:', error.message);
        return Response.json({
            error: error.message || 'Failed to create test contact'
        }, { status: 500 });
    }
});
