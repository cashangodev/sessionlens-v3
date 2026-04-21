# SessionLens V3: Complete Technical Architecture

## Overview

This package contains a comprehensive technical and scientific architecture for SessionLens V3, a therapy session analysis platform powered by clinical AI, vector embeddings, and CBT frameworks.

---

## Documents Included

### 1. **SESSIONLENS_V3_SCIENCE_ARCHITECTURE.md** (74 KB)
**The complete technical specification.** Contains:

- **Part 1: Data Model & Schema** — Complete PostgreSQL schema with 9 tables, constraints, indexes
- **Part 2: Embedding Strategy** — Multi-level embeddings (moment, structure profile, participant, session), similarity computation, model selection rationale
- **Part 3: AI-CBT Integration** — Cognitive distortion detection using DoT prompting, automatic thought identification, behavioral pattern recognition
- **Part 4: Matching Engine** — Multi-level semantic + structural + metadata matching, situation-aware matching, outcome integration, confidence scoring
- **Part 5: Synthetic Data Strategy** — Conservative generation methods (conditional, interpolation, symptom variants), quality control, responsible scaling to 10K+
- **Part 6: Safety & Clinical Guardrails** — Context-aware risk detection (negation, temporal analysis), confidence thresholds, hallucination prevention, clinical boundaries
- **Part 7-9:** Implementation roadmap, key decisions, privacy & compliance

**Read this first for the complete strategic picture.**

---

### 2. **DATABASE_SCHEMA_REFERENCE.sql** (20 KB)
**Production-ready PostgreSQL schema** with:

- 9 fully defined tables (participants, moments, phenomenological_structures, therapy_sessions, matching_results, cbt_analysis_templates, synthetic_data_provenance, risk_detection_log, audit_log)
- HNSW indexing on all vector columns
- Foreign key constraints
- CHECK constraints for data validation
- Helper functions for semantic/structural search
- Seed data examples
- Maintenance queries

**Copy-paste directly into Supabase. All pgvector-compatible.**

---

### 3. **IMPLEMENTATION_GUIDE.md** (21 KB)
**Day-1 engineering reference** with:

- Database setup procedures
- Embedding pipeline code (OpenAI integration)
- Matching API endpoints
- CBT analysis pipeline with streaming
- Risk detection multi-layer implementation
- Session processing end-to-end flow
- Standardized API response format
- Testing strategy (unit + integration)
- Performance benchmarks and optimization
- Monitoring & observability setup
- Deployment checklist
- Common issues & solutions

**Use this for implementation. Every code example is production-grade TypeScript/SQL.**

---

## Key Architecture Decisions

| Component | Decision | Why |
|-----------|----------|-----|
| **Embedding Model** | OpenAI text-embedding-3-small (1536-dim) | Sufficient clinical nuance, fast inference, pgvector-optimized |
| **Matching** | 50% semantic + 30% structural + 20% metadata | Semantic primary; structures add orthogonal signal; metadata grounds in context |
| **Risk Detection** | Multi-layer contextual analysis | Catches negation ("don't want to hurt myself"), temporal shifts (past vs. present), surrounding context |
| **CBT Framework** | DoT (Diagnosis-of-Thought) prompting | 3-stage rigor: subjectivity → distortions → schemas. Model-validated approach |
| **Synthetic Data** | Conservative + quality gates | Prioritize precision over scale; every synthetic moment quality-scored |
| **Confidence Capping** | Max 95% | Forces humility; room for unknown unknowns |
| **Clinical Boundary** | AI suggests patterns; therapist decides | AI ≠ diagnosis, ≠ treatment prescription. Decision support only. |

---

## What Gets Built When

### Sprint 1-2: Foundation (Weeks 1-2)
- PostgreSQL schema (9 tables, all indexes)
- CSV data loading (40 participants, 768 moments)
- Basic CRUD operations

### Sprint 3-4: Intelligence (Weeks 3-4)
- Multi-level embeddings (moment, participant, structure profiles)
- HNSW vector indexing
- Semantic + structural matching

### Sprint 5-6: CBT Science (Weeks 5-6)
- Cognitive distortion detection
- Automatic thought identification
- Behavioral pattern recognition

### Sprint 7-8: Safety & Processing (Weeks 7-8)
- Context-aware risk detection
- Session processing pipeline
- All safety guardrails

### Sprint 9-10: Synthetic & Validation (Weeks 9-10)
- Conditional synthetic data generation
- Quality assessment
- Clinical validation testing

---

## Data Model at a Glance

```
participants (40 real + up to 9,960 synthetic)
  └─ moments (768 real moments + synthetic variants)
      ├─ embedding_moment_level (1536-dim vector)
      ├─ cognitive_distortions (CBT analysis)
      ├─ structures_present (10 phenomenological structures)
      └─ risk_flags (context-aware assessment)

therapy_sessions (uploaded by therapists)
  ├─ moments_extracted (from transcript)
  ├─ matched_experiences (top 10 similar cases with outcomes)
  ├─ cognitive_distortions_detected
  ├─ risk_flags
  └─ therapeutic_alliance_score

matching_results (cache of all comparisons)
  ├─ semantic_similarity (0-1)
  ├─ structural_alignment (0-1)
  ├─ metadata_relevance (0-1)
  ├─ combined_score (weighted)
  └─ confidence_percentile
```

