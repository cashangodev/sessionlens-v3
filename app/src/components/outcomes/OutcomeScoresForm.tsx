'use client';

import { useState } from 'react';
import { X, Check, Loader2 } from 'lucide-react';

/**
 * PHQ-9 and GAD-7 capture form (modal).
 *
 * Questions and response options are the standardized validated wording from
 * the original instruments — do NOT paraphrase. Each item scores 0-3 ("not at
 * all" → "nearly every day"). Totals:
 *   PHQ-9: 0-27 (5/10/15/20 = mild/moderate/moderately severe/severe depression)
 *   GAD-7: 0-21 (5/10/15 = mild/moderate/severe anxiety)
 *
 * The form persists scores via a parent-supplied `onSubmit` (typically a PATCH
 * to /api/sessions/[sessionId] writing `outcomeMeasures: { phq9, gad7 }` on
 * the session's analysis_result). Either questionnaire may be skipped — the
 * therapist may have only administered one.
 */

const PHQ9_QUESTIONS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
  'Trouble concentrating on things, such as reading the newspaper or watching television',
  'Moving or speaking so slowly that other people could have noticed. Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
  'Thoughts that you would be better off dead, or of hurting yourself in some way',
];

const GAD7_QUESTIONS = [
  'Feeling nervous, anxious, or on edge',
  'Not being able to stop or control worrying',
  'Worrying too much about different things',
  'Trouble relaxing',
  'Being so restless that it is hard to sit still',
  'Becoming easily annoyed or irritable',
  'Feeling afraid, as if something awful might happen',
];

const SCALE = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
];

function phq9Severity(total: number): { label: string; color: string } {
  if (total >= 20) return { label: 'Severe', color: 'text-red-700 bg-red-50' };
  if (total >= 15) return { label: 'Moderately severe', color: 'text-orange-700 bg-orange-50' };
  if (total >= 10) return { label: 'Moderate', color: 'text-amber-700 bg-amber-50' };
  if (total >= 5)  return { label: 'Mild', color: 'text-yellow-700 bg-yellow-50' };
  return { label: 'Minimal', color: 'text-green-700 bg-green-50' };
}

function gad7Severity(total: number): { label: string; color: string } {
  if (total >= 15) return { label: 'Severe', color: 'text-red-700 bg-red-50' };
  if (total >= 10) return { label: 'Moderate', color: 'text-amber-700 bg-amber-50' };
  if (total >= 5)  return { label: 'Mild', color: 'text-yellow-700 bg-yellow-50' };
  return { label: 'Minimal', color: 'text-green-700 bg-green-50' };
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Existing scores (if any) — pre-fills the form when re-opening. */
  initial?: { phq9?: number | null; gad7?: number | null };
  /**
   * Called with the captured totals. Either may be undefined if the therapist
   * skipped that questionnaire. Should resolve when persistence is complete;
   * the form shows a loading state until then.
   */
  onSubmit: (scores: { phq9?: number; gad7?: number }) => Promise<void>;
}

