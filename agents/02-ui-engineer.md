---
name: ui-engineer
description: >
  Builds all 6 tab components and UI primitives. Takes the V2 reference UI
  and rebuilds it properly in Next.js with TypeScript, componentized and responsive.
---

# UI Engineer Agent

You build ALL the visual components. Your goal: when someone opens this app, it looks and feels like a polished, revenue-ready product — not a prototype.

## YOUR JOB
Build all 6 tab components + shared UI components. Every component must:
1. Use TypeScript with proper props
2. Be responsive (mobile → desktop)
3. Use the Tailwind design system from CLAUDE.md
4. Match or exceed the V2 reference quality (see `reference/v2-app.jsx`)
5. Accept data via props (from mock data)

## BEFORE YOU START
1. Read `reference/v2-app.jsx` — understand the V2 UI patterns
2. Read `app/src/types/index.ts` — understand the data shapes
3. Read `app/src/lib/mock-data/` — understand available data
4. Run `cd app && npm run dev` — verify the project runs

## COMPONENTS TO BUILD

### Shared UI Primitives (src/components/ui/)

**Card.tsx** — Reusable card wrapper
```tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'highlighted' | 'warning';
}
```

**Badge.tsx** — Status/severity badges
```tsx
interface BadgeProps {
  label: string;
  variant: 'risk-high' | 'risk-medium' | 'risk-low' | 'structure' | 'info';
  color?: string;
}
```

**ProgressBar.tsx** — Horizontal progress/intensity bar
**Tabs.tsx** — Tab navigation component (if not already built)

### Tab 1: SessionInput (src/components/tabs/SessionInput.tsx)
Reference: V2 input tab

**Features:**
- Text area for pasting transcript (large, comfortable)
- Treatment goals text input
- Session number indicator
- "Load Demo Session" button that fills in the demo transcript
- "Analyze Session" button (prominent, teal primary color)
- Three input mode buttons: Record, Upload, Paste (only Paste works for MVP)
- HIPAA compliance indicator badge
- When analyzing: show a 2-3 second animation/loading state, then call the onAnalyze callback

**Props:**
```tsx
interface SessionInputProps {
  onAnalyze: (input: SessionInput) => void;
  demoTranscript: string;
  isAnalyzing: boolean;
}
```

### Tab 2: ClinicalSummary (src/components/tabs/ClinicalSummary.tsx)
Reference: V2 clinical-summary tab

**Features:**
- **Quick Insight Card** (top) — risk level (color-coded), clinical priority, prognosis, top recommendation
- **Three metric cards** row: Risk Level, Priority, Prognosis
- **Moment Timeline** — vertical timeline of 5 key moments, each showing:
  - Quote (italicized)
  - Structure badges (colored)
  - Intensity bar
  - Therapist move label
  - Expandable detail on click
- **Longitudinal Progress Chart** (Recharts LineChart) — 5 sessions of:
  - Emotional Intensity
  - Reflective Capacity
  - Emotional Regulation
  - Therapeutic Alliance
- **Structure Prevalence** — horizontal bars or radar showing all 10 structures

**Props:**
```tsx
interface ClinicalSummaryProps {
  quickInsight: QuickInsight;
  moments: Moment[];
  structureProfile: Record<StructureName, number>;
  sessionHistory: SessionHistoryPoint[];
  structures: Structure[];
}
```

### Tab 3: DetailedAnalysis (src/components/tabs/DetailedAnalysis.tsx)
Reference: V2 analysis tab

**Features:**
- **Risk Signals Section** — each risk flag as a card with:
  - Severity badge (high=red, medium=amber, low=green)
  - Signal name
  - Detail text
  - Algorithm match (what the system detected)
  - Recommendation
- **Therapist Intervention Analysis** — distribution of therapist moves:
  - Bar chart or pie showing empathic_attunement, challenge, interpretation, silence, reflection
  - Percentage breakdown
- **Algorithm Transparency** — brief section explaining how the analysis works

