import { AnalysisResult, SessionInput, Moment, EmotionalValence, StructureName, RiskSeverity, RiskFlag, QuickInsight, PractitionerMatch, SimilarCase } from '@/types';
import { segmentTranscript } from './segmenter';
import { codeStructures } from './structure-coder';
import { detectRisks } from './risk-detector';
import { codeTherapistMoves, classifyTherapistMoveForMoment } from './therapist-coder';
import { generateReports } from './report-generator';
import { matchSessionMoments, matchPractitionerMethods } from './matching-engine';
import { analyzeCognitiveDistortions } from './cbt-analyzer';

interface SessionHistoryPoint {
  session: number;
  emotionalIntensity: number;
  reflectiveCapacity: number;
  emotionalRegulation: number;
  therapeuticAlliance: number;
}

function buildSessionHistory(): SessionHistoryPoint[] {
  // Session history is derived from actual analyzed sessions via the progress API endpoint.
  // We don't fabricate historical data here — the frontend fetches real longitudinal data.
  return [];
}

async function buildStructureProfile(
  moments: Moment[]
): Promise<Record<StructureName, number>> {
  const profile: Record<StructureName, number> = {} as Record<StructureName, number>;

  for (const structureName of Object.values(StructureName)) {
    profile[structureName] = 0;
  }

  for (const moment of moments) {
    for (const structure of moment.structures) {
      profile[structure] += moment.intensity;
    }
  }

  const totalIntensity = moments.reduce((sum, m) => sum + m.intensity, 0) || 1;
  for (const structure of Object.values(StructureName)) {
    profile[structure] = profile[structure] / totalIntensity;
  }

  return profile;
}

function generateQuickInsight(
  moments: Moment[],
  riskFlags: RiskFlag[],
  structureProfile: Record<StructureName, number>,
  sessionNumber: number
): QuickInsight {
  const hasHighRisk = riskFlags.some(f => f.severity === RiskSeverity.HIGH);
  const hasMediumRisk = riskFlags.some(f => f.severity === RiskSeverity.MEDIUM);

  let riskLevel: 'high' | 'moderate' | 'low' = 'low';
  let clinicalPriority = 'Continued exploration of presenting concerns';
  let prognosis = 'Good prognosis with consistent engagement';

  if (hasHighRisk) {
    riskLevel = 'high';
    clinicalPriority = 'Immediate safety assessment and crisis planning';
    prognosis = 'Requires intensive intervention and monitoring';
  } else if (hasMediumRisk) {
    riskLevel = 'moderate';
    clinicalPriority = 'Develop targeted intervention plan';
    prognosis = 'Good prognosis with appropriate treatment matching';
  }

  const topStructures = Object.entries(structureProfile)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 1)
    .map(([s]) => s);

  const topRecommendation = `Focus on ${
    topStructures[0]?.replace(/_/g, ' ') || 'emotional processing'
  } work in the coming sessions`;

  return {
    riskLevel,
    clinicalPriority,
    prognosis,
    topRecommendation,
    sessionNumber
  };
}

