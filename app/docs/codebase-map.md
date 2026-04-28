# SessionLens V3 — Codebase Map & Audit

> Working reference. Generated 2026-04-24. Reflects state of `sessionlens-v3/app/` as of this audit.
> All paths are absolute. Line numbers in `path:line` form.

---

## 0. Quick Orientation

- **Stack**: Next.js 14 (App Router) + TypeScript strict + Tailwind, Supabase (with pgvector), Clerk (referenced but DB layer uses a hardcoded `DEV_THERAPIST_ID`), OpenAI (GPT-4o + text-embedding-3-small).
- **Live tabs** (the four in scope): `summary`, `analysis`, `experiences`, `progress`. The `analysis` and `report` routes are **stubs that redirect to `summary`** — there is no standalone analysis or report page anymore.
- **Top-level orchestrator**: `src/lib/analysis/transcript-analyzer.ts` → `analyzeSession()`.
- **Single mutable state**: `sessions.analysis_result` JSONB column. Almost every UI surface reads from this blob via `GET /api/sessions/[sessionId]`.

Key files:
- `C:/Users/User/mental h/sessionlens-v3/CLAUDE.md` — project charter (note: rule 2 says "no external APIs" but the actual app DOES use Supabase/Clerk/OpenAI — `BUILD_PLAN.md` overrides this).
- `C:/Users/User/mental h/sessionlens-v3/BUILD_PLAN.md` — the authoritative plan.
- `C:/Users/User/mental h/sessionlens-v3/app/src/types/index.ts` — single source of truth for AnalysisResult shape.

---

## 1. Data Flow

End-to-end trace for a single session, from upload to render.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. INPUT                                                                   │
│  src/app/dashboard/session/new/page.tsx (UI)                                │
│        │                                                                    │
│        ├──► POST /api/sessions       ─► dbStoreSession()                    │
│        │      (creates row, status='created', analysis_result=null)         │
│        │                                                                    │
│        └──► POST /api/sessions/[id]/analyze                                 │
│                    │                                                        │
│                    ▼                                                        │
└────────────────────┼────────────────────────────────────────────────────────┘
                     │
┌────────────────────┼────────────────────────────────────────────────────────┐
│  2. ANALYSIS PIPELINE — analyzeSession() in transcript-analyzer.ts          │
│                                                                             │
│  Step 1  segmentTranscript(transcript)        → segmenter.ts                │
│  Step 2  for each segment:                                                  │
│          ├─ codeStructures(quote, ctx)        → structure-coder.ts          │
│          └─ classifyTherapistMoveForMoment()  → therapist-coder.ts          │
│          → builds Moment[] (id, timestamp, structures, valence, intensity)  │
│  Step 3  detectRisks(transcript)              → risk-detector.ts            │
│          (GPT-4o if available, else 4-layer keyword fallback)               │
│  Step 4  codeTherapistMoves(responses)        → therapist-coder.ts          │
│  Step 5  buildStructureProfile(moments)       (local)                       │
│  Step 6  matchSessionMoments(...)             → matching-engine.ts          │
│          embed → supabase.rpc('search_moments_semantic') → 3-layer rerank   │
│          → similarCases[]   (or MOCK_ANALYSIS.similarCases on no Supabase)  │
│  Step 7  analyzeCognitiveDistortions(moments) → cbt-analyzer.ts             │
│          → cbtAnalysis (DoT framework, GPT-4o)                              │
│  Step 8  matchPractitionerMethods(...)        → matching-engine.ts          │
│          embed query → supabase.rpc('search_practitioners_semantic')        │
│          → practitionerMatches[]   (or MOCK fallback)                       │
│  Step 9  generateQuickInsight(...)            (local rule-based)            │
│  Step 10 generateReports(...)                 → report-generator.ts         │
│          → clinicianReport, patientReport (markdown text)                   │
│  Step 11 buildSessionHistory()                ALWAYS RETURNS []             │
│                                                                             │
│  NEVER POPULATED HERE (despite types existing):                             │
│  • vectorInsights        (ExperiencesPage gates on this — rendering OFF)    │
│  • experientialField     (ExperiencesPage gates on this — rendering OFF)    │
│  • momentConfidence      (SummaryPage gates on this — rendering OFF)        │
│  • coOccurrenceNetwork   (ExperiencesPage gates on this — rendering OFF)    │
│  • narrativeArc          (SummaryPage gates on this — rendering OFF)        │
│                                                                             │
│  → Returns AnalysisResult with analysisStatus = 'complete' | 'partial'      │
└────────────────────┬────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  3. PERSISTENCE                                                             │
│  src/app/api/sessions/[sessionId]/analyze/route.ts:32-39                    │
│        JSON.parse(JSON.stringify(analysisResult))   (strip class instances) │
│        → dbUpdateSessionAnalysis()                                          │
│           UPDATE sessions SET analysis_result = $blob,                      │
│                              status='complete',                             │
│                              analysis_complete_at = now()                   │
│        → also calls extractProfileFromAnalysis() →                          │
│           dbUpsertClientProfile() (writes presenting concerns,              │
│           dominant structures, risk level, key themes back to clients row)  │
└────────────────────┬────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  4. RENDER                                                                  │
│  All four tabs use the same fetch:                                          │
│      useApi<{ session: SessionData }>(`/api/sessions/${sessionId}`)         │
│  → dbGetSession() returns analysis_result (JSONB) untouched.                │
│                                                                             │
│  Each page then runs its OWN client-side derivation of                      │
│  cards from the AnalysisResult blob (see Section 2).                        │
│                                                                             │
│  PROGRESS tab additionally calls:                                           │
│      GET /api/clients/[clientCode]/progress                                 │
│      → dbGetClientProfile + sessions table → LongitudinalSessionData[]      │
│      Falls back to generateMockLongitudinalData() when <2 sessions.         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Files in the data path

