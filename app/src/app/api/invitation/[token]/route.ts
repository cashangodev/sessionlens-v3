/**
 * GET /api/invitation/[token]
 *
 * Resolves a signed invitation token from the email link and returns
 * everything the welcome page needs to render: therapist name (so the
 * patient sees who sent them), assignment list with completion state,
 * and whether the intake prompt is offered.
 *
 * Side effect: marks the invitation as "opened" the first time it's
 * resolved (idempotent — only fires when opened_at is null).
 */

import { NextResponse } from 'next/server';
import {
  verifyInvitationToken,
} from '@/lib/screening/invitation';
import {
  getInvitationById,
  getAssignmentsForInvitation,
  getTherapistSettings,
  markInvitationOpened,
  getIntakeNoteForInvitation,
} from '@/lib/screening/db';
import { getInstrument } from '@/lib/screening/catalog';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
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

  if (invitation.status === 'expired' || invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 });
  }

  // Mark opened (no-op if already opened).
  if (!invitation.openedAt) {
    await markInvitationOpened(invitation.id);
  }

  const [assignments, settings, intakeNote] = await Promise.all([
    getAssignmentsForInvitation(invitation.id),
    getTherapistSettings(invitation.therapistId),
    getIntakeNoteForInvitation(invitation.id),
  ]);

  // Hydrate each assignment with the instrument's display fields. Items
  // are NOT sent in this list response — patient fetches per-instrument
  // when they actually start a specific screening.
  const enriched = assignments.map((a) => {
    const inst = getInstrument(a.instrumentId);
    return {
      assignmentId: a.id,
      instrumentId: a.instrumentId,
      instrumentName: inst?.name ?? a.instrumentId,
      instrumentFullName: inst?.fullName ?? a.instrumentId,
      description: inst?.description,
      estimatedMinutes: inst?.estimatedMinutes ?? null,
      required: a.required,
      completed: a.completedAt !== null,
      severity: a.severity,
    };
  });

  return NextResponse.json({
    invitation: {
      id: invitation.id,
      status: invitation.status,
      expiresAt: invitation.expiresAt.toISOString(),
    },
    therapist: {
      displayName: settings?.displayName ?? null,
    },
    assignments: enriched,
    // Intake prompt is offered to every patient by default; required flag
    // will be wired in once the new-client form (phase 5) supports it.
    intake: {
      offered: true,
      required: false,
      completed: intakeNote !== null,
    },
  });
}
