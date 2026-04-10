# SessionLens V3 — Master Build Plan

## Decisions Locked

| Decision | Choice |
|----------|--------|
| Database | Real Supabase from day 1 |
| Auth | Clerk — wired from the start |
| Deploy | Vercel — production URL from Phase 1 |
| Analysis | OpenAI GPT-4o — real AI analysis |
| Navigation | Separate routes (/dashboard/input, /dashboard/analysis, etc.) |
| Seed data | Moderate — 10-15 practitioner methods, 10-15 similar cases |
| Priority | Full end-to-end flow — every click works |
| Design | Warm clinical — "therapist's study" not "startup dashboard" |

## Tools We'll Use

| Tool | Purpose |
|------|---------|
| **Parallel Agents** | 2-3 agents building simultaneously |
| **Supabase MCP** | Create tables, RLS policies, seed data — no SQL copy-paste |
| **Clerk MCP** | Auth SDK snippets and integration |
| **Vercel MCP** | Deploy, check logs, get live URL |
| **Frontend-Design Skill** | Premium UI that doesn't look like AI slop |
| **Context7 Skill** | Latest Next.js 14, Supabase, Clerk docs |
| **Claude in Chrome** | Visual testing — screenshot the live app and review |

---

## Phase 1: Foundation (Session 1, ~30 min)

### 1.1 — Create Next.js Project
**Agent**: General-purpose
- `npx create-next-app@latest` with TypeScript, Tailwind, App Router
- Install deps: `recharts`, `lucide-react`, `@clerk/nextjs`, `@supabase/supabase-js`, `openai`
- Configure Tailwind with design system colors + fonts
- Set up `next/font/google` (Playfair Display, DM Sans, JetBrains Mono)

### 1.2 — Supabase Schema
**Tool**: Supabase MCP (`execute_sql`, `apply_migration`)
- Create all tables:
  - `therapists` (id, clerk_id, name, email, practice_name, created_at)
  - `clients` (id, therapist_id, client_code, presenting_concerns, created_at)
  - `sessions` (id, client_id, therapist_id, session_number, transcript, treatment_goals, status, created_at)
  - `moments` (id, session_id, quote, context, timestamp, type, valence, intensity, structures, therapist_move, therapist_quote)
  - `risk_flags` (id, session_id, severity, signal, detail, recommendation)
  - `similar_cases` (id, patient_code, presenting_concerns, dominant_structures, session_count, key_themes, outcome, outcome_detail, representative_quote)
  - `practitioner_methods` (id, code, name, specialty, methodology, intervention_sequence, outcome_patterns, target_structures)
  - `pattern_matches` (id, session_id, similar_case_id, match_score)
  - `practitioner_matches` (id, session_id, practitioner_method_id, match_score, match_reasoning)
  - `consent_records` (id, client_id, consent_type, status, granted_at)
  - `audit_logs` (id, therapist_id, action, resource_type, resource_id, timestamp)
- Enable RLS on all tables
- Create RLS policies: therapists see only their own data
- Create indexes on foreign keys

### 1.3 — Seed Data
**Tool**: Supabase MCP (`execute_sql`)
- Seed 12 practitioner methods (Trauma-Focused CBT, Somatic Experiencing, EFT, Narrative Therapy, DBT, ACT, EMDR, Psychodynamic, IFS, Motivational Interviewing, Gestalt, Mindfulness-Based)
- Seed 10 anonymized similar cases with realistic profiles (SL-2024-0001 through SL-2024-0010)
- Each case: presenting concerns, dominant structures, session count, themes, outcome, quote

### 1.4 — Clerk Auth Setup
**Tool**: Clerk MCP for SDK snippets
- Wrap app in `ClerkProvider`
- Create sign-in and sign-up pages
- Middleware for protected routes
- Get current user in server components

### 1.5 — TypeScript Types
**Agent**: General-purpose
- Complete type definitions for all database entities
- Analysis result types
- Component prop types
- API request/response types

