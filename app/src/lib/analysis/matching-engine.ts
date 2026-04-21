import { createClient } from '@supabase/supabase-js';
import type { Moment, SimilarCase, PractitionerMatch, StructureName } from '@/types';
import { embedMoment, embedText } from './embedding-pipeline';
import { MOCK_ANALYSIS } from '@/lib/mock-data';

// ============ Constants ============

const STRUCTURE_ORDER: StructureName[] = [
  'body' as StructureName,
  'immediate_experience' as StructureName,
  'emotion' as StructureName,
  'behaviour' as StructureName,
  'social' as StructureName,
  'cognitive' as StructureName,
  'reflective' as StructureName,
  'narrative' as StructureName,
  'ecological' as StructureName,
  'normative' as StructureName,
];

const WEIGHT_SEMANTIC = 0.5;
const WEIGHT_STRUCTURAL = 0.3;
const WEIGHT_METADATA = 0.2;

const MAX_RESULTS = 5;
const SEMANTIC_SEARCH_LIMIT = 20; // Fetch more candidates, then re-rank

// ============ Types for Supabase RPC results ============

interface SemanticSearchResult {
  moment_id: number;
  participant_id: string;
  semantic_similarity: number;
  verbatim_quote: string;
  moment_anchor: string;
  emotional_valence: string;
  intensity: number;
  structures_present: string[];
}

interface LivedExperience {
  participant_id: string;
  summary: string;
  key_themes: string[];
  categories: string[];
  tags: string[];
}

interface PractitionerSearchResult {
  code: string;
  name: string;
  specialty: string;
  methodology: string;
  intervention_sequence: string[];
  outcome_patterns: { metric: string; change: string; confidence: number }[];
  target_structures: string[];
  semantic_similarity: number;
}

// ============ Supabase Client ============

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key);
}

// ============ Scoring Functions ============

/**
 * Convert a structure name array into a 10-dimensional binary vector.
 */
function structuresToVector(structures: string[]): number[] {
  return STRUCTURE_ORDER.map((s) => (structures.includes(s) ? 1 : 0));
}

/**
 * Convert a structure profile (name -> weight) into a 10-dimensional vector.
 */
function profileToVector(profile: Record<StructureName, number>): number[] {
  return STRUCTURE_ORDER.map((s) => profile[s] ?? 0);
}

/**
 * Cosine similarity between two numeric vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
  if (magnitude === 0) return 0;

  return dot / magnitude;
}

/**
 * Compute structural alignment score between a session's structure profile
 * and a matched moment's structures_present array.
 */
function computeStructuralAlignment(
  sessionProfile: Record<StructureName, number>,
  momentStructures: string[]
): number {
  const sessionVector = profileToVector(sessionProfile);
  const momentVector = structuresToVector(momentStructures);
  return cosineSimilarity(sessionVector, momentVector);
}

/**
 * Compute metadata relevance score based on valence match, intensity
 * similarity, and category overlap (Jaccard).
 */
function computeMetadataRelevance(
  sessionMoment: Moment,
  matchedResult: SemanticSearchResult,
  sessionCategories: string[]
): number {
  // Valence match (0.4 weight): exact match = 1, else 0
  const valenceScore = sessionMoment.valence === matchedResult.emotional_valence ? 1 : 0;

  // Intensity similarity (0.3 weight): 1 - normalized absolute difference
  const intensityDiff = Math.abs(sessionMoment.intensity - matchedResult.intensity);
  const intensityScore = 1 - Math.min(intensityDiff / 10, 1); // Assuming intensity 0-10

  // Category overlap via Jaccard similarity (0.3 weight)
  const matchedSet = new Set(matchedResult.structures_present);
  const sessionSet = new Set(sessionCategories);
  const intersectionCount = matchedResult.structures_present.filter(
    (s) => sessionSet.has(s)
  ).length;
  const unionArr = Array.from(matchedSet);
  for (const s of sessionCategories) {
    if (!matchedSet.has(s)) {
      unionArr.push(s);
    }
  }
  const unionSize = unionArr.length;
  const jaccardScore = unionSize > 0 ? intersectionCount / unionSize : 0;

  return valenceScore * 0.4 + intensityScore * 0.3 + jaccardScore * 0.3;
}

/**
 * Compute the combined 3-layer score for a matched moment.
 */
function computeCombinedScore(
  semanticSimilarity: number,
  structuralAlignment: number,
  metadataRelevance: number
): number {
  return (
    WEIGHT_SEMANTIC * semanticSimilarity +
    WEIGHT_STRUCTURAL * structuralAlignment +
    WEIGHT_METADATA * metadataRelevance
  );
}

/**
 * Compute a confidence score based on sample size and score distribution.
 * Higher confidence when we have more matches and they cluster tightly.
 */
