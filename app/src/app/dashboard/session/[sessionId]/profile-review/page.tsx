'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApi } from '@/hooks/use-api';
import type { AnalysisResult } from '@/types';
import {
  extractProfileFromAnalysis,
  ClientProfile,
} from '@/lib/client-profile';

interface SessionData {
  id: string;
  clientCode: string;
  sessionNumber: number;
  transcript: string;
  treatmentGoals: string;
  date: string;
  time: string;
  status: string;
  analysisResult: AnalysisResult | null;
  createdAt: string;
}
import { Card } from '@/components/ui/Card';
import {
  UserCircle,
  Target,
  AlertCircle,
  Brain,
  Stethoscope,
  FileText,
  Check,
  X,
  Plus,
  Edit3,
  Sparkles,
  ChevronRight,
  Info,
  Shield,
  Loader2,
} from 'lucide-react';

export default function ProfileReviewPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const { data, loading } = useApi<{ session: SessionData }>(`/api/sessions/${sessionId}`);
  const session = data?.session || null;

  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState('');
  const [newConcern, setNewConcern] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [preferredApproach, setPreferredApproach] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (!session) return;

    const loadProfile = async () => {
      setProfileLoading(true);
      try {
        // Check if profile already exists via API
        const res = await fetch(`/api/clients/${session.clientCode}`);
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setProfile(data.profile);
            setClinicalNotes(data.profile.clinicalNotes);
            setPreferredApproach(data.profile.preferredApproach);
            setProfileLoading(false);
            return;
          }
        }
      } catch {
        // Profile doesn't exist, extract from analysis
      }

      // Extract from analysis
      const extracted = extractProfileFromAnalysis(
        session.clientCode,
        session.transcript,
        session.analysisResult as AnalysisResult,
        session.treatmentGoals
      );

      // Store via API
      try {
        await fetch(`/api/clients/${session.clientCode}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(extracted),
        });
      } catch {
        // Best-effort store
      }

      setProfile(extracted);
      setClinicalNotes(extracted.clinicalNotes);
      setPreferredApproach(extracted.preferredApproach);
      setProfileLoading(false);
    };

    loadProfile();
  }, [session]);

  if (loading || profileLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (!session || !profile) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <Card className="p-8 text-center">
          <h3 className="font-playfair text-2xl font-bold text-gray-900 mb-2">Session Not Found</h3>
          <p className="text-gray-600">This session may have expired.</p>
        </Card>
      </div>
    );
  }

  const handleAddGoal = () => {
    if (!newGoal.trim() || !profile) return;
    const updated = { ...profile, treatmentGoals: [...profile.treatmentGoals, newGoal.trim()] };
    setProfile(updated);
    setNewGoal('');
  };

  const handleRemoveGoal = (index: number) => {
    if (!profile) return;
    const updated = { ...profile, treatmentGoals: profile.treatmentGoals.filter((_, i) => i !== index) };
    setProfile(updated);
  };

  const handleAddConcern = () => {
    if (!newConcern.trim() || !profile) return;
    const updated = { ...profile, presentingConcerns: [...profile.presentingConcerns, newConcern.trim()] };
    setProfile(updated);
    setNewConcern('');
  };

  const handleRemoveConcern = (index: number) => {
    if (!profile) return;
    const updated = { ...profile, presentingConcerns: profile.presentingConcerns.filter((_, i) => i !== index) };
    setProfile(updated);
  };

  const handleConfirmProfile = async () => {
    if (!profile || !session) return;
    const confirmed: ClientProfile = {
      ...profile,
      clinicalNotes,
      preferredApproach,
      isConfirmed: true,
      lastConfirmedAt: new Date().toISOString(),
    };
    try {
      await fetch(`/api/clients/${session.clientCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(confirmed),
      });
    } catch {
      // Best-effort store
    }
    // Continue to analysis
    router.push(`/dashboard/session/${sessionId}/summary`);
  };

  const handleSkip = async () => {
    // Save unconfirmed and go to analysis
    if (profile && session) {
      try {
        await fetch(`/api/clients/${session.clientCode}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...profile, clinicalNotes, preferredApproach }),
        });
      } catch {
        // Best-effort store
      }
    }
    router.push(`/dashboard/session/${sessionId}/summary`);
  };

  const approachOptions = [
    'Cognitive Behavioral Therapy (CBT)',
    'Acceptance and Commitment Therapy (ACT)',
    'Compassion-Focused Therapy (CFT)',
    'Psychodynamic Therapy',
    'Interpersonal Therapy (IPT)',
    'Trauma-focused therapy (EMDR/CPT)',
    'Dialectical Behavior Therapy (DBT)',
    'Schema Therapy',
    'Narrative Therapy',
    'Somatic Experiencing',
    'Mindfulness-Based Cognitive Therapy (MBCT)',
    'Integrative approach — to be determined',
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <UserCircle className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="font-playfair text-2xl font-bold text-gray-900">Client Profile</h2>
            <p className="text-sm text-gray-500">
              <span className="font-mono font-semibold text-primary">{profile.clientCode}</span>
              {' '}&middot; First session analysis complete
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-xl p-5 border border-primary/10">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">AI-Generated Profile</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Based on the session transcript, we&apos;ve extracted treatment goals, presenting concerns,
                and clinical parameters. Please review and edit as needed, then confirm.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Treatment Goals */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-gray-900">Treatment Goals</h3>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">AI-extracted</span>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {profile.treatmentGoals.map((goal, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg group">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="flex-1 text-sm text-gray-700">{goal}</p>
                <button
                  onClick={() => handleRemoveGoal(i)}
                  className="flex-shrink-0 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {profile.treatmentGoals.length === 0 && (
              <p className="text-sm text-gray-400 italic p-3">No treatment goals detected. Add manually below.</p>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
              placeholder="Add a treatment goal..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
            <button
              onClick={handleAddGoal}
              disabled={!newGoal.trim()}
              className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </Card>

        {/* Presenting Concerns */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-gray-900">Presenting Concerns</h3>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">AI-extracted</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {profile.presentingConcerns.map((concern, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 rounded-full text-sm group"
              >
                {concern}
                <button
                  onClick={() => handleRemoveConcern(i)}
                  className="text-amber-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {profile.presentingConcerns.length === 0 && (
              <p className="text-sm text-gray-400 italic">No presenting concerns detected.</p>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newConcern}
              onChange={(e) => setNewConcern(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddConcern()}
              placeholder="Add a presenting concern..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
            <button
              onClick={handleAddConcern}
              disabled={!newConcern.trim()}
              className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </Card>

        {/* Diagnostic Considerations */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Stethoscope className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Diagnostic Considerations</h3>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">AI-suggested</span>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
            <Shield className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              <strong>NOT diagnoses.</strong> These are AI-suggested considerations for your clinical evaluation only.
            </p>
          </div>

          <div className="space-y-2">
            {profile.diagnosticConsiderations.map((dx, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-400 mt-0.5">•</span>
                <p className="text-sm text-gray-700">{dx}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Risk Level & Structures */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className={`w-5 h-5 ${
                profile.currentRiskLevel === 'high' ? 'text-red-500' : profile.currentRiskLevel === 'moderate' ? 'text-amber-500' : 'text-green-500'
              }`} />
              <h3 className="font-semibold text-gray-900">Current Risk Level</h3>
            </div>
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
              profile.currentRiskLevel === 'high'
                ? 'bg-red-100 text-red-700'
                : profile.currentRiskLevel === 'moderate'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-green-100 text-green-700'
            }`}>
              {profile.currentRiskLevel.charAt(0).toUpperCase() + profile.currentRiskLevel.slice(1)}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-gray-900">Dominant Structures</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {(profile.dominantStructures || []).map((s) => (
                <span key={s} className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                  {s.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </Card>
        </div>

        {/* Preferred Approach */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-gray-900">Therapeutic Approach</h3>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">AI-suggested</span>
          </div>

          <select
            value={preferredApproach}
            onChange={(e) => setPreferredApproach(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          >
            {approachOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </Card>

        {/* Clinical Notes */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Edit3 className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Your Clinical Notes</h3>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">optional</span>
          </div>

          <textarea
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            placeholder="Add any clinical observations, context, or notes about this client that the AI wouldn't know..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-y"
          />
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 pt-4 pb-12">
          <button
            onClick={handleSkip}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all text-sm"
          >
            Skip for now
          </button>
          <button
            onClick={handleConfirmProfile}
            className="flex-1 px-8 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Confirm Profile & View Analysis
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center pb-8 flex items-center justify-center gap-1">
          <Info className="w-3 h-3" />
          You can always edit this profile later. It will auto-update with each new session.
        </p>
      </div>
    </div>
  );
}
