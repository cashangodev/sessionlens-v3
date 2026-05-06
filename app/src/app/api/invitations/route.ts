/**
 * POST /api/invitations
 *
 * Therapist-side: creates a client_invitation + screening_assignments,
 * then fires the welcome email via Resend.
 *
 * Body:
 *   {
 *     clientCode: string;        // existing client
 *     instruments: { id: string; required: boolean }[];
 *     intakeIncluded?: boolean;  // future: required-toggle for intake
 *   }
 *
 * Auth: dbGetClientProfile is therapist-scoped, so a therapist can only
 * create invites for their own clients.
 */

import { NextResponse } from 'next/server';
import { dbGetClientProfile, getTherapistId } from '@/lib/supabase/db';
import {
  createInvitation,
  createAssignment,
  getTherapistSettings,
  markInvitationSent,
} from '@/lib/screening/db';
import {
  generateInvitationTokenValue,
  signInvitationToken,
} from '@/lib/screening/invitation';
import { buildInvitationEmail } from '@/lib/screening/invitation-email';
import { sendEmail, isEmailConfigured } from '@/lib/email/resend';
import { getInstrumentOrThrow } from '@/lib/screening/catalog';

export const dynamic = 'force-dynamic';

interface InviteBody {
  clientCode?: string;
  instruments?: { id: string; required: boolean }[];
}

function resolveBaseUrl(req: Request): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  // Use the forwarded host so localhost dev / preview / prod all derive
  // the right URL without an env var.
  const proto = req.headers.get('x-forwarded-proto') ?? 'https';
  const host = req.headers.get('x-forwarded-host')
    ?? req.headers.get('host')
    ?? 'sessionpolaris.com';
  return `${proto}://${host}`;
}

export async function POST(req: Request) {
  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: 'Email is not configured (RESEND_API_KEY missing)' },
      { status: 500 },
    );
  }

  let body: InviteBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const clientCode = body.clientCode?.trim();
  if (!clientCode) {
    return NextResponse.json({ error: 'clientCode is required' }, { status: 400 });
  }

  const instruments = body.instruments ?? [];
  if (instruments.length === 0) {
    return NextResponse.json({ error: 'Pick at least one screening instrument' }, { status: 400 });
  }

  // Validate instrument ids against the catalog up front so a typo doesn't
  // create a half-finished invitation we have to clean up later.
  for (const i of instruments) {
    try { getInstrumentOrThrow(i.id); }
    catch { return NextResponse.json({ error: `Unknown instrument: ${i.id}` }, { status: 400 }); }
  }

  // dbGetClientProfile filters by therapist_id (current Clerk user) so this
  // doubles as the auth check. Returns null if the therapist doesn't own
  // the client or it doesn't exist.
  const client = await dbGetClientProfile(clientCode);
  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }
  if (!client.email?.trim()) {
    return NextResponse.json(
      { error: 'Client has no email on file. Add one before sending an invitation.' },
      { status: 400 },
    );
  }

  const therapistId = await getTherapistId();
  const settings = await getTherapistSettings(therapistId);

  // Reply-to: prefer the therapist's saved setting, fall back to Clerk
  // session email (auth().sessionClaims). Without one of these, replies
  // would dead-end at noreply@ — that's a worse experience than telling
  // them once to set it. For now, fall back to a reasonable default.
  const replyToEmail = settings?.replyToEmail?.trim() || undefined;
  const senderName = settings?.displayName?.trim() || 'Your therapist';

  // 1. Create the invitation row
  const tokenValue = generateInvitationTokenValue();
  const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  const invitation = await createInvitation({
    clientId: client.client_id,
    therapistId,
    email: client.email,
    deliveryMethod: 'email',
    tokenValue,
    expiresAt,
  });

  // 2. Create assignments for each picked instrument
  const createdInstruments = [] as { instrument: ReturnType<typeof getInstrumentOrThrow>; required: boolean }[];
  for (const i of instruments) {
    const inst = getInstrumentOrThrow(i.id);
    await createAssignment({
      clientId: client.client_id,
      therapistId,
      invitationId: invitation.id,
      instrumentId: i.id,
      required: i.required,
    });
    createdInstruments.push({ instrument: inst, required: i.required });
  }

  // 3. Send the email
  const signed = signInvitationToken(invitation.id, expiresAt);
  const baseUrl = resolveBaseUrl(req);
  const inviteUrl = `${baseUrl}/journal/welcome/${signed}`;

  const { html, text, subject } = buildInvitationEmail({
    therapistName: senderName,
    inviteUrl,
    instruments: createdInstruments,
    intakeIncluded: true,
    intakeRequired: false,
  });

  try {
    await sendEmail({
      to: client.email,
      subject,
      html,
      text,
      senderName,
      replyTo: replyToEmail,
    });
    await markInvitationSent(invitation.id);
  } catch (e) {
    console.error('[invitations] sendEmail failed:', e);
    return NextResponse.json(
      {
        error: 'Invitation created but email failed to send. The invitation link is still valid.',
        invitationId: invitation.id,
        inviteUrl,
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    success: true,
    invitationId: invitation.id,
    inviteUrl,
    sentTo: client.email,
  });
}
