'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldCheck,
  AlertCircle,
  Lock,
  Edit3,
  Check,
  X,
  Info,
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

export interface SignOffRecord {
  signedAt: string; // ISO timestamp
  signedBy: string; // doctor name or identifier
  riskScore: number; // 1..100, doctor-assigned
  riskNote: string; // optional rationale
  reviewedAcknowledged: boolean; // confirmation checkbox
  /** Optional snapshot of which AI signals existed at sign-off — used for the AI-vs-clinician comparison strip. */
  aiSignalSnapshot?: {
    riskFlagCount: number;
    highSeverityFlagCount: number;
    distortionLoad?: number;
    suggestedPriority?: string;
  };
}

interface SessionSignOffProps {
  sessionId: string;
  /** Display name of the practitioner currently using the app. */
  doctorName: string;
  /** Snapshot of AI-detected signals at the moment of sign-off (used for the comparison row). */
  aiSnapshot: SignOffRecord['aiSignalSnapshot'];
}

const RISK_BANDS = [
  { min: 1, max: 30, label: 'Low', color: 'bg-emerald-500', text: 'text-emerald-700', soft: 'bg-emerald-50' },
  { min: 31, max: 65, label: 'Moderate', color: 'bg-amber-500', text: 'text-amber-700', soft: 'bg-amber-50' },
  { min: 66, max: 100, label: 'Elevated', color: 'bg-red-500', text: 'text-red-700', soft: 'bg-red-50' },
] as const;

function bandFor(score: number) {
  return RISK_BANDS.find((b) => score >= b.min && score <= b.max) ?? RISK_BANDS[0];
}