### 1.6 — Project Structure
Create all directories and placeholder files:
```
src/
├── app/
│   ├── page.tsx                    (landing)
│   ├── layout.tsx                  (root layout + Clerk + fonts)
│   ├── sign-in/[[...sign-in]]/     (Clerk sign-in)
│   ├── sign-up/[[...sign-up]]/     (Clerk sign-up)
│   ├── dashboard/
│   │   ├── layout.tsx              (dashboard shell + nav)
│   │   ├── page.tsx                (client list / home)
│   │   ├── session/
│   │   │   ├── new/page.tsx        (session input)
│   │   │   └── [sessionId]/
│   │   │       ├── page.tsx        (redirects to summary)
│   │   │       ├── summary/page.tsx
│   │   │       ├── analysis/page.tsx
│   │   │       ├── cases/page.tsx
│   │   │       ├── insights/page.tsx
│   │   │       └── report/page.tsx
│   │   └── clients/
│   │       └── [clientCode]/page.tsx
│   └── api/
│       ├── sessions/route.ts
│       ├── sessions/[sessionId]/analyze/route.ts
│       ├── clients/route.ts
│       └── webhooks/clerk/route.ts
├── components/
│   ├── tabs/                       (6 analysis view components)
│   ├── ui/                         (shared primitives)
│   └── layout/                     (header, nav, sidebar)
├── lib/
│   ├── supabase/                   (client, server, queries)
│   ├── analysis/                   (OpenAI analysis pipeline)
│   ├── openai/                     (OpenAI client + prompts)
│   └── utils/                      (helpers)
└── types/
    └── index.ts
```

**Phase 1 Gate**: `npm run build` passes, app starts, Clerk auth works, Supabase connected.

---

## Phase 2: Analysis Engine (Session 2, ~45 min)

### 2.1 — OpenAI Client Setup
- Create OpenAI client wrapper
- Environment variable for API key
- Error handling + rate limiting
- Fallback behavior when no API key

### 2.2 — Transcript Segmentation (GPT-4o)
- System prompt that segments therapy transcripts into clinical moments
- Input: raw transcript text
- Output: array of moments with speaker, text, approximate timestamp
- Select top 5-7 most clinically significant moments

### 2.3 — Phenomenological Coding (GPT-4o)
- System prompt that codes each moment against 10 structures
- Input: moment text + context
- Output: structure assignments with confidence scores, intensity, valence
- Structured output (JSON mode) for reliable parsing

### 2.4 — Risk Detection (GPT-4o)
- System prompt trained on clinical risk indicators
- Input: full transcript + coded moments
- Output: risk flags with severity, signal, detail, recommendation
- Conservative approach — flag potential risks, don't diagnose

### 2.5 — Therapist Move Coding (GPT-4o)
- Identify therapist intervention types from transcript
- Categorize: empathic attunement, challenge, interpretation, silence, reflection
- Calculate distribution

### 2.6 — Pattern Matching
- Compare session's structure profile against seeded similar cases in Supabase
- Simple vector distance on structure prevalence
- Return top 3-5 matches above threshold

### 2.7 — Practitioner Matching
- Match dominant structures + risk types against practitioner method profiles
- Score relevance
- Generate match reasoning via GPT-4o

### 2.8 — Report Generation (GPT-4o)
- Clinician report: professional, structured, clinical language
- Patient report: warm, accessible, encouraging
- Both generated from the analysis results

### 2.9 — Main Pipeline Orchestrator
- `analyzeSession()` function that chains all steps
- Stores results in Supabase
- Returns complete `AnalysisResult`
- Handles errors at each stage gracefully

**Phase 2 Gate**: Paste demo transcript → get complete, intelligent analysis results stored in Supabase.

---

## Phase 3: UI Build (Session 2-3, ~60 min)

### 3.1 — Landing Page
**Skill**: frontend-design
- Hero section: headline, subtitle, CTA
- Feature highlights (6 capabilities)
- Trust indicators (HIPAA, anonymized, evidence-based)
- Sign-in CTA

### 3.2 — Dashboard Layout
- Sidebar navigation (or top nav)
- Current client context
- Session history list
- "New Session" CTA

### 3.3 — Session Input Page (/dashboard/session/new)
- Client selector (or create new)
- Large transcript textarea
- Treatment goals input
- "Analyze Session" button
- "Load Demo" button
- Analysis progress overlay with staged messages

### 3.4 — Clinical Summary (/dashboard/session/[id]/summary)
- Quick Insight card (risk level, priority, prognosis, top recommendation)
- Moment timeline (expandable)
- Progress chart (Recharts LineChart, longitudinal data)
- Structure prevalence (radar or bar chart)

### 3.5 — Detailed Analysis (/dashboard/session/[id]/analysis)
- Risk signals with severity badges
- Therapist intervention distribution (bar chart)
- Algorithm transparency section

