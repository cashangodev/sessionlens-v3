'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Brain,
  Eye,
  Network,
  ShieldCheck,
  FileSearch,
  Stethoscope,
  Sparkles,
  ArrowRight,
  Check,
  BarChart3,
} from 'lucide-react';
import { DemoRequestModal } from './DemoRequestModal';

/**
 * Public landing page.
 *
 * One file with sub-sections inline so the whole thing reads top-to-bottom
 * like the page actually does. Sections:
 *   1. Top nav (logo + sign-in + CTA)
 *   2. Hero
 *   3. Differentiator strip ("What makes this different")
 *   4. 6-card feature grid (the things competitors don't have)
 *   5. Dataset stats (the moat)
 *   6. How it works (3 steps)
 *   7. Pricing (monthly + annual)
 *   8. Final CTA
 *   9. Footer
 *
 * The `demoSource` state lets us track which CTA opened the demo modal so
 * we can later analyze which section converts best (stored in
 * demo_requests.source).
 */
export function LandingPage() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoSource, setDemoSource] = useState('landing-hero');

  const openDemo = (source: string) => {
    setDemoSource(source);
    setDemoOpen(true);
  };

  return (
    <div className="min-h-screen bg-bg-warm">
      {/* ─── 1. Top nav ─────────────────────────────────────────────── */}
      <header className="border-b border-gray-200/60 bg-white/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-playfair text-2xl font-bold text-gray-900">SessionLens</span>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-gray-700 hover:text-primary transition px-3 py-2"
            >
              Sign in
            </Link>
            <button
              onClick={() => openDemo('landing-nav')}
              className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition"
            >
              Request a Demo
            </button>
          </div>
        </div>
      </header>

      {/* ─── 2. Hero ────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            For psychotherapists, by clinical researchers
          </div>
          <h1 className="font-playfair text-5xl md:text-6xl font-bold text-gray-900 leading-[1.05] tracking-tight">
            See the <span className="text-primary italic">structure</span><br />
            of every session.
          </h1>
          <p className="mt-6 text-xl text-gray-600 leading-relaxed max-w-2xl">
            SessionLens turns your therapy session transcripts into clinical
            insight grounded in <strong className="text-gray-900">14,600 coded moments</strong> from
            real lived-experience data — surfacing hidden patterns, risk
            signals, and evidence-matched practitioner approaches in 60 seconds.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <button
              onClick={() => openDemo('landing-hero')}
              className="flex items-center gap-2 px-6 py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark shadow-md hover:shadow-lg transition group"
            >
              Request a Demo
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <Link
              href="/sign-in"
              className="flex items-center gap-2 px-6 py-3.5 bg-white border border-gray-300 text-gray-900 rounded-xl font-semibold hover:border-primary hover:text-primary transition"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            Founders cohort · Sign-in by invitation only · GDPR-compliant
          </p>
        </div>
      </section>

      {/* ─── 3. Differentiator strip ────────────────────────────────── */}
      <section className="border-y border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-3xl font-playfair font-bold text-gray-900">10</p>
            <p className="text-sm text-gray-600 mt-1">phenomenological dimensions coded per session</p>
          </div>
          <div>
            <p className="text-3xl font-playfair font-bold text-gray-900">60s</p>
            <p className="text-sm text-gray-600 mt-1">from transcript paste to clinical insight</p>
          </div>
          <div>
            <p className="text-3xl font-playfair font-bold text-gray-900">Zero</p>
            <p className="text-sm text-gray-600 mt-1">training on your client data — ever</p>
          </div>
        </div>
      </section>

      {/* ─── 4. Feature grid ────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="font-playfair text-4xl font-bold text-gray-900">
            Six things no other tool does.
          </h2>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            Built on a research framework, not generic LLM prompts.
            Every feature ties back to a specific clinical decision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={Eye}
            title="Hidden Content surfacing"
            body="Spot themes the client hasn’t verbalized yet — pulled from similar archived stories. Not solutions to suggest, but invitations to explore in the next session."
            highlight
          />
          <FeatureCard
            icon={Network}
            title="Phenomenological mapping"
            body="Every moment is coded across 10 structures: Body, Emotion, Cognitive, Reflective, Narrative, Social, Behaviour, Ecological, Normative, Prereflective."
          />
          <FeatureCard
            icon={FileSearch}
            title="Triple-vector case matching"
            body="Match against 778 lived-experience archives using semantic + structural + clinical metadata vectors. Find truly similar cases, not just keyword matches."
          />
          <FeatureCard
            icon={Stethoscope}
            title="Practitioner methodology matching"
            body="See which therapeutic approaches (CBT, ACT, EMDR, IPT…) have demonstrated efficacy for cases structurally similar to your client."
          />
          <FeatureCard
            icon={BarChart3}
            title="PHQ-9 / GAD-7 outcome tracking"
            body="Validated depression and anxiety questionnaires built in. Trends visualized across sessions. Suicidality items trigger clinical-follow-up flags."
          />
          <FeatureCard
            icon={ShieldCheck}
            title="GDPR consent + audit trail"
            body="Per-session consent attestation (verbal/written/electronic). Append-only access log. Right-to-be-forgotten with one click."
          />
        </div>
      </section>

      {/* ─── 5. Dataset stats — the moat ────────────────────────────── */}
      <section className="bg-primary-dark text-white">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-12">
            <p className="text-primary-light text-sm font-semibold uppercase tracking-wider mb-3">The Dataset</p>
            <h2 className="font-playfair text-4xl font-bold">
              Built on real lived experience —<br />
              not generic conversation data.
            </h2>
            <p className="mt-4 text-white/70 max-w-2xl mx-auto">
              While other tools train on public chat logs and call-center transcripts,
              SessionLens matches against a curated archive of mental-health narratives
              coded by domain experts.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Stat label="Lived-experience stories" value="778" />
            <Stat label="Coded moments" value="14,600" />
            <Stat label="Structure codings" value="146,000" />
            <Stat label="Practitioner methods" value="20" />
          </div>

          <p className="mt-12 text-center text-white/60 text-sm max-w-2xl mx-auto">
            The framework draws on the Pattern Theory of Self (Gallagher 2013, Daly et&nbsp;al. 2024).
            Every claim ties back to a verbatim transcript moment via lineage popovers — no hallucinated insights.
          </p>
        </div>
      </section>

      {/* ─── 6. How it works ────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="font-playfair text-4xl font-bold text-gray-900">How a session flows.</h2>
          <p className="mt-3 text-gray-600">From your couch to the chart in under 90 seconds.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Step
            number="1"
            title="Capture"
            body="Paste a transcript, upload audio, or record live. Whisper auto-detects language. Per-session client consent is required and recorded."
          />
          <Step
            number="2"
            title="Analyze"
            body="In 60 seconds, get phenomenological coding, risk flags, hidden-content cues, similar archived cases, and matched practitioner methods."
          />
          <Step
            number="3"
            title="Export"
            body="Editable SOAP/DAP notes, patient-friendly summary, full clinician PDF. Outcome scores tracked across sessions."
          />
        </div>
      </section>

      {/* ─── 7. Pricing ─────────────────────────────────────────────── */}
      <section id="pricing" className="bg-white border-y border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-4xl font-bold text-gray-900">Simple pricing.</h2>
            <p className="mt-3 text-gray-600">One per-clinician seat. Cancel any time.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Monthly */}
            <div className="rounded-2xl border-2 border-gray-200 p-8 bg-white">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Monthly</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-5xl font-playfair font-bold text-gray-900">$99</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-sm text-gray-500 mb-6">Per clinician seat. Billed monthly.</p>
              <PriceFeatures />
              <button
                onClick={() => openDemo('landing-pricing-monthly')}
                className="mt-8 w-full px-4 py-3 border border-gray-300 text-gray-900 rounded-xl font-semibold hover:border-primary hover:text-primary transition"
              >
                Request a Demo
              </button>
            </div>

            {/* Annual — highlighted */}
            <div className="rounded-2xl border-2 border-primary p-8 bg-primary/5 relative">
              <span className="absolute -top-3 left-8 bg-primary text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                Save ~16%
              </span>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Annual</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-5xl font-playfair font-bold text-gray-900">$990</span>
                <span className="text-gray-500">/year</span>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Per clinician seat. <span className="text-primary font-semibold">2 months free</span> vs. monthly.
              </p>
              <PriceFeatures />
              <button
                onClick={() => openDemo('landing-pricing-annual')}
                className="mt-8 w-full px-4 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark shadow-sm transition"
              >
                Request a Demo
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-gray-400">
            Founders cohort: first 25 clinicians get founder-tier pricing locked for life.
          </p>
        </div>
      </section>

      {/* ─── 8. Final CTA ───────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h2 className="font-playfair text-4xl font-bold text-gray-900 max-w-2xl mx-auto leading-tight">
          See what you&apos;re missing in your sessions.
        </h2>
        <p className="mt-4 text-gray-600 max-w-xl mx-auto">
          Book a 30-minute walkthrough with one of your own anonymized sessions.
          We&apos;ll show what SessionLens surfaces — no slide deck.
        </p>
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => openDemo('landing-final')}
            className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark shadow-lg hover:shadow-xl transition group"
          >
            Request a Demo
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* ─── 9. Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} SessionLens · Cashango Ltd
          </p>
          <p className="text-xs text-gray-400">
            For licensed mental-health professionals · Clinical decision support — not a diagnostic tool
          </p>
        </div>
      </footer>

      <DemoRequestModal open={demoOpen} onClose={() => setDemoOpen(false)} source={demoSource} />
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────── */

function FeatureCard({
  icon: Icon,
  title,
  body,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-6 border transition-all duration-200 ${
        highlight
          ? 'bg-primary text-white border-primary shadow-lg'
          : 'bg-white border-gray-200 hover:border-primary/30 hover:shadow-md'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
          highlight ? 'bg-white/15' : 'bg-primary/10'
        }`}
      >
        <Icon className={`w-5 h-5 ${highlight ? 'text-white' : 'text-primary'}`} />
      </div>
      <h3 className={`font-playfair text-lg font-bold mb-2 ${highlight ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h3>
      <p className={`text-sm leading-relaxed ${highlight ? 'text-white/85' : 'text-gray-600'}`}>{body}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="font-playfair text-4xl md:text-5xl font-bold">{value}</p>
      <p className="text-white/70 text-sm mt-2">{label}</p>
    </div>
  );
}

function Step({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div>
      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-playfair text-2xl font-bold flex items-center justify-center mb-4">
        {number}
      </div>
      <h3 className="font-playfair text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
    </div>
  );
}

function PriceFeatures() {
  const features = [
    'Unlimited session analyses',
    'PHQ-9 / GAD-7 outcome tracking',
    'SOAP / DAP note export',
    'Clinician PDF + patient summary',
    'GDPR consent + audit log',
    'Email support',
  ];
  return (
    <ul className="space-y-2">
      {features.map((f) => (
        <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
          <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <span>{f}</span>
        </li>
      ))}
    </ul>
  );
}