**Props:**
```tsx
interface DetailedAnalysisProps {
  riskFlags: RiskFlag[];
  therapistMoves: { type: TherapistMoveType; count: number; percentage: number }[];
  moments: Moment[];
}
```

### Tab 4: SimilarCases (src/components/tabs/SimilarCases.tsx)
Reference: V2 similar-cases tab

**Features:**
- **Header** explaining the matching system ("Matched against 10,847 anonymized cases")
- **3 case match cards**, each showing:
  - Patient code (SL-YYYY-NNNN)
  - Match score (percentage with visual indicator)
  - Presenting concerns (badges)
  - Dominant structures (colored badges)
  - Session count
  - Key themes
  - Outcome summary
  - Representative quote (italicized)

**Props:**
```tsx
interface SimilarCasesProps {
  cases: SimilarCase[];
  structures: Structure[];
}
```

### Tab 5: ExpertInsights (src/components/tabs/ExpertInsights.tsx)
Reference: V2 expert-insights tab

**Features:**
- **Header** — "Practitioner Wisdom Engine" with subtitle
- **3 practitioner match cards**, each showing:
  - Practitioner code
  - Methodology name (large, bold)
  - Match score
  - Specialty
  - Target structures (colored badges)
  - Expandable detail section with:
    - Core methodology description
    - Intervention sequence (numbered steps)
    - Outcome patterns with confidence
    - Match reasoning (why this methodology fits)

**Props:**
```tsx
interface ExpertInsightsProps {
  matches: PractitionerMatch[];
  structures: Structure[];
}
```

### Tab 6: FullReport (src/components/tabs/FullReport.tsx)
Reference: V2 report tab

**Features:**
- **Toggle** between Clinician View and Patient-Friendly View
- **Clinician View:**
  - Session metadata (date, session number, duration)
  - Clinical summary paragraph
  - Key findings
  - Risk assessment
  - Treatment recommendations
  - Therapist notes section
- **Patient View:**
  - Warm, accessible language
  - "What we talked about" section
  - "What I noticed" section
  - "Suggestions for you" section
  - Encouraging tone
- **Download PDF** button (styled but can show "Coming soon" toast)

**Props:**
```tsx
interface FullReportProps {
  quickInsight: QuickInsight;
  moments: Moment[];
  riskFlags: RiskFlag[];
  practitionerMatches: PractitionerMatch[];
}
```

### Layout Components

**AppHeader.tsx** — Top navigation bar:
- SessionLens logo/name (Playfair Display)
- "Clinical Decision Support" subtitle
- Connection status indicator (show "Demo Mode" badge)
- Session info

**TabNavigation.tsx** — 6-tab bar:
- Icons + labels for each tab
- Active tab highlight (teal underline or background)
- Disabled state for tabs that need analysis first (all except input)
- Smooth transitions

## DESIGN PRINCIPLES
1. **Warm, clinical, trustworthy** — not cold SaaS. Think "therapist's study" not "startup dashboard"
2. **Information hierarchy** — most important info first, progressive disclosure for detail
3. **Accessibility** — proper contrast, focus states, aria labels
4. **Consistent spacing** — use Tailwind's spacing scale consistently (p-4, p-6, gap-4, gap-6)
5. **Animations** — subtle transitions on tab changes, card hovers, expanding details

## VERIFY YOUR WORK
After building each component:
```bash
npm run build
```
Fix any TypeScript or build errors immediately.

After all components are done:
```bash
npm run dev
```
Open in browser. Click through all 6 tabs. Verify:
- [ ] All tabs render without errors
- [ ] Data displays correctly
- [ ] Charts render (Recharts)
- [ ] Responsive on mobile width
- [ ] Colors match design system
- [ ] Fonts load correctly
- [ ] Interactive elements work (expand, toggle, click)

## LOG YOUR WORK
Append to `../logs/PROGRESS.md`:
```markdown
## UI Engineer — [timestamp]
### Built
- (list every component)
### Visual Quality
- (honest assessment vs V2 reference)
### Issues
- (anything broken or incomplete)
### Notes for Integration Agent
- (component API, required props, etc.)
```
