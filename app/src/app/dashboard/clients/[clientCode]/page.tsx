'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useApi } from '@/hooks/use-api';
import {
  ArrowLeft,
  Plus,
  Calendar,
  Clock,
  Hash,
  ChevronRight,
  UserCircle,
  Target,
  AlertCircle,
  Stethoscope,
  Brain,
  Activity,
  FileText,
} from 'lucide-react';

interface ClientProfile {
  clientCode: string;
  gender: string;
  ageRange: string;
  treatmentGoals: string[];
  presentingConcerns: string[];
  diagnosticConsiderations: string[];
  currentRiskLevel: string;
  keyThemes: string[];
  dominantStructures: string[];
  preferredApproach: string;
  clinicalNotes: string;
  totalSessions: number;
  isConfirmed: boolean;
  lastConfirmedAt: string | null;
  createdAt: string;
}

interface SessionSummary {
  id: string;
  sessionNumber: number;
  date: string;
  time: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ClientDetailPage() {
  const params = useParams();
  const clientCode = decodeURIComponent(params.clientCode as string);

  const { data, loading } = useApi<{ profile: ClientProfile; sessions: SessionSummary[] }>(
    `/api/clients/${encodeURIComponent(clientCode)}`
  );

  const profile = data?.profile ?? null;
  const sessions = data?.sessions ?? [];

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Clients
        </Link>
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!profile && sessions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Clients
        </Link>
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <UserCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Client Not Found</h3>
          <p className="text-gray-500 text-sm mb-6">
            No sessions found for client code &ldquo;{clientCode}&rdquo;.
          </p>
          <Link
            href="/dashboard/clients"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-all"
          >
            View All Clients
          </Link>
        </div>
      </div>
    );
  }

  const sessionCount = profile?.totalSessions ?? sessions.length;
  const firstSessionDate = sessions.length > 0 ? sessions[sessions.length - 1]?.date : null;
  const lastSessionDate = sessions.length > 0 ? sessions[0]?.date : null;

  const riskColor = profile?.currentRiskLevel === 'high'
    ? 'bg-red-100 text-red-700'
    : profile?.currentRiskLevel === 'moderate'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-green-100 text-green-700';

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/dashboard/clients"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Clients
      </Link>

      {/* Client Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <UserCircle className="w-8 h-8 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-2xl font-bold text-gray-900">{clientCode}</h1>
              {profile?.gender && (
                <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                  {profile.gender === 'male' ? 'Male' : profile.gender === 'female' ? 'Female' : 'Other'}
                </span>
              )}
              {profile?.ageRange && (
                <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                  {profile.ageRange === 'child' ? '0–12' : profile.ageRange === 'adolescent' ? '13–17' : profile.ageRange === 'young-adult' ? '18–25' : profile.ageRange === 'adult' ? '26–39' : profile.ageRange === 'middle-aged' ? '40–59' : '60+'}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {sessionCount} session{sessionCount !== 1 ? 's' : ''}
              {firstSessionDate && sessionCount > 0 && (
                <> &middot; Since {formatDateShort(firstSessionDate)}</>
              )}
            </p>
          </div>
        </div>
        <Link
          href={`/dashboard/session/new?client=${encodeURIComponent(clientCode)}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          New Session
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Hash className="w-3 h-3" />Sessions</p>
          <p className="text-2xl font-bold text-gray-900">{sessionCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" />First</p>
          <p className="text-sm font-semibold text-gray-900">{firstSessionDate ? formatDateShort(firstSessionDate) : '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" />Last</p>
          <p className="text-sm font-semibold text-gray-900">{lastSessionDate ? formatDateShort(lastSessionDate) : '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Activity className="w-3 h-3" />Risk</p>
          {profile ? (
            <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${riskColor}`}>
              {profile.currentRiskLevel.charAt(0).toUpperCase() + profile.currentRiskLevel.slice(1)}
            </span>
          ) : (
            <p className="text-sm text-gray-400">—</p>
          )}
        </div>
      </div>

      {/* Profile Summary (if confirmed) */}
      {profile && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Client Profile
            </h2>
            {profile.isConfirmed ? (
              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Confirmed</span>
            ) : (
              <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Unconfirmed</span>
            )}
          </div>

          {/* Treatment Goals */}
          {profile.treatmentGoals.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 font-medium mb-2 flex items-center gap-1">
                <Target className="w-3 h-3" /> Treatment Goals
              </p>
              <ul className="space-y-1.5">
                {profile.treatmentGoals.map((goal, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {goal}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Presenting Concerns */}
          {profile.presentingConcerns.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 font-medium mb-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Presenting Concerns
              </p>
              <div className="flex flex-wrap gap-1.5">
                {profile.presentingConcerns.map((c, i) => (
                  <span key={i} className="text-xs bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full">{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Approach + Structures */}
          <div className="flex flex-wrap gap-6">
            {profile.preferredApproach && (
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                  <Stethoscope className="w-3 h-3" /> Approach
                </p>
                <p className="text-sm text-gray-700">{profile.preferredApproach}</p>
              </div>
            )}
            {profile.dominantStructures.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                  <Brain className="w-3 h-3" /> Structures
                </p>
                <div className="flex flex-wrap gap-1">
                  {profile.dominantStructures.map((s) => (
                    <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {s.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Clinical Notes */}
          {profile.clinicalNotes && (
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Clinical Notes</p>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{profile.clinicalNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* Session History */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          Session History
        </h2>

        {sessions.length > 0 ? (
          <div className="space-y-2">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/dashboard/session/${session.id}/summary`}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-primary/30 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="font-mono text-sm font-bold text-primary">#{session.sessionNumber}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">Session #{session.sessionNumber}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(session.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {session.time}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500 text-sm">No sessions recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
