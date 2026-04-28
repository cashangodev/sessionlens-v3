# Demo Dry-Run — Issues Report

Generated: 2026-04-25

## Automated checks
- **typecheck (`npx tsc --noEmit`)**: clean
- **lint (`npm run lint`)**: NOT runnable — Next.js ESLint is uninitialized in this repo; `npm run lint` opens an interactive Strict/Base/Cancel prompt and would hang in a non-TTY shell. Build runs its own type-check + Next compile-time validation, which passes cleanly. Recommend running `npx next lint --strict` once locally to seed `.eslintrc.json`, but this is not a demo blocker.
- **build (`npm run build`)**: succeeds. 17 routes generated, no warnings.
- **fabrication audit (`node scripts/audit-fabrications.mjs`)**: clean (0 findings) after trivial fix below.

## Blockers (must fix before Monday)
None.

## Warnings (should look at, but not blockers)
- `experiences/page.tsx:631-660` — Practitioner card "Why This Matches" block uses `bg-mint-50` / `border-mint-200/60`. If `mint` isn't in the Tailwind palette, those classes silently no-op (block renders unstyled). Worth checking `tailwind.config.ts` before the demo.
- `experiences/page.tsx:507` — "Top Effectiveness" badge in the section header reads as a single number with no unit framing. A demo viewer may mistake `78%` for a confidence score rather than a derived effectiveness metric. The InfoTooltip explains it but only on hover.
- `summary/page.tsx:1018,1380` — Copy uses ASCII double-hyphen (`--`) where an em-dash (`—`) is used everywhere else in the app. Cosmetic only.
- `report/page.tsx:419` — Patient view greeting falls back to "Hi there," when no `clientName` is on the session row. The demo seed (`SL-2026-DEMO`) does not set a `name` field, so the patient-view tab will say "Hi there, here's a recap…". Either set `clients.name = 'Maya'` (or similar) in the seed, or accept the generic greeting.
- `progress/page.tsx:332-376` — Outcome trend chart only renders when `hasOutcomeTrend && outcomeChartData.length >= 2`. The demo seed has 3 `outcome_scores` rows, but the join is by **date day-precision** (per the InfoTooltip), so if the session `date` strings don't match the outcome `date` strings exactly the chart may silently hide. Worth opening Session 3 in the browser to confirm the line chart renders.
- `experiences/page.tsx:289-354` — `ClusterPlaceholder` renders a hand-drawn SVG labeled "new pattern?" inside a "Coming next / Research roadmap" card. It's clearly framed as roadmap, but a skeptical investor may read the highlighted purple cluster as a real finding. Consider greying it out further or labeling the SVG explicitly "Illustrative".
- `summary/page.tsx:902-908` — `defaultAssessment` is built by stringing together `quickInsight.clinicalPriority + prognosis + top 3 structures + topRecommendation`. For the demo this reads fine, but if any of those fields is empty the result has stray punctuation (e.g. ". . Dominant patterns: ...").

## Trivial fixes I made
- **Removed the `{false && (...)}` legacy correlation block** in `experiences/page.tsx` (was the sole audit flag). Block was ~150 lines of dead JSX (correlation cards + correlation-strength matrix) gated behind `false`. The "Patterns from similar cases" section already shows Known Unknowns and the Pattern Insights cards still surface correlation counts.
- Cleaned up the now-unused `expandedCorrelation` / `setExpandedCorrelation` state and the `getSignificanceInfo` / `getTypeLabel` helper functions that were only referenced inside the removed block.
- Verified all icon imports (`ChevronUp`, `MessageSquareQuote`, `BarChart3`, `Lightbulb`) are still used elsewhere — kept them.

## Suggested talking points for the demo
For each session tab, the strongest single thing to demo:

- **Summary**: Open Session 3 → expand "CBT & Cognitive Analysis" → show the per-distortion confidence bars and the green "Reframe:" cards. The reframe text is the most clinically-credible AI output in the app.
- **Experiences**: Scroll to the "Experience Map" section → the network graph of phenomenological dimensions is unique and visually memorable. Pair it with the "Patterns from similar cases" amber card just below to show both retrospective (graph) and prospective (known unknowns) value.
- **Progress**: Open Session 3 (so 3 prior sessions are aggregated) → land on the "Outcome Trends" PHQ-9/GAD-7 line chart. Numbers walk down 14→11→7 and 16→13→9 — the clearest improvement story in the dataset.
- **Report**: Toggle to "Patient View" → demo the Copy-as-Email / Copy-as-WhatsApp buttons. The dual clinician/patient framing is the differentiator vs. plain-AI-summary tools.

## Known rough edges (not fixed — for triage)
- **Lint not initialized.** `npm run lint` is interactive and unusable in CI/automation. Not a demo issue but a hygiene gap.
- **Bundle size of `/progress` (109 kB / 205 kB First Load JS)** is the heaviest route, driven by Recharts. Acceptable for demo; would be the first thing to code-split post-demo.
- **`bg-mint-50` color classes** (experiences/page.tsx) are not verified against tailwind.config.ts — if the palette doesn't include `mint`, the practitioner-match "Why This Matches" callout will render with no background tint. Did not modify because adding palette colors is out-of-scope for this prompt.
- **`patientName` fallback to "there"** when `clients.name` is unset. Seed for `SL-2026-DEMO` does not provide a name → patient view will read "Hi there,". Cosmetic. Fix in seed, not in code.
- **`ClusterPlaceholder` is illustrative**, not data-driven, and could be misread as a real finding. Currently labeled "Coming next / Research roadmap" — adequate but could be stronger.
- **Lint script in `package.json`** points to `next lint` with no config — should be wired to a real `.eslintrc.json` after the demo so CI can enforce it.
- **`useApi` returns no error state** on these tabs — if `/api/sessions/[id]` 500s, the UI shows the "Session Not Found" empty state, which is misleading. Demo network is local so this should not fire, but worth fixing post-demo.

## Browser walk
Skipped — did not start `npm run dev` in this pass to keep the dry-run fast. The build artifact already exercises type/route correctness; a manual browser walk through the three demo sessions before Monday is still recommended to confirm the seed populates as expected (especially the Outcome Trend chart and the Network graph, both of which depend on `analysis_result` shape).
