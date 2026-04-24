'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, CalendarDays, Settings, HelpCircle, CreditCard, ArrowRight, Brain, Shield, BarChart3, Search, Users, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useApi } from '@/hooks/use-api';

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
      {/* Welcome + Search Row */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
        <div>
          <h1 className="font-playfair text-4xl font-bold text-gray-900 tracking-tight">{greeting}</h1>
          <p className="text-secondary mt-2 text-base">What would you like to do?</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search client code..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40 transition-all"
            />
            {/* Search results dropdown */}
            {searchQuery.trim() && clientsData?.clients && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-sm z-50 overflow-hidden">
                {clientsData.clients
                  .filter((c) => c.clientCode.toLowerCase().includes(searchQuery.toLowerCase()))
                  .slice(0, 5)
                  .map((c) => (
                    <Link
                      key={c.clientCode}
                      href={`/dashboard/clients/${encodeURIComponent(c.clientCode)}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-mint-50 transition-colors"
                      onClick={() => setSearchQuery('')}
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
                        <span className="font-mono text-xs font-bold text-primary">{c.clientCode.slice(0, 2)}</span>
                      </div>
                      <span className="font-mono text-sm font-medium text-gray-900">{c.clientCode}</span>
                    </Link>
                  ))}
                {clientsData.clients.filter((c) => c.clientCode.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-400">No clients found</div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => router.push('/dashboard/clients?new=1')}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-all whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">New Client</span>
          </button>
        </div>
      </div>

      {/* === NEW USER: Onboarding === */}
      {!sessionsLoading && !hasAnySessions && (
        <div className="mb-12 bg-mint-50 rounded-2xl border border-mint-200/60 p-8 md:p-10">
          <div className="flex items-start gap-4 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-2">Welcome to SessionLens</h2>
              <p className="text-secondary leading-relaxed">
                Analyze therapy sessions using AI-powered phenomenological coding. Paste a transcript,
                and get instant insights on emotional structures, risk signals, and evidence-based recommendations.
              </p>
            </div>
          </div>

          {/* What you'll get */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="flex items-start gap-3 bg-white/80 rounded-xl p-4 border border-mint-200/40">
              <Brain className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900">10 Structure Codes</p>
                <p className="text-xs text-secondary">Body, emotion, cognitive, reflective and more</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white/80 rounded-xl p-4 border border-mint-200/40">
              <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Risk Detection</p>
                <p className="text-xs text-secondary">16 clinical and social risk categories</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white/80 rounded-xl p-4 border border-mint-200/40">
              <BarChart3 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Case Matching</p>
                <p className="text-xs text-secondary">Compare against research archive</p>
              </div>
            </div>
          </div>

          <Link
            href="/dashboard/session/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all duration-200 group"
          >
            Try Your First Analysis
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      )}

      {/* === RETURNING USER: Last Session === */}
      {hasAnySessions && lastSession && (
        <Link
          href={`/dashboard/session/${lastSession.id}/summary`}
          className="block mb-12 bg-white rounded-2xl border border-gray-200 p-6 hover:border-primary/30 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-mint-50 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-secondary uppercase tracking-wide">Last Session</p>
                <p className="text-lg font-bold text-gray-900">
                  {lastSession.clientCode} — Session #{lastSession.sessionNumber}
                </p>
                <p className="text-sm text-secondary">{lastSession.date} at {lastSession.time}</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      )}

      {/* Primary Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {/* New Session */}
        <Link
          href="/dashboard/session/new"
          className="relative overflow-hidden bg-primary-dark text-white rounded-2xl p-8 hover:bg-primary transition-all duration-200 group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative">
            <div className="w-12 h-12 mb-5 rounded-xl bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="font-playfair text-xl font-bold mb-1.5">New Session</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              Analyze a session for an existing or new client
            </p>
          </div>
        </Link>

        {/* My Clients */}
        <Link
          href="/dashboard/clients"
          className="group bg-white rounded-2xl p-8 border border-gray-200 hover:border-primary/30 transition-all duration-200"
        >
          <div className="w-12 h-12 mb-5 rounded-xl bg-mint-50 group-hover:bg-mint-100 flex items-center justify-center transition-colors">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-playfair text-xl font-bold text-gray-900 mb-1.5">My Clients</h3>
          <p className="text-secondary text-sm leading-relaxed">
            View all clients, session history, and profiles
          </p>
        </Link>

        {/* Calendar */}
        <Link
          href="/dashboard/calendar"
          className="group bg-white rounded-2xl p-8 border border-gray-200 hover:border-primary/30 transition-all duration-200"
        >
          <div className="w-12 h-12 mb-5 rounded-xl bg-mint-50 group-hover:bg-mint-100 flex items-center justify-center transition-colors">
            <CalendarDays className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-playfair text-xl font-bold text-gray-900 mb-1.5">Calendar</h3>
          <p className="text-secondary text-sm leading-relaxed">
            Browse sessions by date and track progress
          </p>
        </Link>
      </div>

      {/* Footer links */}
      <div className="flex items-center justify-center gap-6 pt-10 mt-6 border-t border-gray-100">
        <Link href="/dashboard/settings" className="flex items-center gap-2 text-sm text-gray-400 hover:text-primary transition-colors">
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        <span className="text-gray-200">·</span>
        <Link href="/dashboard/billing" className="flex items-center gap-2 text-sm text-gray-400 hover:text-primary transition-colors">
          <CreditCard className="w-4 h-4" />
          Billing
        </Link>
        <span className="text-gray-200">·</span>
        <Link href="/dashboard/help" className="flex items-center gap-2 text-sm text-gray-400 hover:text-primary transition-colors">
          <HelpCircle className="w-4 h-4" />
          Help
        </Link>
      </div>
    </div>
  );
}
