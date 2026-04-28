# P0-5 — Progress tab wired to real per-session data

## Context

After P0-1 the `Progress` tab was gated on `hasEnoughRealData` (≥2 real sessions),
but its API was returning a thin slice of real data and the page was filling the
gaps with three local fabricators (`generateTopicEvolution`,
`generateTreatmentPlan`, `generateAIDecisionPrompts`). The demo client
`SL-2026-DEMO` has 3 real sessions with full `analysis_result` JSONB plus a
`clients.outcome_scores` array of PHQ-9 / GAD-7 entries — but none of that was
flowing into the visible cards.

P0-5 rewires the API and the page so every Progress card consumes real data,
or hides cleanly.

## API: `GET /api/clients/[clientCode]/progress`

Returns a `ProgressData` payload defined in `src/lib/longitudinal-data.ts`:

```ts
interface ProgressData {
  sessionCount: number;
  sessions: LongitudinalSessionData[];
  treatmentPlan: LongitudinalGoal[];
  hasOutcomeTrend: boolean;   // ≥2 sessions have phq9 or gad7
  hasTopicData: boolean;      // ≥1 session has structure-tagged moments
}
```

### `LongitudinalSessionData` (per session)

| Field | Source | Notes |
|---|---|---|
| `sessionNumber`, `date` | `sessions.session_number`, `session_date` | day-precision |
| `outcomeMeasures.phq9 / gad7` | `clients.outcome_scores` joined by date, falls back to `analysis_result.outcomeMeasures` | per-session join, not fabricated |
| `structureIntensity.*` | `analysis_result.structureProfile` | 0-1 scale |
| `dominantStructure` | derived from `structureProfile` (max key) | for summary card |
| `keyTheme` | matched `outcome_scores[i].note` (clinician text) | falls back to `"Session N"` |
| `riskFlagCount`, `riskFlagSeverity` | `analysis_result.riskFlags[].severity` distribution | counts only |
| `dominantTopics` | top 3 structures by frequency from `analysis_result.moments[].structures`, with up to 3 supporting quote snippets each | feeds the topic heatmap + lineage popovers |
| `momentCount` | `analysis_result.moments.length` | |
| `emotionalIntensity` | share of moments with `intensity > 6` | derived, real |
| `therapeuticAlliance`, `emotionalRegulation`, `reflectiveCapacity` | **always 0** | not derivable; the page never renders these as real metrics |

### `LongitudinalGoal` (per goal)

Built from `clients.treatment_goals` (the per-client goal list). For each
session we run a keyword overlap between the goal text and that session's
`treatment_goals` string + moment quotes. Result: `perSession[]` of
`{ sessionNumber, addressed: boolean, snippets[] }`. We never fabricate a
completion percentage.

## Page rendering — what wires up for `SL-2026-DEMO` (3 sessions)

| Card | Status for demo client | Source |
|---|---|---|
| "Need 2 sessions" notice | hidden (3 sessions present) | gate |
| Progress Summary (overall trend / improvement / focus / concerns) | renders | `generateProgressSummary(sessions)` over real series |
| Session Timeline (3 dots, dates, PHQ-9/GAD-7, risk-flag counts) | renders | sessions + outcome join |
| PHQ-9 & GAD-7 line chart | renders (3 points: 14→11→7 PHQ-9, 16→13→9 GAD-7) | `outcome_scores` join |
| Topic Recurrence heatmap | renders | top structures across the 3 sessions' moments; cells open `LineagePopover` with the supporting client quotes |
| Dominant Structures line chart | renders | per-session `structureProfile` |
| Treatment Plan Engagement | renders (5 goals from `client.treatment_goals`) | per-session keyword overlap with moment quotes |

## Cards / metrics intentionally *not* rendered

* **Therapeutic Metrics line chart** (Therapeutic Alliance / Emotional
  Regulation / Reflective Capacity over time) — removed. These three composites
  were fabricated baselines (`6/5/5`) on every session in the prior route.
  Until the analysis pipeline emits them, the chart is gone.
* **AI Decision Prompts section** — removed. Was generated client-side from
  CBT analysis with hand-tuned thresholds; not real longitudinal signal.
* **Per-goal completion percentage bars** — replaced with per-session
  `S1 S2 S3` chips (highlighted when addressed) plus a textual
  "Addressed in N/M sessions" summary. No invented percentages.

## For a single-session client

`hasEnoughRealData` is false → the page shows only the "Need at least 2
sessions" notice and nothing else. Per-session findings remain on the other
tabs.

## Lineage popovers (P0-3 component)

* **Topic heatmap** — every cell is wrapped in `<LineagePopover>` with the up-to-3
  client quotes from that (topic, session) pair plus a `methodology` line.
* **Treatment plan goals** — goal text wrapped in `<LineagePopover>` showing
  the moment quotes that matched the goal's keywords across all sessions.

## Mock generator status

`generateMockLongitudinalData()` remains in `src/lib/longitudinal-data.ts` for
type reference but has zero call-sites in the codebase
(`grep -r "generateMockLongitudinalData" src` returns only its own definition).

## Verification

* `npx tsc --noEmit` — clean
* `npm run build` — succeeds; `/dashboard/session/[sessionId]/progress` route
  builds at 109 kB (was 109 kB before the change).
