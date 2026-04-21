'use client';

import { useState, useEffect, useCallback } from 'react';
import { generateSOAPNote, generateDAPNote, formatSOAPAsText, formatDAPAsText } from '@/lib/note-generator';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApi } from '@/hooks/use-api';
import type { AnalysisResult, CBTAnalysisResult } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  AlertTriangle,
  Shield,
  MessageSquareQuote,
  ChevronDown,
  FileText,
  Download,
  Info,
  Sparkles,
  Loader2,
  User,
  Stethoscope,
  Hash,
  BookOpen,
  Trash2,
  Brain,
  FileWarning,
  Edit3,
  Check,
  X,
  RotateCcw,
  Database,
} from 'lucide-react';
import {
  ExtractedTopic,
  ClinicalFlag,
  RiskSeverity,
  StructureName,
  Moment,
  TherapistMoveDistribution,
  DiagnosticConsideration,
} from '@/types';

// ========== TYPES ==========

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

// ========== COLLAPSIBLE SECTION ==========

function CollapsibleSection({
  title,
  icon,
  teaser,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ReactNode;
  teaser: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="font-playfair text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className="px-6 pb-4 -mt-1">{teaser}</div>
      {isOpen && (
        <div className="px-6 pb-6 pt-2 border-t border-gray-100">{children}</div>
      )}
    </div>
  );
}

// ========== DATA GENERATORS ==========

function generateQuickSummary(
  analysis: AnalysisResult,
  topics: ExtractedTopic[],
  cbt?: CBTAnalysisResult,
): string {
  const parts: string[] = [];
  const priority = analysis.quickInsight?.clinicalPriority || '';
  if (priority) {
    parts.push(`Client presented with ${priority.charAt(0).toLowerCase() + priority.slice(1)}.`);
  } else {
    const topTopics = topics.slice(0, 2).map((t) => t.label.toLowerCase());
    parts.push(`Session focused on ${topTopics.join(' and ') || 'general therapeutic exploration'}.`);
  }

  const structureProfile = analysis.structureProfile || {};
  const topStructures = Object.entries(structureProfile)
    .filter(([, score]) => typeof score === 'number' && score > 0.2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([name]) => name.replace(/_/g, ' '));

  if (topStructures.length > 0) {
    const structureMap: Record<string, string> = {
      emotion: 'emotional processing and affect regulation',
      cognitive: 'cognitive patterns and thought processes',
      body: 'somatic experience and body awareness',
      reflective: 'self-reflection and metacognitive awareness',
      social: 'interpersonal dynamics and relational patterns',
      narrative: 'identity and personal narrative',
      behaviour: 'behavioral patterns and coping strategies',
      ecological: 'environmental and contextual factors',
      normative: 'values, standards, and expectations',
      'immediate experience': 'present-moment awareness and grounding',
    };
    const focus = topStructures.map((s) => structureMap[s] || s).join(' and ');
    parts.push(`Session content centered on ${focus}.`);
  }

  if (cbt && Array.isArray(cbt.dominantPatterns) && cbt.dominantPatterns.length > 0) {
    const pattern = cbt.dominantPatterns[0];
    const readiness = cbt.treatmentReadiness || 0;
    parts.push(readiness > 0.6
      ? `${pattern} was identified as the dominant cognitive pattern; client shows readiness for active restructuring work.`
      : `${pattern} emerged as a notable cognitive pattern requiring further exploration.`);
  } else {
    const safeMoments = Array.isArray(analysis.moments) ? analysis.moments : [];
    const reflectiveMoment = safeMoments.find((m) =>
      Array.isArray(m.structures) && (
        m.structures.includes(StructureName.REFLECTIVE) ||
        m.structures.includes(StructureName.NARRATIVE)
      ) && m.intensity > 0.6
    );
    if (reflectiveMoment) {
      parts.push('Client demonstrated emerging reflective capacity during the session.');
    }
  }

  const safeRiskFlags = Array.isArray(analysis.riskFlags) ? analysis.riskFlags : [];
  const highRisk = safeRiskFlags.filter((rf) => rf.severity === 'high');
  if (highRisk.length > 0) {
    parts.push(`${highRisk.length} high-priority risk indicator${highRisk.length > 1 ? 's' : ''} flagged requiring immediate attention.`);
  } else if ((analysis.quickInsight?.riskLevel || 'low') === 'low') {
    parts.push('No acute risk indicators identified.');
  }

  const prognosis = analysis.quickInsight?.prognosis || '';
  if (prognosis) parts.push(prognosis);

  return parts.join(' ');
}

