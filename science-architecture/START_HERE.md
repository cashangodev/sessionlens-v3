# SessionLens V3: START HERE

You've received a complete technical architecture for SessionLens V3. This guide tells you which document to read first based on your role.

---

## In 60 Seconds

SessionLens V3 transforms therapy session analysis from keyword-matching to **clinical AI** using:
- **Vector embeddings** (1536-dim, semantic understanding)
- **CBT framework** (automatic cognitive distortion detection)
- **Phenomenological coding** (10 structures of lived experience)
- **Context-aware risk detection** (understands negation, temporal shifts)
- **Responsible synthetic data** (quality gates, clinical validation)

To match new therapy sessions against 10K+ learned lived experiences and surface "what worked for similar cases."

---

## What You're Getting

| File | Size | What It Is |
|------|------|-----------|
| **SESSIONLENS_V3_SCIENCE_ARCHITECTURE.md** | 74 KB | Complete technical specification (9 parts, 3000+ lines) |
| **DATABASE_SCHEMA_REFERENCE.sql** | 20 KB | Production PostgreSQL schema (copy-paste ready) |
| **IMPLEMENTATION_GUIDE.md** | 21 KB | Day-1 engineering reference (code examples, testing, deployment) |
| **EXECUTIVE_SUMMARY.txt** | 10 KB | One-page overview of entire system |
| **README.md** | 10 KB | Document navigation guide |
| **START_HERE.md** | This file | Which document to read based on your role |

**Total:** 152 KB, 3,900+ lines of production-ready specification

---

## READ BASED ON YOUR ROLE

### You're a Project Lead or Architect
**Read in this order:**
1. This file (2 min)
2. EXECUTIVE_SUMMARY.txt (5 min)
3. SESSIONLENS_V3_SCIENCE_ARCHITECTURE.md - Parts 1-4 (20 min)

**Why:** Get the big picture, understand key decisions, grasp the matching pipeline.

**Key sections:**
- Part 1: Data model (what gets stored)
- Part 2: Embedding strategy (how semantic search works)
- Part 3: CBT integration (how cognitive distortions are detected)
- Part 4: Matching engine (how sessions match to lived experiences)

---

### You're a Backend Engineer
**Read in this order:**
1. DATABASE_SCHEMA_REFERENCE.sql (10 min) - understand the shape of data
2. IMPLEMENTATION_GUIDE.md - sections 1-7 (30 min) - see code examples
3. SESSIONLENS_V3_SCIENCE_ARCHITECTURE.md - Parts 1-2, 4 (15 min) - understand the why

**Why:** You need to build the database, APIs, and pipelines. Schema first, then patterns.

**Key sections:**
- DATABASE_SCHEMA_REFERENCE.sql: Copy the schema. All pgvector-compatible.
- IMPLEMENTATION_GUIDE.md:
  - Section 1: Database setup
  - Section 2: Embedding pipeline (OpenAI integration)
  - Section 3: Matching API endpoints
  - Section 4: CBT analysis (Claude streaming)
  - Section 5: Risk detection
  - Section 6: Session processing
  - Section 7: API response format

---

### You're an ML Engineer
**Read in this order:**
1. SESSIONLENS_V3_SCIENCE_ARCHITECTURE.md - Part 2 (15 min) - embedding strategy
2. SESSIONLENS_V3_SCIENCE_ARCHITECTURE.md - Part 3 (10 min) - CBT framework
3. IMPLEMENTATION_GUIDE.md - sections 2, 4 (20 min) - code examples

**Why:** You own the embeddings, prompting, and model integrations.

**Key sections:**
- Part 2: Why text-embedding-3-small, multi-level embeddings, similarity metrics
- Part 3: DoT prompting, distortion detection pipeline, automatic thoughts
- Section 2: Embedding implementation (OpenAI)
- Section 4: CBT analysis (Claude streaming with examples)

---

