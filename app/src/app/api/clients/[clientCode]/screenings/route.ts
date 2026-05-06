/**
 * GET /api/clients/[clientCode]/screenings
 *
 * Returns the client's screening assignments (with completion state +
 * scores), per-item responses, and the latest intake note. Used by the
 * therapist-side ScreeningResultsList component on the client profile
 * + start-session screens.
 *
 * Auth: dbGetClientProfile is implicitly therapist-scoped (filters by
 * the current therapist_id) — so a therapist can only see their own
 * clients' screenings.
 */

import { NextResponse } from 'next/server';
import { dbGetClientProfile } from '@/lib/supabase/db';
import { getScreeningsForClient, getIntakeNoteForClient } from '@/lib/screening/db';
import { getInstrument } from '@/lib/screening/catalog';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clientCode: string }> },
) {
  const { clientCode } = await params;

  const client = await dbGetClientProfile(clientCode);
  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  const [assignments, intake] = await Promise.all([
    getScreeningsForClient(client.client_id),
    getIntakeNoteForClient(client.client_id),
  ]);

  // Hydrate each assignment with the catalog metadata so the UI can
  // render item text + scale labels without a second fetch.
  const enriched = assignments.map((a) => {
    const inst = getInstrument(a.instrumentId);
    return {
      assignmentId: a.id,
      instrumentId: a.instrumentId,
      instrumentName: inst?.name ?? a.instrumentId,
      instrumentFullName: inst?.fullName ?? a.instrumentId,
      category: inst?.category ?? null,
      required: a.required,
      assignedAt: a.assignedAt.toISOString(),
      completedAt: a.completedAt?.toISOString() ?? null,
      totalScore: a.totalScore,
      subscaleScores: a.subscaleScores,
      severity: a.severity,
      flags: a.flags,
      // Item metadata + the patient's response value (or null if unanswered).
      items: inst?.items.map((it) => ({
        id: it.id,
        text: it.text,
        scale: it.scale ?? inst.defaultScale ?? [],
        sentinel: it.sentinel,
        reverseScored: it.reverseScored,
        conditional: it.conditional,
        value: a.responses[it.id] ?? null,
      })) ?? [],
      // Top-level severity bands so the UI can color-code without
      // reaching into the catalog.
      bands: inst?.bands ?? [],
      perSubscale: inst?.subscales?.map((s) => ({
        id: s.id,
        name: s.name,
        bands: s.bands,
      })) ?? [],
    };
  });

  return NextResponse.json({
    assignments: enriched,
    intake: intake
      ? {
          textContent: intake.textContent,
          audioStoragePath: intake.audioStoragePath,
          audioTranscript: intake.audioTranscript,
          audioDurationSeconds: intake.audioDurationSeconds,
          createdAt: intake.createdAt.toISOString(),
        }
      : null,
  });
}
