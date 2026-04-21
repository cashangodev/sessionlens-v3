import { NextResponse } from 'next/server';
import { dbGetClientProfile, dbUpsertClientProfile, dbGetSessionsByClient } from '@/lib/supabase/db';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clientCode: string }> }
) {
  const { clientCode } = await params;
  try {
    const profile = await dbGetClientProfile(decodeURIComponent(clientCode));
    if (!profile) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const sessions = await dbGetSessionsByClient(decodeURIComponent(clientCode));

    return NextResponse.json({
      profile: {
        clientCode: profile.client_code,
        gender: profile.gender,
        ageRange: profile.age_range,
        treatmentGoals: profile.treatment_goals,
        presentingConcerns: profile.presenting_concerns,
        diagnosticConsiderations: profile.diagnostic_considerations,
        currentRiskLevel: profile.current_risk_level,
        keyThemes: profile.key_themes,
        dominantStructures: profile.dominant_structures,
        preferredApproach: profile.preferred_approach,
        clinicalNotes: profile.clinical_notes,
        totalSessions: profile.total_sessions,
        isConfirmed: profile.is_confirmed,
        lastConfirmedAt: profile.last_confirmed_at,
        createdAt: profile.created_at,
        outcomeTrackingEnabled: profile.outcome_tracking_enabled ?? false,
        outcomeScores: profile.outcome_scores ?? [],
      },
      sessions,
    });
  } catch (error) {
    console.error('GET /api/clients/[clientCode] error:', error);
    return NextResponse.json({ error: 'Failed to get client' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ clientCode: string }> }
) {
  const { clientCode } = await params;
  try {
    const body = await req.json();
    const updated = await dbUpsertClientProfile({
      clientCode: decodeURIComponent(clientCode),
      ...body,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/clients/[clientCode] error:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}
