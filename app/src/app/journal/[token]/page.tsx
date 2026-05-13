'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

type State =
  | { kind: 'loading' }
  | { kind: 'success'; prompt: string }
  | { kind: 'error'; reason: string };

const ERROR_COPY: Record<string, string> = {
  not_found: "We couldn't find this link. Ask your clinician to send a new one.",
  already_redeemed:
    "This link was already used. If this is your phone, you can keep using the journal. If not, ask your clinician for a new link.",
  expired: 'This link expired. Ask your clinician to generate a new one.',
};

export default function EnrollmentPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    async function go() {
      try {
        const res = await fetch('/api/journal/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: params?.token }),
        });
        const body = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && body.ok) {
          setState({ kind: 'success', prompt: body.prompt });
          // Drop the token from the URL after a moment so refreshes don't
          // trigger a second redeem and show 'already_redeemed'.
          setTimeout(() => router.replace('/journal'), 1500);
        } else {
          setState({ kind: 'error', reason: body.error || 'unknown' });
        }
      } catch {
        if (!cancelled) setState({ kind: 'error', reason: 'unknown' });
      }
    }
    if (params?.token) go();
    return () => {
      cancelled = true;
    };
  }, [params?.token, router]);

  return (
    <main className="max-w-md mx-auto px-6 pt-24 pb-12">
      <h1 className="font-playfair text-2xl font-semibold mb-6 text-gray-900">
        Session Polaris
      </h1>

      {state.kind === 'loading' && (
        <div className="flex items-center gap-3 text-gray-700">
          <Loader2 className="w-5 h-5 animate-spin" strokeWidth={1.5} />
          Setting up your journal…
        </div>
      )}

      {state.kind === 'success' && (
        <div>
          <div className="flex items-center gap-2 text-success mb-4">
            <CheckCircle2 className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-sm font-medium">You&apos;re all set.</span>
          </div>
          <p className="text-sm text-gray-700 mb-1">Your clinician asked you:</p>
          <blockquote className="border-l-2 border-primary pl-3 text-gray-900 italic mb-6">
            &ldquo;{state.prompt}&rdquo;
          </blockquote>
          <p className="text-sm text-gray-600">Taking you to the journal…</p>
        </div>
      )}

      {state.kind === 'error' && (
        <div>
          <div className="flex items-center gap-2 text-error mb-3">
            <AlertTriangle className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-sm font-medium">We couldn&apos;t open this link.</span>
          </div>
          <p className="text-sm text-gray-700">
            {ERROR_COPY[state.reason] ?? "Something went wrong. Please try again later."}
          </p>
        </div>
      )}
    </main>
  );
}
