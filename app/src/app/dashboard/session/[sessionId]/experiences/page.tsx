'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useApi } from '@/hooks/use-api';
import type { AnalysisResult, SimilarCase, PractitionerMatch } from '@/types';
import { Card } from '@/components/ui/Card';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { LineagePopover, type LineageSnippet } from '@/components/ui/LineagePopover';
import { ExperienceNetwork } from '@/components/experiences/ExperienceNetwork';
import { buildNetworkData } from '@/lib/analysis/network-analysis';
import { extractKnownUnknowns } from '@/lib/analysis/known-unknowns';
import { Search } from 'lucide-react';
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
  BarChart3,
  Zap,
  Info,
  Target,
  Link2,
  Network,
  GitBranch,
  Layers,
  CircleDashed,
  EyeOff,
  Pin,
  PinOff,
  HelpCircle,
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
    return `Explore shared dynamics underlying both themes`;
  }
  return `Consider screening for ${factorB} — it shows up alongside ${factorA} in similar cases`;
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

// ─── Collapsible Section ───
function CollapsibleSection({
  title,
  icon,
  teaser,
  children,
  defaultOpen = false,
  tooltip,
}: {
  title: string;
  icon: React.ReactNode;
  teaser: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  tooltip?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-md border border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition rounded-t-2xl"
      >
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="font-playfair text-lg font-bold text-gray-900">{title}</h3>
          {tooltip}
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className="px-6 pb-4 -mt-1">{teaser}</div>
      {isOpen && (
        <div className="px-6 pb-6 pt-2 border-t border-gray-100">{children}</div>
      )}
    </div>
  );
}

// ─── Experiential Field Helpers ───
const QUADRANT_LABELS: Record<string, { name: string; position: string; structure: string }> = {
  'embodied_self': { name: 'Embodied Self', position: 'Inner / Direct', structure: 'embodied_self' },
  'sensory_connection': { name: 'Sensory Connection', position: 'Outer / Direct', structure: 'sensory_connection' },
  'narrative_self': { name: 'Narrative Self', position: 'Inner / Interpretive', structure: 'narrative_self' },
  'thought_movements': { name: 'Thought Movements', position: 'Outer / Interpretive', structure: 'thought_movements' },
};

const QUADRANT_COLORS: Record<string, string> = {
  'inner-direct': '#F97316',
  'outer-direct': '#06B6D4',
  'inner-interpretive': '#7C3AED',
  'outer-interpretive': '#4F46E5',
};

function getDominantQuadrantLabel(q: string): string {
  const map: Record<string, string> = {
    'inner-direct': 'Inner / Direct (Embodied Self)',
    'outer-direct': 'Outer / Direct (Sensory Connection)',
    'inner-interpretive': 'Inner / Interpretive (Narrative Self)',
    'outer-interpretive': 'Outer / Interpretive (Thought Movements)',
  };
  return map[q] || q;
}

