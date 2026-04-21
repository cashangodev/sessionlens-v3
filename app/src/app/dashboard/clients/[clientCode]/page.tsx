'use client';

import { useState } from 'react';
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
  TrendingDown,
  TrendingUp,
  Minus,
  BarChart3,
  Loader2,
  CheckCircle2,
  ClipboardList,
  X,
  Edit3,
  Check,
  Save,
} from 'lucide-react';

interface OutcomeScoreEntry {
  date: string;
  phq9: number | null;
  gad7: number | null;
  note: string;
}

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
  outcomeTrackingEnabled: boolean;
  outcomeScores: OutcomeScoreEntry[];
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

function getPhq9Severity(score: number): { label: string; color: string } {
  if (score <= 4) return { label: 'Minimal', color: 'text-green-600 bg-green-50' };
  if (score <= 9) return { label: 'Mild', color: 'text-yellow-600 bg-yellow-50' };
  if (score <= 14) return { label: 'Moderate', color: 'text-amber-600 bg-amber-50' };
  if (score <= 19) return { label: 'Moderately Severe', color: 'text-orange-600 bg-orange-50' };
  return { label: 'Severe', color: 'text-red-600 bg-red-50' };
}

function getGad7Severity(score: number): { label: string; color: string } {
  if (score <= 4) return { label: 'Minimal', color: 'text-green-600 bg-green-50' };
  if (score <= 9) return { label: 'Mild', color: 'text-yellow-600 bg-yellow-50' };
  if (score <= 14) return { label: 'Moderate', color: 'text-amber-600 bg-amber-50' };
  return { label: 'Severe', color: 'text-red-600 bg-red-50' };
}

