# SessionLens V3: Clinical AI Architecture Document

**Version:** 1.0  
**Date:** April 2026  
**Status:** Technical Specification  
**Audience:** Engineering Team, Clinical Advisors, ML Team

---

## Executive Summary

SessionLens V3 implements a multi-layered AI system combining:
1. **Vector embeddings** (semantic understanding of lived experiences)
2. **Cognitive-Behavioral Therapy (CBT) framework** (automatic detection of cognitive distortions)
3. **Phenomenological coding** (capturing the 10 structures of lived experience)
4. **Matching engine** (connecting new therapy sessions to 10K+ learned cases)
5. **Safety guardrails** (risk detection, hallucination prevention, clinical boundaries)

This document specifies the exact schema, API designs, prompting strategies, and implementation priorities to move from keyword matching to clinically valid AI-powered analysis.

---

## Part 1: Data Model & Schema

### 1.1 Conceptual Data Architecture

```
┌─────────────────────────────────────────────────────────┐
│              LIVED EXPERIENCE CORPUS (10K+)            │
│  Real (40) + Synthetic (9,960) with quality labels     │
└─────────────────────────────────────────────────────────┘
                           ↓
        ┌──────────────────┴──────────────────┐
        ↓                                      ↓
  ┌────────────────┐               ┌──────────────────┐
  │  MOMENTS       │               │  STRUCTURES      │
  │ (phenomenology)│               │  (10 dimensions) │
  └────────────────┘               └──────────────────┘
        ↓                                      ↓
  [text embeddings]              [vector profiles]
        ↓                                      ↓
  ┌────────────────────────────────────────────────┐
  │     EMBEDDING SPACE (pgvector 1536-dim)       │
  │  - Moment-level embeddings (768 rows)         │
  │  - Participant-level embeddings (40 rows)     │
  │  - Session-level embeddings (incoming)        │
  └────────────────────────────────────────────────┘
        ↓
  ┌──────────────────────────────────────────┐
  │  NEW THERAPY SESSION TRANSCRIPT          │
  │  (uploaded by therapist)                 │
  │  - Embed at moment level                 │
  │  - Extract cognitive patterns            │
  │  - Detect structures                     │
  └──────────────────────────────────────────┘
        ↓
  ┌──────────────────────────────────────────┐
  │  MATCHING ENGINE                         │
  │  - Semantic similarity (cosine)          │
  │  - Structural alignment (dot product)    │
  │  - Metadata filtering (demographics)     │
  │  - Risk-aware filtering                  │
  └──────────────────────────────────────────┘
        ↓
  ┌──────────────────────────────────────────┐
  │  RECOMMENDATIONS & INSIGHTS              │
  │  - Similar cases with outcomes           │
  │  - Treatment patterns that worked        │
  │  - Cognitive distortion patterns         │
  │  - Risk flags                            │
  └──────────────────────────────────────────┘
```

### 1.2 PostgreSQL Schema (Supabase)

#### Table: `participants` (Real lived experiences)
```sql
CREATE TABLE participants (
  id SERIAL PRIMARY KEY,
  participant_id VARCHAR(10) UNIQUE NOT NULL, -- P001, P002, etc.
  
  -- Demographics & Context
  nationality VARCHAR(50),
  lived_locations TEXT,
  age_range VARCHAR(10),
  gender VARCHAR(50),
  cultural_background VARCHAR(100),
  profession VARCHAR(100),
  
  -- Clinical Summary
  key_themes TEXT[], -- array of strings: ['trauma_recovery', 'identity']
  summary TEXT,      -- narrative summary of lived experience
  
  -- Tracking
  total_moments INT,
  avg_intensity FLOAT,
  is_synthetic BOOLEAN DEFAULT FALSE, -- Label synthetic vs. real
  data_quality_score FLOAT, -- 0.0-1.0 for synthetic data quality
  
  -- Embedding
  embedding_participant_level vector(1536), -- Aggregate of all moments
  embedding_updated_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast retrieval
CREATE INDEX idx_participants_synthetic ON participants(is_synthetic);
CREATE INDEX idx_participants_themes ON participants USING GIN(key_themes);
CREATE INDEX idx_participants_embedding ON participants 
  USING ivfflat (embedding_participant_level vector_cosine_ops);
```

#### Table: `moments` (Individual lived experience moments)
```sql
CREATE TABLE moments (
  id SERIAL PRIMARY KEY,
  participant_id VARCHAR(10) NOT NULL,
  moment_id VARCHAR(20) UNIQUE NOT NULL, -- M001, M002, etc.
  
  -- Text Content
  verbatim_quote TEXT NOT NULL,
  moment_anchor VARCHAR(255), -- 'telling_my_therapist_about_boundary'
  
  -- Context & Classification
  life_categories TEXT[], -- ['autonomy', 'voice', 'relationships']
  life_category_axes TEXT[], -- ['agency:passivity', 'expression:silence']
  moment_type VARCHAR(50), -- 'recalled_past', 'present_ongoing', 'anticipated_future', 'hypothetical'
  emotional_valence VARCHAR(20), -- 'positive', 'negative', 'ambivalent', 'mixed', 'neutral'
  intensity FLOAT, -- 1-10 scale
  
  -- Structures (phenomenology)
  structures_present TEXT[], -- List of 10 structures present
  structures_absent TEXT[],  -- List of 10 structures absent
  
  -- Embeddings
  embedding_moment_level vector(1536),
  embedding_updated_at TIMESTAMP,
  
  -- CBT Analysis (populated by AI)
  cognitive_distortions JSONB, -- {distortion_type: string, confidence: float, evidence: string}[]
  automatic_thoughts JSONB,    -- {thought: string, belief_strength: 1-10, validity: float}[]
  behavioral_pattern_tags TEXT[],
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (participant_id) REFERENCES participants(participant_id)
);

CREATE INDEX idx_moments_participant ON moments(participant_id);
CREATE INDEX idx_moments_type ON moments(moment_type);
CREATE INDEX idx_moments_valence ON moments(emotional_valence);
CREATE INDEX idx_moments_embedding ON moments 
  USING ivfflat (embedding_moment_level vector_cosine_ops);
CREATE INDEX idx_moments_structures ON moments USING GIN(structures_present);
```

#### Table: `phenomenological_structures` (The 10 structures as a feature matrix)
```sql
CREATE TABLE phenomenological_structures (
  id SERIAL PRIMARY KEY,
  participant_id VARCHAR(10) NOT NULL,
  moment_id VARCHAR(20) NOT NULL,
  
  -- The 10 structures (binary presence/absence + intensity)
  body BOOLEAN, body_intensity FLOAT,
  prereflective BOOLEAN, prereflective_intensity FLOAT,
  emotion BOOLEAN, emotion_intensity FLOAT,
  behaviour BOOLEAN, behaviour_intensity FLOAT,
  social BOOLEAN, social_intensity FLOAT,
  cognitive BOOLEAN, cognitive_intensity FLOAT,
  reflective BOOLEAN, reflective_intensity FLOAT,
  narrative BOOLEAN, narrative_intensity FLOAT,
  ecological BOOLEAN, ecological_intensity FLOAT,
  normative BOOLEAN, normative_intensity FLOAT,
  
  -- Composite vector for similarity
  structure_profile vector(10), -- Each dimension = 0.0-1.0 presence score
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (participant_id) REFERENCES participants(participant_id),
  FOREIGN KEY (moment_id) REFERENCES moments(moment_id)
);

CREATE INDEX idx_structures_moment ON phenomenological_structures(moment_id);
CREATE INDEX idx_structures_profile ON phenomenological_structures 
  USING ivfflat (structure_profile vector_cosine_ops);
```

#### Table: `therapy_sessions` (New sessions uploaded by therapists)
```sql
CREATE TABLE therapy_sessions (
  id SERIAL PRIMARY KEY,
  session_id UUID UNIQUE DEFAULT gen_random_uuid(),
  
  -- Session Metadata
  therapist_id VARCHAR(100) NOT NULL, -- Anonymous therapist identifier
  client_pseudonym VARCHAR(100),      -- De-identified client
  session_date DATE,
  session_duration_minutes INT,
  session_number INT,                 -- First, second session, etc.
  
  -- Transcript
  transcript_raw TEXT,                -- Full session transcript
  transcript_processed JSONB,         -- [{speaker: 'therapist'|'client', turn: int, text: string}]
  
  -- Client Context (optional, therapist-provided)
  presenting_problem TEXT,
  client_demographics JSONB,          -- {age_range, gender, cultural_background, etc}
  previous_diagnoses TEXT[],
  current_treatment_goals TEXT[],
  
  -- AI Analysis Results
  moments_extracted JSONB,            -- Processed moments with embeddings
  structures_detected JSONB,          -- Phenomenological coding
  cognitive_distortions_detected JSONB, -- CBT analysis
  risk_flags JSONB,                   -- {risk_type, severity, evidence}[]
  behavioral_patterns JSONB,          -- Observable patterns
  
  -- Matching Results
  matched_experiences JSONB,          -- Top 10 matched moments with scores
  matched_treatment_approaches JSONB, -- Recommendations
  therapeutic_alliance_score FLOAT,   -- 0-1 estimated from transcript
  
  -- Clinical Validation
  clinician_review_status VARCHAR(20), -- 'pending', 'reviewed', 'approved'
  clinician_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  processing_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'complete', 'error'
  processing_error TEXT
);

CREATE INDEX idx_sessions_therapist ON therapy_sessions(therapist_id);
CREATE INDEX idx_sessions_date ON therapy_sessions(session_date);
CREATE INDEX idx_sessions_status ON therapy_sessions(processing_status);
```