function computeConfidence(scores: number[], totalArchiveSize: number): number {
  if (scores.length === 0) return 0;

  // Factor 1: Sample coverage (how many results relative to archive)
  const coverageFactor = Math.min(scores.length / Math.max(totalArchiveSize, 1), 1);

  // Factor 2: Score quality (average of top scores)
  const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

  // Factor 3: Score consistency (low std dev = higher confidence)
  const mean = avgScore;
  const variance =
    scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  const consistencyFactor = Math.max(1 - stdDev, 0);

  return (coverageFactor * 0.2 + avgScore * 0.5 + consistencyFactor * 0.3);
}

// ============ Main Matching Function ============

/**
 * Match a session's moments against the research archive using a 3-layer
 * scoring engine: semantic similarity (50%), structural alignment (30%),
 * and metadata relevance (20%).
 *
 * Returns top 5 similar cases grouped by participant.
 */
export async function matchSessionMoments(
  moments: Moment[],
  structureProfile: Record<StructureName, number>
): Promise<SimilarCase[]> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('[matching-engine] Supabase not configured, returning demo similar cases');
      return MOCK_ANALYSIS.similarCases.map(c => ({
        ...c,
        outcomeDetail: `[Demo Data] ${c.outcomeDetail}`,
      }));
    }

    if (moments.length === 0) {
      return [];
    }

    // Pick the most intense moments (up to 3) for embedding-based search
    const keyMoments = [...moments]
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 3);

    // Collect all session structure names for category overlap
    const sessionCategories = moments.flatMap((m) => m.structures as string[]);

    // Search for semantically similar moments in the archive
    const allSearchResults: (SemanticSearchResult & {
      sourceMoment: Moment;
      combinedScore: number;
    })[] = [];

    for (const moment of keyMoments) {
      console.log('[matching-engine] Embedding moment:', moment.quote.substring(0, 60));
      const embedding = await embedMoment(moment.quote, moment.context);
      console.log('[matching-engine] Embedding result length:', embedding.length);

      if (embedding.length === 0) {
        console.warn('[matching-engine] Empty embedding — skipping moment');
        continue;
      }

      const { data, error } = await supabase.rpc('search_moments_semantic', {
        query_embedding: embedding,
        limit_count: SEMANTIC_SEARCH_LIMIT,
      });

      console.log('[matching-engine] RPC returned', data?.length ?? 0, 'results, error:', error);

      if (error) {
        console.error('[matching-engine] Semantic search failed:', error);
        continue;
      }

      const results = (data as SemanticSearchResult[]) ?? [];

      // Re-rank each result with the 3-layer scoring
      for (const result of results) {
        const structuralScore = computeStructuralAlignment(
          structureProfile,
          result.structures_present ?? []
        );
        const metadataScore = computeMetadataRelevance(
          moment,
          result,
          sessionCategories
        );
        const combinedScore = computeCombinedScore(
          result.semantic_similarity,
          structuralScore,
          metadataScore
        );

        allSearchResults.push({
          ...result,
          sourceMoment: moment,
          combinedScore,
        });
      }
    }

    if (allSearchResults.length === 0) {
      return [];
    }

    // Group results by participant_id, keeping best score per participant
    const participantGroups = new Map<
      string,
      {
        bestScore: number;
        scores: number[];
        results: typeof allSearchResults;
      }
    >();

    for (const result of allSearchResults) {
      const pid = result.participant_id;
      const existing = participantGroups.get(pid);

      if (existing) {
        existing.scores.push(result.combinedScore);
        existing.bestScore = Math.max(existing.bestScore, result.combinedScore);
        existing.results.push(result);
      } else {
        participantGroups.set(pid, {
          bestScore: result.combinedScore,
          scores: [result.combinedScore],
          results: [result],
        });
      }
    }

    // Sort participants by best combined score
    const sortedParticipants = Array.from(participantGroups.entries())
      .sort((a, b) => b[1].bestScore - a[1].bestScore)
      .slice(0, MAX_RESULTS);

    // Fetch lived experience data for top participants
    const participantIds = sortedParticipants.map(([pid]) => pid);
    const { data: experienceData, error: expError } = await supabase
      .from('lived_experiences')
      .select('participant_id, summary, key_themes, categories, tags')
      .in('participant_id', participantIds);

    if (expError) {
      console.error('[matching-engine] Failed to fetch lived experiences:', expError);
    }

    const experienceMap = new Map<string, LivedExperience>();
    if (experienceData) {
      for (const exp of experienceData as LivedExperience[]) {
        experienceMap.set(exp.participant_id, exp);
      }
    }

    // Build SimilarCase objects
    const allScores = sortedParticipants.map(([, group]) => group.bestScore);
    const confidence = computeConfidence(allScores, 768);

    const similarCases: SimilarCase[] = sortedParticipants.map(
      ([participantId, group], index) => {
        const experience = experienceMap.get(participantId);
        const bestResult = group.results.sort(
          (a, b) => b.combinedScore - a.combinedScore
        )[0];

        // Extract dominant structures from the best matching moments
        const structureCounts = new Map<string, number>();
        for (const r of group.results) {
          for (const s of r.structures_present ?? []) {
            structureCounts.set(s, (structureCounts.get(s) || 0) + 1);
          }
        }
        const dominantStructures = Array.from(structureCounts.entries())
          .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
          .slice(0, 3)
          .map(([s]) => s as StructureName);

        return {
          id: index + 1,
          patientCode: `SL-2024-${String(index + 1).padStart(4, '0')}`,
          matchScore: Math.round(group.bestScore * 100) / 100,
          presentingConcerns: experience?.categories ?? [],
          dominantStructures,
          sessionCount: group.results.length,
          keyThemes: experience?.key_themes ?? [],
          outcome: confidence > 0.6 ? 'Positive trajectory' : 'Insufficient data',
          outcomeDetail: experience?.summary ?? 'No detailed outcome available.',
          representativeQuote: bestResult.verbatim_quote ?? '',
        };
      }
    );

    return similarCases;
  } catch (error) {
    console.error('[matching-engine] Matching failed:', error);
    return [];
  }
}

