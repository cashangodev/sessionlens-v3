'use client';

import { useState } from 'react';
import {
  X,
  AlertTriangle,
  Archive,
  EyeOff,
  Trash2,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export type RemoveAction = 'archive' | 'hide' | 'delete';

interface RemoveOption {
  id: string;
  /** What gets done when this option is chosen. */
  action: RemoveAction;
  /** Audit-trail reason string sent to the API. */
  reason: string;
  /** Headline shown in the radio. */
  label: string;
  /** Plain-English description of what happens. */
  description: string;
  /** Whether this is a destructive (irreversible) action. */
  destructive: boolean;
}

const REMOVE_OPTIONS: RemoveOption[] = [
  {
    id: 'treatment-ended',
    action: 'archive',
    reason: 'Treatment ended — not a client anymore',
    label: 'Treatment ended — not a client anymore',
    description: 'Move to archive. Sessions and notes are preserved; the client is hidden from your main dashboard.',
    destructive: false,
  },
  {
    id: 'requested-deletion',
    action: 'delete',
    reason: 'Client requested data deletion',
    label: 'Client asked to be deleted',
    description: 'Permanently delete the client and all sessions. Used for right-to-be-forgotten requests. Cannot be undone.',
    destructive: true,
  },
  {
    id: 'wrong-info',
    action: 'delete',
    reason: 'Wrong info / created in error',
    label: 'Wrong info or created in error',
    description: 'Permanently delete the client and all sessions. Used when the record should never have existed. Cannot be undone.',
    destructive: true,
  },
  {
    id: 'hide',
    action: 'hide',
    reason: 'Hide from main dashboard',
    label: 'Just hide from main dashboard',
    description: 'Mark inactive. All data preserved; the client stays out of your default view but is easy to restore.',
    destructive: false,
  },
  {
    id: 'archive-reference',
    action: 'archive',
    reason: 'Keep in archives for reference',
    label: 'Keep in archives for reference',
    description: 'Move to archive. Same as "Treatment ended" but for documentation purposes — when you may want to look back at the case later.',
    destructive: false,
  },
];

interface RemoveClientModalProps {
  clientCode: string;
  sessionCount: number;
  onClose: () => void;
  /** Called after the API succeeds. The parent should redirect away from the client's page. */
  onRemoved: (action: RemoveAction) => void;
}

export function RemoveClientModal({ clientCode, sessionCount, onClose, onRemoved }: RemoveClientModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const selected = REMOVE_OPTIONS.find((o) => o.id === selectedId) || null;

  const handleSubmit = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${encodeURIComponent(clientCode)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: selected.action,
          reason: selected.reason,
          note: note.trim() || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        setError(json?.error || 'Failed to remove client.');
        setSubmitting(false);
        return;
      }
      onRemoved(selected.action);
    } catch {
      setError('Network error — please try again.');
      setSubmitting(false);
    }
  };

  const cta = selected
    ? selected.action === 'delete'
      ? 'Delete permanently'
      : selected.action === 'archive'
        ? 'Move to archive'
        : 'Hide client'
    : 'Choose an option';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-md w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="font-playfair text-xl font-bold text-gray-900">Remove client {clientCode}?</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {sessionCount > 0
                  ? `${sessionCount} session${sessionCount === 1 ? '' : 's'} will be affected. Choose what should happen below — your reason is recorded for the audit trail.`
                  : 'No sessions on file. Choose what should happen below — your reason is recorded for the audit trail.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {REMOVE_OPTIONS.map((opt) => {
            const checked = selectedId === opt.id;
            const Icon = opt.action === 'delete' ? Trash2 : opt.action === 'archive' ? Archive : EyeOff;
            const accentColor = opt.destructive
              ? checked ? 'border-rose-300 bg-rose-50' : 'border-gray-200 hover:border-rose-200'
              : checked ? 'border-primary/40 bg-primary/5' : 'border-gray-200 hover:border-primary/30';
            const iconColor = opt.destructive
              ? checked ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-500'
              : checked ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500';

            return (
              <label
                key={opt.id}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${accentColor}`}
              >
                <input
                  type="radio"
                  name="remove-option"
                  value={opt.id}
                  checked={checked}
                  onChange={() => setSelectedId(opt.id)}
                  className="sr-only"
                />
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-gray-900">{opt.label}</p>
                    {opt.destructive && (
                      <span className="text-[10px] font-bold uppercase bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full">
                        Permanent
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed mt-1">{opt.description}</p>
                </div>
                <div className="flex-shrink-0 mt-1">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                      checked
                        ? opt.destructive ? 'border-rose-600 bg-rose-600' : 'border-primary bg-primary'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {checked && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                </div>
              </label>
            );
          })}

          {/* Optional note */}
          <div className="pt-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-2">
              Optional note
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything else worth recording in the audit trail (kept on the client record only)…"
              rows={2}
              className="w-full text-sm text-gray-700 leading-relaxed bg-white border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary resize-y"
            />
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selected || submitting}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white ${
              selected?.destructive
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-primary hover:bg-primary-dark'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Working…
              </>
            ) : (
              cta
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
