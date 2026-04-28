// Longitudinal tracking data for progress visualization.
// Per P0-1 audit: real Supabase data only. The mock generator at the bottom
// of this file is retained for type reference but is NOT called anywhere.

import { StructureName } from '@/types';

/**
 * Lightweight moment shape used for lineage popovers on the progress tab.
 * Quotes are clinician-visible source material; we keep only what's needed
 * to render a snippet without the full pipeline payload.
 */
export interface LongitudinalMomentLite {
  id?: string | number;
  quote?: string;
  timestamp?: string;
  structures?: string[];
  intensity?: number;
}

/**
 * Per-session topic entry: which structures/topics surfaced in this session
 * and the supporting moment quotes for lineage popovers.
 */
export interface LongitudinalSessionTopic {
  topic: string;          // canonical structure key (e.g. "emotion") or label
  label: string;          // display label
  count: number;          // how many moments tagged this topic in the session
  snippets: LongitudinalMomentLite[]; // up to 3 supporting quotes
}

/**
 * Per-session treatment-plan engagement: was the goal addressed in this session?
 */
export interface LongitudinalGoalEngagement {
  sessionNumber: number;
  addressed: boolean;
  snippets: LongitudinalMomentLite[];
}

export interface LongitudinalGoal {
  id: string;
  goal: string;
  perSession: LongitudinalGoalEngagement[];
}

export interface LongitudinalSessionData {
  sessionNumber: number;
  date: string;
  structureIntensity: {
    body: number;
    immediateExperience: number;
    emotion: number;
    behaviour: number;
    social: number;
    cognitive: number;
    reflective: number;
    narrative: number;
    ecological: number;
    normative: number;
  };
  outcomeMeasures: {
    phq9?: number;
    gad7?: number;
  };
  riskLevel: 'high' | 'medium' | 'low';
  dominantStructure: StructureName;
  keyTheme: string;
  emotionalIntensity: number;
  therapeuticAlliance: number;
  emotionalRegulation: number;
  reflectiveCapacity: number;
  // Real-data extensions wired by the progress API:
  riskFlagCount: number;
  riskFlagSeverity: { high: number; medium: number; low: number };
  dominantTopics: LongitudinalSessionTopic[]; // top 3 by frequency
  momentCount: number;
}

/**
 * Full payload returned by GET /api/clients/[clientCode]/progress.
 * The page renders cards directly off this shape and hides any card whose
 * underlying real data is empty (no fabrication).
 */
export interface ProgressData {
  sessionCount: number;
  sessions: LongitudinalSessionData[];
  /** Treatment goals (from clients.treatment_goals) with per-session engagement. */
  treatmentPlan: LongitudinalGoal[];
  /** Whether per-session PHQ-9/GAD-7 trend has at least 2 real data points. */
  hasOutcomeTrend: boolean;
  /** Whether topic-recurrence data is real (≥1 session has moments tagged). */
  hasTopicData: boolean;
}

export interface ProgressSummaryData {
  overallTrend: 'improving' | 'stable' | 'declining';
  keyImprovement: string;
  areasOfConcern: string[];
  recommendedFocus: string;
}

// Generate mock historical sessions for the current client
export function generateMockLongitudinalData(
  currentSessionNumber: number = 5
): LongitudinalSessionData[] {
  const sessions: LongitudinalSessionData[] = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - (currentSessionNumber * 7)); // One week apart

  for (let i = 1; i <= currentSessionNumber; i++) {
    const sessionDate = new Date(baseDate);
    sessionDate.setDate(sessionDate.getDate() + (i * 7));

    // Simulate progressive improvement
    const progressFactor = i / currentSessionNumber;
    const improvementFactor = 1 + (progressFactor * 0.3); // 0-30% improvement over sessions

    // Structure intensity values (0-10 scale)
    const baseIntensity = 6;
    const improvedIntensity = Math.max(2, baseIntensity - (progressFactor * 2));

    sessions.push({
      sessionNumber: i,
      date: sessionDate.toISOString().split('T')[0],
      structureIntensity: {
        body: baseIntensity - (progressFactor * 1.5),
        immediateExperience: baseIntensity - (progressFactor * 0.5),
        emotion: baseIntensity - (progressFactor * 2),
        behaviour: baseIntensity - (progressFactor * 1.8),
        social: improvedIntensity,
        cognitive: baseIntensity - (progressFactor * 1.2),
        reflective: baseIntensity + (progressFactor * 2), // Reflective improves
        narrative: baseIntensity - (progressFactor * 1),
        ecological: improvedIntensity,
        normative: baseIntensity - (progressFactor * 0.8),
      },
      outcomeMeasures: {
        phq9: Math.max(5, Math.round(18 - (progressFactor * 8))),
        gad7: Math.max(3, Math.round(15 - (progressFactor * 7))),
      },
      riskLevel: i === 1 ? 'high' : i <= 2 ? 'medium' : 'low',
      dominantStructure: [
        StructureName.EMOTION,
        StructureName.COGNITIVE,
        StructureName.SOCIAL,
        StructureName.REFLECTIVE,
        StructureName.NARRATIVE,
      ][i % 5] as StructureName,
      keyTheme: [
        'Initial crisis and emotional overwhelm',
        'Processing past patterns and beliefs',
        'Building social connections and resilience',
        'Deepening self-awareness and meaning',
        'Integration and sustainable change',
      ][i - 1] || 'Ongoing progress',
      emotionalIntensity: Math.max(3, 8 - (progressFactor * 3)),
      therapeuticAlliance: Math.min(9, 5 + (progressFactor * 3)),
      emotionalRegulation: Math.min(9, 3 + (progressFactor * 4)),
      reflectiveCapacity: Math.min(9, 4 + (progressFactor * 3)),
      // Real-data-only fields kept zero in the (unused) mock generator.
      riskFlagCount: 0,
      riskFlagSeverity: { high: 0, medium: 0, low: 0 },
      dominantTopics: [],
      momentCount: 0,
    });
  }

  return sessions;
}

