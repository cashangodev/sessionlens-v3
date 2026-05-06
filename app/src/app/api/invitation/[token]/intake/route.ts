/**
 * POST /api/invitation/[token]/intake
 *   Body: { textContent?: string }
 *   Stores the patient's intake note (text only for now; voice comes once
 *   we wire the journal audio storage). One row per submission.
 */

import { NextResponse } from 'next/server';
import { verifyInvitationToken } from '@/lib/screening/invitation';
import { getInvitationById, createIntakeNote } from '@/lib/screening/db';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  let payload;
  try {
    payload = verifyInvitationToken(token);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid token';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const invitation = await getInvitationById(payload.invitationId);
  if (!invitation) {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
  }
  if (invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 });
  }

  let body: { textContent?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const text = body.textContent?.trim();
  if (!text) {
    return NextResponse.json({ error: 'Intake text is empty' }, { status: 400 });
  }

  const id = await createIntakeNote({
    clientId: invitation.clientId,
    therapistId: invitation.therapistId,
    invitationId: invitation.id,
    textContent: text,
  });

  return NextResponse.json({ success: true, id });
}
