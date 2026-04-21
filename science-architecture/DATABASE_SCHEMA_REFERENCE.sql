-- SessionLens V3: Complete PostgreSQL Schema
-- Supabase-compatible with pgvector extension

-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- TABLE 1: participants (Real lived experiences)
-- =====================================================================
CREATE TABLE participants (
  id SERIAL PRIMARY KEY,
  participant_id VARCHAR(10) UNIQUE NOT NULL, -- P001, P002, etc

  -- Demographics & Context
  nationality VARCHAR(50),
  lived_locations TEXT,
  age_range VARCHAR(10),
  gender VARCHAR(50),
  cultural_background VARCHAR(100),
  profession VARCHAR(100),

  -- Clinical Summary
  key_themes TEXT[],                          -- ['trauma_recovery', 'identity']
  summary TEXT,                               -- Narrative summary

  -- Tracking
  total_moments INT DEFAULT 0,
  avg_intensity FLOAT DEFAULT 0.0,

  -- Data Quality Indicators
  is_synthetic BOOLEAN DEFAULT FALSE,
  data_quality_score FLOAT,                   -- 0.0-1.0

  -- Embeddings (whole participant profile)
  embedding_participant_level vector(1536),
  embedding_updated_at TIMESTAMP,

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_participants_synthetic ON participants(is_synthetic);
CREATE INDEX idx_participants_themes ON participants USING GIN(key_themes);
CREATE INDEX idx_participants_embedding ON participants
  USING ivfflat (embedding_participant_level vector_cosine_ops)
  WITH (lists = 50);

-- =====================================================================
-- TABLE 2: moments (Individual lived experience moments)
-- =====================================================================
CREATE TABLE moments (
  id SERIAL PRIMARY KEY,
  participant_id VARCHAR(10) NOT NULL,
  moment_id VARCHAR(20) UNIQUE NOT NULL,     -- M001, M002, etc

  -- Text Content (verbatim from participant)
  verbatim_quote TEXT NOT NULL,
  moment_anchor VARCHAR(255),                -- Context label

  -- Phenomenological Classification
  life_categories TEXT[],                    -- ['autonomy', 'voice']
  life_category_axes TEXT[],                 -- ['agency:passivity']

  -- Moment Type & Emotional Profile
  moment_type VARCHAR(50) NOT NULL,          -- recalled_past, present_ongoing, anticipated_future, hypothetical
  CHECK (moment_type IN ('recalled_past', 'present_ongoing', 'anticipated_future', 'hypothetical')),

  emotional_valence VARCHAR(20),             -- positive, negative, ambivalent, mixed, neutral
  CHECK (emotional_valence IN ('positive', 'negative', 'ambivalent', 'mixed', 'neutral')),

  intensity FLOAT NOT NULL,                  -- 1-10 scale
  CHECK (intensity >= 1 AND intensity <= 10),

  -- Phenomenological Structures (10 structures)
  structures_present TEXT[],                 -- List of structure names
  structures_absent TEXT[],                  -- List of structure names

  -- Embeddings (semantic meaning of moment)
  embedding_moment_level vector(1536),
  embedding_updated_at TIMESTAMP,

  -- CBT Analysis Results
  cognitive_distortions JSONB,               -- Array of distortion objects with confidence
  automatic_thoughts JSONB,                  -- Array of thought objects
  behavioral_pattern_tags TEXT[],

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE CASCADE
);

CREATE INDEX idx_moments_participant ON moments(participant_id);
CREATE INDEX idx_moments_type ON moments(moment_type);
CREATE INDEX idx_moments_valence ON moments(emotional_valence);
CREATE INDEX idx_moments_structures ON moments USING GIN(structures_present);
CREATE INDEX idx_moments_embedding ON moments
  USING ivfflat (embedding_moment_level vector_cosine_ops)
  WITH (lists = 100);

-- =====================================================================
-- TABLE 3: phenomenological_structures (10 structures as feature matrix)
-- =====================================================================
CREATE TABLE phenomenological_structures (
  id SERIAL PRIMARY KEY,
  participant_id VARCHAR(10) NOT NULL,
  moment_id VARCHAR(20) NOT NULL,

  -- 10 Structures: presence (boolean) + intensity (0-1)
  body BOOLEAN DEFAULT FALSE,
  body_intensity FLOAT,

  prereflective BOOLEAN DEFAULT FALSE,
  prereflective_intensity FLOAT,

  emotion BOOLEAN DEFAULT FALSE,
  emotion_intensity FLOAT,

  behaviour BOOLEAN DEFAULT FALSE,
  behaviour_intensity FLOAT,

  social BOOLEAN DEFAULT FALSE,
  social_intensity FLOAT,

  cognitive BOOLEAN DEFAULT FALSE,
  cognitive_intensity FLOAT,

  reflective BOOLEAN DEFAULT FALSE,
  reflective_intensity FLOAT,

  narrative BOOLEAN DEFAULT FALSE,
  narrative_intensity FLOAT,

  ecological BOOLEAN DEFAULT FALSE,
  ecological_intensity FLOAT,

  normative BOOLEAN DEFAULT FALSE,
  normative_intensity FLOAT,

  -- Composite vector (10 dimensions, each 0-1)
  structure_profile vector(10),

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE CASCADE,
  FOREIGN KEY (moment_id) REFERENCES moments(moment_id) ON DELETE CASCADE
);

CREATE INDEX idx_structures_moment ON phenomenological_structures(moment_id);
CREATE INDEX idx_structures_participant ON phenomenological_structures(participant_id);
CREATE INDEX idx_structures_profile ON phenomenological_structures
  USING ivfflat (structure_profile vector_cosine_ops)
  WITH (lists = 50);

-- =====================================================================
-- TABLE 4: therapy_sessions (Uploaded by therapists)
-- =====================================================================
CREATE TABLE therapy_sessions (
  id SERIAL PRIMARY KEY,
  session_id UUID UNIQUE DEFAULT gen_random_uuid(),

  -- Session Metadata
  therapist_id VARCHAR(100) NOT NULL,        -- Anonymized
  client_pseudonym VARCHAR(100),             -- De-identified
  session_date DATE,
  session_duration_minutes INT,
  session_number INT,                        -- First, second, etc

  -- Transcript
  transcript_raw TEXT,                       -- Raw session text
  transcript_processed JSONB,                -- Structured: [{speaker, turn, text}]

  -- Client Context (optional, therapist-provided)
  presenting_problem TEXT,
  client_demographics JSONB,                 -- {age_range, gender, cultural_background}
  previous_diagnoses TEXT[],
  current_treatment_goals TEXT[],

  -- AI Analysis Results
  moments_extracted JSONB,                   -- Processed moments with analysis
  structures_detected JSONB,                 -- Phenomenological coding
  cognitive_distortions_detected JSONB,      -- CBT patterns found
  risk_flags JSONB,                          -- {risk_type, severity, evidence}[]
  behavioral_patterns JSONB,                 -- Observable patterns

  -- Matching Results
  matched_experiences JSONB,                 -- Top 10 matched moments
  matched_treatment_approaches JSONB,        -- Recommendations
  therapeutic_alliance_score FLOAT,          -- 0-1 estimated

  -- Clinical Validation
  clinician_review_status VARCHAR(20) DEFAULT 'pending',  -- pending, reviewed, approved
  CHECK (clinician_review_status IN ('pending', 'reviewed', 'approved')),
  clinician_notes TEXT,

  -- Processing Status
  processing_status VARCHAR(20) DEFAULT 'pending',  -- pending, processing, complete, error
  CHECK (processing_status IN ('pending', 'processing', 'complete', 'error')),
  processing_error TEXT,

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_therapist ON therapy_sessions(therapist_id);
CREATE INDEX idx_sessions_date ON therapy_sessions(session_date);
CREATE INDEX idx_sessions_status ON therapy_sessions(processing_status);
CREATE INDEX idx_sessions_review_status ON therapy_sessions(clinician_review_status);

-- =====================================================================
-- TABLE 5: matching_results (Cache matching operations)
-- =====================================================================
CREATE TABLE matching_results (
  id SERIAL PRIMARY KEY,
  session_id UUID NOT NULL,

  -- Query Details
  query_moment_id VARCHAR(20),               -- What was matched?
  query_session_segment_id VARCHAR(50),

  -- Matched Result
  matched_participant_id VARCHAR(10) NOT NULL,
  matched_moment_id VARCHAR(20) NOT NULL,

  -- Scoring
  semantic_similarity FLOAT,                 -- 0-1 (cosine distance)
  structural_alignment FLOAT,                -- 0-1 (structure profile)
  metadata_relevance FLOAT,                  -- 0-1 (demographics, themes)
  combined_score FLOAT,                      -- Weighted: 0.5*sem + 0.3*str + 0.2*meta
  confidence_percentile FLOAT,               -- Relative to cohort

  -- Match Quality
  sample_size_in_cohort INT,                 -- How many similar cases exist
  outcome_summary VARCHAR(50),               -- positive, mixed, neutral, insufficient_data

  -- Outcome Reference (if available)
  matched_participant_outcome_status VARCHAR(50),

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (session_id) REFERENCES therapy_sessions(session_id) ON DELETE CASCADE,
  FOREIGN KEY (matched_participant_id) REFERENCES participants(participant_id),
  FOREIGN KEY (matched_moment_id) REFERENCES moments(moment_id)
);

CREATE INDEX idx_matching_session ON matching_results(session_id);
CREATE INDEX idx_matching_participants ON matching_results(matched_participant_id);
CREATE INDEX idx_matching_score ON matching_results(combined_score DESC);

-- =====================================================================
-- TABLE 6: cbt_analysis_templates (Pre-computed CBT analyses)
-- =====================================================================
CREATE TABLE cbt_analysis_templates (
  id SERIAL PRIMARY KEY,
  moment_id VARCHAR(20) UNIQUE NOT NULL,

  -- Cognitive Distortions (15 categories)
  distortions JSONB,                         -- [{
                                             --   type: 'catastrophizing',
                                             --   confidence: 0.92,
                                             --   evidence: 'quote excerpt',
                                             --   alternative_thought: 'reframed'
                                             -- }]

  -- Automatic Thoughts
  automatic_thoughts JSONB,                  -- [{
                                             --   thought: 'I am a failure',
                                             --   belief_strength: 8,
                                             --   validity: 0.3
                                             -- }]

  -- Behavioral Analysis
  behavioral_activations TEXT[],             -- What helped
  behavioral_avoidances TEXT[],              -- What's avoided

  -- Therapeutic Implications
  intervention_suggestions TEXT[],           -- CBT-based ideas
  exposure_readiness FLOAT,                  -- 0-1 readiness for change

  -- Validity & Confidence
  analysis_confidence FLOAT,                 -- Overall model confidence
  requires_human_review BOOLEAN DEFAULT FALSE,

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (moment_id) REFERENCES moments(moment_id) ON DELETE CASCADE
);

CREATE INDEX idx_cbt_moment ON cbt_analysis_templates(moment_id);
CREATE INDEX idx_cbt_distortions ON cbt_analysis_templates USING GIN(distortions);

-- =====================================================================
-- TABLE 7: synthetic_data_provenance (Track all synthetic generations)
-- =====================================================================
CREATE TABLE synthetic_data_provenance (
  id SERIAL PRIMARY KEY,
  synthetic_participant_id VARCHAR(10) UNIQUE NOT NULL,

  -- Generation Details
  generation_method VARCHAR(50) NOT NULL,    -- conditional, interpolated, symptom_variant
  CHECK (generation_method IN ('conditional', 'interpolated', 'symptom_variant')),

  generation_prompt TEXT,
  generation_seed_participant_ids VARCHAR(10)[],
  generation_model VARCHAR(50),              -- gpt4, claude-3.5-sonnet
  generation_temperature FLOAT,

  -- Quality Assessment
  diversity_score FLOAT,                     -- 0-1 (fills what gap?)
  clinical_validity_score FLOAT,             -- 0-1 (assessed by LLM)
  realism_score FLOAT,                       -- 0-1 (authentic voice?)
  diversity_categories JSONB,                -- What demographic gaps filled

  -- Labeling
  is_marked_synthetic BOOLEAN DEFAULT TRUE,
  synthetic_confidence FLOAT,                -- How confident it's synthetic

  -- Generation Statistics
  moments_generated INT DEFAULT 0,

  -- Human Review
  human_review_status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, rejected
  reviewed_at TIMESTAMP,
  reviewed_by VARCHAR(100),
  review_notes TEXT,

  -- Audit
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_synthetic_method ON synthetic_data_provenance(generation_method);
CREATE INDEX idx_synthetic_quality ON synthetic_data_provenance(clinical_validity_score DESC);
CREATE INDEX idx_synthetic_review ON synthetic_data_provenance(human_review_status);

-- =====================================================================
-- TABLE 8: risk_detection_log (Audit trail for safety)
-- =====================================================================
CREATE TABLE risk_detection_log (
  id SERIAL PRIMARY KEY,
  session_id UUID,
  moment_id VARCHAR(20),

  -- Risk Classification
  risk_type VARCHAR(50),                     -- self_harm, suicide_ideation, harm_to_others, substance_abuse
  severity VARCHAR(20) NOT NULL,             -- low, medium, high, critical
  CHECK (severity IN ('low', 'medium', 'high', 'critical')),

  -- Evidence
  flagged_text VARCHAR(500),                 -- The exact problematic text
  risk_reason_code VARCHAR(100),             -- Why flagged: negation_missed, context_ignored, etc

  -- AI Processing
  raw_model_score FLOAT,                     -- Before context adjustment (0-1)
  context_adjusted_score FLOAT,              -- After analysis (0-1)
  confidence_level FLOAT,                    -- Model confidence (0-1)

  -- Context Details
  contains_negation BOOLEAN,
  is_past_tense BOOLEAN,
  is_hypothetical BOOLEAN,
  surrounding_sentiment FLOAT,               -- -1 to 1
  mentions_support_access BOOLEAN,

  -- Human Validation
  clinician_reviewed BOOLEAN DEFAULT FALSE,
  clinician_assessment VARCHAR(20),          -- valid_flag, false_positive, insufficient_data
  CHECK (clinician_assessment IN ('valid_flag', 'false_positive', 'insufficient_data')),
  clinician_notes TEXT,

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP
);

CREATE INDEX idx_risk_severity ON risk_detection_log(severity);
CREATE INDEX idx_risk_session ON risk_detection_log(session_id);
CREATE INDEX idx_risk_unreviewed ON risk_detection_log
  WHERE clinician_reviewed = FALSE;
CREATE INDEX idx_risk_created ON risk_detection_log(created_at DESC);

-- =====================================================================
-- TABLE 9: audit_log (Complete audit trail)
-- =====================================================================
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),

  -- Action Details
  action VARCHAR(50) NOT NULL,               -- read, write, delete, match, analyze
  user_id VARCHAR(100),

  -- Resource Details
  resource_type VARCHAR(50),                 -- session, participant, moment, analysis
  resource_id VARCHAR(100),

  -- Data Classification
  classification VARCHAR(50),                -- public, internal, sensitive, restricted

  -- Network
  ip_address INET,

  -- Details
  query_summary JSONB,
  status VARCHAR(20),                        -- success, error
  error_message TEXT,

  -- Performance
  duration_ms INT
);

CREATE INDEX idx_audit_timestamp ON audit_log(timestamp DESC);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_resource ON audit_log(resource_type, resource_id);

-- =====================================================================
-- HELPER FUNCTIONS
-- =====================================================================

-- Search moments by semantic similarity
CREATE OR REPLACE FUNCTION search_moments_semantic(
  query_embedding vector(1536),
  limit_count INT DEFAULT 10
)
RETURNS TABLE (
  moment_id VARCHAR,
  participant_id VARCHAR,
  semantic_similarity FLOAT,
  verbatim_quote TEXT,
  emotional_valence VARCHAR,
  intensity FLOAT
) AS $$
  SELECT
    m.moment_id,
    m.participant_id,
    1 - (m.embedding_moment_level <-> query_embedding)::FLOAT AS semantic_similarity,
    m.verbatim_quote,
    m.emotional_valence,
    m.intensity
  FROM moments m
  WHERE m.embedding_moment_level IS NOT NULL
  ORDER BY m.embedding_moment_level <-> query_embedding
  LIMIT limit_count;
$$ LANGUAGE SQL STABLE;

-- Search moments by phenomenological structure
CREATE OR REPLACE FUNCTION search_moments_structural(
  query_profile vector(10),
  limit_count INT DEFAULT 10
)
RETURNS TABLE (
  moment_id VARCHAR,
  participant_id VARCHAR,
  structural_similarity FLOAT,
  body BOOLEAN,
  emotion BOOLEAN,
  cognitive BOOLEAN
) AS $$
  SELECT
    m.moment_id,
    m.participant_id,
    1 - (ps.structure_profile <-> query_profile)::FLOAT AS structural_similarity,
    ps.body,
    ps.emotion,
    ps.cognitive
  FROM phenomenological_structures ps
  JOIN moments m ON ps.moment_id = m.moment_id
  WHERE ps.structure_profile IS NOT NULL
  ORDER BY ps.structure_profile <-> query_profile
  LIMIT limit_count;
$$ LANGUAGE SQL STABLE;

-- Get matching statistics for quality reporting
CREATE OR REPLACE FUNCTION get_matching_statistics(
  target_participant_id VARCHAR
)
RETURNS TABLE (
  total_matches INT,
  avg_score FLOAT,
  max_score FLOAT,
  outcomes_positive INT,
  outcomes_mixed INT,
  outcomes_insufficient INT
) AS $$
  SELECT
    COUNT(*)::INT AS total_matches,
    AVG(combined_score)::FLOAT AS avg_score,
    MAX(combined_score)::FLOAT AS max_score,
    COUNT(*) FILTER (WHERE outcome_summary = 'positive')::INT AS outcomes_positive,
    COUNT(*) FILTER (WHERE outcome_summary = 'mixed')::INT AS outcomes_mixed,
    COUNT(*) FILTER (WHERE outcome_summary = 'insufficient_data')::INT AS outcomes_insufficient
  FROM matching_results
  WHERE matched_participant_id = target_participant_id;
$$ LANGUAGE SQL STABLE;

-- =====================================================================
-- SEED DATA (Example)
-- =====================================================================

INSERT INTO participants (
  participant_id, nationality, age_range, gender, cultural_background,
  profession, key_themes, summary, total_moments, avg_intensity, is_synthetic
) VALUES
  ('P001', 'US', '30-39', 'Female', 'Jewish-American', 'Therapist',
   ARRAY['trauma_recovery', 'identity'],
   'Survivor of childhood sexual abuse; recovered through narrative exposure and identity reconstruction',
   18, 7.2, FALSE),
  ('P002', 'Germany', '25-34', 'Male', 'German', 'Engineer',
   ARRAY['addiction_recovery', 'relationships'],
   'Alcohol addiction recovery; focused on social reconstruction and behavioral change',
   22, 6.8, FALSE);

-- =====================================================================
-- MAINTENANCE QUERIES
-- =====================================================================

-- Refresh HNSW index statistics
-- REINDEX INDEX CONCURRENTLY idx_moments_embedding;

-- Analyze query performance
-- ANALYZE moments;
-- ANALYZE participants;

-- Check index health
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- ORDER BY idx_scan DESC;

-- Count moments by emotional valence
-- SELECT emotional_valence, COUNT(*) FROM moments GROUP BY emotional_valence;

-- Find slow queries (requires log_statement = 'all' or log_duration = 100)
-- SELECT query, calls, total_time, mean_time FROM pg_stat_statements
-- ORDER BY mean_time DESC LIMIT 20;