### You're a Clinical Advisor / Clinical Validation Lead
**Read in this order:**
1. SESSIONLENS_V3_SCIENCE_ARCHITECTURE.md - Part 3 (15 min) - CBT framework
2. SESSIONLENS_V3_SCIENCE_ARCHITECTURE.md - Part 6 (10 min) - safety guardrails
3. SESSIONLENS_V3_SCIENCE_ARCHITECTURE.md - Part 4 (10 min) - matching rationale

**Why:** Validate the CBT science, safety design, and clinical appropriateness.

**Key sections:**
- Part 3: 
  - 3.1: Cognitive distortion detection using DoT prompting (15 categories)
  - 3.2: Automatic thought identification
  - 3.3: Behavioral pattern recognition
- Part 6:
  - 6.1: Risk detection with context (negation, temporal, surrounding)
  - 6.4: Clinical boundary enforcement (AI ≠ diagnosis)

**Your job:**
- [ ] Validate CBT distortion detection on 50+ sample moments
- [ ] Review risk detection edge cases (especially negation)
- [ ] Approve synthetic data quality gates (>0.75 clinical validity)
- [ ] Sign off on clinical boundaries before launch

---

### You're DevOps / Infrastructure
**Read in this order:**
1. DATABASE_SCHEMA_REFERENCE.sql (10 min) - indexing, HNSW config
2. IMPLEMENTATION_GUIDE.md - sections 8-11 (25 min) - monitoring, deployment
3. SESSIONLENS_V3_SCIENCE_ARCHITECTURE.md - Part 7-8 (10 min) - roadmap, decisions

**Why:** You own database optimization, monitoring, and deployment.

**Key sections:**
- DATABASE_SCHEMA_REFERENCE.sql:
  - HNSW index creation (lists=100 for 10K vectors)
  - Helper functions
  - Maintenance queries
- Section 8: Performance benchmarks (targets for query latency)
- Section 9: Testing strategy (unit, integration, load tests)
- Section 10: Monitoring (metrics to track)
- Section 11: Deployment checklist (20 items before go-live)

---

## Key Insights (All Roles Should Know)

### The Data Model is Small But Rich
- 40 real participants + up to 9,960 synthetic
- 768 real moments + variants
- Each moment has: quote, phenomenological structures (10), emotional valence, intensity
- Each moment gets: semantic embedding (1536-dim) + CBT analysis + risk score

### Matching is Multi-Dimensional
Not just semantic similarity. Three layers:
1. **Semantic** (50%): "Do the experiences feel similar?" (vector embeddings)
2. **Structural** (30%): "Do the lived experience signatures align?" (10 phenomenological structures)
3. **Metadata** (20%): "Are demographics/themes relevant?" (demographics, clinical themes)

**Example:** A trauma survivor (Structure: body, emotion, social) matches another trauma survivor even if their specific trauma narratives differ semantically.

### Risk Detection Understands Context
Not just keyword matching. Four layers:
1. **Keywords:** "hurt myself" detected
2. **Negation:** "don't want to" → score reduced by 50%
3. **Temporal:** Past tense ("used to") → score reduced by 40%
4. **Context:** Surrounding text mentions support → score reduced by 40% more

**Example:** "I used to hurt myself" (raw 0.8 → temporal 0.48 → context 0.29) vs "I want to hurt myself" (raw 0.8 → final 0.8) — VERY different risk profiles.

### Confidence is Capped at 95%
AI never says "100% confident." Forces humility and leaves room for human judgment.

### CBT Uses Formal DoT Prompting
3 stages:
1. **Subjectivity Assessment:** Fact or interpretation?
2. **Distortion Scoring:** Which 15 CBT distortions apply? (0-1 confidence each)
3. **Schema Analysis:** What underlying belief drives this?

Not just pattern matching — formal cognitive framework.

