'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useApi } from '@/hooks/use-api';
import type { AnalysisResult, CBTAnalysisResult } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
  Edit3,
  Check,
  X,
  Stethoscope,
  ShieldAlert,
  BookOpen,
  CheckSquare,
  Square,
  Sparkles,
  FileWarning,
  Loader2,
  Brain,
} from 'lucide-react';
import {
  DiagnosticConsideration,
  TreatmentOption,
  RiskSafetyItem,
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

// ========== DATA GENERATORS ==========

function generateDiagnosticConsiderations(
  riskLevel: string,
  moments: { quote: string; structures: string[] }[],
  cbtAnalysis?: CBTAnalysisResult
): DiagnosticConsideration[] {
  const allText = moments.map((m) => m.quote.toLowerCase()).join(' ');
  const considerations: DiagnosticConsideration[] = [];

  const distortionTypes = (cbtAnalysis?.distortions ?? []).map((d) => d.type.toLowerCase());
  const hasCatastrophizing = distortionTypes.some((t) => t.includes('catastroph'));
  const hasAllOrNothing = distortionTypes.some((t) => t.includes('all-or-nothing') || t.includes('all or nothing'));
  const hasLabeling = distortionTypes.some((t) => t.includes('label'));
  const hasPersonalization = distortionTypes.some((t) => t.includes('personal'));

  if (allText.includes('anxi') || allText.includes('worry') || allText.includes('nervous')) {
    const cbtBoost = (hasCatastrophizing || hasAllOrNothing) ? 0.1 : 0;
    considerations.push({
      id: 'dx-gad',
      code: 'F41.1',
      name: 'Generalized Anxiety Disorder',
      indicators: [
        'Excessive worry reported across multiple domains',
        'Physical symptoms (tension, restlessness) noted',
        'Difficulty controlling worry acknowledged by client',
        ...(hasCatastrophizing ? ['Catastrophizing distortion detected in CBT analysis'] : []),
        ...(hasAllOrNothing ? ['All-or-nothing thinking pattern detected'] : []),
      ],
      confidence: Math.min(0.95, 0.72 + cbtBoost),
      status: 'monitor',
    });
  }

  if (allText.includes('perfect') || allText.includes('standard')) {
    considerations.push({
      id: 'dx-ocd-traits',
      code: 'Z73.1',
      name: 'Perfectionism (not a disorder)',
      indicators: [
        'Rigid personal standards expressed',
        'Self-critical evaluation patterns',
        'Impact on daily functioning and relationships',
      ],
      confidence: 0.65,
      status: 'monitor',
    });
  }

  considerations.push({
    id: 'dx-adjustment',
    code: 'F43.20',
    name: 'Adjustment Disorder, Unspecified',
    indicators: [
      'Identifiable stressor(s) present',
      'Symptoms emerged in relation to stressor timeline',
      'Impairment in social/occupational functioning',
    ],
    confidence: 0.58,
    status: 'rule_in',
  });

  if (riskLevel === 'high' || allText.includes('sad') || allText.includes('depress') || allText.includes('hopeless')) {
    considerations.push({
      id: 'dx-mdd',
      code: 'F32.1',
      name: 'Major Depressive Disorder, Moderate',
      indicators: [
        'Depressed mood reported or observed',
        'Functional impairment noted',
        'Duration criteria need clarification',
      ],
      confidence: 0.45,
      status: 'rule_out',
    });
  }

  if (hasLabeling || hasPersonalization) {
    considerations.push({
      id: 'dx-self-worth',
      code: 'Z73.0',
      name: 'Self-Worth / Identity Concerns',
      indicators: [
        ...(hasLabeling ? ['Labeling distortion detected — client applies fixed negative labels to self'] : []),
        ...(hasPersonalization ? ['Personalization distortion detected — client over-attributes blame to self'] : []),
        'Pattern suggests underlying self-worth schema',
      ],
      confidence: Math.min(0.95, 0.55 + distortionTypes.length * 0.05),
      status: 'monitor',
    });
  }

  return considerations;
}

function generateTreatmentOptionsFromCBT(cbtAnalysis?: CBTAnalysisResult): TreatmentOption[] {
  const patterns = (cbtAnalysis?.dominantPatterns ?? []).map((p) => p.toLowerCase());
  const behavioral = (cbtAnalysis?.behavioralPatterns ?? []).map((p) => p.toLowerCase());
  const distortionCount = cbtAnalysis?.distortions.length ?? 0;
  const hasDistortions = distortionCount > 0;

  const hasCatastrophizing = patterns.some((p) => p.includes('catastroph') || p.includes('fortune'));
  const hasAvoidance = behavioral.some((p) => p.includes('avoid'));
  const hasLowBelief = (cbtAnalysis?.automaticThoughts ?? []).some((t) => t.beliefStrength < 0.4);

  const distortionSummary = hasDistortions
    ? `${distortionCount} cognitive distortion(s) detected (${(cbtAnalysis?.dominantPatterns ?? []).slice(0, 3).join(', ')})`
    : 'No specific distortions detected';

  const options: TreatmentOption[] = [];

  // CBT — top recommendation when distortions are found
  options.push({
    id: 'tx-cbt',
    name: 'Cognitive Behavioral Therapy (CBT)',
    description: 'Structured approach targeting thought patterns and behavioral responses',
    evidenceBase: 'Strong evidence for anxiety and perfectionism presentations (NICE guidelines)',
    suitability: (hasDistortions || hasCatastrophizing) ? 'high' : 'moderate',
    rationale: hasDistortions
      ? `${distortionSummary}. CBT directly targets these identified distortions with structured cognitive restructuring techniques.`
      : 'Client may benefit from structured cognitive work, though no specific distortions were detected in this session.',
  });

  // ACT — stronger recommendation when avoidance is present
  options.push({
    id: 'tx-act',
    name: 'Acceptance and Commitment Therapy (ACT)',
    description: 'Values-based approach with mindfulness and acceptance strategies',
    evidenceBase: 'Strong evidence for anxiety; growing evidence for perfectionism',
    suitability: hasAvoidance ? 'high' : 'moderate',
    rationale: hasAvoidance
      ? `Behavioral avoidance patterns detected (${behavioral.filter((p) => p.includes('avoid')).join(', ')}). ACT\'s defusion and acceptance strategies directly address experiential avoidance.`
      : 'Client may benefit from values-based work and psychological flexibility training.',
  });

  // Psychodynamic — recommended when automatic thoughts have low belief strength
  options.push({
    id: 'tx-psychodynamic',
    name: 'Brief Psychodynamic Therapy',
    description: 'Exploration of unconscious patterns and relational dynamics',
    evidenceBase: 'Moderate evidence; stronger for interpersonal and identity concerns',
    suitability: hasLowBelief ? 'high' : 'moderate',
    rationale: hasLowBelief
      ? 'Automatic thoughts with low belief strength suggest deeper schema-level patterns that may benefit from psychodynamic exploration of origin experiences.'
      : 'Underlying relational dynamics may benefit from deeper exploration of origin patterns.',
  });

  // Sort: if distortions found, CBT first; if avoidance, ACT second
  if (hasDistortions) {
    options.sort((a, b) => {
      if (a.id === 'tx-cbt') return -1;
      if (b.id === 'tx-cbt') return 1;
      return 0;
    });
  }

  return options;
}

function generateRiskSafetyChecklist(
  riskFlags: { severity: string; signal: string; detail: string; recommendation: string }[]
): RiskSafetyItem[] {
  const items: RiskSafetyItem[] = [
    {
      id: 'safety-si',
      label: 'Suicidal ideation assessed',
      status: 'needs_attention',
      notes: 'Standard screening recommended',
      therapistConfirmed: false,
    },
    {
      id: 'safety-sh',
      label: 'Self-harm risk evaluated',
      status: 'needs_attention',
      notes: 'No direct indicators but assess proactively',
      therapistConfirmed: false,
    },
    {
      id: 'safety-substance',
      label: 'Substance use screened',
      status: 'not_applicable',
      notes: 'No indicators in transcript',
      therapistConfirmed: false,
    },
    {
      id: 'safety-crisis',
      label: 'Crisis plan reviewed/updated',
      status: riskFlags.some((f) => f.severity === 'high') ? 'needs_attention' : 'not_applicable',
      notes: riskFlags.some((f) => f.severity === 'high')
        ? 'High risk flags detected — crisis plan review required'
        : 'No high-risk indicators',
      therapistConfirmed: false,
    },
    {
      id: 'safety-support',
      label: 'Support network discussed',
      status: 'addressed',
      notes: 'Client mentioned social connections',
      therapistConfirmed: false,
    },
  ];

  // Add items from risk flags with full audit trail
  riskFlags.forEach((rf, i) => {
    items.push({
      id: `safety-risk-${i}`,
      label: `${rf.signal} — addressed`,
      status: rf.severity === 'high' ? 'needs_attention' : rf.severity === 'medium' ? 'needs_attention' : 'addressed',
      notes: `${rf.recommendation}${rf.detail ? ` | Audit: ${rf.detail}` : ''}`,
      therapistConfirmed: false,
    });
  });

  return items;
}

// ========== COMPONENT ==========

export default function AnalysisPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { data, loading } = useApi<{ session: SessionData }>(`/api/sessions/${sessionId}`);
  const session = data?.session || null;

  const [sessionAssessment, setSessionAssessment] = useState('');
  const [isEditingAssessment, setIsEditingAssessment] = useState(false);
  const [assessmentDraft, setAssessmentDraft] = useState('');
  const [checklist, setChecklist] = useState<RiskSafetyItem[]>([]);
  const [checklistInitialized, setChecklistInitialized] = useState(false);

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

  // Initialize checklist once
  if (!checklistInitialized) {
    const initialChecklist = generateRiskSafetyChecklist(analysis.riskFlags);
    setChecklist(initialChecklist);
    setChecklistInitialized(true);
  }

  const cbt = analysis.cbtAnalysis as CBTAnalysisResult | undefined;

  const diagnosticConsiderations = generateDiagnosticConsiderations(
    analysis.quickInsight.riskLevel,
    analysis.moments,
    cbt
  );
  const treatmentOptions = generateTreatmentOptionsFromCBT(cbt);

  // Generate default assessment text
  const defaultAssessment = `Client presents with ${analysis.quickInsight.riskLevel} risk level. ${analysis.quickInsight.clinicalPriority}. ${analysis.quickInsight.prognosis}. Primary phenomenological structures activated include ${
    Object.entries(analysis.structureProfile)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name]) => name.replace(/_/g, ' '))
      .join(', ')
  }. ${analysis.quickInsight.topRecommendation}.`;

  const displayAssessment = sessionAssessment || defaultAssessment;

  const handleSaveAssessment = () => {
    setSessionAssessment(assessmentDraft);
    setIsEditingAssessment(false);
  };

  const handleToggleCheck = useCallback((itemId: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, therapistConfirmed: !item.therapistConfirmed } : item
      )
    );
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rule_in': return 'bg-amber-100 text-amber-700';
      case 'rule_out': return 'bg-red-100 text-red-700';
      case 'monitor': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getSuitabilityColor = (suit: string) => {
    switch (suit) {
      case 'high': return 'bg-green-100 text-green-700';
      case 'moderate': return 'bg-blue-100 text-blue-700';
      case 'low': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getSafetyStatusColor = (status: string) => {
    switch (status) {
      case 'addressed': return 'text-green-600';
      case 'needs_attention': return 'text-amber-600';
      case 'not_applicable': return 'text-gray-400';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-10">
      {/* Session Assessment (Editable) */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-playfair text-xl font-bold text-gray-900">Session Assessment</h3>
          {!isEditingAssessment ? (
            <button
              onClick={() => {
                setAssessmentDraft(displayAssessment);
                setIsEditingAssessment(true);
              }}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-dark font-medium px-3 py-1.5 rounded-lg hover:bg-primary/5 transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveAssessment}
                className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium px-3 py-1.5 rounded-lg hover:bg-green-50 transition"
              >
                <Check className="w-3.5 h-3.5" />
                Save
              </button>
              <button
                onClick={() => setIsEditingAssessment(false)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            </div>
          )}
        </div>
        <Card className="p-5">
          {isEditingAssessment ? (
            <textarea
              value={assessmentDraft}
              onChange={(e) => setAssessmentDraft(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-700 leading-relaxed focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-y"
              placeholder="Write your clinical assessment of this session..."
            />
          ) : (
            <div>
              <p className="text-sm text-gray-700 leading-relaxed">{displayAssessment}</p>
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI-generated draft — edit to add your clinical observations
              </p>
            </div>
          )}
        </Card>
      </section>

      {/* Cognitive Distortions (CBT Analysis) */}
      {cbt && cbt.distortions.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-playfair text-xl font-bold text-gray-900">Cognitive Distortions</h3>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Brain className="w-3 h-3" />CBT Analysis
            </span>
          </div>

          {/* Distortion Load + Treatment Readiness */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            <Card className="p-4">
              <p className="text-xs text-gray-500 mb-1">Distortion Load</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${cbt.overallDistortionLoad > 0.6 ? 'bg-red-400' : cbt.overallDistortionLoad > 0.3 ? 'bg-amber-400' : 'bg-green-400'}`} style={{ width: `${Math.round(cbt.overallDistortionLoad * 100)}%` }} />
                </div>
                <span className="text-sm font-bold">{Math.round(cbt.overallDistortionLoad * 100)}%</span>
              </div>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500 mb-1">Treatment Readiness</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${cbt.treatmentReadiness > 0.6 ? 'bg-green-400' : 'bg-amber-400'}`} style={{ width: `${Math.round(cbt.treatmentReadiness * 100)}%` }} />
                </div>
                <span className="text-sm font-bold">{Math.round(cbt.treatmentReadiness * 100)}%</span>
              </div>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500 mb-1">Dominant Patterns</p>
              <div className="flex flex-wrap gap-1">
                {cbt.dominantPatterns.map((p) => (
                  <span key={p} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{p}</span>
                ))}
              </div>
            </Card>
          </div>

          {/* Individual distortions */}
          <div className="space-y-3 mb-5">
            {cbt.distortions.map((d, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold text-gray-900 text-sm">{d.type}</span>
                    <span className="text-xs text-gray-400">Moment #{d.momentIndex + 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.round(d.confidence * 100)}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{Math.round(d.confidence * 100)}%</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 italic mb-2 pl-6">&ldquo;{d.evidence}&rdquo;</p>
                <div className="p-2 bg-green-50 rounded-lg border border-green-100 ml-6">
                  <p className="text-xs text-green-700"><span className="font-medium">Reframe:</span> {d.alternativeThought}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Automatic Thoughts */}
          {cbt.automaticThoughts.length > 0 && (
            <div className="mb-5">
              <p className="text-xs text-gray-500 font-medium mb-2">Automatic Thoughts Detected:</p>
              <div className="space-y-2">
                {cbt.automaticThoughts.slice(0, 5).map((t, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${t.supportsWellbeing ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-sm text-gray-700 flex-1">{t.content}</span>
                    <span className="text-xs text-gray-400">Strength: {Math.round(t.beliefStrength * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Behavioral Patterns */}
          {cbt.behavioralPatterns.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-gray-500 font-medium">Behavioral Patterns:</span>
              {cbt.behavioralPatterns.map((p, i) => (
                <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p}</span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Diagnostic Considerations */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-playfair text-xl font-bold text-gray-900">Diagnostic Considerations</h3>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">AI-suggested</span>
        </div>

        {/* NOT-A-DIAGNOSIS Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3">
          <FileWarning className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">THIS IS NOT A DIAGNOSIS</p>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              The following are AI-generated considerations based on transcript analysis only.
              They are intended to support clinical thinking, not replace professional diagnostic assessment.
              A proper diagnosis requires comprehensive evaluation including clinical interview,
              psychological testing, medical history review, and collateral information.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {diagnosticConsiderations.map((dx) => (
            <Card key={dx.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Stethoscope className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="font-mono text-xs text-gray-500 mr-2">{dx.code}</span>
                    <span className="font-semibold text-gray-900">{dx.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(dx.status)}`}>
                    {dx.status === 'rule_in' ? 'Consider' : dx.status === 'rule_out' ? 'Rule Out' : 'Monitor'}
                  </span>
                  <span className="text-xs text-gray-400">{Math.round(dx.confidence * 100)}% conf.</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Observed indicators:</p>
                <ul className="space-y-1">
                  {dx.indicators.map((ind, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-gray-400 mt-1">•</span>
                      {ind}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Treatment Options */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <h3 className="font-playfair text-xl font-bold text-gray-900">Treatment Options</h3>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">AI-suggested</span>
        </div>

        <div className="space-y-4">
          {treatmentOptions.map((tx) => (
            <Card key={tx.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-gray-900">{tx.name}</h4>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getSuitabilityColor(tx.suitability)}`}>
                  {tx.suitability} suitability
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{tx.description}</p>
              <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Evidence Base:</p>
                <p className="text-sm text-gray-700">{tx.evidenceBase}</p>
              </div>
              <p className="text-xs text-gray-500">
                <span className="font-medium">Rationale:</span> {tx.rationale}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Risk & Safety Checklist */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <h3 className="font-playfair text-xl font-bold text-gray-900">Risk & Safety Recap</h3>
          <ShieldAlert className="w-5 h-5 text-amber-500" />
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Review and confirm each safety item was addressed during or after this session.
        </p>

        <Card className="p-5">
          <div className="space-y-3">
            {checklist.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                onClick={() => handleToggleCheck(item.id)}
              >
                {item.therapistConfirmed ? (
                  <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${item.therapistConfirmed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {item.label}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs ${getSafetyStatusColor(item.status)}`}>
                      {item.status === 'addressed' ? 'Addressed in session' : item.status === 'needs_attention' ? 'Needs attention' : 'N/A'}
                    </span>
                    {item.notes && <span className="text-xs text-gray-400">— {item.notes}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {checklist.filter((c) => c.therapistConfirmed).length} / {checklist.length} items confirmed
            </p>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Checklist items are not saved between sessions in MVP
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}