#### Table: `matching_results` (Cache of matching operations)
```sql
CREATE TABLE matching_results (
  id SERIAL PRIMARY KEY,
  session_id UUID NOT NULL,
  
  -- What was matched
  query_moment_id VARCHAR(20),        -- If matching a single moment
  query_session_segment_id VARCHAR(50), -- If matching a transcript segment
  
  -- Top matches
  matched_participant_id VARCHAR(10),
  matched_moment_id VARCHAR(20),
  
  -- Scores
  semantic_similarity FLOAT,          -- Cosine distance between embeddings
  structural_alignment FLOAT,         -- Structure profile alignment
  metadata_relevance FLOAT,           -- Based on demographics, themes
  combined_score FLOAT,               -- Weighted combination
  confidence_percentile FLOAT,        -- Relative to other matches in cohort
  
  -- Match quality metadata
  sample_size_in_cohort INT,          -- How many similar cases exist
  outcome_summary VARCHAR(50),        -- 'positive', 'mixed', 'neutral', 'insufficient_data'
  
  -- Linked to outcome if tracked
  matched_participant_outcome_status VARCHAR(50),
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_matching_session ON matching_results(session_id);
CREATE INDEX idx_matching_participants ON matching_results(matched_participant_id);
CREATE INDEX idx_matching_score ON matching_results(combined_score DESC);
```

#### Table: `cbt_analysis_templates` (Pre-computed analyses)
```sql
CREATE TABLE cbt_analysis_templates (
  id SERIAL PRIMARY KEY,
  moment_id VARCHAR(20) UNIQUE,
  
  -- Cognitive Distortions (15 categories from CBT-BENCH)
  distortions JSONB, -- [{
                      --   type: 'catastrophizing'|'all_or_nothing'|...,
                      --   confidence: 0.0-1.0,
                      --   evidence_from_quote: string,
                      --   alternative_thought: string,
                      --   behavioral_consequence: string
                      -- }]
  
  -- Automatic Thoughts
  automatic_thoughts JSONB, -- [{
                            --   thought_content: string,
                            --   belief_strength: 1-10,
                            --   historical_validity: 0.0-1.0,
                            --   supports_wellbeing: boolean
                            -- }]
  
  -- Behavioral Patterns
  behavioral_activations TEXT[],      -- What helped (exercise, social contact, etc.)
  behavioral_avoidances TEXT[],       -- What's avoided (safety behaviors)
  
  -- Therapeutic Implications
  intervention_suggestions TEXT[],    -- CBT-based interventions
  exposure_readiness FLOAT,           -- 0-1 readiness for behavioral change
  
  -- Validity Metadata
  analysis_confidence FLOAT,          -- Overall model confidence
  requires_human_review BOOLEAN,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cbt_distortions ON cbt_analysis_templates 
  USING GIN(distortions);
```

#### Table: `synthetic_data_provenance` (Track all synthetic generations)
```sql
CREATE TABLE synthetic_data_provenance (
  id SERIAL PRIMARY KEY,
  synthetic_participant_id VARCHAR(10) UNIQUE,
  
  -- Generation Details
  generation_method VARCHAR(50), -- 'gpt4_conditional', 'mixup', 'paraphrase', 'symptom_amplification'
  generation_prompt TEXT,
  generation_seed_participant_ids VARCHAR(10)[],
  generation_model VARCHAR(50),
  generation_temperature FLOAT,
  
  -- Quality Assessment
  diversity_score FLOAT,              -- 0-1 relative to existing data
  clinical_validity_score FLOAT,      -- 0-1 assessed by clinician
  realism_score FLOAT,                -- 0-1 evaluated by model
  diversity_categories JSONB,         -- What gaps it fills
  
  -- Labeling
  is_marked_synthetic BOOLEAN DEFAULT TRUE,
  synthetic_confidence FLOAT,         -- How synthetic it appears
  
  -- Linkage
  moments_generated INT,              -- How many moments created
  
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by VARCHAR(100)
);

CREATE INDEX idx_synthetic_method ON synthetic_data_provenance(generation_method);
CREATE INDEX idx_synthetic_quality ON synthetic_data_provenance(clinical_validity_score DESC);
```

#### Table: `risk_detection_log` (Audit trail for safety)
```sql
CREATE TABLE risk_detection_log (
  id SERIAL PRIMARY KEY,
  session_id UUID,
  moment_id VARCHAR(20),
  
  -- Risk Detection
  risk_type VARCHAR(50), -- 'self_harm', 'suicide_ideation', 'harm_to_others', 'substance_abuse_escalation'
  severity VARCHAR(20),  -- 'low', 'medium', 'high', 'critical'
  
  -- Raw Evidence
  flagged_text VARCHAR(500),         -- The exact quote that triggered the flag
  risk_reason_code VARCHAR(100),     -- 'negation_missed', 'context_ignored', 'temporal_shift'
  
  -- AI Processing
  raw_model_score FLOAT,             -- 0-1 before context adjustment
  context_adjusted_score FLOAT,      -- After negation/temporal analysis
  confidence_level FLOAT,            -- Model confidence in assessment
  
  -- Human Validation
  clinician_reviewed BOOLEAN DEFAULT FALSE,
  clinician_assessment VARCHAR(20),  -- 'valid_flag', 'false_positive', 'insufficient_data'
  clinician_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP
);

CREATE INDEX idx_risk_severity ON risk_detection_log(severity);
CREATE INDEX idx_risk_session ON risk_detection_log(session_id);
CREATE INDEX idx_risk_unreviewed ON risk_detection_log(clinician_reviewed);
```

---

## Part 2: Embedding Strategy

### 2.1 Multi-Level Embedding Architecture

#### Level 1: Moment-Level Embeddings
**Purpose:** Capture the semantic meaning and phenomenological signature of individual lived experience moments

**Implementation:**
- **Model:** `text-embedding-3-small` (1536 dimensions)
- **Input:** Concatenation of:
  - `verbatim_quote` (primary content)
  - `moment_anchor` (context)
  - `life_categories` (thematic tags)
  - `emotional_valence` + `intensity` (as prefix: "VALENCE=positive INTENSITY=8.2")

```typescript
async function embedMoment(moment: Moment): Promise<number[]> {
  const text = `
    QUOTE: ${moment.verbatim_quote}
    ANCHOR: ${moment.moment_anchor}
    CATEGORIES: ${moment.life_categories.join(', ')}
    VALENCE: ${moment.emotional_valence}
    INTENSITY: ${moment.intensity}
  `.trim();
  
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    dimensions: 1536
  });
  
  return embedding.data[0].embedding;
}
```

**Storage:** `moments.embedding_moment_level`

**When to recompute:** On moment creation, or when any of these fields change:
- `verbatim_quote`, `moment_anchor`, `life_categories`, `emotional_valence`, `intensity`

---

#### Level 2: Structure-Profile Vectors
**Purpose:** Encode the phenomenological signature (which of the 10 structures are present/absent)

**Implementation:**
- **Dimensionality:** 10 (one per structure)
- **Computation:** Average intensity of each structure across all moments for a participant

```typescript
async function computeStructureProfile(
  participantId: string, 
  moments: Moment[]
): Promise<number[]> {
  const structures = [
    'body', 'prereflective', 'emotion', 'behaviour', 'social',
    'cognitive', 'reflective', 'narrative', 'ecological', 'normative'
  ];
  
  const profile = structures.map(struct => {
    const momentsWithStructure = moments.filter(m => 
      m.structures_present.includes(struct)
    );
    
    if (momentsWithStructure.length === 0) return 0.0;
    
    const avgIntensity = momentsWithStructure.reduce((sum, m) => {
      // Find intensity from phenomenological_structures table
      return sum + (m.structure_intensities[struct] || 0);
    }, 0) / momentsWithStructure.length;
    
    return avgIntensity / 10.0; // Normalize to 0-1
  });
  
  return profile; // 10-dimensional vector
}
```

**Storage:** `phenomenological_structures.structure_profile`

**Similarity computation:** Cosine distance (suitable for normalized vectors)

---

#### Level 3: Participant-Level Embedding (Aggregate)
**Purpose:** Represent the entire life experience trajectory of a participant for cohort-level matching

**Implementation:**
- **Method 1 (Simple):** Average of all moment embeddings
- **Method 2 (Weighted):** Weighted average by intensity (higher intensity = higher weight)