function generateTopics(
  moments: { quote: string; structures: string[] }[],
  structureProfile?: Record<string, number>,
  cbt?: CBTAnalysisResult,
  transcript?: string,
): ExtractedTopic[] {
  const topics: ExtractedTopic[] = [];
  const safeMoments = Array.isArray(moments) ? moments : [];
  const allText = safeMoments.map((m) => (m.quote || '').toLowerCase()).join(' ');

  const transcriptLines: { speaker: 'client' | 'therapist'; text: string }[] = [];
  if (transcript) {
    for (const line of transcript.split('\n')) {
      const trimmed = line.trim();
      if (/^(client|patient):/i.test(trimmed)) {
        transcriptLines.push({ speaker: 'client', text: trimmed.replace(/^(Client|Patient):\s*/i, '').trim() });
      } else if (/^(therapist|counselor|doctor):/i.test(trimmed)) {
        transcriptLines.push({ speaker: 'therapist', text: trimmed.replace(/^(Therapist|Counselor|Doctor):\s*/i, '').trim() });
      }
    }
  }

  function findBestQuote(keywords: string[]): { quote: string; speaker: 'client' | 'therapist' } | null {
    let bestLine: typeof transcriptLines[0] | null = null;
    let bestScore = 0;
    for (const line of transcriptLines) {
      const lower = line.text.toLowerCase();
      let score = 0;
      for (const kw of keywords) { if (lower.includes(kw)) score++; }
      if (line.speaker === 'client') score *= 1.5;
      if (score > bestScore) { bestScore = score; bestLine = line; }
    }
    if (bestLine && bestScore > 0) {
      let quote = bestLine.text;
      if (quote.length > 180) {
        const firstKw = keywords.find((kw) => quote.toLowerCase().includes(kw));
        if (firstKw) {
          const idx = quote.toLowerCase().indexOf(firstKw);
          const start = Math.max(0, idx - 60);
          const end = Math.min(quote.length, idx + 120);
          quote = (start > 0 ? '...' : '') + quote.slice(start, end) + (end < quote.length ? '...' : '');
        } else { quote = quote.slice(0, 180) + '...'; }
      }
      return { quote, speaker: bestLine.speaker };
    }
    return null;
  }

  const structureToTopicMap: Record<string, { label: string; keywords: string[]; dimension: string }> = {
    emotion: { label: 'Emotional Processing', keywords: ['feel', 'feeling', 'emotion', 'angry', 'sad', 'happy', 'anxious', 'scared'], dimension: 'emotional' },
    cognitive: { label: 'Cognitive Patterns', keywords: ['think', 'thought', 'believe', 'mind', 'realize', 'pattern'], dimension: 'cognitive' },
    social: { label: 'Social/Relational Dynamics', keywords: ['relationship', 'friend', 'family', 'partner', 'people', 'trust'], dimension: 'social' },
    body: { label: 'Somatic Experience', keywords: ['body', 'tension', 'chest', 'stomach', 'breathe', 'shake', 'sleep'], dimension: 'somatic' },
    reflective: { label: 'Self-Reflection', keywords: ['realize', 'notice', 'aware', 'understand', 'insight', 'pattern'], dimension: 'reflective' },
    behaviour: { label: 'Behavioral Patterns', keywords: ['avoid', 'cope', 'habit', 'routine', 'action', 'behavior'], dimension: 'behavioral' },
    narrative: { label: 'Identity/Narrative', keywords: ['identity', 'story', 'who i am', 'self', 'worth', 'role'], dimension: 'narrative' },
    ecological: { label: 'Environmental Factors', keywords: ['work', 'home', 'environment', 'place', 'situation'], dimension: 'ecological' },
    normative: { label: 'Values/Standards', keywords: ['should', 'must', 'expect', 'standard', 'perfect', 'norm'], dimension: 'normative' },
    immediate_experience: { label: 'Present-Moment Awareness', keywords: ['right now', 'moment', 'here', 'present', 'notice'], dimension: 'experiential' },
  };

  if (structureProfile && typeof structureProfile === 'object') {
    Object.entries(structureProfile)
      .filter(([, score]) => typeof score === 'number' && score > 0)
      .sort(([, a], [, b]) => b - a)
      .forEach(([structureName, score]) => {
        const mapping = structureToTopicMap[structureName.toLowerCase().replace(/_/g, '_')];
        const topicLabel = mapping?.label || structureName.replace(/_/g, ' ');
        if (!topics.find((t) => t.label.toLowerCase() === topicLabel.toLowerCase())) {
          const quoteResult = mapping ? findBestQuote(mapping.keywords) : null;
          topics.push({
            id: `topic-struct-${structureName}`,
            label: topicLabel,
            confidence: Math.min(0.95, 0.5 + score * 0.4),
            mentions: Math.round(score * 10),
            triggerQuote: quoteResult?.quote,
            speaker: quoteResult?.speaker,
            structureDimension: mapping?.dimension,
          });
        }
      });
  }

  if (cbt && Array.isArray(cbt.dominantPatterns)) {
    cbt.dominantPatterns.forEach((pattern, i) => {
      if (!topics.find((t) => t.label.toLowerCase() === pattern.toLowerCase())) {
        const patternDistortions = (cbt.distortions || []).filter((d) => d.type === pattern);
        const avgConfidence = patternDistortions.length > 0
          ? patternDistortions.reduce((sum, d) => sum + d.confidence, 0) / patternDistortions.length
          : 0.6;
        const bestDistortion = patternDistortions.sort((a, b) => b.confidence - a.confidence)[0];
        const quoteResult = findBestQuote(pattern.toLowerCase().split(/[\s-]+/));
        topics.push({
          id: `topic-cbt-${i}`, label: pattern, confidence: avgConfidence,
          mentions: patternDistortions.length || 1,
          triggerQuote: quoteResult?.quote || bestDistortion?.evidence,
          speaker: quoteResult?.speaker || 'client',
          structureDimension: 'cognitive',
        });
      }
    });
  }

  const topicDetectors = [
    { keywords: ['anxi', 'worry', 'nervous', 'panic'], label: 'Anxiety', dimension: 'emotional' },
    { keywords: ['perfect', 'standard', 'good enough', 'expect'], label: 'Perfectionism', dimension: 'cognitive' },
    { keywords: ['work', 'job', 'career', 'boss', 'colleague'], label: 'Work Stress', dimension: 'ecological' },
    { keywords: ['sleep', 'insomnia', 'tired', 'exhausted'], label: 'Sleep Issues', dimension: 'somatic' },
    { keywords: ['relationship', 'partner', 'friend', 'family'], label: 'Relationships', dimension: 'social' },
    { keywords: ['worth', 'failure', 'confidence', 'self-esteem'], label: 'Self-Worth', dimension: 'narrative' },
    { keywords: ['avoid', 'procrastinat', 'escape'], label: 'Avoidance Patterns', dimension: 'behavioral' },
    { keywords: ['drug', 'alcohol', 'substance', 'clean', 'sober', 'using', 'relapse'], label: 'Substance Recovery', dimension: 'behavioral' },
    { keywords: ['grief', 'loss', 'death', 'died', 'passed', 'mourn'], label: 'Grief & Loss', dimension: 'emotional' },
    { keywords: ['trauma', 'ptsd', 'flashback', 'nightmare'], label: 'Trauma', dimension: 'emotional' },
  ];

  topicDetectors.forEach((detector, i) => {
    if (!topics.find((t) => t.label.toLowerCase() === detector.label.toLowerCase())) {
      const count = detector.keywords.reduce((sum, kw) => sum + (allText.split(kw).length - 1), 0);
      if (count > 0) {
        const quoteResult = findBestQuote(detector.keywords);
        topics.push({
          id: `topic-kw-${i}`, label: detector.label,
          confidence: Math.min(0.95, 0.6 + count * 0.08), mentions: count,
          triggerQuote: quoteResult?.quote, speaker: quoteResult?.speaker,
          structureDimension: detector.dimension,
        });
      }
    }
  });

  const sorted = topics.sort((a, b) => b.confidence !== a.confidence ? b.confidence - a.confidence : b.mentions - a.mentions);
  if (sorted.length === 0) {
    sorted.push(
      { id: 'topic-gen-1', label: 'Emotional Processing', confidence: 0.7, mentions: 3 },
      { id: 'topic-gen-2', label: 'Self-Reflection', confidence: 0.65, mentions: 2 },
    );
  }
  return sorted;
}

