'use client';

/**
 * Intake page — "in your own words, what brings you to therapy?"
 *
 * Text-only for v1. Voice recording reuses the journal voice infra and
 * lands in a follow-up turn (just need to point the existing audio
 * uploader at intake_notes.audio_storage_path).
 */

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, Loader2 } from 'lucide-react';

const PROMPT = 'In your own words, what brings you to therapy right now? There\'s no right or wrong way to answer — say as much or as little as feels useful.';

export default function IntakePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();

  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minLength = 1;
  const canSubmit = text.trim().length >= minLength && !submitting;

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/invitation/${token}/intake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textContent: text.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      router.push(`/journal/welcome/${token}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed');
      setSubmitting(false);
    }
  }

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

        <header className="mb-6">
          <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-2">
            In your own words
          </p>
          <h1 className="font-playfair text-2xl md:text-3xl font-semibold text-gray-900 leading-tight">
            What's bringing you to therapy?
          </h1>
        </header>

        <p className="text-gray-700 leading-relaxed mb-6">{PROMPT}</p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start typing here…"
          rows={10}
          className="w-full p-4 border border-gray-200 rounded-md bg-white text-gray-900 leading-relaxed resize-y focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
        />

        <p className="text-xs text-gray-500 mt-2">
          Voice notes are coming soon — for now, text only.
        </p>

        {error && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>
        )}

        <div className="mt-8 flex items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            {text.trim().length} character{text.trim().length === 1 ? '' : 's'}
          </p>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={submit}
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-md font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
