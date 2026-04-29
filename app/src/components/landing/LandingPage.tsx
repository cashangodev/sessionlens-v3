'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Eye,
  Network,
  ShieldCheck,
  FileSearch,
  Stethoscope,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import { DemoRequestModal } from './DemoRequestModal';

/**
 * Public landing page — calm · clinical · considered.
 *
 * Aesthetic lane: medical journal × Linear restraint. Not Stripe-tech, not
 * Liquid-Death-loud, not editorial-magazine. The page commits to:
 *
 *  - Two surface tones only — #FAFAF8 (page) and #FFFFFF (separation).
 *  - Hairline borders, never shadow, for elevation.
 *  - Deep teal (#1D4343) reserved for two moments: Dataset section + primary CTAs.
 *  - One subtle entrance fade on first load. No hover transforms. No
 *    micro-animations. The page is mostly still.
 *  - Asymmetric left-aligned hero with one quiet visual artifact (the
 *    structure map) on the right. Not a centered icon-title-subtitle stack.
 *
 * Section order (top to bottom):
 *   1. Sticky top nav
 *   2. Hero — left text, right structure-map SVG
 *   3. Numbers strip (10 / 60s / Zero)
 *   4. Capabilities — single column of 6 rows, hairline dividers
 *   5. Dataset — the one big color moment
 *   6. How it works — 3 steps, quiet
 *   7. Pricing — two same-surface cards
 *   8. Founders cohort band — single standalone line
 *   9. Final CTA
 *  10. Footer
 *
 * `demoSource` tracks which CTA opened the modal so we can later analyze
 * which section converts best (stored in demo_requests.source).
 */
