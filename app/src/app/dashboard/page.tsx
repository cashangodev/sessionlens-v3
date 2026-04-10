'use client';

import Link from 'next/link';
import { Plus, CalendarDays, Settings, HelpCircle, CreditCard, ArrowRight, Sparkles, Brain, Shield, BarChart3, Search, Users } from 'lucide-react';
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

  const { data: sessionsData } = useApi<{ sessions: SessionSummary[] }>('/api/sessions');

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
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{greeting}</h1>
          <p className="text-slate-500 mt-1">What would you like to do?</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search client code..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* === NEW USER: Onboarding === */}
      {!hasAnySessions && (
        <div className="mb-10 bg-gradient-to-br from-indigo-50 via-white to-violet-50 rounded-2xl border border-indigo-100 p-8 md:p-10">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Welcome to SessionLens</h2>
              <p className="text-slate-600 leading-relaxed">
                Analyze therapy sessions using AI-powered phenomenological coding. Paste a transcript,
                and get instant insights on emotional structures, risk signals, and evidence-based recommendations.
              </p>
            </div>
          </div>

          {/* What you'll get */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="flex items-start gap-3 bg-white/70 rounded-xl p-4">
              <Brain className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-900">10 Structure Codes</p>
                <p className="text-xs text-slate-500">Body, emotion, cognitive, reflective and more</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white/70 rounded-xl p-4">
              <Shield className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Risk Detection</p>
                <p className="text-xs text-slate-500">16 clinical and social risk categories</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white/70 rounded-xl p-4">
              <BarChart3 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Case Matching</p>
                <p className="text-xs text-slate-500">Compare against 10,000+ coded sessions</p>
              </div>
            </div>
          </div>

          <Link
            href="/dashboard/session/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark shadow-lg shadow-primary/25 hover:shadow-xl transition-all duration-200 group"
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
          className="block mb-10 bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Last Session</p>
                <p className="text-lg font-bold text-slate-900">
                  {lastSession.clientCode} — Session #{lastSession.sessionNumber}
                </p>
                <p className="text-sm text-slate-500">{lastSession.date} at {lastSession.time}</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      )}

      {/* Primary Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {/* New Session */}
        <Link
          href="/dashboard/session/new"
          className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl p-8 hover:shadow-xl hover:shadow-indigo-500/20 hover:-translate-y-0.5 transition-all duration-200 group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative">
            <div className="w-12 h-12 mb-4 rounded-xl bg-white/15 group-hover:bg-white/25 flex items-center justify-center transition-colors">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-1">New Session</h3>
            <p className="text-indigo-200 text-sm leading-relaxed">
              Analyze a session for an existing or new client
            </p>
          </div>
        </Link>

        {/* My Clients */}
        <Link
          href="/dashboard/clients"
          className="group bg-white rounded-2xl p-8 border border-slate-200 hover:shadow-xl hover:border-indigo-200 hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="w-12 h-12 mb-4 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">My Clients</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            View all clients, session history, and profiles
          </p>
        </Link>

        {/* Calendar */}
        <Link
          href="/dashboard/calendar"
          className="group bg-white rounded-2xl p-8 border border-slate-200 hover:shadow-xl hover:border-indigo-200 hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="w-12 h-12 mb-4 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
            <CalendarDays className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">Calendar</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Browse sessions by date and track progress
          </p>
        </Link>
      </div>

      {/* Footer links */}
      <div className="flex items-center justify-center gap-6 pt-8 mt-4 border-t border-slate-100">
        <Link href="/dashboard/settings" className="flex items-center gap-2 text-sm text-slate-400 hover:text-primary transition-colors">
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        <span className="text-slate-200">·</span>
        <Link href="/dashboard/billing" className="flex items-center gap-2 text-sm text-slate-400 hover:text-primary transition-colors">
          <CreditCard className="w-4 h-4" />
          Billing
        </Link>
        <span className="text-slate-200">·</span>
        <Link href="/dashboard/help" className="flex items-center gap-2 text-sm text-slate-400 hover:text-primary transition-colors">
          <HelpCircle className="w-4 h-4" />
          Help
        </Link>
      </div>
    </div>
  );
}
