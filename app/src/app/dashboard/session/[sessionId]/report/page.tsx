'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useApi } from '@/hooks/use-api';
import type { AnalysisResult } from '@/types';
import { Card } from '@/components/ui/Card';
import { LineagePopover, type LineageSnippet } from '@/components/ui/LineagePopover';
import { SessionSignOff } from '@/components/notes/SessionSignOff';
import {
  FileText,
  Download,
  Printer,
  User,
  Stethoscope,
  Loader2,
  Mail,
  Pencil,
  Check,
  X,
  Copy,
  MessageCircle,
} from 'lucide-react';

interface SessionData {
  id: string;
  clientCode: string;
  clientName?: string;
  sessionNumber: number;
  transcript: string;
  treatmentGoals: string;
  date: string;
  time: string;
  status: string;
  analysisResult: AnalysisResult | null;
  createdAt: string;
}

// =============================================================
// Markdown rendering (clinician view)
// =============================================================

function renderInlineFormatting(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-gray-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function renderMarkdown(text: string): React.ReactNode[] {
  return text.split('\n').map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-3" />;
    if (trimmed.startsWith('### ')) {
      return (
        <h4
          key={i}
          className="text-base font-bold text-gray-800 mt-5 mb-2 flex items-center gap-2"
        >
          <span className="w-1 h-5 bg-primary/30 rounded-full" />
          {trimmed.slice(4)}
        </h4>
      );
    }
    if (trimmed.startsWith('## ')) {
      return (
        <h3
          key={i}
          className="text-lg font-bold text-gray-900 mt-6 mb-2 pb-2 border-b border-gray-100"
        >
          {trimmed.slice(3)}
        </h3>
      );
    }
    if (trimmed.startsWith('# ')) {
      return (
        <h2
          key={i}
          className="font-playfair text-xl font-bold text-gray-900 mt-6 mb-3"
        >
          {trimmed.slice(2)}
        </h2>
      );
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return (
        <li key={i} className="text-sm text-gray-700 leading-relaxed ml-4 list-disc">
          {renderInlineFormatting(trimmed.slice(2))}
        </li>
      );
    }
    if (/^\d+\.\s/.test(trimmed)) {
      return (
        <li key={i} className="text-sm text-gray-700 leading-relaxed ml-4 list-decimal">
          {renderInlineFormatting(trimmed.replace(/^\d+\.\s/, ''))}
        </li>
      );
    }
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      return (
        <p key={i} className="text-sm font-semibold text-gray-800 mt-2">
          {trimmed.slice(2, -2)}
        </p>
      );
    }
    return (
      <p key={i} className="text-sm text-gray-700 leading-relaxed">
        {renderInlineFormatting(trimmed)}
      </p>
    );
  });
}

// =============================================================
// Patient view template builder
// =============================================================

interface PatientLine {
  text: string;
  lineage: LineageSnippet[];
  source: string;
}

interface PatientTemplate {
  greeting: string;
  whatStoodOut: PatientLine[];
  yourStrengths: PatientLine[];
  worthReflecting: PatientLine[];
  nextSession: PatientLine[];
  closing: string;
}

