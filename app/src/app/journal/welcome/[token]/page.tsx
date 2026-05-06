'use client';

/**
 * Welcome page — the first thing a patient sees after clicking the email
 * link. Shows the assigned screening checklist plus the optional intake
 * prompt. Each item links to its own page; once all required items are
 * complete, the patient sees a "you're all set" success state.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ChevronRight, Clock, Loader2, Mic } from 'lucide-react';

interface Assignment {
  assignmentId: string;
  instrumentId: string;
  instrumentName: string;
  instrumentFullName: string;
  description?: string;
  estimatedMinutes: number | null;
  required: boolean;
  completed: boolean;
  severity: string | null;
}

interface InvitationData {
  invitation: { id: string; status: string; expiresAt: string };
  therapist: { displayName: string | null };
  assignments: Assignment[];
  intake: { offered: boolean; required: boolean; completed: boolean };
}

export default function WelcomePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [data, setData] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const ac = new AbortController();
    fetch(`/api/invitation/${token}`, { signal: ac.signal, cache: 'no-store' })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
        setData(body);
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [token]);

  if (loading) {
    return (
      <Centered>
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="mt-4 text-gray-600 text-sm">Loading your invitation…</p>
      </Centered>
    );
  }

  if (error || !data) {
    return (
      <Centered>
        <div className="max-w-md text-center">
          <h1 className="font-playfair text-2xl font-semibold text-gray-900 mb-3">
            Sorry, this link can't be opened.
          </h1>
          <p className="text-gray-600 leading-relaxed">{error || 'The invitation could not be found.'}</p>
          <p className="text-gray-500 text-sm mt-6">
            Reply to the email your therapist sent you and they'll send a fresh link.
          </p>
        </div>
      </Centered>
    );
  }

  const therapist = data.therapist.displayName?.trim() || 'your therapist';

  const remainingRequired = data.assignments.filter((a) => a.required && !a.completed).length;
  const totalRequired = data.assignments.filter((a) => a.required).length;
  const allRequiredDone = remainingRequired === 0;

  const optionalRemaining = data.assignments.filter((a) => !a.required && !a.completed).length
    + (data.intake.offered && !data.intake.completed ? 1 : 0);
  const showAllDoneBanner = allRequiredDone;

  return (
    <div className="min-h-screen bg-bg-warm">
      <div className="max-w-2xl mx-auto px-5 py-10 md:py-16">
        <header className="mb-10">
          <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">
            Polaris · before your first session
          </p>
          <h1 className="font-playfair text-3xl md:text-4xl font-semibold text-gray-900 leading-tight mb-3">
            Welcome — {therapist} put together a few things for you.
          </h1>
          <p className="text-gray-600 leading-relaxed">
            Take your time. Your answers are private and only visible to {therapist}.
            {totalRequired > 0 && remainingRequired > 0 && (
              <>
                {' '}
                <strong>{remainingRequired} required</strong> item
                {remainingRequired === 1 ? '' : 's'} left.
              </>
            )}
          </p>
        </header>

        {showAllDoneBanner && (
          <div className="mb-8 rounded-md border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">You're all set for your first session.</p>
              <p className="text-sm text-gray-600 mt-1">
                {therapist} will see your responses.{' '}
                {optionalRemaining > 0 && (
                  <>There {optionalRemaining === 1 ? 'is' : 'are'} {optionalRemaining} optional item{optionalRemaining === 1 ? '' : 's'} left if you have time.</>
                )}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {data.assignments.map((a) => (
            <ChecklistItem
              key={a.assignmentId}
              href={`/journal/welcome/${token}/screening/${a.assignmentId}`}
              title={a.instrumentName}
              subtitle={a.instrumentFullName}
              minutes={a.estimatedMinutes}
              required={a.required}
              completed={a.completed}
            />
          ))}

          {data.intake.offered && (
            <ChecklistItem
              href={`/journal/welcome/${token}/intake`}
              title="In your own words"
              subtitle="Share what's bringing you to therapy — write or record"
              minutes={3}
              icon={<Mic className="w-4 h-4" />}
              required={data.intake.required}
              completed={data.intake.completed}
            />
          )}
        </div>

        <p className="text-xs text-gray-400 mt-10 text-center">
          Your answers are encrypted and shared only with {therapist}.
        </p>
      </div>
    </div>
  );
}

function ChecklistItem({
  href,
  title,
  subtitle,
  minutes,
  required,
  completed,
  icon,
}: {
  href: string;
  title: string;
  subtitle: string;
  minutes: number | null;
  required: boolean;
  completed: boolean;
  icon?: React.ReactNode;
}) {
  if (completed) {
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50/60 p-4 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <span className="text-xs text-emerald-700 font-medium uppercase tracking-wide">Done</span>
      </div>
    );
  }
  return (
    <Link
      href={href}
      className="block rounded-md border border-gray-200 bg-white p-4 hover:border-primary/40 hover:bg-primary/[0.02] transition-colors group"
    >
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5 group-hover:border-primary/60" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {icon}
            <p className="font-medium text-gray-900">{title}</p>
            {required ? (
              <span className="text-[10px] uppercase tracking-wider font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                Required
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                Optional
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          {minutes && (
            <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              About {minutes} minute{minutes === 1 ? '' : 's'}
            </p>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary flex-shrink-0 mt-0.5" />
      </div>
    </Link>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-warm flex items-center justify-center px-5 py-10">
      <div className="flex flex-col items-center">{children}</div>
    </div>
  );
}
