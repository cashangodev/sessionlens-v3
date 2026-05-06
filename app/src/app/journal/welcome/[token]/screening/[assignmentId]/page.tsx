'use client';

/**
 * Per-instrument screening page. Renders any of the 13 instruments off
 * the catalog metadata fetched from the API. One page, items stacked
 * vertically — short instruments fit on a single screen; longer ones
 * (PCL-5, DASS-21) scroll. We keep all items on one page rather than
 * one-per-screen because patients move faster through a continuous
 * form, especially on mobile.
 *
 * Conditional items (C-SSRS Q3-5) auto-hide when the gating item is
 * unanswered or below the threshold. The submit handler treats hidden
 * items as 0 for scoring purposes (matches the spec).
 */

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, Loader2 } from 'lucide-react';

interface Item {
  id: string;
  text: string;
  scale?: { value: number; label: string; short?: string }[];
  reverseScored?: boolean;
  conditional?: { showIfItemId: string; minValue: number };
  sentinel?: string;
}

interface InstrumentDetail {
  id: string;
  name: string;
  fullName: string;
  description?: string;
  recallPeriod?: string;
  introduction?: string;
  defaultScale?: { value: number; label: string; short?: string }[];
  estimatedMinutes: number;
  items: Item[];
}

export default function ScreeningPage() {
  const params = useParams<{ token: string; assignmentId: string }>();
  const token = params.token;
  const assignmentId = params.assignmentId;
  const router = useRouter();

  const [instrument, setInstrument] = useState<InstrumentDetail | null>(null);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !assignmentId) return;
    const ac = new AbortController();
    fetch(`/api/invitation/${token}/screening/${assignmentId}`, { signal: ac.signal, cache: 'no-store' })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
        if (body.completed) {
          router.replace(`/journal/welcome/${token}`);
          return;
        }
        setInstrument(body.instrument);
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [token, assignmentId, router]);

  const visibleItems = useMemo(() => {
    if (!instrument) return [];
    return instrument.items.filter((it) => {
      const cond = it.conditional;
      if (!cond) return true;
      const gate = responses[cond.showIfItemId];
      return gate !== undefined && gate >= cond.minValue;
    });
  }, [instrument, responses]);

  const allAnswered = visibleItems.every((it) => responses[it.id] !== undefined);

  async function submit() {
    if (!instrument) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/invitation/${token}/screening/${assignmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      router.push(`/journal/welcome/${token}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Centered>
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </Centered>
    );
  }
  if (error && !instrument) {
    return (
      <Centered>
        <p className="text-center text-gray-600 max-w-md">{error}</p>
      </Centered>
    );
  }
  if (!instrument) return null;

  return (
    <div className="min-h-screen bg-bg-warm">
      <div className="max-w-2xl mx-auto px-5 py-8 md:py-12">
        <Link
          href={`/journal/welcome/${token}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to checklist
        </Link>

        <header className="mb-8">
          <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-2">
            {instrument.name}
          </p>
          <h1 className="font-playfair text-2xl md:text-3xl font-semibold text-gray-900 mb-3 leading-tight">
            {instrument.fullName}
          </h1>
          {instrument.recallPeriod && (
            <p className="text-sm text-gray-500 italic">{instrument.recallPeriod}.</p>
          )}
        </header>

        {instrument.introduction && (
          <p className="text-gray-700 leading-relaxed mb-8 p-4 bg-white border border-gray-200 rounded-md">
            {instrument.introduction}
          </p>
        )}

        <ol className="space-y-6">
          {visibleItems.map((item, index) => {
            const scale = item.scale ?? instrument.defaultScale ?? [];
            const value = responses[item.id];
            return (
              <li key={item.id} className="bg-white border border-gray-200 rounded-md p-5">
                <p className="text-gray-900 leading-relaxed mb-4">
                  <span className="text-gray-400 font-mono text-sm mr-2">{index + 1}.</span>
                  {item.text}
                </p>
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(scale.length, 5)}, minmax(0, 1fr))` }}>
                  {scale.map((opt) => {
                    const selected = value === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setResponses((r) => ({ ...r, [item.id]: opt.value }))}
                        className={`text-sm leading-tight rounded-md px-3 py-2.5 border transition-colors text-left ${
                          selected
                            ? 'border-primary bg-primary text-white'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-primary/40 hover:bg-primary/[0.04]'
                        }`}
                      >
                        <span className={`block text-[10px] uppercase font-mono tracking-wider mb-0.5 ${selected ? 'text-white/70' : 'text-gray-400'}`}>
                          {opt.short ?? opt.value}
                        </span>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ol>

        {error && (
          <p className="mt-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>
        )}

        <div className="mt-10 flex items-center justify-between gap-4 sticky bottom-4">
          <p className="text-xs text-gray-500">
            {Object.keys(responses).length} of {visibleItems.length} answered
          </p>
          <button
            type="button"
            disabled={!allAnswered || submitting}
            onClick={submit}
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-md font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-warm flex items-center justify-center px-5 py-10">
      {children}
    </div>
  );
}
