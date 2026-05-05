import { NextResponse } from 'next/server';
import { dbGetSession, dbUpdateSessionAnalysis, dbUpsertClientProfile, dbGetClientProfile } from '@/lib/supabase/db';
import { analyzeSession } from '@/lib/analysis/transcript-analyzer';
import { extractProfileFromAnalysis } from '@/lib/client-profile';
import type { AnalysisResult } from '@/types';

// The analysis pipeline runs multiple OpenAI calls (structure coding per
// moment, risk detection, report generation) plus embedding + Supabase RPC
// calls. End-to-end is 20-50s in production. Vercel's default function
// timeout is 10s on Hobby / 15s on Pro — both kill the request mid-flight,
// surfacing as a generic 500 to the client. 60s is the Hobby ceiling.
export const maxDuration = 60;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  // TEMP DIAGNOSTIC: stage + error are surfaced in the JSON response so we
  // can see WHERE the pipeline dies without chasing collapsed Vercel logs.
  // Revert to the generic message once we've isolated the failure.
  let stage = 'init';
  try {
    stage = 'fetch_session';
    const session = await dbGetSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    if (!session.transcript) {
      return NextResponse.json({ error: 'No transcript to analyze' }, { status: 400 });
    }

    stage = 'analyze';
    console.log('[analyze] Starting analysis for session:', sessionId, 'transcript length:', session.transcript.length);
    const analysisResult = await analyzeSession({
      transcript: session.transcript,
      treatmentGoals: session.treatmentGoals,
      sessionNumber: session.sessionNumber,
    });
    console.log('[analyze] Analysis complete. Moments:', analysisResult.moments.length, 'SimilarCases:', analysisResult.similarCases.length, 'PractitionerMatches:', analysisResult.practitionerMatches.length);

    stage = 'serialize';
    const serialized = JSON.parse(JSON.stringify(analysisResult));

    stage = 'persist_session_analysis';
    const updated = await dbUpdateSessionAnalysis(sessionId, serialized);
    if (!updated) {
      return NextResponse.json({ error: 'Failed to store analysis', stage }, { status: 500 });
    }

    stage = 'extract_profile';
    const profile = extractProfileFromAnalysis(
      session.clientCode,
      session.transcript,
      analysisResult as AnalysisResult,
      session.treatmentGoals
    );

    stage = 'fetch_existing_profile';
    const existingDb = await dbGetClientProfile(session.clientCode);

    stage = 'upsert_profile';
    await dbUpsertClientProfile({
      clientCode: session.clientCode,
      gender: existingDb?.gender || '',
      ageRange: existingDb?.age_range || '',
      treatmentGoals: profile.treatmentGoals,
      presentingConcerns: profile.presentingConcerns,
      diagnosticConsiderations: profile.diagnosticConsiderations,
      currentRiskLevel: profile.currentRiskLevel,
      keyThemes: profile.keyThemes,
      dominantStructures: profile.dominantStructures as string[],
      preferredApproach: profile.preferredApproach,
      clinicalNotes: existingDb?.clinical_notes || profile.clinicalNotes,
      totalSessions: profile.totalSessions,
      isConfirmed: existingDb?.is_confirmed || false,
    });

    return NextResponse.json({
      sessionId,
      status: 'complete',
      analysisResult,
    });
  } catch (error) {
    console.error('POST /api/sessions/[sessionId]/analyze error at stage:', stage, error);
    const message = error instanceof Error ? error.message : String(error);
    const name = error instanceof Error ? error.name : 'Error';
    const stack = error instanceof Error && error.stack
      ? error.stack.split('\n').slice(0, 6).join('\n')
      : undefined;
    return NextResponse.json(
      { error: 'Analysis failed', stage, name, message, stack },
      { status: 500 },
    );
  }
}
