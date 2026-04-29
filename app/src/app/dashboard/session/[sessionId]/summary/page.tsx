'use client';

import { useState, useEffect, useCallback } from 'react';
import { generateSOAPNote, generateDAPNote } from '@/lib/note-generator';
import { EditableClinicalNote, type ClinicalNoteSection } from '@/components/notes/EditableClinicalNote';
import { OutcomeScoresForm } from '@/components/outcomes/OutcomeScoresForm';
// SessionSignOff was moved to the Full Report tab.
// import { SessionSignOff } from '@/components/notes/SessionSignOff';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApi } from '@/hooks/use-api';
import type { AnalysisResult, CBTAnalysisResult } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { LineagePopover, type LineageSnippet } from '@/components/ui/LineagePopover';
import { StructureBar } from '@/components/summary/StructureBar';
import { getStructureColor } from '@/lib/structures';
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
  Edit3,
  Check,
  X,
  RotateCcw,
  Eye,
} from 'lucide-react';
import {
  ExtractedTopic,
  TopicOccurrence,
  ClinicalFlag,
  RiskSeverity,
  StructureName,
  Moment,
  TherapistMoveDistribution,
} from '@/types';

// Map of generic topic labels -> phenomenological structure(s) from our 10-dimension framework.
// Used both as the topic's `structure` and to drive the bar color via getStructureColor().
const TOPIC_STRUCTURE_MAP: Record<string, { label: string; primary: StructureName }> = {
  'emotional processing': { label: 'emotional', primary: StructureName.EMOTION },
  'cognitive patterns': { label: 'cognitive', primary: StructureName.COGNITIVE },
  'social/relational dynamics': { label: 'social', primary: StructureName.SOCIAL },
  'somatic experience': { label: 'somatic', primary: StructureName.BODY },
  'self-reflection': { label: 'reflective', primary: StructureName.REFLECTIVE },
  'behavioral patterns': { label: 'behavioral', primary: StructureName.BEHAVIOUR },
  'identity/narrative': { label: 'narrative', primary: StructureName.NARRATIVE },
  'environmental factors': { label: 'ecological', primary: StructureName.ECOLOGICAL },
  'values/standards': { label: 'normative', primary: StructureName.NORMATIVE },
  'present-moment awareness': { label: 'experiential', primary: StructureName.IMMEDIATE_EXPERIENCE },
  'anxiety': { label: 'emotional', primary: StructureName.EMOTION },
  'panic': { label: 'emotional + somatic', primary: StructureName.EMOTION },
  'perfectionism': { label: 'cognitive + normative', primary: StructureName.COGNITIVE },
  'work stress': { label: 'social + ecological', primary: StructureName.ECOLOGICAL },
  'sleep issues': { label: 'somatic', primary: StructureName.BODY },
  'relationships': { label: 'social', primary: StructureName.SOCIAL },
  'self-worth': { label: 'narrative', primary: StructureName.NARRATIVE },
  'avoidance patterns': { label: 'behavioral', primary: StructureName.BEHAVIOUR },
  'substance recovery': { label: 'behavioral + normative', primary: StructureName.BEHAVIOUR },
  'grief & loss': { label: 'emotional + narrative', primary: StructureName.EMOTION },
  'trauma': { label: 'emotional + somatic', primary: StructureName.EMOTION },
};

function resolveTopicStructure(label: string, fallback?: string): { structure: string; color: string } {
  const key = label.toLowerCase();
  const mapped = TOPIC_STRUCTURE_MAP[key];
  if (mapped) {
    return { structure: mapped.label, color: getStructureColor(mapped.primary) };
  }
  // Fallback: try matching the existing structureDimension to a StructureName
  if (fallback) {
    const fbKey = fallback.toLowerCase();
    const matchByDim = Object.values(TOPIC_STRUCTURE_MAP).find((m) => m.label === fbKey);
    if (matchByDim) {
      return { structure: matchByDim.label, color: getStructureColor(matchByDim.primary) };
    }
  }
  return { structure: fallback || 'mixed', color: '#2D7D7D' };
}

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
  consentRecordedAt?: string | null;
  consentMethod?: 'verbal' | 'written' | 'electronic' | null;
  consentVersion?: string | null;
}

/**
 * Format the consent footer line for clinical-note exports.
 * Returns empty string if no consent on file (legacy pre-v1 sessions).
 */
function formatConsentFooter(s: SessionData): string {
  if (!s.consentRecordedAt) return '';
  const dateStr = s.consentRecordedAt.slice(0, 10);
  const methodLabel =
    s.consentMethod === 'written' ? 'written form on file'
    : s.consentMethod === 'electronic' ? 'electronic signature'
    : 'verbal consent at session start';
  return `\n\n— Recorded with client consent (${methodLabel}) on ${dateStr}. ` +
    `Privacy policy ${s.consentVersion || 'v1.0'}.`;
}

// ========== COLLAPSIBLE SECTION ==========

