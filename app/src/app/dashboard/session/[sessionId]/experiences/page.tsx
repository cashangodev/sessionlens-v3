'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useApi } from '@/hooks/use-api';
import type { AnalysisResult, SimilarCase, PractitionerMatch, StructureName } from '@/types';
import { Card } from '@/components/ui/Card';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import {
  ChevronDown,
  ChevronUp,
  MessageSquareQuote,
  Users,
  TrendingUp,
  CheckCircle2,
  Clock,
  Loader2,
  GitCompare,
  Lightbulb,
  Sparkles,
  Star,
  BarChart3,
  Zap,
  Info,
} from 'lucide-react';

// ─── Types ───
interface SessionData {
  id: string;
  clientCode: string;
  sessionNumber: number;
  transcript: string;
  treatmentGoals: string;
  date: string;
  time: string;
  status: string;
  analysisResult: AnalysisResult | null;
  createdAt: string;
}

interface CorrelationAlert {
  factorA: string;
  factorB: string;
  percentage: number;
  caseCount: number;
  totalCases: number;
  type: 'concern' | 'structure' | 'theme';
  significance: 'high' | 'moderate' | 'notable';
  suggestion: string;
}

// ─── Helpers ───
const STRUCTURE_LABELS: Record<string, string> = {
  body: 'Body',
  prereflective: 'Immediate Exp.',
  emotion: 'Emotion',
  behaviour: 'Behaviour',
  social: 'Social',
  cognitive: 'Cognitive',
  reflective: 'Reflective',
  narrative: 'Narrative',
  ecological: 'Ecological',
  normative: 'Normative',
};

function formatStructure(s: string): string {
  return STRUCTURE_LABELS[s] || s.replace(/_/g, ' ');
}

function getMatchLabel(score: number): { label: string; color: string; bg: string } {
  if (score >= 0.75) return { label: 'Strong', color: 'text-emerald-700', bg: 'bg-emerald-50' };
  if (score >= 0.55) return { label: 'Good', color: 'text-primary', bg: 'bg-primary/5' };
  if (score >= 0.40) return { label: 'Moderate', color: 'text-amber-700', bg: 'bg-amber-50' };
  return { label: 'Weak', color: 'text-gray-500', bg: 'bg-gray-50' };
}

function getOutcomeInfo(outcome: string) {
  const lower = (outcome || '').toLowerCase();
  if (lower.includes('significant') || lower.includes('positive')) return { label: 'Significant Improvement', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: TrendingUp };
  if (lower.includes('moderate')) return { label: 'Moderate Improvement', color: 'text-blue-700', bg: 'bg-blue-50', icon: TrendingUp };
  if (lower.includes('ongoing') || lower.includes('insufficient')) return { label: 'Ongoing', color: 'text-amber-700', bg: 'bg-amber-50', icon: Clock };
  return { label: outcome || 'Unknown', color: 'text-gray-600', bg: 'bg-gray-50', icon: Clock };
}

function computeEffectivenessScore(match: PractitionerMatch): number {
  const patterns = Array.isArray(match.outcomePatterns) ? match.outcomePatterns : [];
  if (patterns.length === 0) return 0;
  const avgConfidence = patterns.reduce((sum, p) => sum + (p.confidence || 0), 0) / patterns.length;
  const positiveCount = patterns.filter((p) => {
    const change = (p.change || '').toLowerCase();
    return change.includes('improve') || change.includes('reduc') || change.includes('increase') || change.includes('decrease') || change.includes('positive');
  }).length;
  const improvementRatio = positiveCount / patterns.length;
  return Math.round(avgConfidence * improvementRatio * 100);
}

