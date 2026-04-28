# P0-1 Fabrication Audit — Investor Demo Hardening

> Generated 2026-04-25, prior to Monday investor demo of SessionLens.
> Source-of-truth audit: `docs/codebase-map.md`.
>
> Rule: any card whose data is not produced by the live analysis pipeline
> (`src/lib/analysis/transcript-analyzer.ts`) or by a real Supabase query is
> hidden — *not* labeled "demo data". The demo is sparser but defensible.

## Summary

- **Files modified**: 5 (3 demo pages + 1 audit script + 1 new API route).
- **Cards hidden**: 7 (Narrative Arc, Moment Confidence, Diagnostic Considerations,
  Vector Insights "Clinical Intelligence", Experiential Field, Dimension Network,
  full Progress longitudinal trio when <2 sessions).
- **Cards rewired to real data**: 1 (Experiences corpus tooltip — now reads
  `/api/corpus-stats`).
- **Inline fields removed**: 1 (`matchExplanation` render on Similar Stories cards).
- **Dead-banner cleanup**: 1 (`{false && !hasEnoughRealData && ...}` block in
  Progress page deleted; replaced with an honest "longitudinal trends unlock
  after the second session" notice).

`node scripts/audit-fabrications.mjs` returns 0 findings.

---

## Summary tab — `summary/page.tsx`

| Card | Action | What it now uses / Why hidden |
|---|---|---|
| 1. Quick Insight Banner | unchanged | Real (`analysis.quickInsight`) |
| 2. Clinical Summary | unchanged | Real (`analysis.clinicianReport` + heuristic teaser) |
| 2b. Session Story Arc | **REMOVED** | `narrativeArc` is never written by the pipeline. Block deleted. |
| 3. Session Topics & Key Moments | unchanged | Mixed but derived from real moments / structures / CBT |
| 4. Risk & Clinical Flags | unchanged | Real risk flags + heuristic protective flags (audit retained) |
| 5. CBT & Cognitive Analysis | unchanged | Real (cbt-analyzer.ts via GPT-4o) |
| 6. Diagnostic Considerations | **REMOVED** | `generateDiagnosticConsiderations()` always emitted "Adjustment Disorder F43.20" at confidence 0.58. Function and JSX deleted. |
| 7. Therapist Intervention Profile | unchanged | Real (`analysis.therapistMoves`) |
| 7b. Moment Confidence | **REMOVED** | `momentConfidence` is never written by the pipeline. Block deleted. |
| 8. Notes & Export | unchanged | Real (note-generator.ts + clinician-edited assessment) |

Also removed: imports for `NarrativeArc`, `NarrativePhase`, `NarrativeTurningPoint`, `MomentConfidence`, `DiagnosticConsideration`; lucide icons `FileWarning`, `ArrowRight`, `GitBranch`, `Eye`, `Database`, `Target`; helpers `STRUCTURES`, `getStructure`, `getStructureColor`; local helpers `getStatusColor`, `getSimilarCasesCountForDx`, `similarCases` reference.

## Analysis tab — `analysis/page.tsx`

Verified 20-line redirect stub. **No edit required.**

## Experiences tab — `experiences/page.tsx`

| Section | Action | What it now uses / Why hidden |
|---|---|---|
| 1. What Worked for People Like Your Client | corpus copy rewired | Tooltip text reads `/api/corpus-stats` (real DB count); falls back to a generic phrasing if the request fails. Hardcoded "10,847 lived experiences" removed. |
| 1.top "Top Effectiveness" badge | unchanged | Real (computed from outcome patterns) |
| 2. Clinical Intelligence (Vector Insights) | **REMOVED** | `vectorInsights` is never written by the pipeline. Whole section (and the "14,600 coded moments / 778 patient journeys" copy that lived inside) deleted. |
| 2b. Experiential Field | **REMOVED** | `experientialField` is never written by the pipeline. |
| 2c. Experience Map (live `<ExperienceNetwork>`) | unchanged | **Real** — computed live from `analysis.moments` via `network-analysis.ts` |
| 3. Hidden Patterns / Correlated Factors | unchanged | Real Jaccard math over `analysis.similarCases` |
| 4. Dimension Network (seeded SVG) | **REMOVED** | `coOccurrenceNetwork` is never written by the pipeline; it duplicated card 2c anyway. |
| 5. Similar Stories | `matchExplanation` field render dropped | Card cards still render real (or seeded for the demo client) `practitionerMatches` / `similarCases`. The `matchExplanation` italic block was the only field never written by the pipeline. |
| 6. Pattern Insights | unchanged | Real aggregations |

Also removed: imports `STRUCTURES`, `getStructureColor`, `VectorInsight`, `StructureName`. Added `useEffect` and `corpusStats` state for the corpus-stats fetch.

## Progress tab — `progress/page.tsx`

| Card | Action | What it now uses / Why hidden |
|---|---|---|
| 1. Demo Data Warning | dead `{false && ...}` branch deleted | Replaced by an honest "longitudinal trends unlock after the second session" notice (only renders when fewer than 2 real sessions). |
| 2. Progress Summary header | gated on `hasEnoughRealData` | Hidden when client has fewer than 2 analyzed sessions. |
| 3. Session Timeline | gated on `hasEnoughRealData` | PHQ-9 / GAD-7 line within each session card now wraps in a nullish guard so undefined values don't render. |
| 4. PHQ-9 / GAD-7 chart | gated on `hasEnoughRealData && outcomeChartData.length > 0` | Chart hides entirely when no real outcome data exists. |
| 5. Therapeutic Metrics chart | gated on `hasEnoughRealData` | Tooltip claim about derivation from structure profile no longer applied to fabricated baselines because the chart itself only renders for real session data. |
| 6. Topic Evolution heatmap | gated on `hasEnoughRealData` | Hidden because the source data is single-session. |
| 7. Treatment Plan Progress | unchanged | Heuristic but uses only the current session's CBT analysis (real). Out of P0-1 scope per instructions. |
| 8. AI Decision Prompts | unchanged | Heuristic; same scope decision as #7. |

Also removed: import `generateMockLongitudinalData`; mock fallback code path.

## Report tab — `report/page.tsx`

Verified 10-line redirect stub. **No edit required.**

---

## New API route

### `GET /api/corpus-stats`

`src/app/api/corpus-stats/route.ts` — returns `{ livedExperiences, codedMoments, practitionerMethods }` via three `head:true, count:'exact'` Supabase reads against `lived_experiences`, `moments`, `practitioner_methods`. Returns 503 with no payload when Supabase is not configured or any count query fails — the Experiences page treats that as "show generic copy, no number".

## Audit script

`scripts/audit-fabrications.mjs` — updated `TARGETS` to the three real demo
pages, tightened the PHQ-9/GAD-7 regex to flag only unguarded JSX displays of
the values, added a comment-line skip so that explanatory comments can mention
removed fields without re-tripping `dead-fields`/`mock-longitudinal`. Now exits
with status 1 on any finding.

Verification: `node scripts/audit-fabrications.mjs` → 0 findings.

## Verification checklist

- [x] `npx tsc --noEmit` — clean (exit 0)
- [x] `npm run build` — succeeds, all 16 pages generate
- [x] `node scripts/audit-fabrications.mjs` — clean (exit 0)
- [ ] dev-server browser smoke (deferred to user per task brief)