```typescript
async function computeParticipantEmbedding(
  participantId: string,
  moments: Moment[]
): Promise<number[]> {
  if (moments.length === 0) return Array(1536).fill(0);
  
  // Method 2: Weighted average
  const weights = moments.map(m => m.intensity / 10.0);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  
  const avgEmbedding = new Array(1536).fill(0);
  
  moments.forEach((moment, idx) => {
    const weight = weights[idx] / totalWeight;
    const embedding = moment.embedding_moment_level;
    
    for (let i = 0; i < 1536; i++) {
      avgEmbedding[i] += embedding[i] * weight;
    }
  });
  
  return avgEmbedding;
}
```

**Storage:** `participants.embedding_participant_level`

**Use case:** Finding participants with similar overall life trajectories (useful for cohort analysis and synthetic data generation)

---

#### Level 4: Session-Level Embedding
**Purpose:** Represent a new therapy session as a unified vector for matching against the corpus

**Implementation:**
- **Input:** All extracted moments from transcript + phenomenological structures detected
- **Method:** Weighted aggregate (moments closer to end of session weighted higher, as they may represent progress)

```typescript
async function embedTherapySession(
  session: TherapySession,
  extractedMoments: SessionMoment[]
): Promise<number[]> {
  if (extractedMoments.length === 0) return Array(1536).fill(0);
  
  // Recency weighting: later moments have higher weight
  const positions = extractedMoments.map((_, idx) => (idx + 1) / extractedMoments.length);
  const weights = positions.map(p => Math.pow(p, 2)); // Quadratic: more weight to later moments
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  
  const sessionEmbedding = new Array(1536).fill(0);
  
  for (let i = 0; i < extractedMoments.length; i++) {
    const weight = weights[i] / totalWeight;
    const momentEmbedding = extractedMoments[i].embedding;
    
    for (let j = 0; j < 1536; j++) {
      sessionEmbedding[j] += momentEmbedding[j] * weight;
    }
  }
  
  return sessionEmbedding;
}
```

---

### 2.2 Similarity Computation Strategy

#### Semantic Similarity (Embedding-based)
```sql
-- Find the 10 most similar moments to a query
SELECT 
  m.moment_id,
  m.participant_id,
  1 - (m.embedding_moment_level <-> query_embedding) AS cosine_similarity,
  m.intensity,
  m.emotional_valence,
  m.verbatim_quote
FROM moments m
WHERE m.embedding_moment_level IS NOT NULL
ORDER BY m.embedding_moment_level <-> query_embedding
LIMIT 10;
```

**Similarity metric:** Cosine distance (`<->` operator in pgvector)
- Returns values 0-2 (0 = identical, 2 = opposite)
- Convert to similarity: `1 - distance` gives 0-1 scale (1 = identical)

---

#### Structural Alignment (Phenomenological)
```sql
-- Find moments with similar structure profiles
SELECT 
  m.moment_id,
  m.participant_id,
  ps.structure_profile <-> query_structure_profile AS structure_distance,
  ps.body, ps.emotion, ps.cognitive, -- etc.
  m.verbatim_quote
FROM moments m
JOIN phenomenological_structures ps USING (moment_id)
WHERE ps.structure_profile IS NOT NULL
ORDER BY ps.structure_profile <-> query_structure_profile
LIMIT 10;
```

**Similarity metric:** Cosine distance on 10-dimensional vectors
- Measures how similar the phenomenological signature is
- Independent of semantic content (orthogonal to text similarity)

---

#### Metadata Filtering (Demographics + Themes)
```sql
-- Combine semantic + structural + metadata filtering
WITH matched_semantically AS (
  SELECT 
    m.moment_id,
    m.participant_id,
    1 - (m.embedding_moment_level <-> query_embedding) AS semantic_sim
  FROM moments m
  WHERE m.embedding_moment_level IS NOT NULL
  ORDER BY semantic_sim DESC
  LIMIT 100 -- Broader search space
),
matched_structurally AS (
  SELECT 
    m.moment_id,
    m.participant_id,
    1 - (ps.structure_profile <-> query_structure_profile) AS structure_sim
  FROM moments m
  JOIN phenomenological_structures ps USING (moment_id)
  ORDER BY structure_sim DESC
  LIMIT 100
),
with_metadata AS (
  SELECT 
    COALESCE(sem.moment_id, str.moment_id) AS moment_id,
    COALESCE(sem.participant_id, str.participant_id) AS participant_id,
    COALESCE(sem.semantic_sim, 0) AS semantic_sim,
    COALESCE(str.structure_sim, 0) AS structure_sim,
    CASE 
      WHEN p.age_range = query_age_range THEN 0.2 ELSE 0 END +
    CASE 
      WHEN p.gender = query_gender THEN 0.15 ELSE 0 END +
    CASE 
      WHEN p.cultural_background = query_cultural_background THEN 0.15 ELSE 0 END +
    (SELECT COUNT(*) FILTER(WHERE p.key_themes && query_themes) / ARRAY_LENGTH(p.key_themes, 1)::FLOAT) * 0.2 AS metadata_relevance
  FROM matched_semantically sem
  FULL OUTER JOIN matched_structurally str ON sem.moment_id = str.moment_id
  JOIN participants p ON p.participant_id = COALESCE(sem.participant_id, str.participant_id)
)
SELECT 
  moment_id,
  participant_id,
  semantic_sim * 0.5 + structure_sim * 0.3 + metadata_relevance * 0.2 AS combined_score
FROM with_metadata
ORDER BY combined_score DESC
LIMIT 10;
```

**Weighting:** 
- Semantic similarity: 50% (most important — captures the core experience)
- Structural similarity: 30% (phenomenological alignment)
- Metadata relevance: 20% (demographics, themes)

---

### 2.3 Model Selection Rationale

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Model** | text-embedding-3-small | 1536 dims sufficient for clinical nuance; lower latency than 3-large; better than ada for semantic tasks |
| **Dimensionality** | 1536 | Sweet spot: high expressiveness without unnecessary compute; pgvector HNSW scales well |
| **Similarity Metric** | Cosine distance | Standard for normalized embeddings; interpretable as angle between vectors |
| **Indexing** | HNSW (Hierarchical Navigable Small World) | 10x faster than brute force on 10K vectors; sublinear query time O(log n) |
| **Refresh Strategy** | On update + periodic batch | Update when text changes; batch recompute weekly to catch drift |

---

### 2.4 Handling the 10 Phenomenological Structures

**Challenge:** How to meaningfully combine binary presence with continuous intensity across 10 dimensions

**Solution: Multi-Vector Approach**

```typescript
interface MomentVectors {
  // 1536-dim: semantic meaning of the quote + context
  semanticEmbedding: number[];
  
  // 10-dim: phenomenological profile
  structureProfile: {
    body: number;           // 0-1 presence score
    prereflective: number;
    emotion: number;
    behaviour: number;
    social: number;
    cognitive: number;
    reflective: number;
    narrative: number;
    ecological: number;
    normative: number;
  };
  
  // Query both independently, then combine
  scores: {
    semanticSim: number;    // From semantic embedding
    structuralSim: number;  // From structure profile
    combinedScore: number;  // Weighted: 0.6 * semantic + 0.4 * structural
  };
}
```

**Example matching query:**

```typescript
async function findSimilarMoments(
  queryMoment: SessionMoment,
  topK: number = 10
): Promise<Match[]> {
  // 1. Get embeddings
  const [querySemanticEmbedding, queryStructureProfile] = await Promise.all([
    embedMoment(queryMoment),
    computeStructureProfileForMoment(queryMoment)
  ]);
  
  // 2. Semantic search
  const semanticMatches = await db.sql`
    SELECT 
      m.moment_id,
      m.participant_id,
      1 - (m.embedding_moment_level <-> $1) AS semantic_sim
    FROM moments m
    ORDER BY m.embedding_moment_level <-> $1
    LIMIT ${topK * 3} -- Cast wider net
  `.bind([querySemanticEmbedding]);
  
  // 3. Structural search
  const structuralMatches = await db.sql`
    SELECT 
      m.moment_id,
      m.participant_id,
      1 - (ps.structure_profile <-> $1) AS structure_sim
    FROM moments m
    JOIN phenomenological_structures ps USING (moment_id)
    ORDER BY ps.structure_profile <-> $1
    LIMIT ${topK * 3}
  `.bind([queryStructureProfile]);
  
  // 4. Combine results
  const combined = new Map<string, any>();
  
  semanticMatches.forEach(row => {
    combined.set(row.moment_id, { ...row, structural_sim: 0 });
  });
  
  structuralMatches.forEach(row => {
    if (combined.has(row.moment_id)) {
      combined.get(row.moment_id).structure_sim = row.structure_sim;
    } else {
      combined.set(row.moment_id, { ...row, semantic_sim: 0 });
    }
  });
  
  // 5. Score and rank
  const results = Array.from(combined.values())
    .map(r => ({
      ...r,
      combined_score: 0.6 * r.semantic_sim + 0.4 * r.structure_sim
    }))
    .sort((a, b) => b.combined_score - a.combined_score)
    .slice(0, topK);
  
  return results;
}
```

---

## Part 3: AI-CBT Integration

### 3.1 Cognitive Distortion Detection