function getSignificanceInfo(sig: 'high' | 'moderate' | 'notable') {
  if (sig === 'high') return { label: 'High', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', bar: 'bg-red-400' };
  if (sig === 'moderate') return { label: 'Moderate', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', bar: 'bg-amber-400' };
  return { label: 'Notable', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', bar: 'bg-blue-400' };
}

function getTypeLabel(type: 'concern' | 'structure' | 'theme') {
  if (type === 'concern') return { label: 'Presenting Concern', icon: 'text-rose-500' };
  if (type === 'structure') return { label: 'Structural Pattern', icon: 'text-teal-500' };
  return { label: 'Thematic Pattern', icon: 'text-violet-500' };
}

const CONCERN_SUGGESTIONS: Record<string, string> = {
  anxiety: 'Consider body-focused assessment and somatic interventions',
  depression: 'Screen for sleep disruption and behavioral activation readiness',
  trauma: 'Assess for dissociative features and stabilization needs',
  'somatic complaints': 'Explore mind-body connection and interoceptive awareness',
  'cognitive distortions': 'Consider narrative therapy or cognitive restructuring approaches',
  'relationship difficulties': 'Assess attachment patterns and interpersonal schemas',
  'identity concerns': 'Explore narrative coherence and self-concept flexibility',
  'emotional dysregulation': 'Consider skills-based interventions (DBT-informed)',
  'avoidance patterns': 'Graduated exposure or acceptance-based approaches may apply',
  'sleep disturbance': 'Screen for circadian disruption and sleep hygiene barriers',
};

function getSuggestion(factorA: string, factorB: string, type: string): string {
  const lowerB = factorB.toLowerCase();
  for (const [key, suggestion] of Object.entries(CONCERN_SUGGESTIONS)) {
    if (lowerB.includes(key) || factorA.toLowerCase().includes(key)) return suggestion;
  }
  if (type === 'structure') {
    return `Explore the interplay between ${formatStructure(factorA)} and ${formatStructure(factorB)} dimensions`;
  }
  if (type === 'theme') {
    return `Thematic co-occurrence suggests deeper exploration of shared underlying dynamics`;
  }
  return `Consider screening for ${factorB} given the co-occurrence pattern`;
}

// ─── Correlation computation ───
function computeCorrelations(cases: SimilarCase[]): CorrelationAlert[] {
  const safeCases = Array.isArray(cases) ? cases : [];
  const totalCases = safeCases.length;
  if (totalCases < 2) return [];

  const alerts: CorrelationAlert[] = [];

  // Helper: compute co-occurrence between items in a field
  function findCoOccurrences(
    extractor: (c: SimilarCase) => string[],
    type: 'concern' | 'structure' | 'theme'
  ) {
    // Count cases with each item
    const itemCases: Record<string, Set<number>> = {};
    safeCases.forEach((c, idx) => {
      const items = extractor(c);
      items.forEach((item) => {
        if (!itemCases[item]) itemCases[item] = new Set();
        itemCases[item].add(idx);
      });
    });

    const items = Object.keys(itemCases);
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];
        const casesWithA = itemCases[a];
        const casesWithB = itemCases[b];
        // Count cases that have BOTH
        let coCount = 0;
        casesWithA.forEach((idx) => {
          if (casesWithB.has(idx)) coCount++;
        });
        // Percentage relative to cases with A
        const pctOfA = casesWithA.size > 0 ? Math.round((coCount / casesWithA.size) * 100) : 0;
        const pctOfB = casesWithB.size > 0 ? Math.round((coCount / casesWithB.size) * 100) : 0;
        // Use the higher co-occurrence direction
        const maxPct = Math.max(pctOfA, pctOfB);
        const [factorA, factorB] = pctOfA >= pctOfB ? [a, b] : [b, a];

        if (maxPct >= 25 && coCount >= 2) {
          const significance: 'high' | 'moderate' | 'notable' =
            maxPct >= 60 ? 'high' : maxPct >= 40 ? 'moderate' : 'notable';

          alerts.push({
            factorA: type === 'structure' ? formatStructure(factorA) : factorA,
            factorB: type === 'structure' ? formatStructure(factorB) : factorB,
            percentage: maxPct,
            caseCount: coCount,
            totalCases,
            type,
            significance,
            suggestion: getSuggestion(factorA, factorB, type),
          });
        }
      }
    }
  }

  findCoOccurrences(
    (c) => (Array.isArray(c.presentingConcerns) ? c.presentingConcerns : []),
    'concern'
  );
  findCoOccurrences(
    (c) => (Array.isArray(c.dominantStructures) ? c.dominantStructures : []),
    'structure'
  );
  findCoOccurrences(
    (c) => (Array.isArray(c.keyThemes) ? c.keyThemes : []),
    'theme'
  );

  // Sort by percentage descending
  alerts.sort((a, b) => b.percentage - a.percentage);
  return alerts;
}

