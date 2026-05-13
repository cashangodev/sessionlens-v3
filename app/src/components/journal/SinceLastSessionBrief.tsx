'use client';

import { useEffect, useState } from 'react';
import {
  BookOpen,
  AlertTriangle,
  Loader2,
  Quote,
  Tag,
  TrendingUp,
} from 'lucide-react';

interface BriefResponse {
  clientCode: string;
  count: number;
  since: string | null;
  lastSessionDate: string | null;
  timeline: { date: string; count: number }[];
  moodTrend: { date: string; mood: number }[];
  tagCounts: Record<string, number>;
  recentQuotes: { id: string; text: string; createdAt: string }[];
  flagged: { id: string; text: string | null; reason: string | null; createdAt: string }[];
}

interface Props {
  clientCode: string;
}

/**
 * Pre-session brief panel.
 *
 * Surfaces the patient's between-session journal entries to the doctor
 * before they hit Record. Renders a compact summary:
 *   - count + window
 *   - flagged-for-review chips (passive crisis-keyword sweep)
 *   - top trigger tags
 *   - mood trend if any quick-logs exist
 *   - up to 5 verbatim quotes from text/voice entries
 *
 * Hidden entirely (returns null) when there are zero entries — the doctor
 * shouldn't see an empty card adding noise to the review step.
 */
export function SinceLastSessionBrief({ clientCode }: Props) {
  const [data, setData] = useState<BriefResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/journal/brief?clientCode=${encodeURIComponent(clientCode)}`, {
          cache: 'no-store',
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const body = (await res.json()) as BriefResponse;
        if (!cancelled) setData(body);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (clientCode) load();
    return () => {
      cancelled = true;
    };
  }, [clientCode]);

  if (loading) {
    return (
      <div className="bg-white rounded-md border border-gray-200 p-5 mb-6 flex items-center gap-3 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
        Loading between-session journal…
      </div>
    );
  }

  if (error || !data) return null;
  if (data.count === 0) return null;

  const tagsSorted = Object.entries(data.tagCounts).sort((a, b) => b[1] - a[1]);
  const sinceLabel = data.lastSessionDate
    ? `since session on ${formatDate(data.lastSessionDate)}`
    : 'logged before first session';

  return (
    <div className="bg-white rounded-md border border-gray-200 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-gray-900">
            Since last session
          </h3>
          <span className="text-xs text-gray-500">{sinceLabel}</span>
        </div>
        <span className="text-xs text-gray-700 bg-gray-100 rounded-full px-2.5 py-0.5 font-medium">
          {data.count} {data.count === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {data.flagged.length > 0 && (
        <div className="mb-4 rounded-md border border-error/30 bg-error/5 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-error mb-1">
            <AlertTriangle className="w-4 h-4" strokeWidth={1.5} />
            {data.flagged.length} flagged for review before session
          </div>
          <ul className="text-xs text-gray-700 space-y-1 ml-6 list-disc">
            {data.flagged.map((f) => (
              <li key={f.id}>
                <span className="text-gray-500">{formatDateTime(f.createdAt)}</span>
                {f.text && (
                  <>
                    {' — '}
                    <span className="italic">&ldquo;{truncate(f.text, 100)}&rdquo;</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {tagsSorted.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-gray-500 mb-2">
              <Tag className="w-3 h-3" strokeWidth={1.5} />
              Top triggers
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tagsSorted.slice(0, 8).map(([tag, count]) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 bg-mint-50 border border-mint-200 text-gray-800 rounded-full"
                >
                  {tag} <span className="text-gray-500">×{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {data.moodTrend.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-gray-500 mb-2">
              <TrendingUp className="w-3 h-3" strokeWidth={1.5} />
              Mood trend
            </div>
            <MoodSparkline points={data.moodTrend} />
          </div>
        )}
      </div>

      {data.recentQuotes.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-gray-500 mb-2">
            <Quote className="w-3 h-3" strokeWidth={1.5} />
            In the patient&apos;s words
          </div>
          <ul className="space-y-2">
            {data.recentQuotes.map((q) => (
              <li
                key={q.id}
                className="text-sm text-gray-800 border-l-2 border-primary/40 pl-3 py-0.5"
              >
                <p className="italic">&ldquo;{q.text}&rdquo;</p>
                <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(q.createdAt)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = iso.includes('T') ? new Date(iso) : new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + '…';
}

function MoodSparkline({ points }: { points: { date: string; mood: number }[] }) {
  if (points.length === 0) return null;
  const w = 200;
  const h = 36;
  const xs = points.map((_, i) => (i / Math.max(1, points.length - 1)) * w);
  const ys = points.map((p) => h - (p.mood / 10) * h);
  const path = points
    .map((_, i) => `${i === 0 ? 'M' : 'L'}${xs[i].toFixed(1)},${ys[i].toFixed(1)}`)
    .join(' ');
  const last = points[points.length - 1];
  const first = points[0];
  return (
    <div className="flex items-center gap-3">
      <svg width={w} height={h} className="overflow-visible">
        <path d={path} fill="none" stroke="#2A5C5C" strokeWidth={1.5} />
        {points.map((_, i) => (
          <circle key={i} cx={xs[i]} cy={ys[i]} r={2} fill="#2A5C5C" />
        ))}
      </svg>
      <span className="text-xs text-gray-600">
        {first.mood} → {last.mood}
      </span>
    </div>
  );
}