**Framework:** Diagnosis-of-Thought (DoT) Prompting (3 stages)

#### Stage 1: Subjectivity Assessment
**Goal:** Identify subjective interpretations vs. objective facts

```
PROMPT TEMPLATE:
---
You are a CBT analyst. Your task is to assess subjective interpretations in the following therapy quote.

QUOTE: "{quote}"

CONTEXT:
- Client's core beliefs: {beliefs}
- Recent life events: {events}
- Stated concerns: {concerns}

Instructions:
1. Extract all claims (statements about reality, self, future)
2. For each claim, classify as:
   - FACT: verifiable, objective
   - INTERPRETATION: subjective reading, potentially distorted
   
Output JSON:
{
  "claims": [
    {
      "text": "I'm a total failure",
      "type": "INTERPRETATION",
      "reason": "Value judgment based on selective evidence"
    }
  ]
}
---
```

---

#### Stage 2: Contrastive Reasoning
**Goal:** Identify which cognitive distortions explain the interpretation

```
PROMPT TEMPLATE:
---
You are analyzing distorted thinking patterns. Given this interpretation, which of these 15 CBT distortions apply?

INTERPRETATION: "{interpretation}"
EVIDENCE: "{evidence}"

15 DISTORTION TYPES:
1. All-or-nothing thinking (dichotomous, black-white)
2. Catastrophizing (assuming worst outcome)
3. Overgeneralization (one bad event = always happens)
4. Mind reading (assuming thoughts of others)
5. Fortune telling (predicting future negatively)
6. Emotional reasoning (feeling = fact)
7. Should statements (rigid rules: "must", "ought", "should")
8. Labeling (applying global label based on one event)
9. Personalization (taking responsibility for external events)
10. Mental filtering (ignoring positive, focusing on negative)
11. Disqualifying the positive (dismissing good things)
12. Jumping to conclusions (assuming without evidence)
13. Magnification/minimization (exaggerating bad, shrinking good)
14. Control fallacies (overestimating control or helplessness)
15. Blame (self-blame or blaming others)

Instructions:
1. For each distortion, score 0-1 confidence that it applies
2. Provide the specific evidence from the quote
3. Suggest an alternative, balanced thought

Output JSON:
{
  "distortions": [
    {
      "type": "Catastrophizing",
      "confidence": 0.92,
      "evidence": "\"I know I'll fail the exam\"",
      "alternative_thought": "I've studied the material. I may pass."
    }
  ]
}
---
```

---

#### Stage 3: Schema Analysis
**Goal:** Link distortions to underlying schemas (core beliefs)

```
PROMPT TEMPLATE:
---
DISTORTIONS DETECTED: {distortions_json}

PARTICIPANT CONTEXT:
- Life themes: {themes}
- Historical patterns: {patterns}
- Stated core beliefs: {beliefs}

Instructions:
1. Identify the underlying schema (core belief) driving each distortion
2. Map to 6 common schemas in therapy:
   - Abandonment/Instability
   - Mistrust/Abuse
   - Emotional Deprivation
   - Defectiveness/Shame
   - Failure
   - Vulnerability to Harm

3. Estimate historical validity: How often did this schema pattern protect them?
4. Estimate current validity: How much is it still true?

Output JSON:
{
  "schema_links": [
    {
      "distortion": "Catastrophizing",
      "underlying_schema": "Vulnerability to Harm",
      "historical_validity": 0.7,
      "current_validity": 0.3,
      "explanation": "In their trauma, bad things did happen unexpectedly. That pattern made sense then but limits them now."
    }
  ]
}
---
```

---

### 3.2 Implementation: Streaming API with Confidence Scoring

```typescript
import Anthropic from "@anthropic-ai/sdk";

interface CognitivDistortionAnalysis {
  quote: string;
  distortions: Array<{
    type: string;
    confidence: number;
    evidence: string;
    behavioral_consequence: string;
    alternative_thought: string;
    schema_link?: string;
  }>;
  overall_distortion_load: number; // 0-1 scale
  treatment_readiness: number;     // 0-1 likelihood of accepting CBT work
}

async function analyzeCognitiveDistortions(
  quote: string,
  context: {
    themes: string[];
    beliefs: string[];
    events: string[];
  }
): Promise<CognitivDistortionAnalysis> {
  const client = new Anthropic();
  
  let fullResponse = "";

  const stream = client.messages.stream({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: `You are a CBT analyst. Analyze this quote for cognitive distortions using a 3-stage process:

STAGE 1: Identify subjective interpretations vs facts
STAGE 2: Score which 15 distortion types apply (0-1 confidence)
STAGE 3: Link to underlying schemas

QUOTE: "${quote}"

CONTEXT:
- Themes: ${context.themes.join(", ")}
- Stated beliefs: ${context.beliefs.join(", ")}
- Recent events: ${context.events.join(", ")}

Respond in this exact JSON format:
{
  "stage1_claims": [{"text": "...", "type": "FACT|INTERPRETATION"}],
  "stage2_distortions": [
    {"type": "Catastrophizing", "confidence": 0.9, "evidence": "..."}
  ],
  "stage3_schema": "Vulnerability to Harm",
  "overall_distortion_load": 0.75,
  "treatment_readiness": 0.6
}`,
      },
    ],
  });

  for await (const chunk of stream) {
    if (
      chunk.type === "content_block_delta" &&
      chunk.delta.type === "text_delta"
    ) {
      fullResponse += chunk.delta.text;
      process.stdout.write(chunk.delta.text);
    }
  }

  // Parse JSON from response
  const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse JSON from model response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    quote,
    distortions: parsed.stage2_distortions.map((d: any) => ({
      type: d.type,
      confidence: d.confidence,
      evidence: d.evidence,
      behavioral_consequence: inferBehavioralConsequence(d.type, quote),
      alternative_thought: generateAlternativeThought(d.type, quote),
      schema_link: parsed.stage3_schema,
    })),
    overall_distortion_load: parsed.overall_distortion_load,
    treatment_readiness: parsed.treatment_readiness,
  };
}

function inferBehavioralConsequence(distortionType: string, quote: string): string {
  const consequences: Record<string, string> = {
    Catastrophizing: "Likely avoidance behavior, safety-seeking",
    "All-or-nothing thinking":
      "Rigid, inflexible approach; setback = total failure",
    Personalization: "Self-blame; difficulty setting boundaries",
    "Mind reading": "Social withdrawal; relationship conflict",
    "Emotional reasoning": "Decisions based on feeling, not evidence",
  };
  return consequences[distortionType] || "Reduced adaptive behavior";
}

function generateAlternativeThought(distortionType: string, quote: string): string {
  // Use a simpler LLM call or templates for speed
  const templates: Record<string, string> = {
    Catastrophizing: "What's most likely to happen?",
    "All-or-nothing thinking": "What's in the middle?",
    Overgeneralization: "Is this one event or a pattern?",
    "Mind reading": "Do I actually know what they're thinking?",
  };
  return templates[distortionType] || "What evidence supports or contradicts this?";
}
```

---

### 3.3 Automatic Thought Identification

**Goal:** Extract the specific thoughts the client had in a moment

```typescript
interface AutomaticThought {
  content: string;              // The actual thought
  belief_strength: number;      // 1-10 how much they believe it
  historical_validity: number;  // 0-1 how often it was true
  current_validity: number;     // 0-1 how true now
  supports_wellbeing: boolean;  // Does believing this help?
}

async function identifyAutomaticThoughts(
  moment: SessionMoment,
  context: ParticipantContext
): Promise<AutomaticThought[]> {
  const prompt = `
You are identifying automatic thoughts (immediate, pre-reflection thoughts) from a therapy moment.

MOMENT QUOTE: "${moment.verbatim_quote}"
MOMENT TYPE: ${moment.moment_type} (recalled_past, present_ongoing, anticipated_future, hypothetical)
EMOTIONAL RESPONSE: ${moment.emotional_valence} (intensity: ${moment.intensity}/10)

Automatic thoughts are spontaneous, occur before deliberation, and often contain cognitive distortions.

List 3-5 automatic thoughts that would logically precede this statement. For each:
1. State the thought in first-person
2. Rate belief strength (1-10)
3. Assess historical validity (was this thought protective then?)
4. Assess current validity (is it still true?)
5. Judge whether it supports wellbeing

Output JSON:
{
  "automatic_thoughts": [
    {
      "content": "I will always be alone",
      "belief_strength": 8,
      "historical_validity": 0.6,
      "current_validity": 0.3,
      "supports_wellbeing": false,
      "intervention_point": "Reality test: list evidence of connection"
    }
  ]
}
`;

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 800,
    messages: [{ role: "user", content: prompt }],
  });

  const json = JSON.parse(response.content[0].text);
  return json.automatic_thoughts;
}
```

---

### 3.4 Behavioral Pattern Recognition

**Goal:** Identify observable patterns in client behavior across sessions

