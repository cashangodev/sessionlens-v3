/**
 * GET  /api/invitation/[token]/screening/[assignmentId]
 *   Returns the instrument's items + scales so the client can render the form.
 *
 * POST /api/invitation/[token]/screening/[assignmentId]
 *   Body: { responses: Record<itemId, number> }
 *   Validates the token + assignment, scores against the catalog,
 *   persists responses + assignment result, and (if PHQ-9 q9 is endorsed)
 *   auto-creates a C-SSRS assignment for the same client.
 */

import { NextResponse } from 'next/server';
import { verifyInvitationToken } from '@/lib/screening/invitation';
import {
  getInvitationById,
  getAssignmentsForInvitation,
  recordResponses,
  recordAssignmentResult,
  createAssignment,
} from '@/lib/screening/db';
import { getInstrumentOrThrow } from '@/lib/screening/catalog';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string; assignmentId: string }> },
) {
  const { token, assignmentId } = await params;
  const auth = await authorize(token, assignmentId);
  if ('error' in auth) return auth.error;

  const inst = getInstrumentOrThrow(auth.assignment.instrumentId);
  return NextResponse.json({
    assignmentId,
    instrument: {
      id: inst.id,
      name: inst.name,
      fullName: inst.fullName,
      description: inst.description,
      recallPeriod: inst.recallPeriod,
      introduction: inst.introduction,
      defaultScale: inst.defaultScale,
      estimatedMinutes: inst.estimatedMinutes,
      items: inst.items.map((it) => ({
        id: it.id,
        text: it.text,
        scale: it.scale,
        reverseScored: it.reverseScored,
        conditional: it.conditional,
        sentinel: it.sentinel,
      })),
    },
    completed: auth.assignment.completedAt !== null,
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string; assignmentId: string }> },
) {
  const { token, assignmentId } = await params;
  const auth = await authorize(token, assignmentId);
  if ('error' in auth) return auth.error;

  if (auth.assignment.completedAt) {
    return NextResponse.json({ error: 'Already completed' }, { status: 409 });
  }

  let body: { responses?: Record<string, number> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const responses = body.responses ?? {};
  if (Object.keys(responses).length === 0) {
    return NextResponse.json({ error: 'No responses provided' }, { status: 400 });
  }

  const inst = getInstrumentOrThrow(auth.assignment.instrumentId);

  // Required-item check: every required (non-conditional) item must have
  // a response. Conditional items are only required when their gate fires.
  for (const item of inst.items) {
    const cond = item.conditional;
    const skipBecauseConditionalGateClosed =
      cond && (responses[cond.showIfItemId] ?? 0) < cond.minValue;
    if (skipBecauseConditionalGateClosed) continue;
    if (responses[item.id] === undefined) {
      return NextResponse.json(
        { error: `Missing response for item ${item.id}` },
        { status: 400 },
      );
    }
  }

  const result = inst.score(responses);

  await Promise.all([
    recordResponses({ assignmentId, responses }),
    recordAssignmentResult({ assignmentId, result }),
  ]);

  // Auto-trigger C-SSRS if PHQ-9 q9 is endorsed and a C-SSRS hasn't already
  // been assigned in this invitation.
  let autoAddedCSSRS = false;
  if (result.flags.includes('suicide_ideation_endorsed')) {
    const existing = await getAssignmentsForInvitation(auth.invitation.id);
    const hasCSSRS = existing.some((a) => a.instrumentId === 'cssrs');
    if (!hasCSSRS) {
      await createAssignment({
        clientId: auth.invitation.clientId,
        therapistId: auth.invitation.therapistId,
        invitationId: auth.invitation.id,
        instrumentId: 'cssrs',
        required: true,
      });
      autoAddedCSSRS = true;
    }
  }

  return NextResponse.json({
    success: true,
    score: {
      total: result.total,
      severity: result.severity,
      severityLabel: result.severityLabel,
    },
    autoAddedCSSRS,
  });
}

async function authorize(token: string, assignmentId: string) {
  let payload;
  try {
    payload = verifyInvitationToken(token);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid token';
    return { error: NextResponse.json({ error: message }, { status: 400 }) };
  }

  const invitation = await getInvitationById(payload.invitationId);
  if (!invitation) {
    return { error: NextResponse.json({ error: 'Invitation not found' }, { status: 404 }) };
  }
  if (invitation.expiresAt < new Date()) {
    return { error: NextResponse.json({ error: 'Invitation has expired' }, { status: 410 }) };
  }

  const assignments = await getAssignmentsForInvitation(invitation.id);
  const assignment = assignments.find((a) => a.id === assignmentId);
  if (!assignment) {
    return { error: NextResponse.json({ error: 'Assignment not found' }, { status: 404 }) };
  }

  return { invitation, assignment };
}