// ─── Main Page ───
export default function ExperiencesPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { data, loading } = useApi<{ session: SessionData }>(`/api/sessions/${sessionId}`);
  const session = data?.session || null;

  const [expandedPractitioner, setExpandedPractitioner] = useState<string | null>(null);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);

  // Next-session probe tracker — doctor pins Known-Unknown entries they want to
  // come back to. Stored in localStorage scoped per session. Toast confirms the
  // action; the pinned set drives the badge color and pin/unpin button label.
  const [pinnedProbes, setPinnedProbes] = useState<Set<string>>(new Set());
  const [probeToast, setProbeToast] = useState<string | null>(null);
  const probeStorageKey = sessionId ? `sessionlens-probes-${sessionId}` : '';
  useEffect(() => {
    if (!probeStorageKey || typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(probeStorageKey);
      if (raw) {
        const ids = JSON.parse(raw);
        if (Array.isArray(ids)) setPinnedProbes(new Set(ids));
      }
    } catch {
      /* ignore */
    }
  }, [probeStorageKey]);
  const toggleProbe = (entryId: string, theme: string) => {
    const next = new Set(pinnedProbes);
    if (next.has(entryId)) {
      next.delete(entryId);
      setProbeToast(`Removed "${theme}" from invite list`);
    } else {
      next.add(entryId);
      setProbeToast(`Pinned "${theme}" — invite gently next session`);
    }
    setPinnedProbes(next);
    if (typeof window !== 'undefined' && probeStorageKey) {
      try {
        window.localStorage.setItem(probeStorageKey, JSON.stringify(Array.from(next)));
      } catch {
        /* ignore */
      }
    }
    window.setTimeout(() => setProbeToast(null), 2200);
  };

  // Real corpus counts from Supabase (P0-1 audit). When the request fails or
  // returns 503 we leave this null and the corpus-size copy stays hidden.
  const [corpusStats, setCorpusStats] = useState<{
    livedExperiences: number;
    codedMoments: number;
    practitionerMethods: number;
  } | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/corpus-stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((stats) => {
        if (!cancelled && stats && typeof stats.livedExperiences === 'number') {
          setCorpusStats(stats);
        }
      })
      .catch(() => {
        // Stay null → UI hides corpus copy.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Extract data BEFORE early returns so hooks are always called in the same order
  const analysis = (session?.analysisResult || null) as AnalysisResult | null;
  const realCases: SimilarCase[] = analysis && Array.isArray(analysis.similarCases) ? analysis.similarCases : [];
  const practitionerMatches: PractitionerMatch[] = analysis && Array.isArray(analysis.practitionerMatches) ? analysis.practitionerMatches : [];

  // Compute correlations (always called — hooks must not be conditional)
  const correlations = useMemo(() => computeCorrelations(realCases), [realCases]);

  // Compute "Known Unknowns" — themes frequent in neighbor cases but absent from this session
  const knownUnknowns = useMemo(() => {
    if (!analysis) return [];
    return extractKnownUnknowns(analysis);
  }, [analysis]);

  // Build experience network (co-occurrence graph of 10 phenomenological dimensions)
  const networkData = useMemo(() => {
    const moments = analysis && Array.isArray(analysis.moments) ? analysis.moments : [];
    return buildNetworkData(moments);
  }, [analysis]);

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

  // Total matched-case count — kept for the Practitioner section subtitle
  // ("X matched cases"). The other aggregate-stat computations (themeCount,
  // structCount, avgMatch, helpfulCoveragePct) lived only in the now-removed
  // Pattern Insights section and were deleted along with it.
  const totalCases = realCases.length;

  // Highest effectiveness score
  const topEffectiveness = rankedPractitioners.length > 0 ? rankedPractitioners[0].effectivenessScore : 0;

  return (
    <div className="space-y-10">
      {/* ════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: SOLUTION MATCHING — WHAT WORKED                  */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section>
        {/* Bare-icon header — matches the Summary page's clinical/professional
            visual style. No colored-box wrapper around the icon. */}
        <div className="flex items-center gap-3 mb-2">
          <Lightbulb className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-playfair text-2xl font-bold text-gray-900 tracking-tight">What Worked for People Like Your Client</h3>
              <InfoTooltip
                title="Solution Matching Engine"
                description={
                  corpusStats
                    ? `For a given client presentation, Session Polaris retrieves similar cases from a dataset of ${corpusStats.livedExperiences.toLocaleString()} lived experiences using semantic vector matching. It then surfaces the interventions and approaches that produced the strongest outcomes across those matches.`
                    : 'For a given client presentation, Session Polaris retrieves similar cases from the lived-experience archive using semantic vector matching. It then surfaces the interventions and approaches that produced the strongest outcomes across those matches.'
                }
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
          <div className="bg-white rounded-md border border-gray-200 p-8 text-center mt-4">
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
                  className={`bg-white rounded-md border  ${isExpanded ? 'border-primary/30  ring-1 ring-primary/10' : 'border-gray-200 hover:border-gray-300 hover:'}`}
                >
                  {/* Teaser (always visible) */}
                  <button
                    onClick={() => setExpandedPractitioner(isExpanded ? null : matchKey)}
                    className="w-full text-left p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Rank number — same monoline circle pattern used for the
                            4-step workflow on the new-session page. No gradient
                            boxes, no orange corner badges. The "Top match"
                            distinction moves into a small inline text chip beside
                            the practitioner name (see below). */}
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold text-gray-900">
                              <LineagePopover
                                snippets={match.matchReasoning ? [{ text: match.matchReasoning }] : []}
                                methodology={match.specialty}
                                literatureRef={match.methodology}
                              >
                                <span>{match.specialty}</span>
                              </LineagePopover>
                            </h4>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${matchInfo.bg} ${matchInfo.color}`}>
                              {matchPercent}% match
                            </span>
                            {effScore > 0 && (
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                {effScore}% effective
                              </span>
                            )}
                            {idx === 0 && (
                              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                Top match
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">Based on methodology by {match.name || match.code}</p>
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
      {/* SECTION 2b: EXPERIENCE MAP — NETWORK GRAPH OF DIMENSIONS    */}
      {/* ════════════════════════════════════════════════════════════ */}
      {networkData.stats.totalMoments > 0 && (
        <section>
          <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 sm:p-7 border-b border-gray-100">
              <div className="flex items-start gap-3">
                <Network className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-playfair text-2xl font-bold text-gray-900 tracking-tight">Experience Map</h3>
                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">Structural</span>
                    <InfoTooltip
                      title="Experience Map — Network Analysis"
                      description="Visualizes how the 10 phenomenological dimensions co-occur in this client's coded moments. Node size reflects centrality (how many other dimensions it connects to). Edge thickness reflects co-occurrence strength. Colors group dimensions that cluster together. Dashed amber rings mark bridge dimensions — those connecting otherwise-separate clusters."
                      methodology="Derived from the Pattern Theory of Self (Gallagher 2013; Daly et al. 2024). Co-occurrence matrix built from moment-level structure codings. Clusters detected via connected-component grouping; bridges identified as nodes spanning multiple clusters."
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">How this client's experience connects across {networkData.stats.totalMoments} coded moment{networkData.stats.totalMoments !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            {/* Graph + Insights */}
            <div className="grid lg:grid-cols-5 gap-6 p-6 sm:p-7">
              {/* Left: Graph */}
              <div className="lg:col-span-3 bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                <ExperienceNetwork data={networkData} />
              </div>

              {/* Right: Insights */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pattern Insights</p>
                </div>
                {networkData.insights.map((insight) => {
                  const iconMap = {
                    centrality: <Target className="w-4 h-4" />,
                    bridge: <GitBranch className="w-4 h-4" />,
                    cluster: <Layers className="w-4 h-4" />,
                    implication: <Zap className="w-4 h-4" />,
                    isolation: <CircleDashed className="w-4 h-4" />,
                    absence: <EyeOff className="w-4 h-4" />,
                  };
                  const colorMap = {
                    centrality: { bg: 'bg-teal-50', border: 'border-teal-200', icon: 'bg-teal-100 text-teal-700' },
                    bridge: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-100 text-amber-700' },
                    cluster: { bg: 'bg-violet-50', border: 'border-violet-200', icon: 'bg-violet-100 text-violet-700' },
                    implication: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'bg-emerald-100 text-emerald-700' },
                    // Isolation: a node present but disconnected — coral/rose to read as
                    // "this needs your attention, possibly compartmentalization"
                    isolation: { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'bg-rose-100 text-rose-700' },
                    // Absence: dimension didn't surface at all — slate-grey to read as
                    // "noticed gap, not alarm" (clinician decides if it matters)
                    absence: { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'bg-slate-100 text-slate-700' },
                  };
                  const color = colorMap[insight.type];
                  return (
                    <div key={insight.id} className={`${color.bg} ${color.border} border rounded-xl p-4`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg ${color.icon} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          {iconMap[insight.type]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 mb-1">{insight.title}</p>
                          <p className="text-xs text-gray-700 leading-relaxed">{insight.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Stats footer */}
                <div className="pt-3 mt-2 border-t border-gray-100 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Network Density</p>
                    <p className="text-lg font-bold text-gray-900 font-mono">{Math.round(networkData.stats.density * 100)}%</p>
                    <p className="text-[10px] text-gray-500">of possible connections active</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Active Dimensions</p>
                    <p className="text-lg font-bold text-gray-900 font-mono">
                      {networkData.nodes.filter((n) => n.rawDegree > 0).length}<span className="text-gray-400 text-sm font-normal"> / 10</span>
                    </p>
                    <p className="text-[10px] text-gray-500">dimensions engaged this session</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: PATTERNS FROM SIMILAR CASES                      */}
      {/* (Known Unknowns + Unknown Unknowns research roadmap)         */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section>
        {/* The "Patterns from similar cases" gradient header block was removed by request.
            The two subsections below (Known Unknowns + Unknown Unknowns research roadmap)
            still render — they each have their own self-explanatory headers, so the
            container header was redundant. */}

        {/* ─── SUBSECTION 1: KNOWN UNKNOWNS ─── */}
        {/* Bare-icon header. Search icon (not Zap) — Zap is reserved for the
            small correlation-factor badges so the same icon doesn't carry
            two different meanings on the same page. */}
        {realCases.length > 0 && analysis.analysisStatus !== 'mock' && (
          <div className="bg-white rounded-md border border-gray-200 p-6 mb-4">
            <div className="flex items-start gap-3 mb-4">
              <Search className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-playfair text-lg font-bold text-gray-900">
                  Hidden content this client may carry but hasn&apos;t named yet
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Childhood material, trauma echoes, and shame-laden topics that comparable clients commonly disclosed only later in treatment — worth gentle invitation, not direct excavation.
                </p>
              </div>
            </div>

            {knownUnknowns.length === 0 ? (
              <div className="text-center py-8 px-4 bg-gray-50 rounded-xl border border-gray-100">
                <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Nothing to surface
                </p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  This session already covers the themes that similar cases described. No additional probes suggested.
                </p>
              </div>
            ) : (
              // Rich case-study card per entry — the research-engine pitch.
              // Each entry shows: hero %, theme + type badge, verbatim quotes
              // from comparable clients, clinician observation + concrete probe
              // question, and a pin-for-next-session action.
              <div className="space-y-4">
                {knownUnknowns.map((entry) => {
                  const isPinned = pinnedProbes.has(entry.id);
                  const themeTypeLabel =
                    entry.themeType === 'concern'
                      ? 'Presenting Concern'
                      : entry.themeType === 'structure'
                        ? 'Structural Pattern'
                        : 'Thematic Pattern';
                  return (
                    <article
                      key={entry.id}
                      className={`relative rounded-md border-2 overflow-hidden transition-all ${
                        isPinned
                          ? 'border-primary/30 bg-primary/[0.02] '
                          : 'border-amber-200/70 bg-white hover:border-amber-300'
                      }`}
                    >
                      {/* Left accent bar */}
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-1 ${
                          isPinned ? 'bg-primary' : 'bg-amber-400'
                        }`}
                      />

                      {/* HEADER: hero metric + theme + type badge */}
                      <div className="pl-5 pr-5 pt-5 pb-4 flex items-start gap-4 border-b border-gray-100">
                        {/* Big % box — hero visual weight */}
                        <div className="flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-md bg-amber-50 border border-amber-200">
                          <p className="text-2xl font-bold text-amber-700 font-mono leading-none">
                            {entry.percentage}<span className="text-sm">%</span>
                          </p>
                          <p className="text-[10px] text-amber-600/70 mt-1 font-mono">
                            {entry.caseCount}/{entry.totalNeighbors} cases
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h5 className="font-playfair text-xl font-bold text-gray-900 leading-tight">
                              {entry.theme}
                            </h5>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase tracking-wider whitespace-nowrap">
                              {themeTypeLabel}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            <span className="font-semibold text-gray-800">{entry.caseCount} of {entry.totalNeighbors}</span> comparable clients carried this — but it hasn&apos;t come up yet in this session&apos;s coded moments, CBT distortions, or clinical priority. Comparable cases often disclosed it only after several sessions.
                          </p>
                        </div>
                      </div>

                      {/* QUOTES: verbatim from comparable clients (no popover hide!) */}
                      {entry.supportingCases.length > 0 && (
                        <div className="pl-5 pr-5 pt-4 pb-3 bg-gray-50/40 border-b border-gray-100">
                          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                            <MessageSquareQuote className="w-3 h-3" />
                            How comparable clients described carrying it (once they did name it)
                          </p>
                          <ul className="space-y-2.5">
                            {entry.supportingCases.slice(0, 3).map((c, idx) => (
                              <li key={`${entry.id}-q-${idx}`} className="flex items-start gap-2.5">
                                <span className="text-amber-400 text-base leading-none mt-0.5 flex-shrink-0">&ldquo;</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-800 italic leading-relaxed">
                                    {c.representativeQuote}
                                  </p>
                                  <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                                    &mdash; {c.patientCode} <span className="not-italic text-gray-400/80">(anonymized)</span>
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ul>
                          {entry.supportingCases.length > 3 && (
                            <p className="text-[10px] text-gray-400 mt-2 italic">
                              + {entry.supportingCases.length - 3} more comparable case{entry.supportingCases.length - 3 === 1 ? '' : 's'} in the archive
                            </p>
                          )}
                        </div>
                      )}

                      {/* CLINICAL MOVE: observation + concrete probe */}
                      <div className="pl-5 pr-5 pt-4 pb-4">
                        <div className="flex items-start gap-2.5 mb-3">
                          <Lightbulb className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider mb-1">
                              Why it stays hidden &middot; how to invite it
                            </p>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {entry.clinicalMove.observation}
                            </p>
                          </div>
                        </div>
                        {entry.clinicalMove.probe && (
                          <div className="ml-7 mt-2 p-3 bg-emerald-50/60 border border-emerald-100 rounded-lg">
                            <div className="flex items-start gap-2">
                              <HelpCircle className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-gray-800 leading-relaxed">
                                <span className="font-semibold text-emerald-800">Gentle invitation:</span>{' '}
                                {entry.clinicalMove.probe}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* ACTION: pin for next session */}
                        <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-gray-100">
                          <span className="text-[11px] text-gray-400">
                            Source cases: {entry.supportingCases.map((c) => c.patientCode).join(', ')}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleProbe(entry.id, entry.theme)}
                            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                              isPinned
                                ? 'bg-primary text-white hover:bg-primary-dark'
                                : 'bg-white border border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary'
                            }`}
                          >
                            {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                            {isPinned ? 'Pinned to invite next session' : 'Pin to invite next session'}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}

                {/* Pinned-probes summary toast/strip */}
                {pinnedProbes.size > 0 && (
                  <div className="flex items-start gap-2.5 p-3 bg-primary/5 border border-primary/15 rounded-lg">
                    <Pin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-primary">
                        {pinnedProbes.size} {pinnedProbes.size === 1 ? 'topic' : 'topics'} pinned to invite next session
                      </p>
                      <p className="text-[11px] text-gray-600 mt-0.5">
                        Hidden content worth gently making space for. These will appear in your pre-session prep when you open this client next time.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Floating toast for pin actions */}
            {probeToast && (
              <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm rounded-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
                <Pin className="w-4 h-4 text-primary" />
                {probeToast}
              </div>
            )}
          </div>
        )}

        {/* "Patterns no one has described yet" research-roadmap card was removed
            by request. The Known Unknowns subsection above is now the only
            content in this section. ClusterPlaceholder + FlaskConical icon
            references remain in code for now in case the roadmap card is
            reinstated later — they're tree-shaken if unused. */}
      </section>


      {/* ════════════════════════════════════════════════════════════ */}
      {/* SECTION 4: SIMILAR STORIES                                  */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-5 h-5 text-primary flex-shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-playfair text-2xl font-bold text-gray-900 tracking-tight">Similar Stories</h3>
              <InfoTooltip
                title="Semantic Case Matching"
                description="Each case shown here is a real anonymized record from the research archive that shares significant phenomenological similarity with the current client's session. Match scores reflect a composite of semantic meaning, structural profile alignment, and clinical metadata overlap."
                methodology="Vector search via pgvector embeddings. Top 3 most intense client moments are embedded and searched against the archive. Results are grouped by participant, re-ranked by composite 3-layer score, and deduplicated."
              />
            </div>
            <p className="text-sm text-secondary">
              Cases from the knowledge base with the closest experience pattern match
            </p>
          </div>
        </div>

        {realCases.length === 0 ? (
          <div className="bg-white rounded-md border border-gray-200 p-8 text-center mt-4">
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
              const themes = Array.isArray(c.keyThemes) ? c.keyThemes : [];
              const helpfulMoments = Array.isArray(c.helpfulMoments) ? c.helpfulMoments : [];
              const caseCorrelatedFactors = correlatedFactorsByCase[c.id] || [];

              // Demographic line: "Female, 26-35 · Attachment trauma & panic recovery"
              const demoBits: string[] = [];
              if (c.gender) demoBits.push(c.gender.charAt(0).toUpperCase() + c.gender.slice(1));
              if (c.ageRange) demoBits.push(c.ageRange);
              const demoLine = [demoBits.join(', '), c.primaryTopic].filter(Boolean).join(' · ');

              return (
                <div
                  key={caseKey}
                  className={`bg-white rounded-md border  ${isExpanded ? 'border-primary/30 ' : 'border-gray-200 hover:border-gray-300'}`}
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
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                            Lived-experience archive
                          </span>
                        </div>
                        {demoLine && (
                          <p className="text-sm text-gray-600 mb-1.5">{demoLine}</p>
                        )}
                        {c.matchBasis && (
                          <p className="text-xs text-gray-500 leading-relaxed">
                            <span className="font-semibold text-gray-600">Match basis: </span>
                            {c.matchBasis}
                          </p>
                        )}
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
                      </div>
                      <div className="flex-shrink-0 mt-1">
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      </div>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-0 space-y-5">
                      <div className="h-px bg-gray-100" />

                      {/* What helped this person — the product */}
                      {helpfulMoments.length > 0 ? (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Lightbulb className="w-4 h-4 text-emerald-600" />
                            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              What this person said helped them
                            </p>
                            <InfoTooltip
                              title="What helped them"
                              description="Turning-point quotes drawn from this person's own account — moments where they describe what they noticed, named, started, or that shifted for them. These are NOT clinician annotations or outcome scores; they are the participant's own words."
                              methodology="Selected from this story's coded moments by: positive or mixed valence + presence of reflective or narrative structure + turning-point keyword scan ('started', 'began', 'broke', 'shifted', 'noticed', 'realized', 'what worked', 'could finally'). Sorted by intensity, top 3."
                            />
                          </div>
                          <div className="space-y-3">
                            {helpfulMoments.map((m, idx) => {
                              const ts = m.timestamp || '';
                              const structures = Array.isArray(m.structures) ? m.structures : [];
                              return (
                                <div key={`${c.id}-help-${idx}`} className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-4">
                                  <div className="flex items-start gap-3">
                                    <MessageSquareQuote className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-gray-800 italic leading-relaxed">
                                        &ldquo;{m.quote}&rdquo;
                                      </p>
                                      <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          {structures.map((s, si) => (
                                            <span
                                              key={si}
                                              className="text-[10px] bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full"
                                            >
                                              {formatStructure(String(s))}
                                            </span>
                                          ))}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {ts && (
                                            <span className="text-[10px] font-mono text-gray-400">{ts}</span>
                                          )}
                                          <LineagePopover
                                            snippets={[{
                                              text: m.quote,
                                              timestamp: m.timestamp,
                                              momentId: m.momentId,
                                              speaker: 'client',
                                            }]}
                                            methodology={`Source: anonymized participant ${c.patientCode} · lived-experience archive. Selected as a turning-point moment by valence + structure + keyword filter on this person's coded moments.`}
                                          >
                                            <span className="text-[10px] text-gray-400">source</span>
                                          </LineagePopover>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No turning-point moments coded for this story yet.</p>
                      )}

                      {/* Their journey — structural arc as data, not interpretation */}
                      {c.journey && (Array.isArray(c.journey.early) && c.journey.early.length > 0) && (
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="w-4 h-4 text-gray-500" />
                            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Their journey</p>
                            <InfoTooltip
                              title="Structural arc"
                              description="How this story's experience pattern reorganized over the arc of the participant's narrative. Stated as DATA — the dominant structures in their earliest moments vs their latest moments. Not a prescription for your client."
                              methodology="Computed by splitting this story's coded moments into early/late halves by timestamp and identifying the top dominant structures in each half. The shift is descriptive of THIS PERSON'S arc; the clinician decides whether the pattern is meaningful for their own client."
                            />
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            <span className="text-gray-500">Early in story:</span>{' '}
                            <span className="font-medium text-gray-900">
                              {c.journey.early.map((s) => formatStructure(String(s))).join(' + ')}
                            </span>
                            <br />
                            <span className="text-gray-500">Late in story:</span>{' '}
                            <span className="font-medium text-gray-900">
                              {c.journey.late.map((s) => formatStructure(String(s))).join(' + ')}
                            </span>
                          </p>
                          {c.journey.momentCount > 0 && (
                            <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {c.journey.momentCount} coded moments in this story
                            </p>
                          )}
                        </div>
                      )}

                      {/* Themes you both carry (correlated factors) */}
                      {caseCorrelatedFactors.length > 0 && (
                        <div className="bg-amber-50/40 border border-amber-100 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <Zap className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1.5">Themes you both carry</p>
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

                      {/* Key themes & dominant structures (compact) */}
                      <div className="grid sm:grid-cols-2 gap-3 text-xs">
                        {themes.length > 0 && (
                          <div>
                            <p className="font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Key themes</p>
                            <div className="flex flex-wrap gap-1">
                              {themes.map((theme: string) => (
                                <span key={theme} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">{theme}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {Array.isArray(c.dominantStructures) && c.dominantStructures.length > 0 && (
                          <div>
                            <p className="font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Dominant structures</p>
                            <div className="flex flex-wrap gap-1">
                              {c.dominantStructures.map((s) => (
                                <span key={s} className="bg-primary/5 text-primary border border-primary/15 px-2 py-0.5 rounded-md font-medium">
                                  {formatStructure(s)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Anonymity attribution */}
                      <p className="text-[10px] text-gray-400 text-center pt-1">
                        Quotes from anonymized participant {c.patientCode}. Lived-experience archive — not a therapy session record.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 5 (Pattern Insights aggregate cards) removed by request —
          the same signal lives elsewhere on this page (per-card match scores,
          per-card themes, per-case structures, the Hidden Patterns / correlations
          panel). The aggregate roll-up was redundant and added scroll length
          without adding clinical decision value. Can be reinstated as a
          collapsible footer if needed later. */}
    </div>
  );
}
