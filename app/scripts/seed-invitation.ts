/**
 * Seed a test invitation pointing at an existing client, with PHQ-9
 * (required) and GAD-7 (optional) attached, plus an intake prompt.
 * Prints the localhost URL the patient would open from the email.
 *
 * Usage: npx tsx scripts/seed-invitation.ts [--base http://localhost:3000]
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';
import {
  generateInvitationTokenValue,
  signInvitationToken,
} from '@/lib/screening/invitation';

async function main() {
  const baseIdx = process.argv.indexOf('--base');
  const baseUrl = baseIdx >= 0 ? process.argv[baseIdx + 1] : 'http://localhost:3000';

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // Pick the most recent existing client.
  const { data: clients, error: cErr } = await supabase
    .from('clients')
    .select('client_id, therapist_id, client_code, display_name')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1);
  if (cErr || !clients?.length) {
    console.error('No client found to attach invitation to.', cErr);
    process.exit(1);
  }
  const client = clients[0];
  console.log('using client:', client.client_code, '/', client.client_id);

  const tokenValue = generateInvitationTokenValue();
  const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);

  // Create invitation
  const { data: inv, error: iErr } = await supabase
    .from('client_invitations')
    .insert({
      client_id: client.client_id,
      therapist_id: client.therapist_id,
      token: tokenValue,
      email: 'contact@cashango.com',
      delivery_method: 'email',
      expires_at: expiresAt.toISOString(),
    })
    .select('id')
    .single();
  if (iErr || !inv) {
    console.error('Insert invitation failed:', iErr);
    process.exit(1);
  }

  // Create assignments: PHQ-9 required, GAD-7 optional
  const { error: aErr } = await supabase.from('screening_assignments').insert([
    { client_id: client.client_id, therapist_id: client.therapist_id, invitation_id: inv.id, instrument_id: 'phq9', required: true },
    { client_id: client.client_id, therapist_id: client.therapist_id, invitation_id: inv.id, instrument_id: 'gad7', required: false },
  ]);
  if (aErr) {
    console.error('Insert assignments failed:', aErr);
    process.exit(1);
  }

  // Therapist settings — give the doctor a display name so the welcome page reads nicely
  await supabase.from('therapist_settings').upsert({
    therapist_id: client.therapist_id,
    display_name: 'Dr. Smith',
    reply_to_email: 'contact@cashango.com',
  });

  const signed = signInvitationToken(inv.id, expiresAt);
  const url = `${baseUrl}/journal/welcome/${signed}`;

  console.log('\n=== TEST INVITATION ===');
  console.log('invitation_id:', inv.id);
  console.log('expires_at   :', expiresAt.toISOString());
  console.log('\nopen this URL:\n  ', url, '\n');
}

main().catch((err) => { console.error(err); process.exit(1); });