export async function analyzeSession(input: SessionInput): Promise<AnalysisResult> {
  const { transcript, sessionNumber } = input;

  // Aggressive parallelization. The pipeline used to be 11 sequential awaits,
  // running 41s locally and >60s in production (the Vercel function ceiling),
  // which silently killed the lambda mid-flight and surfaced as a generic
  // "Analysis failed" alert with no error visible in catches.
  //
  // Dependency graph:
  //   transcript → segmentTranscript ─→ codeStructures (parallel) ─→ moments
  //   transcript → detectRisks
  //   moments → buildStructureProfile (sync, fast)
  //   moments + structureProfile → matchSessionMoments
  //   moments → analyzeCognitiveDistortions
  //   moments + structureProfile + riskFlags → matchPractitionerMethods
  //   moments + riskFlags + structureProfile + practitionerMatches → generateReports
  //
  // Run independent branches concurrently. Any branch wrapped in try/catch
  // already; we promote those to .catch() handlers on the promises.

  const warnings: string[] = [];

  // Phase 0: segmentation + risk detection only need the raw transcript and
  // run in parallel. Saves 5-8s vs. sequential.
  const segmentationPromise = segmentTranscript(transcript);
  const riskFlagsPromise = detectRisks(transcript);

  const rawSegments = await segmentationPromise;

  // Phase 1: structure coding fan-out — N independent OpenAI calls, parallel.
  const structureCodings = await Promise.all(
    rawSegments.map((seg) => codeStructures(seg.quote, seg.context))
  );

  const moments: Moment[] = rawSegments.map((segment, i) => {
    const structureCoding = structureCodings[i];

    const primaryStructures = structureCoding.structures
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 3)
      .map((s) => s.name);

    const valence = structureCoding.structures[0]?.valence || EmotionalValence.NEUTRAL;
    const avgIntensity =
      structureCoding.structures.length > 0
        ? structureCoding.structures.reduce((sum, s) => sum + s.intensity, 0) / structureCoding.structures.length
        : 0.5;

    const therapistMove = classifyTherapistMoveForMoment(segment.therapistResponse);

    return {
      id: i,
      timestamp: segment.timestamp,
      quote: segment.quote,
      context: segment.context,
      type: segment.type,
      valence,
      intensity: avgIntensity,
      structures: primaryStructures.length > 0 ? primaryStructures : [StructureName.EMOTION],
      therapistMove,
      therapistQuote: segment.therapistResponse,
    };
  });

  const therapistResponses = moments.map(m => m.therapistQuote);
  const therapistMoves = codeTherapistMoves(therapistResponses);
  const structureProfile = await buildStructureProfile(moments);

  // Phase 2: three independent network-bound steps run concurrently — risk
  // detection (already kicked off), similar-case matching (3 embeddings + 3
  // RPCs), CBT distortion analysis. Cuts ~max(9s, 5s, 3s) = 9s instead of 17s
  // sequential.
  const similarCasesPromise = matchSessionMoments(moments, structureProfile)
    .catch((err) => {
      console.error('[analyzeSession] matchSessionMoments failed:', err);
      warnings.push('Similar case matching unavailable — Supabase not configured');
      return [] as SimilarCase[];
    });

  const cbtAnalysisPromise = analyzeCognitiveDistortions(
    moments.map(m => ({ quote: m.quote, context: m.context }))
  ).catch((err) => {
    console.error('[analyzeSession] CBT analysis failed:', err);
    warnings.push('CBT cognitive distortion analysis failed — using empty defaults');
    return { distortions: [], overallDistortionLoad: 0, treatmentReadiness: 0.5, dominantPatterns: [], automaticThoughts: [], behavioralPatterns: [] };
  });

  const [riskFlags, similarCases, cbtAnalysis] = await Promise.all([
    riskFlagsPromise,
    similarCasesPromise,
    cbtAnalysisPromise,
  ]);

  // Phase 3: practitioner matching depends on riskFlags. Single embed + RPC.
  let practitionerMatches: PractitionerMatch[] = [];
  try {
    practitionerMatches = await matchPractitionerMethods(
      moments,
      structureProfile,
      riskFlags
    );
  } catch (err) {
    console.error('[analyzeSession] matchPractitionerMethods failed:', err);
    warnings.push('Practitioner matching unavailable — Supabase not configured');
  }

  const quickInsight = generateQuickInsight(moments, riskFlags, structureProfile, sessionNumber);

  // Phase 4: report generation depends on practitionerMatches.
  let clinicianReport = '';
  let patientReport = '';
  try {
    const reports = await generateReports(
      moments,
      riskFlags,
      structureProfile,
      practitionerMatches,
      sessionNumber
    );
    clinicianReport = reports.clinicianReport;
    patientReport = reports.patientReport;
  } catch (err) {
    console.error('[analyzeSession] generateReports failed:', err);
    warnings.push('Report generation failed — clinician and patient reports unavailable');
  }

  // Step 11: Build session history
  const sessionHistory = buildSessionHistory();

  // Determine analysis status based on warnings
  const analysisStatus: 'complete' | 'partial' = warnings.length > 0 ? 'partial' : 'complete';

  return {
    quickInsight,
    moments,
    riskFlags,
    practitionerMatches,
    similarCases,
    structureProfile,
    sessionHistory,
    therapistMoves,
    clinicianReport,
    patientReport,
    cbtAnalysis,
    analysisStatus,
    analysisWarnings: warnings
  };
}