export default function ClientDetailPage() {
  const params = useParams();
  const clientCode = decodeURIComponent(params.clientCode as string);

  const { data, loading, mutate } = useApi<{ profile: ClientProfile; sessions: SessionSummary[] }>(
    `/api/clients/${encodeURIComponent(clientCode)}`
  );

  const profile = data?.profile ?? null;
  const sessions = data?.sessions ?? [];

  // Profile edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editGender, setEditGender] = useState('');
  const [editAgeRange, setEditAgeRange] = useState('');
  const [editGoals, setEditGoals] = useState('');
  const [editConcerns, setEditConcerns] = useState('');
  const [editApproach, setEditApproach] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);

  // Outcome tracking state
  const [showAddScore, setShowAddScore] = useState(false);
  const [scoreDate, setScoreDate] = useState(new Date().toISOString().split('T')[0]);
  const [phq9Input, setPhq9Input] = useState('');
  const [gad7Input, setGad7Input] = useState('');
  const [scoreNote, setScoreNote] = useState('');
  const [savingOutcome, setSavingOutcome] = useState(false);
  const [savedOutcome, setSavedOutcome] = useState(false);
  const [enablingTracking, setEnablingTracking] = useState(false);

  const startEditing = () => {
    setEditGender(profile?.gender || '');
    setEditAgeRange(profile?.ageRange || '');
    setEditGoals((profile?.treatmentGoals || []).join(', '));
    setEditConcerns((profile?.presentingConcerns || []).join(', '));
    setEditApproach(profile?.preferredApproach || '');
    setEditNotes(profile?.clinicalNotes || '');
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const goals = editGoals.trim() ? editGoals.split(',').map((g) => g.trim()).filter(Boolean) : [];
      const concerns = editConcerns.trim() ? editConcerns.split(',').map((c) => c.trim()).filter(Boolean) : [];

      await fetch(`/api/clients/${encodeURIComponent(clientCode)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender: editGender,
          ageRange: editAgeRange,
          treatmentGoals: goals,
          presentingConcerns: concerns,
          preferredApproach: editApproach.trim(),
          clinicalNotes: editNotes.trim(),
        }),
      });

      setSavedProfile(true);
      setIsEditing(false);
      mutate();
      setTimeout(() => setSavedProfile(false), 2000);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleEnableTracking = async () => {
    setEnablingTracking(true);
    try {
      await fetch(`/api/clients/${encodeURIComponent(clientCode)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcomeTrackingEnabled: true }),
      });
      mutate();
    } catch (err) {
      console.error('Error enabling outcome tracking:', err);
    } finally {
      setEnablingTracking(false);
    }
  };

  const handleAddScore = async () => {
    const phq9 = phq9Input ? parseInt(phq9Input, 10) : null;
    const gad7 = gad7Input ? parseInt(gad7Input, 10) : null;
    if (phq9 === null && gad7 === null) return;

    setSavingOutcome(true);
    try {
      const existingScores: OutcomeScoreEntry[] = profile?.outcomeScores ?? [];
      const newEntry: OutcomeScoreEntry = {
        date: scoreDate,
        phq9,
        gad7,
        note: scoreNote,
      };
      const updatedScores = [...existingScores, newEntry].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      await fetch(`/api/clients/${encodeURIComponent(clientCode)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcomeScores: updatedScores }),
      });

      setSavedOutcome(true);
      setShowAddScore(false);
      setPhq9Input('');
      setGad7Input('');
      setScoreNote('');
      mutate();
      setTimeout(() => setSavedOutcome(false), 2000);
    } catch (err) {
      console.error('Error saving outcome score:', err);
    } finally {
      setSavingOutcome(false);
    }
  };

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
              {profile?.gender && !isEditing && (
                <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                  {profile.gender === 'male' ? 'Male' : profile.gender === 'female' ? 'Female' : 'Other'}
                </span>
              )}
              {profile?.ageRange && !isEditing && (
                <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                  {profile.ageRange === 'child' ? '0-12' : profile.ageRange === 'adolescent' ? '13-17' : profile.ageRange === 'young-adult' ? '18-25' : profile.ageRange === 'adult' ? '26-39' : profile.ageRange === 'middle-aged' ? '40-59' : '60+'}
                </span>
              )}
              {savedProfile && (
                <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Saved</span>
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
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/session/new?client=${encodeURIComponent(clientCode)}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-all"
          >
            <Plus className="w-4 h-4" />
            New Session
          </Link>
        </div>
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

      {/* Client Profile — View / Edit Mode */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Client Profile
          </h2>
          <div className="flex items-center gap-2">
            {profile?.isConfirmed && !isEditing && (
              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Confirmed</span>
            )}
            {!isEditing ? (
              <button
                onClick={startEditing}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-dark font-medium px-3 py-1.5 rounded-lg hover:bg-primary/5 transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-medium px-3 py-1.5 rounded-lg hover:bg-green-50 transition disabled:opacity-50"
                >
                  {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {savingProfile ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {isEditing ? (
          /* ── EDIT MODE ── */
          <div className="space-y-4">
            {/* Gender + Age Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1.5">Gender</label>
                <select
                  value={editGender}
                  onChange={(e) => setEditGender(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white"
                >
                  <option value="">Not specified</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other / Non-binary</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1.5">Age Range</label>
                <select
                  value={editAgeRange}
                  onChange={(e) => setEditAgeRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white"
                >
                  <option value="">Not specified</option>
                  <option value="child">0-12 (Child)</option>
                  <option value="adolescent">13-17 (Adolescent)</option>
                  <option value="young-adult">18-25 (Young Adult)</option>
                  <option value="adult">26-39 (Adult)</option>
                  <option value="middle-aged">40-59 (Middle-aged)</option>
                  <option value="senior">60+ (Senior)</option>
                </select>
              </div>
            </div>

            {/* Treatment Goals */}
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5 flex items-center gap-1">
                <Target className="w-3 h-3" /> Treatment Goals
              </label>
              <input
                type="text"
                value={editGoals}
                onChange={(e) => setEditGoals(e.target.value)}
                placeholder="e.g. reduce anxiety, improve sleep, build coping skills"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">Separate with commas</p>
            </div>

            {/* Presenting Concerns */}
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Presenting Concerns
              </label>
              <input
                type="text"
                value={editConcerns}
                onChange={(e) => setEditConcerns(e.target.value)}
                placeholder="e.g. anxiety, depression, relationship issues"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">Separate with commas</p>
            </div>

            {/* Preferred Approach */}
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5 flex items-center gap-1">
                <Stethoscope className="w-3 h-3" /> Preferred Approach
              </label>
              <input
                type="text"
                value={editApproach}
                onChange={(e) => setEditApproach(e.target.value)}
                placeholder="e.g. Cognitive Behavioral Therapy (CBT)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>

            {/* Clinical Notes */}
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Clinical Notes</label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Referral source, initial observations, history..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
              />
            </div>

            <p className="text-xs text-gray-400">All fields are optional. The client can remain fully anonymous.</p>
          </div>
        ) : (
          /* ── VIEW MODE ── */
          <div className="space-y-5">
            {/* Show empty state if no profile data */}
            {!profile?.gender && !profile?.ageRange && (!profile?.treatmentGoals || profile.treatmentGoals.length === 0) && (!profile?.presentingConcerns || profile.presentingConcerns.length === 0) && !profile?.preferredApproach && !profile?.clinicalNotes ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-400 mb-2">No profile details added yet</p>
                <button
                  onClick={startEditing}
                  className="text-sm text-primary hover:text-primary-dark font-medium transition-colors"
                >
                  Add client details
                </button>
              </div>
            ) : (
              <>
                {/* Treatment Goals */}
                {profile && profile.treatmentGoals.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-2 flex items-center gap-1">
                      <Target className="w-3 h-3" /> Treatment Goals
                    </p>
                    <ul className="space-y-1.5">
                      {profile.treatmentGoals.map((goal, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                          {goal}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Presenting Concerns */}
                {profile && profile.presentingConcerns.length > 0 && (
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
                  {profile?.preferredApproach && (
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                        <Stethoscope className="w-3 h-3" /> Approach
                      </p>
                      <p className="text-sm text-gray-700">{profile.preferredApproach}</p>
                    </div>
                  )}
                  {profile && profile.dominantStructures.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                        <Brain className="w-3 h-3" /> Structures
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {profile.dominantStructures.map((s) => (
                          <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{s.replace(/_/g, ' ')}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Clinical Notes */}
                {profile?.clinicalNotes && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Clinical Notes</p>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{profile.clinicalNotes}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* PHQ-9 / GAD-7 Outcome Measures */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Outcome Measures
          </h2>
          {profile?.outcomeTrackingEnabled && (
            <div className="flex items-center gap-2">
              {savedOutcome && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Saved
                </span>
              )}
              <button
                onClick={() => setShowAddScore(!showAddScore)}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-dark font-medium px-3 py-1.5 rounded-lg hover:bg-primary/5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Scores
              </button>
            </div>
          )}
        </div>

        {!profile?.outcomeTrackingEnabled ? (
          /* Prompt to enable tracking */
          <div className="text-center py-6 bg-gray-50 rounded-xl">
            <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700 mb-1">Track standardized outcome measures?</p>
            <p className="text-xs text-gray-500 mb-4 max-w-md mx-auto">
              PHQ-9 (depression) and GAD-7 (anxiety) scores help track client progress over time.
              Standard practice is to administer at intake, then every 4-6 sessions.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                onClick={handleEnableTracking}
                disabled={enablingTracking}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50"
              >
                {enablingTracking ? 'Enabling...' : "Yes, I'll track scores"}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Add Score Form */}
            {showAddScore && (
              <div className="mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700">Record New Scores</p>
                  <button onClick={() => setShowAddScore(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Date</label>
                    <input
                      type="date"
                      value={scoreDate}
                      onChange={(e) => setScoreDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">PHQ-9 <span className="text-gray-400">(0-27)</span></label>
                    <input
                      type="number"
                      min="0"
                      max="27"
                      value={phq9Input}
                      onChange={(e) => setPhq9Input(e.target.value)}
                      placeholder="—"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">GAD-7 <span className="text-gray-400">(0-21)</span></label>
                    <input
                      type="number"
                      min="0"
                      max="21"
                      value={gad7Input}
                      onChange={(e) => setGad7Input(e.target.value)}
                      placeholder="—"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Note <span className="text-gray-400">(optional)</span></label>
                    <input
                      type="text"
                      value={scoreNote}
                      onChange={(e) => setScoreNote(e.target.value)}
                      placeholder="e.g. Baseline intake"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddScore}
                  disabled={savingOutcome || (!phq9Input && !gad7Input)}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {savingOutcome ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {savingOutcome ? 'Saving...' : 'Save Scores'}
                </button>
              </div>
            )}

            {/* Score History */}
            {(profile?.outcomeScores ?? []).length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">No scores recorded yet</p>
                <p className="text-xs text-gray-400">
                  Add baseline PHQ-9/GAD-7 scores from intake session
                </p>
              </div>
            ) : (
              <div>
                {/* Score Summary Cards */}
                {(() => {
                  const scores = profile?.outcomeScores ?? [];
                  const latestWithPhq9 = [...scores].reverse().find((s) => s.phq9 !== null);
                  const latestWithGad7 = [...scores].reverse().find((s) => s.gad7 !== null);
                  const firstWithPhq9 = scores.find((s) => s.phq9 !== null);
                  const firstWithGad7 = scores.find((s) => s.gad7 !== null);

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      {/* PHQ-9 Card */}
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium text-gray-500">PHQ-9 (Depression)</p>
                          {latestWithPhq9 && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getPhq9Severity(latestWithPhq9.phq9!).color}`}>
                              {getPhq9Severity(latestWithPhq9.phq9!).label}
                            </span>
                          )}
                        </div>
                        {latestWithPhq9 ? (
                          <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-gray-900">{latestWithPhq9.phq9}</span>
                            <span className="text-xs text-gray-400 mb-1">/ 27</span>
                            {firstWithPhq9 && firstWithPhq9 !== latestWithPhq9 && firstWithPhq9.phq9 !== null && (
                              <span className="flex items-center gap-0.5 text-xs mb-1">
                                {latestWithPhq9.phq9! < firstWithPhq9.phq9 ? (
                                  <><TrendingDown className="w-3 h-3 text-green-500" /><span className="text-green-600">{firstWithPhq9.phq9 - latestWithPhq9.phq9!} pts</span></>
                                ) : latestWithPhq9.phq9! > firstWithPhq9.phq9 ? (
                                  <><TrendingUp className="w-3 h-3 text-red-500" /><span className="text-red-600">+{latestWithPhq9.phq9! - firstWithPhq9.phq9} pts</span></>
                                ) : (
                                  <><Minus className="w-3 h-3 text-gray-400" /><span className="text-gray-500">No change</span></>
                                )}
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">Not recorded</p>
                        )}
                        {/* Mini bar chart */}
                        {scores.filter((s) => s.phq9 !== null).length > 1 && (
                          <div className="flex items-end gap-1 mt-3 h-8">
                            {scores.filter((s) => s.phq9 !== null).map((s, i) => (
                              <div
                                key={i}
                                className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-sm transition relative group"
                                style={{ height: `${Math.max(10, (s.phq9! / 27) * 100)}%` }}
                                title={`${s.date}: PHQ-9 = ${s.phq9}`}
                              >
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                                  {s.phq9}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* GAD-7 Card */}
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium text-gray-500">GAD-7 (Anxiety)</p>
                          {latestWithGad7 && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getGad7Severity(latestWithGad7.gad7!).color}`}>
                              {getGad7Severity(latestWithGad7.gad7!).label}
                            </span>
                          )}
                        </div>
                        {latestWithGad7 ? (
                          <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-gray-900">{latestWithGad7.gad7}</span>
                            <span className="text-xs text-gray-400 mb-1">/ 21</span>
                            {firstWithGad7 && firstWithGad7 !== latestWithGad7 && firstWithGad7.gad7 !== null && (
                              <span className="flex items-center gap-0.5 text-xs mb-1">
                                {latestWithGad7.gad7! < firstWithGad7.gad7 ? (
                                  <><TrendingDown className="w-3 h-3 text-green-500" /><span className="text-green-600">{firstWithGad7.gad7 - latestWithGad7.gad7!} pts</span></>
                                ) : latestWithGad7.gad7! > firstWithGad7.gad7 ? (
                                  <><TrendingUp className="w-3 h-3 text-red-500" /><span className="text-red-600">+{latestWithGad7.gad7! - firstWithGad7.gad7} pts</span></>
                                ) : (
                                  <><Minus className="w-3 h-3 text-gray-400" /><span className="text-gray-500">No change</span></>
                                )}
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">Not recorded</p>
                        )}
                        {/* Mini bar chart */}
                        {scores.filter((s) => s.gad7 !== null).length > 1 && (
                          <div className="flex items-end gap-1 mt-3 h-8">
                            {scores.filter((s) => s.gad7 !== null).map((s, i) => (
                              <div
                                key={i}
                                className="flex-1 bg-amber-200 hover:bg-amber-300 rounded-sm transition relative group"
                                style={{ height: `${Math.max(10, (s.gad7! / 21) * 100)}%` }}
                                title={`${s.date}: GAD-7 = ${s.gad7}`}
                              >
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                                  {s.gad7}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Score History Table */}
                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs">
                        <th className="text-left py-2 px-3 font-medium">Date</th>
                        <th className="text-center py-2 px-3 font-medium">PHQ-9</th>
                        <th className="text-center py-2 px-3 font-medium">GAD-7</th>
                        <th className="text-left py-2 px-3 font-medium">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...(profile?.outcomeScores ?? [])].reverse().map((entry, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="py-2 px-3 text-gray-700">{formatDateShort(entry.date)}</td>
                          <td className="py-2 px-3 text-center">
                            {entry.phq9 !== null ? (
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getPhq9Severity(entry.phq9).color}`}>
                                {entry.phq9}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {entry.gad7 !== null ? (
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getGad7Severity(entry.gad7).color}`}>
                                {entry.gad7}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-gray-500 text-xs">{entry.note || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

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
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-primary/30 transition-all group"
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
