'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, X, Sparkles, UserPlus, Mic, BarChart3, Check } from 'lucide-react';

/**
 * First-run onboarding tour.
 *
 * Shows on /dashboard when ANY of:
 *   - URL has ?onboarding=1 (set by Clerk afterSignUpUrl)
 *   - localStorage has no `sessionlens-onboarding-complete` flag AND the user
 *     has zero sessions yet (auto-detected via the optional `hasSessions` prop)
 *
 * It's a 4-step modal-style tour, not a tooltip-on-hover system. Tooltips
 * tied to specific DOM elements break easily as the layout evolves; a single
 * sequenced modal is robust and easier to localize. Each step ends in a CTA
 * that does the actual action (e.g. "Take me to add a client").
 *
 * Once dismissed/completed, sets the flag so it never reappears for that
 * browser. (Clearing localStorage replays the tour — handy for QA.)
 */

const STORAGE_KEY = 'sessionlens-onboarding-complete';

interface OnboardingTourProps {
  /**
   * Optional: parent can pass whether the user already has sessions. Used to
   * auto-show the tour for genuinely new users (no flag, no sessions). When
   * undefined, the tour only auto-shows if the URL has ?onboarding=1.
   */
  hasSessions?: boolean;
}

export function OnboardingTour({ hasSessions }: OnboardingTourProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const flag = window.localStorage.getItem(STORAGE_KEY);
    const queryFlag = searchParams.get('onboarding') === '1';
    // Open the tour if either:
    //  - the URL explicitly asks for it (post-signup redirect), OR
    //  - we haven't shown it yet AND the user has no sessions (genuine new user)
    if (queryFlag || (!flag && hasSessions === false)) {
      setOpen(true);
    }
  }, [searchParams, hasSessions]);

  const dismiss = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    }
    setOpen(false);
    // Strip ?onboarding=1 so a refresh doesn't re-trigger.
    if (searchParams.get('onboarding')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('onboarding');
      router.replace(url.pathname + (url.search ? url.search : ''));
    }
  };

  if (!open) return null;

  const steps = [
    {
      icon: Sparkles,
      title: 'Welcome to Session Polaris',
      body: (
        <>
          You’re about to turn therapy session transcripts into structured
          clinical insight. The next 90 seconds will get you to your first
          analysis.
        </>
      ),
      cta: 'Show me how',
      action: () => setStep(1),
    },
    {
      icon: UserPlus,
      title: 'Step 1 — Add a client',
      body: (
        <>
          Clients are referenced by code (e.g. <span className="font-mono font-semibold">CL-1042</span>),
          not real names. You can fill in age, gender, and presenting concerns
          later — only the code is required to start.
        </>
      ),
      cta: 'Take me to add a client',
      action: () => {
        dismiss();
        router.push('/dashboard/clients?new=1');
      },
    },
    {
      icon: Mic,
      title: 'Step 2 — Start a session',
      body: (
        <>
          Paste a transcript, upload an audio file, or record live. The
          analysis runs in 30–60 seconds and surfaces themes, risk flags,
          and similar archived cases.
        </>
      ),
      cta: 'Take me to a new session',
      action: () => {
        dismiss();
        router.push('/dashboard/session/new');
      },
    },
    {
      icon: BarChart3,
      title: 'Step 3 — Review and export',
      body: (
        <>
          Each session lands on a Summary page with hidden patterns, similar
          cases, and editable SOAP/DAP notes. The Full Report tab produces a
          clinician PDF and a patient-friendly version you can copy or email.
        </>
      ),
      cta: 'Got it — explore on my own',
      action: dismiss,
    },
  ];

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header bar with progress dots + dismiss */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-primary' : i < step ? 'w-2 bg-primary/40' : 'w-2 bg-gray-200'
                }`}
              />
            ))}
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss tour"
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-3">{current.title}</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-6">{current.body}</p>

          <div className="flex items-center justify-between gap-3">
            {step > 0 && !isLast ? (
              <button
                onClick={() => setStep(step - 1)}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium px-3 py-2"
              >
                Back
              </button>
            ) : (
              <button
                onClick={dismiss}
                className="text-sm text-gray-400 hover:text-gray-600 font-medium px-3 py-2"
              >
                Skip tour
              </button>
            )}
            <button
              onClick={current.action}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark shadow-sm transition-all"
            >
              {isLast ? <Check className="w-4 h-4" /> : null}
              {current.cta}
              {!isLast && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
