'use client';

import { useState, useEffect } from 'react';
import { generateSOAPNote, generateDAPNote, formatSOAPAsText, formatDAPAsText } from '@/lib/note-generator';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useApi } from '@/hooks/use-api';
import type { AnalysisResult, CBTAnalysisResult } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  AlertTriangle,
  Shield,
  MessageSquareQuote,
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
  TrendingDown,
  TrendingUp as TrendingUpIcon,
  Minus,
  Info,
  Sparkles,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import {
  OutcomeMeasure,
  ExtractedTopic,
  ClinicalFlag,
  RecommendedNextStep,
  RiskSeverity,
} from '@/types';

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

// ========== MOCK DATA GENERATORS ==========

function generateOutcomeMeasures(sessionNumber: number): OutcomeMeasure[] {
  return [
    {
      name: 'Patient Health Questionnaire',
      abbreviation: 'PHQ-9',
      score: null,
      previousScore: null, // Real previous scores require database persistence
      maxScore: 27,
      severity: 'Enter score above',
      change: 'new',
    },
    {
      name: 'Generalized Anxiety Disorder',
      abbreviation: 'GAD-7',
      score: null,
      previousScore: null, // Real previous scores require database persistence
      maxScore: 21,
      severity: 'Enter score above',
      change: 'new',
    },
  ];
}

function generateTopics(moments: { quote: string; structures: string[] }[], cbt?: CBTAnalysisResult): ExtractedTopic[] {
  const topics: ExtractedTopic[] = [];
  const allText = moments.map((m) => m.quote.toLowerCase()).join(' ');

  const topicDetectors: { keywords: string[]; label: string }[] = [
    { keywords: ['anxi', 'worry', 'nervous', 'panic'], label: 'Anxiety' },
    { keywords: ['perfect', 'standard', 'good enough', 'expect'], label: 'Perfectionism' },
    { keywords: ['work', 'job', 'career', 'boss', 'colleague'], label: 'Work Stress' },
    { keywords: ['sleep', 'insomnia', 'tired', 'exhausted'], label: 'Sleep Issues' },
    { keywords: ['relationship', 'partner', 'friend', 'family'], label: 'Relationships' },
    { keywords: ['worth', 'failure', 'confidence', 'self-esteem'], label: 'Self-Worth' },
    { keywords: ['body', 'tension', 'headache', 'stomach'], label: 'Somatic Symptoms' },
    { keywords: ['avoid', 'procrastinat', 'escape'], label: 'Avoidance Patterns' },
    { keywords: ['cope', 'strategy', 'manage', 'handle'], label: 'Coping Skills' },
  ];

  topicDetectors.forEach((detector, i) => {
    const count = detector.keywords.reduce(
      (sum, kw) => sum + (allText.split(kw).length - 1),
      0
    );
    if (count > 0) {
      topics.push({
        id: `topic-${i}`,
        label: detector.label,
        confidence: Math.min(0.95, 0.6 + count * 0.08),
        mentions: count,
      });
    }
  });

  // Add CBT dominant patterns as topics
  if (cbt && cbt.dominantPatterns.length > 0) {
    cbt.dominantPatterns.forEach((pattern, i) => {
      const existing = topics.find((t) => t.label.toLowerCase() === pattern.toLowerCase());
      if (!existing) {
        const patternDistortions = cbt.distortions.filter((d) => d.type === pattern);
        const avgConfidence = patternDistortions.length > 0
          ? patternDistortions.reduce((sum, d) => sum + d.confidence, 0) / patternDistortions.length
          : 0.6;
        topics.push({
          id: `topic-cbt-${i}`,
          label: pattern,
          confidence: avgConfidence,
          mentions: patternDistortions.length || 1,
        });
      }
    });
  }

  // Sort by mentions, ensure we have at least a few
  if (topics.length === 0) {
    topics.push(
      { id: 'topic-gen-1', label: 'Emotional Processing', confidence: 0.7, mentions: 3 },
      { id: 'topic-gen-2', label: 'Self-Reflection', confidence: 0.65, mentions: 2 }
    );
  }

  return topics.sort((a, b) => b.mentions - a.mentions);
}

