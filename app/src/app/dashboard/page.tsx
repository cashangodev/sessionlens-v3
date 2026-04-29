'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Search, Users, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useApi } from '@/hooks/use-api';
// OnboardingTour temporarily removed — UX is imperfect, will re-introduce in v1.1.
// import { OnboardingTour } from '@/components/onboarding/OnboardingTour';

interface SessionSummary {
  id: string;
  clientCode: string;
  sessionNumber: number;
  date: string;
  time: string;
  createdAt: string;
  treatmentGoals: string;
  status: string;
}

/**
 * Dashboard home — aligned with the landing-page design system.
 *
 * Two surface tones (#FAFAF8 page + white separation), hairline borders,
 * no shadows, no hover transforms. The deep teal (`primary-dark`) is
 * reserved for one moment per fold — here it's the primary "New session"
 * action card.
 *
 * The page detects new vs returning users and shows an appropriate top
 * panel: a quiet "let's start" card for new users, a "last session"
 * shortcut for returning ones.
 */
export default function HomePage() {
  const [greeting, setGreeting] = useState('Welcome back');
  const [lastSession, setLastSession] = useState<SessionSummary | null>(null);
  const [hasAnySessions, setHasAnySessions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const { data: sessionsData, loading: sessionsLoading } = useApi<{ sessions: SessionSummary[] }>('/api/sessions');
  const { data: clientsData } = useApi<{ clients: { clientCode: string }[] }>('/api/clients');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  useEffect(() => {
    if (sessionsData?.sessions && sessionsData.sessions.length > 0) {
      setHasAnySessions(true);
      const sorted = [...sessionsData.sessions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setLastSession(sorted[0]);
    }
  }, [sessionsData]);

  return (
    <div className="max-w-5xl mx-auto">
      {/* ─── Greeting + Search row ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
        <div>
          <h1
            className="font-playfair font-semibold tracking-tight text-gray-900"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
          >
            {greeting}.
          </h1>
          <p className="mt-2 text-base text-gray-600">What would you like to do?</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={1.5} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search client code…"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900"
            />
            {searchQuery.trim() && clientsData?.clients && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-md z-50 overflow-hidden">
                {clientsData.clients
                  .filter((c) => c.clientCode.toLowerCase().includes(searchQuery.toLowerCase()))
                  .slice(0, 5)
                  .map((c) => (
                    <Link
                      key={c.clientCode}
                      href={`/dashboard/clients/${encodeURIComponent(c.clientCode)}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-bg-warm border-b border-gray-100 last:border-b-0"
                      onClick={() => setSearchQuery('')}
                    >
                      <span className="font-mono text-xs text-gray-500 w-8">
                        {c.clientCode.slice(0, 2)}
                      </span>
                      <span className="font-mono text-sm font-medium text-gray-900">
                        {c.clientCode}
                      </span>
                    </Link>
                  ))}
                {clientsData.clients.filter((c) =>
                  c.clientCode.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      router.push('/dashboard/clients?new=1');
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-bg-warm flex items-center gap-3"
                  >
                    <UserPlus className="w-4 h-4 text-primary-dark" strokeWidth={1.5} />
                    <div>
                      <p className="text-sm text-gray-700">
                        No client matching{' '}
                        <span className="font-mono font-semibold text-gray-900">
                          &ldquo;{searchQuery}&rdquo;
                        </span>
                      </p>
                      <p className="text-xs text-primary-dark font-medium">
                        + Add as a new client
                      </p>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => router.push('/dashboard/clients?new=1')}
            className="flex items-center gap-2 text-sm font-medium border border-gray-300 text-gray-900 px-4 py-2.5 rounded-md hover:border-gray-900 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" strokeWidth={1.5} />
            <span className="hidden sm:inline">New client</span>
          </button>
        </div>
      </div>

      {/* ─── New user onboarding card (when no sessions yet) ───────── */}
      {!sessionsLoading && !hasAnySessions && (
        <div className="mb-12 bg-white border border-gray-200 rounded-md p-8 md:p-10">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500 mb-3">
            Welcome
          </p>
          <h2 className="font-playfair text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 mb-3">
            Run your first analysis.
          </h2>
          <p className="text-base text-gray-600 leading-relaxed" style={{ maxWidth: '60ch' }}>
            Paste a transcript, get phenomenological coding, risk flags, and
            evidence-matched practitioner approaches in 60 seconds — grounded in
            10,000+ lived-experience archives.
          </p>
          <Link
            href="/dashboard/session/new"
            className="mt-8 inline-flex items-center gap-2 text-sm font-medium bg-primary-dark text-white px-5 py-3 rounded-md hover:bg-primary"
          >
            Try your first analysis
            <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </Link>
        </div>
      )}

      {/* ─── Returning user — last session shortcut ────────────────── */}
      {hasAnySessions && lastSession && (
        <Link
          href={`/dashboard/session/${lastSession.id}/summary`}
          className="block mb-12 bg-white border border-gray-200 rounded-md p-6 hover:border-gray-400"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500 mb-2">
                Last session
              </p>
              <p className="text-lg font-semibold text-gray-900 tracking-tight">
                <span className="font-mono">{lastSession.clientCode}</span>
                <span className="text-gray-400 mx-2">·</span>
                Session #{lastSession.sessionNumber}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {lastSession.date} at {lastSession.time}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
          </div>
        </Link>
      )}

      {/* ─── Primary actions ───────────────────────────────────────── */}
      {/* Two cards. The deep-teal "New session" is the page's single bold
          color moment, mirroring the landing page's primary CTA pattern.
          The "My clients" card is white with a hairline border. No hover
          transforms anywhere. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Link
          href="/dashboard/session/new"
          className="bg-primary-dark text-white rounded-md p-8 hover:bg-primary"
        >
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/55 mb-3">
            Run analysis
          </p>
          <h3 className="font-playfair text-2xl font-semibold tracking-tight mb-2">
            New session
          </h3>
          <p className="text-sm text-white/75 leading-relaxed" style={{ maxWidth: '40ch' }}>
            Analyze a session for an existing or new client.
          </p>
        </Link>

        <Link
          href="/dashboard/clients"
          className="bg-white border border-gray-200 rounded-md p-8 hover:border-gray-400"
        >
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500 mb-3">
            Caseload
          </p>
          <h3 className="font-playfair text-2xl font-semibold tracking-tight text-gray-900 mb-2">
            My clients
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed" style={{ maxWidth: '40ch' }}>
            View all clients, session history, and profiles.
          </p>
        </Link>
      </div>
    </div>
  );
}