| Stage | File |
|-------|------|
| Input form | `src/app/dashboard/session/new/page.tsx` |
| Create session | `src/app/api/sessions/route.ts` |
| Trigger analyze | `src/app/api/sessions/[sessionId]/analyze/route.ts` |
| Pipeline orchestrator | `src/lib/analysis/transcript-analyzer.ts:88-218` |
| Storage | `src/lib/supabase/db.ts:351-372` (`dbUpdateSessionAnalysis`) |
| Read for render | `src/lib/supabase/db.ts:312-349` (`dbGetSession`) |
| GET /api/sessions/[id] | `src/app/api/sessions/[sessionId]/route.ts` |
| Longitudinal endpoint | `src/app/api/clients/[clientCode]/progress/route.ts` |
| Client hook | `src/hooks/use-api.ts` (used by all four tab pages) |

---

## 2. Per-Tab Card Inventory

### 2.1 Summary tab — `src/app/dashboard/session/[sessionId]/summary/page.tsx` (1481 lines)

Cards/sections rendered (in DOM order):

| # | Card | Source data field | Real / Fabricated / Mixed | Notes |
|---|------|-------------------|---------------------------|-------|
| 1 | Quick Insight Banner | `analysis.quickInsight.{riskLevel,clinicalPriority,prognosis}` | **Real** | Computed by `generateQuickInsight()` in transcript-analyzer.ts:47-86. Rule-based off risk flags + dominant structure. |
| 2 | Clinical Summary | `analysis.clinicianReport`, plus client-side `generateQuickSummary()` teaser | **Mixed** | clinicianReport is GPT-4o output (real). The teaser `quickSummary` is rule-based stitching of structure profile + CBT patterns + risk flags (deterministic, real). Tooltip claim "GPT-4o clinical synthesis with structure-weighted attention" is misleading — there is no weighted-attention component, just a system prompt. |
| 2b | Session Story Arc (Narrative Arc) | `analysis.narrativeArc.{gestaltSummary, phases, turningPoints, overallTrajectory}` | **Fabricated (dead)** | `narrativeArc` is **never written** by the pipeline (transcript-analyzer.ts has no step that produces it). `story-mapper.ts` exists in `src/lib/analysis/` but is not imported by the orchestrator. The whole `{analysis?.narrativeArc && (...)}` block (page.tsx:746-911) renders only if pre-seeded JSON is loaded into `analysis_result`. Treat as fabricated/seeded-only. |
| 3 | Session Topics & Key Moments | `generateTopics(analysis.moments, structureProfile, cbt, transcript)` | **Mixed** | Topics are derived from real structure profile + CBT distortions + keyword scan over transcript. Confidence values are **synthetic** (`Math.min(0.95, 0.5 + score*0.4)`, page.tsx:250). The fallback `topic-gen-1/-2` ("Emotional Processing", "Self-Reflection" with 0.7/0.65 confidence) at line 311-313 is hardcoded when nothing matches. |
| 4 | Risk & Clinical Flags | `generateClinicalFlags(moments, riskFlags, cbt, structureProfile, therapistMoves, transcript)` | **Mixed** | Risk flags are real (from risk-detector.ts). CBT distortion flags are real. Protective factors include: reflective moments (real-derived), "Strong therapeutic alliance" if empathic moves >3 (real-derived), "Emotional regulation within session" (computed from intensity-trajectory diff). All confidence numbers are heuristic (`Math.min(0.95, 0.65 + ...)`, page.tsx:405,415,426,442). Tooltip references "16 categories" but RISK_PATTERNS in risk-detector.ts has 14. |
| 5 | CBT & Cognitive Analysis | `analysis.cbtAnalysis.{distortions, overallDistortionLoad, treatmentReadiness, dominantPatterns, automaticThoughts, behavioralPatterns}` | **Real** | Generated by `analyzeCognitiveDistortions()` (cbt-analyzer.ts) using the DoT framework via OpenAI. Empty defaults if step fails. |
| 6 | Diagnostic Considerations | `generateDiagnosticConsiderations(riskLevel, moments, cbt)` | **Fabricated** | Hardcoded if/else chain (page.tsx:450-512) keying off literal substrings ("anxi", "perfect", "sad/depress/hopeless", "label"/"personal"). Always pushes "Adjustment Disorder F43.20" with confidence 0.58. ICD codes and confidences are all hand-picked constants. The "Supported by N similar cases" line at page.tsx:1215-1221 is a real count but the dx itself is template-driven. |
| 7 | Therapist Intervention Profile | `analysis.therapistMoves` | **Real** | Derived from `codeTherapistMoves()` in therapist-coder.ts. |
| 7b | Moment Confidence | `analysis.momentConfidence[]` | **Fabricated (dead)** | `momentConfidence` is **never populated** by the pipeline. `confidence-scorer.ts` exists in `src/lib/analysis/` but is not imported by transcript-analyzer.ts. Section only renders if seeded data is present. |
| 8 | Notes & Export — SOAP / DAP buttons | `generateSOAPNote/generateDAPNote(analysis)` | **Real** | Uses `src/lib/note-generator.ts` against the real analysis blob. |
| 8b | Notes & Export — Session Assessment textarea | `analysis.editedAssessment` (custom field) OR computed `defaultAssessment` (page.tsx:652-658) | **Real** | Default is templated from real quickInsight + structureProfile fields. User edits persist via `PATCH /api/sessions/[id]`. |

