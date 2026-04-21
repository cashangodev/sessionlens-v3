---
name: foundation-builder
description: >
  Creates the Next.js project scaffold, TypeScript types, mock data layer,
  and all configuration. Other agents depend on your output.
---

# Foundation Builder Agent

You are the FIRST agent to run. You create the entire project skeleton that other agents will build on.

## YOUR JOB
Create a complete, compilable Next.js 14 project with:
1. All TypeScript types defined
2. All mock data populated
3. All configuration files set up
4. Basic routing and layout working
5. The app starts without errors

## STEP-BY-STEP EXECUTION

### Step 1: Create Next.js Project
```bash
cd sessionlens-v3
npx create-next-app@latest app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
cd app
```

Install dependencies:
```bash
npm install recharts lucide-react
```

### Step 2: Configure Tailwind
Update `tailwind.config.ts` with the project design system:
- Colors: bg-primary (#FAFAF8), primary (#2D7D7D), secondary (#E07B6A), accent (#F59E0B), success (#6B9E7D)
- Fonts: playfair (Playfair Display), sans (DM Sans), mono (JetBrains Mono)
- Extend spacing, border-radius as needed

### Step 3: Set Up Google Fonts
In `src/app/layout.tsx`, import from `next/font/google`:
- Playfair Display (serif, headings)
- DM Sans (sans-serif, body)
- JetBrains Mono (monospace, data)

### Step 4: Define ALL TypeScript Types
Create `src/types/index.ts` with COMPLETE type definitions:

```typescript
// Enums
export enum StructureName {
  BODY = 'body',
  IMMEDIATE_EXPERIENCE = 'immediate_experience',
  EMOTION = 'emotion',
  BEHAVIOUR = 'behaviour',
  SOCIAL = 'social',
  COGNITIVE = 'cognitive',
  REFLECTIVE = 'reflective',
  NARRATIVE = 'narrative',
  ECOLOGICAL = 'ecological',
  NORMATIVE = 'normative'
}

export enum EmotionalValence {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
  MIXED = 'mixed'
}

export enum RiskSeverity {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum TherapistMoveType {
  EMPATHIC_ATTUNEMENT = 'empathic_attunement',
  CHALLENGE = 'challenge',
  INTERPRETATION = 'interpretation',
  SILENCE = 'silence',
  REFLECTION = 'reflection'
}

export enum SessionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  ANALYZED = 'analyzed',
  ERROR = 'error'
}

// Core Types
export interface Structure {
  name: StructureName;
  label: string;
  description: string;
  color: string;
  icon: string; // lucide icon name
}

export interface Moment {
  id: number;
  timestamp: string; // e.g., "12:34"
  quote: string;
  context: string;
  type: 'immediate_experience' | 'recalled_past' | 'future_oriented' | 'reflective';
  valence: EmotionalValence;
  intensity: number; // 0.0 - 1.0
  structures: StructureName[];
  therapistMove: TherapistMoveType;
  therapistQuote: string;
}

export interface RiskFlag {
  id: number;
  severity: RiskSeverity;
  signal: string;
  detail: string;
  algorithmMatch: string;
  recommendation: string;
  interventionType: string;
}

export interface PractitionerMatch {
  id: number;
  code: string; // PR-SPECIALTY-NNN
  name: string; // Methodology name, not person name
  specialty: string;
  matchScore: number; // 0-100
  methodology: string;
  interventionSequence: string[];
  outcomePatterns: { metric: string; change: string; confidence: number }[];
  matchReasoning: string;
  targetStructures: StructureName[];
}

export interface SimilarCase {
  id: number;
  patientCode: string; // SL-YYYY-NNNN
  matchScore: number; // 0-100
  presentingConcerns: string[];
  dominantStructures: StructureName[];
  sessionCount: number;
  keyThemes: string[];
  outcome: string;
  outcomeDetail: string;
  representativeQuote: string;
}

export interface QuickInsight {
  riskLevel: 'high' | 'moderate' | 'low';
  clinicalPriority: string;
  prognosis: string;
  topRecommendation: string;
  sessionNumber: number;
}

export interface SessionHistoryPoint {
  session: number;
  emotionalIntensity: number;
  reflectiveCapacity: number;
  emotionalRegulation: number;
  therapeuticAlliance: number;
}

export interface AnalysisResult {
  quickInsight: QuickInsight;
  moments: Moment[];
  riskFlags: RiskFlag[];
  practitionerMatches: PractitionerMatch[];
  similarCases: SimilarCase[];
  structureProfile: Record<StructureName, number>; // 0-1 prevalence
  sessionHistory: SessionHistoryPoint[];
  therapistMoves: { type: TherapistMoveType; count: number; percentage: number }[];
}

export interface SessionInput {
  transcript: string;
  treatmentGoals: string;
  sessionNumber: number;
}
```

### Step 5: Create Mock Data
Create `src/lib/mock-data/` with these files:

**structures.ts** — All 10 structures with labels, descriptions, colors:
- body: #E07B6A (coral)
- immediate_experience: #F59E0B (amber)
- emotion: #EC4899 (pink)
- behaviour: #8B5CF6 (purple)
- social: #3B82F6 (blue)
- cognitive: #6366F1 (indigo)
- reflective: #2D7D7D (teal)
- narrative: #6B9E7D (sage)
- ecological: #A3A830 (olive)
- normative: #9CA3AF (gray)

**demo-transcript.ts** — A realistic 30-minute therapy session transcript (use the one from V2 reference as base)

**demo-analysis.ts** — A complete AnalysisResult object with:
- 5 coded moments with quotes, structures, therapist moves
- 2-3 risk flags (1 high, 1-2 medium)
- 3 practitioner matches with methodology details
- 3 similar cases with outcomes
- Structure profile (10 values)
- 5-session history for progress chart
- Therapist move distribution

**demo-report.ts** — Pre-generated clinician summary text and patient-friendly summary text

### Step 6: Create Basic Layout
Set up `src/app/layout.tsx` and `src/app/page.tsx`:
- Layout: fonts, metadata (title: "SessionLens — AI Clinical Decision Support")
- Page: simple redirect or landing — just enough that `npm run dev` shows something

### Step 7: Create Placeholder Components
Create empty but valid components that other agents will flesh out:
- `src/components/tabs/SessionInput.tsx`
- `src/components/tabs/ClinicalSummary.tsx`
- `src/components/tabs/DetailedAnalysis.tsx`
- `src/components/tabs/SimilarCases.tsx`
- `src/components/tabs/ExpertInsights.tsx`
- `src/components/tabs/FullReport.tsx`
- `src/components/layout/AppHeader.tsx`
- `src/components/layout/TabNavigation.tsx`

Each placeholder should be a valid React component that renders a `<div>` with the component name, e.g.:
```tsx
export default function ClinicalSummary() {
  return <div className="p-8 text-center text-gray-400">Clinical Summary — awaiting implementation</div>;
}
```

### Step 8: Create the Main Dashboard Page
`src/app/dashboard/page.tsx` — The main app page that:
- Has state for activeTab
- Renders AppHeader
- Renders TabNavigation (6 tabs)
- Conditionally renders the active tab component
- Passes mock data as props

### Step 9: Verify
```bash
npm run build
```
Fix ANY errors. The project must compile cleanly.

## COMPLETION CRITERIA
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` succeeds
- [ ] All TypeScript types compile
- [ ] Mock data is populated and importable
- [ ] Dashboard page renders with tab navigation
- [ ] All 6 placeholder tab components render
- [ ] Tailwind design system colors work
- [ ] Google Fonts load correctly

## LOG YOUR WORK
Append to `../logs/PROGRESS.md`:
```markdown
## Foundation Builder — [timestamp]
### Built
- (list what you created)
### Status
- Build: PASS/FAIL
- Dev server: PASS/FAIL
### Notes for other agents
- (anything they need to know)
```
