# P0-9 — Known Unknowns / Unknown Unknowns

## What changed

Rebuilt the **Hidden Patterns** section of `experiences/page.tsx` into **Patterns from similar cases** — a section that pivots SessionLens from "tool for psychologists" to "engine for new psychology research."

### Files

- **Created**: `app/src/lib/analysis/known-unknowns.ts` — extractor that mines neighbor cases for themes absent from the current session.
- **Modified**: `app/src/app/dashboard/session/[sessionId]/experiences/page.tsx`
  - Replaced the "Hidden Patterns" / "Correlated Factor Surfacing" header (formerly lines 754–942) with a two-card layout.
  - Added `extractKnownUnknowns` import and a `useMemo` hook driving the new subsection.
  - Added an inline `ClusterPlaceholder` SVG component for the roadmap card.
  - Removed the legacy "Correlation Strength Overview" matrix and the per-correlation expandable cards (the old `computeCorrelations()` function is still imported and still feeds the per-case correlated-factor badges in **Similar Stories** + the **Pattern Insights** stat card, so the helper itself stays).
- **Created**: this doc.

### Layout (in section flow order)

1. **Header card** — gradient border, telescope icon, real corpus copy: *"Compares this session against {N} similar cases drawn from {M} in our research archive."* (M from `/api/corpus-stats`, falls back gracefully when the endpoint is unavailable).
2. **Subsection 1 — Known Unknowns** (`white card`)
   - Header: *"What similar cases describe that this client hasn't yet"*.
   - Empty state ("Nothing to surface — this session covers what similar cases described") when extractor returns `[]`.
   - Each entry: percentage claim + theme + `LineagePopover` showing source quotes from the contributing neighbor cases + a clinical note.
   - **Hidden entirely** when `realCases.length === 0` or `analysisStatus === 'mock'` (strict no-fabrication rule).
3. **Subsection 2 — Unknown Unknowns** (`dashed violet roadmap card`)
   - "Coming next" badge.
   - Copy explaining cluster-driven discovery as the path to net-new psychology findings.
   - Inline SVG `ClusterPlaceholder` (faint background dots + one highlighted purple cluster with a "new pattern?" label).

### Removed / kept

- **Removed**: per-correlation expandable cards and the "Correlation Strength Overview" matrix bar chart — both were redundant with the new Known Unknowns framing and pulled the eye away from the research-engine pitch.
- **Kept**: `computeCorrelations()` (still feeds the per-case "correlated factor" badges inside the Similar Stories cards and the "Correlations Found" stat in Pattern Insights).

## Algorithm — `extractKnownUnknowns(analysis)`

**Inputs**: `analysis.similarCases`, `analysis.moments`, `analysis.cbtAnalysis`, `analysis.quickInsight.clinicalPriority`, `analysis.analysisStatus`.

**Hard gates** (return `[]` immediately):
- `similarCases.length < 3` — not enough neighbors to make a defensible claim.
- `analysisStatus === 'mock'` — no fabrication on placeholder data.

**Steps**:
1. **Build the candidate pool**: union of `presentingConcerns[]` + `keyThemes[]` + `dominantStructures[]` from each similar case. Each pool entry tracks the deduplicated set of cases it appears in (typed as `concern` / `structure` / `theme`).
2. **Build the "current themes" set** from this session:
   - All structure codes from `moments[].structures` (raw + label-formatted).
   - `cbtAnalysis.dominantPatterns[]` and `cbtAnalysis.distortions[].type`.
   - Lowercased word tokens (length > 3) from `quickInsight.clinicalPriority`.
3. **Filter**: drop any pool entry whose normalized key matches the current-themes set.
4. **Threshold**: require `caseCount >= 2` AND `percentage >= 40` where `percentage = round(caseCount / totalNeighbors * 100)`. If 0 entries clear the bar, return `[]` — the empty state shows "Nothing to surface."
5. **Sort** by percentage desc, then caseCount desc, then theme name asc.
6. **Return** top 5, each with up to 5 supporting cases (`patientCode` + `representativeQuote`) and a `clinicalNote` looked up from a small keyword table (anxiety, depression, trauma, sleep, somatic, shame, identity, body, emotion, etc.) with a generic fallback.

**LineagePopover wiring**: each entry's `supportingCases` are mapped to `LineageSnippet[]` (text = quote, momentId = patient code, speaker = 'client'); methodology line states *"Found in X of Y nearest cases. Not yet present in this session's coding."*; literatureRef lists the contributing patient codes. This satisfies the strict-source-attribution rule.

## Verification

- `npx tsc --noEmit` — clean (no output).
- `npm run build` — succeeds. `/dashboard/session/[sessionId]/experiences` route compiled at 15.2 kB / 115 kB First Load JS.
- The new section renders independently of mock data: when `analysisStatus === 'mock'` or `similarCases.length < 3`, the Known Unknowns card is hidden and the Unknown Unknowns roadmap card stands on its own.
- The Unknown Unknowns card is the only forward-looking content in the section and is explicitly labeled "Coming next" + "Research roadmap" — it does not fake results.

## Pitch tone

The header sets the frame ("research archive"), Known Unknowns demonstrates the engine in action with auditable source cases, and Unknown Unknowns names the ambition (cluster-discovery / new diagnostic patterns) without overclaiming. The visual is subtle: a single purple cluster glowing inside a faint scatter — enough to suggest where the platform is going without being bombastic.
