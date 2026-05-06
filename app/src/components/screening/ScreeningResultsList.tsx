'use client';

/**
 * Therapist-side screening results panel for the client profile and the
 * start-session screen.
 *
 * Shows one row per screening assignment with score + severity badge,
 * expandable to a per-item heatmap. Sentinel flags (suicide_ideation_endorsed,
 * cssrs_high_risk, etc.) surface as a top-of-card red callout so the
 * clinician doesn't miss them.
 *
 * Voice intake playback isn't wired yet — will land once we hook the
 * journal audio bucket. For now the text-only intake renders verbatim.
 */

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock,
  Loader2,
  MessageSquare,
} from 'lucide-react';

interface ScaleOption { value: number; label: string; short?: string }

interface ScreeningItem {
  id: string;
  text: string;
  scale: ScaleOption[];
  sentinel?: string | null;
  reverseScored?: boolean;
  conditional?: { showIfItemId: string; minValue: number };
  value: number | null;
}

interface SeverityBand {
  min: number;
  max: number;
  label: string;
  severity: string;
  guidance?: string;
}

interface Subscale {
  id: string;
  name: string;
  bands: SeverityBand[];
}

interface Assignment {
  assignmentId: string;
  instrumentId: string;
  instrumentName: string;
  instrumentFullName: string;
  category: string | null;
  required: boolean;
  assignedAt: string;
  completedAt: string | null;
  totalScore: number | null;
  subscaleScores: Record<string, number> | null;
  severity: string | null;
  flags: string[];
  items: ScreeningItem[];
  bands: SeverityBand[];
  perSubscale: Subscale[];
}

interface IntakeNote {
  textContent: string | null;
  audioStoragePath: string | null;
  audioTranscript: string | null;
  audioDurationSeconds: number | null;
  createdAt: string;
}

interface ApiResponse {
  assignments: Assignment[];
  intake: IntakeNote | null;
}

const SENTINEL_FLAGS = new Set([
  'suicide_ideation_endorsed',
  'phq9_q9_positive',
  'cssrs_lifetime_behavior',
  'cssrs_intent_or_plan',
  'cssrs_high_risk',
  'cssrs_method_endorsed',
  'core10_item6_positive',
  'suicide_plan_endorsed',
]);

export function ScreeningResultsList({ clientCode }: { clientCode: string }) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientCode) return;
    const ac = new AbortController();
    fetch(`/api/clients/${encodeURIComponent(clientCode)}/screenings`, {
      signal: ac.signal,
      cache: 'no-store',
    })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
        setData(body);
      })
      .catch((e) => { if (e.name !== 'AbortError') setError(e.message); })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [clientCode]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-md p-6 flex items-center gap-3 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading screenings…
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-md p-4 text-sm text-red-700">
        Failed to load screenings: {error}
      </div>
    );
  }
  if (!data || (data.assignments.length === 0 && !data.intake)) {
    return (
      <div className="bg-white border border-gray-200 border-dashed rounded-md p-6 text-center">
        <ClipboardList className="w-6 h-6 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">
          No pre-session screenings on file.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Send a screening invitation when you create or open the client.
        </p>
      </div>
    );
  }

  const sentinelFlags = data.assignments.flatMap((a) => a.flags).filter((f) => SENTINEL_FLAGS.has(f));
  const hasSentinel = sentinelFlags.length > 0;

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="font-playfair text-xl font-semibold text-gray-900 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          Pre-session screening
        </h2>
      </header>

      {hasSentinel && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-900">Safety flag in screening responses.</p>
            <p className="text-sm text-red-800 mt-1">
              The patient endorsed an item that warrants direct clinical follow-up. Review the C-SSRS / PHQ-9 q9 / CORE-10 q6 results below before the session.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {data.assignments.map((a) => (
          <AssignmentRow key={a.assignmentId} assignment={a} />
        ))}
      </div>

      {data.intake && (data.intake.textContent || data.intake.audioTranscript) && (
        <IntakeNoteCard intake={data.intake} />
      )}
    </section>
  );
}