function generateClinicalFlags(
  moments: Moment[],
  riskFlags: { severity: string; signal: string; detail: string; algorithmMatch?: string }[],
  cbt: CBTAnalysisResult | undefined,
  structureProfile: Record<string, number>,
  therapistMoves: TherapistMoveDistribution[],
  transcript?: string,
): ClinicalFlag[] {
  const flags: ClinicalFlag[] = [];

  riskFlags.forEach((rf, i) => {
    const matchedKeywords = (rf as Record<string, unknown>).algorithmMatch as string || rf.signal || '';
    let transcriptQuote = '';
    let location = 'Unknown';

    if (transcript) {
      const lines = transcript.split('\n');
      const keywordsToSearch = matchedKeywords.split(',').map((k: string) => k.trim().toLowerCase()).filter(Boolean);
      let bestLine = '';
      let bestScore = 0;
      let lineIndex = 0;

      for (let li = 0; li < lines.length; li++) {
        const lineLower = lines[li].toLowerCase();
        if (!lineLower.startsWith('client:') && !lineLower.startsWith('patient:')) continue;
        let score = 0;
        for (const kw of keywordsToSearch) { if (kw && lineLower.includes(kw)) score++; }
        if (score > bestScore) { bestScore = score; bestLine = lines[li]; lineIndex = li; }
      }

      if (bestLine) {
        transcriptQuote = bestLine.replace(/^(Client|Patient):\s*/i, '').trim();
        if (transcriptQuote.length > 200) {
          const firstKw = keywordsToSearch.find((kw: string) => kw && transcriptQuote.toLowerCase().includes(kw));
          if (firstKw) {
            const kwIndex = transcriptQuote.toLowerCase().indexOf(firstKw);
            const start = Math.max(0, kwIndex - 80);
            const end = Math.min(transcriptQuote.length, kwIndex + 120);
            transcriptQuote = (start > 0 ? '...' : '') + transcriptQuote.slice(start, end) + (end < transcriptQuote.length ? '...' : '');
          } else { transcriptQuote = transcriptQuote.slice(0, 200) + '...'; }
        }
        const totalLines = lines.length;
        location = `${Math.round((lineIndex / totalLines) * 50)}:00`;
      }
    }

    if (!transcriptQuote) {
      const keywordsToSearch = matchedKeywords.split(',').map((k: string) => k.trim().toLowerCase()).filter(Boolean);
      let bestMoment = moments[0];
      let bestMatchCount = 0;
      for (const moment of moments) {
        const combined = (moment.quote + ' ' + (moment.context || '')).toLowerCase();
        let matchCount = 0;
        for (const kw of keywordsToSearch) { if (kw && combined.includes(kw)) matchCount++; }
        if (matchCount > bestMatchCount) { bestMatchCount = matchCount; bestMoment = moment; }
      }
      transcriptQuote = bestMoment?.quote || `Detected keywords: ${matchedKeywords}`;
      location = bestMoment?.timestamp || 'Unknown';
    }

    const scoreMatch = rf.detail?.match(/Final adjusted score:\s*([\d.]+)/);
    const realConfidence = scoreMatch ? Math.min(parseFloat(scoreMatch[1]), 0.95) : (rf.severity === 'high' ? 0.85 : rf.severity === 'medium' ? 0.65 : 0.45);

    flags.push({
      id: `flag-risk-${i}`, type: 'risk', label: rf.signal, transcriptQuote, location,
      severity: rf.severity as RiskSeverity, confidence: realConfidence,
    });
  });

  if (cbt && Array.isArray(cbt.distortions)) {
    cbt.distortions.filter((d) => d.confidence > 0.7).slice(0, 3).forEach((d, i) => {
      const linkedMoment = moments[d.momentIndex] || moments[0];
      flags.push({
        id: `flag-cbt-${i}`, type: 'notable', label: `Cognitive distortion: ${d.type}`,
        transcriptQuote: d.evidence, location: linkedMoment?.timestamp || 'Unknown',
        severity: RiskSeverity.LOW, confidence: d.confidence,
      });
    });
  }

  const reflectiveMoments = moments.filter(
    (m) => m.structures.includes(StructureName.REFLECTIVE) || m.structures.includes(StructureName.NARRATIVE)
  );
  reflectiveMoments.slice(0, 2).forEach((m, i) => {
    flags.push({
      id: `flag-protective-${i}`, type: 'protective', label: 'Client demonstrates reflective capacity',
      transcriptQuote: m.quote, location: m.timestamp,
      severity: RiskSeverity.LOW, confidence: Math.min(0.95, 0.75 + m.intensity * 0.15),
    });
  });

  if (reflectiveMoments.length === 0 && (structureProfile['reflective'] || 0) > 0.5) {
    const rep = moments.find((m) => m.structures.includes(StructureName.REFLECTIVE)) || moments[0];
    flags.push({
      id: 'flag-protective-structure', type: 'protective', label: 'Strong reflective structure profile',
      transcriptQuote: rep?.quote || 'Client shows strong capacity for reflection',
      location: rep?.timestamp || 'Throughout session',
      severity: RiskSeverity.LOW, confidence: Math.min(0.92, 0.65 + (structureProfile['reflective'] || 0) * 0.25),
    });
  }

  const empathicMove = therapistMoves.find((tm) => tm.type === 'empathic_attunement');
  if (empathicMove && empathicMove.count > 3) {
    const allianceMoment = moments.find((m) => m.therapistMove === 'empathic_attunement') || moments[0];
    flags.push({
      id: 'flag-protective-alliance', type: 'protective', label: 'Strong therapeutic alliance observed',
      transcriptQuote: allianceMoment?.therapistQuote || 'Therapist demonstrates consistent empathic attunement',
      location: allianceMoment?.timestamp || 'Throughout session',
      severity: RiskSeverity.LOW, confidence: Math.min(0.88, 0.7 + empathicMove.percentage * 0.15),
    });
  }

  if (moments.length >= 3) {
    const thirdLen = Math.ceil(moments.length / 3);
    const firstThird = moments.slice(0, thirdLen).reduce((s, m) => s + m.intensity, 0) / thirdLen;
    const lastThird = moments.slice(Math.floor((moments.length * 2) / 3)).reduce((s, m) => s + m.intensity, 0) / thirdLen;
    if (lastThird < firstThird && (firstThird - lastThird) > 0.3) {
      const regMoment = moments[Math.floor((moments.length * 2) / 3)] || moments[moments.length - 1];
      flags.push({
        id: 'flag-protective-regulation', type: 'protective',
        label: 'Client demonstrates emotional regulation within session',
        transcriptQuote: regMoment?.quote || 'Emotional intensity decreased throughout session',
        location: regMoment?.timestamp || 'Session progression',
        severity: RiskSeverity.LOW,
        confidence: Math.min(0.85, 0.65 + ((firstThird - lastThird) / firstThird) * 0.2),
      });
    }
  }

  return flags;
}

