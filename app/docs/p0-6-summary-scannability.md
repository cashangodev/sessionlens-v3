# P0-6 — Summary Scannability

Practitioners scan; they don't read. The Clinical Summary card was a wall of
text plus a pill row of percentages. Two changes ship in this prompt.

## 1. Length toggle (Short / Medium / Full)

Located top-right of the **Clinical Summary** `CollapsibleSection` header
(`src/app/dashboard/session/[sessionId]/summary/page.tsx`). Implemented via a
new `headerExtra` slot on `CollapsibleSection` so the segmented control sits
beside the chevron without intercepting the open/close click.

State: `summaryLength: 'short' | 'medium' | 'full'`, default **medium**.
Persistence: `localStorage` key `sessionlens-summary-length` — read in a
`useEffect` on mount, written via `updateSummaryLength`.

### Filtering rule (no fabrication)

`deriveSummaryByLength(report, length)`:

- **Full** — return the whole `analysis.clinicianReport` string.
- **Medium** — first 3 paragraphs (split on blank lines or `##` markdown
  headers).
- **Short** — first paragraph; if there is only one paragraph block, the first
  2 sentences.

This honors the strict-audit rule from P0-1: nothing is invented or
re-summarized. The toggle only filters what the LLM already wrote.

## 2. Bar chart for dominant patterns

Replaced the `Emotion 32% / Body 28%` pill row with a compact horizontal bar
chart driven by a new component:

`src/components/summary/StructureBar.tsx`

- Props: `data: { name: string; score: number; color: string }[]` plus an
  optional `renderLabel(d, defaultLabel)` for popover wiring.
- Each row: 32-char label column on the left, teal-tinted progress bar in the
  middle, monospace `%` on the right. Each row is ~24px tall.
- Pure CSS implementation (not Recharts) — Recharts ticks render inside SVG,
  which makes wrapping arbitrary React children (a `LineagePopover` trigger)
  in each row's label awkward. Pure CSS gives us a real DOM `<span>` for the
  popover trigger and exact pixel control of the row height. Recharts remains
  the chart library elsewhere; we only forgo it here for the popover-trigger
  ergonomics.

### Wiring

Bar colors come from `getStructureColor()` in `src/lib/structures`. For each
row, `renderLabel` wraps the label in the existing `<LineagePopover>` with
the same snippets and methodology string previously used on the pills, so the
P0-3 lineage popovers continue to work in all three length views.

The surrounding sentence ("Session content centered on …") in the
`generateQuickSummary()` output is unchanged — only the numerical pills became
a chart.

## Verification

- `npx tsc --noEmit` — clean.
- `npm run build` — succeeds.
- Summary tab loads, Clinical Summary card has Short/Medium/Full toggle on
  the right side of the header. Short shows first paragraph, Medium up to
  three, Full shows everything. The bar chart renders below the prose with
  one bar per dominant structure (top 5, score > 0.1).
- Toggling does not collapse the section (the segmented control is wrapped
  in `onClick stopPropagation` and the header chevron is a separate button).
- Reload preserves the user's choice via `localStorage`.
