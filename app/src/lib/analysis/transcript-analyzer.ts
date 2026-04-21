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

  // Step 1: Segment transcript
  const rawSegments = await segmentTranscript(transcript);

  // Step 2: Code structures for each moment and build moments array
  const moments: Moment[] = [];
  for (let i = 0; i < rawSegments.length; i++) {
    const segment = rawSegments[i];
    const structureCoding = await codeStructures(segment.quote, segment.context);

    const primaryStructures = structureCoding.structures
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 3)
      .map(s => s.name);

    const valence = structureCoding.structures[0]?.valence || EmotionalValence.NEUTRAL;
    const avgIntensity =
      structureCoding.structures.length > 0
        ? structureCoding.structures.reduce((sum, s) => sum + s.intensity, 0) / structureCoding.structures.length
        : 0.5;

    const therapistMove = classifyTherapistMoveForMoment(segment.therapistResponse);

    const moment: Moment = {
      id: i,
      timestamp: segment.timestamp,
      quote: segment.quote,
      context: segment.context,
      type: segment.type,
      valence: valence,
      intensity: avgIntensity,
      structures: primaryStructures.length > 0 ? primaryStructures : [StructureName.EMOTION],
      therapistMove,
      therapistQuote: segment.therapistResponse
    };

    moments.push(moment);
  }

  // Step 3: Detect risks
  const riskFlags = await detectRisks(transcript);

  // Step 4: Code therapist moves
  const therapistResponses = moments.map(m => m.therapistQuote);
  const therapistMoves = codeTherapistMoves(therapistResponses);

  // Step 5: Build structure profile
  const structureProfile = await buildStructureProfile(moments);

  // Track which analysis steps succeeded/failed
  const warnings: string[] = [];

  // Step 6: Match similar cases (3-layer matching engine: semantic + structural + metadata)
  let similarCases: SimilarCase[] = [];
  try {
    similarCases = await matchSessionMoments(moments, structureProfile);
  } catch (err) {
    console.error('[analyzeSession] Step 6 (matchSessionMoments) failed:', err);
    warnings.push('Similar case matching unavailable — Supabase not configured');
  }

  // Step 7: CBT cognitive distortion analysis (Diagnosis-of-Thought framework)
  let cbtAnalysis;
  try {
    cbtAnalysis = await analyzeCognitiveDistortions(
      moments.map(m => ({ quote: m.quote, context: m.context }))
    );
  } catch (err) {
    console.error('[analyzeSession] Step 7 (CBT analysis) failed:', err);
    warnings.push('CBT cognitive distortion analysis failed — using empty defaults');
    cbtAnalysis = { distortions: [], overallDistortionLoad: 0, treatmentReadiness: 0.5, dominantPatterns: [], automaticThoughts: [], behavioralPatterns: [] };
  }

  // Step 8: Match practitioners (semantic vector search against 20 evidence-based methods)
  let practitionerMatches: PractitionerMatch[] = [];
  try {
    practitionerMatches = await matchPractitionerMethods(
      moments,
      structureProfile,
      riskFlags
    );
  } catch (err) {
    console.error('[analyzeSession] Step 8 (matchPractitionerMethods) failed:', err);
    warnings.push('Practitioner matching unavailable — Supabase not configured');
  }

  // Step 9: Build quick insight
  const quickInsight = generateQuickInsight(moments, riskFlags, structureProfile, sessionNumber);

  // Step 10: Generate reports
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
    console.error('[analyzeSession] Step 10 (generateReports) failed:', err);
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