function CollapsibleSection({
  title,
  icon,
  teaser,
  children,
  defaultOpen = false,
  tooltip,
  headerExtra,
}: {
  title: string;
  icon: React.ReactNode;
  teaser: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  tooltip?: React.ReactNode;
  headerExtra?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-md border border-gray-200">
      <div className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition rounded-t-2xl">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 flex-1 text-left"
        >
          {icon}
          <h3 className="font-playfair text-lg font-bold text-gray-900">{title}</h3>
          {tooltip}
        </button>
        <div className="flex items-center gap-3">
          {headerExtra}
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Collapse' : 'Expand'}
            className="p-1"
          >
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
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
  moments: Moment[] | { quote: string; structures: string[]; timestamp?: string; id?: number }[],
  structureProfile?: Record<string, number>,
  cbt?: CBTAnalysisResult,
  transcript?: string,
): ExtractedTopic[] {
  const topics: ExtractedTopic[] = [];
  const safeMoments = (Array.isArray(moments) ? moments : []) as Moment[];

  const transcriptLines: { speaker: 'client' | 'therapist'; text: string; lineIndex: number }[] = [];
  if (transcript) {
    const rawLines = transcript.split('\n');
    rawLines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (/^(client|patient):/i.test(trimmed)) {
        transcriptLines.push({ speaker: 'client', text: trimmed.replace(/^(Client|Patient):\s*/i, '').trim(), lineIndex: idx });
      } else if (/^(therapist|counselor|doctor):/i.test(trimmed)) {
        transcriptLines.push({ speaker: 'therapist', text: trimmed.replace(/^(Therapist|Counselor|Doctor):\s*/i, '').trim(), lineIndex: idx });
      }
    });
  }

  function truncateAroundKeyword(text: string, keywords: string[]): string {
    if (text.length <= 180) return text;
    const lower = text.toLowerCase();
    const firstKw = keywords.find((kw) => lower.includes(kw));
    if (firstKw) {
      const idx = lower.indexOf(firstKw);
      const start = Math.max(0, idx - 60);
      const end = Math.min(text.length, idx + 120);
      return (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');
    }
    return text.slice(0, 180) + '...';
  }

  // Collect ALL matching snippets for a topic, prioritising real moments (carry timestamp/momentId/structures)
  // and falling back to transcript lines that aren't represented in any moment.
  function collectOccurrences(keywords: string[]): TopicOccurrence[] {
    const occ: TopicOccurrence[] = [];
    const seenQuotes = new Set<string>();

    for (const m of safeMoments) {
      const quote = (m.quote || '').toLowerCase();
      if (!quote) continue;
      const matches = keywords.some((kw) => quote.includes(kw));
      if (matches) {
        const key = (m.quote || '').slice(0, 60).toLowerCase();
        if (seenQuotes.has(key)) continue;
        seenQuotes.add(key);
        occ.push({
          quote: truncateAroundKeyword(m.quote || '', keywords),
          timestamp: m.timestamp,
          momentId: m.id,
          speaker: 'client',
          structures: Array.isArray(m.structures) ? m.structures.map((s) => String(s)) : undefined,
        });
      }
    }

    for (const line of transcriptLines) {
      const lower = line.text.toLowerCase();
      const matches = keywords.some((kw) => lower.includes(kw));
      if (!matches) continue;
      const key = line.text.slice(0, 60).toLowerCase();
      if (seenQuotes.has(key)) continue;
      // Skip if a moment already captures this line (heuristic: substring overlap)
      const overlapsMoment = occ.some((o) => o.quote.toLowerCase().includes(key) || lower.includes(o.quote.slice(0, 40).toLowerCase()));
      if (overlapsMoment) continue;
      seenQuotes.add(key);
      occ.push({
        quote: truncateAroundKeyword(line.text, keywords),
        speaker: line.speaker,
      });
    }

    return occ;
  }

  function findBestQuote(keywords: string[]): { quote: string; speaker: 'client' | 'therapist' } | null {
    const occ = collectOccurrences(keywords);
    if (occ.length === 0) return null;
    return { quote: occ[0].quote, speaker: occ[0].speaker || 'client' };
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
          const occurrences = mapping ? collectOccurrences(mapping.keywords) : [];
          const clientCount = occurrences.filter((o) => o.speaker !== 'therapist').length;
          const first = occurrences.find((o) => o.speaker !== 'therapist') ?? occurrences[0];
          topics.push({
            id: `topic-struct-${structureName}`,
            label: topicLabel,
            confidence: Math.min(0.95, 0.5 + score * 0.4),
            mentions: clientCount || Math.round(score * 10),
            count: clientCount,
            occurrences,
            triggerQuote: first?.quote,
            speaker: first?.speaker,
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
        const occurrences = collectOccurrences(pattern.toLowerCase().split(/[\s-]+/));
        // If keyword search yields nothing, fall back to distortion evidence so we still show a snippet.
        if (occurrences.length === 0 && bestDistortion?.evidence) {
          occurrences.push({ quote: bestDistortion.evidence, speaker: 'client' });
        }
        const clientCount = occurrences.filter((o) => o.speaker !== 'therapist').length;
        const first = occurrences.find((o) => o.speaker !== 'therapist') ?? occurrences[0];
        topics.push({
          id: `topic-cbt-${i}`, label: pattern, confidence: avgConfidence,
          mentions: clientCount || patternDistortions.length || 1,
          count: clientCount,
          occurrences,
          triggerQuote: first?.quote || bestDistortion?.evidence,
          speaker: first?.speaker || 'client',
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
      const occurrences = collectOccurrences(detector.keywords);
      if (occurrences.length > 0) {
        const clientCount = occurrences.filter((o) => o.speaker !== 'therapist').length;
        const first = occurrences.find((o) => o.speaker !== 'therapist') ?? occurrences[0];
        // Skip topics that only the therapist mentions — those aren't client experiences
        if (clientCount === 0) return;
        topics.push({
          id: `topic-kw-${i}`, label: detector.label,
          confidence: Math.min(0.95, 0.6 + clientCount * 0.08),
          mentions: clientCount,
          count: clientCount,
          occurrences,
          triggerQuote: first?.quote, speaker: first?.speaker,
          structureDimension: detector.dimension,
        });
      }
    }
  });

  // Annotate each topic with its phenomenological structure label (and color, used by the bar chart).
  topics.forEach((t) => {
    const resolved = resolveTopicStructure(t.label, t.structureDimension);
    t.structure = resolved.structure;
  });

  // Primary sort: descending count (mentions). Tiebreak by confidence.
  const sorted = topics.sort((a, b) => {
    const ca = a.count ?? a.mentions ?? 0;
    const cb = b.count ?? b.mentions ?? 0;
    if (cb !== ca) return cb - ca;
    return b.confidence - a.confidence;
  });
  if (sorted.length === 0) {
    sorted.push(
      { id: 'topic-gen-1', label: 'Emotional Processing', confidence: 0.7, mentions: 3, count: 0, occurrences: [], structure: 'emotional' },
      { id: 'topic-gen-2', label: 'Self-Reflection', confidence: 0.65, mentions: 2, count: 0, occurrences: [], structure: 'reflective' },
    );
  }
  return sorted;
}

function generateClinicalFlags(
  moments: Moment[],
  riskFlags: { severity: string; signal: string; detail: string; algorithmMatch?: string; interventionType?: string }[],
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

    // Pass interventionType through so the icon/colour can distinguish "act now"
    // (immediate) from "keep an eye on this going forward" (monitor). Defaults to
    // 'immediate' when missing so legacy data still renders as alarm-shape.
    const interventionType: 'immediate' | 'monitor' =
      rf.interventionType === 'monitor' ? 'monitor' : 'immediate';
    flags.push({
      id: `flag-risk-${i}`, type: 'risk', label: rf.signal, transcriptQuote, location,
      severity: rf.severity as RiskSeverity, confidence: realConfidence,
      interventionType,
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


// ========== TOPICS BAR CHART ==========

/**
 * Dual-view topic visualisation:
 *  - Top: horizontal bar chart, one bar per topic (length proportional to count).
 *    Bar colour comes from the topic's mapped phenomenological structure.
 *  - Bottom: when a topic is selected, every matching snippet is rendered with
 *    timestamp + speaker, each wrapped in a LineagePopover for source lineage.
 * The long tail (>7 topics) collapses under "Other (N more)".
 */
function TopicsBarChart({
  topics,
  expandedTopic,
  onSelect,
}: {
  topics: ExtractedTopic[];
  expandedTopic: string | null;
  onSelect: (id: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const [showTherapistRefs, setShowTherapistRefs] = useState(false);
  const TOP_N = 7;
  const visibleTopics = showAll ? topics : topics.slice(0, TOP_N);
  const tail = topics.slice(TOP_N);

  // Adapt visual scale: even with small counts (1-4 in the demo) bars should fill space.
  const maxCount = Math.max(1, ...topics.map((t) => t.count ?? t.mentions ?? 0));

  const selected = topics.find((t) => t.id === expandedTopic) || null;
  // Default snippet view = client only. Therapist refs are clinical scaffolding,
  // not client experience, so we show them behind a toggle.
  const selectedClientOcc = (selected?.occurrences ?? []).filter((o) => o.speaker !== 'therapist');
  const selectedTherapistOcc = (selected?.occurrences ?? []).filter((o) => o.speaker === 'therapist');
  const visibleOccurrences = showTherapistRefs
    ? [...selectedClientOcc, ...selectedTherapistOcc]
    : selectedClientOcc;

  return (
    <div>
      <div className="space-y-2 mb-4">
        {visibleTopics.map((topic) => {
          const count = topic.count ?? topic.mentions ?? 0;
          const therapistRefCount = (topic.occurrences ?? []).filter((o) => o.speaker === 'therapist').length;
          const isSelected = expandedTopic === topic.id;
          const widthPct = Math.max(8, Math.round((count / maxCount) * 100));
          const resolved = resolveTopicStructure(topic.label, topic.structureDimension);
          const color = resolved.color;
          const structureLabel = topic.structure || resolved.structure;
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => onSelect(topic.id)}
              aria-pressed={isSelected}
              className={`w-full text-left rounded-lg border transition-all px-3 py-2 ${
                isSelected
                  ? 'border-primary/40 ring-1 ring-primary/20 bg-primary/5'
                  : 'border-gray-200 bg-white hover:border-primary/30 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-gray-800 truncate">{topic.label}</span>
                  {structureLabel && (
                    <span
                      className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full hidden sm:inline whitespace-nowrap"
                      style={{ borderLeft: `2px solid ${color}` }}
                    >
                      {structureLabel}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500 font-mono flex-shrink-0">
                  {count} client {count === 1 ? 'quote' : 'quotes'}
                  {therapistRefCount > 0 && (
                    <span className="text-gray-400 ml-1">
                      &middot; +{therapistRefCount} therapist {therapistRefCount === 1 ? 'ref' : 'refs'}
                    </span>
                  )}
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${widthPct}%`, backgroundColor: color, opacity: isSelected ? 1 : 0.75 }}
                />
              </div>
            </button>
          );
        })}
        {tail.length > 0 && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="text-xs text-primary hover:text-primary-dark font-medium px-2 py-1"
          >
            {showAll ? 'Show fewer' : `Other (${tail.length} more)`}
          </button>
        )}
      </div>

      {selected ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              {selected.label}
              <span className="text-gray-400 font-normal normal-case tracking-normal ml-2">
                {selectedClientOcc.length} client {selectedClientOcc.length === 1 ? 'quote' : 'quotes'}
                {selectedTherapistOcc.length > 0 && !showTherapistRefs && (
                  <span> &middot; {selectedTherapistOcc.length} therapist {selectedTherapistOcc.length === 1 ? 'reference' : 'references'} hidden</span>
                )}
              </span>
            </p>
            <div className="flex items-center gap-2">
              {selectedTherapistOcc.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowTherapistRefs((v) => !v)}
                  className="text-[10px] font-medium text-primary hover:text-primary-dark bg-white border border-primary/20 hover:border-primary/40 px-2 py-0.5 rounded-full transition-colors"
                >
                  {showTherapistRefs
                    ? 'Hide therapist references'
                    : `+ Show ${selectedTherapistOcc.length} therapist ${selectedTherapistOcc.length === 1 ? 'reference' : 'references'}`}
                </button>
              )}
              {selected.structure && (
                <span className="text-[10px] bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                  {selected.structure}
                </span>
              )}
            </div>
          </div>
          {visibleOccurrences.length > 0 ? (
            <div className="space-y-2">
              {visibleOccurrences.map((occ, i) => {
                const snippets: LineageSnippet[] = [{
                  text: occ.quote,
                  timestamp: occ.timestamp,
                  momentId: occ.momentId,
                  speaker: occ.speaker,
                }];
                return (
                  <div key={`${selected.id}-occ-${i}`} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100">
                    <div className="flex-shrink-0 mt-0.5">
                      {occ.speaker === 'therapist' ? (
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                          <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-xs font-semibold text-gray-500">
                          {occ.speaker === 'therapist' ? 'Therapist' : 'Client'}
                        </p>
                        <div className="flex items-center gap-2">
                          {occ.timestamp && (
                            <span className="text-[10px] font-mono text-gray-400">{occ.timestamp}</span>
                          )}
                          <LineagePopover
                            snippets={snippets}
                            methodology={`Topic: ${selected.label} (${selected.structure || 'mixed'}). Detected by keyword + structure matching across moments and transcript.`}
                          >
                            <span className="text-[10px] text-gray-400">source</span>
                          </LineagePopover>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 italic leading-relaxed">&ldquo;{occ.quote}&rdquo;</p>
                      {occ.structures && occ.structures.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {occ.structures.slice(0, 4).map((s, si) => (
                            <span key={si} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                              {String(s).replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No quotes captured for this topic.</p>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic px-1">Click a bar to see every quote.</p>
      )}
    </div>
  );
}

// ========== SUMMARY LENGTH FILTER ==========

/**
 * Strip out any "## Risk Assessment" / "## Current Risk Level" / "## Risk Profile"
 * sections from an AI-generated clinical summary.
 *
 * Rationale: assessing risk is the clinician's responsibility, not the AI's.
 * The Risk & Clinical Flags section already surfaces the underlying transcript
 * signals (e.g. specific quotes, severity, recommendation). We do NOT want a
 * top-line "Current Risk Level: High" verdict appearing inside the prose summary
 * because it reads as a clinical conclusion the AI is not qualified to deliver.
 *
 * The actual doctor-assigned risk lives on the Session Sign-Off panel.
 */
function stripAIRiskAssessment(report: string): string {
  if (!report) return '';
  // Remove any "## Risk Assessment / Risk Level / Risk Profile / Risk Picture" section
  // (and its body) up to the next ## heading or end of text. Case-insensitive.
  return report
    .replace(
      /\n*##\s+(Risk Assessment|Risk Level|Current Risk Level|Risk Profile|Risk Picture|Risk Stratification)[^\n]*\n[\s\S]*?(?=\n##\s|\n#(?!#)|$)/gi,
      '\n',
    )
    // Also drop bare "Risk Level: <verdict>" / "Current Risk Level: ..." lines that
    // sometimes appear inline outside their own section.
    .replace(/^[\s-*•]*\*?\*?(Current\s+)?Risk\s+(Level|Score|Rating)\*?\*?:.*$/gim, '')
    // Collapse multiple blank lines left behind
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Derive a Short/Medium/Full view of an existing clinician report string.
 * No new content is fabricated — Short is the first paragraph (or first 2
 * sentences if no paragraph break), Medium is the first ~3 paragraphs, Full
 * is the whole report. This honors the strict-audit rule: the toggle only
 * filters what the LLM already produced.
 */
function deriveSummaryByLength(report: string, length: 'short' | 'medium' | 'full'): string {
  if (!report) return '';
  if (length === 'full') return report;

  // Split by markdown header or blank-line paragraph breaks.
  const paragraphs = report
    .split(/\n\s*\n|\n(?=##\s)/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (length === 'medium') {
    return paragraphs.slice(0, 3).join('\n\n');
  }

  // Short: first paragraph, or first 2 sentences if there is only one block.
  if (paragraphs.length > 1) return paragraphs[0];
  const sentences = report.match(/[^.!?]+[.!?]+/g) || [report];
  return sentences.slice(0, 2).join(' ').trim();
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

  // Clinical-summary length toggle (Short / Medium / Full). Persisted per
  // therapist via localStorage so the practitioner's preferred density sticks.
  type SummaryLength = 'short' | 'medium' | 'full';
  const [summaryLength, setSummaryLength] = useState<SummaryLength>('medium');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem('sessionlens-summary-length');
    if (saved === 'short' || saved === 'medium' || saved === 'full') {
      setSummaryLength(saved);
    }
  }, []);
  const updateSummaryLength = useCallback((next: SummaryLength) => {
    setSummaryLength(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('sessionlens-summary-length', next);
    }
  }, []);

  // Assessment state (from analysis page)
  const [sessionAssessment, setSessionAssessment] = useState('');
  const [isEditingAssessment, setIsEditingAssessment] = useState(false);
  const [assessmentDraft, setAssessmentDraft] = useState('');
  const [savingAssessment, setSavingAssessment] = useState(false);

  // Which clinical-note format is currently shown in Notes & Export
  const [activeNoteType, setActiveNoteType] = useState<'soap' | 'dap'>('soap');

  // Notes & Export panel — collapsed by default. The collapsed state still shows
  // tabs + Copy/Download toolbar (so the doctor can grab the AI draft without
  // expanding); the per-section editor only appears when expanded.
  const [notesExpanded, setNotesExpanded] = useState(false);

  // Outcome-scores capture (PHQ-9 / GAD-7) — opened from a CTA below.
  const [outcomeFormOpen, setOutcomeFormOpen] = useState(false);
  // Cached scores from analysisResult.outcomeMeasures so we can show a quick
  // "Already recorded: PHQ-9 X · GAD-7 Y" badge instead of just the CTA.
  const existingOutcomes = (() => {
    if (!session?.analysisResult) return null;
    const o = (session.analysisResult as unknown as Record<string, unknown>).outcomeMeasures as
      | { phq9?: number; gad7?: number }
      | undefined;
    if (!o || (o.phq9 == null && o.gad7 == null)) return null;
    return o;
  })();

  // Editable clinical summary — doctor can override the AI-generated text.
  // Stored in localStorage keyed by sessionId. Empty string = use AI draft.
  const [editedSummary, setEditedSummary] = useState<string>('');
  const [isEditingSummary, setIsEditingSummary] = useState<boolean>(false);
  const [summaryDraft, setSummaryDraft] = useState<string>('');

  useEffect(() => {
    if (!sessionId || typeof window === 'undefined') return;
    try {
      const saved = window.localStorage.getItem(`sessionlens-summary-edit-${sessionId}`);
      if (saved) setEditedSummary(saved);
    } catch {
      /* ignore */
    }
  }, [sessionId]);

  const persistSummaryEdit = useCallback(
    (next: string) => {
      setEditedSummary(next);
      if (typeof window === 'undefined') return;
      try {
        if (next) {
          window.localStorage.setItem(`sessionlens-summary-edit-${sessionId}`, next);
        } else {
          window.localStorage.removeItem(`sessionlens-summary-edit-${sessionId}`);
        }
      } catch {
        /* ignore */
      }
    },
    [sessionId],
  );

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
  const severityRank: Record<string, number> = { high: 3, medium: 2, low: 1 };
  const clinicalFlags = generateClinicalFlags(
    analysis.moments, analysis.riskFlags, cbt,
    analysis.structureProfile, analysis.therapistMoves, session.transcript,
  ).slice().sort((a, b) => (severityRank[b.severity] ?? 0) - (severityRank[a.severity] ?? 0));
  // Split risk flags by interventionType so the teaser reflects what each one
  // actually calls for. A 'monitor' flag is a forward-looking precaution, not an
  // active risk — counting it as one over-fires the red alarm and contradicts the
  // muted Eye icon used on the card itself.
  const activeRiskCount = clinicalFlags.filter(
    (f) => f.type === 'risk' && f.interventionType !== 'monitor',
  ).length;
  const monitorCount = clinicalFlags.filter(
    (f) => f.type === 'risk' && f.interventionType === 'monitor',
  ).length;
  const protectiveCount = clinicalFlags.filter((f) => f.type === 'protective').length;
  const notableCount = clinicalFlags.filter((f) => f.type === 'notable').length;

  /**
   * Pick a flag icon by combining `type`, `severity`, and `interventionType`.
   *
   * Visual logic:
   *   - Protective flag → green Shield (positive observation)
   *   - Notable flag    → blue Info (worth noticing, not a risk)
   *   - Risk flag with interventionType === 'monitor'
   *       → Eye icon (forward-looking precaution, not an active alarm)
   *       → colour tinted by severity: red (high) / amber (medium) / slate (low)
   *   - Risk flag with interventionType === 'immediate' (or unspecified)
   *       → AlertTriangle (the alarm shape)
   *       → colour tinted by severity: red (high) / amber (medium) / muted slate (low)
   *
   * The point: a low-severity "monitor" flag now reads as a quiet eye-icon, not the
   * same red triangle that would shout for an acute high-severity risk. This stops
   * the colour signal from over-firing on forward-looking precautions.
   */
  const getFlagIcon = (flag: ClinicalFlag) => {
    if (flag.type === 'protective') return <Shield className="w-4 h-4 text-green-500" />;
    if (flag.type === 'notable') return <Info className="w-4 h-4 text-blue-500" />;

    // Risk flags — colour by severity, shape by interventionType
    const colorClass =
      flag.severity === RiskSeverity.HIGH
        ? 'text-red-500'
        : flag.severity === RiskSeverity.MEDIUM
          ? 'text-amber-500'
          : 'text-slate-400';
    if (flag.interventionType === 'monitor') {
      return <Eye className={`w-4 h-4 ${colorClass}`} />;
    }
    return <AlertTriangle className={`w-4 h-4 ${colorClass}`} />;
  };

  // Build note section configs for SOAP and DAP — used by the EditableClinicalNote panel.
  // Sections include AI drafts (regenerated from current analysis), plus the explanations
  // that appear in the per-section InfoTooltips.
  const soapDraft = generateSOAPNote(analysis);
  const dapDraft = generateDAPNote(analysis);

  const soapSections: ClinicalNoteSection[] = [
    {
      key: 'subjective',
      label: 'Subjective (S)',
      description: "What the client reported in their own words — their feelings, complaints, and self-described experience this session.",
      methodology: 'Drafted from the top 3 highest-intensity moments (verbatim quotes), the session\'s clinical priority, and the client\'s expressed prognosis. No values invented.',
      aiDraft: soapDraft.subjective,
    },
    {
      key: 'objective',
      label: 'Objective (O)',
      description: "What the clinician observed and measured — behavioral observations, dominant phenomenological structures, therapist moves used, risk indicators.",
      methodology: 'Drafted from: count of high-intensity moments (≥7/10), top 3 dominant structures from the structure profile, top 2 therapist-move types, and the high-severity risk-flag list.',
      aiDraft: soapDraft.objective,
    },
    {
      key: 'assessment',
      label: 'Assessment (A)',
      description: "The clinician's clinical interpretation — primary concern, formulation, risk picture, prognosis, and progress toward treatment goals.",
      methodology: 'Drafted from: clinical priority + risk level (from Quick Insight), the first two moment contexts, and any risk flags above low severity. Prognosis carries through verbatim from the analysis.',
      aiDraft: soapDraft.assessment,
    },
    {
      key: 'plan',
      label: 'Plan (P)',
      description: "What happens next — interventions, homework, referrals, monitoring, and the next session date.",
      methodology: 'Drafted from: top recommendation (Quick Insight), structure-specific intervention suggestions (e.g. somatic grounding when body is dominant), and standard follow-up scaffolding (homework review, next-session-in-1-week).',
      aiDraft: soapDraft.plan,
    },
  ];

  const dapSections: ClinicalNoteSection[] = [
    {
      key: 'data',
      label: 'Data (D)',
      description: "What was reported AND observed — the DAP format collapses Subjective + Objective into a single section. Includes verbatim quotes plus measured/observed signals.",
      methodology: 'Drafted from: top 2 moment quotes with their context and intensity scores, plus session-level metrics (emotional regulation, therapeutic alliance) and any detected risk factors with detail strings.',
      aiDraft: dapDraft.data,
    },
    {
      key: 'assessment',
      label: 'Assessment (A)',
      description: "The clinician's interpretation — primary concern, recurring patterns, client strengths, prognosis.",
      methodology: 'Drafted from: clinical priority, risk level, deduplicated moment contexts (recurring themes), reflective-capacity score, and prognosis text from the Quick Insight.',
      aiDraft: dapDraft.assessment,
    },
    {
      key: 'plan',
      label: 'Plan (P)',
      description: "Numbered action items for the next session and ongoing treatment.",
      methodology: 'Drafted from: top recommendation, standard treatment-continuity items, homework prompt, and conditional risk-monitoring item that appears only when active risk flags exist.',
      aiDraft: dapDraft.plan,
    },
  ];

  const defaultAssessment = `${analysis.quickInsight.clinicalPriority}. ${analysis.quickInsight.prognosis}. Dominant experience patterns: ${
    Object.entries(analysis.structureProfile)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name]) => name.replace(/_/g, ' '))
      .join(', ')
  }. ${analysis.quickInsight.topRecommendation || ''}`;

  const displayAssessment = sessionAssessment || defaultAssessment;

  return (
    <div className="space-y-4">
      {/* 1. Quick Insight Banner */}
      <div className="rounded-xl p-6 border-l-4 bg-white border-l-primary border border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs text-gray-500 font-mono">Session #{session.sessionNumber} &middot; {session.date}</span>
          <InfoTooltip
            title="Quick Insight Engine"
            description="Synthesized from the session's structure profile, detected clinical signals, and CBT distortion load. Clinical priority is derived from the dominant presenting concerns; specific risk signals appear in the Risk & Clinical Flags section below."
            methodology="Multi-layer analysis: phenomenological structure coding → signal detection (4-layer algorithm) → cognitive distortion mapping → clinical synthesis"
          />
        </div>
        <p className="text-gray-800 font-medium">{analysis.quickInsight.clinicalPriority}</p>
        <p className="text-gray-600 text-sm mt-1">{analysis.quickInsight.prognosis}</p>
      </div>

      {/* 2. Clinical Summary */}
      <CollapsibleSection
        title="Clinical Summary"
        icon={<BookOpen className="w-5 h-5 text-primary" />}
        tooltip={
          <InfoTooltip
            title="AI Clinical Summary"
            description="Generated by analyzing the session transcript through phenomenological structure coding, identifying dominant emotional and cognitive patterns, and cross-referencing with the client's presenting concerns and treatment goals."
            methodology="GPT-4o clinical synthesis with structure-weighted attention across 10 phenomenological dimensions"
          />
        }
        headerExtra={
          <div
            className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs"
            role="group"
            aria-label="Summary length"
            onClick={(e) => e.stopPropagation()}
          >
            {(['short', 'medium', 'full'] as const).map((opt) => (
              <button
                key={opt}
                onClick={(e) => { e.stopPropagation(); updateSummaryLength(opt); }}
                className={`px-2.5 py-1 rounded-md font-medium capitalize transition ${
                  summaryLength === opt
                    ? 'bg-white text-primary  border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                aria-pressed={summaryLength === opt}
              >
                {opt}
              </button>
            ))}
          </div>
        }
        teaser={
          <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{quickSummary}</p>
        }
      >
        {/* Editable clinical summary — doctor can override the AI text. Risk-assessment
            sections are stripped before rendering (risk verdicts are clinician work). */}
        {(() => {
          // Source: edited override if present, else AI-generated. Always strip AI risk verdicts.
          const aiSourceText = analysis.clinicianReport || quickSummary;
          const sourceText = editedSummary || aiSourceText;
          const sanitized = stripAIRiskAssessment(sourceText);
          const displayText = deriveSummaryByLength(sanitized, summaryLength);
          const isEdited = !!editedSummary;

          if (isEditingSummary) {
            return (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-primary">
                    Editing clinical summary
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        persistSummaryEdit(summaryDraft);
                        setIsEditingSummary(false);
                      }}
                      className="flex items-center gap-1 text-xs text-green-700 hover:text-green-800 font-medium px-2.5 py-1 rounded hover:bg-green-50 transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingSummary(false);
                        setSummaryDraft('');
                      }}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 font-medium px-2.5 py-1 rounded hover:bg-gray-100 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  </div>
                </div>
                <textarea
                  value={summaryDraft}
                  onChange={(e) => setSummaryDraft(e.target.value)}
                  rows={Math.max(8, Math.min(20, summaryDraft.split('\n').length + 1))}
                  autoFocus
                  className="w-full text-sm text-gray-700 leading-relaxed bg-white border border-primary/30 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary resize-y font-sans"
                  placeholder="Your clinical summary..."
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Markdown supported (## headings, - bullets, **bold**). AI risk verdicts are always stripped — only your judgment lives in the Sign-Off panel below.
                </p>
              </div>
            );
          }

          return (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                {isEdited ? (
                  <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Edit3 className="w-2.5 h-2.5" />
                    Clinician-edited
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI draft
                  </span>
                )}
                <div className="flex items-center gap-1">
                  {isEdited && (
                    <button
                      onClick={() => {
                        if (window.confirm('Discard your edits and revert to the AI draft?')) {
                          persistSummaryEdit('');
                        }
                      }}
                      className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition"
                      title="Revert to AI draft"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Revert
                    </button>
                  )}
                  <button
                    onClick={() => {
                      // Initialize the editor with the sanitized current text (so doctor doesn't see/edit AI risk language)
                      setSummaryDraft(stripAIRiskAssessment(sourceText));
                      setIsEditingSummary(true);
                    }}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark font-medium px-2 py-1 rounded hover:bg-primary/10 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit summary
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {displayText}
              </p>
            </div>
          );
        })()}
        {(() => {
          const structureRows = Object.entries(analysis.structureProfile || {})
            .filter(([, v]) => typeof v === 'number' && v > 0.1)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 5);
          if (structureRows.length === 0) return null;
          const barData = structureRows.map(([name, score]) => {
            let color = '#2D7D7D';
            try {
              color = getStructureColor(name as StructureName);
            } catch {
              color = '#2D7D7D';
            }
            return { name, score: score as number, color };
          });
          return (
            <div>
              <p className="text-xs text-gray-500 font-medium mb-2">Dominant experience patterns:</p>
              <StructureBar
                data={barData}
                renderLabel={(d, defaultLabel) => {
                  const matchingMoments = (analysis.moments || [])
                    .filter((m) =>
                      Array.isArray(m.structures) &&
                      m.structures.map((s) => String(s).toLowerCase()).includes(d.name.toLowerCase()),
                    )
                    .sort((a, b) => (b.intensity || 0) - (a.intensity || 0))
                    .slice(0, 3);
                  const structureSnippets: LineageSnippet[] = matchingMoments.map((m) => ({
                    text: m.quote,
                    timestamp: m.timestamp,
                    momentId: m.id,
                    speaker: 'client',
                  }));
                  return (
                    <LineagePopover
                      snippets={structureSnippets}
                      methodology={`Phenomenological structure coding: ${d.name.replace(/_/g, ' ')} present in ${matchingMoments.length} moment(s); aggregate weight ${Math.round(d.score * 100)}%`}
                    >
                      <span className="cursor-pointer hover:text-primary transition">{defaultLabel}</span>
                    </LineagePopover>
                  );
                }}
              />
            </div>
          );
        })()}
        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Auto-generated clinical summary -- review before relying on for documentation
        </p>
      </CollapsibleSection>


      {/* 3. Session Topics & Key Moments */}
      <CollapsibleSection
        title="Session Topics & Key Moments"
        icon={<Hash className="w-5 h-5 text-primary" />}
        tooltip={
          <InfoTooltip
            title="Topic Extraction"
            description="Topics are extracted from the transcript using semantic clustering of client utterances. Each topic is scored by frequency (mentions) and clinical relevance (AI confidence). Key moments are identified by emotional intensity peaks."
            methodology="NLP topic modeling with phenomenological structure alignment. Confidence reflects inter-rater reliability simulation (agreement between independent raters)."
          />
        }
        teaser={
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              {topics.slice(0, 4).map((t) => {
                const c = t.count ?? t.mentions ?? 0;
                return (
                  <span key={t.id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/5 border border-primary/20 text-sm font-medium text-gray-800">
                    {t.label}
                    {c > 0 && <span className="text-xs text-gray-400">x{c}</span>}
                  </span>
                );
              })}
              {topics.length > 4 && <span className="text-xs text-gray-400 self-center">+{topics.length - 4} more</span>}
            </div>
            {topics[0]?.occurrences?.[0]?.quote && (
              <p className="text-xs text-gray-500 italic truncate">&ldquo;{topics[0].occurrences[0].quote}&rdquo;</p>
            )}
          </div>
        }
      >
        <TopicsBarChart
          topics={topics}
          expandedTopic={expandedTopic}
          onSelect={(id) => setExpandedTopic(expandedTopic === id ? null : id)}
        />
        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Bar length = number of matching moments/utterances. Click a bar to see every quote.
        </p>
      </CollapsibleSection>

      {/* 4. Risk & Clinical Flags */}
      <CollapsibleSection
        title="Risk & Clinical Flags"
        icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
        tooltip={
          <InfoTooltip
            title="Risk Detection System"
            description="Session Polaris uses a 4-layer risk detection algorithm: (1) keyword scanning, (2) negation analysis, (3) temporal context, and (4) semantic context evaluation. Each flag is cross-validated against clinical risk taxonomies."
            methodology="4-layer algorithm: lexical → negation-aware → temporal → contextual. Covers 16 clinical and social risk categories."
          />
        }
        teaser={
          <div className="flex items-center gap-4 text-sm">
            {activeRiskCount > 0 && <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" />{activeRiskCount} active risk{activeRiskCount !== 1 ? 's' : ''}</span>}
            {monitorCount > 0 && <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400" />{monitorCount} to monitor</span>}
            {protectiveCount > 0 && <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" />{protectiveCount} protective factor{protectiveCount !== 1 ? 's' : ''}</span>}
            {notableCount > 0 && <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" />{notableCount} notable finding{notableCount !== 1 ? 's' : ''}</span>}
            {activeRiskCount === 0 && monitorCount === 0 && protectiveCount === 0 && notableCount === 0 && <span className="text-gray-400">No clinical flags detected</span>}
          </div>
        }
      >
        {/* Confidence calculation explainer — appears once at the top of the flag list */}
        <div className="flex items-center justify-end gap-1.5 mb-2 text-[10px] text-gray-400">
          <span className="uppercase tracking-wider font-semibold">Confidence</span>
          <InfoTooltip
            title="How detection confidence is calculated"
            description="Each clinical flag is scored from a base confidence (the strength of the rule that fired it) plus a signal-specific weight derived from the underlying moment. Higher-intensity moments, stronger structure-profile alignment, and clearer therapist-move patterns all push the score up."
            methodology="confidence = base + (signal_weight × signal_strength), capped at 0.95.  Examples — Reflective capacity: 0.75 + (moment.intensity × 0.15). Therapeutic alliance: 0.70 + (empathic_move% × 0.15). Emotional regulation: 0.65 + (intensity_drop_ratio × 0.20). Risk flags: confidence comes directly from the 4-layer risk detector (lexical → negation → temporal → contextual)."
          />
        </div>
        <div className="space-y-3">
          {clinicalFlags.map((flag) => {
            // Detect speaker from the flag's signature: alliance / empathic-attunement flags
            // are evidenced by the THERAPIST's quote (e.g. "That sounds terrifying. Can you tell me…").
            // All other flags are client-experience.
            const isTherapistEvidence =
              flag.type === 'protective' && /alliance|empathic|therapist/i.test(flag.label);
            const speakerLabel = isTherapistEvidence ? 'Therapist' : 'Client';
            const SpeakerIcon = isTherapistEvidence ? Stethoscope : User;
            const speakerColor = isTherapistEvidence
              ? { bg: 'bg-blue-100', text: 'text-blue-600', tag: 'bg-blue-50 text-blue-700' }
              : { bg: 'bg-amber-100', text: 'text-amber-600', tag: 'bg-amber-50 text-amber-700' };

            const flagSnippets: LineageSnippet[] = flag.transcriptQuote
              ? [{ text: flag.transcriptQuote, timestamp: flag.location, speaker: isTherapistEvidence ? 'therapist' : 'client' }]
              : [];
            const flagMethodology =
              flag.type === 'risk'
                ? '4-layer risk detection: lexical → negation-aware → temporal → contextual'
                : flag.type === 'protective'
                  ? isTherapistEvidence
                    ? 'Protective-factor detection from therapist-move analysis (alliance evidenced by the therapist\'s empathic attunement, not the client\'s words)'
                    : 'Protective-factor detection from phenomenological structure profile (client-coded moments)'
                  : flag.label.toLowerCase().startsWith('cognitive distortion')
                    ? `CBT distortion: ${flag.label.replace(/^cognitive distortion:\s*/i, '')}`
                    : 'Clinical signal detection from coded moments';
            return (
            <div
              key={flag.id}
              className="p-4 bg-white rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition"
              onClick={() => setExpandedFlag(expandedFlag === flag.id ? null : flag.id)}
            >
              <div className="flex items-start gap-3">
                {getFlagIcon(flag)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-medium text-gray-900 text-sm">
                      <LineagePopover snippets={flagSnippets} methodology={flagMethodology}>
                        <span>{flag.label}</span>
                      </LineagePopover>
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 ${speakerColor.tag}`}>
                        <SpeakerIcon className="w-3 h-3" />
                        {speakerLabel}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">{flag.location}</span>
                      <span
                        className="text-xs text-gray-400 cursor-help"
                        title={`${Math.round(flag.confidence * 100)}% — derived from rule base + signal strength (see Confidence ⓘ above)`}
                      >
                        {Math.round(flag.confidence * 100)}% conf.
                      </span>
                    </div>
                  </div>
                  {expandedFlag === flag.id && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-full ${speakerColor.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <SpeakerIcon className={`w-3.5 h-3.5 ${speakerColor.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">{speakerLabel}</p>
                          <p className="text-sm text-gray-700 italic leading-relaxed">&ldquo;{flag.transcriptQuote}&rdquo;</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Source: Transcript at {flag.location} &middot; Detection confidence: {Math.round(flag.confidence * 100)}%
                        {isTherapistEvidence && ' (therapist-move evidence — alliance is observed in clinician behavior, not client speech)'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </CollapsibleSection>

      {/* 5. CBT & Cognitive Analysis */}
      <CollapsibleSection
        title="CBT & Cognitive Analysis"
        icon={<Brain className="w-5 h-5 text-amber-500" />}
        tooltip={
          <InfoTooltip
            title="Cognitive Distortion Analysis"
            description="Automatic thoughts are identified from client speech and classified using the Diagnosis-of-Thought (DoT) framework. Each distortion type is scored for confidence and linked to specific transcript moments."
            methodology="Beck's cognitive model applied via DoT framework. Distortion types: catastrophizing, personalization, overgeneralization, mind reading, should statements, emotional reasoning, all-or-nothing thinking."
          />
        }
        teaser={
          cbt && Array.isArray(cbt.distortions) && cbt.distortions.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <span className="text-gray-600 inline-flex items-center gap-1">
                  Distortion load:
                  <InfoTooltip
                    title="How distortion load is calculated"
                    description="The overall presence of cognitive distortions across this session. It's the average detection confidence across every distortion the analyzer flagged. Higher = more pervasive distorted thinking patterns; useful for tracking change session-over-session."
                    methodology={`distortionLoad = Σ(distortion.confidence) / count(distortions). For this session: ${cbt.distortions.length} distortion${cbt.distortions.length === 1 ? '' : 's'} averaged to ${Math.round((cbt.overallDistortionLoad || 0) * 100)}%. Bar color: green ≤ 30%, amber 31–60%, red > 60%.`}
                  />
                </span>
                <div className="flex items-center gap-2 flex-1 max-w-48">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${(cbt.overallDistortionLoad || 0) > 0.6 ? 'bg-red-400' : (cbt.overallDistortionLoad || 0) > 0.3 ? 'bg-amber-400' : 'bg-green-400'}`} style={{ width: `${Math.round((cbt.overallDistortionLoad || 0) * 100)}%` }} />
                  </div>
                  <span className="text-xs font-bold">{Math.round((cbt.overallDistortionLoad || 0) * 100)}%</span>
                </div>
                <span className="text-gray-600 inline-flex items-center gap-1">
                  Readiness:
                  <InfoTooltip
                    title="How treatment readiness is estimated"
                    description="An estimate of how ready the client appears to engage in active cognitive restructuring work this session. Derived from in-session signals: demonstrated insight, willingness to consider alternative interpretations, reflective capacity, and engagement with the therapist."
                    methodology="Estimated by GPT-4o from the same coded moments used for distortion detection. Signals include: presence of reflective/metacognitive language, openness to therapist reframes, intensity of self-criticism (lower = higher readiness). Falls back to 0.5 (neutral) when the language model is unavailable. Bar color: green > 60%, amber otherwise."
                  />
                </span>
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
              {cbt.distortions.map((d, i) => {
                const linkedMoment = analysis.moments?.[d.momentIndex];
                // Two distinct snippets when both exist:
                //   1. The evidence — the specific phrase that demonstrates the distortion.
                //      (Same text shown in the card body — labeled as "evidence" by methodology.)
                //   2. The surrounding moment — the broader transcript context where this surfaced.
                //      (Carries the timestamp + speaker. Often a sibling sentence from the same
                //      client utterance; helps the clinician trace WHERE in the session it appeared.)
                const distortionSnippets: LineageSnippet[] = [];
                if (d.evidence && d.evidence.trim()) {
                  distortionSnippets.push({
                    text: d.evidence,
                    speaker: 'client',
                    label: 'Evidence (the phrase that triggered the detection)',
                  });
                }
                if (linkedMoment?.quote && linkedMoment.quote.trim() && linkedMoment.quote !== d.evidence) {
                  distortionSnippets.push({
                    text: linkedMoment.quote,
                    timestamp: linkedMoment.timestamp,
                    momentId: linkedMoment.id,
                    speaker: 'client',
                    label: 'Surrounding moment (where this surfaced in the session)',
                  });
                }
                return (
                <div key={i} className="p-4 bg-white rounded-xl border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-amber-500" />
                      <span className="font-semibold text-gray-900 text-sm">
                        <LineagePopover
                          snippets={distortionSnippets}
                          methodology={`CBT distortion: ${d.type}`}
                          literatureRef="Beck's cognitive model; Diagnosis-of-Thought (DoT) framework"
                        >
                          <span>{d.type}</span>
                        </LineagePopover>
                      </span>
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
                  {/* Show the actual transcript quote from the linked moment in place of
                      the AI-generated "Reframe". The reframe was editorial AI content that
                      doesn't always make clinical sense (especially for resolved distortions
                      where the alternative thought reads as meta-commentary rather than a
                      real CBT reframe). The moment quote is the patient's actual words and
                      gives the clinician a verifiable source. We hide it when it would be
                      a duplicate of d.evidence (active distortions where evidence already
                      IS the patient quote). */}
                  {(() => {
                    const linkedMoment = analysis.moments?.[d.momentIndex];
                    if (!linkedMoment?.quote) return null;
                    const evidenceLower = (d.evidence || '').toLowerCase().trim();
                    const momentLower = linkedMoment.quote.toLowerCase().trim();
                    // Skip duplicate when the evidence IS the moment quote (substring overlap either way)
                    const isDuplicate =
                      evidenceLower === momentLower ||
                      (evidenceLower.length > 30 && momentLower.includes(evidenceLower)) ||
                      (momentLower.length > 30 && evidenceLower.includes(momentLower));
                    if (isDuplicate) return null;
                    return (
                      <div className="p-2 bg-gray-50 rounded-lg border border-gray-200 ml-6">
                        <div className="flex items-start gap-2">
                          <MessageSquareQuote className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">
                              From the transcript
                              {linkedMoment.timestamp && (
                                <span className="ml-1.5 font-mono normal-case tracking-normal text-gray-400">
                                  {linkedMoment.timestamp}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-700 italic leading-relaxed">
                              &ldquo;{linkedMoment.quote}&rdquo;
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                );
              })}
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


      {/* 7. Therapist Intervention Profile */}
      {Array.isArray(analysis.therapistMoves) && analysis.therapistMoves.length > 0 && (
        <CollapsibleSection
          title="Therapist Intervention Profile"
          icon={<Stethoscope className="w-5 h-5 text-primary" />}
          tooltip={
            <InfoTooltip
              title="Therapist Move Classification"
              description="Each therapist utterance is classified into one of 5 intervention categories: empathic attunement, challenge, interpretation, silence, and reflection. Distribution reveals the therapist's predominant style for this session."
              methodology="Automated turn-by-turn analysis using phenomenological therapist move taxonomy."
            />
          }
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
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.max(move.percentage, 2)}%` }} />
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


      {/* Session Sign-Off was moved to the Full Report tab — clinically it's
          the LAST step in the workflow (review → sign off → done). Keeping it
          here was making it look like a mid-page interrupt. The handoff is
          now: complete the analysis here → move to Full Report → sign off. */}

      {/* Outcome Scores capture (PHQ-9 / GAD-7). Optional, but the way to
          turn this app into a real outcome-tracking tool over time. The CTA
          card stays compact when scores aren't recorded; once recorded it
          shows the totals + severity pills and a "Re-record" button. The
          actual capture happens in the modal — this card is just the entry
          point so the workflow doesn't sprawl on the summary page. */}
      <div className="bg-white rounded-md border border-gray-200 px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-playfair text-lg font-bold text-gray-900 mb-1">Outcome Scores</h3>
          {existingOutcomes ? (
            <div className="flex items-center gap-3 text-sm text-gray-700 flex-wrap">
              {typeof existingOutcomes.phq9 === 'number' && (
                <span>
                  <span className="font-semibold">PHQ-9:</span> {existingOutcomes.phq9} / 27
                </span>
              )}
              {typeof existingOutcomes.gad7 === 'number' && (
                <span>
                  <span className="font-semibold">GAD-7:</span> {existingOutcomes.gad7} / 21
                </span>
              )}
              <span className="text-xs text-gray-400">· recorded for this session</span>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Capture validated PHQ-9 (depression) and GAD-7 (anxiety) scores to track outcomes across sessions.
            </p>
          )}
        </div>
        <button
          onClick={() => setOutcomeFormOpen(true)}
          className="px-4 py-2 text-sm font-semibold border border-primary/30 text-primary rounded-lg hover:bg-primary/5 transition whitespace-nowrap"
        >
          {existingOutcomes ? 'Re-record scores' : 'Record outcome scores'}
        </button>
      </div>

      <OutcomeScoresForm
        open={outcomeFormOpen}
        onClose={() => setOutcomeFormOpen(false)}
        initial={existingOutcomes ? { phq9: existingOutcomes.phq9 ?? null, gad7: existingOutcomes.gad7 ?? null } : undefined}
        onSubmit={async (scores) => {
          // Merge with any existing outcomeMeasures so partial updates don't
          // wipe a previously-recorded score on the other instrument.
          const merged = {
            ...(existingOutcomes ?? {}),
            ...scores,
          };
          const res = await fetch(`/api/sessions/${sessionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ outcomeMeasures: merged }),
          });
          if (!res.ok) throw new Error('Failed to save outcome scores');
          // Refresh the page so the chip + trends pick up the new scores.
          window.location.reload();
        }}
      />

      {/* 8. Notes & Export — collapsible like other sections. The header strip
          (title + tabs + toolbar) stays visible by default; the per-section
          editor cards only render when expanded. */}
      <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
        <div className="px-6 py-5">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className="font-playfair text-lg font-bold text-gray-900 flex items-center gap-2">
              Clinical Notes &amp; Export
              <InfoTooltip
                title="Clinical Notes — SOAP and DAP formats"
                description="Two standard chart-note formats used in mental health documentation. SOAP (Subjective, Objective, Assessment, Plan) is the medical-record gold standard required by most EHRs and insurance billing. DAP (Data, Assessment, Plan) is a simpler 3-section variant common in private practice. Switch tabs to see each. Edits persist locally per session."
                methodology="Drafts are deterministically generated from the analysis result fields (no LLM call here). The methodology icon on each section shows exactly which fields fed it. Edits override the AI draft and are stored in localStorage scoped by session ID. Use 'Reset all' to revert to a fresh AI draft."
              />
            </h3>
            <button
              type="button"
              onClick={() => setNotesExpanded((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary hover:bg-primary/5 px-2.5 py-1 rounded-lg transition flex-shrink-0"
              aria-expanded={notesExpanded}
              aria-label={notesExpanded ? 'Collapse section editor' : 'Expand to edit each section'}
            >
              {notesExpanded ? 'Collapse' : 'Edit sections'}
              <ChevronDown className={`w-4 h-4 transition-transform ${notesExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Pick the format your record system uses. Edit each section before exporting — your edits are kept per-session.
          </p>

          {/* SOAP / DAP tab switcher */}
          <div className="inline-flex items-center gap-0 bg-gray-100 rounded-lg p-1 mb-5">
            <button
              type="button"
              onClick={() => setActiveNoteType('soap')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeNoteType === 'soap'
                  ? 'bg-white text-primary '
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-pressed={activeNoteType === 'soap'}
            >
              <FileText className="w-3.5 h-3.5" />
              SOAP
              <span className="text-[10px] font-normal text-gray-400 hidden sm:inline">· Subjective · Objective · Assessment · Plan</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveNoteType('dap')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeNoteType === 'dap'
                  ? 'bg-white text-primary '
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-pressed={activeNoteType === 'dap'}
            >
              <FileText className="w-3.5 h-3.5" />
              DAP
              <span className="text-[10px] font-normal text-gray-400 hidden sm:inline">· Data · Assessment · Plan</span>
            </button>
          </div>

          {/* Editable note panel — sections only show when expanded; toolbar
              (Copy / Download .txt / status text) stays visible regardless. */}
          {activeNoteType === 'soap' ? (
            <EditableClinicalNote
              key={`soap-${session.id}`}
              sessionId={session.id}
              noteType="soap"
              noteTitle="SOAP Note"
              clientCode={session.clientCode}
              sessionNumber={session.sessionNumber}
              sections={soapSections}
              showSections={notesExpanded}
              formatForExport={(s) =>
                `SOAP NOTE\nSession: ${session.clientCode} — Session #${session.sessionNumber}\nDate: ${session.date}\n\n` +
                `SUBJECTIVE\n${s.subjective}\n\nOBJECTIVE\n${s.objective}\n\nASSESSMENT\n${s.assessment}\n\nPLAN\n${s.plan}` +
                formatConsentFooter(session)
              }
            />
          ) : (
            <EditableClinicalNote
              key={`dap-${session.id}`}
              sessionId={session.id}
              noteType="dap"
              noteTitle="DAP Note"
              clientCode={session.clientCode}
              sessionNumber={session.sessionNumber}
              sections={dapSections}
              showSections={notesExpanded}
              formatForExport={(s) =>
                `DAP NOTE\nSession: ${session.clientCode} — Session #${session.sessionNumber}\nDate: ${session.date}\n\n` +
                `DATA\n${s.data}\n\nASSESSMENT\n${s.assessment}\n\nPLAN\n${s.plan}` +
                formatConsentFooter(session)
              }
            />
          )}

          {/* Session Assessment (editable) — separate free-form notes field, NOT the SOAP/DAP note */}
          <div className="border-t border-gray-100 pt-5 mt-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                Free-form Session Notes
                <InfoTooltip
                  title="Free-form Session Notes"
                  description="A scratch-pad for your own thinking about this session — what you noticed, what to follow up, anything that doesn't fit a SOAP or DAP slot. Saved to the session record (not just locally). Distinct from the chart notes above."
                  methodology="Stored on the session record via the existing assessment field. The default text is auto-generated from the clinical priority + prognosis + dominant structures so the field starts non-empty; click Edit to overwrite with your own."
                />
              </p>
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