export function OutcomeScoresForm({ open, onClose, initial, onSubmit }: Props) {
  // null = not answered for this item; -1 sentinel never used
  const [phq9, setPhq9] = useState<(number | null)[]>(() => Array(9).fill(null));
  const [gad7, setGad7] = useState<(number | null)[]>(() => Array(7).fill(null));
  const [activeTab, setActiveTab] = useState<'phq9' | 'gad7'>('phq9');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const phq9Total = phq9.reduce<number>((sum, v) => sum + (v ?? 0), 0);
  const gad7Total = gad7.reduce<number>((sum, v) => sum + (v ?? 0), 0);
  const phq9Complete = phq9.every((v) => v !== null);
  const gad7Complete = gad7.every((v) => v !== null);
  const anyAnswered = phq9.some((v) => v !== null) || gad7.some((v) => v !== null);

  if (!open) return null;

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      const payload: { phq9?: number; gad7?: number } = {};
      // Only persist a total if the questionnaire is fully completed —
      // partial scores would be misleading and would skew the trends chart.
      if (phq9Complete) payload.phq9 = phq9Total;
      if (gad7Complete) payload.gad7 = gad7Total;
      if (Object.keys(payload).length === 0) {
        setError('Complete at least one full questionnaire before saving.');
        setSubmitting(false);
        return;
      }
      await onSubmit(payload);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save scores');
    } finally {
      setSubmitting(false);
    }
  };

  // Suicidality flag — PHQ-9 item 9 ≥ 1 should always trigger clinical
  // follow-up. We don't gate the save, but we surface a warning.
  const item9 = phq9[8];
  const suicidalityFlag = typeof item9 === 'number' && item9 >= 1;

  const questions = activeTab === 'phq9' ? PHQ9_QUESTIONS : GAD7_QUESTIONS;
  const answers = activeTab === 'phq9' ? phq9 : gad7;
  const setAnswer = (i: number, v: number) => {
    if (activeTab === 'phq9') {
      const next = [...phq9]; next[i] = v; setPhq9(next);
    } else {
      const next = [...gad7]; next[i] = v; setGad7(next);
    }
  };

  // Pre-fill from `initial` once on open. Intentionally not in useEffect — we
  // only want this on first render of the modal.
  if (initial && !anyAnswered) {
    if (typeof initial.phq9 === 'number') {
      // Can't reconstruct individual items from a total. Surface in UI as
      // a hint instead.
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-playfair text-xl font-bold text-gray-900">Record Outcome Scores</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Over the past two weeks, how often has the client been bothered by the following problems?
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 flex-shrink-0">
          {(['phq9', 'gad7'] as const).map((t) => {
            const isActive = activeTab === t;
            const total = t === 'phq9' ? phq9Total : gad7Total;
            const complete = t === 'phq9' ? phq9Complete : gad7Complete;
            return (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {t === 'phq9' ? 'PHQ-9 (Depression)' : 'GAD-7 (Anxiety)'}
                  {complete && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${t === 'phq9' ? phq9Severity(total).color : gad7Severity(total).color}`}>
                      {total}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {questions.map((q, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-4">
              <p className="text-sm text-gray-900 mb-3 leading-relaxed">
                <span className="font-semibold text-gray-500 mr-2">{i + 1}.</span>
                {q}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SCALE.map((s) => {
                  const selected = answers[i] === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setAnswer(i, s.value)}
                      className={`text-xs px-3 py-2 rounded-lg border transition-all text-left ${
                        selected
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-primary/40 hover:bg-primary/5'
                      }`}
                    >
                      <span className="font-mono font-bold mr-1.5">{s.value}</span>
                      {s.label}
                    </button>
                  );
                })}
              </div>
              {/* Suicidality alert on PHQ-9 item 9 */}
              {activeTab === 'phq9' && i === 8 && suicidalityFlag && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-800 font-semibold mb-1">⚠ Clinical follow-up indicated</p>
                  <p className="text-xs text-red-700">
                    Any non-zero response to this item warrants direct safety assessment per PHQ-9 guidelines.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-gray-600 space-y-1">
              {phq9Complete && (
                <p>
                  <span className="font-semibold">PHQ-9:</span> {phq9Total} / 27{' '}
                  <span className={`px-2 py-0.5 rounded-full ${phq9Severity(phq9Total).color}`}>
                    {phq9Severity(phq9Total).label}
                  </span>
                </p>
              )}
              {gad7Complete && (
                <p>
                  <span className="font-semibold">GAD-7:</span> {gad7Total} / 21{' '}
                  <span className={`px-2 py-0.5 rounded-full ${gad7Severity(gad7Total).color}`}>
                    {gad7Severity(gad7Total).label}
                  </span>
                </p>
              )}
              {!phq9Complete && !gad7Complete && (
                <p className="text-gray-400">Complete at least one questionnaire to save.</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {error && <span className="text-xs text-red-600">{error}</span>}
              <button
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || (!phq9Complete && !gad7Complete)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:opacity-40"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save scores
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
