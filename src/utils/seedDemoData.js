import { Contact } from '@/components/api/entities';

const JAMES_KENNEDY = {
  full_name: 'James Kennedy',
  email: 'james.kennedy@example.com',
  phone: '+1 (555) 234-8901',
  contact_type: 'Client',
  status: 'active',
  gender: 'Male',
  date_of_birth: '1988-06-15',
  emergency_contact: 'Sarah Kennedy - +1 (555) 234-8902',
  health_goals: 'Improve overall fitness, reduce stress levels, build sustainable healthy habits, and achieve better work-life balance.',
  notes: 'James is a marketing director who works long hours. He is highly motivated but struggles with consistency due to his demanding schedule. Prefers morning sessions before work. Has a history of lower back pain from prolonged sitting.',
  preferred_contact_method: 'Email, SMS',
  preferred_support_type: 'Accountability, Structure',
  focus_areas: 'Stress, Sleep, Weight loss',
  tags: 'VIP, Morning',
  contact_source: 'Person',
  referred_by: 'Michael Torres',
  registered_date: '2025-11-10',
};

const TONY_ROBINSON = {
  full_name: 'Tony Robinson',
  email: 'tony.robinson@example.com',
  phone: '+44 7700 900123',
  contact_type: 'Client',
  status: 'active',
  gender: 'Male',
  date_of_birth: '1975-03-22',
  emergency_contact: 'Linda Robinson - +44 7700 900124',
  health_goals: 'Weight management, stress reduction, better sleep quality, and improving cardiovascular fitness.',
  notes: 'Tony is a software engineer based in London. Works remotely and tends to be sedentary. Very analytical and responds well to data-driven coaching. Prefers evening sessions after work. Test contact created to verify GitHub-to-Base44 integration pipeline.',
  preferred_contact_method: 'Email',
  preferred_support_type: 'Data-driven, Goal-setting',
  focus_areas: 'Weight, Stress, Sleep',
  tags: 'Evening, Tech',
  contact_source: 'Person',
  referred_by: 'James Kennedy',
  registered_date: '2026-03-24',
};

export async function seedJamesKennedy() {
  try {
    const existing = await Contact.list();
    const alreadyExists = existing.some(
      (c) => c.full_name === 'James Kennedy'
    );
    if (alreadyExists) {
      console.log('[Seed] James Kennedy already exists, skipping.');
      return null;
    }
    const created = await Contact.create(JAMES_KENNEDY);
    console.log('[Seed] Created test contact: James Kennedy', created);
    return created;
  } catch (err) {
    console.error('[Seed] Failed to create James Kennedy:', err);
    return null;
  }
}

export async function seedTonyRobinson() {
  try {
    const existing = await Contact.list();
    const alreadyExists = existing.some(
      (c) => c.full_name === 'Tony Robinson'
    );
    if (alreadyExists) {
      console.log('[Seed] Tony Robinson already exists, skipping.');
      return null;
    }
    const created = await Contact.create(TONY_ROBINSON);
    console.log('[Seed] Created test contact: Tony Robinson', created);
    return created;
  } catch (err) {
    console.error('[Seed] Failed to create Tony Robinson:', err);
    return null;
  }
}