```typescript
interface BehavioralPattern {
  pattern_name: string;
  evidence_quotes: string[];
  frequency: number;           // Sessions this pattern appears in
  trend: "increasing" | "decreasing" | "stable";
  functional_analysis: {
    trigger: string;
    behavior: string;
    consequence: string;       // Short-term + long-term
  };
  intervention_type: string;   // "behavioral_activation", "exposure", "skills_training"
}

async function identifyBehavioralPatterns(
  sessionTranscript: string,
  participantHistory: SessionMoment[]
): Promise<BehavioralPattern[]> {
  const prompt = `
Analyze this therapy session for behavioral patterns. Use functional analysis (trigger → behavior → consequence).

SESSION TRANSCRIPT EXCERPT:
"${sessionTranscript}"

HISTORICAL CONTEXT (patterns from prior sessions):
${participantHistory
  .map(
    (m) => `- ${m.moment_type}: "${m.verbatim_quote.substring(0, 50)}..."`
  )
  .join("\n")}

Identify:
1. Safety behaviors (behaviors that reduce anxiety short-term but prevent learning)
2. Avoidance patterns (what is the client not doing?)
3. Activation patterns (what increases engagement?)

For each pattern:
- List specific evidence from transcript
- Assess frequency (first time or recurring)
- Identify trigger, behavior, consequence
- Suggest CBT intervention

Output JSON:
{
  "patterns": [
    {
      "name": "Anticipatory Avoidance",
      "evidence": ["I didn't even try because I knew...", "I stay home on weekends"],
      "frequency": 3,
      "trigger": "Anticipation of social rejection",
      "behavior": "Avoidance of social situations",
      "consequence_short_term": "Anxiety relief",
      "consequence_long_term": "Isolation, missed opportunities, strengthened belief in danger",
      "suggested_intervention": "Behavioral activation + gradual exposure"
    }
  ]
}
`;

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1200,
    messages: [{ role: "user", content: prompt }],
  });

  return JSON.parse(response.content[0].text).patterns;
}
```

---

## Part 4: Matching Engine

### 4.1 Multi-Level Matching Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ NEW THERAPY SESSION (therapist uploads transcript)          │
└────────────────────┬────────────────────────────────────────┘
                     ↓
        ┌────────────────────────────┐
        │ MOMENT EXTRACTION          │
        │ (NLP segmentation)         │
        │ - Identify key moments     │
        │ - Extract quotes           │
        │ - Infer structures         │
        └────────────────┬───────────┘
                         ↓
        ┌────────────────────────────┐
        │ EMBEDDING & ANALYSIS       │
        │ - Semantic embeddings      │
        │ - Structure profiles       │
        │ - CBT distortions          │
        │ - Risk flags               │
        └────────────────┬───────────┘
                         ↓
   ┌─────────────────────────────────────────┐
   │ MATCHING LAYER 1: SEMANTIC              │
   │ Find 50 similar moments by embedding    │
   │ using cosine similarity search          │
   └─────────────────┬───────────────────────┘
                     ↓
   ┌─────────────────────────────────────────┐
   │ MATCHING LAYER 2: STRUCTURAL            │
   │ Filter by phenomenological alignment    │
   │ (which of 10 structures match?)         │
   └─────────────────┬───────────────────────┘
                     ↓
   ┌─────────────────────────────────────────┐
   │ MATCHING LAYER 3: SITUATIONAL           │
   │ Aggregate matches into situations:      │
   │ - Life categories                       │
   │ - Cognitive distortion patterns         │
   │ - Behavioral challenges                 │
   └─────────────────┬───────────────────────┘
                     ↓
   ┌─────────────────────────────────────────┐
   │ MATCHING LAYER 4: METADATA              │
   │ Consider demographics, themes:          │
   │ - Age range, gender, culture            │
   │ - Previous diagnoses                    │
   │ - Presenting problem overlap            │
   └─────────────────┬───────────────────────┘
                     ↓
   ┌─────────────────────────────────────────┐
   │ OUTCOME INTEGRATION                     │
   │ For each match, retrieve outcomes:      │
   │ - Did this approach help?               │
   │ - What was the trajectory?              │
   │ - How long did recovery take?           │
   └─────────────────┬───────────────────────┘
                     ↓
   ┌─────────────────────────────────────────┐
   │ CONFIDENCE SCORING                      │
   │ - Sample size in cohort                 │
   │ - Confidence percentile                 │
   │ - Data quality of matches               │
   │ - Risk-adjusted filtering               │
   └─────────────────┬───────────────────────┘
                     ↓
   ┌─────────────────────────────────────────┐
   │ RECOMMENDATIONS & INSIGHTS              │
   │ - Top 10 matched cases with outcomes    │
   │ - Treatment patterns that worked        │
   │ - Cognitive patterns to work on         │
   │ - Therapeutic approach suggestions      │
   └─────────────────────────────────────────┘
```

---

### 4.2 Situation-Aware Matching

**Key insight:** One session often contains multiple clinical situations. Match each separately.

```typescript
interface Situation {
  situation_id: string;
  situation_type: string;  // "identity_exploration", "trauma_processing", etc.
  presenting_quote: string;
  life_categories: string[];
  cognitive_distortions: string[];
  behavioral_pattern: string;
  structures_prominent: string[];
  emotional_valence: string;
  intensity: number;
}

interface SituationMatch {
  situation_id: string;
  matched_moments: Array<{
    moment_id: string;
    participant_id: string;
    matched_moment_anchor: string;
    semantic_similarity: number;
    structural_alignment: number;
    outcome: "positive" | "mixed" | "neutral" | "negative";
    participant_summary: string;
    treatment_approach_used: string;
    duration_to_resolution: string;
  }>;
  confidence_score: number;
  sample_size: number;
  clinical_notes: string;
}

async function matchSituation(
  situation: Situation,
  participantDemographics: any
): Promise<SituationMatch> {
  // 1. Embed the situation
  const situationEmbedding = await embedSituation(situation);
  const situationStructureProfile = await computeStructureProfile(
    situation.structures_prominent
  );

  // 2. Semantic matching
  const semanticMatches = await db.sql`
    SELECT 
      m.moment_id,
      m.participant_id,
      1 - (m.embedding_moment_level <-> $1::vector) AS semantic_sim,
      m.moment_anchor,
      m.structures_present,
      m.emotional_valence,
      m.intensity
    FROM moments m
    WHERE m.embedding_moment_level IS NOT NULL
    ORDER BY m.embedding_moment_level <-> $1::vector
    LIMIT 30
  `.bind([situationEmbedding]);

  // 3. Structural matching
  const structuralMatches = await db.sql`
    SELECT 
      m.moment_id,
      m.participant_id,
      1 - (ps.structure_profile <-> $1::vector) AS structure_sim
    FROM phenomenological_structures ps
    JOIN moments m USING (moment_id)
    WHERE ps.structure_profile IS NOT NULL
    ORDER BY ps.structure_profile <-> $1::vector
    LIMIT 30
  `.bind([situationStructureProfile]);

  // 4. Merge and filter
  const merged = mergeMatches(semanticMatches, structuralMatches);
  const filtered = filterByMetadata(
    merged,
    situation.life_categories,
    participantDemographics
  );

  // 5. Fetch outcomes
  const withOutcomes = await enrichWithOutcomes(filtered);

  // 6. Score and rank
  const scored = withOutcomes.map((match) => ({
    ...match,
    combined_score:
      0.5 * match.semantic_sim +
      0.3 * match.structure_sim +
      0.2 * match.metadata_relevance,
  }));

  const top10 = scored.sort((a, b) => b.combined_score - a.combined_score).slice(0, 10);

  // 7. Confidence assessment
  const confidenceScore = calculateConfidence(
    top10,
    situation,
    semanticMatches.length
  );

  return {
    situation_id: situation.situation_id,
    matched_moments: top10,
    confidence_score: confidenceScore,
    sample_size: semanticMatches.length,
    clinical_notes: generateClinicalNotes(top10, situation),
  };
}
```

---

### 4.3 Outcome Integration

**Goal:** Surface what actually worked for similar cases

```typescript
interface OutcomeData {
  participant_id: string;
  trajectory: Array<{
    session_number: int;
    intensity_score: number;
    progress_indicator: string;
    therapeutic_intervention: string;
  }>;
  final_status: "resolved" | "improved" | "maintained" | "deteriorated" | "unknown";
  total_duration_weeks: number;
  treatment_approaches_used: string[];
  helpful_factors: string[];
  barriers: string[];
}