function generateDiagnosticConsiderations(
  riskLevel: string,
  moments: { quote: string; structures: string[] }[],
  cbtAnalysis?: CBTAnalysisResult,
): DiagnosticConsideration[] {
  const allText = moments.map((m) => m.quote.toLowerCase()).join(' ');
  const considerations: DiagnosticConsideration[] = [];
  const distortionTypes = (cbtAnalysis?.distortions ?? []).map((d) => d.type.toLowerCase());
  const hasCatastrophizing = distortionTypes.some((t) => t.includes('catastroph'));
  const hasAllOrNothing = distortionTypes.some((t) => t.includes('all-or-nothing') || t.includes('all or nothing'));
  const hasLabeling = distortionTypes.some((t) => t.includes('label'));
  const hasPersonalization = distortionTypes.some((t) => t.includes('personal'));

  if (allText.includes('anxi') || allText.includes('worry') || allText.includes('nervous')) {
    considerations.push({
      id: 'dx-gad', code: 'F41.1', name: 'Generalized Anxiety Disorder',
      indicators: [
        'Excessive worry reported across multiple domains',
        'Physical symptoms (tension, restlessness) noted',
        ...(hasCatastrophizing ? ['Catastrophizing distortion detected in CBT analysis'] : []),
        ...(hasAllOrNothing ? ['All-or-nothing thinking pattern detected'] : []),
      ],
      confidence: Math.min(0.95, 0.72 + (hasCatastrophizing || hasAllOrNothing ? 0.1 : 0)),
      status: 'monitor',
    });
  }

  if (allText.includes('perfect') || allText.includes('standard')) {
    considerations.push({
      id: 'dx-ocd-traits', code: 'Z73.1', name: 'Perfectionism (not a disorder)',
      indicators: ['Rigid personal standards expressed', 'Self-critical evaluation patterns'],
      confidence: 0.65, status: 'monitor',
    });
  }

  considerations.push({
    id: 'dx-adjustment', code: 'F43.20', name: 'Adjustment Disorder, Unspecified',
    indicators: ['Identifiable stressor(s) present', 'Symptoms emerged in relation to stressor timeline'],
    confidence: 0.58, status: 'rule_in',
  });

  if (riskLevel === 'high' || allText.includes('sad') || allText.includes('depress') || allText.includes('hopeless')) {
    considerations.push({
      id: 'dx-mdd', code: 'F32.1', name: 'Major Depressive Disorder, Moderate',
      indicators: ['Depressed mood reported or observed', 'Functional impairment noted', 'Duration criteria need clarification'],
      confidence: 0.45, status: 'rule_out',
    });
  }

  if (hasLabeling || hasPersonalization) {
    considerations.push({
      id: 'dx-self-worth', code: 'Z73.0', name: 'Self-Worth / Identity Concerns',
      indicators: [
        ...(hasLabeling ? ['Labeling distortion detected -- client applies fixed negative labels to self'] : []),
        ...(hasPersonalization ? ['Personalization distortion detected -- client over-attributes blame to self'] : []),
        'Pattern suggests underlying self-worth schema',
      ],
      confidence: Math.min(0.95, 0.55 + distortionTypes.length * 0.05), status: 'monitor',
    });
  }

  return considerations;
}

