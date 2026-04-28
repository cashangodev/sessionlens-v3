# P0-8 — Polished Patient View + Doctor-Tone Settings Stub

## Summary
Restored the Full Report page (it was a stub redirecting to `/summary`) with the previous clinician/patient toggle plus a new structured Patient View, copy-to-clipboard exports, and a "Personalize your reports" stub on the Settings page.

## Files modified
- `app/src/app/dashboard/session/[sessionId]/report/page.tsx` — full rewrite
- `app/src/app/dashboard/settings/page.tsx` — added "Personalize your reports" section

## Files created
- `app/src/app/api/settings/tone-samples/route.ts` — stub POST/GET
- `docs/p0-8-patient-view.md` — this file

## Patient view structure
Renders a structured, demo-ready email with these slots:

```
Hi {{patientName}}, here's a recap from our session on {{date}}.

What stood out
- 2-3 bullets in "you" voice, derived from highest-intensity moments

Your strengths
- Positive `cbtAnalysis.behavioralPatterns` (filtered) + positive-valence moments

Worth reflecting on
- 1-2 gentle questions derived from the dominant CBT distortions

Before our next session
- One concrete action, picked by keyword from clinical priority + top moment

Take care of yourself this week. I look forward to our next session.
```

### Content sourcing
1. **Primary source**: parses `analysis.patientReport` markdown; `## Headers` are mapped to slots by keyword match (`stood`/`highlight`, `strength`, `reflect`/`consider`, `next`/`before`). Bullets become bullets.
2. **Fallback** (per slot): if a section is missing, derives from raw analysis data:
   - moments sorted by intensity
   - filtered behavioral patterns
   - top distortion mapped to a question via deterministic helper
   - action suggestion picked by keyword scan
3. No section is ever fabricated — empty slots are simply omitted.

### Patient name
- Uses `session.clientName` if present (forward-compat — currently optional on the API type)
- Falls back to `"there"` to avoid awkward `"Hi SL-2026-0001"` greetings

### Lineage
Each line has a `<LineagePopover>` showing source quote + methodology label. The popover icon is interactive only inside the page; the export functions (`templateToEmail`, `templateToWhatsApp`) emit plain text with no popover markup.

## Header buttons
- **Patient view only**: `Copy as email` (full sectioned format), `Copy as WhatsApp message` (greeting + bullets joined into short paragraphs, no headers)
- **Always visible**: `Send via Email` (toast: Coming Soon), `Download as Text` (downloads either clinician markdown or the patient email format)
- Toast appears 2.5s, top-right

## Clinician view
Restored from the previous version: markdown rendering (h2/h3/h4, lists, bold, paragraphs), edit mode (textarea buffer with Save/Cancel), edits persist in component state.

## Settings stub structure
New section "Personalize your reports" between Analysis Preferences and Privacy & Security:

- Header with `Sparkles` icon + subhead "Match your voice and style on patient emails"
- Dashed-border upload zone — clicking opens file picker (accept `.pdf,.docx,.txt`, multiple)
- Uploads POST to `/api/settings/tone-samples` (stub returns 200) and increment a local counter (capped at 3)
- Status indicator: "Tone profile not yet created" / "Tone profile active (N samples)"
- Toggle: "Use my tone for patient emails" (default OFF) — wired through to `useToneForEmails` flag (no-op for demo)
- Beta note: "We're learning your style from each report you generate."

## Stub API route
`POST /api/settings/tone-samples` → `{ success: true, message: 'Sample uploaded' }`
`GET  /api/settings/tone-samples` → `{ samples: [], status: 'inactive' }`

No file processing, no DB writes — purely demo wiring.

## Verification
- `npx tsc --noEmit` — clean (no output)
- `npm run build` — succeeds, all 17 routes generated, `/api/settings/tone-samples` listed, report page = 8.4 kB
