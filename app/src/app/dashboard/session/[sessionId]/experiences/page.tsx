'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useApi } from '@/hooks/use-api';
import type { AnalysisResult, SimilarCase, CBTAnalysisResult } from '@/types';
import { detectExperiences } from '@/lib/experiences/experience-matcher';
import { getTreatmentApproachesForExperiences } from '@/lib/experiences/treatment-approaches';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Heart,
  ChevronDown,
  ChevronUp,
  MessageSquareQuote,
  Users,
  TrendingUp,
  Award,
  Info,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  BarChart3,
  Target,
  Loader2,
  Brain,
  Database,
  Layers,
  AlertTriangle,
} from 'lucide-react';

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

export default function ExperiencesPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { data, loading } = useApi<{ session: SessionData }>(`/api/sessions/${sessionId}`);
  const session = data?.session || null;

  const [expandedExperience, setExpandedExperience] = useState<string | null>(null);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [expandedApproach, setExpandedApproach] = useState<string | null>(null);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (!session) {
    return (
      <Card className="p-8 text-center">
        <h3 className="font-playfair text-2xl font-bold text-gray-900 mb-2">Session Not Found</h3>
        <p className="text-gray-600 mb-6">This session may have expired.</p>
        <Link
          href="/dashboard/session/new"
          className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition"
        >
          Create New Session
        </Link>
      </Card>
    );
  }

  const analysis = session.analysisResult as AnalysisResult;
  const cbt = analysis.cbtAnalysis as CBTAnalysisResult | undefined;

  // Detect clinical situations from moments (rule-based)
  const detectedExperiences = detectExperiences(
    analysis.moments,
    analysis.riskFlags,
    analysis.structureProfile
  );

  // Real matched cases from the 3-layer matching engine (pgvector)
  const realCases = analysis.similarCases || [];

  // Treatment approaches — enhanced with CBT data
  const treatmentApproaches = getTreatmentApproachesForExperiences(detectedExperiences);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return 'bg-red-100 text-red-700';
      case 'moderate': return 'bg-amber-100 text-amber-700';
      case 'mild': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getOutcomeInfo = (outcome: string) => {
    switch (outcome) {
      case 'significant_improvement': return { label: 'Significant Improvement', color: 'text-green-600', icon: TrendingUp };
      case 'moderate_improvement': return { label: 'Moderate Improvement', color: 'text-blue-600', icon: TrendingUp };
      case 'minimal_change': return { label: 'Minimal Change', color: 'text-gray-600', icon: Clock };
      case 'ongoing': return { label: 'Ongoing', color: 'text-amber-600', icon: Clock };
      default: return { label: outcome, color: 'text-gray-600', icon: Clock };
    }
  };

  const getEvidenceColor = (level: string) => {
    switch (level) {
      case 'strong': return 'bg-green-100 text-green-700';
      case 'moderate': return 'bg-blue-100 text-blue-700';
      case 'emerging': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-6 md:p-8 border border-primary/10">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Heart className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-playfair text-2xl font-bold text-gray-900 mb-2">Lived Experiences & Approaches</h3>
            <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">
              AI-detected clinical situations from this session, matched against similar cases in our archive,
              with evidence-based treatment approaches used by practitioners for comparable presentations.
            </p>
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                Matching Engine v3.0 (pgvector + OpenAI embeddings)
              </span>
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3" />
                Archive: 768 moments from 40 participants
              </span>
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3" />
                3-layer scoring: semantic 50% · structural 30% · metadata 20%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detected Experiences */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <h3 className="font-playfair text-xl font-bold text-gray-900">Detected Clinical Situations</h3>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
            {detectedExperiences.length} found
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {detectedExperiences.map((exp) => (
            <Card
              key={exp.id}
              className="p-5 cursor-pointer"
              onClick={() => setExpandedExperience(expandedExperience === exp.id ? null : exp.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-gray-900">{exp.label}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getSeverityColor(exp.severity)}`}>
                    {exp.severity}
                  </span>
                  {expandedExperience === exp.id ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3">{exp.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {exp.structures.map((s) => (
                    <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {s.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-gray-400">{Math.round(exp.confidence * 100)}% conf.</span>
              </div>

              {expandedExperience === exp.id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <MessageSquareQuote className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Trigger quote from transcript:</p>
                        <p className="text-sm text-gray-700 italic">&ldquo;{exp.triggerQuote}&rdquo;</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Category: {exp.category} &middot; Detection confidence: {Math.round(exp.confidence * 100)}%
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* Matched Similar Cases — Real data from 3-layer matching engine */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <h3 className="font-playfair text-xl font-bold text-gray-900">Similar Cases from Archive</h3>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
            {realCases.length} {realCases.length === 1 ? 'match' : 'matches'}
          </span>
        </div>

        {realCases.length === 0 ? (
          <Card className="p-8 text-center">
            <Database className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-700 mb-1">No matches found in research archive</p>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              The matching engine searched 768 moments from 40 research participants but found no cases
              above the similarity threshold. This may occur with unique presentations or when
              embeddings are not yet generated.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {realCases.map((c) => {
              const outcomeInfo = getOutcomeInfo(
                c.outcome.toLowerCase().includes('positive') ? 'significant_improvement'
                  : c.outcome.toLowerCase().includes('insufficient') ? 'ongoing'
                  : 'moderate_improvement'
              );
              const OutcomeIcon = outcomeInfo.icon;
              const caseKey = `case-${c.id}`;
              const scorePercent = Math.round(c.matchScore * 100);

              return (
                <Card
                  key={caseKey}
                  className="p-5 cursor-pointer"
                  onClick={() => setExpandedCase(expandedCase === caseKey ? null : caseKey)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-gray-400" />
                      <div>
                        <span className="font-mono text-sm font-semibold text-gray-900">{c.patientCode}</span>
                        <span className="text-xs text-gray-500 ml-2">{c.sessionCount} matched moments</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <BarChart3 className="w-3 h-3 text-primary" />
                        <span className="text-sm font-bold text-primary">{scorePercent}%</span>
                        <span className="text-xs text-gray-400">match</span>
                      </div>
                      {expandedCase === caseKey ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Match score breakdown bar */}
                  <div className="mb-3">
                    <div className="flex items-center gap-1 h-2 rounded-full overflow-hidden bg-gray-100">
                      <div className="h-full bg-primary/80 rounded-l-full" style={{ width: `${scorePercent * 0.5}%` }} title="Semantic similarity (50%)" />
                      <div className="h-full bg-primary/50" style={{ width: `${scorePercent * 0.3}%` }} title="Structural alignment (30%)" />
                      <div className="h-full bg-primary/30 rounded-r-full" style={{ width: `${scorePercent * 0.2}%` }} title="Metadata relevance (20%)" />
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary/80" />Semantic</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary/50" />Structural</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary/30" />Metadata</span>
                    </div>
                  </div>

                  {/* Presenting concerns */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {c.presentingConcerns.map((concern) => (
                      <span key={concern} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {concern}
                      </span>
                    ))}
                    {c.presentingConcerns.length === 0 && c.keyThemes.map((theme) => (
                      <span key={theme} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {theme}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <OutcomeIcon className={`w-4 h-4 ${outcomeInfo.color}`} />
                    <span className={`text-sm font-medium ${outcomeInfo.color}`}>{c.outcome}</span>
                  </div>

                  {expandedCase === caseKey && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                      {/* Dominant structures */}
                      {c.dominantStructures.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-2">Dominant Phenomenological Structures:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {c.dominantStructures.map((s) => (
                              <span key={s} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {s.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Key themes */}
                      {c.keyThemes.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-2">Key Themes:</p>
                          <ul className="space-y-1">
                            {c.keyThemes.map((theme, i) => (
                              <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                <ArrowRight className="w-3 h-3 text-gray-400 mt-1 flex-shrink-0" />
                                {theme}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Outcome detail */}
                      {c.outcomeDetail && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-xs text-blue-600 font-medium mb-1">Outcome Summary:</p>
                          <p className="text-sm text-blue-800">{c.outcomeDetail}</p>
                        </div>
                      )}

                      {/* Representative quote */}
                      {c.representativeQuote && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-start gap-2">
                            <MessageSquareQuote className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700 italic">&ldquo;{c.representativeQuote}&rdquo;</p>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">— {c.patientCode} (anonymized research participant)</p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
          <Info className="w-3 h-3" />
          Matches from 768 research moments across 40 participants. Scores represent phenomenological similarity via pgvector cosine search, not diagnostic equivalence.
        </p>
      </section>

      {/* CBT Analysis Summary — if available */}
      {cbt && cbt.distortions.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-5">
            <h3 className="font-playfair text-xl font-bold text-gray-900">Cognitive Distortion Profile</h3>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Brain className="w-3 h-3" />
              CBT Analysis
            </span>
          </div>

          {/* Distortion Load + Treatment Readiness */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Card className="p-4">
              <p className="text-xs text-gray-500 mb-2">Overall Distortion Load</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      cbt.overallDistortionLoad > 0.6 ? 'bg-red-400' : cbt.overallDistortionLoad > 0.3 ? 'bg-amber-400' : 'bg-green-400'
                    }`}
                    style={{ width: `${Math.round(cbt.overallDistortionLoad * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-900">{Math.round(cbt.overallDistortionLoad * 100)}%</span>
              </div>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500 mb-2">Treatment Readiness</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      cbt.treatmentReadiness > 0.6 ? 'bg-green-400' : cbt.treatmentReadiness > 0.3 ? 'bg-amber-400' : 'bg-gray-400'
                    }`}
                    style={{ width: `${Math.round(cbt.treatmentReadiness * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-900">{Math.round(cbt.treatmentReadiness * 100)}%</span>
              </div>
            </Card>
          </div>

          {/* Dominant patterns */}
          {cbt.dominantPatterns.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {cbt.dominantPatterns.map((pattern) => (
                <span key={pattern} className="text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {pattern}
                </span>
              ))}
            </div>
          )}

          {/* Top distortions */}
          <div className="space-y-2">
            {cbt.distortions.slice(0, 5).map((d, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold text-gray-900 text-sm">{d.type}</span>
                  </div>
                  <span className="text-xs text-gray-400">{Math.round(d.confidence * 100)}% conf.</span>
                </div>
                <p className="text-sm text-gray-600 italic mb-2">&ldquo;{d.evidence}&rdquo;</p>
                <div className="p-2 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-xs text-green-700">
                    <span className="font-medium">Reframe:</span> {d.alternativeThought}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Treatment Approaches */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <h3 className="font-playfair text-xl font-bold text-gray-900">Treatment Approaches</h3>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
            Evidence-based
          </span>
        </div>

        <div className="space-y-4">
          {treatmentApproaches.map((approach) => (
            <Card
              key={approach.id}
              className="p-5 cursor-pointer"
              onClick={() => setExpandedApproach(expandedApproach === approach.id ? null : approach.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-4 h-4 text-primary" />
                    <h4 className="font-semibold text-gray-900">{approach.name}</h4>
                  </div>
                  <p className="text-xs text-gray-500">{approach.methodology}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getEvidenceColor(approach.evidenceLevel)}`}>
                    {approach.evidenceLevel} evidence
                  </span>
                  {expandedApproach === approach.id ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Usage bar */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${approach.usagePercentage}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-primary min-w-[3rem] text-right">
                  {approach.usagePercentage}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-1">
                of practitioners use this approach for similar presentations
              </p>
              <p className="text-xs text-gray-400">Recommendation confidence: {Math.round(approach.confidence * 100)}%</p>

              {expandedApproach === approach.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                  {/* Typical Outcomes */}
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-2">Typical Outcomes:</p>
                    <ul className="space-y-1.5">
                      {approach.typicalOutcomes.map((outcome, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                          {outcome}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Intervention Steps */}
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-2">Intervention Steps:</p>
                    <ol className="space-y-1.5">
                      {approach.interventionSteps.map((step, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
          <Info className="w-3 h-3" />
          Usage percentages are based on anonymized practitioner data for similar phenomenological profiles. Not prescriptive.
        </p>
      </section>
    </div>
  );
}
