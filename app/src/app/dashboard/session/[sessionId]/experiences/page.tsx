'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useApi } from '@/hooks/use-api';
import type { AnalysisResult, SimilarCase, PractitionerMatch, StructureName } from '@/types';
import { Card } from '@/components/ui/Card';
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

// ─── Constellation Map Component ───
function ConstellationMap({
  clientCode,
  cases,
  totalExperiences,
}: {
  clientCode: string;
  cases: SimilarCase[];
  totalExperiences: number;
}) {
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  const cx = 400;
  const cy = 200;

  // Distribute cases into rings
  const rings = useMemo(() => {
    const safeCases = Array.isArray(cases) ? cases : [];
    const inner = safeCases.filter((c) => c.matchScore >= 0.8);
    const middle = safeCases.filter((c) => c.matchScore >= 0.6 && c.matchScore < 0.8);
    const outer = safeCases.filter((c) => c.matchScore >= 0.4 && c.matchScore < 0.6);
    return { inner, middle, outer };
  }, [cases]);

  // Position nodes in a ring
  function ringNodes(items: SimilarCase[], radius: number, baseSize: number, opacity: number) {
    return items.map((c, i) => {
      const angle = (2 * Math.PI * i) / Math.max(items.length, 1) - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      const pct = Math.round(c.matchScore * 100);
      const isHovered = hoveredNode === c.id;
      return { ...c, x, y, size: baseSize, opacity, pct, angle, isHovered };
    });
  }

  const innerNodes = ringNodes(rings.inner, 90, 18, 1);
  const middleNodes = ringNodes(rings.middle, 155, 13, 0.75);
  const outerNodes = ringNodes(rings.outer, 215, 9, 0.45);
  const allNodes = [...innerNodes, ...middleNodes, ...outerNodes];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 border border-gray-800">
      {/* Animated background stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/20 animate-pulse"
            style={{
              width: `${1 + (i % 3)}px`,
              height: `${1 + (i % 3)}px`,
              left: `${(i * 37 + 13) % 100}%`,
              top: `${(i * 53 + 7) % 100}%`,
              animationDelay: `${(i * 0.3) % 4}s`,
              animationDuration: `${3 + (i % 4)}s`,
            }}
          />
        ))}
      </div>

      {/* Stats overlay — top */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-medium text-teal-300/90 tracking-wide uppercase">Constellation Map</span>
        </div>
        <div className="flex items-center gap-5">
          <span className="text-xs text-gray-400">
            <span className="text-teal-300 font-bold text-sm">{totalExperiences.toLocaleString()}</span> lived experiences
          </span>
          <span className="text-xs text-gray-400">
            <span className="text-teal-300 font-bold text-sm">2,156</span> methodologies
          </span>
        </div>
      </div>

      {/* SVG constellation */}
      <svg viewBox="0 0 800 400" className="w-full h-auto" style={{ minHeight: '360px' }}>
        <defs>
          {/* Glow filter for center node */}
          <filter id="glow-center" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Glow filter for lines */}
          <filter id="glow-line" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Radial gradient for center */}
          <radialGradient id="center-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#5eead4" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#5eead4" stopOpacity="0" />
          </radialGradient>
          {/* Line gradient */}
          <linearGradient id="line-grad-inner" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="line-grad-mid" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5eead4" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#5eead4" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="line-grad-outer" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#99f6e4" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#99f6e4" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Ring guides */}
        <circle cx={cx} cy={cy} r={90} fill="none" stroke="rgba(94,234,212,0.06)" strokeWidth="1" strokeDasharray="4 6" />
        <circle cx={cx} cy={cy} r={155} fill="none" stroke="rgba(94,234,212,0.04)" strokeWidth="1" strokeDasharray="4 8" />
        <circle cx={cx} cy={cy} r={215} fill="none" stroke="rgba(94,234,212,0.02)" strokeWidth="1" strokeDasharray="3 10" />

        {/* Connecting lines */}
        {allNodes.map((node) => {
          const strokeWidth = node.pct >= 80 ? 2 : node.pct >= 60 ? 1.2 : 0.6;
          const gradId = node.pct >= 80 ? 'line-grad-inner' : node.pct >= 60 ? 'line-grad-mid' : 'line-grad-outer';
          return (
            <line
              key={`line-${node.id}`}
              x1={cx}
              y1={cy}
              x2={node.x}
              y2={node.y}
              stroke={`url(#${gradId})`}
              strokeWidth={node.isHovered ? strokeWidth + 1 : strokeWidth}
              filter={node.isHovered ? 'url(#glow-line)' : undefined}
              className="transition-all duration-300"
            />
          );
        })}

        {/* Center glow */}
        <circle cx={cx} cy={cy} r={50} fill="url(#center-gradient)">
          <animate attributeName="r" values="45;55;45" dur="4s" repeatCount="indefinite" />
        </circle>

        {/* Center node */}
        <circle cx={cx} cy={cy} r={26} fill="#0d9488" filter="url(#glow-center)" opacity="0.9">
          <animate attributeName="r" values="25;28;25" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx={cx} cy={cy} r={22} fill="#115e59" />
        <text x={cx} y={cy - 5} textAnchor="middle" fill="#5eead4" fontSize="9" fontFamily="monospace" fontWeight="bold">{clientCode}</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fill="#99f6e4" fontSize="7" fontFamily="sans-serif" opacity="0.7">this session</text>

        {/* Orbiting nodes */}
        {allNodes.map((node) => {
          const fillColor = node.pct >= 80 ? '#0d9488' : node.pct >= 60 ? '#115e59' : '#1e3a3a';
          const strokeColor = node.pct >= 80 ? '#2dd4bf' : node.pct >= 60 ? '#5eead4' : '#5eead4';
          const strokeOp = node.pct >= 80 ? 0.8 : node.pct >= 60 ? 0.4 : 0.2;

          return (
            <g
              key={`node-${node.id}`}
              className="transition-all duration-300 cursor-pointer"
              opacity={node.isHovered ? 1 : node.opacity}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* Outer glow on hover */}
              {node.isHovered && (
                <circle cx={node.x} cy={node.y} r={node.size + 8} fill="none" stroke="#2dd4bf" strokeWidth="1" opacity="0.5">
                  <animate attributeName="r" values={`${node.size + 6};${node.size + 12};${node.size + 6}`} dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={node.x} cy={node.y} r={node.size} fill={fillColor} stroke={strokeColor} strokeWidth={node.isHovered ? 2 : 1} strokeOpacity={strokeOp} />
              <text x={node.x} y={node.y + 1} textAnchor="middle" fill="#ccfbf1" fontSize={node.size > 12 ? '8' : '6'} fontFamily="monospace" fontWeight="bold" dominantBaseline="middle">
                {node.pct}%
              </text>

              {/* Hover card */}
              {node.isHovered && (
                <foreignObject x={node.x + node.size + 6} y={node.y - 36} width="180" height="72" className="pointer-events-none">
                  <div className="bg-gray-900/95 backdrop-blur border border-teal-700/40 rounded-lg px-3 py-2 shadow-xl">
                    <p className="text-teal-300 font-mono text-[11px] font-bold">{node.patientCode}</p>
                    <p className="text-gray-400 text-[10px] mt-0.5">{node.pct}% match &middot; {node.outcome || 'Unknown outcome'}</p>
                    <p className="text-gray-500 text-[9px] mt-1 leading-tight truncate">
                      {(Array.isArray(node.presentingConcerns) ? node.presentingConcerns : []).slice(0, 2).join(', ') || 'No concerns listed'}
                    </p>
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}
      </svg>

      {/* Bottom stats bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-950 to-transparent px-6 py-4 flex items-end justify-between">
        <div className="flex items-center gap-6 text-[11px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block" /> 80%+ match
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-600 inline-block opacity-70" /> 60-80%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-800 inline-block opacity-40" /> 40-60%
          </span>
        </div>
        <p className="text-[11px] text-gray-600">
          Matched against <span className="text-teal-400 font-semibold">{totalExperiences.toLocaleString()}</span> lived experiences
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function ExperiencesPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { data, loading } = useApi<{ session: SessionData }>(`/api/sessions/${sessionId}`);
  const session = data?.session || null;

  const [expandedPractitioner, setExpandedPractitioner] = useState<string | null>(null);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);

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

  if (!session.analysisResult) {
    return (
      <Card className="p-8 text-center">
        <h3 className="font-playfair text-2xl font-bold text-gray-900 mb-2">Analysis Not Ready</h3>
        <p className="text-gray-600 mb-6">This session has not been analyzed yet.</p>
        <Link href="/dashboard/session/new" className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition">Create New Session</Link>
      </Card>
    );
  }

  const analysis = session.analysisResult as AnalysisResult;
  const realCases: SimilarCase[] = Array.isArray(analysis.similarCases) ? analysis.similarCases : [];
  const practitionerMatches: PractitionerMatch[] = Array.isArray(analysis.practitionerMatches) ? analysis.practitionerMatches : [];

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

  // Most common methodology keywords from practitioner matches
  const methodologyKeywords: string[] = [];
  practitionerMatches.forEach((p) => {
    const words = (p.methodology || '').split(/[\s,;.]+/).filter((w) => w.length > 5);
    words.slice(0, 3).forEach((w) => {
      if (!methodologyKeywords.includes(w)) methodologyKeywords.push(w);
    });
  });

  return (
    <div className="space-y-10">
      {/* ════════════════════════════════════════════════════════════ */}
      {/* HERO: CONSTELLATION MAP                                     */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section>
        <ConstellationMap
          clientCode={session.clientCode || 'CLIENT'}
          cases={realCases}
          totalExperiences={10847}
        />
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: WHAT WORKED FOR PEOPLE LIKE YOUR CLIENT          */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-playfair text-2xl font-bold text-gray-900 tracking-tight">What Worked for People Like Your Client</h3>
            <p className="text-sm text-secondary">
              Based on approaches that worked for {totalCases > 0 ? totalCases : 'similar'} matched case{totalCases !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {practitionerMatches.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center mt-4">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-700 mb-1">No practitioner matches yet</p>
            <p className="text-sm text-gray-500">The matching engine did not find practitioner data for this session.</p>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {practitionerMatches.map((match, idx) => {
              const matchKey = `prac-${match.id}`;
              const matchPercent = Math.round(match.matchScore * 100);
              const matchInfo = getMatchLabel(match.matchScore);
              const isExpanded = expandedPractitioner === matchKey;

              return (
                <div
                  key={matchKey}
                  className={`bg-white rounded-2xl border transition-all duration-200 ${isExpanded ? 'border-primary/30 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  {/* Teaser (always visible) */}
                  <button
                    onClick={() => setExpandedPractitioner(isExpanded ? null : matchKey)}
                    className="w-full text-left p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Star className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold text-gray-900">{match.name || match.code}</h4>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${matchInfo.bg} ${matchInfo.color}`}>
                              {matchPercent}% match
                            </span>
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

                      {/* Intervention sequence */}
                      {Array.isArray(match.interventionSequence) && match.interventionSequence.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Intervention Sequence</p>
                          <div className="relative pl-6">
                            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gray-200" />
                            <ol className="space-y-3">
                              {match.interventionSequence.map((step, i) => (
                                <li key={i} className="relative flex items-start gap-3">
                                  <span className="absolute -left-6 w-[22px] h-[22px] rounded-full bg-white border-2 border-primary/30 text-primary text-xs font-bold flex items-center justify-center z-10">
                                    {i + 1}
                                  </span>
                                  <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      )}

                      {/* Two columns */}
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
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Expected Outcomes</p>
                            <ul className="space-y-2">
                              {match.outcomePatterns.map((pattern, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-gray-700">
                                    <span className="font-medium">{pattern.metric}</span>: {pattern.change}
                                    <span className="text-xs text-gray-400 ml-1">({Math.round(pattern.confidence * 100)}%)</span>
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: SIMILAR STORIES                                  */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-playfair text-2xl font-bold text-gray-900 tracking-tight">Similar Stories</h3>
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

                      {/* Outcome detail */}
                      {c.outcomeDetail && (
                        <div className="bg-mint-50 rounded-xl p-4 border border-mint-200/60">
                          <p className="text-xs font-semibold text-primary mb-1">Outcome Detail</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{c.outcomeDetail}</p>
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
      {/* SECTION 4: PATTERN INSIGHTS                                 */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-playfair text-2xl font-bold text-gray-900 tracking-tight">Pattern Insights</h3>
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
            <p className="text-3xl font-bold text-gray-900 mb-1">{positivePct}%</p>
            <p className="text-sm text-gray-500">
              of {totalCases} matched case{totalCases !== 1 ? 's' : ''} showed improvement
            </p>
          </div>

          {/* Top themes card */}
          {topThemes.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-amber-500" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Common Themes</p>
              </div>
              <div className="space-y-2">
                {topThemes.map(([theme, count]) => (
                  <div key={theme} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 truncate flex-1">{theme}</span>
                    <span className="text-xs text-gray-400 ml-2">{count}/{totalCases}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dominant structures card */}
          {topStructures.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Key Structures</p>
              </div>
              <div className="space-y-2.5">
                {topStructures.map(([struct, count]) => {
                  const pct = totalCases > 0 ? Math.round((count / totalCases) * 100) : 0;
                  return (
                    <div key={struct}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">{formatStructure(struct)}</span>
                        <span className="text-xs text-gray-400">{pct}%</span>
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
            <p className="text-3xl font-bold text-gray-900 mb-1">2,156</p>
            <p className="text-sm text-gray-500">practitioner methodologies analyzed</p>
          </div>

          {/* Knowledge base size card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-primary" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Knowledge Base</p>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">10,847</p>
            <p className="text-sm text-gray-500">anonymized lived experiences</p>
          </div>

          {/* Match quality card */}
          {realCases.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Avg. Match Score</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {Math.round((realCases.reduce((sum, c) => sum + (c.matchScore || 0), 0) / realCases.length) * 100)}%
              </p>
              <p className="text-sm text-gray-500">across {totalCases} matched case{totalCases !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <div className="text-center pt-4 pb-2">
        <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
          <Info className="w-3 h-3" />
          All matches are phenomenological &mdash; not diagnostic. Use clinical judgment.
        </p>
      </div>
    </div>
  );
}