async function enrichMatchWithOutcome(
  match: any
): Promise<Match & OutcomeData> {
  const outcomesQuery = await db.sql`
    SELECT 
      ot.outcome_trajectory,
      ot.final_status,
      ot.duration_weeks,
      ot.interventions_used,
      ot.helpful_factors,
      ot.barriers
    FROM outcome_tracking ot
    WHERE ot.participant_id = $1
  `.bind([match.participant_id]);

  if (!outcomesQuery[0]) {
    return { ...match, outcome: "insufficient_data" };
  }

  const outcome = outcomesQuery[0];

  return {
    ...match,
    outcome: outcome.final_status,
    duration: outcome.duration_weeks,
    interventions_that_worked: outcome.interventions_used.filter(
      (i: string) => outcome.helpful_factors.includes(i)
    ),
    barriers_encountered: outcome.barriers,
    trajectory: outcome.outcome_trajectory,
  };
}
```

---

### 4.4 Confidence Scoring

```typescript
function calculateConfidence(
  topMatches: any[],
  situation: Situation,
  totalSampleSize: number
): number {
  // Factor 1: Similarity to query (average of top 5)
  const avgTopSimilarity =
    topMatches
      .slice(0, 5)
      .reduce((sum, m) => sum + m.combined_score, 0) / 5;

  // Factor 2: Cohort size (more data = higher confidence)
  const cohortSizeScore = Math.min(totalSampleSize / 100, 1.0); // Saturates at 100 samples

  // Factor 3: Outcome consistency (do matches have similar outcomes?)
  const outcomeVariance = calculateVariance(
    topMatches.map((m) => m.outcome)
  );
  const consistencyScore = 1.0 - outcomeVariance; // Low variance = high consistency

  // Factor 4: Demographic representativeness
  const demographicCoverage = assessDemographicCoverage(
    topMatches,
    situation
  );

  // Weighted combination
  const confidence =
    0.4 * avgTopSimilarity +
    0.3 * cohortSizeScore +
    0.2 * consistencyScore +
    0.1 * demographicCoverage;

  return Math.min(confidence, 0.95); // Cap at 95% — always leave room for uncertainty
}

function assessDemographicCoverage(matches: any[], situation: Situation): number {
  const matchedCultures = new Set(
    matches.map((m) => m.cultural_background)
  );
  const matchedAgeRanges = new Set(matches.map((m) => m.age_range));
  const matchedGenders = new Set(matches.map((m) => m.gender));

  // Simple heuristic: how many different demographic groups represented?
  const diversity = (matchedCultures.size + matchedAgeRanges.size + matchedGenders.size) / 9; // 9 = rough max
  return Math.min(diversity, 1.0);
}
```

---

## Part 5: Synthetic Data Strategy

### 5.1 Challenge & Approach

**Challenge:**
- Real corpus: 40 participants × 768 moments
- Claim: 10,000+ lived experiences
- Gap: 9,232 synthetic moments needed
- Risk: Synthetic data that hallucinates unrealistic patterns

**Approach: Conservative, Clinically-Grounded Generation**

---

### 5.2 Synthetic Generation Methods

#### Method 1: Conditional Generation (Highest Quality)
**Goal:** Generate new moments for EXISTING participants based on their patterns

```typescript
async function generateConditionalMoment(
  participantId: string,
  existingMoments: Moment[],
  targetCategories: string[],
  targetStructures: string[]
): Promise<Moment> {
  const participantProfile = summarizeParticipant(
    participantId,
    existingMoments
  );

  const prompt = `
You are generating a realistic therapy moment for a real participant based on their actual lived experience.

PARTICIPANT PROFILE:
${participantProfile}

EXISTING MOMENTS (examples of their authentic voice):
${existingMoments
  .slice(0, 3)
  .map((m) => `- "${m.verbatim_quote}"`)
  .join("\n")}

GENERATION PARAMETERS:
- Target life categories: ${targetCategories.join(", ")}
- Target structures: ${targetStructures.join(", ")}
- Maintain: authentic voice, cultural context, psychological consistency

CONSTRAINTS:
- Use first-person language matching their style
- Include specific sensory/emotional details
- Avoid generic language or therapy clichés
- Be clinically plausible but not real

Generate a NEW moment (not in the list above) that:
1. Follows the same narrative arc and psychological logic
2. Explores a related but distinct aspect of their experience
3. Would be something this specific person could have experienced

Output JSON:
{
  "verbatim_quote": "...",
  "moment_anchor": "...",
  "life_categories": ["autonomy"],
  "emotional_valence": "positive",
  "intensity": 7.5,
  "structures_prominent": ["cognitive", "reflective"],
  "plausibility_self_assessment": 0.9
}
`;

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const generated = JSON.parse(response.content[0].text);

  return {
    ...generated,
    participant_id: participantId,
    moment_id: `M${Date.now()}_SYN`, // Mark as synthetic
    is_synthetic: true,
    generation_method: "conditional",
    generation_confidence: generated.plausibility_self_assessment,
  };
}
```

---

#### Method 2: Interpolation (Dimension Filling)
**Goal:** Generate moments for gap dimensions (e.g., "trauma survivors in recovery—hope narratives" is underrepresented)

```typescript
async function generateInterpolatedMoment(
  sourceMoments: Moment[], // 2-3 seed moments
  targetDimensions: {
    life_categories: string[];
    structures: string[];
    emotional_valence: string;
    intensity_range: [number, number];
  }
): Promise<Moment> {
  const sourceSummary = sourceMoments
    .map(
      (m) =>
        `"${m.verbatim_quote}" (categories: ${m.life_categories.join(", ")})`
    )
    .join("\n");

  const prompt = `
Generate a moment that blends themes from these experiences while filling specific dimensions:

SOURCE EXPERIENCES:
${sourceSummary}

TARGET DIMENSIONS:
- Categories: ${targetDimensions.life_categories.join(", ")}
- Structures: ${targetDimensions.structures.join(", ")}
- Emotional valence: ${targetDimensions.emotional_valence}
- Intensity: ${targetDimensions.intensity_range[0]}-${targetDimensions.intensity_range[1]} / 10

Create a NEW moment that:
1. Integrates themes from the sources
2. Targets the specified dimensions
3. Feels authentic and psychologically coherent
4. Represents a realistic lived experience

Output JSON: { "verbatim_quote": "...", ... }
`;

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  return JSON.parse(response.content[0].text);
}
```

---

#### Method 3: Guided Symptom Amplification (Lowest Quality, Use Sparingly)
**Goal:** Generate moments showing worse/better trajectories for outcome research

```typescript
async function generateSymptomVariant(
  baselineMoment: Moment,
  direction: "escalation" | "recovery",
  intensity_delta: number
): Promise<Moment> {
  const prompt = `
Generate a variant of this moment showing ${direction} of symptoms/wellbeing.

BASELINE: "${baselineMoment.verbatim_quote}"
DIRECTION: ${direction} (intensity delta: ${intensity_delta})

If escalation:
- Same underlying concern but with increased hopelessness, avoidance, safety-seeking
- More severe emotional/physical symptoms
- Reduced coping strategies

If recovery:
- Same underlying concern but with increased agency, meaning, connection
- Reduced symptom intensity
- More adaptive coping strategies

Maintain authenticity: this represents a trajectory someone could follow.

Output: { "verbatim_quote": "...", "intensity": ${baselineMoment.intensity + intensity_delta}, ... }
`;

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });

  return JSON.parse(response.content[0].text);
}
```

---

### 5.3 Quality Control & Labeling

```typescript
interface SyntheticMomentMetadata {
  generation_method: "conditional" | "interpolated" | "symptom_variant";
  source_participants?: string[];  // If interpolated
  clinical_validity_score: number; // 0-1, assessed by LLM
  realism_score: number;           // 0-1, does it sound authentic?
  diversity_contribution: string;  // What gap does it fill?
  is_marked_synthetic: boolean;    // Always true in DB
  human_review_status: "pending" | "approved" | "rejected";
  human_review_notes?: string;
}

async function assessSyntheticQuality(
  moment: Moment
): Promise<SyntheticMomentMetadata> {
  const prompt = `
Assess the clinical validity and authenticity of this moment:
"${moment.verbatim_quote}"

Using 5 rubrics (0-1 each):
1. CLINICAL VALIDITY: Does it represent a psychologically realistic lived experience?
2. AUTHENTICITY: Does the voice/language feel genuine vs. generated?
3. CONSISTENCY: Does it align with plausible life narratives?
4. CULTURAL APPROPRIATENESS: Is context handled respectfully?
5. THERAPEUTIC UTILITY: Would a therapist find value in analyzing this?

Provide a JSON response with scores for each and a combined quality_score.
`;

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });

  const assessment = JSON.parse(response.content[0].text);

  return {
    generation_method: moment.generation_method,
    clinical_validity_score: assessment.clinical_validity,
    realism_score: assessment.authenticity,
    diversity_contribution: identifyGapFilled(moment),
    is_marked_synthetic: true,
    human_review_status: assessment.quality_score > 0.75 ? "pending" : "pending", // All require review
  };
}
```

---

### 5.4 Responsible Synthetic Data Scaling

**Strategy:** Gradual, validated expansion

```
Phase 1: Conservative Foundation (Month 1)
- Generate 100 conditional moments for existing 40 participants
- 3 new moments per participant, targeting underrepresented categories
- 100% clinician review before production ingestion
- Quality bar: > 0.80 clinical validity

Phase 2: Dimension Filling (Month 2-3)
- Analyze embedding space gaps
- Generate 500 interpolated moments targeting sparse regions
- Focus on: underrepresented demographics, rare cognitive patterns
- Quality bar: > 0.75
- 20% clinician sample review