### 2.2 Analysis tab — `src/app/dashboard/session/[sessionId]/analysis/page.tsx` (20 lines)

| # | Card | Source data field | Real / Fabricated / Mixed | Notes |
|---|------|-------------------|---------------------------|-------|
| 1 | (entire page) | n/a | **N/A — redirect stub** | `useEffect(() => router.replace(.../summary))`. The route exists for backward compatibility only. |

### 2.3 Experiences tab — `src/app/dashboard/session/[sessionId]/experiences/page.tsx` (1672 lines)

Sections rendered (in DOM order):

| # | Card | Source data field | Real / Fabricated / Mixed | Notes |
|---|------|-------------------|---------------------------|-------|
| 1 | "What Worked for People Like Your Client" — practitioner ranking | `analysis.practitionerMatches` (sorted by computed `effectivenessScore`) | **Mixed** | Real when Supabase configured: `matchPractitionerMethods()` does pgvector search + structural alignment boost. **Falls back to `MOCK_ANALYSIS.practitionerMatches`** with `[Demo Data]` prefix on matchReasoning when no Supabase (matching-engine.ts:401-405). `effectivenessScore` is locally computed (page.tsx:94-104) but the underlying `outcomePatterns` come either from the seeded practitioner_methods table or from mock-data.ts. Header line 430 hardcodes the corpus size: **"dataset of 10,847 lived experiences"**. |
| 1.top | "Top Effectiveness" badge (e.g. "78%") | `rankedPractitioners[0].effectivenessScore` | **Mixed** | Real math over mixed data. |
| 2 | Clinical Intelligence (Vector Insights) | `analysis.vectorInsights[]` | **Fabricated (dead)** | `vectorInsights` is **never written** by the pipeline. The card only renders if `analysis.vectorInsights` is truthy and non-empty — which requires pre-seeded `analysis_result` JSON. Tooltip claims "analyzing semantic similarity patterns across **14,600 coded therapy moments and 778 patient journeys**" (page.tsx:642). Subtitle text repeats this (line 646). Both numbers are hardcoded copy with no ties to actual archive size. |
| 2b | Experiential Field — quadrant grid + balance bars + clarity score | `analysis.experientialField` | **Fabricated (dead)** | `experientialField` is **never written** by the pipeline. `experiential-field.ts` exists in `src/lib/analysis/` but is not imported by transcript-analyzer.ts. Only renders with seeded JSON. |
| 2c | Experience Map — co-occurrence network graph | `networkData = buildNetworkData(analysis.moments)` | **Real** | Computed live from real `moments[]` via `src/lib/analysis/network-analysis.ts`. Reads moment.structures, builds 10×10 co-occurrence matrix, derives centrality + clusters + insights. Renders via `<ExperienceNetwork>`. Numbers in stats (Network Density, Active Dimensions) are real-time. |
| 3 | Hidden Patterns / Correlated Factor Surfacing | `computeCorrelations(realCases)` (page.tsx:146-222) | **Mixed** | Math is real (Jaccard-style co-occurrence ≥25% threshold). But INPUTS are `analysis.similarCases` which may be MOCK fallback (see card 1). `CONCERN_SUGGESTIONS` map (page.tsx:118-129) is hardcoded clinical advice text. |
| 4 | Dimension Network — SVG graph | `analysis.coOccurrenceNetwork` | **Fabricated (dead)** | `coOccurrenceNetwork` is **never written** by the pipeline. Note this is a SECOND co-occurrence visualization — duplicates the live "Experience Map" above (#2c). Only renders if seeded. |
| 5 | Similar Stories — case cards | `analysis.similarCases` | **Mixed** | Same dual-source problem as practitioners: real pgvector search OR `MOCK_ANALYSIS.similarCases` with `[Demo Data]` prefix on outcomeDetail (matching-engine.ts:210-214). Each case shows `matchExplanation` if present (a field that the pipeline does NOT populate — only seeded data has it). `patientCode` is generated as `SL-2024-NNNN` from sequential index (matching-engine.ts:363) regardless of actual archive participant_id. |
| 6 | Pattern Insights — 5 stat cards (Outcome Rate, Correlations Found, Top Themes, Average Match, Common Structures) | Aggregated from `realCases` (= `analysis.similarCases`) | **Mixed** | Aggregation math is real but inherits the mock-fallback risk of the underlying cases. |

### 2.4 Progress tab — `src/app/dashboard/session/[sessionId]/progress/page.tsx` (677 lines)

| # | Card | Source data field | Real / Fabricated / Mixed | Notes |
|---|------|-------------------|---------------------------|-------|
| 1 | Demo Data Warning banner | n/a | **Fabricated (dead, gated `false`)** | Wrapped in `{false && !hasEnoughRealData && ...}` (page.tsx:345). Disabled in code. |
| 2 | Progress Summary header (Overall Trend / Key Improvement / Recommended Focus / Areas of Concern) | `generateProgressSummary(sessionData)` | **Mixed (heavily fabricated when <2 real sessions)** | When `realSessions.length < 2` (the common case), `sessionData = generateMockLongitudinalData(sessionNumber)` from `src/lib/longitudinal-data.ts:42-103`. That function fabricates PHQ-9 scores (`Math.max(5, 18 - progressFactor*8)`), GAD-7 scores, alliance/regulation/reflective metrics, and key themes from a 5-element hardcoded array ("Initial crisis and emotional overwhelm", "Processing past patterns and beliefs", "Building social connections...", "Deepening self-awareness...", "Integration and sustainable change"). When ≥2 real sessions exist, structureIntensity comes from real analysis but `therapeuticAlliance: 6, emotionalRegulation: 5, reflectiveCapacity: 5` are **defaulted constants** (route.ts:132-134). |
| 3 | Session Timeline — per-session cards with risk badge, key theme, PHQ-9/GAD-7 | `sessionData[i]` | **Fabricated when <2 real sessions; partial otherwise** | Same source as #2. Risk levels in mock are: i==1 high, i<=2 medium, else low (longitudinal-data.ts:80). PHQ-9/GAD-7 displayed even when undefined (the `?` chain renders `undefined / undefined`). |
| 4 | PHQ-9 / GAD-7 Recharts LineChart | `outcomeChartData` filtered from sessionData | **Fabricated when <2 real sessions** | Real sessions have undefined outcome scores (real pipeline does not produce them — see Open Questions). So when real sessions exist, this chart is empty unless mock fallback fires. |
| 5 | Therapeutic Metrics LineChart (Alliance / Regulation / Reflective Capacity) | `metricChartData` from sessionData | **Fabricated** | Mock arc rises monotonically from 5→9 / 3→9 / 4→9 over the session count. Real sessions emit baseline 6/5/5 constants — flat line. Tooltip claim "derived from the phenomenological structure profile" (page.tsx:497) is **false** — there's no such derivation in the API or pipeline. |
| 6 | Topic Evolution heatmap | `generateTopicEvolution(sessionNumber, structureProfile, cbt)` | **Mixed → Mostly fabricated** | Pulls real CBT dominant patterns + top structures from current session. But the heatmap shows them only as `sessions: [sessionNumber]` (page.tsx:71-72, 88) — i.e. every topic is marked present only in the current session. Trends are hardcoded `'stable'`. The "increasing/decreasing" trend feature shown in the legend is never produced. Fallback adds hardcoded "Emotional Processing", "Self-Reflection" if empty (line 107-111). |
| 7 | Treatment Plan Progress | `generateTreatmentPlan(sessionNumber, cbt)` | **Mixed → Heavily fabricated** | Goals built from CBT dominant patterns (real) but `progressPercent` is computed from `treatmentReadiness * (1 - distortionLoad)` — pseudo-real but a single-session snapshot, not real progress tracking. Always appends "Build self-compassion and emotional resilience" with `Math.min(20, sessionNumber * 5)` percent (page.tsx:173-180). Generic fallback goals "Reduce presenting symptoms" / "Develop healthy coping strategies" with `sessionNumber * 15` and `* 12` percent. |
| 8 | AI Decision Prompts | `generateAIDecisionPrompts(sessionNumber, cbt)` | **Fabricated** | Templated questions and confidence values keyed off CBT presence and `sessionNumber >= 4`. Confidence numbers (0.65, 0.72, 0.76, 0.82) are hardcoded constants (page.tsx:205, 215, 227, 250). The "AI suggestion based on longitudinal session data" disclosure is misleading — there is no longitudinal model. |

### 2.5 Report tab — `src/app/dashboard/session/[sessionId]/report/page.tsx` (10 lines)

| # | Card | Source data field | Real / Fabricated / Mixed | Notes |
|---|------|-------------------|---------------------------|-------|
| 1 | (entire page) | n/a | **N/A — redirect stub** | `redirect(`/dashboard/session/${sessionId}/summary`)`. The downloadable report content (clinicianReport / patientReport) is real and lives inside the Summary tab's "Notes & Export" card. |

---

## 3. Risk Detection Surface

`src/lib/analysis/risk-detector.ts` exports `detectRisks(transcript) → Promise<RiskFlag[]>`.

Output flow:

1. **Producer**: `transcript-analyzer.ts:130` calls `detectRisks(transcript)` → assigns to `riskFlags`.
2. **Persistence**: serialized into `analysis_result.riskFlags` JSONB array.
3. **Read locations**:

| File | Line(s) | What it does |
|------|---------|--------------|
| `src/app/dashboard/session/[sessionId]/summary/page.tsx` | 163-167 | Counts high-severity risks for the Quick Insight banner copy. |
| `src/app/dashboard/session/[sessionId]/summary/page.tsx` | 318-385 | `generateClinicalFlags()` iterates `analysis.riskFlags`, parses the `Final adjusted score: X.XX` substring out of `rf.detail` (line 378) to recover `realConfidence`, attempts to find the source quote in the transcript for each flag (lines 333-377). |
| `src/app/dashboard/session/[sessionId]/summary/page.tsx` | 1000-1051 | Renders the Risk & Clinical Flags collapsible — chips for risk/protective/notable, expandable cards with quote and confidence. |
| `src/app/dashboard/session/[sessionId]/summary/page.tsx` | 491-498 | `generateDiagnosticConsiderations()` uses `riskLevel === 'high'` (derived from quickInsight.riskLevel which itself is derived from riskFlags in transcript-analyzer.ts:53-66) to gate inclusion of MDD F32.1. |
| `src/lib/analysis/transcript-analyzer.ts` | 53-66 | `generateQuickInsight()` reads `riskFlags` to set `riskLevel`, `clinicalPriority`, `prognosis` — these are the values the Summary banner card #1 displays. |
| `src/lib/analysis/matching-engine.ts` | 393-435 | `matchPractitionerMethods()` accepts `riskFlags` and uses the highest-severity ones to bias the practitioner-search query string (line 419-421). |
| `src/lib/note-generator.ts` | (full file) | Used by SOAP / DAP downloads — embeds risk flags into the generated text. |
| `src/lib/client-profile.ts` | (full file) | `extractProfileFromAnalysis()` writes `currentRiskLevel` back to the `clients` row after analysis. |
| `src/app/api/clients/[clientCode]/progress/route.ts` | 96-97 | Reads `analysis.quickInsight.riskLevel` per session for the Progress timeline. |
| `src/app/dashboard/session/[sessionId]/progress/page.tsx` | 432-435 | Renders per-session risk Badge in the timeline. |

**The Progress tab does NOT directly render `riskFlags[]`** — it only reads the `riskLevel` derived field. The detailed flag list is only rendered on the Summary tab.

---

## 4. Lived Experiences / Practitioner Match Surface

The matching layer is `src/lib/analysis/matching-engine.ts` exporting two functions:

- `matchSessionMoments(moments, structureProfile)` → `SimilarCase[]`
- `matchPractitionerMethods(moments, structureProfile, riskFlags)` → `PractitionerMatch[]`

Both are called once per session in `transcript-analyzer.ts:144-149` and `:163-174`. Both have a **mock fallback** when `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` env vars are missing — they return `MOCK_ANALYSIS.similarCases` / `MOCK_ANALYSIS.practitionerMatches` with a `[Demo Data]` prefix tagged onto outcomeDetail / matchReasoning (matching-engine.ts:210-215, :401-406). Otherwise:

- `matchSessionMoments` embeds the top-3 most-intense moments via `embedMoment()` → calls Supabase RPC `search_moments_semantic` → re-ranks results with a 50/30/20 weighted score (semantic / structural / metadata) → groups by `participant_id` → joins to `lived_experiences` table → returns up to 5 cases. `patientCode` is **synthesized as `SL-2024-NNNN`** based on sorted index (matching-engine.ts:363), so it does NOT correspond to the real participant_id.
- `matchPractitionerMethods` builds a query string from top-4 structures + top-3 risks + top-3 moment quotes → embeds → RPC `search_practitioners_semantic` → boosts with structural alignment (60/40 split). Builds `matchReasoning` text deterministically (matching-engine.ts:477-483).

### Where it appears (UI)

| File | Line(s) | What it renders |
|------|---------|-----------------|
| `src/app/dashboard/session/[sessionId]/experiences/page.tsx` | 420-624 | "What Worked for People Like Your Client" section — practitioner cards with intervention timeline, target structures, outcome patterns, effectiveness score. |
| `src/app/dashboard/session/[sessionId]/experiences/page.tsx` | 1389-1575 | "Similar Stories" section — case cards with match score, outcome trajectory, key themes, dominant structures, representative quote. Reads optional `matchExplanation` field at line 1468 — but the pipeline never produces this field. |
| `src/app/dashboard/session/[sessionId]/experiences/page.tsx` | 304, 313-337 | `correlatedFactorsByCase` — joins correlation results back onto cases to render amber-bordered chips on each case card. |
| `src/app/dashboard/session/[sessionId]/experiences/page.tsx` | 1577-1670 | "Pattern Insights" — 5 stat cards aggregated from realCases (positivePct, correlations.length, topThemes, avgMatch, topStructures). |
| `src/app/dashboard/session/[sessionId]/summary/page.tsx` | 662-671, 1215-1221 | `getSimilarCasesCountForDx()` — joins matched cases against diagnostic considerations to render "Supported by N similar cases from research archive" footer on each dx card. This is the ONLY place on the Summary tab that uses `similarCases`. |

### Where it SHOULD appear but doesn't

1. **Quick Insight banner (Summary card #1) does not surface practitioner match information.** The "topRecommendation" is computed from dominant structure only (transcript-analyzer.ts:75-77), not from the highest-effectiveness practitioner match — which is the whole product hook.
2. **Risk & Clinical Flags (Summary card #4) does not link to relevant practitioner methods.** A high-severity risk flag is a natural bridge to "people who presented with this and improved with method X" — not surfaced.
3. **Progress tab Treatment Plan (card #7) does not seed goals from practitioner intervention sequences.** It only reads CBT distortions. Practitioner `interventionSequence[]` data is unused outside the Experiences tab.
4. **Progress tab AI Decision Prompts (card #8) does not propose practitioner methods.** The `dominant` variable references a CBT pattern only; no `practitionerMatches[0]` consultation.
5. **No Similar Cases / Practitioner content on the Summary tab itself** beyond the diagnostic-considerations sidebar count. A user staying on Summary never sees the matching results unless they click Experiences.
6. **`matchExplanation` field is read at experiences/page.tsx:1468 but never written.** Either remove the read or wire a producer (likely intended to be an LLM-generated short narrative that explains the match per case).

---

## 5. Open Questions

Issues to resolve before refactoring:

1. **The `AnalysisResult` type declares 5 optional fields (`vectorInsights`, `experientialField`, `momentConfidence`, `coOccurrenceNetwork`, `narrativeArc`) that the pipeline never writes.** Three corresponding `src/lib/analysis/` modules exist (`experiential-field.ts`, `confidence-scorer.ts`, `story-mapper.ts`) but are not imported by `transcript-analyzer.ts`. Decide: wire them in or delete the types + UI sections. Right now four large card blocks (Narrative Arc on Summary; Vector Insights, Experiential Field, Dimension Network on Experiences) are dead unless seeded data is loaded.

2. **Two co-occurrence visualizations on the Experiences tab.** The live `<ExperienceNetwork>` (Section 2.3 card #2c, real) and the seeded `coOccurrenceNetwork` SVG (card #4, dead). They show the same thing from different sources. Pick one.

3. **Hardcoded corpus sizes in tooltip/header copy** that bear no relation to any database value:
   - `experiences/page.tsx:430` → "dataset of 10,847 lived experiences"
   - `experiences/page.tsx:642` → "14,600 coded therapy moments and 778 patient journeys"
   - `experiences/page.tsx:646` → "AI-powered pattern analysis across 14,600 coded moments and 778 patient journeys"
   These should either be derived from a count query or removed. (Note: searched for the strings "2,156" and "session 3 hyperation" — neither is present in the current codebase. Either previously-removed or in a parent caller.)

4. **PHQ-9 / GAD-7 are surfaced everywhere but never measured.** The real pipeline does not collect or compute outcome measures — `analysis.outcomeMeasures` is read in `progress/route.ts:122-125` but never written by `analyzeSession()`. The Progress tab charts rely entirely on `generateMockLongitudinalData()` for PHQ-9/GAD-7 trajectories. Decide: add an intake form for clinician-entered scores, or remove the cards.

5. **Therapeutic Alliance / Emotional Regulation / Reflective Capacity baseline = 6 / 5 / 5 constants in `progress/route.ts:132-134`.** These produce a flat-line chart for real sessions. The tooltip in `progress/page.tsx:497` claims they're "derived from the phenomenological structure profile" — that derivation does not exist in code.

6. **`patientCode: SL-2024-NNNN` in matching-engine.ts:363 is generated from sort index, not the real participant_id.** Two sessions matched against the same archive may show "the same case" with different codes, or different cases with the same code. Either expose the real id or store a stable hash.

7. **The mock fallback inside `matchSessionMoments` / `matchPractitionerMethods`** silently returns `MOCK_ANALYSIS.*` with a `[Demo Data]` text prefix when env vars are missing. The `analysisStatus` flag on the result is set to `'partial'` with a warning, but no UI surface displays this warning to the user. Consider rendering `analysisWarnings[]` somewhere visible.

8. **The fabricated `generateDiagnosticConsiderations()` always emits "Adjustment Disorder F43.20"** with confidence 0.58 (summary/page.tsx:485-489), regardless of session content. The "rule_in" status is misleading — it implies clinical reasoning where there is none.

9. **`generateClinicalFlags()` claims "16 clinical and social risk categories" in tooltip copy** (summary/page.tsx:1008) but `RISK_PATTERNS` in risk-detector.ts has 14 entries. Decide which is canonical.

10. **CLAUDE.md vs BUILD_PLAN.md contradict.** CLAUDE.md rule 2 says "no Supabase, no Clerk, no OpenAI". BUILD_PLAN.md mandates all three from day 1. The codebase implements BUILD_PLAN. Either update CLAUDE.md or split it into "MVP rules" vs "current rules".

11. **`DEV_THERAPIST_ID` hardcoded in `src/lib/supabase/db.ts:11`** as `a0000000-0000-0000-0000-000000000001`. Clerk is wired but auth identity is bypassed — every request is attributed to the same therapist. Multi-tenant production is not yet possible.

12. **Analysis vs Report routes are dead redirects.** Either remove the routes (and update any nav that points to them) or restore separate pages. Currently the sub-nav probably has tabs that just round-trip to Summary.

13. **`buildSessionHistory()` in transcript-analyzer.ts:18-22 returns `[]` always.** The `sessionHistory: SessionHistoryPoint[]` field on AnalysisResult is therefore always empty — yet the type still exposes it. Several UI surfaces could meaningfully use historical points; today they fetch via `/api/clients/[clientCode]/progress` instead. Remove the dead field or wire it.

14. **`extractedAssessment` field is read by Summary card #8b but is not part of the `AnalysisResult` TypeScript type.** It's stored as an arbitrary key on the JSONB blob via PATCH. Add to the type or move to a separate column.

15. **`network-builder.ts` and `network-analysis.ts` both exist** in `src/lib/analysis/`. Only `network-analysis.ts` is referenced by the Experiences page. Confirm whether `network-builder.ts` is dead.

16. **`mock-transcription.ts`, `demo-transcript.ts`, `test-analysis.ts`** in `src/lib/analysis/` — confirm whether these are wired into the "Load Demo" button or dead code.

---

## Appendix A — Module index for `src/lib/analysis/`

| File | Used by orchestrator? | Notes |
|------|----------------------|-------|
| `segmenter.ts` | ✅ Step 1 | |
| `structure-coder.ts` | ✅ Step 2 | |
| `therapist-coder.ts` | ✅ Steps 2 + 4 | |
| `risk-detector.ts` | ✅ Step 3 | GPT-4o + 4-layer fallback |
| `cbt-analyzer.ts` | ✅ Step 7 | |
| `matching-engine.ts` | ✅ Steps 6 + 8 | Mock fallback when no Supabase |
| `report-generator.ts` | ✅ Step 10 | |
| `embedding-pipeline.ts` | ✅ via matching-engine | |
| `openai-client.ts` | ✅ via risk-detector, cbt-analyzer, etc. | |
| `network-analysis.ts` | ❌ (used by Experiences page directly) | Live computation |
| `transcript-analyzer.ts` | ◎ entry point | |
| `experiential-field.ts` | ❌ DEAD | Output type exists, never produced |
| `confidence-scorer.ts` | ❌ DEAD | Output type exists, never produced |
| `story-mapper.ts` | ❌ DEAD | Output type exists, never produced |
| `network-builder.ts` | ❌ DEAD? | Confirm vs network-analysis.ts |
| `mock-transcription.ts` | ❌ ? | |
| `demo-transcript.ts` | ❌ ? | |
| `test-analysis.ts` | ❌ ? | |

## Appendix B — `AnalysisResult` field reality check

Source of truth: `src/types/index.ts:157-176`.

| Field | Written by pipeline? | Read by UI? |
|-------|---------------------|-------------|
| `quickInsight` | ✅ | ✅ Summary banner |
| `moments` | ✅ | ✅ Summary, Experiences (network input) |
| `riskFlags` | ✅ | ✅ Summary card #4 |
| `practitionerMatches` | ✅ (or mock) | ✅ Experiences card #1 |
| `similarCases` | ✅ (or mock) | ✅ Experiences cards #5, #6, #3 + Summary dx footer |
| `structureProfile` | ✅ | ✅ Summary cards #2/#3 chips, Progress derivations |
| `sessionHistory` | ⚠️ always `[]` | ❌ |
| `therapistMoves` | ✅ | ✅ Summary card #7 |
| `clinicianReport` | ✅ | ✅ Summary card #2 + downloads |
| `patientReport` | ✅ | ✅ download path |
| `cbtAnalysis` | ✅ | ✅ Summary card #5, Progress derivations |
| `vectorInsights` | ❌ DEAD | ⚠️ Experiences card #2 (renders only if seeded) |
| `experientialField` | ❌ DEAD | ⚠️ Experiences card #2b (renders only if seeded) |
| `momentConfidence` | ❌ DEAD | ⚠️ Summary card #7b (renders only if seeded) |
| `coOccurrenceNetwork` | ❌ DEAD | ⚠️ Experiences card #4 (renders only if seeded) |
| `narrativeArc` | ❌ DEAD | ⚠️ Summary card #2b (renders only if seeded) |
| `analysisStatus` | ✅ | ❌ not surfaced |
| `analysisWarnings` | ✅ | ❌ not surfaced |
