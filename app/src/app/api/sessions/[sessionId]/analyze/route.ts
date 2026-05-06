import { NextResponse } from 'next/server';
import { dbGetSession, dbUpdateSessionAnalysis, dbUpsertClientProfile, dbGetClientProfile, dbWriteAuditLog } from '@/lib/supabase/db';
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
  const t0 = Date.now();
  const elapsed = () => `${Date.now() - t0}ms`;
  try {
    stage = 'fetch_session';
    console.log(`[analyze ${sessionId}] stage=${stage} t=${elapsed()}`);
    const session = await dbGetSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    if (!session.transcript) {
      return NextResponse.json({ error: 'No transcript to analyze' }, { status: 400 });
    }

    stage = 'analyze';
    console.log(`[analyze ${sessionId}] stage=${stage} t=${elapsed()} transcriptLen=${session.transcript.length}`);
    const analysisResult = await analyzeSession({
      transcript: session.transcript,
      treatmentGoals: session.treatmentGoals,
      sessionNumber: session.sessionNumber,
    });
    console.log(`[analyze ${sessionId}] analyze done t=${elapsed()} moments=${analysisResult.moments.length} similar=${analysisResult.similarCases.length} prac=${analysisResult.practitionerMatches.length}`);

    stage = 'serialize';
    console.log(`[analyze ${sessionId}] stage=${stage} t=${elapsed()}`);
    const serialized = JSON.parse(JSON.stringify(analysisResult));

    stage = 'persist_session_analysis';
    console.log(`[analyze ${sessionId}] stage=${stage} t=${elapsed()}`);
    const updated = await dbUpdateSessionAnalysis(sessionId, serialized);
    if (!updated) {
      return NextResponse.json({ error: 'Failed to store analysis', stage }, { status: 500 });
    }

    stage = 'extract_profile';
    console.log(`[analyze ${sessionId}] stage=${stage} t=${elapsed()}`);
    const profile = extractProfileFromAnalysis(
      session.clientCode,
      session.transcript,
      analysisResult as AnalysisResult,
      session.treatmentGoals
    );

    stage = 'fetch_existing_profile';
    console.log(`[analyze ${sessionId}] stage=${stage} t=${elapsed()}`);
    const existingDb = await dbGetClientProfile(session.clientCode);

    stage = 'upsert_profile';
    console.log(`[analyze ${sessionId}] stage=${stage} t=${elapsed()}`);
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
    const elapsedMs = Date.now() - t0;
    console.error(`[analyze ${sessionId}] CAUGHT at stage=${stage} t=${elapsedMs}ms`, error);
    const message = error instanceof Error ? error.message : String(error);
    const name = error instanceof Error ? error.name : 'Error';
    const stack = error instanceof Error && error.stack
      ? error.stack.split('\n').slice(0, 8).join('\n')
      : undefined;

    // Persist the failure to audit_logs.metadata so we can read the actual
    // error via SQL. AWAIT — fire-and-forget loses the network request when
    // the lambda freezes after returning the response.
    try {
      await dbWriteAuditLog({
        action: 'session.read',
        resourceType: 'session',
        resourceId: sessionId,
        metadata: {
          analyze_failure: true,
          stage,
          name,
          message,
          stack,
          elapsed_ms: elapsedMs,
          ts: new Date().toISOString(),
        },
      });
    } catch (logErr) {
      console.error(`[analyze ${sessionId}] audit log write failed`, logErr);
    }

    return NextResponse.json(
      { error: 'Analysis failed', stage, name, message, stack, elapsedMs },
      { status: 500 },
    );
  }
}