export function SessionSignOff({ sessionId, doctorName, aiSnapshot }: SessionSignOffProps) {
  const storageKey = `sessionlens-signoff-${sessionId}`;

  const [record, setRecord] = useState<SignOffRecord | null>(null);
  const [draftScore, setDraftScore] = useState<number>(20);
  const [draftNote, setDraftNote] = useState<string>('');
  const [acknowledged, setAcknowledged] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Load persisted sign-off
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as SignOffRecord;
        if (parsed && typeof parsed === 'object' && typeof parsed.riskScore === 'number') {
          setRecord(parsed);
        }
      }
    } catch {
      // corrupted entry — ignore
    }
  }, [storageKey]);

  const persist = useCallback(
    (next: SignOffRecord | null) => {
      setRecord(next);
      if (typeof window === 'undefined') return;
      try {
        if (next) {
          window.localStorage.setItem(storageKey, JSON.stringify(next));
        } else {
          window.localStorage.removeItem(storageKey);
        }
      } catch {
        // ignore quota / disabled
      }
    },
    [storageKey],
  );

  const startEdit = () => {
    setDraftScore(record?.riskScore ?? 20);
    setDraftNote(record?.riskNote ?? '');
    setAcknowledged(record?.reviewedAcknowledged ?? false);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const submit = () => {
    if (!acknowledged) return;
    const next: SignOffRecord = {
      signedAt: new Date().toISOString(),
      signedBy: doctorName,
      riskScore: draftScore,
      riskNote: draftNote.trim(),
      reviewedAcknowledged: true,
      aiSignalSnapshot: aiSnapshot,
    };
    persist(next);
    setIsEditing(false);
  };

  const reopen = () => {
    const ok = window.confirm(
      'Reopen this session for further edits? The current sign-off will be discarded — re-sign before exporting.',
    );
    if (!ok) return;
    persist(null);
    setIsEditing(true);
    setDraftScore(record?.riskScore ?? 20);
    setDraftNote(record?.riskNote ?? '');
    setAcknowledged(false);
  };

  const formNeeded = !record || isEditing;
  const band = useMemo(() => bandFor(formNeeded ? draftScore : record?.riskScore ?? 20), [formNeeded, draftScore, record]);

  // Comparison: did the AI flag anything that the clinician scored low? (or vice-versa)
  const mismatchNote = useMemo(() => {
    if (!record || !record.aiSignalSnapshot) return null;
    const snap = record.aiSignalSnapshot;
    const aiHigh = snap.highSeverityFlagCount > 0;
    const clinicianLow = record.riskScore <= 30;
    const clinicianHigh = record.riskScore >= 66;
    if (aiHigh && clinicianLow) {
      return `AI flagged ${snap.highSeverityFlagCount} high-severity signal${snap.highSeverityFlagCount === 1 ? '' : 's'}; clinician judged risk as low. Mismatch noted in audit trail.`;
    }
    if (!aiHigh && clinicianHigh) {
      return 'AI did not flag any high-severity signals; clinician judged risk as elevated. Clinician judgment overrides — additional context likely informed the call.';
    }
    return null;
  }, [record]);

  // ─── Signed-off view ───
  if (record && !isEditing) {
    const formattedDate = new Date(record.signedAt).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    return (
      <div className={`rounded-2xl border-2 ${band.soft} border-gray-200 overflow-hidden`}>
        <div className="px-5 py-4 bg-white/60 border-b border-gray-200 flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                Session signed off
                <Lock className="w-3.5 h-3.5 text-gray-400" />
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                by <span className="font-medium text-gray-700">{record.signedBy}</span> &middot; {formattedDate}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={reopen}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Reopen &amp; re-sign
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Doctor risk score */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                Clinician-assigned risk
                <InfoTooltip
                  title="Clinician-assigned risk score"
                  description="A 1–100 score the practitioner sets at the end of each session, reflecting their own clinical judgment about the client's current risk picture. This is the ONLY authoritative risk score in Session Polaris — the AI never assigns a risk verdict."
                  methodology="Bands: 1–30 = Low, 31–65 = Moderate, 66–100 = Elevated. The clinician may set any value; the bands are visual anchors, not categorical labels. The optional rationale is captured alongside for the audit trail."
                />
              </p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${band.text} ${band.soft}`}>
                {band.label}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${band.color}`}
                  style={{ width: `${record.riskScore}%` }}
                />
              </div>
              <span className="text-2xl font-bold text-gray-900 font-mono w-16 text-right tabular-nums">
                {record.riskScore}
                <span className="text-sm text-gray-400 font-normal">/100</span>
              </span>
            </div>
            {record.riskNote && (
              <p className="text-sm text-gray-700 mt-3 italic leading-relaxed pl-3 border-l-2 border-gray-200">
                &ldquo;{record.riskNote}&rdquo;
              </p>
            )}
          </div>

          {/* AI vs Clinician comparison */}
          {record.aiSignalSnapshot && (
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">AI vs clinician at sign-off</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">AI signals detected</p>
                  <p className="text-gray-700">
                    <span className="font-mono font-bold text-gray-900">{record.aiSignalSnapshot.riskFlagCount}</span> total flags
                    {record.aiSignalSnapshot.highSeverityFlagCount > 0 && (
                      <>
                        {' · '}
                        <span className="font-mono font-bold text-red-600">{record.aiSignalSnapshot.highSeverityFlagCount}</span> high-severity
                      </>
                    )}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Clinician judgment</p>
                  <p className="text-gray-700">
                    <span className={`font-mono font-bold ${band.text}`}>{record.riskScore}/100</span> &middot; {band.label}
                  </p>
                </div>
              </div>
              {mismatchNote && (
                <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">{mismatchNote}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Sign-off form ───
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/40 overflow-hidden">
      <div className="px-5 py-4 bg-white border-b border-gray-200 flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              Sign off this session
              <InfoTooltip
                title="Why sign-off matters"
                description="Sign-off draws the line between AI-generated draft content and clinician judgment. Once signed, the session record is locked, the clinician's risk score becomes the authoritative one, and the audit trail records who reviewed what and when."
                methodology="At sign-off, Session Polaris captures: doctor name, timestamp, the clinician-assigned risk score (1–100), the optional rationale, and a snapshot of which AI signals existed at that moment so any later mismatch can be reviewed. Currently persisted to localStorage — Supabase persistence is the next iteration."
              />
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Set your own risk assessment and confirm the session is ready to record.
            </p>
          </div>
        </div>
        {isEditing && record && (
          <button
            onClick={cancelEdit}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
        )}
        {!record && !isEditing && (
          <button
            onClick={startEdit}
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-dark px-3 py-1.5 rounded-lg transition"
          >
            Begin sign-off
          </button>
        )}
      </div>

      {(isEditing || !record) && isEditing && (
        <div className="px-5 py-5 space-y-5">
          {/* Risk slider */}
          <div>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                Your risk score
                <span className="text-gray-400 font-normal normal-case tracking-normal">(1–100)</span>
                <InfoTooltip
                  title="Clinician risk score"
                  description="Your own clinical judgment of this client's current risk picture, on a 1–100 scale. Only you can set this — the AI doesn't suggest a number. Bands are visual anchors only: 1–30 Low, 31–65 Moderate, 66–100 Elevated."
                  methodology="Stored alongside an AI-signal snapshot so any mismatch is auditable later (e.g. AI flagged 3 high-severity signals but you scored the session 22 — your judgment is the authoritative call, the snapshot just records the divergence)."
                />
              </label>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${band.text} ${band.soft}`}>
                {band.label}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={100}
                value={draftScore}
                onChange={(e) => setDraftScore(parseInt(e.target.value, 10))}
                className="flex-1 h-2 bg-gradient-to-r from-emerald-300 via-amber-300 to-red-400 rounded-full appearance-none cursor-pointer accent-gray-700"
                aria-label="Clinician-assigned risk score"
              />
              <span className="text-2xl font-bold text-gray-900 font-mono w-16 text-right tabular-nums">
                {draftScore}
                <span className="text-sm text-gray-400 font-normal">/100</span>
              </span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1">
              <span>1 · Low</span>
              <span>30</span>
              <span>65</span>
              <span>100 · Elevated</span>
            </div>
          </div>

          {/* Risk note */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2 block">
              Brief rationale <span className="text-gray-400 font-normal normal-case tracking-normal">(optional but recommended)</span>
            </label>
            <textarea
              value={draftNote}
              onChange={(e) => setDraftNote(e.target.value)}
              placeholder="What informed your score? (e.g. 'Client engaged well, behavioral activation in place; monitoring panic frequency.')"
              rows={3}
              className="w-full text-sm text-gray-700 leading-relaxed bg-white border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary resize-y"
            />
          </div>

          {/* Confirmation checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-primary cursor-pointer"
            />
            <span className="text-sm text-gray-700 leading-relaxed">
              I have reviewed the AI-generated content for accuracy. I understand this risk score reflects my clinical judgment, not the AI&apos;s.
            </span>
          </label>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <p className="text-[11px] text-gray-400 mr-auto inline-flex items-center gap-1">
              <Info className="w-3 h-3" />
              Once signed, the session record is locked. You can reopen and re-sign if needed.
            </p>
            <button
              onClick={submit}
              disabled={!acknowledged}
              className="flex items-center gap-1.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition"
            >
              <Check className="w-4 h-4" />
              Sign off &amp; lock session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