function buildPatientTemplate(
  analysis: AnalysisResult | null,
  patientName: string,
  date: string,
): PatientTemplate {
  const greeting = `Hi ${patientName}, here's a recap from our session on ${date}.`;

  // What stood out — derived from highest-intensity moments
  const topMoments = (analysis?.moments ?? [])
    .slice()
    .sort((a, b) => (b.intensity ?? 0) - (a.intensity ?? 0))
    .slice(0, 3);

  const whatStoodOut: PatientLine[] = topMoments.map((m) => ({
    text: rephraseToYouVoice(m.quote),
    lineage: [
      {
        text: m.quote,
        momentId: m.id,
        timestamp: m.timestamp,
        speaker: 'client',
      },
    ],
    source: `Moment #${m.id} (intensity ${Math.round((m.intensity ?? 0) * 100)}%)`,
  }));

  // Your strengths — positive behavioral patterns + positive valence moments
  const positivePatterns = (analysis?.cbtAnalysis?.behavioralPatterns ?? []).filter((p) =>
    /strength|cope|resil|support|reach|connect|reflect|manage|aware|insight/i.test(p),
  );
  const positiveMoments = (analysis?.moments ?? [])
    .filter((m) => m.valence === 'positive')
    .slice(0, 2);

  const yourStrengths: PatientLine[] = [
    ...positivePatterns.slice(0, 2).map((p) => ({
      text: nonClinicalRephrase(p),
      lineage: [] as LineageSnippet[],
      source: 'CBT behavioral pattern',
    })),
    ...positiveMoments.map((m) => ({
      text: `You showed real strength when you said: "${m.quote.slice(0, 80)}${m.quote.length > 80 ? '...' : ''}"`,
      lineage: [
        {
          text: m.quote,
          momentId: m.id,
          timestamp: m.timestamp,
          speaker: 'client' as const,
        },
      ],
      source: `Positive moment #${m.id}`,
    })),
  ].slice(0, 3);

  // Worth reflecting on — dominant CBT distortion as a question
  const dominantDistortion = analysis?.cbtAnalysis?.distortions?.[0];
  const worthReflecting: PatientLine[] = [];
  if (dominantDistortion) {
    worthReflecting.push({
      text: distortionAsQuestion(dominantDistortion.type, dominantDistortion.alternativeThought),
      lineage: [
        {
          text: dominantDistortion.evidence,
          speaker: 'client',
        },
      ],
      source: `CBT distortion: ${dominantDistortion.type}`,
    });
  }
  const secondDistortion = analysis?.cbtAnalysis?.distortions?.[1];
  if (secondDistortion) {
    worthReflecting.push({
      text: distortionAsQuestion(secondDistortion.type, secondDistortion.alternativeThought),
      lineage: [{ text: secondDistortion.evidence, speaker: 'client' }],
      source: `CBT distortion: ${secondDistortion.type}`,
    });
  }

  // Before our next session — single concrete action
  const dominantStructure = analysis?.quickInsight?.clinicalPriority ?? '';
  const nextSession: PatientLine[] = [
    {
      text: suggestAction(dominantStructure, topMoments[0]?.quote ?? ''),
      lineage: topMoments[0]
        ? [{ text: topMoments[0].quote, momentId: topMoments[0].id, speaker: 'client' }]
        : [],
      source: 'Top moment + clinical priority',
    },
  ];

  const closing = 'Take care of yourself this week. I look forward to our next session.';

  return { greeting, whatStoodOut, yourStrengths, worthReflecting, nextSession, closing };
}

// Try to parse the seeded analysis.patientReport (markdown) into the template slots.
function parsePatientReport(report: string): Partial<PatientTemplate> | null {
  if (!report || !report.trim()) return null;
  const sections: Record<string, string[]> = {};
  let currentSection: string | null = null;

  for (const rawLine of report.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('## ')) {
      currentSection = line.slice(3).toLowerCase();
      sections[currentSection] = [];
    } else if (currentSection) {
      sections[currentSection].push(line);
    }
  }

  if (Object.keys(sections).length === 0) return null;

  const findSection = (...keywords: string[]): string[] | null => {
    for (const key of Object.keys(sections)) {
      if (keywords.some((k) => key.includes(k))) return sections[key];
    }
    return null;
  };

  const linesToBullets = (lines: string[]): PatientLine[] =>
    lines
      .filter((l) => l.startsWith('- ') || l.startsWith('* '))
      .map((l) => ({
        text: l.replace(/^[-*]\s+/, ''),
        lineage: [],
        source: 'Seeded patient report',
      }));

  const result: Partial<PatientTemplate> = {};
  const stoodOut = findSection('stood', 'highlight', 'noticed');
  if (stoodOut) result.whatStoodOut = linesToBullets(stoodOut);

  const strengths = findSection('strength', 'resilien');
  if (strengths) result.yourStrengths = linesToBullets(strengths);

  const reflecting = findSection('reflect', 'consider');
  if (reflecting) result.worthReflecting = linesToBullets(reflecting);

  const next = findSection('next', 'before', 'this week');
  if (next) result.nextSession = linesToBullets(next);

  return Object.keys(result).length > 0 ? result : null;
}

