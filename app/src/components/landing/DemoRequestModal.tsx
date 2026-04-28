'use client';

import { useState } from 'react';
import { X, Check, Loader2, Sparkles } from 'lucide-react';

/**
 * "Request a Demo" modal — public lead-capture form on the landing page.
 *
 * Submits to POST /api/demo-request which writes to the demo_requests
 * Supabase table. Required: email. Everything else optional.
 *
 * On success: shows a thank-you state (modal stays open until user closes).
 * On failure: shows the error inline; user can retry.
 *
 * Field caps + email regex are enforced server-side too — this is just UX
 * polish to give immediate feedback.
 */

interface Props {
  open: boolean;
  onClose: () => void;
  /** Tracks WHICH CTA opened the modal — useful for funnel analytics later. */
  source?: string;
}

export function DemoRequestModal({ open, onClose, source = 'landing' }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const reset = () => {
    setName(''); setEmail(''); setOrganization(''); setRole(''); setMessage('');
    setSuccess(false); setError(''); setSubmitting(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, organization, role, message, source }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-playfair text-xl font-bold text-gray-900">
              {success ? 'Thanks!' : 'Request a Demo'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          /* Thank-you state — replaces the form, gives a small next-step
             so the lead doesn't feel left in limbo. */
          <div className="px-6 py-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-green-600" />
            </div>
            <p className="text-sm text-gray-700 mb-1">
              We received your request from <span className="font-mono font-semibold text-gray-900">{email}</span>.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              We&apos;ll be in touch within 1 business day to schedule a walkthrough.
            </p>
            <button
              onClick={handleClose}
              className="w-full px-4 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dr.smith@clinic.com"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Sarah Smith"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Role</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Psychotherapist"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Organization</label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Private practice / clinic name"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">What&apos;s on your mind?</label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What you'd like the demo to focus on..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
              />
            </div>
            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {submitting ? 'Sending…' : 'Request a Demo'}
            </button>
            <p className="text-[11px] text-gray-400 text-center pt-1">
              We&apos;ll only use this to schedule a demo. No marketing emails.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