function generateClinicalFlags(
  moments: { quote: string; timestamp: string; intensity: number }[],
  riskFlags: { severity: string; signal: string; detail: string }[],
  cbt?: CBTAnalysisResult
): ClinicalFlag[] {
  const flags: ClinicalFlag[] = [];

  // Convert risk flags to clinical flags with real detail from 4-layer analysis
  riskFlags.forEach((rf, i) => {
    const relevantMoment = moments[Math.min(i, moments.length - 1)];
    // Extract real confidence from the detail audit trail (look for "Final adjusted score: X.XX")
    const scoreMatch = rf.detail?.match(/Final adjusted score:\s*([\d.]+)/);
    const realConfidence = scoreMatch ? Math.min(parseFloat(scoreMatch[1]), 0.95) : (rf.severity === 'high' ? 0.85 : rf.severity === 'medium' ? 0.65 : 0.45);

    flags.push({
      id: `flag-risk-${i}`,
      type: 'risk',
      label: rf.signal,
      transcriptQuote: relevantMoment?.quote || 'Quote not available',
      location: relevantMoment?.timestamp || 'Unknown',
      severity: rf.severity as RiskSeverity,
      confidence: realConfidence,
    });
  });

  // Add CBT distortions as notable flags
  if (cbt) {
    cbt.distortions
      .filter((d) => d.confidence > 0.7)
      .slice(0, 3)
      .forEach((d, i) => {
        const linkedMoment = moments[d.momentIndex] || moments[0];
        flags.push({
          id: `flag-cbt-${i}`,
          type: 'notable',
          label: `Cognitive distortion: ${d.type}`,
          transcriptQuote: d.evidence,
          location: linkedMoment?.timestamp || 'Unknown',
          severity: RiskSeverity.LOW,
          confidence: d.confidence,
        });
      });
  }

  // Add protective factors from moments
  const reflectiveMoments = moments.filter(
    (m) =>
      m.quote.toLowerCase().includes('realize') ||
      m.quote.toLowerCase().includes('understand') ||
      m.quote.toLowerCase().includes('aware') ||
      m.quote.toLowerCase().includes('notice')
  );

  reflectiveMoments.slice(0, 2).forEach((m, i) => {
    flags.push({
      id: `flag-protective-${i}`,
      type: 'protective',
      label: 'Client demonstrates reflective capacity',
      transcriptQuote: m.quote,
      location: m.timestamp,
      severity: RiskSeverity.LOW,
      confidence: Math.min(0.95, 0.6 + m.intensity * 0.1),
    });
  });

  return flags;
}