---

## Safety Guarantees

### Risk Detection
- **Layer 1:** Keyword detection (baseline)
- **Layer 2:** Negation analysis ("don't want to" → downward adjust)
- **Layer 3:** Temporal analysis (past tense → lower weight)
- **Layer 4:** Context analysis (surrounding sentiment, support mentions)
- **Result:** Raw score adjusted contextually → final risk score (0-1)

### Hallucination Prevention
- All claims grounded in direct quotes
- Semantic consistency checks (does interpretation follow from quote?)
- Diagnosis boundary enforcement (AI can't diagnose)
- Confidence calibration (capped at 95%)

### Clinical Boundary Enforcement
- AI responsibility: Pattern detection, symptom clustering, matched cases
- Therapist responsibility: Diagnosis, treatment decisions, risk assessment, intervention selection

---

## Performance Targets

| Operation | Target | Method |
|-----------|--------|--------|
| Moment embedding | ~100ms | OpenAI API with async batching |
| Semantic search (10K vectors) | <50ms | HNSW index, ivfflat lists=100 |
| Structural search | <20ms | 10-dimensional vectors, optimized |
| CBT analysis | 3-5s | Claude streaming, parallel processing |
| Risk assessment | ~500ms | Local analysis + context extraction |
| Full session processing | 30-60s | Parallel moment analysis, async jobs |

**Database:** Connection pooling (PgBouncer), query caching (Redis), batch embedding jobs

---

## What This Solves

**From:** Keyword matching → Fake hardcoded case data → No semantic understanding → Cannot distinguish context

**To:** 
- Real vector semantics (1536-dim embeddings)
- Actual lived experience corpus (40 real + 9,960 synthetic with quality gates)
- Context-aware matching (semantic + structural + metadata)
- Rigorous CBT science (DoT prompting, distortion detection, schema analysis)
- Intelligent risk detection (negation, temporal, context-aware)
- Clinically-grounded AI (pattern detection, not diagnosis)

---

## How to Use These Documents

1. **Architects/Leads:** Read SESSIONLENS_V3_SCIENCE_ARCHITECTURE.md (Parts 1-4 for overview)
2. **Backend Engineers:** Use DATABASE_SCHEMA_REFERENCE.sql + IMPLEMENTATION_GUIDE.md
3. **ML Engineers:** Focus on embedding strategy (Part 2) + CBT integration (Part 3)
4. **Clinical Advisors:** Review Part 6 (safety guardrails) and Part 3 (CBT framework) for validation
5. **DevOps/Infrastructure:** IMPLEMENTATION_GUIDE.md sections 8-11 (monitoring, deployment)

---

## Next Steps

1. **Database Setup** (Week 1)
   - Create extension vector
   - Run all migrations
   - Verify HNSW indexes

2. **Data Loading** (Week 1)
   - Ingest 40 participants + 768 moments
   - Compute initial embeddings (~30 min)
   - Validate data quality

3. **Embedding Infrastructure** (Week 2)
   - Set up OpenAI API keys
   - Build embedding pipeline
   - Create update jobs

4. **Matching & Testing** (Week 3-4)
   - Implement matching algorithm
   - Test on sample sessions
   - Benchmark performance

5. **Clinical Validation** (Weeks 7-10)
   - Validate CBT analysis with clinician
   - Test risk detection on curated scenarios
   - Approve synthetic data quality gates

---

## Questions? Edge Cases?

All major edge cases are covered in the architecture:

- **"I don't want to hurt myself"** → Risk detection handles negation (raw score - 0.5)
- **"I used to have thoughts about suicide"** → Temporal analysis reduces weight (past tense)
- **One session, multiple situations** → Situation-aware matching (each situation matched separately)
- **Insufficient data** → Confidence scoring with threshold ("insufficient data" response)
- **Synthetic data hallucination** → Quality gates + clinical review + marked-synthetic labeling
- **Therapist shouldn't diagnose?** → Clinical boundary enforcement in code
- **What if model says confidence = 99%?** → Capped at 95% maximum

---

## Files Summary

```
SESSIONLENS_V3_SCIENCE_ARCHITECTURE.md  74 KB
├─ 9 parts covering complete system design
├─ Schema, embeddings, CBT, matching, synthetic data, safety
├─ Production-ready, clinically rigorous

DATABASE_SCHEMA_REFERENCE.sql            20 KB
├─ Copy-paste PostgreSQL schema
├─ 9 tables, HNSW indexing, helper functions
├─ Supabase-compatible

IMPLEMENTATION_GUIDE.md                  21 KB
├─ Day-1 engineering reference
├─ Code examples (TypeScript + SQL)
├─ Testing, monitoring, deployment
```

**Total:** 115 KB of production-ready technical specification

---

Generated: April 10, 2026
Status: Ready for engineering phase
