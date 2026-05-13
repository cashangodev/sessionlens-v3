'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  QrCode,
  RefreshCw,
  Copy,
  CheckCircle2,
  Loader2,
  Smartphone,
  AlertTriangle,
} from 'lucide-react';

interface InvitationResponse {
  invitation: {
    id: string;
    token: string;
    prompt: string;
    expiresAt: string;
  };
  enrollmentUrl: string;
  qrDataUrl: string;
}

const PROMPT_PRESETS = [
  'Tell me how you feel when anxiety comes around — what triggered it, where you were, what your body did.',
  'When you have a panic moment, log it — describe what happened just before, what your thoughts were, and how long it lasted.',
  'Daily check-in: how was your sleep, your mood, anything that stood out today.',
];

export default function JournalSetupPage() {
  const params = useParams<{ clientCode: string }>();
  const clientCode = params?.clientCode;

  const [prompt, setPrompt] = useState(PROMPT_PRESETS[0]);
  const [cadence, setCadence] = useState('Whenever you notice it');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<InvitationResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!clientCode) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/journal/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientCode, prompt, cadence }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as InvitationResponse;
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate');
    } finally {
      setGenerating(false);
    }
  }

  function copyLink() {
    if (!result) return;
    navigator.clipboard.writeText(result.enrollmentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/dashboard/clients/${clientCode}`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          Back to {clientCode}
        </Link>
        <h1 className="font-playfair text-3xl font-semibold text-gray-900">
          Between-session journal
        </h1>
        <p className="mt-2 text-gray-600 max-w-2xl">
          Set the prompt your client will see when they log a moment between
          sessions. Generate a QR they scan once at the end of today's session
          to enroll their phone.
        </p>
      </div>

      {!result && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-3xl">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="What you want them to write about, in their words…"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {PROMPT_PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => setPrompt(p)}
                className="text-xs px-3 py-1.5 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50"
              >
                Preset {i + 1}
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium text-gray-900 mt-6 mb-2">
            Cadence (optional, shown to client)
          </label>
          <input
            type="text"
            value={cadence}
            onChange={(e) => setCadence(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g. whenever you notice it / daily at 9pm"
          />

          {error && (
            <div className="mt-4 flex items-center gap-2 text-sm text-error">
              <AlertTriangle className="w-4 h-4" strokeWidth={1.5} />
              {error}
            </div>
          )}

          <button
            onClick={generate}
            disabled={generating || prompt.trim().length < 4}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                Generating…
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4" strokeWidth={1.5} />
                Generate QR
              </>
            )}
          </button>
        </div>
      )}

      {result && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-3xl">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-[260px]">
              <h2 className="font-playfair text-xl font-semibold text-gray-900 mb-2">
                Ask your client to scan this with their phone camera
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                The QR opens a journal page for them. They'll see this prompt:
              </p>
              <blockquote className="border-l-2 border-primary pl-3 text-sm text-gray-800 italic mb-4">
                &ldquo;{result.invitation.prompt}&rdquo;
              </blockquote>
              <div className="text-xs text-gray-500 mb-4">
                Single-use link, expires{' '}
                {new Date(result.invitation.expiresAt).toLocaleDateString()}.
              </div>
              <div className="flex items-center gap-2 mb-2">
                <code className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 truncate flex-1">
                  {result.enrollmentUrl}
                </code>
                <button
                  onClick={copyLink}
                  className="p-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                  aria-label="Copy link"
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4 text-success" strokeWidth={1.5} />
                  ) : (
                    <Copy className="w-4 h-4" strokeWidth={1.5} />
                  )}
                </button>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setResult(null);
                    setError(null);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
                  Generate a different prompt
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.qrDataUrl}
                alt="QR code"
                className="w-64 h-64 border border-gray-200 rounded-lg"
              />
              <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                <Smartphone className="w-3.5 h-3.5" strokeWidth={1.5} />
                Scan with phone camera
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-mint-50 border border-mint-200 rounded-xl p-5 max-w-3xl">
        <h3 className="text-sm font-medium text-gray-900 mb-1">How this works for the client</h3>
        <ol className="text-sm text-gray-700 space-y-1.5 list-decimal list-inside">
          <li>They scan the QR. Their browser opens to the prompt.</li>
          <li>They tap &ldquo;Add to home screen&rdquo; — it behaves like an app.</li>
          <li>When a moment happens they tap the icon, hit voice / text / quick-log.</li>
          <li>You see everything in the &ldquo;Since last session&rdquo; brief next time.</li>
        </ol>
        <p className="text-xs text-gray-500 mt-3">
          Patient entries are not monitored in real time. The journal page tells
          your client to call a crisis line if they need help now.
        </p>
      </div>
    </div>
  );
}
