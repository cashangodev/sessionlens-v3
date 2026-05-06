/**
 * Quick smoke test for the screening engine + email plumbing.
 *
 * 1. Walks every instrument in the catalog, hands it a synthetic response
 *    set, and confirms .score() returns a coherent ScoringResult.
 * 2. If RESEND_API_KEY is set in .env.local AND --send is passed, fires a
 *    real test invitation email to the address in --to.
 *
 * Usage:
 *   npx tsx scripts/test-screening.ts                      # scoring only
 *   npx tsx scripts/test-screening.ts --send --to me@x.com # also send email
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { ALL_INSTRUMENTS, PHQ9, GAD7 } from '@/lib/screening/catalog';
import { buildInvitationEmail } from '@/lib/screening/invitation-email';
import { signInvitationToken, generateInvitationTokenValue } from '@/lib/screening/invitation';
import { isEmailConfigured, sendEmail } from '@/lib/email/resend';
import { randomUUID } from 'crypto';

function header(s: string) { console.log(`\n=== ${s} ===`); }

async function main() {
  header('SCORING SMOKE TEST');
  for (const inst of ALL_INSTRUMENTS) {
    // Synthesize a moderate-severity response set: midpoint of each scale.
    const responses: Record<string, number> = {};
    for (const item of inst.items) {
      const scale = item.scale ?? inst.defaultScale ?? [];
      if (scale.length === 0) continue;
      const mid = scale[Math.floor(scale.length / 2)].value;
      responses[item.id] = mid;
    }
    const r = inst.score(responses);
    console.log(`${inst.id.padEnd(8)} total=${String(r.total).padStart(3)} severity=${r.severity.padEnd(20)} flags=${r.flags.length}`);
  }

  header('PHQ-9 q9 = 1 → flags should include suicide_ideation_endorsed');
  const phq9 = PHQ9.score({
    phq9_1: 0, phq9_2: 0, phq9_3: 0, phq9_4: 0, phq9_5: 0,
    phq9_6: 0, phq9_7: 0, phq9_8: 0, phq9_9: 1,
  });
  console.log('flags:', phq9.flags);
  if (!phq9.flags.includes('suicide_ideation_endorsed')) {
    console.error('  ✗ MISSING — auto-trigger logic is broken');
    process.exit(1);
  }
  console.log('  ✓ ok');

  header('GAD-7 minimum / maximum sanity');
  const gMin = GAD7.score({ gad7_1: 0, gad7_2: 0, gad7_3: 0, gad7_4: 0, gad7_5: 0, gad7_6: 0, gad7_7: 0 });
  const gMax = GAD7.score({ gad7_1: 3, gad7_2: 3, gad7_3: 3, gad7_4: 3, gad7_5: 3, gad7_6: 3, gad7_7: 3 });
  console.log(`min: total=${gMin.total} (expect 0)  severity=${gMin.severity}`);
  console.log(`max: total=${gMax.total} (expect 21) severity=${gMax.severity}`);
  if (gMin.total !== 0 || gMax.total !== 21) { console.error('  ✗ scoring drift'); process.exit(1); }
  console.log('  ✓ ok');

  header('TOKEN ROUND-TRIP');
  process.env.INVITE_SIGNING_SECRET = process.env.INVITE_SIGNING_SECRET ||
    'local-dev-secret-32-bytes-or-more-please';
  const id = randomUUID();
  const token = signInvitationToken(id, new Date(Date.now() + 7 * 24 * 3600 * 1000));
  const { verifyInvitationToken } = await import('@/lib/screening/invitation');
  const back = verifyInvitationToken(token);
  if (back.invitationId !== id) { console.error('  ✗ token mismatch'); process.exit(1); }
  console.log(`  token len=${token.length}, round-tripped invitation_id ok`);

  header('INVITATION TOKEN VALUE (DB column)');
  console.log('  sample:', generateInvitationTokenValue());

  header('EMAIL TEMPLATE PREVIEW (no send)');
  const sample = buildInvitationEmail({
    patientFirstName: 'Alex',
    therapistName: 'Dr. Smith',
    inviteUrl: `https://sessionpolaris.com/journal/welcome/${token}`,
    instruments: [
      { instrument: PHQ9, required: true },
      { instrument: GAD7, required: false },
    ],
    intakeIncluded: true,
    intakeRequired: false,
  });
  console.log(`subject: ${sample.subject}`);
  console.log(`text body (first 200 chars): ${sample.text.slice(0, 200)}...`);

  // ─── optional: send a real email ──────────────────────────────────────
  const argv = process.argv.slice(2);
  const sendIdx = argv.indexOf('--send');
  if (sendIdx === -1) {
    console.log('\nSkipping live email send. Pass --send --to <email> to fire a real test.');
    return;
  }
  const toIdx = argv.indexOf('--to');
  const to = toIdx >= 0 ? argv[toIdx + 1] : undefined;
  if (!to) { console.error('--send requires --to <email>'); process.exit(1); }
  if (!isEmailConfigured()) {
    console.error('RESEND_API_KEY is not set. Add it to .env.local first.');
    process.exit(1);
  }

  header('SENDING REAL EMAIL via Resend');
  const result = await sendEmail({
    to,
    subject: sample.subject,
    html: sample.html,
    text: sample.text,
    senderName: 'Dr. Smith',
    replyTo: 'reply-to-doctor@example.com',
  });
  console.log(`  sent. message id: ${result.id}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