Phase 3: Outcome Trajectories (Month 3-4)
- Generate trajectory variants (escalation + recovery paths)
- 1,000-2,000 moments showing treatment progressions
- Lowest priority for strict validity (used for outcome learning, not matching)
- Quality bar: > 0.65

Phase 4: Scaling to 10K (Months 4-6)
- Synthetic participants (20-30 new full profiles)
- Real moments + conditional generation
- Continuous quality monitoring
- Phased rollout: 5K → 7.5K → 10K with validation gates
```

---

## Part 6: Safety & Clinical Guardrails

### 6.1 Risk Detection with Context Awareness

**Challenge:** "I want to hurt myself" vs. "I don't want to hurt myself" — both contain "hurt myself"

**Solution: Multi-Layer Contextual Analysis**

```typescript
interface RiskDetectionResult {
  detected_phrases: string[];
  raw_risk_score: number; // 0-1 from keyword matching
  
  negation_analysis: {
    contains_explicit_negation: boolean;
    negation_words: string[];
    negation_adjusted_score: number;
  };
  
  temporal_analysis: {
    is_past_tense: boolean;
    is_hypothetical: boolean;
    is_anticipated_future: boolean;
    temporal_adjusted_score: number;
  };
  
  context_analysis: {
    surrounding_content_sentiment: number;
    mentions_hope_or_planning: boolean;
    mentions_support_access: boolean;
    context_adjusted_score: number;
  };
  
  final_risk_score: number; // After all adjustments
  severity: "low" | "medium" | "high" | "critical";
  requires_escalation: boolean;
  recommended_action: string;
}

async function assessRisk(
  quote: string,
  sessionContext: SessionContext
): Promise<RiskDetectionResult> {
  // 1. Keyword detection (baseline)
  const riskKeywords = [
    "hurt myself",
    "kill myself",
    "suicide",
    "self-harm",
    "cut",
    "overdose",
    "harm others",
    "abuse",
  ];
  
  const detectedPhrases = riskKeywords.filter(
    (kw) =>
      quote.toLowerCase().includes(kw) ||
      findSimilarPhrase(quote, kw, threshold: 0.85)
  );
  
  const rawRiskScore = detectedPhrases.length / riskKeywords.length;

  // 2. Negation analysis
  const negationPhrases = [
    "don't want to",
    "don't need to",
    "no longer",
    "not anymore",
    "not thinking about",
    "would never",
  ];
  
  const hasNegation = negationPhrases.some((phrase) =>
    quote.toLowerCase().includes(phrase)
  );
  
  let negationAdjustedScore = rawRiskScore;
  if (hasNegation) {
    negationAdjustedScore = Math.max(0, rawRiskScore - 0.5); // Strong downward adjustment
  }

  // 3. Temporal analysis
  const tenseAnalysis = {
    isPastTense: quote.match(
      /was|had|used to|tried to|attempted|before|when i was/i
    ) !== null,
    isHypothetical: quote.match(
      /if i|would i|could i|might have|what if|imagine if/i
    ) !== null,
    isAnticipatedFuture: quote.match(
      /planning to|will|might|could in the future|considering/i
    ) !== null,
  };
  
  let temporalAdjustedScore = negationAdjustedScore;
  if (tenseAnalysis.isPastTense) {
    temporalAdjustedScore *= 0.6; // Lower weight to historical ideation
  }
  if (tenseAnalysis.isHypothetical) {
    temporalAdjustedScore *= 0.5; // Lower weight to hypothetical
  }

  // 4. Surrounding context analysis (next 2-3 turns)
  const surroundingText = extractSurroundingContext(
    quote,
    sessionContext.transcript,
    contextWindow: 500
  );
  
  const contextSentiment = analyzeSentiment(surroundingText);
  const mentionsHope = surroundingText.match(/hope|plan|future|want to/i);
  const mentionsSupportAccess = surroundingText.match(
    /therapist|medication|support|family|friend|hospital|crisis line/i
  );
  
  let contextAdjustedScore = temporalAdjustedScore;
  if (contextSentiment > 0.3) {
    contextAdjustedScore *= 0.7; // Positive context reduces concern
  }
  if (mentionsHope || mentionsSupportAccess) {
    contextAdjustedScore *= 0.6; // Protective factors present
  }

  // 5. Final determination
  const finalScore = contextAdjustedScore;
  const severity =
    finalScore > 0.75
      ? "critical"
      : finalScore > 0.5
      ? "high"
      : finalScore > 0.25
      ? "medium"
      : "low";

  const requiresEscalation = severity === "critical" || severity === "high";

  return {
    detected_phrases: detectedPhrases,
    raw_risk_score: rawRiskScore,
    negation_analysis: {
      contains_explicit_negation: hasNegation,
      negation_words: negationPhrases.filter((p) =>
        quote.toLowerCase().includes(p)
      ),
      negation_adjusted_score: negationAdjustedScore,
    },
    temporal_analysis: {
      ...tenseAnalysis,
      temporal_adjusted_score: temporalAdjustedScore,
    },
    context_analysis: {
      surrounding_content_sentiment: contextSentiment,
      mentions_hope_or_planning: !!mentionsHope,
      mentions_support_access: !!mentionsSupportAccess,
      context_adjusted_score: contextAdjustedScore,
    },
    final_risk_score: finalScore,
    severity,
    requires_escalation: requiresEscalation,
    recommended_action:
      severity === "critical"
        ? "Immediate clinician escalation + safety planning"
        : severity === "high"
        ? "Clinician review within 24 hours + risk assessment"
        : "Logged for monitoring + routine clinical review",
  };
}
```

---

### 6.2 Confidence Thresholds (Uncertainty Handling)

```typescript
interface AnalysisResult {
  analysis_type: string; // 'cognitive_distortion', 'behavioral_pattern', 'match'
  recommendation: string;
  confidence_score: number; // 0-1
}

function formatRecommendationWithConfidence(
  result: AnalysisResult
): string {
  if (result.confidence_score >= 0.85) {
    return `HIGH CONFIDENCE: ${result.recommendation}`;
  } else if (result.confidence_score >= 0.70) {
    return `MODERATE CONFIDENCE: ${result.recommendation}. Validate with client.`;
  } else if (result.confidence_score >= 0.50) {
    return `LOW CONFIDENCE: Pattern detected (${Math.round(result.confidence_score * 100)}% confidence). Requires human validation. Consider: ${result.recommendation}`;
  } else {
    return `INSUFFICIENT DATA: Cannot confidently detect ${result.analysis_type}. Recommend manual analysis or more session data.`;
  }
}

// Example application
const distortionResult: AnalysisResult = {
  analysis_type: "catastrophizing",
  recommendation: "Explore evidence for/against worst-case predictions",
  confidence_score: 0.62,
};

console.log(formatRecommendationWithConfidence(distortionResult));
// Output: "LOW CONFIDENCE: Pattern detected (62% confidence). Requires human validation. Consider: Explore evidence for/against worst-case predictions"
```

---

### 6.3 Hallucination Prevention

```typescript
interface HallucinationGuard {
  check_name: string;
  passed: boolean;
  evidence: string;
}

async function preventHallucinations(
  analysisResult: any,
  sourceText: string
): Promise<HallucinationGuard[]> {
  const guards: HallucinationGuard[] = [];

  // Guard 1: Evidence grounding
  guards.push({
    check_name: "Evidence Grounding",
    passed: analysisResult.evidence_from_source !== undefined,
    evidence: analysisResult.evidence_from_source
      ? `Claims grounded in: "${analysisResult.evidence_from_source}"`
      : "No direct quote provided — REJECT this analysis",
  });

  // Guard 2: Semantic consistency
  const semanticTest = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 100,
    messages: [
      {
        role: "user",
        content: `Does this interpretation logically follow from the source quote?
      
SOURCE: "${sourceText}"
INTERPRETATION: "${analysisResult.interpretation}"

Answer: yes/no/partially. Be strict.`,
      },
    ],
  });

  guards.push({
    check_name: "Semantic Consistency",
    passed: semanticTest.content[0].text.toLowerCase().startsWith("yes"),
    evidence: semanticTest.content[0].text,
  });

  // Guard 3: Boundary check (is this a diagnosis?)
  const isBeingDiagnostic = analysisResult.recommendation?.match(
    /diagnose|disorder|condition|mental illness|clinical diagnosis/i
  );

  guards.push({
    check_name: "Diagnosis Boundary",
    passed: !isBeingDiagnostic,
    evidence: isBeingDiagnostic
      ? "REJECT: AI is making clinical diagnoses. Only therapists can diagnose."
      : "Passes: Analysis stays within AI scope (pattern recognition, not diagnosis)",
  });

  // Guard 4: Confidence calibration
  guards.push({
    check_name: "Confidence Calibration",
    passed: analysisResult.confidence <= 0.95,
    evidence:
      analysisResult.confidence <= 0.95
        ? `Confidence appropriately capped at ${analysisResult.confidence}`
        : "REJECT: Confidence unreasonably high (>0.95). Adjust to realistic level.",
  });

  return guards;
}
```

---

### 6.4 Clinical Boundary Enforcement

```typescript
interface ClinicalBoundary {
  boundary_type: string;
  rule: string;
  ai_responsibility: string;
  therapist_responsibility: string;
}