function AssignmentRow({ assignment }: { assignment: Assignment }) {
  const [expanded, setExpanded] = useState(false);

  const completed = assignment.completedAt !== null;

  return (
    <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-gray-900">{assignment.instrumentName}</span>
            <span className="text-xs text-gray-500">·</span>
            <span className="text-xs text-gray-500">{assignment.instrumentFullName}</span>
            {assignment.required ? (
              <span className="text-[10px] uppercase tracking-wider font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">Required</span>
            ) : (
              <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Optional</span>
            )}
          </div>
          {completed ? (
            <div className="flex items-center gap-3 flex-wrap">
              <SeverityBadge severity={assignment.severity} score={assignment.totalScore} />
              <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Completed {formatDate(assignment.completedAt!)}
              </span>
              {assignment.flags.some((f) => SENTINEL_FLAGS.has(f)) && (
                <span className="text-xs text-red-700 inline-flex items-center gap-1 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Safety flag
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-500 inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Pending — patient hasn't completed yet
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </button>

      {expanded && completed && (
        <div className="border-t border-gray-100 p-4 bg-gray-50/40 space-y-4">
          {assignment.subscaleScores && assignment.perSubscale.length > 0 && (
            <SubscaleBlock assignment={assignment} />
          )}
          <ItemHeatmap items={assignment.items} />
        </div>
      )}
      {expanded && !completed && (
        <div className="border-t border-gray-100 p-4 bg-gray-50/40 text-sm text-gray-500">
          Results will show here once the patient submits.
        </div>
      )}
    </div>
  );
}

function SubscaleBlock({ assignment }: { assignment: Assignment }) {
  if (!assignment.subscaleScores) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {assignment.perSubscale.map((s) => {
        const score = assignment.subscaleScores?.[s.id];
        if (score === undefined) return null;
        const band = s.bands.find((b) => score >= b.min && score <= b.max);
        return (
          <div key={s.id} className="bg-white rounded-md border border-gray-200 p-3">
            <p className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-1">{s.name}</p>
            <p className="font-mono text-xl text-gray-900">{score}</p>
            {band && (
              <p className={`text-xs font-medium mt-1 ${severityClasses(band.severity).text}`}>
                {band.label}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ItemHeatmap({ items }: { items: ScreeningItem[] }) {
  return (
    <div className="space-y-1.5">
      {items.map((it, idx) => {
        const max = Math.max(...it.scale.map((o) => o.value), 1);
        const v = it.value;
        const colorClass = itemColor(v, max, !!it.sentinel);
        return (
          <div key={it.id} className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-7 h-7 rounded-md text-xs font-mono font-semibold inline-flex items-center justify-center ${colorClass}`}>
              {v ?? '—'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 leading-tight">
                <span className="text-gray-400 font-mono mr-1.5">{idx + 1}.</span>
                {it.text}
              </p>
              {v !== null && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {it.scale.find((o) => o.value === v)?.label ?? `value ${v}`}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SeverityBadge({ severity, score }: { severity: string | null; score: number | null }) {
  const cls = severityClasses(severity);
  return (
    <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-semibold ${cls.bg} ${cls.text} ${cls.border ?? ''}`}>
      {score !== null && <span className="font-mono">{score}</span>}
      <span>{prettySeverity(severity)}</span>
    </span>
  );
}

function IntakeNoteCard({ intake }: { intake: IntakeNote }) {
  return (
    <div className="bg-white border border-gray-200 rounded-md p-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-gray-900 text-sm">In their own words</h3>
        <span className="text-xs text-gray-500 ml-auto">{formatDate(intake.createdAt)}</span>
      </div>
      {intake.textContent && (
        <blockquote className="text-sm text-gray-700 leading-relaxed border-l-2 border-primary/30 pl-3 whitespace-pre-wrap">
          {intake.textContent}
        </blockquote>
      )}
      {intake.audioTranscript && !intake.textContent && (
        <blockquote className="text-sm text-gray-700 leading-relaxed border-l-2 border-primary/30 pl-3 italic">
          {intake.audioTranscript}
        </blockquote>
      )}
    </div>
  );
}

function severityClasses(severity: string | null): { bg: string; text: string; border?: string } {
  switch (severity) {
    case 'minimal':
    case 'no_clinical':
    case 'healthy':
    case 'negative_screen':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border border-emerald-200' };
    case 'mild':
    case 'subthreshold':
    case 'low_risk':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border border-amber-200' };
    case 'moderate':
    case 'positive_screen':
    case 'moderate_risk':
      return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border border-orange-200' };
    case 'moderately_severe':
    case 'severe':
    case 'high_risk':
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border border-red-200' };
    case 'extremely_severe':
    case 'very_high_risk':
      return { bg: 'bg-red-100', text: 'text-red-800', border: 'border border-red-300' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700' };
  }
}

function prettySeverity(s: string | null): string {
  if (!s) return 'Pending';
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function itemColor(value: number | null, max: number, sentinel: boolean): string {
  if (value === null) return 'bg-gray-100 text-gray-400 border border-gray-200';
  const ratio = value / max;
  // Sentinel items (PHQ-9 q9, CORE-10 q6) ALWAYS go red on any positive endorsement.
  if (sentinel && value >= 1) return 'bg-red-100 text-red-800 border border-red-200';
  if (ratio >= 0.75) return 'bg-red-100 text-red-700 border border-red-200';
  if (ratio >= 0.5) return 'bg-orange-100 text-orange-700 border border-orange-200';
  if (ratio >= 0.25) return 'bg-amber-100 text-amber-700 border border-amber-200';
  return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