### 3.6 — Similar Cases (/dashboard/session/[id]/cases)
- "Matched against X cases" header
- Case match cards with scores, concerns, structures, outcomes

### 3.7 — Expert Insights (/dashboard/session/[id]/insights)
- Practitioner Wisdom Engine header
- Methodology match cards (expandable)
- Intervention sequences, outcome patterns, match reasoning

### 3.8 — Full Report (/dashboard/session/[id]/report)
- Clinician/Patient toggle
- Structured report content
- Download PDF button

### 3.9 — Sub-navigation
- Tab bar for the 6 analysis views
- Active state, disabled state (pre-analysis)
- Responsive (horizontal scroll on mobile)

**Phase 3 Gate**: All pages render, navigation works, data displays from Supabase.

---

## Phase 4: Integration & Wiring (Session 3, ~30 min)

### 4.1 — End-to-End Flow
Wire the complete flow:
1. Sign in → Dashboard
2. Create client → Get code (SL-2026-NNNN)
3. New session → Paste transcript → Set goals
4. Analyze → Loading overlay → Results stored in Supabase
5. Auto-navigate to /summary
6. Browse all 6 tabs with real data
7. Toggle report views
8. Return to dashboard → See session in history

### 4.2 — API Routes
- POST /api/sessions — create session, trigger analysis
- POST /api/sessions/[id]/analyze — run OpenAI pipeline, store results
- GET /api/clients — list therapist's clients
- POST /api/clients — create new client with auto-generated code

### 4.3 — Loading & Error States
- Analysis progress overlay (staged messages)
- Error handling with retry
- Empty states for each page
- Skeleton loaders

### 4.4 — Real-time Updates
- After analysis completes, redirect to results
- Session status tracking (pending → processing → analyzed)

**Phase 4 Gate**: Complete flow works end-to-end. Every click produces the right result.

---

## Phase 5: Polish & Deploy (Session 3-4, ~30 min)

### 5.1 — Visual Polish
**Skill**: frontend-design
- Typography hierarchy
- Consistent spacing
- Card shadows and hover states
- Chart styling
- Animation on tab transitions

### 5.2 — Responsive Design
- Test at 375px, 768px, 1024px, 1440px
- Fix any overflow or layout issues

### 5.3 — Accessibility
- Focus states on all interactive elements
- Keyboard navigation
- Aria labels
- Color not sole information carrier

### 5.4 — Deploy to Vercel
**Tool**: Vercel MCP
- Deploy app
- Set environment variables (Supabase, Clerk, OpenAI)
- Get live URL
- Test live deployment

### 5.5 — Visual Testing
**Tool**: Claude in Chrome
- Screenshot every page
- Review visual quality
- Fix any issues found

**Phase 5 Gate**: Live URL works, looks professional, every interaction is smooth.

---

## Execution Strategy

### Session 1 (Next Session): Foundation + Database
**Parallel agents:**
- Agent A: Create Next.js project + TypeScript types + project structure
- Agent B: Supabase schema + seed data (via MCP)
- Agent C: Clerk auth setup

After all three finish → verify build → deploy skeleton to Vercel

### Session 2: Analysis Engine + UI (Parallel)
**Parallel agents:**
- Agent A: OpenAI analysis pipeline (all 8 modules)
- Agent B: Landing page + dashboard layout + session input page
- Agent C: Analysis view pages (summary, analysis, cases, insights, report)

### Session 3: Integration + Polish
**Parallel agents:**
- Agent A: Wire end-to-end flow + API routes
- Agent B: Loading states + error handling + real-time updates
Then:
- Agent C: Visual polish + responsive + accessibility
- Deploy to Vercel + visual testing

---

## Environment Variables Needed
```
# Supabase (from MCP — already connected)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# OpenAI
OPENAI_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

---

## Success Criteria
When this is done, the following demo scenario works flawlessly:

1. Open sessionlens.vercel.app → see polished landing page
2. Click "Get Started" → sign up with Clerk
3. Land on dashboard → see empty client list
4. Create a new client → get code SL-2026-0001
5. Start new session → paste therapy transcript
6. Click "Analyze" → see progress animation
7. Auto-redirect to Clinical Summary → real AI-generated insights
8. Click through all 6 tabs → each shows real, intelligent analysis
9. View patient-friendly report → warm, accessible language
10. Return to dashboard → session saved in history
11. Sign out → sign back in → everything persists

**This is what revenue-ready looks like.**
