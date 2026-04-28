# P0-3 — Lineage Popovers

Every clinical claim shown to the practitioner is one click away from the
transcript line(s) and methodology that produced it. This is implemented via a
single reusable component, `<LineagePopover>`, that wraps any claim text with a
small `Info` icon. Clicking the icon opens a popover with three sections:
**Source quotes** (timestamped blockquotes), **Methodology**, and **Literature**.

## Component

- **Path**: `src/components/ui/LineagePopover.tsx`
- **API**:
  ```ts
  interface LineagePopoverProps {
    snippets: Array<{ text: string; momentId?: string | number; timestamp?: string; speaker?: 'client' | 'therapist' }>;
    methodology?: string;
    literatureRef?: string;
    children: React.ReactNode;
    className?: string;
  }
  ```
- Renders nothing extra (no icon) when there are no snippets, no methodology, and
  no literature ref — preventing empty popovers.
- Position adapts to viewport edges (bottom / top / right / left).
- Click-outside closes. `e.stopPropagation()` on inner clicks so opening the
  popover doesn't toggle parent expand/collapse buttons.
- Visually distinct from `<InfoTooltip>` (gray-400 → primary on hover info icon,
  primary-tinted header, blockquote-style snippet rendering with `[mm:ss]`
  prefix).

## Wired locations

### `src/app/dashboard/session/[sessionId]/summary/page.tsx`

| Card / Section | What is wrapped | Snippet source | Methodology |
|---|---|---|---|
| Clinical Summary → Dominant structures pills | Each `name X%` pill | Top 3 moments where `m.structures` includes the structure (sorted by intensity) | `Phenomenological structure coding: <name> present in N moment(s); aggregate weight X%` |
| Session Topics & Key Moments → topic pills | Each topic button | `topic.triggerQuote` + `topic.speaker` | `Phenomenological structure: <topic.structureDimension or 'mixed'>` |
| Risk & Clinical Flags → flag rows | `flag.label` | `flag.transcriptQuote` + `flag.location` (already produced by `generateClinicalFlags`, derived from `riskFlag.algorithmMatch` keyword search across transcript / moment fallback) | 4-layer risk algorithm / protective-factor detection / CBT distortion mapping (depending on `flag.type`) |
| CBT & Cognitive Analysis → distortion type | `d.type` | `analysis.moments[d.momentIndex].quote` + `.timestamp`; falls back to `d.evidence` | `CBT distortion: <type>` (literature: Beck's cognitive model; DoT framework) |

### `src/app/dashboard/session/[sessionId]/experiences/page.tsx`

| Card / Section | What is wrapped | Snippet source | Methodology |
|---|---|---|---|
| Solution Matching → practitioner cards | `match.specialty` (h4 title) | `match.matchReasoning` (single quote) | `match.specialty` (literature: `match.methodology`) |
| Hidden Patterns → correlation factor A | `corr.factorA` text | Up to 3 `representativeQuote`s from cases that contain BOTH `factorA` and `factorB` | `Co-occurrence analysis across <totalCases> similar cases` (literature: contributing case codes) |
| Similar Stories → case cards | `c.patientCode` (card title) | `c.representativeQuote` | `Semantic + structural matching` (literature: anonymized participant + session count) |

### `src/app/dashboard/session/[sessionId]/progress/page.tsx`

Most longitudinal cards (Progress Summary, Session Timeline, Outcome Trends,
Topic Evolution) are gated behind `hasEnoughRealData` (≥2 sessions) per P0-1's
fabrication audit, so no popovers are added there — the cards either show real
multi-session data the user can verify across the timeline, or they are hidden.

| Card / Section | What is wrapped | Snippet source | Methodology |
|---|---|---|---|
| Treatment Plan Progress → goal cards | `item.goal` text | For `goal-cbt-*`: matched moments via `cbt.distortions` filtered by extracted pattern name → `analysis.moments[d.momentIndex]`. Other goal IDs: empty snippets, methodology-only popover. | `CBT distortion-driven goal: aggregated from detected automatic-thought patterns` / `Behavioral pattern analysis (CBT)` / `Standardized treatment goal scaffold` |
| AI Decision Prompts → prompt cards | `prompt.question` | `prompt-cbt-ready`: top 2 distortion-linked moments. `prompt-thoughts`: top 2 negative `automaticThoughts.content`. Others: empty snippets, methodology-only popover. | `Cross-session CBT pattern analysis` / `Longitudinal session-pattern analysis` |

## Hidden bullets / gaps

No bullets were hidden in P0-3. Every claim that already passed the P0-1
fabrication audit could be traced to existing data (moment quote, transcript
line, distortion evidence, representative quote, or match reasoning). Where a
specific claim has no per-instance source text — e.g. the generic
`prompt-generic-1` AI decision prompt or the `goal-selfcomp` template goal —
the popover renders methodology only (no empty "Source quotes" header). When
**both** snippets and methodology would be empty, the popover icon itself does
not render (see `LineagePopover` short-circuit on `hasAnyContent`).

## Verification

- `npx tsc --noEmit` — clean, no diagnostics.
- `npm run build` — succeeds. Bundle size deltas:
  - `summary` route: 13 kB
  - `experiences` route: 13.4 kB
  - `progress` route: 112 kB (Recharts dominates)