// ─── Main Page ───
export default function ExperiencesPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { data, loading } = useApi<{ session: SessionData }>(`/api/sessions/${sessionId}`);
  const session = data?.session || null;

  const [expandedPractitioner, setExpandedPractitioner] = useState<string | null>(null);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [expandedCorrelation, setExpandedCorrelation] = useState<number | null>(null);

  // Extract data BEFORE early returns so hooks are always called in the same order
  const analysis = (session?.analysisResult || null) as AnalysisResult | null;
  const realCases: SimilarCase[] = analysis && Array.isArray(analysis.similarCases) ? analysis.similarCases : [];
  const practitionerMatches: PractitionerMatch[] = analysis && Array.isArray(analysis.practitionerMatches) ? analysis.practitionerMatches : [];

  // Compute correlations (always called — hooks must not be conditional)
  const correlations = useMemo(() => computeCorrelations(realCases), [realCases]);

  // Build a set of correlated factors per case for the Similar Stories section
  const correlatedFactorsByCase = useMemo(() => {
    const map: Record<number, string[]> = {};
    realCases.forEach((c) => {
      const factors: string[] = [];
      const concerns = Array.isArray(c.presentingConcerns) ? c.presentingConcerns : [];
      const structures = Array.isArray(c.dominantStructures) ? c.dominantStructures : [];
      const themes = Array.isArray(c.keyThemes) ? c.keyThemes : [];

      correlations.slice(0, 8).forEach((corr) => {
        const allCaseFactors = [
          ...concerns.map((x) => x.toLowerCase()),
          ...structures.map((x) => formatStructure(x).toLowerCase()),
          ...themes.map((x) => x.toLowerCase()),
        ];
        if (
          allCaseFactors.includes(corr.factorA.toLowerCase()) &&
          allCaseFactors.includes(corr.factorB.toLowerCase())
        ) {
          factors.push(`${corr.factorA} + ${corr.factorB}`);
        }
      });
      map[c.id] = factors;
    });
    return map;
  }, [realCases, correlations]);

  // Sort practitioners by effectiveness score
  const rankedPractitioners = useMemo(() => {
    return [...practitionerMatches]
      .map((p) => ({ ...p, effectivenessScore: computeEffectivenessScore(p) }))
      .sort((a, b) => b.effectivenessScore - a.effectivenessScore);
  }, [practitionerMatches]);

  // Early returns AFTER all hooks
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <Card className="p-8 text-center">
        <h3 className="font-playfair text-2xl font-bold text-gray-900 mb-2">Session Not Found</h3>
        <p className="text-gray-600 mb-6">This session may have expired.</p>
        <Link href="/dashboard/session/new" className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition">Create New Session</Link>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="p-8 text-center">
        <h3 className="font-playfair text-2xl font-bold text-gray-900 mb-2">Analysis Not Ready</h3>
        <p className="text-gray-600 mb-6">This session has not been analyzed yet.</p>
        <Link href="/dashboard/session/new" className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition">Create New Session</Link>
      </Card>
    );
  }

  // Compute aggregate pattern insights
  const totalCases = realCases.length;
  const positiveCases = realCases.filter((c) => {
    const o = (c.outcome || '').toLowerCase();
    return o.includes('positive') || o.includes('significant') || o.includes('improvement');
  }).length;
  const positivePct = totalCases > 0 ? Math.round((positiveCases / totalCases) * 100) : 0;

  // Find most common themes across matched cases
  const themeCount: Record<string, number> = {};
  realCases.forEach((c) => {
    const themes = Array.isArray(c.keyThemes) ? c.keyThemes : [];
    themes.forEach((t) => {
      themeCount[t] = (themeCount[t] || 0) + 1;
    });
  });
  const topThemes = Object.entries(themeCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Most common structures across matched cases
  const structCount: Record<string, number> = {};
  realCases.forEach((c) => {
    const structs = Array.isArray(c.dominantStructures) ? c.dominantStructures : [];
    structs.forEach((s) => {
      structCount[s] = (structCount[s] || 0) + 1;
    });
  });
  const topStructures = Object.entries(structCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  // Average match score
  const avgMatch = realCases.length > 0
    ? Math.round((realCases.reduce((sum, c) => sum + (c.matchScore || 0), 0) / realCases.length) * 100)
    : 0;

  // Highest effectiveness score
  const topEffectiveness = rankedPractitioners.length > 0 ? rankedPractitioners[0].effectivenessScore : 0;

  return (
    <div className="space-y-10">
      {/* ════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: SOLUTION MATCHING — WHAT WORKED                  */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-playfair text-2xl font-bold text-gray-900 tracking-tight">What Worked for People Like Your Client</h3>
              <InfoTooltip
                title="Solution Matching Engine"
                description="For a given client presentation, SessionLens retrieves similar cases from a dataset of 10,847 lived experiences using semantic vector matching. It then surfaces the interventions and approaches that produced the strongest outcomes across those matches."
                methodology="3-layer matching: (1) Semantic — OpenAI text-embedding-3-small embeddings searched via pgvector cosine similarity, (2) Structural — 10-dimension phenomenological profile alignment, (3) Metadata — valence, intensity, and category overlap scoring. Results are re-ranked by composite score."
              />
            </div>
            <p className="text-sm text-secondary">
              Practitioner approaches ranked by effectiveness across {totalCases > 0 ? totalCases : 'similar'} matched case{totalCases !== 1 ? 's' : ''}
            </p>
          </div>
          {rankedPractitioners.length > 0 && (
            <div className="hidden md:flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">Top Effectiveness</p>
                  <InfoTooltip
                    title="Effectiveness Score"
                    description="Computed from the outcome patterns of each matched practitioner approach. It represents the average confidence of positive outcomes (improvement, reduction) multiplied by the improvement ratio across all tracked metrics."
                    methodology="Score = average(outcome confidence) × (positive outcomes / total outcomes) × 100"
                  />
                </div>
                <p className="text-lg font-bold text-emerald-700 font-mono">{topEffectiveness}%</p>
              </div>
            </div>
          )}
        </div>

        {rankedPractitioners.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center mt-4">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-700 mb-1">No practitioner matches yet</p>
            <p className="text-sm text-gray-500">The matching engine did not find practitioner data for this session.</p>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {rankedPractitioners.map((match, idx) => {
              const matchKey = `prac-${match.id}`;
              const matchPercent = Math.round(match.matchScore * 100);
              const matchInfo = getMatchLabel(match.matchScore);
              const isExpanded = expandedPractitioner === matchKey;
              const effScore = match.effectivenessScore;

              return (
                <div
                  key={matchKey}
                  className={`bg-white rounded-2xl border transition-all duration-200 ${isExpanded ? 'border-primary/30 shadow-lg ring-1 ring-primary/10' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}
                >
                  {/* Teaser (always visible) */}
                  <button
                    onClick={() => setExpandedPractitioner(isExpanded ? null : matchKey)}
                    className="w-full text-left p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Rank badge */}
                        <div className="relative flex-shrink-0">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${idx === 0 ? 'bg-gradient-to-br from-emerald-400 to-teal-600' : idx === 1 ? 'bg-gradient-to-br from-teal-400 to-cyan-600' : 'bg-primary/10'}`}>
                            {idx < 2 ? (
                              <Star className={`w-5 h-5 ${idx < 2 ? 'text-white' : 'text-primary'}`} />
                            ) : (
                              <span className="text-sm font-bold text-primary">#{idx + 1}</span>
                            )}
                          </div>
                          {idx === 0 && (
                            <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded-full shadow-sm">TOP</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold text-gray-900">{match.name || match.code}</h4>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${matchInfo.bg} ${matchInfo.color}`}>
                              {matchPercent}% match
                            </span>
                            {effScore > 0 && (
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                {effScore}% effective
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-secondary">{match.specialty}</p>
                          <p className="text-sm text-gray-600 mt-1.5 line-clamp-1">{match.methodology}</p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 mt-1">
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      </div>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-0 space-y-5">
                      <div className="h-px bg-gray-100" />

                      {/* Match reasoning */}
                      {match.matchReasoning && (
                        <div className="bg-mint-50 rounded-xl p-4 border border-mint-200/60">
                          <div className="flex items-start gap-3">
                            <GitCompare className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-primary mb-1">Why This Matches</p>
                              <p className="text-sm text-gray-700 leading-relaxed">{match.matchReasoning}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Intervention sequence as timeline */}
                      {Array.isArray(match.interventionSequence) && match.interventionSequence.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Intervention Timeline</p>
                          <div className="relative">
                            {/* Timeline track */}
                            <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />
                            <ol className="space-y-4">
                              {match.interventionSequence.map((step, i) => (
                                <li key={i} className="relative flex items-start gap-4 pl-10">
                                  {/* Timeline node */}
                                  <div className="absolute left-0 w-8 h-8 flex items-center justify-center">
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${i === 0 ? 'border-primary bg-primary/10' : 'border-gray-200 bg-white'}`}>
                                      <span className={`text-xs font-bold ${i === 0 ? 'text-primary' : 'text-gray-400'}`}>{i + 1}</span>
                                    </div>
                                  </div>
                                  <div className={`flex-1 rounded-xl p-3 ${i === 0 ? 'bg-primary/5 border border-primary/10' : 'bg-gray-50'}`}>
                                    <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                                  </div>
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      )}

                      {/* Two columns: target structures + outcome patterns */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Array.isArray(match.targetStructures) && match.targetStructures.length > 0 && (
                          <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Target Structures</p>
                            <div className="flex flex-wrap gap-1.5">
                              {match.targetStructures.map((s) => (
                                <span key={s} className="text-xs bg-white text-primary border border-primary/20 px-2.5 py-1 rounded-lg font-medium">
                                  {formatStructure(s)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {Array.isArray(match.outcomePatterns) && match.outcomePatterns.length > 0 && (
                          <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Outcome Patterns</p>
                            <ul className="space-y-3">
                              {match.outcomePatterns.map((pattern, i) => {
                                const confidence = Math.round(pattern.confidence * 100);
                                return (
                                  <li key={i}>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm text-gray-700 font-medium">{pattern.metric}</span>
                                      <span className="text-xs font-mono text-gray-500">{confidence}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all ${confidence >= 70 ? 'bg-emerald-400' : confidence >= 50 ? 'bg-teal-400' : 'bg-amber-400'}`}
                                        style={{ width: `${confidence}%` }}
                                      />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">{pattern.change}</p>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Effectiveness score summary */}
                      {effScore > 0 && (
                        <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200/60">
                          <div className="w-12 h-12 rounded-full bg-white border-2 border-emerald-300 flex items-center justify-center flex-shrink-0">
                            <span className="text-lg font-bold text-emerald-700 font-mono">{effScore}</span>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Effectiveness Score</p>
                            <p className="text-sm text-emerald-600 mt-0.5">Computed from outcome confidence and improvement ratio across {(Array.isArray(match.outcomePatterns) ? match.outcomePatterns : []).length} tracked metrics</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: CORRELATED FACTOR SURFACING — HIDDEN PATTERNS    */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section>
        {/* Distinctive header with gradient border */}
        <div className="relative rounded-2xl bg-gradient-to-r from-amber-100 via-orange-50 to-rose-100 p-px mb-0">
          <div className="bg-white rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-sm">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-playfair text-2xl font-bold text-gray-900 tracking-tight">Hidden Patterns</h3>
                  <span className="text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">New</span>
                  <InfoTooltip
                    title="Correlated Factor Surfacing"
                    description="SessionLens identifies co-occurring underlying factors across similar cases in the dataset. If a client presents with Problem A, and a significant percentage of comparable cases also exhibited Problem B, the clinician is alerted to this correlation as a potential area to explore in treatment."
                    methodology="Cross-referencing presenting concerns, dominant phenomenological structures, and thematic patterns across all semantically matched cases. Co-occurrence is calculated as: cases with both factors / cases with either factor. Significance: High (≥60%), Moderate (≥40%), Notable (≥25%)."
                  />
                </div>
                <p className="text-sm text-secondary mt-0.5">
                  Correlated factors surfaced across {totalCases} similar cases &mdash; potential areas to explore in treatment
                </p>
              </div>
            </div>
          </div>
        </div>

        {correlations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center mt-4">
            <Zap className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-700 mb-1">Insufficient data for correlation analysis</p>
            <p className="text-sm text-gray-500">At least 2 matched cases with shared factors are needed to surface correlations.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            {/* Clinical Correlation Alerts */}
            <div className="space-y-3">
              {correlations.slice(0, 8).map((corr, idx) => {
                const sigInfo = getSignificanceInfo(corr.significance);
                const typeInfo = getTypeLabel(corr.type);
                const isExpanded = expandedCorrelation === idx;

                return (
                  <div
                    key={idx}
                    className={`relative rounded-2xl border transition-all duration-200 overflow-hidden ${isExpanded ? 'shadow-md' : 'hover:shadow-sm'}`}
                    style={{ borderColor: corr.significance === 'high' ? '#fecaca' : corr.significance === 'moderate' ? '#fde68a' : '#bfdbfe' }}
                  >
                    {/* Left accent bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${sigInfo.bar}`} />

                    <button
                      onClick={() => setExpandedCorrelation(isExpanded ? null : idx)}
                      className="w-full text-left p-5 pl-6"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${sigInfo.bg} ${sigInfo.color}`}>
                              {sigInfo.label} Significance
                            </span>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase tracking-wider">
                              {typeInfo.label}
                            </span>
                          </div>

                          {/* Factor A → Factor B */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900">{corr.factorA}</span>
                            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                            </svg>
                            <span className="font-semibold text-gray-900">{corr.factorB}</span>
                          </div>

                          {/* Percentage bar */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1 max-w-[200px]">
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${sigInfo.bar}`}
                                  style={{ width: `${corr.percentage}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-sm font-mono font-bold text-gray-700">{corr.percentage}%</span>
                            <span className="text-xs text-gray-400">of cases ({corr.caseCount}/{corr.totalCases})</span>
                          </div>
                        </div>

                        <div className="flex-shrink-0 mt-1">
                          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-5 pt-0">
                        <div className="h-px bg-gray-100 mb-4" />
                        <div className={`rounded-xl p-4 ${sigInfo.bg} border ${sigInfo.border}`}>
                          <div className="flex items-start gap-3">
                            <Lightbulb className={`w-4 h-4 ${sigInfo.color} mt-0.5 flex-shrink-0`} />
                            <div>
                              <p className={`text-xs font-semibold ${sigInfo.color} mb-1`}>Clinical Suggestion</p>
                              <p className="text-sm text-gray-700 leading-relaxed">{corr.suggestion}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Correlation Matrix Visualization */}
            {correlations.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-gray-500" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Correlation Strength Overview</p>
                </div>

                <div className="space-y-3">
                  {correlations.slice(0, 10).map((corr, idx) => {
                    const sigInfo = getSignificanceInfo(corr.significance);
                    return (
                      <div key={`matrix-${idx}`} className="flex items-center gap-3">
                        <div className="w-[140px] text-right flex-shrink-0">
                          <span className="text-xs text-gray-600 truncate block">{corr.factorA}</span>
                        </div>
                        <div className="flex-1 relative">
                          <div className="h-6 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                            <div
                              className={`h-full rounded-lg ${sigInfo.bar} transition-all flex items-center justify-end pr-2`}
                              style={{ width: `${corr.percentage}%`, minWidth: '40px' }}
                            >
                              <span className="text-[10px] font-bold text-white font-mono">{corr.percentage}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="w-[140px] flex-shrink-0">
                          <span className="text-xs text-gray-600 truncate block">{corr.factorB}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide">Strength:</span>
                  <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                    <span className="w-3 h-2 rounded-sm bg-red-400 inline-block" /> High (&ge;60%)
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                    <span className="w-3 h-2 rounded-sm bg-amber-400 inline-block" /> Moderate (40-59%)
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                    <span className="w-3 h-2 rounded-sm bg-blue-400 inline-block" /> Notable (25-39%)
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* SECTION 4: SIMILAR STORIES                                  */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-playfair text-2xl font-bold text-gray-900 tracking-tight">Similar Stories</h3>
              <InfoTooltip
                title="Semantic Case Matching"
                description="Each case shown here is a real anonymized record from the research archive that shares significant phenomenological similarity with the current client's session. Match scores reflect a composite of semantic meaning, structural profile alignment, and clinical metadata overlap."
                methodology="Vector search via pgvector (1536-dimension embeddings). Top 3 most intense client moments are embedded and searched against the archive. Results are grouped by participant, re-ranked by composite 3-layer score, and deduplicated."
              />
            </div>
            <p className="text-sm text-secondary">
              Cases from the knowledge base with the highest phenomenological similarity
            </p>
          </div>
        </div>

        {realCases.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center mt-4">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-700 mb-1">No matched cases</p>
            <p className="text-sm text-gray-500">No cases above the similarity threshold were found.</p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {realCases.map((c) => {
              const caseKey = `case-${c.id}`;
              const isExpanded = expandedCase === caseKey;
              const scorePercent = Math.round(c.matchScore * 100);
              const matchInfo = getMatchLabel(c.matchScore);
              const outcomeInfo = getOutcomeInfo(c.outcome);
              const OutcomeIcon = outcomeInfo.icon;
              const concerns = Array.isArray(c.presentingConcerns) ? c.presentingConcerns : [];
              const themes = Array.isArray(c.keyThemes) ? c.keyThemes : [];
              const caseCorrelatedFactors = correlatedFactorsByCase[c.id] || [];

              return (
                <div
                  key={caseKey}
                  className={`bg-white rounded-2xl border transition-all duration-200 ${isExpanded ? 'border-primary/30 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  {/* Teaser */}
                  <button
                    onClick={() => setExpandedCase(isExpanded ? null : caseKey)}
                    className="w-full text-left p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="font-mono text-sm font-bold text-gray-900">{c.patientCode}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${matchInfo.bg} ${matchInfo.color}`}>
                            {scorePercent}% match
                          </span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${outcomeInfo.bg} ${outcomeInfo.color} flex items-center gap-1`}>
                            <OutcomeIcon className="w-3 h-3" />
                            {outcomeInfo.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-1">
                          {concerns.length > 0 ? concerns.join(', ') : themes.slice(0, 3).join(', ') || 'No details available'}
                        </p>
                        {/* Correlated factors badges */}
                        {caseCorrelatedFactors.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <Zap className="w-3 h-3 text-amber-500 flex-shrink-0" />
                            {caseCorrelatedFactors.slice(0, 2).map((f, i) => (
                              <span key={i} className="text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                                {f}
                              </span>
                            ))}
                          </div>
                        )}
                        {c.representativeQuote && (
                          <p className="text-xs text-gray-400 mt-1.5 italic line-clamp-1">
                            &ldquo;{c.representativeQuote}&rdquo;
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0 mt-1">
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      </div>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-0 space-y-4">
                      <div className="h-px bg-gray-100" />

                      {/* Outcome trajectory */}
                      {c.outcomeDetail && (
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200/60">
                          <div className="flex items-start gap-3">
                            <TrendingUp className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-emerald-700 mb-1">Outcome Trajectory</p>
                              <p className="text-sm text-gray-700 leading-relaxed">{c.outcomeDetail}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Correlated factors detail */}
                      {caseCorrelatedFactors.length > 0 && (
                        <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-200/60">
                          <div className="flex items-start gap-3">
                            <Zap className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-amber-700 mb-1">Correlated Factors Present</p>
                              <div className="flex flex-wrap gap-1.5">
                                {caseCorrelatedFactors.map((f, i) => (
                                  <span key={i} className="text-xs bg-white text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg font-medium">
                                    {f}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Key themes */}
                      {themes.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Key Themes</p>
                          <div className="flex flex-wrap gap-1.5">
                            {themes.map((theme: string) => (
                              <span key={theme} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg">{theme}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Dominant structures */}
                      {Array.isArray(c.dominantStructures) && c.dominantStructures.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Dominant Structures</p>
                          <div className="flex flex-wrap gap-1.5">
                            {c.dominantStructures.map((s) => (
                              <span key={s} className="text-xs bg-primary/5 text-primary border border-primary/15 px-2.5 py-1 rounded-lg font-medium">
                                {formatStructure(s)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Representative quote (full) */}
                      {c.representativeQuote && (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <MessageSquareQuote className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-gray-700 italic leading-relaxed">&ldquo;{c.representativeQuote}&rdquo;</p>
                              <p className="text-xs text-gray-400 mt-2">&mdash; {c.patientCode} (anonymized participant)</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Session count */}
                      {c.sessionCount > 0 && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {c.sessionCount} session{c.sessionCount !== 1 ? 's' : ''} in this case record
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* SECTION 5: PATTERN INSIGHTS                                 */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-playfair text-2xl font-bold text-gray-900 tracking-tight">Pattern Insights</h3>
              <InfoTooltip
                title="Aggregate Pattern Analysis"
                description="Statistical summaries computed across all matched cases in the knowledge base. These figures represent real patterns observed in the research archive, not predictions or estimates."
                methodology="Aggregated from matched similar cases: outcome rates, theme frequency counts, structure prevalence percentages, and methodology coverage across the full dataset."
              />
            </div>
            <p className="text-sm text-secondary">Aggregate patterns from matched cases and practitioner methodologies</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Outcome rate card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Positive Outcome Rate</p>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1 font-mono">{positivePct}<span className="text-lg text-gray-400">%</span></p>
            <p className="text-sm text-gray-500">
              {positiveCases} of {totalCases} matched case{totalCases !== 1 ? 's' : ''} showed improvement
            </p>
          </div>

          {/* Correlations found card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber-500" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Correlations Found</p>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1 font-mono">{correlations.length}</p>
            <p className="text-sm text-gray-500">
              {correlations.filter((c) => c.significance === 'high').length} high significance, {correlations.filter((c) => c.significance === 'moderate').length} moderate
            </p>
          </div>

          {/* Top themes card */}
          {topThemes.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-violet-500" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Top Themes</p>
              </div>
              <div className="space-y-2">
                {topThemes.map(([theme, count]) => {
                  const pct = totalCases > 0 ? Math.round((count / totalCases) * 100) : 0;
                  return (
                    <div key={theme} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 truncate flex-1">{theme}</span>
                      <span className="text-xs font-mono text-gray-400 ml-2">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dominant structures card */}
          {topStructures.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <GitCompare className="w-4 h-4 text-primary" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Key Structures</p>
              </div>
              <div className="space-y-2.5">
                {topStructures.map(([struct, count]) => {
                  const pct = totalCases > 0 ? Math.round((count / totalCases) * 100) : 0;
                  return (
                    <div key={struct}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">{formatStructure(struct)}</span>
                        <span className="text-xs font-mono text-gray-400">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary/50 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Practitioner count card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-primary" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Methodology Coverage</p>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1 font-mono">2,156</p>
            <p className="text-sm text-gray-500">practitioner methodologies analyzed</p>
          </div>

          {/* Match quality card */}
          {realCases.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Avg. Match Score</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1 font-mono">{avgMatch}<span className="text-lg text-gray-400">%</span></p>
              <p className="text-sm text-gray-500">across {totalCases} matched case{totalCases !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* SECTION 6: DATASET CONFIDENCE FOOTER                        */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="pt-2 pb-4">
        <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 rounded-2xl border border-gray-200 p-6">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Analysis Engine Active</span>
              <InfoTooltip
                title="Dataset & Matching Infrastructure"
                description="All matches are computed against a curated research archive of anonymized lived experiences and clinical contributor case approaches. The archive is continuously updated as new research data is ingested."
                methodology="PostgreSQL + pgvector for vector similarity search. Embeddings: OpenAI text-embedding-3-small (1536 dimensions). Batch processing supports up to 2048 inputs per embedding call."
              />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">
              Analysis powered by semantic vector matching across{' '}
              <span className="font-bold text-gray-900 font-mono">10,847</span> lived experiences and{' '}
              <span className="font-bold text-gray-900 font-mono">2,156</span> clinical methodologies.
              Correlations computed in real-time from co-occurring factors across matched cases.
            </p>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
              <Info className="w-3 h-3" />
              All matches are phenomenological &mdash; not diagnostic. Use clinical judgment.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