// Generate progress summary based on longitudinal data
export function generateProgressSummary(
  sessions: LongitudinalSessionData[]
): ProgressSummaryData {
  if (sessions.length === 0) {
    return {
      overallTrend: 'stable',
      keyImprovement: 'No data available',
      areasOfConcern: [],
      recommendedFocus: 'Continue with baseline assessments',
    };
  }

  const firstSession = sessions[0];
  const lastSession = sessions[sessions.length - 1];

  // Calculate trends
  const phq9Change = (firstSession.outcomeMeasures.phq9 || 0) - (lastSession.outcomeMeasures.phq9 || 0);
  const gad7Change = (firstSession.outcomeMeasures.gad7 || 0) - (lastSession.outcomeMeasures.gad7 || 0);
  const allianceChange = lastSession.therapeuticAlliance - firstSession.therapeuticAlliance;
  const regulationChange = lastSession.emotionalRegulation - firstSession.emotionalRegulation;

  // Determine overall trend
  const avgChange = (phq9Change + gad7Change + allianceChange + regulationChange) / 4;
  let overallTrend: 'improving' | 'stable' | 'declining' = 'stable';
  if (avgChange > 2) overallTrend = 'improving';
  else if (avgChange < -1) overallTrend = 'declining';

  // Key improvements
  let keyImprovement = '';
  if (phq9Change > 5) keyImprovement = 'Significant reduction in depressive symptoms';
  else if (gad7Change > 4) keyImprovement = 'Substantial decrease in anxiety';
  else if (allianceChange > 2) keyImprovement = 'Strengthening therapeutic relationship';
  else if (regulationChange > 2) keyImprovement = 'Enhanced emotional regulation capacity';
  else keyImprovement = 'Gradual progress across multiple domains';

  // Areas of concern
  const areasOfConcern: string[] = [];
  if (lastSession.outcomeMeasures.phq9! > 15) areasOfConcern.push('Elevated depressive symptoms');
  if (lastSession.outcomeMeasures.gad7! > 12) areasOfConcern.push('Persistent anxiety concerns');
  if (lastSession.emotionalIntensity > 6) areasOfConcern.push('High emotional intensity');
  if (lastSession.therapeuticAlliance < 5) areasOfConcern.push('Therapeutic alliance needs strengthening');

  // Recommended focus
  let recommendedFocus = '';
  if (lastSession.dominantStructure === StructureName.EMOTION) {
    recommendedFocus = 'Focus on emotional regulation and distress tolerance skills';
  } else if (lastSession.dominantStructure === StructureName.COGNITIVE) {
    recommendedFocus = 'Continue cognitive restructuring and perspective-taking work';
  } else if (lastSession.dominantStructure === StructureName.SOCIAL) {
    recommendedFocus = 'Build on relational strengths and interpersonal effectiveness';
  } else if (lastSession.dominantStructure === StructureName.REFLECTIVE) {
    recommendedFocus = 'Deepen meaning-making and integration of insights';
  } else {
    recommendedFocus = 'Continue with current therapeutic focus and consolidate gains';
  }

  return {
    overallTrend,
    keyImprovement,
    areasOfConcern,
    recommendedFocus,
  };
}

// Format session date for display
export function formatSessionDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
