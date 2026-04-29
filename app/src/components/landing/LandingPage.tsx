'use client';

import { useState } from 'react';
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
              in 14,600 coded moments from real lived-experience data.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                onClick={() => openDemo('landing-hero')}
                className="text-sm font-medium bg-primary-dark text-white px-5 py-3 rounded-md hover:bg-primary"
              >
                Request a demo
              </button>
              <Link
                href="/sign-in"
                className="text-sm font-medium text-gray-900 hover:text-primary-dark px-1 py-3"
              >
                Sign in →
              </Link>
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
            body="Themes the client hasn't verbalized yet — pulled from similar archived stories. Not solutions to suggest, but invitations to explore in the next session."
          />
          <CapabilityRow
            icon={Network}
            title="Phenomenological mapping"
            body="Every moment coded across 10 structures: Body, Emotion, Cognitive, Reflective, Narrative, Social, Behaviour, Ecological, Normative, Prereflective."
          />
          <CapabilityRow
            icon={FileSearch}
            title="Triple-vector case matching"
            body="Match against 778 lived-experience archives using semantic, structural, and clinical-metadata vectors. Truly similar cases, not keyword matches."
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6 border-t border-white/15 pt-12">
            <Stat label="Lived-experience stories" value="778" />
            <Stat label="Coded moments" value="14,600" />
            <Stat label="Structure codings" value="146,000" />
            <Stat label="Practitioner methods" value="20" />
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
      <section className="max-w-3xl mx-auto px-6 py-28 text-center">
        <h2 className="font-playfair text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 leading-[1.15]">
          See what you&apos;re missing in your sessions.
        </h2>
        <p className="mt-5 text-base text-gray-600" style={{ maxWidth: '52ch', marginInline: 'auto' }}>
          Book a 30-minute walkthrough with one of your own anonymized sessions.
          We&apos;ll show what SessionLens surfaces — no slide deck.
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
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} SessionLens · Cashango Ltd
          </p>
          <p className="text-xs text-gray-400">
            For licensed mental-health professionals · Clinical decision support — not a diagnostic tool
          </p>
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
 * Animation: short, soft sparks that travel between non-adjacent node pairs.
 * Multiple sparks fire continuously on staggered, prime-ish timings — they
 * never sync, so the eye sees different connections lighting up moment to
 * moment. Reads as "the system is finding interconnections across the
 * client's experience," not as a marching pattern.
 *
 * Each spark:
 *  - is a single <line> between two nodes, normalized to pathLength=100
 *  - has a 30% visible dasharray segment that slides from "before A" to
 *    "after B", giving a brief swept-in/swept-out trail
 *  - varies in duration and start delay so the set never aligns
 *
 * Pairs were hand-picked to skip immediate neighbors — every spark crosses
 * meaningfully across the diagram (long diagonals + medium chords), no
 * rim-hugging. Symmetry is intentionally broken — the set isn't rotationally
 * uniform, which keeps the visual feel asymmetric/organic instead of
 * geometric.
 *
 * Static layers stay: outer ring, dim mesh, all 10 nodes. The sparks float
 * over them. `prefers-reduced-motion` collapses everything to fully static.
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

  // Spark connections. Each {a, b} pair is a single firing. Durations and
  // delays use prime-ish values so the set never repeats — the eye reads
  // this as random even though it's deterministic.
  const sparks: Array<{ a: number; b: number; dur: number; delay: number }> = [
    { a: 0, b: 5, dur: 2.6, delay: 0    },
    { a: 1, b: 6, dur: 2.3, delay: 0.7  },
    { a: 3, b: 8, dur: 2.9, delay: 1.4  },
    { a: 7, b: 2, dur: 2.4, delay: 0.3  },
    { a: 4, b: 9, dur: 2.7, delay: 1.9  },
    { a: 6, b: 1, dur: 2.5, delay: 2.4  },
    { a: 8, b: 3, dur: 2.8, delay: 1.1  },
    { a: 0, b: 7, dur: 2.2, delay: 2.1  },
    { a: 2, b: 9, dur: 3.1, delay: 0.9  },
    { a: 5, b: 0, dur: 2.6, delay: 1.6  },
  ];

  return (
    <div className="structure-map w-full max-w-md ml-auto">
      <svg
        viewBox="0 0 440 440"
        className="w-full h-auto"
        role="img"
        aria-label="Schematic of the 10 phenomenological dimensions arranged around a circle, with short connections briefly lighting up between dimensions across the diagram."
      >
        {/* Static layer: outer ring + dim edge mesh. */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E2E8F0" strokeWidth="1" />
        {edges.map(([a, b], idx) => (
          <line
            key={idx}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke="#CBD5E1"
            strokeWidth="0.6"
          />
        ))}

        {/* Spark layer — each line is invisible at rest; the animation
            sweeps a 30% visible segment from one end to the other. */}
        {sparks.map((s, idx) => (
          <line
            key={idx}
            className="structure-spark"
            x1={nodes[s.a].x}
            y1={nodes[s.a].y}
            x2={nodes[s.b].x}
            y2={nodes[s.b].y}
            stroke="#1D4343"
            strokeWidth="1.6"
            strokeLinecap="round"
            pathLength={100}
            style={{
              animationDuration: `${s.dur}s`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}

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
        /* Each spark sweeps a 30-unit visible segment from before the line
           starts (offset 100) to past the end (offset -30). The "blank"
           dasharray puts the entire 100-unit gap at the end, so only one
           segment is ever visible per spark. */
        .structure-map :global(.structure-spark) {
          stroke-dasharray: 30 200;
          stroke-dashoffset: 100;
          animation-name: sparkTravel;
          animation-iteration-count: infinite;
          animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
        }
        @keyframes sparkTravel {
          /* Hidden before the line — fully transparent. */
          0%   { stroke-dashoffset: 100; opacity: 0; }
          /* Quickly fade in as it enters. */
          12%  { opacity: 0.85; }
          /* Travel along the line. */
          75%  { opacity: 0.85; }
          /* Past the end — fade out so the trail dissolves. */
          92%  { opacity: 0; }
          100% { stroke-dashoffset: -130; opacity: 0; }
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