// ========== COMPONENT ==========

export default function SessionOverviewPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const router = useRouter();
  const { data, loading } = useApi<{ session: SessionData }>(`/api/sessions/${sessionId}`);
  const session = data?.session || null;

  const [expandedFlag, setExpandedFlag] = useState<string | null>(null);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Assessment state (from analysis page)
  const [sessionAssessment, setSessionAssessment] = useState('');
  const [isEditingAssessment, setIsEditingAssessment] = useState(false);
  const [assessmentDraft, setAssessmentDraft] = useState('');
  const [savingAssessment, setSavingAssessment] = useState(false);

  useEffect(() => {
    if (session?.analysisResult) {
      const saved = (session.analysisResult as unknown as Record<string, unknown>).editedAssessment;
      if (typeof saved === 'string') setSessionAssessment(saved);
    }
  }, [session?.id, session?.analysisResult]);

  const handleSaveAssessment = useCallback(async () => {
    try {
      setSavingAssessment(true);
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editedAssessment: assessmentDraft }),
      });
      if (response.ok) {
        setSessionAssessment(assessmentDraft);
        setIsEditingAssessment(false);
      }
    } catch (error) {
      console.error('Error saving assessment:', error);
    } finally {
      setSavingAssessment(false);
    }
  }, [sessionId, assessmentDraft]);

  const handleRevertToAIDraft = useCallback(async () => {
    try {
      setSavingAssessment(true);
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editedAssessment: null }),
      });
      if (response.ok) {
        setSessionAssessment('');
        setIsEditingAssessment(false);
        setAssessmentDraft('');
      }
    } catch (error) {
      console.error('Error reverting assessment:', error);
    } finally {
      setSavingAssessment(false);
    }
  }, [sessionId]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
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
        <p className="text-gray-600 mb-6">This session has not been analyzed yet, or analysis is still in progress.</p>
        <Link href="/dashboard/session/new" className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition">Create New Session</Link>
      </Card>
    );
  }

  const analysis = session.analysisResult as AnalysisResult;
  const cbt = analysis.cbtAnalysis as CBTAnalysisResult | undefined;
  const topics = generateTopics(analysis.moments, analysis.structureProfile, cbt, session.transcript);
  const quickSummary = generateQuickSummary(analysis, topics, cbt);
  const clinicalFlags = generateClinicalFlags(
    analysis.moments, analysis.riskFlags, cbt,
    analysis.structureProfile, analysis.therapistMoves, session.transcript,
  );
  const diagnosticConsiderations = generateDiagnosticConsiderations(
    analysis.quickInsight.riskLevel, analysis.moments, cbt,
  );

  const riskCount = clinicalFlags.filter((f) => f.type === 'risk').length;
  const protectiveCount = clinicalFlags.filter((f) => f.type === 'protective').length;
  const notableCount = clinicalFlags.filter((f) => f.type === 'notable').length;

  const getFlagIcon = (type: string) => {
    switch (type) {
      case 'risk': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'protective': return <Shield className="w-4 h-4 text-green-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rule_in': return 'bg-amber-100 text-amber-700';
      case 'rule_out': return 'bg-red-100 text-red-700';
      case 'monitor': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const downloadNote = (type: 'soap' | 'dap') => {
    const text = type === 'soap'
      ? formatSOAPAsText(generateSOAPNote(analysis))
      : formatDAPAsText(generateDAPNote(analysis));
    const filename = `${type.toUpperCase()}_Note_${session.clientCode}_Session${session.sessionNumber}_${session.date}.txt`;
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

  const defaultAssessment = `Client presents with ${analysis.quickInsight.riskLevel} risk level. ${analysis.quickInsight.clinicalPriority}. ${analysis.quickInsight.prognosis}. Primary phenomenological structures activated include ${
    Object.entries(analysis.structureProfile)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name]) => name.replace(/_/g, ' '))
      .join(', ')
  }. ${analysis.quickInsight.topRecommendation || ''}`;

  const displayAssessment = sessionAssessment || defaultAssessment;

  const similarCases = analysis.similarCases || [];
  const getSimilarCasesCountForDx = (indicators: string[]): number => {
    if (similarCases.length === 0) return 0;
    const dxStructures = indicators.filter((ind) => ind.toLowerCase().includes('structure') || ind.toLowerCase().includes('pattern'));
    if (dxStructures.length === 0) return 0;
    return similarCases.filter((c) => {
      const caseStructures = (c.dominantStructures || []).map((s) => s.toLowerCase());
      return dxStructures.some((ds) => caseStructures.some((cs) => cs.includes(ds.toLowerCase())));
    }).length;
  };

  return (
    <div className="space-y-4">
      {/* 1. Quick Insight Banner */}
      <div
        className={`rounded-xl p-6 border-l-4 ${
          analysis.quickInsight.riskLevel === 'high'
            ? 'bg-red-50 border-l-red-500'
            : analysis.quickInsight.riskLevel === 'moderate'
              ? 'bg-amber-50 border-l-amber-500'
              : 'bg-green-50 border-l-green-500'
        }`}
      >
        <div className="flex items-center gap-3 mb-2">
          <Badge
            label={analysis.quickInsight.riskLevel.charAt(0).toUpperCase() + analysis.quickInsight.riskLevel.slice(1) + ' Risk'}
            variant={
              analysis.quickInsight.riskLevel === 'high' ? 'risk-high'
                : analysis.quickInsight.riskLevel === 'moderate' ? 'risk-medium' : 'risk-low'
            }
          />
          <span className="text-xs text-gray-500 font-mono">Session #{session.sessionNumber} &middot; {session.date}</span>
        </div>
        <p className="text-gray-800 font-medium">{analysis.quickInsight.clinicalPriority}</p>
        <p className="text-gray-600 text-sm mt-1">{analysis.quickInsight.prognosis}</p>
      </div>

      {/* 2. Clinical Summary */}
      <CollapsibleSection
        title="Clinical Summary"
        icon={<BookOpen className="w-5 h-5 text-primary" />}
        teaser={
          <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{quickSummary}</p>
        }
      >
        <p className="text-sm text-gray-700 leading-relaxed mb-4">{quickSummary}</p>
        {Object.entries(analysis.structureProfile || {})
          .filter(([, v]) => typeof v === 'number' && v > 0.1)
          .sort(([, a], [, b]) => b - a)
          .length > 0 && (
          <div>
            <p className="text-xs text-gray-500 font-medium mb-2">Dominant structures:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(analysis.structureProfile || {})
                .filter(([, v]) => typeof v === 'number' && v > 0.1)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([name, score]) => (
                  <span key={name} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                    {name.replace(/_/g, ' ')} {Math.round(score * 100)}%
                  </span>
                ))}
            </div>
          </div>
        )}
        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Auto-generated clinical summary -- review before relying on for documentation
        </p>
      </CollapsibleSection>

      {/* 3. Session Topics & Key Moments */}
      <CollapsibleSection
        title="Session Topics & Key Moments"
        icon={<Hash className="w-5 h-5 text-primary" />}
        teaser={
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              {topics.slice(0, 4).map((t) => (
                <span key={t.id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/5 border border-primary/20 text-sm font-medium text-gray-800">
                  {t.label}
                  {t.mentions > 1 && <span className="text-xs text-gray-400">x{t.mentions}</span>}
                </span>
              ))}
              {topics.length > 4 && <span className="text-xs text-gray-400 self-center">+{topics.length - 4} more</span>}
            </div>
            {topics[0]?.triggerQuote && (
              <p className="text-xs text-gray-500 italic truncate">&ldquo;{topics[0].triggerQuote}&rdquo;</p>
            )}
          </div>
        }
      >
        <div className="flex flex-wrap gap-2 mb-4">
          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={(e) => { e.stopPropagation(); setExpandedTopic(expandedTopic === topic.id ? null : topic.id); }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-left ${
                expandedTopic === topic.id
                  ? 'bg-primary/10 border-primary/40 ring-1 ring-primary/20'
                  : 'bg-white border-gray-200 hover:border-primary/30 hover:bg-primary/5'
              }`}
            >
              <span className="text-sm font-medium text-gray-800">{topic.label}</span>
              {topic.mentions > 1 && <span className="text-xs text-gray-400">x{topic.mentions}</span>}
              {topic.structureDimension && (
                <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full hidden sm:inline">{topic.structureDimension}</span>
              )}
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: topic.confidence > 0.8 ? '#10B981' : topic.confidence > 0.6 ? '#F59E0B' : '#9CA3AF' }}
                title={`Confidence: ${Math.round(topic.confidence * 100)}%`}
              />
            </button>
          ))}
        </div>

        {expandedTopic && (() => {
          const topic = topics.find((t) => t.id === expandedTopic);
          if (!topic?.triggerQuote) return null;
          return (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {topic.speaker === 'therapist' ? (
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center"><Stethoscope className="w-3.5 h-3.5 text-blue-600" /></div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center"><User className="w-3.5 h-3.5 text-amber-600" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 mb-1">{topic.speaker === 'therapist' ? 'Therapist:' : 'Client:'}</p>
                  <p className="text-sm text-gray-700 italic leading-relaxed">&ldquo;{topic.triggerQuote}&rdquo;</p>
                  <div className="flex items-center gap-3 mt-2">
                    {topic.structureDimension && <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{topic.structureDimension}</span>}
                    <span className="text-[10px] text-gray-400">{Math.round(topic.confidence * 100)}% confidence &middot; {topic.mentions} mention{topic.mentions !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Confidence: <span className="inline-block w-2 h-2 rounded-full bg-green-500" /> &gt;80%&nbsp;
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500" /> 60-80%&nbsp;
          <span className="inline-block w-2 h-2 rounded-full bg-gray-400" /> &lt;60%
        </p>
      </CollapsibleSection>

      {/* 4. Risk & Clinical Flags */}
      <CollapsibleSection
        title="Risk & Clinical Flags"
        icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
        teaser={
          <div className="flex items-center gap-4 text-sm">
            {riskCount > 0 && <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" />{riskCount} risk flag{riskCount !== 1 ? 's' : ''}</span>}
            {protectiveCount > 0 && <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" />{protectiveCount} protective factor{protectiveCount !== 1 ? 's' : ''}</span>}
            {notableCount > 0 && <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" />{notableCount} notable finding{notableCount !== 1 ? 's' : ''}</span>}
            {riskCount === 0 && protectiveCount === 0 && notableCount === 0 && <span className="text-gray-400">No clinical flags detected</span>}
          </div>
        }
      >
        <div className="space-y-3">
          {clinicalFlags.map((flag) => (
            <div
              key={flag.id}
              className="p-4 bg-white rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition"
              onClick={() => setExpandedFlag(expandedFlag === flag.id ? null : flag.id)}
            >
              <div className="flex items-start gap-3">
                {getFlagIcon(flag.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-gray-900 text-sm">{flag.label}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400 font-mono">{flag.location}</span>
                      <span className="text-xs text-gray-400">{Math.round(flag.confidence * 100)}% conf.</span>
                    </div>
                  </div>
                  {expandedFlag === flag.id && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-start gap-2">
                        <MessageSquareQuote className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700 italic leading-relaxed">&ldquo;{flag.transcriptQuote}&rdquo;</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Source: Transcript at {flag.location} &middot; Detection confidence: {Math.round(flag.confidence * 100)}%</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* 5. CBT & Cognitive Analysis */}
      <CollapsibleSection
        title="CBT & Cognitive Analysis"
        icon={<Brain className="w-5 h-5 text-amber-500" />}
        teaser={
          cbt && Array.isArray(cbt.distortions) && cbt.distortions.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600">Distortion load:</span>
                <div className="flex items-center gap-2 flex-1 max-w-48">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${(cbt.overallDistortionLoad || 0) > 0.6 ? 'bg-red-400' : (cbt.overallDistortionLoad || 0) > 0.3 ? 'bg-amber-400' : 'bg-green-400'}`} style={{ width: `${Math.round((cbt.overallDistortionLoad || 0) * 100)}%` }} />
                  </div>
                  <span className="text-xs font-bold">{Math.round((cbt.overallDistortionLoad || 0) * 100)}%</span>
                </div>
                <span className="text-gray-600">Readiness:</span>
                <div className="flex items-center gap-2 flex-1 max-w-48">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${(cbt.treatmentReadiness || 0) > 0.6 ? 'bg-green-400' : 'bg-amber-400'}`} style={{ width: `${Math.round((cbt.treatmentReadiness || 0) * 100)}%` }} />
                  </div>
                  <span className="text-xs font-bold">{Math.round((cbt.treatmentReadiness || 0) * 100)}%</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {(cbt.dominantPatterns || []).map((p) => (
                  <span key={p} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{p}</span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No cognitive distortions detected in this session.</p>
          )
        }
      >
        {cbt && Array.isArray(cbt.distortions) && cbt.distortions.length > 0 ? (
          <>
            <div className="space-y-3 mb-5">
              {cbt.distortions.map((d, i) => (
                <div key={i} className="p-4 bg-white rounded-xl border border-gray-200">
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
                </div>
              ))}
            </div>

            {Array.isArray(cbt.automaticThoughts) && cbt.automaticThoughts.length > 0 && (
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

            {Array.isArray(cbt.behavioralPatterns) && cbt.behavioralPatterns.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-gray-500 font-medium">Behavioral Patterns:</span>
                {cbt.behavioralPatterns.map((p, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p}</span>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500">No CBT analysis data available for this session. This section populates when cognitive distortions are detected in the transcript.</p>
        )}
      </CollapsibleSection>

      {/* 6. Diagnostic Considerations */}
      <CollapsibleSection
        title="Diagnostic Considerations"
        icon={<Stethoscope className="w-5 h-5 text-primary" />}
        teaser={
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {diagnosticConsiderations.slice(0, 3).map((dx) => (
                <span key={dx.id} className="inline-flex items-center gap-2 text-sm">
                  <span className="font-mono text-xs text-gray-500">{dx.code}</span>
                  <span className="font-medium text-gray-800">{dx.name}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${getStatusColor(dx.status)}`}>
                    {Math.round(dx.confidence * 100)}%
                  </span>
                </span>
              ))}
            </div>
            <p className="text-[11px] text-amber-600 font-medium">AI-generated suggestions -- not clinical diagnoses</p>
          </div>
        }
      >
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3">
          <FileWarning className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">THIS IS NOT A DIAGNOSIS</p>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              The following are AI-generated considerations based on transcript analysis only.
              They are intended to support clinical thinking, not replace professional diagnostic assessment.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {diagnosticConsiderations.map((dx) => {
            const similarCount = getSimilarCasesCountForDx(dx.indicators);
            return (
              <div key={dx.id} className="p-5 bg-white rounded-xl border border-gray-200">
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
                <ul className="space-y-1">
                  {dx.indicators.map((ind, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-gray-400 mt-1">&#8226;</span>{ind}
                    </li>
                  ))}
                </ul>
                {similarCount > 0 && dx.confidence > 0.65 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                      <Database className="w-3 h-3" />
                      Supported by {similarCount} similar {similarCount === 1 ? 'case' : 'cases'} from research archive
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CollapsibleSection>

      {/* 7. Therapist Intervention Profile */}
      {Array.isArray(analysis.therapistMoves) && analysis.therapistMoves.length > 0 && (
        <CollapsibleSection
          title="Therapist Intervention Profile"
          icon={<Stethoscope className="w-5 h-5 text-primary" />}
          teaser={
            <div className="flex flex-wrap gap-2">
              {analysis.therapistMoves
                .slice()
                .sort((a, b) => b.percentage - a.percentage)
                .slice(0, 3)
                .map((move) => {
                  const label = move.type.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                  return (
                    <span key={move.type} className="text-sm text-gray-700">
                      {label} <span className="font-bold text-primary">{Math.round(move.percentage)}%</span>
                    </span>
                  );
                })}
            </div>
          }
        >
          <div className="space-y-4">
            {analysis.therapistMoves
              .slice()
              .sort((a, b) => b.percentage - a.percentage)
              .map((move) => {
                const label = move.type.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                return (
                  <div key={move.type}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                      <span className="text-xs text-gray-500">{move.count} ({Math.round(move.percentage)}%)</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${Math.max(move.percentage, 2)}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
          <p className="text-xs text-gray-400 mt-4 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Distribution of therapist interventions detected across the session transcript
          </p>
        </CollapsibleSection>
      )}

      {/* 8. Notes & Export */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-5">
          <h3 className="font-playfair text-lg font-bold text-gray-900 mb-4">Notes & Export</h3>

          {/* Note download buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <button onClick={() => downloadNote('soap')} className="flex items-center gap-3 px-5 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group">
              <FileText className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-900 text-sm">SOAP Note</p>
                <p className="text-xs text-gray-500">Subjective, Objective, Assessment, Plan</p>
              </div>
              <Download className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
            </button>
            <button onClick={() => downloadNote('dap')} className="flex items-center gap-3 px-5 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group">
              <FileText className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-900 text-sm">DAP Note</p>
                <p className="text-xs text-gray-500">Data, Assessment, Plan</p>
              </div>
              <Download className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-6 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Notes are AI-generated drafts. Always review and edit before including in clinical records.
          </p>

          {/* Session Assessment (editable) */}
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700">Session Assessment</p>
              {!isEditingAssessment ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setAssessmentDraft(displayAssessment); setIsEditingAssessment(true); }}
                    className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-dark font-medium px-3 py-1.5 rounded-lg hover:bg-primary/5 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />Edit
                  </button>
                  {sessionAssessment && (
                    <button
                      onClick={handleRevertToAIDraft}
                      disabled={savingAssessment}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />Revert
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={handleSaveAssessment} disabled={savingAssessment} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium px-3 py-1.5 rounded-lg hover:bg-green-50 transition disabled:opacity-50">
                    {savingAssessment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    {savingAssessment ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setIsEditingAssessment(false)} disabled={savingAssessment} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition disabled:opacity-50">
                    <X className="w-3.5 h-3.5" />Cancel
                  </button>
                </div>
              )}
            </div>
            {isEditingAssessment ? (
              <textarea
                value={assessmentDraft}
                onChange={(e) => setAssessmentDraft(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-700 leading-relaxed focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-y"
                placeholder="Write your clinical assessment of this session..."
              />
            ) : (
              <div>
                <p className="text-sm text-gray-700 leading-relaxed">{displayAssessment}</p>
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {sessionAssessment ? 'Your edited assessment' : 'AI-generated draft -- click Edit to add your clinical observations'}
                </p>
              </div>
            )}
          </div>

          {/* Delete Session */}
          <div className="border-t border-gray-100 pt-5 mt-5">
            <button
              onClick={async () => {
                if (!confirmDelete) { setConfirmDelete(true); return; }
                try {
                  await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
                  router.push('/dashboard');
                } catch { setConfirmDelete(false); }
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 border border-red-200 hover:bg-red-50 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {confirmDelete ? 'Are you sure? Click again to delete' : 'Delete Session'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