### Synthetic Data is Conservative
Generate only within constraints:
- Conditional: Expand existing participants (safer)
- Interpolated: Fill embedding space gaps (controlled)
- Symptom variants: Show trajectories (lower priority)

All synthetic data: marked as such, quality-scored (>0.75), human-reviewed.

### AI ≠ Therapist
Clear boundaries:
- **AI can:** Detect patterns, identify cognitive distortions, surface similar cases with outcomes
- **AI cannot:** Diagnose, prescribe treatment, assess risk alone, make clinical decisions
- **Therapist must:** Review AI insights, make all clinical decisions, assess risk independently

---

## Quick Navigation

**I need to understand...**

| What | Read |
|------|------|
| The overall system | EXECUTIVE_SUMMARY.txt |
| What data gets stored | DATABASE_SCHEMA_REFERENCE.sql |
| How embeddings work | SESSIONLENS_V3_SCIENCE_ARCHITECTURE.md Part 2 |
| How matching works | SESSIONLENS_V3_SCIENCE_ARCHITECTURE.md Part 4 |
| How CBT analysis works | SESSIONLENS_V3_SCIENCE_ARCHITECTURE.md Part 3 |
| How risk detection works | SESSIONLENS_V3_SCIENCE_ARCHITECTURE.md Part 6.1 |
| How to build the backend | IMPLEMENTATION_GUIDE.md sections 1-7 |
| How to deploy | IMPLEMENTATION_GUIDE.md sections 8-11 |
| Implementation timeline | SESSIONLENS_V3_SCIENCE_ARCHITECTURE.md Part 7 |
| Key decisions made | SESSIONLENS_V3_SCIENCE_ARCHITECTURE.md Part 8 |

---

## Implementation Timeline

**16 weeks to production:**

- **Weeks 1-2:** Schema + data loading
- **Weeks 3-4:** Embeddings infrastructure
- **Weeks 5-6:** Matching engine
- **Weeks 7-8:** CBT integration
- **Weeks 9-10:** Risk detection + safety
- **Weeks 11-12:** Synthetic data generation
- **Weeks 13-14:** Session processing pipeline
- **Weeks 15-16:** Testing, optimization, deployment

Each sprint is self-contained and testable.

---

## Success Metrics (Before Go-Live)

- [ ] HNSW indexing configured correctly (lists=100 for 10K vectors)
- [ ] Semantic search latency <50ms
- [ ] CBT distortion detection accuracy >80% (validated by clinician)
- [ ] Risk detection handles negation correctly (test: "don't want to hurt myself")
- [ ] Confidence capped at 95% (enforced in code)
- [ ] Synthetic data quality >0.75 (clinical validity)
- [ ] Full session processing <60s
- [ ] All 9 tables populated with clean data
- [ ] API endpoints responding correctly
- [ ] Monitoring/alerting set up
- [ ] Security audit passed

---

## Questions?

All major edge cases are handled in the architecture:

**"What if the model is too confident?"**
→ Confidence capped at 95% in code. Forces uncertainty even when model says 99%.

**"What if risk detection misses negation?"**
→ Multi-layer analysis: negation words explicitly detected, historical implementation detail documented.

**"What if synthetic data is bad?"**
→ Quality gates: every synthetic moment scored 0-1 on clinical validity, human review for anything <0.75.

**"What if one session has multiple situations?"**
→ Situation-aware matching: each situation matched independently, aggregated in results.

**"What if we need to add new structures?"**
→ Easy: add column to phenomenological_structures, regenerate structure profiles.

**"How do we know matches are correct?"**
→ Validate matching accuracy on held-out test set before launch.

---

## Next Step

1. **Choose your role above** ↑
2. **Read documents in the order listed**
3. **Schedule a review meeting** with team leads to discuss decisions
4. **Start implementation** following IMPLEMENTATION_GUIDE.md

---

**Generated:** April 10, 2026  
**Status:** Ready for engineering phase  
**Total specification:** 3,900+ lines, 152 KB