// =============================================================
// Phrasing helpers (static, no LLM)
// =============================================================

function rephraseToYouVoice(quote: string): string {
  // Light, deterministic rephrase: convert "I" to "you" framing.
  const trimmed = quote.replace(/[".]+$/g, '').slice(0, 140);
  if (/^i\s/i.test(trimmed)) {
    const verb = trimmed.replace(/^i\s/i, '').split(' ')[0];
    return `You spoke about ${verb === 'feel' || verb === 'felt' ? 'how you were feeling' : 'this'} — "${trimmed}"`;
  }
  return `Something that came up: "${trimmed}"`;
}

function nonClinicalRephrase(pattern: string): string {
  // Strip clinical jargon, capitalize first letter.
  const cleaned = pattern
    .replace(/\b(client|patient)\b/gi, 'you')
    .replace(/\b(demonstrates|exhibits|shows)\b/gi, 'show')
    .replace(/\b(behavioral|cognitive)\s+/gi, '')
    .replace(/\b(presenting|presents)\b/gi, '');
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).trim();
}

function distortionAsQuestion(type: string, alternative: string): string {
  const lower = type.toLowerCase();
  if (lower.includes('catastroph')) {
    return 'When the worst-case scenario shows up in your mind, what would it feel like to gently ask: "what else is also true?"';
  }
  if (lower.includes('all-or-nothing') || lower.includes('black')) {
    return 'Where in your week could you notice the middle ground — the parts that are not all good or all bad?';
  }
  if (lower.includes('mind') || lower.includes('reading')) {
    return 'What might happen if you checked one of those assumptions about what others are thinking?';
  }
  if (lower.includes('should') || lower.includes('must')) {
    return 'What would change if you swapped one "should" this week for "I could choose to"?';
  }
  if (alternative) {
    return `Worth sitting with: ${alternative}`;
  }
  return 'What is one thought from this week that might be worth questioning gently?';
}

function suggestAction(priority: string, anchor: string): string {
  const lower = (priority + ' ' + anchor).toLowerCase();
  if (/sleep|tired|fatigue|exhaust/.test(lower)) {
    return 'Try logging your sleep this week — bedtime, wake time, and how rested you feel out of 10.';
  }
  if (/anx|worry|panic/.test(lower)) {
    return 'When the worry shows up, try noticing where in your body it lives — no need to do anything, just notice.';
  }
  if (/relation|partner|family|friend/.test(lower)) {
    return 'Pick one relationship this week and notice one moment where you felt connected.';
  }
  if (/work|job|burnout/.test(lower)) {
    return 'Block one 20-minute window this week that is just yours — no work, no obligations.';
  }
  return 'Pick one moment each day this week and just pause for 30 seconds. No goal, just pause.';
}

// =============================================================
// Email / WhatsApp formatters (plain-text export)
// =============================================================

function templateToEmail(t: PatientTemplate): string {
  const parts: string[] = [t.greeting, ''];
  if (t.whatStoodOut.length) {
    parts.push('What stood out:');
    t.whatStoodOut.forEach((l) => parts.push(`- ${l.text}`));
    parts.push('');
  }
  if (t.yourStrengths.length) {
    parts.push('Your strengths:');
    t.yourStrengths.forEach((l) => parts.push(`- ${l.text}`));
    parts.push('');
  }
  if (t.worthReflecting.length) {
    parts.push('Worth reflecting on:');
    t.worthReflecting.forEach((l) => parts.push(`- ${l.text}`));
    parts.push('');
  }
  if (t.nextSession.length) {
    parts.push('Before our next session:');
    t.nextSession.forEach((l) => parts.push(`- ${l.text}`));
    parts.push('');
  }
  parts.push(t.closing);
  return parts.join('\n');
}

function templateToWhatsApp(t: PatientTemplate): string {
  const parts: string[] = [t.greeting, ''];
  const all = [
    ...t.whatStoodOut.map((l) => l.text),
    ...t.yourStrengths.map((l) => l.text),
  ];
  if (all.length) parts.push(all.join(' '));
  if (t.worthReflecting.length) {
    parts.push('');
    parts.push(t.worthReflecting.map((l) => l.text).join(' '));
  }
  if (t.nextSession.length) {
    parts.push('');
    parts.push(t.nextSession.map((l) => l.text).join(' '));
  }
  parts.push('');
  parts.push(t.closing);
  return parts.join('\n');
}

// =============================================================
// Main page
// =============================================================

export default function ReportPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { data, loading } = useApi<{ session: SessionData }>(`/api/sessions/${sessionId}`);
  const session = data?.session ?? null;

  const [activeView, setActiveView] = useState<'clinician' | 'patient'>('clinician');
  const [isEditing, setIsEditing] = useState(false);
  const [editedClinicianReport, setEditedClinicianReport] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState('');
  const [toast, setToast] = useState<{ title: string; detail?: string } | null>(null);

  // Patient-view editing — mirrors the clinician-view pattern. The edit buffer
  // is the email-formatted text (templateToEmail output). When saved, it's
  // stored as a plain string and renders in the Card as the doctor wrote it.
  // Doctor's edits override the AI-generated template for copy/download/send.
  const [editingPatient, setEditingPatient] = useState(false);
  const [editedPatientEmail, setEditedPatientEmail] = useState<string | null>(null);
  const [patientEditBuffer, setPatientEditBuffer] = useState('');

  // Persist patient edits to localStorage scoped by session
  const patientStorageKey = sessionId ? `sessionlens-patient-edit-${sessionId}` : '';
  useEffect(() => {
    if (!patientStorageKey || typeof window === 'undefined') return;
    try {
      const saved = window.localStorage.getItem(patientStorageKey);
      if (saved) setEditedPatientEmail(saved);
    } catch {
      /* ignore */
    }
  }, [patientStorageKey]);

  const persistPatientEdit = useCallback(
    (next: string | null) => {
      setEditedPatientEmail(next);
      if (typeof window === 'undefined' || !patientStorageKey) return;
      try {
        if (next) {
          window.localStorage.setItem(patientStorageKey, next);
        } else {
          window.localStorage.removeItem(patientStorageKey);
        }
      } catch {
        /* ignore */
      }
    },
    [patientStorageKey],
  );

  const analysis = session?.analysisResult as AnalysisResult | null;
  const clinicianReport = editedClinicianReport ?? analysis?.clinicianReport ?? '';

  const patientName = useMemo(() => {
    if (session?.clientName) return session.clientName;
    // Avoid awkward "Hi SL-2026-0001"
    return 'there';
  }, [session]);

  const patientTemplate = useMemo<PatientTemplate>(() => {
    const fallback = buildPatientTemplate(analysis, patientName, session?.date ?? '');
    const parsed = parsePatientReport(analysis?.patientReport ?? '');
    if (!parsed) return fallback;
    return {
      greeting: fallback.greeting,
      whatStoodOut: parsed.whatStoodOut?.length ? parsed.whatStoodOut : fallback.whatStoodOut,
      yourStrengths: parsed.yourStrengths?.length ? parsed.yourStrengths : fallback.yourStrengths,
      worthReflecting: parsed.worthReflecting?.length
        ? parsed.worthReflecting
        : fallback.worthReflecting,
      nextSession: parsed.nextSession?.length ? parsed.nextSession : fallback.nextSession,
      closing: fallback.closing,
    };
  }, [analysis, patientName, session?.date]);

  const showToast = useCallback((title: string, detail?: string) => {
    setToast({ title, detail });
    setTimeout(() => setToast(null), 2500);
  }, []);

  // Resolved patient-email text — doctor's edit if present, else AI-generated template.
  // This is the single source of truth for copy/download/send actions.
  const resolvedPatientEmail = useMemo(
    () => editedPatientEmail ?? templateToEmail(patientTemplate),
    [editedPatientEmail, patientTemplate],
  );

  /**
   * Print → Save as PDF.
   *
   * We deliberately use the browser's built-in print pipeline instead of
   * jspdf or puppeteer:
   *   - zero new bundle weight (every browser already has print)
   *   - zero layout drift between screen and PDF
   *   - clinicians get the standard "Save as PDF" affordance they know
   *
   * The print stylesheet (in globals.css under @media print) hides nav/
   * actions and pages-breaks the report cleanly.
   */
  const handlePrintPDF = useCallback(() => {
    // Add a body class so the print stylesheet knows to apply the report-
    // specific layout. Removed in `afterprint`.
    if (typeof document !== 'undefined') {
      document.body.classList.add('printing-report');
      const cleanup = () => {
        document.body.classList.remove('printing-report');
        window.removeEventListener('afterprint', cleanup);
      };
      window.addEventListener('afterprint', cleanup);
      window.print();
    }
  }, []);

  const handleDownload = useCallback(() => {
    if (!session) return;
    const text =
      activeView === 'clinician'
        ? `CLINICIAN REPORT\nSession: ${session.clientCode} - Session #${session.sessionNumber}\nDate: ${session.date}\n\n${clinicianReport}`
        : resolvedPatientEmail;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.clientCode}-session${session.sessionNumber}-${activeView}-report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [session, activeView, clinicianReport, resolvedPatientEmail]);

  const handleStartEdit = () => {
    setEditBuffer(clinicianReport);
    setIsEditing(true);
  };
  const handleSaveEdit = () => {
    setEditedClinicianReport(editBuffer);
    setIsEditing(false);
  };
  const handleCancelEdit = () => {
    setEditBuffer('');
    setIsEditing(false);
  };
  const handleSendEmail = () => {
    showToast('Coming Soon', 'Email delivery will be available in the next release');
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(resolvedPatientEmail);
      showToast('Copied as email', editedPatientEmail ? 'Your edited version' : 'AI-generated draft');
    } catch {
      showToast('Could not copy', 'Clipboard access blocked');
    }
  };

  const handleCopyWhatsApp = async () => {
    try {
      // For WhatsApp: when edited, ship the edited text as-is (doctor knows what they wrote).
      // When unedited, use the WhatsApp-formatted template (shorter, conversational).
      const text = editedPatientEmail ?? templateToWhatsApp(patientTemplate);
      await navigator.clipboard.writeText(text);
      showToast('Copied for WhatsApp', editedPatientEmail ? 'Your edited version' : 'Conversational format');
    } catch {
      showToast('Could not copy', 'Clipboard access blocked');
    }
  };

  // Patient-view edit handlers
  const handleStartPatientEdit = () => {
    setPatientEditBuffer(resolvedPatientEmail);
    setEditingPatient(true);
  };
  const handleSavePatientEdit = () => {
    persistPatientEdit(patientEditBuffer);
    setEditingPatient(false);
    showToast('Patient view saved', 'Your edited version will be used for copy/download/send');
  };
  const handleCancelPatientEdit = () => {
    setPatientEditBuffer('');
    setEditingPatient(false);
  };
  const handleResetPatientEdit = () => {
    if (!window.confirm('Discard your edits and revert the patient view to the AI-generated draft?')) return;
    persistPatientEdit(null);
    setEditingPatient(false);
    showToast('Reverted to AI draft', 'Patient view now reflects the latest AI output');
  };

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
        <Link
          href="/dashboard/session/new"
          className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition"
        >
          Create New Session
        </Link>
      </Card>
    );
  }

  const hasReports = Boolean(clinicianReport || analysis?.patientReport || analysis?.moments?.length);

  if (!hasReports) {
    return (
      <Card className="p-8 text-center">
        <FileText className="w-10 h-10 text-gray-300 mx-auto mb-4" />
        <h3 className="font-playfair text-2xl font-bold text-gray-900 mb-2">
          Reports Not Available
        </h3>
        <p className="text-gray-600">
          Reports not available for this session. The session may not have been analyzed yet.
        </p>
      </Card>
    );
  }

  return (
    // id="report-print-area" — the print stylesheet (globals.css under
    // body.printing-report) only shows this subtree, so the PDF/print output
    // is just the report content, not the dashboard chrome.
    <div id="report-print-area" className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-playfair text-2xl font-bold text-gray-900">Full Report</h2>
          <p className="text-sm text-gray-500 mt-1">
            {session.clientCode} &middot; Session #{session.sessionNumber} &middot; {session.date}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap" data-no-print>
          {activeView === 'patient' && (
            <>
              <button
                onClick={handleCopyEmail}
                className="flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 transition"
              >
                <Copy className="w-4 h-4" />
                Copy as email
              </button>
              <button
                onClick={handleCopyWhatsApp}
                className="flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 transition"
              >
                <MessageCircle className="w-4 h-4" />
                Copy as WhatsApp
              </button>
            </>
          )}
          <button
            onClick={handleSendEmail}
            className="flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 transition"
          >
            <Mail className="w-4 h-4" />
            Send via Email
          </button>
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 transition"
            title="Opens the print dialog — choose 'Save as PDF' as the destination."
          >
            <Printer className="w-4 h-4" />
            Save as PDF
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition"
          >
            <Download className="w-4 h-4" />
            Download as Text
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 bg-white border border-gray-200 rounded-xl animate-in slide-in-from-top duration-300">
          <Check className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-gray-900">{toast.title}</p>
            {toast.detail && <p className="text-xs text-gray-500">{toast.detail}</p>}
          </div>
        </div>
      )}

      {/* View Toggle + Edit (clinician only) */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-0 bg-gray-100 rounded-xl p-1 w-fit">
          <button
            onClick={() => {
              if (isEditing) handleCancelEdit();
              if (editingPatient) handleCancelPatientEdit();
              setActiveView('clinician');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium  ${
              activeView === 'clinician'
                ? 'bg-white text-primary '
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            Clinician View
          </button>
          <button
            onClick={() => {
              if (isEditing) handleCancelEdit();
              if (editingPatient) handleCancelPatientEdit();
              setActiveView('patient');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium  ${
              activeView === 'patient'
                ? 'bg-white text-primary '
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="w-4 h-4" />
            Patient View
          </button>
        </div>

        {activeView === 'clinician' && (
          !isEditing ? (
            <button
              onClick={handleStartEdit}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg transition"
            >
              <Pencil className="w-4 h-4" />
              Edit Report
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg transition"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition"
              >
                <Check className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          )
        )}

        {activeView === 'patient' && (
          !editingPatient ? (
            <div className="flex items-center gap-2">
              {editedPatientEmail && (
                <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <Pencil className="w-2.5 h-2.5" />
                  Edited
                </span>
              )}
              {editedPatientEmail && (
                <button
                  onClick={handleResetPatientEdit}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  title="Revert to AI-generated draft"
                >
                  <X className="w-3.5 h-3.5" />
                  Reset to AI draft
                </button>
              )}
              <button
                onClick={handleStartPatientEdit}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg transition"
              >
                <Pencil className="w-4 h-4" />
                Edit before sending
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelPatientEdit}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg transition"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSavePatientEdit}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition"
              >
                <Check className="w-4 h-4" />
                Save patient view
              </button>
            </div>
          )
        )}
      </div>

      {/* Content */}
      <Card className="p-6 sm:p-8 lg:p-10">
        {activeView === 'clinician' ? (
          isEditing ? (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Pencil className="w-4 h-4 text-gray-400" />
                <p className="text-xs text-gray-500 font-medium">
                  Editing Clinician Report &mdash; Use markdown (## Header, - bullet, **bold**)
                </p>
              </div>
              <textarea
                value={editBuffer}
                onChange={(e) => setEditBuffer(e.target.value)}
                className="w-full min-h-[500px] p-5 text-sm text-gray-700 font-mono leading-relaxed bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
                spellCheck
              />
            </div>
          ) : clinicianReport ? (
            <div className="prose-sm max-w-none">{renderMarkdown(clinicianReport)}</div>
          ) : (
            <div className="text-center py-10">
              <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Clinician report not available.</p>
            </div>
          )
        ) : editingPatient ? (
          // Edit mode — full email-formatted text in a textarea so the doctor
          // can fine-tune greeting, bullets, prompts, closing as one unit.
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Pencil className="w-4 h-4 text-gray-400" />
              <p className="text-xs text-gray-500 font-medium">
                Editing patient view &mdash; what you write here is exactly what gets copied / sent
              </p>
            </div>
            <textarea
              value={patientEditBuffer}
              onChange={(e) => setPatientEditBuffer(e.target.value)}
              className="w-full min-h-[500px] p-5 text-sm text-gray-700 leading-relaxed bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
              spellCheck
              autoFocus
            />
            <p className="text-[11px] text-gray-400 mt-2">
              Plain text. Section headers and bullet symbols are kept literally — write the email exactly as you want it received.
            </p>
          </div>
        ) : editedPatientEmail ? (
          // Saved-edit mode — render the doctor's edited text as plain paragraphs.
          // Lineage popovers aren't shown here (the doctor authored this directly;
          // there's no need to trace back to AI source for a clinician-written email).
          <div className="max-w-2xl">
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
              {editedPatientEmail}
            </pre>
          </div>
        ) : (
          // Default — AI-generated structured PatientView with lineage popovers
          <PatientView template={patientTemplate} />
        )}
      </Card>

      {/* Session Sign-Off — moved here from the Summary tab. Sign-off is the
          LAST step in the workflow: review the analysis on Summary → review
          and (optionally) edit the report drafts above → sign off below. */}
      <SessionSignOff
        sessionId={session.id}
        doctorName="Dr. Sarah Mitchell"
        aiSnapshot={{
          riskFlagCount: Array.isArray(analysis?.riskFlags) ? analysis!.riskFlags.length : 0,
          highSeverityFlagCount: Array.isArray(analysis?.riskFlags)
            ? analysis!.riskFlags.filter((f) => f.severity === 'high').length
            : 0,
          distortionLoad: analysis?.cbtAnalysis?.overallDistortionLoad,
          suggestedPriority: analysis?.quickInsight?.clinicalPriority,
        }}
      />
    </div>
  );
}

// =============================================================
// Patient view component
// =============================================================

function PatientView({ template }: { template: PatientTemplate }) {
  return (
    <div className="space-y-6 max-w-2xl">
      <p className="text-base text-gray-800 leading-relaxed">{template.greeting}</p>

      {template.whatStoodOut.length > 0 && (
        <Section title="What stood out" lines={template.whatStoodOut} />
      )}
      {template.yourStrengths.length > 0 && (
        <Section title="Your strengths" lines={template.yourStrengths} />
      )}
      {template.worthReflecting.length > 0 && (
        <Section title="Worth reflecting on" lines={template.worthReflecting} />
      )}
      {template.nextSession.length > 0 && (
        <Section title="Before our next session" lines={template.nextSession} />
      )}

      <p className="text-base text-gray-800 leading-relaxed pt-2 border-t border-gray-100">
        {template.closing}
      </p>

      <p className="text-[11px] text-gray-400 italic pt-1">
        Source-lineage icons appear next to each line for the practitioner&apos;s reference and are
        stripped from the exported version.
      </p>
    </div>
  );
}

function Section({ title, lines }: { title: string; lines: PatientLine[] }) {
  return (
    <div>
      <h3 className="font-playfair text-lg font-bold text-primary mb-3">{title}</h3>
      <ul className="space-y-2.5">
        {lines.map((line, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed">
            <span className="text-primary mt-1.5 flex-shrink-0">&bull;</span>
            <LineagePopover snippets={line.lineage} methodology={line.source}>
              <span>{line.text}</span>
            </LineagePopover>
          </li>
        ))}
      </ul>
    </div>
  );
}
