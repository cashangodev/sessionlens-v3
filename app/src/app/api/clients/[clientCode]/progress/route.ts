import { NextResponse } from 'next/server';
import { dbGetClientProfile, getTherapistId, type OutcomeScoreEntry } from '@/lib/supabase/db';
import { createClient as supabaseCreateClient } from '@supabase/supabase-js';
import {
  LongitudinalSessionData,
  LongitudinalGoal,
  LongitudinalGoalEngagement,
  LongitudinalMomentLite,
  LongitudinalSessionTopic,
  ProgressData,
} from '@/lib/longitudinal-data';
import { StructureName } from '@/types';

function createClient() {
  return supabaseCreateClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface AnalysisMoment {
  id?: string | number;
  quote?: string;
  timestamp?: string;
  intensity?: number;
  structures?: string[];
}

interface AnalysisRiskFlag {
  severity?: 'high' | 'medium' | 'low';
}

interface AnalysisResult {
  structureProfile?: Record<string, number>;
  outcomeMeasures?: { phq9?: number; gad7?: number };
  quickInsight?: { riskLevel?: 'high' | 'medium' | 'low' };
  moments?: AnalysisMoment[];
  riskFlags?: AnalysisRiskFlag[] | string[];
}

const STRUCTURE_LABELS: Record<string, string> = {
  body: 'Body',
  immediate_experience: 'Immediate Experience',
  emotion: 'Emotion',
  behaviour: 'Behaviour',
  behavior: 'Behaviour',
  social: 'Social',
  cognitive: 'Cognitive',
  reflective: 'Reflective',
  narrative: 'Narrative',
  ecological: 'Ecological',
  normative: 'Normative',
};

function mapStructureNameKey(key: string): StructureName {
  const mapping: Record<string, StructureName> = {
    body: StructureName.BODY,
    immediate_experience: StructureName.IMMEDIATE_EXPERIENCE,
    emotion: StructureName.EMOTION,
    behaviour: StructureName.BEHAVIOUR,
    behavior: StructureName.BEHAVIOUR,
    social: StructureName.SOCIAL,
    cognitive: StructureName.COGNITIVE,
    reflective: StructureName.REFLECTIVE,
    narrative: StructureName.NARRATIVE,
    ecological: StructureName.ECOLOGICAL,
    normative: StructureName.NORMATIVE,
  };
  return mapping[key.toLowerCase()] || StructureName.EMOTION;
}

/**
 * Match an outcome_scores entry to a session by date (YYYY-MM-DD).
 * Both come from the seed/pipeline as ISO timestamps; we compare day-precision.
 */
function findOutcomeForDate(
  entries: OutcomeScoreEntry[],
  sessionDate: string
): OutcomeScoreEntry | undefined {
  const day = (sessionDate || '').split('T')[0];
  return entries.find((e) => (e.date || '').split('T')[0] === day);
}

/**
 * Build per-session topic frequency from `analysis_result.moments[].structures`.
 * Returns top N entries by count, each with up to 3 supporting quote snippets
 * for the lineage popover.
 */
function buildSessionTopics(
  moments: AnalysisMoment[],
  topN: number
): LongitudinalSessionTopic[] {
  const buckets = new Map<string, { count: number; snippets: LongitudinalMomentLite[] }>();
  for (const m of moments) {
    const structures = Array.isArray(m.structures) ? m.structures : [];
    for (const s of structures) {
      const key = String(s).toLowerCase();
      if (!buckets.has(key)) buckets.set(key, { count: 0, snippets: [] });
      const bucket = buckets.get(key)!;
      bucket.count += 1;
      if (bucket.snippets.length < 3 && m.quote) {
        bucket.snippets.push({
          id: m.id,
          quote: m.quote,
          timestamp: m.timestamp,
          intensity: m.intensity,
          structures,
        });
      }
    }
  }
  return Array.from(buckets.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, topN)
    .map(([key, val]) => ({
      topic: key,
      label: STRUCTURE_LABELS[key] || key.replace(/_/g, ' '),
      count: val.count,
      snippets: val.snippets,
    }));
}

/**
 * Per-goal engagement detector. We don't have a structured per-goal field in
 * `analysis_result`, so we use a simple keyword overlap between the goal text
 * and each session's moment quotes / treatment_goals string. If a session
 * mentions a meaningful keyword from the goal, we mark it addressed and
 * collect up to 2 supporting moment snippets.
 */
function buildTreatmentPlan(
  goals: string[],
  sessionsWithMoments: Array<{
    sessionNumber: number;
    treatmentGoals: string;
    moments: AnalysisMoment[];
  }>
): LongitudinalGoal[] {
  const stop = new Set([
    'the', 'and', 'for', 'with', 'from', 'into', 'that', 'this', 'a', 'an', 'of',
    'to', 'in', 'on', 'or', 'is', 'be', 'as', 'at', 'by',
  ]);

  return goals.map((goal, idx) => {
    const keywords = goal
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 4 && !stop.has(w));

    const perSession: LongitudinalGoalEngagement[] = sessionsWithMoments.map((s) => {
      const haystack = (
        s.treatmentGoals + ' ' + s.moments.map((m) => m.quote || '').join(' ')
      ).toLowerCase();
      const hits: LongitudinalMomentLite[] = [];
      const addressed = keywords.some((k) => haystack.includes(k));
      if (addressed) {
        for (const m of s.moments) {
          if (hits.length >= 2) break;
          const q = (m.quote || '').toLowerCase();
          if (keywords.some((k) => q.includes(k)) && m.quote) {
            hits.push({
              id: m.id,
              quote: m.quote,
              timestamp: m.timestamp,
              intensity: m.intensity,
              structures: m.structures,
            });
          }
        }
      }
      return {
        sessionNumber: s.sessionNumber,
        addressed,
        snippets: hits,
      };
    });

    return {
      id: `goal-${idx}`,
      goal,
      perSession,
    };
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clientCode: string }> }
) {
  const { clientCode } = await params;

  try {
    const client = await dbGetClientProfile(clientCode);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const supabase = createClient();
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('session_id, session_number, session_date, status, treatment_goals, analysis_result')
      .eq('client_id', client.client_id)
      .eq('therapist_id', await getTherapistId())
      .eq('status', 'complete')
      .is('deleted_at', null)
      .order('session_number', { ascending: true });

    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    const outcomeScores = client.outcome_scores || [];

    const sessionsWithMoments: Array<{
      sessionNumber: number;
      treatmentGoals: string;
      moments: AnalysisMoment[];
    }> = [];

    const longitudinalData: LongitudinalSessionData[] = (sessions || []).map(
      (session: Record<string, unknown>) => {
        const analysis = (session.analysis_result || {}) as AnalysisResult;
        const structureProfile = analysis.structureProfile || {};
        const moments: AnalysisMoment[] = Array.isArray(analysis.moments)
          ? (analysis.moments as AnalysisMoment[])
          : [];

        sessionsWithMoments.push({
          sessionNumber: session.session_number as number,
          treatmentGoals: (session.treatment_goals as string) || '',
          moments,
        });

        // Outcome measures: prefer the per-client outcome_scores table (date-aligned),
        // fall back to anything inside analysis_result.outcomeMeasures.
        const dateStr = ((session.session_date as string) || '').split('T')[0];
        const matchedOutcome = findOutcomeForDate(outcomeScores, session.session_date as string);
        const phq9 =
          matchedOutcome?.phq9 != null
            ? matchedOutcome.phq9
            : analysis.outcomeMeasures?.phq9;
        const gad7 =
          matchedOutcome?.gad7 != null
            ? matchedOutcome.gad7
            : analysis.outcomeMeasures?.gad7;

        // Risk flag distribution.
        const riskFlagsRaw = analysis.riskFlags || [];
        let high = 0, medium = 0, low = 0;
        for (const r of riskFlagsRaw) {
          const sev = typeof r === 'string' ? 'low' : (r.severity || 'low');
          if (sev === 'high') high++;
          else if (sev === 'medium') medium++;
          else low++;
        }

        // Emotional intensity from real moment intensities.
        const highIntensityCount = moments.filter(
          (m) => typeof m.intensity === 'number' && m.intensity > 6
        ).length;
        const emotionalIntensity =
          moments.length > 0 ? (highIntensityCount / moments.length) * 10 : 0;

        const riskLevel = (analysis.quickInsight?.riskLevel || 'low') as
          | 'high'
          | 'medium'
          | 'low';

        const dominantStructureEntry = Object.entries(structureProfile).sort(
          ([, a], [, b]) => (b as number) - (a as number)
        )[0];
        const dominantStructure = dominantStructureEntry
          ? mapStructureNameKey(dominantStructureEntry[0])
          : StructureName.EMOTION;

        const dominantTopics = buildSessionTopics(moments, 3);

        // Key theme from the matched outcome note (real clinician text) or a
        // neutral fallback. We never invent narrative summaries.
        const keyTheme = matchedOutcome?.note
          ? matchedOutcome.note
          : `Session ${session.session_number}`;

        return {
          sessionNumber: session.session_number as number,
          date: dateStr,
          structureIntensity: {
            body: structureProfile.body || 0,
            immediateExperience: structureProfile.immediate_experience || 0,
            emotion: structureProfile.emotion || 0,
            behaviour: structureProfile.behaviour || 0,
            social: structureProfile.social || 0,
            cognitive: structureProfile.cognitive || 0,
            reflective: structureProfile.reflective || 0,
            narrative: structureProfile.narrative || 0,
            ecological: structureProfile.ecological || 0,
            normative: structureProfile.normative || 0,
          },
          outcomeMeasures: { phq9, gad7 },
          riskLevel,
          dominantStructure,
          keyTheme,
          emotionalIntensity: Math.min(10, emotionalIntensity),
          // The following three are intentionally zero — we don't fabricate
          // alliance/regulation/reflective composites. The page hides any card
          // that depends on them.
          therapeuticAlliance: 0,
          emotionalRegulation: 0,
          reflectiveCapacity: 0,
          riskFlagCount: high + medium + low,
          riskFlagSeverity: { high, medium, low },
          dominantTopics,
          momentCount: moments.length,
        };
      }
    );

    const treatmentPlan = buildTreatmentPlan(
      client.treatment_goals || [],
      sessionsWithMoments
    );

    const outcomePoints = longitudinalData.filter(
      (s) => s.outcomeMeasures.phq9 != null || s.outcomeMeasures.gad7 != null
    );
    const hasOutcomeTrend = outcomePoints.length >= 2;
    const hasTopicData = longitudinalData.some((s) => s.dominantTopics.length > 0);

    const payload: ProgressData = {
      sessionCount: longitudinalData.length,
      sessions: longitudinalData,
      treatmentPlan,
      hasOutcomeTrend,
      hasTopicData,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error('GET /api/clients/[clientCode]/progress error:', error);
    return NextResponse.json(
      { error: 'Failed to get progress data' },
      { status: 500 }
    );
  }
}
