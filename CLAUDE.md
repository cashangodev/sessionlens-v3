# SessionLens V3 — AI-Powered Therapy Session Analysis Platform

## What This Is
A revenue-ready MVP for therapists. They paste/record a therapy session transcript, the app analyzes it using a 10-phenomenological-structure framework, and delivers: clinical summary, risk flags, similar case matches, evidence-based practitioner recommendations, and downloadable reports.

## CRITICAL RULES FOR ALL AGENTS

### 1. CODE FIRST, NOT SPECS
You are here to WRITE WORKING CODE. Not documentation. Not specs. Not plans.
Every agent session must end with code that compiles and runs.

### 2. NO EXTERNAL API DEPENDENCIES
This MVP runs 100% locally with mock data. NO Supabase, NO Clerk, NO OpenAI, NO AssemblyAI, NO Pinecone.
All data is local. All analysis is local. The database layer will be attached later.

### 3. TEST YOUR OWN WORK
After writing code, run `npm run build` (or `npm run dev` and check for errors). If it fails, FIX IT before moving on.

### 4. USE THE REFERENCE
`reference/v2-app.jsx` contains the working V2 UI (1,286 lines, single React component).
Use it as your visual/functional reference. The V3 must feel at LEAST as good as V2.

### 5. PROGRESS TRACKING
After completing work, append to `logs/PROGRESS.md` with:
- What you built
- What works
- What's left
- Any issues for other agents

## Tech Stack
- **Framework**: Next.js 14 (App Router) + React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Fonts**: Playfair Display (headings), DM Sans (body), JetBrains Mono (data/code)
- **Data**: Local mock data (JSON/TypeScript files) — no database

## The 10 Phenomenological Structures
1. **Body** — somatic awareness, physical sensations
2. **Prereflective/Immediate Experience** — unreflected sensation, raw experience
3. **Emotion** — affective states, feelings
4. **Behaviour** — observable actions, patterns
5. **Social** — relational dynamics, interpersonal
6. **Cognitive** — thought patterns, beliefs
7. **Reflective** — metacognitive awareness, insight
8. **Narrative** — story coherence, identity construction
9. **Ecological** — environmental/cultural factors
10. **Normative** — values, moral frameworks

## Design System
- **Background**: #FAFAF8 (warm white)
- **Primary**: #2D7D7D (deep teal)
- **Secondary**: #E07B6A (coral/warning)
- **Accent**: #F59E0B (amber highlights)
- **Success**: #6B9E7D (sage green)
- **Text Primary**: #1E293B (near-black)
- **Text Secondary**: #64748B (slate)
- **Borders**: #E2E8F0
- **Cards**: white with subtle shadow

## App Structure (6 Tabs)
1. **Session Input** — Paste transcript + treatment goals → "Analyze" button
2. **Clinical Summary** — Quick insight card, risk/priority/prognosis, moment timeline, progress chart
3. **Detailed Analysis** — Risk signals, therapist intervention coding, algorithm transparency
4. **Similar Cases** — Top 3-5 matched cases from the archive (mock)
5. **Expert Insights** — Practitioner methodology matches with evidence
6. **Full Report** — Clinician view + patient-friendly view toggle, PDF download

## Directory Structure
```
sessionlens-v3/
├── CLAUDE.md                  ← You are here
├── agents/                    ← Agent instruction files
├── reference/                 ← V2 reference code
├── logs/                      ← Progress tracking
├── app/                       ← Next.js app (created by foundation agent)
│   ├── src/
│   │   ├── app/              ← Pages & routes
│   │   ├── components/       ← React components
│   │   │   ├── tabs/        ← 6 tab components
│   │   │   ├── ui/          ← Shared UI primitives
│   │   │   └── layout/      ← Header, sidebar, layout
│   │   ├── lib/             ← Business logic
│   │   │   ├── analysis/    ← Analysis engine
│   │   │   ├── mock-data/   ← All mock data
│   │   │   └── utils/       ← Helpers
│   │   └── types/           ← TypeScript types
│   ├── public/
│   ├── package.json
│   └── ...config files
```

## Anonymization Codes (use in all mock data)
- Patient codes: SL-[YEAR]-[SEQUENTIAL] (e.g., SL-2024-0001)
- Practitioner codes: PR-[SPECIALTY]-[SEQUENTIAL] (e.g., PR-TRAUMA-042)

## Quality Bar
- TypeScript strict mode — no `any` types
- All components must be responsive (mobile → desktop)
- Keyboard navigable
- No console errors or warnings
- Build must pass (`npm run build`)