export function LandingPage() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoSource, setDemoSource] = useState('landing-hero');

  const openDemo = (source: string) => {
    setDemoSource(source);
    setDemoOpen(true);
  };

  return (
    <div className="min-h-screen bg-bg-warm text-gray-900">
      {/* ─── 1. Sticky top nav ──────────────────────────────────────── */}
      <header className="border-b border-gray-200 bg-bg-warm/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-playfair text-xl font-semibold tracking-tight">SessionLens</span>
          <div className="flex items-center gap-1">
            <Link
              href="/sign-in"
              className="text-sm text-gray-700 hover:text-gray-900 px-3 py-2"
            >
              Sign in
            </Link>
            <button
              onClick={() => openDemo('landing-nav')}
              className="text-sm font-medium bg-primary-dark text-white px-4 py-2 rounded-md hover:bg-primary"
            >
              Request a demo
            </button>
          </div>
        </div>
      </header>

      {/* ─── 2. Hero ────────────────────────────────────────────────── */}
      {/* Asymmetric two-column at lg+. On smaller screens the artifact is
          hidden — text alone is enough. The fade-in is the page's only
          entrance motion. */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 lg:pt-28 lg:pb-32 fade-in-once">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-20 items-center">
          <div className="max-w-xl">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500 mb-6">
              For psychotherapists · By clinical researchers
            </p>
            <h1
              className="font-playfair font-semibold leading-[1.05] tracking-[-0.02em] text-gray-900"
              style={{ fontSize: 'clamp(2.75rem, 6vw, 5rem)' }}
            >
              See the <em className="italic font-normal text-primary-dark">structure</em><br />
              of every session.
            </h1>
            <p className="mt-7 text-lg text-gray-600 leading-relaxed" style={{ maxWidth: '52ch' }}>
              SessionLens turns therapy session transcripts into clinical insight grounded
              in <strong className="font-semibold text-gray-900">10,000+ lived-experience archives</strong> coded
              by domain experts.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                onClick={() => openDemo('landing-hero')}
                className="text-sm font-medium bg-primary-dark text-white px-5 py-3 rounded-md hover:bg-primary"
              >
                Request a demo
              </button>
              {/* Soft secondary CTA — anchors to the inline example below.
                  Captures the 70% of visitors not ready for a sales call. */}
              <a
                href="#example"
                className="text-sm font-medium text-gray-900 hover:text-primary-dark px-1 py-3"
              >
                See an example →
              </a>
            </div>
            <p className="mt-12 text-xs text-gray-400">
              Founders cohort · Sign-in by invitation · GDPR-compliant
            </p>
          </div>

          {/* Quiet structural artifact — not decoration. Static SVG. */}
          <div className="hidden lg:block">
            <StructureMap />
          </div>
        </div>
      </section>

      {/* ─── 3. Numbers strip ───────────────────────────────────────── */}
      <section className="border-y border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <NumberLine n="10" label="phenomenological dimensions coded per session" />
          <NumberLine n="60s" label="from transcript paste to clinical insight" />
          <NumberLine n="Zero" label="training on your client data — ever" />
        </div>
      </section>

      {/* ─── 3b. Example output — the page's product proof ─────────── */}
      {/* Inline before/after card: a short anonymized exchange on the
          left, the system's coded output on the right. The single most
          important conversion asset on the page — the audit identified
          "no product visual" as the #1 leak. Static, no animation. */}
      <section id="example" className="bg-bg-warm">
        <div className="max-w-6xl mx-auto px-6 py-28 lg:py-32 scroll-mt-20">
          <div className="mb-14 max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500 mb-4">
              Example output
            </p>
            <h2 className="font-playfair text-3xl font-semibold tracking-tight text-gray-900">
              From a 30-second exchange — to coded clinical insight.
            </h2>
            <p className="mt-3 text-base text-gray-600" style={{ maxWidth: '60ch' }}>
              Anonymized session moment on the left. SessionLens output on the right.
              Every claim ties back to the verbatim quote.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 border border-gray-200 bg-white rounded-md overflow-hidden">
            {/* Transcript pane */}
            <div className="p-7 border-b md:border-b-0 md:border-r border-gray-200">
              <p className="text-[10px] uppercase tracking-[0.16em] text-gray-400 mb-4">
                Transcript · Session #4 · CL-1042
              </p>
              <div className="space-y-4 text-sm leading-relaxed text-gray-800 font-mono">
                <p>
                  <span className="text-gray-400">CL:</span>{' '}
                  I — I just don&apos;t know why I keep getting these headaches before our
                  Sunday calls with my mother. They start Friday night.
                </p>
                <p>
                  <span className="text-gray-400">DR:</span>{' '}
                  You said &quot;I don&apos;t know why&quot; — but tell me what comes up if
                  you sit with it for a moment.
                </p>
                <p>
                  <span className="text-gray-400">CL:</span>{' '}
                  Like a tightness in my chest. I keep telling myself it&apos;s nothing.
                </p>
              </div>
            </div>

            {/* Analysis pane */}
            <div className="p-7 bg-bg-warm/50">
              <p className="text-[10px] uppercase tracking-[0.16em] text-gray-400 mb-4">
                SessionLens output
              </p>

              <div className="space-y-5">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-gray-500 mb-2">
                    Phenomenological tags
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Body · somatic anchor',
                      'Emotion · anticipatory anxiety',
                      'Social · family of origin',
                      'Reflective · invitation',
                      'Behaviour · suppression',
                    ].map((t) => (
                      <span
                        key={t}
                        className="text-[11px] text-gray-700 border border-gray-300 rounded px-2 py-0.5"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-gray-500 mb-2">
                    Hidden content cue
                  </p>
                  <p className="text-sm text-gray-800 leading-relaxed border-l-2 border-primary pl-3">
                    Anniversary-effect somatization preceding family-of-origin contact —
                    pattern present in <strong className="font-semibold">38 archived narratives</strong>.
                    <span className="block mt-1 text-xs text-gray-500 italic">
                      Surfaced for clinician only. Never inserted into notes.
                    </span>
                  </p>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-gray-500 mb-2">
                    SOAP excerpt — editable
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    <strong>S:</strong> Pre-contact somatic distress (headache, chest tightness)
                    Friday → Sunday. Verbal minimization of own bodily signal.
                    <span className="block mt-1 text-xs text-gray-400">
                      Tied to verbatim quote · Editable before export
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-6 text-xs text-gray-500 text-center">
            Anonymized illustration. SessionLens never trains on your client data.
          </p>
        </div>
      </section>

      {/* ─── 4. Capabilities — single column, hairline rows ─────────── */}
      <section className="max-w-3xl mx-auto px-6 py-28">
        <div className="mb-14">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500 mb-4">
            Capabilities
          </p>
          <h2 className="font-playfair text-3xl font-semibold tracking-tight text-gray-900">
            Six things no other tool does.
          </h2>
          <p className="mt-3 text-base text-gray-600" style={{ maxWidth: '60ch' }}>
            Built on a research framework, not generic prompts. Every capability ties back
            to a specific clinical decision.
          </p>
        </div>

        <div className="border-t border-gray-200">
          <CapabilityRow
            icon={Eye}
            title="Hidden Content surfacing"
            body="Patterns that structurally similar clients took weeks or months to verbalize — drawn from 10,000+ archived narratives. Surfaced only to the clinician as exploratory prompts. Never inserted into your notes. Never presented to your client."
          />
          <CapabilityRow
            icon={Network}
            title="Phenomenological mapping"
            body="Every moment coded across 10 structures: Body, Emotion, Cognitive, Reflective, Narrative, Social, Behaviour, Ecological, Normative, Prereflective."
          />
          <CapabilityRow
            icon={FileSearch}
            title="Triple-vector case matching"
            body="Match against 10,000+ lived-experience archives using semantic, structural, and clinical-metadata vectors. Truly similar cases, not keyword matches."
          />
          <CapabilityRow
            icon={Stethoscope}
            title="Practitioner methodology matching"
            body="Therapeutic approaches — CBT, ACT, EMDR, IPT — that have demonstrated efficacy for cases structurally similar to your client."
          />
          <CapabilityRow
            icon={BarChart3}
            title="PHQ-9 / GAD-7 outcome tracking"
            body="Validated depression and anxiety questionnaires built in. Trends across sessions. Suicidality items trigger clinical-follow-up flags."
          />
          <CapabilityRow
            icon={ShieldCheck}
            title="GDPR consent + audit trail"
            body="Per-session consent attestation. Append-only access log. Right-to-be-forgotten with one click."
          />
        </div>
      </section>

      {/* ─── 5. Dataset — the color moment ──────────────────────────── */}
      <section className="bg-primary-dark text-white">
        <div className="max-w-6xl mx-auto px-6 py-28">
          <div className="max-w-2xl mb-16">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/55 mb-4">
              The Dataset
            </p>
            <h2 className="font-playfair text-3xl md:text-4xl font-semibold tracking-tight leading-[1.15]">
              Built on real lived experience —<br />not generic conversation data.
            </h2>
            <p className="mt-5 text-base text-white/70" style={{ maxWidth: '60ch' }}>
              Other tools train on public chat logs and call-center transcripts.
              SessionLens matches against a curated archive of mental-health narratives
              coded by domain experts.
            </p>
          </div>

          {/* 10,000+ leads as the headline number — the lived-experience
              count is the credibility anchor. Coded-moment and structure-
              coding totals are derived from it (≈20 moments per experience,
              ×10 dimensions per moment) and scale accordingly. */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6 border-t border-white/15 pt-12">
            <Stat label="Lived experiences" value="10,000+" />
            <Stat label="Coded moments" value="200,000+" />
            <Stat label="Structure codings" value="2M+" />
            <Stat label="Practitioner methods" value="20+" />
          </div>

          <p className="mt-16 text-sm text-white/55" style={{ maxWidth: '60ch' }}>
            Framework draws on the Pattern Theory of Self (Gallagher 2013, Daly et&nbsp;al. 2024).
            Every claim ties back to a verbatim transcript moment via lineage popovers — no
            hallucinated insights.
          </p>
        </div>
      </section>

      {/* ─── 6. How it works ────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-28">
        <div className="mb-14">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500 mb-4">
            How a session flows
          </p>
          <h2 className="font-playfair text-3xl font-semibold tracking-tight text-gray-900">
            From your couch to the chart in under 90 seconds.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-10 max-w-5xl">
          <Step
            n="01"
            title="Capture"
            body="Paste a transcript, upload audio, or record live. Whisper auto-detects language. Per-session client consent is recorded before analysis runs."
          />
          <Step
            n="02"
            title="Analyze"
            body="In 60 seconds, get phenomenological coding, risk flags, hidden-content cues, similar archived cases, and matched practitioner methods."
          />
          <Step
            n="03"
            title="Export"
            body="Editable SOAP/DAP notes, patient-friendly summary, full clinician PDF. Outcome scores tracked across sessions."
          />
        </div>
      </section>

      {/* ─── 7. Pricing ─────────────────────────────────────────────── */}
      <section id="pricing" className="bg-white border-y border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-28">
          <div className="mb-14 text-center">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500 mb-4">
              Pricing
            </p>
            <h2 className="font-playfair text-3xl font-semibold tracking-tight text-gray-900">
              One per-clinician seat. Cancel any time.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-200 border border-gray-200 max-w-3xl mx-auto">
            {/* Monthly */}
            <PriceCard
              label="Monthly"
              amount="$99"
              cadence="/month"
              note="Per clinician seat. Billed monthly."
              cta="Request a demo"
              onClick={() => openDemo('landing-pricing-monthly')}
            />
            {/* Annual — heavier border, no tint */}
            <PriceCard
              label="Annual"
              amount="$990"
              cadence="/year"
              note="Per clinician seat. 2 months free vs. monthly."
              cta="Request a demo"
              primary
              onClick={() => openDemo('landing-pricing-annual')}
              badge="Save ~16%"
            />
          </div>
        </div>
      </section>

      {/* ─── 7a. For clinics & group practices ─────────────────────── */}
      {/* Honest interest-capture for multi-seat buyers. Team admin / SSO /
          supervisor workflows are NOT shipped yet — copy reflects that.
          Reserves the audience without overpromising. */}
      <section className="bg-white border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-12 items-start">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500 mb-4">
                For clinics &amp; group practices
              </p>
              <h2 className="font-playfair text-3xl font-semibold tracking-tight text-gray-900">
                Building team features with our founders cohort.
              </h2>
              <p className="mt-5 text-base text-gray-600" style={{ maxWidth: '52ch' }}>
                A coded phenomenological framework is the rare scaffolding that lets a
                first-year clinician produce notes with the consistency of a 15-year
                veteran. We&apos;re working with founders-cohort clinics on what that
                looks like at scale.
              </p>
              <button
                onClick={() => openDemo('landing-clinic')}
                className="mt-8 text-sm font-medium border border-gray-300 text-gray-900 px-5 py-3 rounded-md hover:border-gray-900"
              >
                Talk to our clinic team
              </button>
            </div>

            <ul className="space-y-5 md:pt-2 text-sm text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-primary-dark mt-px select-none">·</span>
                <span>
                  <strong className="font-semibold text-gray-900">Standardized note quality</strong>{' '}
                  — every clinician&apos;s output mapped to the same 10 dimensions, so
                  supervisors can review caseloads consistently.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-dark mt-px select-none">·</span>
                <span>
                  <strong className="font-semibold text-gray-900">Practice-wide outcome tracking</strong>{' '}
                  — PHQ-9 / GAD-7 trends aggregated across your team, not just individual caseloads.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-dark mt-px select-none">·</span>
                <span>
                  <strong className="font-semibold text-gray-900">In-design with founders cohort</strong>{' '}
                  — team admin, SSO, supervisor review workflows. Reserve early access
                  for your team and shape what we build.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─── 7b. Compliance & security strip ────────────────────────── */}
      {/* Honest claims only. GDPR + DPA we have today. BAA on request and
          sub-processors list are deliverables we'll produce when asked. SOC 2
          is intentionally NOT claimed — promise nothing aspirational here. */}
      <section className="bg-bg-warm border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500 mb-5 text-center">
            Compliance & Security
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 max-w-4xl mx-auto text-sm text-gray-700">
            <ComplianceItem label="GDPR-compliant" />
            <ComplianceItem label="DPA + BAA on request" />
            <ComplianceItem label="EU data residency" />
            <ComplianceItem label="Append-only audit log" />
            <ComplianceItem label="Per-session client consent" />
            <ComplianceItem label="Right-to-be-forgotten" />
            <ComplianceItem label="Encryption in transit + at rest" />
            <ComplianceItem label="No training on client data" />
          </div>
        </div>
      </section>

      {/* ─── 8. Founders cohort band ────────────────────────────────── */}
      {/* Single quiet line. Hairline rules top + bottom. The "17 remaining"
          token is the page's only color moment outside the Dataset section. */}
      <section className="bg-bg-warm">
        <div className="max-w-6xl mx-auto px-6 py-12 border-t border-b border-gray-200 text-center">
          <p className="text-sm text-gray-700">
            Founders cohort · 25 seats ·{' '}
            <span className="text-primary-dark font-medium">17 remaining</span> ·
            Pricing locked for life.
          </p>
        </div>
      </section>

      {/* ─── 9. Final CTA ───────────────────────────────────────────── */}
      {/* Headline previously read "See what you're missing" — surfaced as
          implying clinician inadequacy in the audit. Replaced with a
          straightforward offer line. */}
      <section className="max-w-3xl mx-auto px-6 py-28 text-center">
        <h2 className="font-playfair text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 leading-[1.15]">
          Walk through one of your own sessions.
        </h2>
        <p className="mt-5 text-base text-gray-600" style={{ maxWidth: '52ch', marginInline: 'auto' }}>
          Book a 30-minute demo. Bring an anonymized transcript and we&apos;ll
          run it live — no slide deck.
        </p>
        <div className="mt-10">
          <button
            onClick={() => openDemo('landing-final')}
            className="text-sm font-medium bg-primary-dark text-white px-6 py-3 rounded-md hover:bg-primary"
          >
            Request a demo
          </button>
        </div>
      </section>

      {/* ─── 10. Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-bg-warm">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr] gap-8 md:gap-12">
          <div>
            <p className="font-playfair text-lg font-semibold text-gray-900 mb-3">SessionLens</p>
            <p className="text-sm text-gray-600 leading-relaxed" style={{ maxWidth: '40ch' }}>
              Built by a team of psychotherapy researchers and ML engineers.
              Cashango Ltd · EU.
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500 mb-3">Product</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li><a href="#example" className="hover:text-primary-dark">Example output</a></li>
              <li><a href="#pricing" className="hover:text-primary-dark">Pricing</a></li>
              <li><Link href="/sign-in" className="hover:text-primary-dark">Sign in</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500 mb-3">Contact</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>
                <button onClick={() => openDemo('footer')} className="hover:text-primary-dark">
                  Request a demo
                </button>
              </li>
              <li><a href="mailto:contact@cashango.com" className="hover:text-primary-dark">contact@cashango.com</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} SessionLens · Cashango Ltd
            </p>
            <p className="text-xs text-gray-400">
              For licensed mental-health professionals · Clinical decision support — not a diagnostic tool
            </p>
          </div>
        </div>
      </footer>

      <DemoRequestModal open={demoOpen} onClose={() => setDemoOpen(false)} source={demoSource} />

      {/* Single page-level entrance: hero fade-in. Defined inline so we don't
          touch the project's globals.css. The animation runs once, then the
          page is still — no further motion budget. */}
      <style jsx>{`
        .fade-in-once {
          animation: fadeIn 600ms ease-out 0ms both;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .fade-in-once { animation: none; }
        }
      `}</style>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────── */

/**
 * "Structure map" — 10 nodes around a circle, faint connections.
 *
 * Animation: a SINGLE soft segment travels between two nodes, then jumps to
 * a different pair, and repeats. Reads as "the system is following one
 * thread of connection at a time," not "many things firing at once."
 *
 * Implementation:
 *  - A `tickIdx` state ticks every 4s via setInterval.
 *  - The active pair is picked via `(tickIdx * 7 + 3) % 10` — a coprime
 *    multiplier through 10 hand-picked pairs, so every pair is hit before
 *    repeating, but the visit order doesn't feel sequential.
 *  - The <line> uses `key={tickIdx}` so every tick remounts it — restarting
 *    the CSS sweep animation cleanly without stutter.
 *
 * Tunables:
 *  - 4000ms tick → swap to taste (slower = more meditative).
 *  - opacity 0.75 in keyframes (10% softer than the previous 0.85).
 *  - 3.6s sweep duration matches the 4s tick with a small rest gap.
 */
function StructureMap() {
  const cx = 220;
  const cy = 220;
  const r = 150;
  const nodes = Array.from({ length: 10 }, (_, i) => {
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      i,
    };
  });
  // Deterministic edges — every node connects to its 3 nearest neighbors
  // (offset 1, 2, and across by 5). Gives a regular but non-trivial mesh.
  const edges: Array<[number, number]> = [];
  for (let i = 0; i < nodes.length; i++) {
    for (const offset of [1, 2, 5]) {
      const j = (i + offset) % nodes.length;
      if (j > i) edges.push([i, j]);
    }
  }

  // Pre-built pair pool — every pair crosses the diagram (skips immediate
  // neighbors) so the visible line always has visual length.
  const pairs: Array<[number, number]> = [
    [0, 5], [1, 6], [3, 8], [7, 2], [4, 9],
    [6, 1], [8, 3], [0, 7], [2, 9], [5, 0],
  ];

  const [tickIdx, setTickIdx] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => {
      setTickIdx((n) => n + 1);
    }, 4000);
    return () => window.clearInterval(id);
  }, []);

  // Coprime-multiplier order through pairs — visits all 10 before repeating
  // but never feels sequential.
  const [a, b] = pairs[(tickIdx * 7 + 3) % pairs.length];

  return (
    <div className="structure-map w-full max-w-md ml-auto">
      <svg
        viewBox="0 0 440 440"
        className="w-full h-auto"
        role="img"
        aria-label="Schematic of the 10 phenomenological dimensions arranged around a circle. A single faint line travels between two dimensions at a time, jumping to a different pair every few seconds."
      >
        {/* Static layer: outer ring + dim edge mesh. */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E2E8F0" strokeWidth="1" />
        {edges.map(([ea, eb], idx) => (
          <line
            key={idx}
            x1={nodes[ea].x}
            y1={nodes[ea].y}
            x2={nodes[eb].x}
            y2={nodes[eb].y}
            stroke="#CBD5E1"
            strokeWidth="0.6"
          />
        ))}

        {/* Single active spark. The `key={tickIdx}` is load-bearing — it
            forces React to remount the element every tick, which restarts
            the CSS animation from frame 0 without needing JS animation. */}
        <line
          key={tickIdx}
          className="structure-spark"
          x1={nodes[a].x}
          y1={nodes[a].y}
          x2={nodes[b].x}
          y2={nodes[b].y}
          stroke="#1D4343"
          strokeWidth="1.6"
          strokeLinecap="round"
          pathLength={100}
        />

        {/* Static nodes. */}
        {nodes.map((n) => (
          <circle
            key={n.i}
            cx={n.x}
            cy={n.y}
            r={n.i % 3 === 0 ? 7 : 5}
            fill="#1D4343"
          />
        ))}
        {/* Center dot — the "session" itself. Static. */}
        <circle cx={cx} cy={cy} r="3" fill="#1D4343" />
      </svg>

      <style jsx>{`
        /* Single sweep, runs once per remount. Slow + softer than before:
             - 3.6s duration (was ~2.5s)
             - peak opacity 0.75 (was 0.85)
           A small rest gap (~0.4s) sits between the end of the sweep and
           the next tick at 4s. */
        .structure-map :global(.structure-spark) {
          stroke-dasharray: 30 200;
          stroke-dashoffset: 100;
          opacity: 0;
          animation: sparkTravel 3.6s cubic-bezier(0.4, 0, 0.6, 1) both;
        }
        @keyframes sparkTravel {
          0%   { stroke-dashoffset: 100;  opacity: 0;    }
          15%  {                          opacity: 0.75; }
          82%  {                          opacity: 0.75; }
          100% { stroke-dashoffset: -130; opacity: 0;    }
        }
        @media (prefers-reduced-motion: reduce) {
          .structure-map :global(.structure-spark) {
            animation: none;
            stroke-dasharray: none;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

function NumberLine({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <p className="font-playfair text-3xl font-semibold tracking-tight text-gray-900">{n}</p>
      <p className="text-sm text-gray-600 mt-1.5" style={{ maxWidth: '34ch' }}>
        {label}
      </p>
    </div>
  );
}

function CapabilityRow({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    // Hairline-divided horizontal row. No card, no shadow, no hover transform.
    // Icon is a quiet stroke glyph at the left, not a tinted square.
    <div className="grid grid-cols-[28px_1fr] gap-5 py-7 border-b border-gray-200">
      <Icon className="w-5 h-5 text-gray-700 mt-1" strokeWidth={1.5} />
      <div>
        <h3 className="text-base font-semibold text-gray-900 tracking-tight">{title}</h3>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed" style={{ maxWidth: '60ch' }}>
          {body}
        </p>
      </div>
    </div>
  );
}

function ComplianceItem({ label }: { label: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-primary-dark mt-0.5 select-none" aria-hidden>·</span>
      <span>{label}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-playfair text-4xl md:text-5xl font-semibold tracking-tight">{value}</p>
      <p className="text-white/60 text-xs mt-2 uppercase tracking-[0.12em]">{label}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <p className="font-mono text-xs text-gray-400 mb-3 tracking-widest">{n}</p>
      <h3 className="font-playfair text-xl font-semibold text-gray-900 mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed" style={{ maxWidth: '38ch' }}>
        {body}
      </p>
    </div>
  );
}

function PriceCard({
  label,
  amount,
  cadence,
  note,
  cta,
  onClick,
  primary,
  badge,
}: {
  label: string;
  amount: string;
  cadence: string;
  note: string;
  cta: string;
  onClick: () => void;
  primary?: boolean;
  badge?: string;
}) {
  return (
    // Two pricing cards sit on a hairline grid. The "primary" card is
    // distinguished by a CTA button color and a small text badge — NOT a
    // tinted background. Both cards have identical surfaces. Restraint.
    <div className="bg-white p-10 relative">
      <div className="flex items-baseline justify-between mb-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">{label}</p>
        {badge && (
          <span className="text-[10px] uppercase tracking-[0.14em] text-primary-dark font-medium">
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="font-playfair text-5xl font-semibold tracking-tight text-gray-900">{amount}</span>
        <span className="text-gray-500 text-sm">{cadence}</span>
      </div>
      <p className="text-sm text-gray-500 mb-8">{note}</p>

      <ul className="space-y-2.5 mb-10">
        {[
          'Unlimited session analyses',
          'PHQ-9 / GAD-7 outcome tracking',
          'SOAP / DAP note export',
          'Clinician PDF + patient summary',
          'GDPR consent + audit log',
          'Email support',
        ].map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
            <span className="text-gray-400 mt-px">·</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onClick}
        className={
          primary
            ? 'w-full text-sm font-medium bg-primary-dark text-white px-4 py-3 rounded-md hover:bg-primary'
            : 'w-full text-sm font-medium border border-gray-300 text-gray-900 px-4 py-3 rounded-md hover:border-gray-900'
        }
      >
        {cta}
      </button>
    </div>
  );
}