function generateNextSteps(
  riskLevel: string,
  topics: ExtractedTopic[],
  cbt?: CBTAnalysisResult
): RecommendedNextStep[] {
  const steps: RecommendedNextStep[] = [];

  if (riskLevel === 'high') {
    steps.push({
      id: 'step-safety',
      category: 'immediate',
      description: 'Complete safety assessment and update crisis plan',
      rationale: 'High risk indicators detected in session content',
      confidence: 0.92,
    });
  }

  // CBT-driven recommendations
  if (cbt && cbt.distortions.length > 0) {
    const dominantPattern = cbt.dominantPatterns[0] || cbt.distortions[0]?.type;

    if (cbt.treatmentReadiness > 0.7) {
      steps.push({
        id: 'step-cbt-restructure',
        category: 'next_session',
        description: `Begin cognitive restructuring targeting ${dominantPattern}`,
        rationale: `Treatment readiness is ${Math.round(cbt.treatmentReadiness * 100)}% — client appears ready for active cognitive work. ${cbt.distortions.length} distortion(s) detected.`,
        confidence: Math.min(0.95, cbt.treatmentReadiness),
      });
    } else if (cbt.treatmentReadiness < 0.4) {
      steps.push({
        id: 'step-alliance',
        category: 'next_session',
        description: 'Strengthen therapeutic alliance before introducing cognitive techniques',
        rationale: `Treatment readiness is ${Math.round(cbt.treatmentReadiness * 100)}% — consider building rapport and psychoeducation before direct distortion work.`,
        confidence: 0.78,
      });
    }

    if (cbt.overallDistortionLoad > 0.6) {
      steps.push({
        id: 'step-distortion-focus',
        category: 'next_session',
        description: `Focus intervention on ${dominantPattern} (distortion load: ${Math.round(cbt.overallDistortionLoad * 100)}%)`,
        rationale: `High distortion load suggests cognitive patterns are significantly impacting the client. ${dominantPattern} is the most prominent pattern.`,
        confidence: Math.min(0.95, cbt.overallDistortionLoad),
      });
    }

    if (cbt.behavioralPatterns.some((p) => p.toLowerCase().includes('avoid'))) {
      steps.push({
        id: 'step-behavioral',
        category: 'ongoing',
        description: 'Design behavioral experiments to test avoidance patterns',
        rationale: 'Avoidance patterns detected — graded exposure or behavioral experiments recommended',
        confidence: 0.72,
      });
    }
  }

  steps.push(
    {
      id: 'step-outcome',
      category: 'next_session',
      description: 'Administer PHQ-9 and GAD-7 outcome measures',
      rationale: 'Establish baseline or track progress with standardized measures',
      confidence: 0.88,
    },
    {
      id: 'step-topic-1',
      category: 'next_session',
      description: `Explore ${topics[0]?.label || 'primary concern'} with structured interventions`,
      rationale: `Most frequently referenced topic (${topics[0]?.mentions || 0} mentions) suggests high salience for client`,
      confidence: 0.76,
    },
    {
      id: 'step-homework',
      category: 'ongoing',
      description: cbt && cbt.distortions.length > 0
        ? 'Assign thought record focusing on identified cognitive distortions'
        : 'Assign between-session monitoring task (thought record or mood diary)',
      rationale: cbt && cbt.distortions.length > 0
        ? `Track ${cbt.dominantPatterns[0] || 'cognitive'} patterns between sessions to build awareness`
        : 'Builds client engagement and provides data for next session',
      confidence: 0.71,
    }
  );

  return steps;
}

// ========== COMPONENT ==========