const CLINICAL_BOUNDARIES: ClinicalBoundary[] = [
  {
    boundary_type: "Diagnosis",
    rule: "AI can identify symptoms and patterns; only therapists diagnose",
    ai_responsibility:
      "Extract presenting concerns, note symptom clusters, offer diagnostic hypotheses (e.g., 'pattern consistent with anxiety-driven avoidance')",
    therapist_responsibility:
      "Interview, differential diagnosis, formal diagnostic assessment, treatment planning",
  },
  {
    boundary_type: "Risk Management",
    rule: "AI flags risk; clinician assesses and intervenes",
    ai_responsibility:
      "Detect risk phrases, context-adjust scoring, escalate high-confidence flags",
    therapist_responsibility:
      "Risk assessment interview, safety planning, hospitalization if needed, crisis intervention",
  },
  {
    boundary_type: "Treatment Planning",
    rule: "AI suggests patterns; therapist selects interventions",
    ai_responsibility:
      "Identify cognitive distortions, behavioral patterns, matched similar cases with outcomes",
    therapist_responsibility:
      "Choose interventions based on client readiness, therapeutic relationship, clinical judgment, contraindications",
  },
  {
    boundary_type: "Outcome Attribution",
    rule: "AI shows correlations; therapists understand causation",
    ai_responsibility:
      "Show which approaches correlated with positive outcomes in similar cases",
    therapist_responsibility:
      "Understand context, counterfactuals, individual differences, whether correlation is causal",
  },
];

function enforceClincialBoundary(
  boundary: ClinicalBoundary,
  aiOutput: string
): {
  compliant: boolean;
  violations: string[];
  guidance: string;
} {
  const violations: string[] = [];

  if (
    boundary.boundary_type === "Diagnosis" &&
    aiOutput.match(/patient has|diagnosed with|suffers from|disorder|condition/i)
  ) {
    violations.push(
      "AI is making definitive diagnostic statements. Reframe as 'pattern consistent with...'"
    );
  }

  if (
    boundary.boundary_type === "Risk Management" &&
    !aiOutput.match(/escalate|clinician review|immediate assessment/i)
  ) {
    violations.push(
      "High-risk flag not accompanied by escalation recommendation"
    );
  }

  return {
    compliant: violations.length === 0,
    violations,
    guidance: boundary.ai_responsibility,
  };
}
```

---

## Part 7: Implementation Roadmap

### 7.1 Tech Stack

```
Frontend:          Next.js 14 + React + TypeScript
State Management:  TanStack Query (data fetching) + Zustand (local state)
Backend:           Node.js + Express.js (or Next.js API routes)
Database:          Supabase (PostgreSQL 14+) with pgvector
Embeddings:        OpenAI text-embedding-3-small
LLM:               Claude 3.5 Sonnet (analysis) + Claude Haiku (lightweight tasks)
Vector Storage:    pgvector with HNSW indexing
Async Jobs:        Bull (Redis queue) or Trigger.dev
Monitoring:        OpenTelemetry + Sentry
```

---

### 7.2 Sprint Breakdown

#### Sprint 1: Foundation (Weeks 1-2)
- [ ] Design & implement PostgreSQL schema (all tables)
- [ ] Set up pgvector with HNSW indexing
- [ ] Create migration scripts
- [ ] Build basic CRUD for participants, moments
- [ ] Establish data loading pipeline from CSV

#### Sprint 2: Embeddings (Weeks 3-4)
- [ ] Implement moment-level embeddings (OpenAI text-embedding-3-small)
- [ ] Compute participant-level embeddings (weighted average)
- [ ] Build structure-profile vectors (10-dimensional)
- [ ] Index all embeddings in pgvector
- [ ] Create embedding update jobs (on-change + batch)

#### Sprint 3: Matching (Weeks 5-6)
- [ ] Implement multi-level matching (semantic + structural + metadata)
- [ ] Build matching result caching
- [ ] Implement confidence scoring
- [ ] Create match visualization endpoints
- [ ] Test on sample therapy sessions

#### Sprint 4: CBT Integration (Weeks 7-8)
- [ ] Implement DoT prompting for cognitive distortion detection
- [ ] Build automatic thought identification
- [ ] Create behavioral pattern recognition
- [ ] Integrate Claude streaming for long analyses
- [ ] Build CBT result storage & retrieval

#### Sprint 5: Risk Detection (Weeks 9-10)
- [ ] Implement context-aware risk detection
- [ ] Build negation/temporal analysis
- [ ] Create risk escalation workflows
- [ ] Implement risk audit logging
- [ ] Test on synthetic high-risk scenarios

#### Sprint 6: Synthetic Data (Weeks 11-12)
- [ ] Implement conditional generation
- [ ] Build interpolation method
- [ ] Create quality assessment rubrics
- [ ] Build human review workflow
- [ ] Generate Phase 1 synthetic data (100 moments)

#### Sprint 7: Session Processing (Weeks 13-14)
- [ ] Build transcript parsing & moment extraction
- [ ] Integrate all analyses (embeddings + CBT + structures + risk)
- [ ] Create session processing pipeline
- [ ] Build result aggregation & formatting
- [ ] Create session result endpoints

#### Sprint 8: Polish & Safety (Weeks 15-16)
- [ ] Hallucination prevention checks
- [ ] Clinical boundary enforcement
- [ ] Comprehensive error handling
- [ ] Performance optimization (query optimization, caching)
- [ ] Security audit (PII handling, data retention)

---

### 7.3 High-Priority Implementation Details

#### Immediate (Week 1-2):
1. **Schema validation:** Run migrations against test DB, verify all constraints
2. **Data loading:** Ingest 40 participants + 768 moments + CSV data
3. **Embedding infrastructure:** Set up OpenAI API keys, test embedding generation, verify pgvector HNSW indexing

#### Critical Path (Week 3-4):
1. **Vector search:** Verify cosine distance queries return expected results
2. **Matching logic:** Implement and test multi-level weighting
3. **Performance:** Profile query times on 10K vectors, optimize if needed (should be <100ms)

#### Clinical Validation (Week 7-10):
1. **CBT accuracy:** Have clinical advisors validate distortion detection on 50 sample moments
2. **Risk detection:** Test on curated high-risk/false-positive scenarios
3. **Outcome integration:** Verify outcome data quality & availability

---

## Part 8: Key Decisions & Trade-offs

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Embedding model** | text-embedding-3-small | Sufficient dims (1536), fast inference, good for clinical text; 3-large overkill |
| **Similarity metric** | Cosine (1 - distance) | Standard for normalized embeddings, interpretable |
| **Matching weights** | 50% semantic, 30% structural, 20% metadata | Semantic most important; structure adds orthogonal signal |
| **Confidence cap** | 95% max | Forces humility; room for unknown unknowns |
| **Synthetic data** | Conservative generation + quality gates | Prioritize precision over scale; synthetic data quality > quantity |
| **Risk detection** | Multi-layer contextual analysis | Reduces false positives (e.g., negation misses) |
| **Clinical boundary** | AI: pattern detection; Therapist: decisions | AI as decision support, not replacement |

---

## Part 9: Data Privacy & Compliance

### 9.1 PII Handling

```typescript
enum DataClassification {
  PUBLIC = "public",               // Aggregate stats, de-identified themes
  INTERNAL = "internal",           // Session transcripts, raw moments
  SENSITIVE = "sensitive",         // Direct participant identifiers, health data
  RESTRICTED = "restricted"        // Therapist notes, risk assessments
}

// Data retention policy
const RETENTION_POLICY = {
  PUBLIC: "indefinite",            // Aggregate data can be retained
  INTERNAL: "3 years",             // Sessions/moments
  SENSITIVE: "1 year",             // Identifiers deleted after 1 year
  RESTRICTED: "6 months",          // High-sensitivity content
};

// Encryption
// - In transit: TLS 1.3
// - At rest: AES-256-GCM (database encryption)
// - Sensitive fields: application-level encryption (sodium)
```

### 9.2 Audit Logging

```sql
-- Every access to sensitive data is logged
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  action VARCHAR(50),           -- 'read', 'write', 'delete', 'match'
  user_id VARCHAR(100),
  resource_type VARCHAR(50),    -- 'session', 'participant', 'moment'
  resource_id VARCHAR(100),
  classification DataClassification,
  ip_address INET,
  query_details JSONB           -- What was queried
);
```

---

## Conclusion

This architecture transforms SessionLens from keyword-matching to **clinically-grounded AI-powered analysis**:

1. **Real data science:** Vector embeddings + multi-layer matching
2. **Rigorous CBT:** Formal distortion detection + automatic thoughts + schemas
3. **Phenomenological depth:** 10-structure coding + integrity preservation
4. **Safety-first:** Context-aware risk detection, confidence thresholds, clinical boundaries
5. **Responsible scaling:** Conservative synthetic data + quality gates

**Next step:** Engineer phase begins with schema implementation and embedding infrastructure. Clinical validation happens in parallel (Weeks 3-10).