// ============ Practitioner Matching Function ============

/**
 * Match a session's key themes against the practitioner methods archive
 * using semantic vector search. Builds a rich query from the session's
 * dominant structures, risk flags, and top moments, then finds the most
 * relevant therapeutic approaches.
 *
 * Returns top 5 practitioner method matches with scores and reasoning.
 */
export async function matchPractitionerMethods(
  moments: Moment[],
  structureProfile: Record<StructureName, number>,
  riskFlags: { severity: string; signal: string }[]
): Promise<PractitionerMatch[]> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('[matching-engine] Supabase not configured, returning demo practitioner matches');
      return MOCK_ANALYSIS.practitionerMatches.map(m => ({
        ...m,
        matchReasoning: `[Demo Data] ${m.matchReasoning}`,
      }));
    }

    if (moments.length === 0) {
      return [];
    }

    // Build a rich query string that captures the session's clinical picture
    const topStructures = Object.entries(structureProfile)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([s]) => s.replace(/_/g, ' '));

    const highRisks = riskFlags
      .filter(r => r.severity === 'high' || r.severity === 'medium')
      .map(r => r.signal)
      .slice(0, 3);

    const keyQuotes = [...moments]
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 3)
      .map(m => m.quote.substring(0, 150));

    const queryText = [
      `Client presenting with dominant structures: ${topStructures.join(', ')}.`,
      highRisks.length > 0
        ? `Risk signals present: ${highRisks.join(', ')}.`
        : '',
      `Key moments: ${keyQuotes.join(' | ')}`,
      `Looking for therapeutic approaches that target these patterns.`
    ].filter(Boolean).join(' ');

    console.log('[matching-engine] Practitioner query:', queryText.substring(0, 120));

    // Embed the query
    const embedding = await embedText(queryText);
    if (embedding.length === 0) {
      console.warn('[matching-engine] Empty embedding for practitioner query');
      return [];
    }

    // Search practitioners semantically
    const { data, error } = await supabase.rpc('search_practitioners_semantic', {
      query_embedding: embedding,
      limit_count: 5,
    });

    if (error) {
      console.error('[matching-engine] Practitioner search failed:', error);
      return [];
    }

    const results = (data as PractitionerSearchResult[]) ?? [];
    console.log('[matching-engine] Found', results.length, 'practitioner matches');

    // Build PractitionerMatch objects with structural alignment boost
    const matches: PractitionerMatch[] = results.map((result, index) => {
      // Compute structural alignment between session profile and method's target structures
      const methodStructureVector = STRUCTURE_ORDER.map(s =>
        (result.target_structures ?? []).includes(s) ? 1 : 0
      );
      const sessionVector = profileToVector(structureProfile);
      const structuralBoost = cosineSimilarity(sessionVector, methodStructureVector);

      // Combined score: 60% semantic, 40% structural alignment
      const combinedScore = result.semantic_similarity * 0.6 + structuralBoost * 0.4;

      // Build match reasoning
      const overlappingStructures = (result.target_structures ?? []).filter(
        s => structureProfile[s as StructureName] > 0.1
      );

      const matchReasoning = [
        `${result.name} is ${Math.round(combinedScore * 100)}% aligned with this session's clinical profile.`,
        overlappingStructures.length > 0
          ? `Targets ${overlappingStructures.join(', ')} structures which are prominent in this session.`
          : '',
        `Methodology: ${result.methodology.substring(0, 200)}`,
      ].filter(Boolean).join(' ');

      return {
        id: index + 1,
        code: result.code,
        name: result.name,
        specialty: result.specialty,
        matchScore: Math.round(combinedScore * 100) / 100,
        methodology: result.methodology,
        interventionSequence: result.intervention_sequence ?? [],
        outcomePatterns: result.outcome_patterns ?? [],
        matchReasoning,
        targetStructures: (result.target_structures ?? []) as StructureName[],
      };
    });

    // Re-sort by combined score
    matches.sort((a, b) => b.matchScore - a.matchScore);

    return matches;
  } catch (error) {
    console.error('[matching-engine] Practitioner matching failed:', error);
    return [];
  }
}
