import { NextResponse } from 'next/server';
import { dbGetSession, dbUpdateSessionAnalysis, dbUpsertClientProfile, dbGetClientProfile } from '@/lib/supabase/db';
import { analyzeSession } from '@/lib/analysis/transcript-analyzer';
import { extractProfileFromAnalysis } from '@/lib/client-profile';
import type { AnalysisResult } from '@/types';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  try {
    const session = await dbGetSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (!session.transcript) {
      return NextResponse.json({ error: 'No transcript to analyze' }, { status: 400 });
    }

    // Run analysis
    console.log('[analyze] Starting analysis for session:', sessionId, 'transcript length:', session.transcript.length);
    const analysisResult = await analyzeSession({
      transcript: session.transcript,
      treatmentGoals: session.treatmentGoals,
      sessionNumber: session.sessionNumber,
    });
    console.log('[analyze] Analysis complete. Moments:', analysisResult.moments.length, 'SimilarCases:', analysisResult.similarCases.length, 'PractitionerMatches:', analysisResult.practitionerMatches.length);

    // Serialize to plain JSON to ensure no class instances or circular refs
    const serialized = JSON.parse(JSON.stringify(analysisResult));

    // Store analysis result in session
    const updated = await dbUpdateSessionAnalysis(sessionId, serialized);

    if (!updated) {
      return NextResponse.json({ error: 'Failed to store analysis' }, { status: 500 });
    }

    // Extract and update client profile
    const profile = extractProfileFromAnalysis(
      session.clientCode,
      session.transcript,
      analysisResult as AnalysisResult,
      session.treatmentGoals
    );

    // Get existing DB profile to preserve gender/ageRange
    const existingDb = await dbGetClientProfile(session.clientCode);

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
    console.error('POST /api/sessions/[sessionId]/analyze error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
