# P0-7 — Session Topics: All Snippets + Bar Chart

## Problem
The Session Topics & Key Moments section showed only **one example quote per topic**, even when a topic appeared 8 times in a session. There was no visual frequency view — topics rendered as undifferentiated pills, so the practitioner could not see at a glance which topics dominated the session.

## What changed

### Type (`src/types/index.ts`)
- New `TopicOccurrence` interface: `{ quote, timestamp?, speaker?, momentId?, structures? }`.
- `ExtractedTopic` extended with:
  - `occurrences?: TopicOccurrence[]` — every matching snippet
  - `count?: number` — `occurrences.length` (frequency)
  - `structure?: string` — phenomenological structure label (e.g. `'emotional'`, `'cognitive + somatic'`)
- Legacy fields (`triggerQuote`, `speaker`, `structureDimension`) kept and marked `@deprecated` so callers don't break.

### Logic (`src/app/dashboard/session/[sessionId]/summary/page.tsx`)

#### `generateTopics()` refactor
Replaced the `findBestQuote` single-result helper with `collectOccurrences(keywords)`, which:
1. Iterates every `Moment` and pushes any whose `quote` contains a topic keyword (carrying `timestamp`, `momentId`, `structures`).
2. Then iterates transcript lines and adds any client/therapist line not already represented in a moment (deduped by leading-60-char key + substring overlap).
3. Truncates around the matched keyword for >180-char snippets.

Each of the three detector passes — structure-profile, CBT dominant patterns, and the keyword detector list — now calls `collectOccurrences` and stores the full array on the topic. Sort key is now **descending `count`** (tie-break on confidence), per the prompt.

#### `TOPIC_STRUCTURE_MAP`
New table mapping each generic topic label (e.g. `'anxiety'`, `'work stress'`, `'sleep issues'`) to a phenomenological structure label and a primary `StructureName` for color. `resolveTopicStructure(label)` returns `{ structure, color }` where `color` comes from `getStructureColor()` so bars share the palette used elsewhere in the app.

### UI — new `TopicsBarChart` component
Replaces the old pill-row body. Two-pane layout:

**Top — horizontal bar chart**
- One bar per topic, length proportional to `count` against the max in the set (so even small demo numbers like 1-4 fill visible space).
- Bar color = topic's mapped structure color.
- Each bar is a `<button aria-pressed>` — clicking selects the topic.
- Topics 1-7 shown by default; the long tail collapses under an `Other (N more)` toggle.

**Bottom — snippet list**
- When a topic is selected, every occurrence renders as a quote card with speaker avatar (Stethoscope / User), timestamp, the structure tags from the underlying moment, and a `LineagePopover` for source lineage. If no topic is selected: hint text *"Click a bar to see every quote."*

Section header, `InfoTooltip`, and teaser are preserved. The teaser still shows the top-4 topics and a leading quote.

## How occurrences are derived
`collectOccurrences(keywords)` performs the same keyword match the old code used for picking *one* quote, but now keeps every hit. Moments are visited first (they carry richer metadata: timestamp, momentId, structures); transcript lines fill in any client/therapist utterances that aren't surfaced as moments. Each topic's `count` therefore reflects the **real number of matching moments + utterances** in the session — no fabrication.

## Verification
- `npx tsc --noEmit` — clean (exit 0)
- `npm run build` — succeeds; `/dashboard/session/[sessionId]/summary` route compiled to 15.4 kB / 116 kB First Load JS
- Demo client SL-2026-DEMO has 6 moments per session; expected per-topic counts of 1-4. The bar chart adapts visual scale to `max(counts)` so bars remain compelling at small magnitudes.

## Files modified
- `src/types/index.ts`
- `src/app/dashboard/session/[sessionId]/summary/page.tsx`
- `docs/p0-7-topics.md` (this file, new)
