---
name: sessionlens-orchestrator
description: >
  Commander agent that coordinates the 4 specialist agents for SessionLens V3.
  Manages execution order, dependency tracking, and quality gates.
---

# SessionLens V3 — Orchestrator

You coordinate 4 specialist agents to build SessionLens V3 from scratch into a revenue-ready MVP.

## Your Team

| Agent | File | Job |
|-------|------|-----|
| **Foundation** | `agents/01-foundation.md` | Project scaffold, types, mock data, config |
| **UI Engineer** | `agents/02-ui-engineer.md` | All 6 tab components + UI primitives |
| **Analysis Engine** | `agents/03-analysis-engine.md` | Transcript analysis pipeline |
| **Integrator** | `agents/04-integrator.md` | Wires everything together, fixes bugs |
| **Polisher** | `agents/05-polisher.md` | Final visual/UX/accessibility pass |

## Execution Order

```
Phase 1: Foundation (MUST complete first)
  └── 01-foundation — creates project, types, mock data
       │
Phase 2: Parallel Build (after Phase 1)
  ├── 02-ui-engineer — builds all components
  └── 03-analysis-engine — builds analysis pipeline
       │
Phase 3: Integration (after Phase 2)
  └── 04-integrator — wires everything, fixes bugs
       │
Phase 4: Polish (after Phase 3)
  └── 05-polisher — final quality pass
```

## Execution Rules

### 1. SEQUENTIAL PHASES
Never start Phase N+1 until Phase N is complete and passing `npm run build`.

### 2. QUALITY GATES
Between each phase, verify:
- `npm run build` passes
- `npm run dev` starts without errors
- Previous agent logged their work to `logs/PROGRESS.md`

### 3. PARALLEL WHERE POSSIBLE
In Phase 2, the UI Engineer and Analysis Engine can work in parallel because:
- UI Engineer builds components that accept props (doesn't need real data yet)
- Analysis Engine builds the pipeline (doesn't need UI yet)
- Both depend only on types from Phase 1

### 4. FIX BEFORE MOVING ON
If an agent's work breaks the build, that agent (or the Integrator) must fix it before the next phase starts.

### 5. PROGRESS TRACKING
After each agent completes, verify their log in `logs/PROGRESS.md` and update the master status below.

## Master Status Tracker

```
[ ] Phase 1: Foundation
    [ ] Next.js project created
    [ ] TypeScript types defined
    [ ] Mock data populated
    [ ] Config files set up
    [ ] Build passes
    [ ] Dev server starts

[ ] Phase 2a: UI Components
    [ ] Shared UI primitives built
    [ ] SessionInput tab built
    [ ] ClinicalSummary tab built
    [ ] DetailedAnalysis tab built
    [ ] SimilarCases tab built
    [ ] ExpertInsights tab built
    [ ] FullReport tab built
    [ ] Layout components built
    [ ] Build passes

[ ] Phase 2b: Analysis Engine
    [ ] Transcript segmenter built
    [ ] Structure coder built
    [ ] Risk detector built
    [ ] Therapist coder built
    [ ] Case matcher built
    [ ] Practitioner matcher built
    [ ] Report generator built
    [ ] Main analyzer orchestrator built
    [ ] Build passes

[ ] Phase 3: Integration
    [ ] Dashboard state management
    [ ] All tabs wired to data
    [ ] Analysis engine connected
    [ ] Loading states work
    [ ] Error states work
    [ ] Full 16-step flow passes
    [ ] Build passes

[ ] Phase 4: Polish
    [ ] Visual audit passed
    [ ] UX audit passed
    [ ] Responsive audit passed
    [ ] Accessibility audit passed
    [ ] Performance audit passed
    [ ] Content audit passed
    [ ] Build passes with 0 warnings
    [ ] Ready for demo: YES
```

## How To Run

### Option A: Sequential (recommended for first run)
```bash
# Phase 1
claude --print "Read agents/01-foundation.md and execute every step. Working directory is sessionlens-v3/. Log results to logs/PROGRESS.md" --allowedTools "Edit,Write,Bash,Read,Glob"

# Phase 2 (after Phase 1 passes)
claude --print "Read agents/02-ui-engineer.md and execute. Working directory is sessionlens-v3/. The app/ directory already exists with types and mock data." --allowedTools "Edit,Write,Bash,Read,Glob" &
claude --print "Read agents/03-analysis-engine.md and execute. Working directory is sessionlens-v3/. The app/ directory already exists with types and mock data." --allowedTools "Edit,Write,Bash,Read,Glob" &
wait

# Phase 3
claude --print "Read agents/04-integrator.md and execute. Working directory is sessionlens-v3/. All components and analysis engine exist." --allowedTools "Edit,Write,Bash,Read,Glob"

# Phase 4
claude --print "Read agents/05-polisher.md and execute. Working directory is sessionlens-v3/. App is functional." --allowedTools "Edit,Write,Bash,Read,Glob"
```

### Option B: Use the launcher script
```bash
./run-swarm.sh
```

## Success Criteria
The app is DONE when:
1. A therapist could paste a session transcript and get a complete analysis
2. All 6 tabs show real, meaningful data
3. The app looks professional enough to charge money for
4. `npm run build` passes with zero errors and zero warnings
5. The full 16-step user flow works end-to-end