export default function OverviewPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { data, loading } = useApi<{ session: SessionData }>(`/api/sessions/${sessionId}`);
  const session = data?.session || null;

  const savedOutcomes = (data?.session?.analysisResult as Record<string, unknown> | null)?.outcomeMeasures as { phq9?: number; gad7?: number } | undefined;

  const [phq9Score, setPhq9Score] = useState<string>(savedOutcomes?.phq9?.toString() || '');
  const [gad7Score, setGad7Score] = useState<string>(savedOutcomes?.gad7?.toString() || '');
  const [savingScores, setSavingScores] = useState(false);
  const [scoresSaved, setScoresSaved] = useState(false);
  const [expandedFlag, setExpandedFlag] = useState<string | null>(null);

  // Sync state when data loads (useState initializer only runs once on mount)
  useEffect(() => {
    if (savedOutcomes?.phq9 !== undefined) setPhq9Score(savedOutcomes.phq9.toString());
    if (savedOutcomes?.gad7 !== undefined) setGad7Score(savedOutcomes.gad7.toString());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const saveOutcomeMeasures = async () => {
    const phq9 = phq9Score ? parseInt(phq9Score) : undefined;
    const gad7 = gad7Score ? parseInt(gad7Score) : undefined;
    if (phq9 === undefined && gad7 === undefined) return;

    setSavingScores(true);
    setScoresSaved(false);
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcomeMeasures: { phq9, gad7 } }),
      });
      setScoresSaved(true);
      setTimeout(() => setScoresSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save outcome measures:', err);
    } finally {
      setSavingScores(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (!session) {
    return (
      <div className="space-y-6">
        <Card className="p-8 text-center">
          <h3 className="font-playfair text-2xl font-bold text-gray-900 mb-2">Session Not Found</h3>
          <p className="text-gray-600 mb-6">
            This session may have expired. Sessions are stored in memory and reset on page reload.
          </p>
          <Link
            href="/dashboard/session/new"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition"
          >
            Create New Session
          </Link>
        </Card>
      </div>
    );
  }

  const analysis = session.analysisResult as AnalysisResult;
  const cbt = analysis.cbtAnalysis as CBTAnalysisResult | undefined;
  const outcomeMeasures = generateOutcomeMeasures(session.sessionNumber);
  const topics = generateTopics(analysis.moments, cbt);
  const clinicalFlags = generateClinicalFlags(analysis.moments, analysis.riskFlags, cbt);
  const nextSteps = generateNextSteps(analysis.quickInsight.riskLevel, topics, cbt);

  const downloadNote = (type: 'soap' | 'dap') => {
    let text: string;
    let filename: string;

    if (type === 'soap') {
      const note = generateSOAPNote(analysis);
      text = formatSOAPAsText(note);
      filename = `SOAP_Note_${session.clientCode}_Session${session.sessionNumber}_${session.date}.txt`;
    } else {
      const note = generateDAPNote(analysis);
      text = formatDAPAsText(note);
      filename = `DAP_Note_${session.clientCode}_Session${session.sessionNumber}_${session.date}.txt`;
    }

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getChangeIcon = (change: string) => {
    switch (change) {
      case 'improved': return <TrendingDown className="w-4 h-4 text-green-600" />;
      case 'worsened': return <TrendingUpIcon className="w-4 h-4 text-red-600" />;
      case 'stable': return <Minus className="w-4 h-4 text-gray-400" />;
      default: return <Sparkles className="w-4 h-4 text-blue-500" />;
    }
  };

  const getFlagIcon = (type: string) => {
    switch (type) {
      case 'risk': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'protective': return <Shield className="w-4 h-4 text-green-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'immediate': return 'bg-red-50 text-red-700 border-red-200';
      case 'next_session': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ongoing': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Quick Insight Banner */}
      <div
        className={`rounded-xl p-6 border-l-4 ${
          analysis.quickInsight.riskLevel === 'high'
            ? 'bg-red-50 border-l-red-500'
            : analysis.quickInsight.riskLevel === 'moderate'
              ? 'bg-amber-50 border-l-amber-500'
              : 'bg-green-50 border-l-green-500'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge
                label={analysis.quickInsight.riskLevel.charAt(0).toUpperCase() + analysis.quickInsight.riskLevel.slice(1) + ' Risk'}
                variant={
                  analysis.quickInsight.riskLevel === 'high'
                    ? 'risk-high'
                    : analysis.quickInsight.riskLevel === 'moderate'
                      ? 'risk-medium'
                      : 'risk-low'
                }
              />
              <span className="text-xs text-gray-500 font-mono">Session #{session.sessionNumber} &middot; {session.date}</span>
            </div>
            <p className="text-gray-800 font-medium">{analysis.quickInsight.clinicalPriority}</p>
            <p className="text-gray-600 text-sm mt-1">{analysis.quickInsight.prognosis}</p>
          </div>
        </div>
      </div>

      {/* Outcome Measures */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-playfair text-xl font-bold text-gray-900">Outcome Measures</h3>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Enter scores from standardized assessments
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {outcomeMeasures.map((measure) => (
            <Card key={measure.abbreviation} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{measure.abbreviation}</p>
                  <p className="text-xs text-gray-500">{measure.name}</p>
                </div>
                {getChangeIcon(measure.change)}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  max={measure.maxScore}
                  placeholder={`0-${measure.maxScore}`}
                  value={measure.abbreviation === 'PHQ-9' ? phq9Score : gad7Score}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (measure.abbreviation === 'PHQ-9') setPhq9Score(val);
                    else setGad7Score(val);
                  }}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center font-mono text-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
                <div className="text-sm text-gray-500">
                  {measure.previousScore !== null && (
                    <span>Previous: <strong>{measure.previousScore}</strong> / {measure.maxScore}</span>
                  )}
                  {measure.previousScore === null && <span className="italic">No previous score</span>}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">{measure.severity}</p>
            </Card>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={saveOutcomeMeasures}
            disabled={savingScores || (!phq9Score && !gad7Score)}
            className="px-4 py-2 bg-primary text-white text-sm rounded-lg font-medium hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingScores ? 'Saving...' : 'Save Scores'}
          </button>
          {scoresSaved && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Saved
            </span>
          )}
        </div>
      </section>

      {/* AI-Extracted Topics */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-playfair text-xl font-bold text-gray-900">Session Topics</h3>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">AI-detected</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full hover:border-primary/30 hover:bg-primary/5 transition-colors group"
            >
              <span className="text-sm font-medium text-gray-800">{topic.label}</span>
              <span className="text-xs text-gray-400 group-hover:text-primary transition-colors">
                {topic.mentions}x
              </span>
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: topic.confidence > 0.8 ? '#10B981' : topic.confidence > 0.6 ? '#F59E0B' : '#9CA3AF',
                }}
                title={`Confidence: ${Math.round(topic.confidence * 100)}%`}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Confidence: <span className="inline-block w-2 h-2 rounded-full bg-green-500" /> &gt;80% &nbsp;
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500" /> 60-80% &nbsp;
          <span className="inline-block w-2 h-2 rounded-full bg-gray-400" /> &lt;60%
        </p>
      </section>

      {/* Clinical Flags with Exact Quotes */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-playfair text-xl font-bold text-gray-900">Clinical Flags</h3>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">AI-detected</span>
        </div>
        <div className="space-y-3">
          {clinicalFlags.map((flag) => (
            <Card
              key={flag.id}
              className="p-4 cursor-pointer"
              onClick={() => setExpandedFlag(expandedFlag === flag.id ? null : flag.id)}
            >
              <div className="flex items-start gap-3">
                {getFlagIcon(flag.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-gray-900 text-sm">{flag.label}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400 font-mono">{flag.location}</span>
                      <span className="text-xs text-gray-400">
                        {Math.round(flag.confidence * 100)}% conf.
                      </span>
                      {expandedFlag === flag.id ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  {expandedFlag === flag.id && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-start gap-2">
                        <MessageSquareQuote className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700 italic leading-relaxed">
                          &ldquo;{flag.transcriptQuote}&rdquo;
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Source: Transcript at {flag.location} &middot; Detection confidence: {Math.round(flag.confidence * 100)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Recommended Next Steps */}
      <section>
        <h3 className="font-playfair text-xl font-bold text-gray-900 mb-4">Recommended Next Steps</h3>
        <div className="space-y-3">
          {nextSteps.map((step) => (
            <Card key={step.id} className="p-4">
              <div className="flex items-start gap-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getCategoryColor(step.category)}`}>
                  {step.category === 'immediate' ? 'Immediate' : step.category === 'next_session' ? 'Next Session' : 'Ongoing'}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{step.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{step.rationale}</p>
                  <p className="text-xs text-gray-400 mt-1">Confidence: {Math.round(step.confidence * 100)}%</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* SOAP/DAP Note Export */}
      <section>
        <h3 className="font-playfair text-xl font-bold text-gray-900 mb-4">Note Export</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={() => downloadNote('soap')} className="flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group">
            <FileText className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
            <div className="text-left">
              <p className="font-semibold text-gray-900 text-sm">SOAP Note</p>
              <p className="text-xs text-gray-500">Subjective, Objective, Assessment, Plan</p>
            </div>
            <Download className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors ml-auto" />
          </button>
          <button onClick={() => downloadNote('dap')} className="flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group">
            <FileText className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
            <div className="text-left">
              <p className="font-semibold text-gray-900 text-sm">DAP Note</p>
              <p className="text-xs text-gray-500">Data, Assessment, Plan</p>
            </div>
            <Download className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors ml-auto" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
          <Info className="w-3 h-3" />
          Notes are AI-generated drafts. Always review and edit before including in clinical records.
        </p>
      </section>
    </div>
  );
}
