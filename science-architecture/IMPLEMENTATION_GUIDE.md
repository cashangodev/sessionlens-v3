# SessionLens V3: Implementation Guide

**Quick Reference for Engineers**

---

## 1. Database Setup

### Initial Migration

```bash
# 1. Create vector extension
psql -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 2. Run migrations (in order)
psql -f migrations/001_participants.sql
psql -f migrations/002_moments.sql
psql -f migrations/003_phenomenological_structures.sql
psql -f migrations/004_therapy_sessions.sql
psql -f migrations/005_matching_results.sql
psql -f migrations/006_cbt_analysis_templates.sql
psql -f migrations/007_synthetic_data_provenance.sql
psql -f migrations/008_risk_detection_log.sql

# 3. Create indexes
psql -f migrations/009_create_indexes.sql
```

### Verify HNSW Configuration

```sql
-- Check pgvector is installed
SELECT extname FROM pg_extension WHERE extname = 'vector';

-- Create HNSW indexes for main embedding tables
CREATE INDEX CONCURRENTLY idx_moments_embedding_hnsw ON moments 
  USING ivfflat (embedding_moment_level vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX CONCURRENTLY idx_participants_embedding_hnsw ON participants 
  USING ivfflat (embedding_participant_level vector_cosine_ops)
  WITH (lists = 50);

-- Verify indexes
SELECT schemaname, tablename, indexname FROM pg_indexes 
  WHERE indexname LIKE '%hnsw%' OR indexname LIKE '%ivfflat%';
```

---

## 2. Embedding Pipeline

### Setup

```typescript
// lib/embeddings.ts
import { OpenAI } from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function embedText(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    dimensions: 1536,
  });
  return response.data[0].embedding;
}

export async function embedMoment(moment: Moment): Promise<number[]> {
  const text = `
QUOTE: ${moment.verbatim_quote}
ANCHOR: ${moment.moment_anchor}
CATEGORIES: ${moment.life_categories.join(", ")}
VALENCE: ${moment.emotional_valence}
INTENSITY: ${moment.intensity}
  `.trim();

  return embedText(text);
}
```

### Batch Embedding

```typescript
// jobs/embedding-batch.ts
import Bull from "bull";

const embeddingQueue = new Bull("embeddings", {
  redis: { host: "127.0.0.1", port: 6379 },
});

embeddingQueue.process(5, async (job) => {
  const { momentId } = job.data;

  const moment = await supabase
    .from("moments")
    .select("*")
    .eq("moment_id", momentId)
    .single();

  const embedding = await embedMoment(moment.data);

  await supabase
    .from("moments")
    .update({
      embedding_moment_level: embedding,
      embedding_updated_at: new Date(),
    })
    .eq("moment_id", momentId);

  job.progress(100);
  return { success: true };
});

// Trigger batch jobs
export async function queueMomentEmbeddings(momentIds: string[]) {
  for (const momentId of momentIds) {
    await embeddingQueue.add({ momentId }, { attempts: 3 });
  }
}
```

---

## 3. Matching API

### Search Endpoint

```typescript
// api/v1/match.ts
import express from "express";
import { calculateConfidence } from "@/lib/matching";

const router = express.Router();

router.post("/match", async (req, res) => {
  const { sessionMoment, topK = 10 } = req.body;

  try {
    // 1. Embed the query
    const queryEmbedding = await embedMoment(sessionMoment);
    const queryStructureProfile = computeStructureProfile(
      sessionMoment.structures_prominent
    );

    // 2. Semantic search
    const { data: semanticMatches } = await supabase.rpc(
      "search_moments_semantic",
      {
        query_embedding: queryEmbedding,
        limit: topK * 3,
      }
    );

    // 3. Structural search
    const { data: structuralMatches } = await supabase.rpc(
      "search_moments_structural",
      {
        query_profile: queryStructureProfile,
        limit: topK * 3,
      }
    );

    // 4. Combine & score
    const combined = combineAndScoreMatches(
      semanticMatches,
      structuralMatches,
      sessionMoment
    );

    // 5. Calculate confidence
    const confidence = calculateConfidence(
      combined.slice(0, topK),
      semanticMatches.length
    );

    // 6. Fetch outcomes for top matches
    const withOutcomes = await enrichWithOutcomes(combined.slice(0, topK));

    res.json({
      matches: withOutcomes,
      confidence_score: confidence,
      sample_size: semanticMatches.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

### SQL Functions for Semantic Search

```sql
-- Create a Postgres function for semantic search
CREATE OR REPLACE FUNCTION search_moments_semantic(
  query_embedding vector(1536),
  limit_count INT DEFAULT 10
)
RETURNS TABLE (
  moment_id VARCHAR,
  participant_id VARCHAR,
  semantic_similarity FLOAT,
  verbatim_quote TEXT,
  emotional_valence VARCHAR
) AS $$
  SELECT
    m.moment_id,
    m.participant_id,
    1 - (m.embedding_moment_level <-> query_embedding) AS semantic_similarity,
    m.verbatim_quote,
    m.emotional_valence
  FROM moments m
  WHERE m.embedding_moment_level IS NOT NULL
  ORDER BY m.embedding_moment_level <-> query_embedding
  LIMIT limit_count;
$$ LANGUAGE SQL;

-- Call from TypeScript via supabase.rpc()
```

---

## 4. CBT Analysis Pipeline

### Cognitive Distortion Detection

```typescript
// lib/cbt.ts
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function detectCognitiveDistortions(
  quote: string,
  participantContext: ParticipantContext
): Promise<CognitiveDistortionAnalysis> {
  let fullResponse = "";

  const stream = anthropic.messages.stream({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: `
You are a CBT analyst specializing in cognitive distortion detection.

QUOTE: "${quote}"

PARTICIPANT CONTEXT:
- Key themes: ${participantContext.themes.join(", ")}
- Stated beliefs: ${participantContext.beliefs.join(", ")}

Analyze this quote using the Diagnosis-of-Thought framework:

1. STAGE 1: Identify subjective interpretations vs facts
2. STAGE 2: Score 15 cognitive distortion types (0-1 confidence each)
3. STAGE 3: Link to underlying schemas

Respond in JSON:
{
  "stage1_claims": [
    {"text": "...", "type": "FACT|INTERPRETATION"}
  ],
  "stage2_distortions": [
    {"type": "Catastrophizing", "confidence": 0.92, "evidence": "..."}
  ],
  "stage3_schema": "Vulnerability to Harm",
  "overall_distortion_load": 0.75,
  "treatment_readiness": 0.6
}
`,
      },
    ],
  });

  // Stream results to UI in real-time
  stream.on("text", (text) => {
    fullResponse += text;
    process.stdout.write(text);
  });

  await stream.finalMessage();

  // Parse and structure response
  const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid response format");

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    quote,
    distortions: parsed.stage2_distortions.map((d: any) => ({
      type: d.type,
      confidence: d.confidence,
      evidence: d.evidence,
      alternative_thought: generateAlternative(d.type, quote),
      behavioral_consequence: inferConsequence(d.type),
    })),
    overall_distortion_load: parsed.overall_distortion_load,
    treatment_readiness: parsed.treatment_readiness,
    schema_link: parsed.stage3_schema,
  };
}

function generateAlternative(distortionType: string, quote: string): string {
  const alternatives: Record<string, string> = {
    Catastrophizing: "What's most likely to happen?",
    "All-or-nothing thinking": "What's in the middle ground?",
    Overgeneralization: "Is this one event or a true pattern?",
    Personalization: "What parts are outside my control?",
    "Mind reading": "Do I actually know what they think?",
  };
  return alternatives[distortionType] || "What evidence challenges this thought?";
}
```

### Store CBT Analysis

```typescript
export async function storeCBTAnalysis(
  momentId: string,
  analysis: CognitiveDistortionAnalysis
): Promise<void> {
  await supabase
    .from("moments")
    .update({
      cognitive_distortions: analysis.distortions,
      updated_at: new Date(),
    })
    .eq("moment_id", momentId);
}
```

---

## 5. Risk Detection Implementation

### Multi-Layer Risk Assessment

```typescript
// lib/risk-detection.ts
export async function assessRisk(
  quote: string,
  sessionContext: SessionContext
): Promise<RiskDetectionResult> {
  // Layer 1: Keyword detection
  const riskKeywords = [
    "hurt myself",
    "kill myself",
    "suicide",
    "self-harm",
    "cut",
    "overdose",
  ];

  const detectedPhrases = riskKeywords.filter((kw) =>
    quote.toLowerCase().includes(kw)
  );

  const rawRiskScore = detectedPhrases.length / riskKeywords.length;

  // Layer 2: Negation analysis
  const negationPhrases = [
    "don't want to",
    "don't need to",
    "no longer",
    "not anymore",
    "would never",
  ];

  const hasNegation = negationPhrases.some((phrase) =>
    quote.toLowerCase().includes(phrase)
  );

  let negationAdjustedScore = rawRiskScore;
  if (hasNegation) {
    negationAdjustedScore = Math.max(0, rawRiskScore - 0.5);
  }

  // Layer 3: Temporal analysis
  const isPastTense = /was|had|tried to|before|used to/i.test(quote);
  const isHypothetical = /if i|would i|could i|what if/i.test(quote);

  let temporalAdjustedScore = negationAdjustedScore;
  if (isPastTense) temporalAdjustedScore *= 0.6;
  if (isHypothetical) temporalAdjustedScore *= 0.5;

  // Layer 4: Context analysis
  const surroundingText = extractSurroundingContext(
    quote,
    sessionContext.transcript
  );
  const contextSentiment = analyzeSentiment(surroundingText);
  const mentionsSupport = /therapist|family|friend|support|hospital/i.test(
    surroundingText
  );

  let finalScore = temporalAdjustedScore;
  if (contextSentiment > 0.3) finalScore *= 0.7;
  if (mentionsSupport) finalScore *= 0.6;

  // Determine severity
  const severity =
    finalScore > 0.75
      ? "critical"
      : finalScore > 0.5
      ? "high"
      : finalScore > 0.25
      ? "medium"
      : "low";

  // Log the assessment
  await supabase.from("risk_detection_log").insert({
    flagged_text: quote,
    raw_model_score: rawRiskScore,
    context_adjusted_score: finalScore,
    severity,
    risk_reason_code: hasNegation
      ? "negation_present"
      : isPastTense
      ? "past_tense"
      : "present_concern",
  });

  return {
    final_risk_score: finalScore,
    severity,
    requires_escalation: severity === "critical" || severity === "high",
    recommended_action:
      severity === "critical"
        ? "ESCALATE: Immediate clinician review + safety assessment"
        : severity === "high"
        ? "FLAG: Clinician review within 24 hours"
        : "MONITOR: Routine review",
  };
}
```

---

## 6. Session Processing Pipeline

### End-to-End Processing

```typescript
// api/v1/sessions/process.ts
export async function processTherapySession(
  sessionId: string
): Promise<ProcessingResult> {
  const session = await supabase
    .from("therapy_sessions")
    .select("*")
    .eq("session_id", sessionId)
    .single();

  if (!session.data)
    throw new Error(`Session ${sessionId} not found`);

  try {
    // Update status
    await updateSessionStatus(sessionId, "processing");

    // 1. Extract moments from transcript
    const moments = await extractMoments(session.data.transcript_raw);

    // 2. Embed moments
    const embeddedMoments = await Promise.all(
      moments.map(async (m) => ({
        ...m,
        embedding: await embedMoment(m),
      }))
    );

    // 3. Detect structures
    const withStructures = await Promise.all(
      embeddedMoments.map(async (m) => ({
        ...m,
        structures: await detectPhenomenologicalStructures(m.verbatim_quote),
      }))
    );

    // 4. CBT analysis for each moment
    const withCBT = await Promise.all(
      withStructures.map(async (m) => ({
        ...m,
        cognitive_distortions: await detectCognitiveDistortions(
          m.verbatim_quote,
          {}
        ),
      }))
    );

    // 5. Risk assessment
    const withRisk = withCBT.map((m) => ({
      ...m,
      risk: assessRisk(m.verbatim_quote, { transcript: session.data.transcript_raw }),
    }));

    // 6. Matching
    const withMatches = await Promise.all(
      withRisk.map(async (m) => ({
        ...m,
        matches: await matchMoment(m, topK: 10),
      }))
    );

    // 7. Store results
    await storeSessionResults(sessionId, withMatches);

    // 8. Update status
    await updateSessionStatus(sessionId, "complete");

    return {
      session_id: sessionId,
      moments_processed: withMatches.length,
      status: "complete",
      results_url: `/api/v1/sessions/${sessionId}/results`,
    };
  } catch (error) {
    await updateSessionStatus(sessionId, "error", error.message);
    throw error;
  }
}

async function extractMoments(transcript: string): Promise<SessionMoment[]> {
  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `Extract key moments from this therapy session transcript. Moments are significant statements where the client describes an experience, feeling, or realization.

TRANSCRIPT:
"${transcript}"

For each moment, identify:
1. The verbatim quote
2. A short anchor (context label)
3. Estimated emotional valence (positive, negative, mixed)
4. Intensity (1-10)

Output as JSON:
{
  "moments": [
    {
      "verbatim_quote": "...",
      "moment_anchor": "...",
      "emotional_valence": "mixed",
      "intensity": 7.5
    }
  ]
}
`,
      },
    ],
  });

  const json = JSON.parse(response.content[0].text);
  return json.moments;
}
```

---

## 7. API Response Format

### Standardized Matching Response

```typescript
interface MatchingResponse {
  session_id: string;
  timestamp: ISO8601;
  processing_duration_ms: number;

  moments_analyzed: number;
  situations_identified: number;

  matches: Array<{
    situation_id: string;
    situation_type: string;
    presenting_quote: string;

    top_matches: Array<{
      rank: number;
      matched_participant_id: string;
      matched_moment_anchor: string;
      matched_quote: string;

      // Scores
      semantic_similarity: number;           // 0-1
      structural_alignment: number;          // 0-1
      combined_score: number;                // 0-1
      confidence_percentile: number;         // 0-1

      // Outcome data
      outcome_status: "positive" | "mixed" | "insufficient";
      treatment_approaches_used: string[];
      duration_to_improvement: string;

      // Clinical summary
      participant_summary: string;
      clinical_insights: string;
    }>;

    confidence_score: number;                // 0-0.95
    confidence_description: "high" | "moderate" | "low" | "insufficient";
    sample_size_in_cohort: number;
  }>;

  cognitive_patterns: {
    distortions_detected: Array<{
      type: string;
      confidence: number;
      prevalence_across_session: "single" | "recurring" | "pervasive";
      suggested_intervention: string;
    }>;
    automatic_thoughts: Array<{
      content: string;
      belief_strength: number;
      supports_wellbeing: boolean;
    }>;
    behavioral_patterns: string[];
  };

  risk_assessment: {
    highest_risk_phrase?: string;
    risk_score: number;
    severity: "low" | "medium" | "high" | "critical";
    requires_escalation: boolean;
    recommended_action: string;
  };

  clinician_guidance: {
    key_insights: string[];
    suggested_focus_areas: string[];
    warning_flags: string[];
    next_session_recommendations: string[];
  };

  data_quality_indicators: {
    processing_confidence: number;
    transcript_clarity: number;
    sufficient_data_for_matching: boolean;
    validation_status: "auto_approved" | "pending_review" | "requires_review";
  };
}
```

---

## 8. Testing Strategy

### Unit Tests (Matching)

```typescript
// test/matching.test.ts
import { expect, describe, it } from "vitest";
import { combineAndScoreMatches } from "@/lib/matching";

describe("Matching Engine", () => {
  it("should weight semantic similarity at 50%", () => {
    const match = {
      semantic_sim: 0.8,
      structure_sim: 0.6,
      metadata_relevance: 0.5,
    };

    const score = combineAndScoreMatches([match]);
    expect(score[0].combined_score).toBeCloseTo(
      0.8 * 0.5 + 0.6 * 0.3 + 0.5 * 0.2,
      2
    );
  });

  it("should handle missing structure similarity", () => {
    const match = {
      semantic_sim: 0.8,
      structure_sim: undefined,
      metadata_relevance: 0.5,
    };

    expect(() => combineAndScoreMatches([match])).not.toThrow();
  });
});
```

### Integration Tests (Risk Detection)

```typescript
// test/risk-detection.integration.test.ts
describe("Risk Detection", () => {
  it("should detect 'hurt myself' but not 'don't want to hurt myself'", async () => {
    const riskQuote = "I want to hurt myself";
    const protectiveQuote = "I don't want to hurt myself";

    const risk1 = await assessRisk(riskQuote, {});
    const risk2 = await assessRisk(protectiveQuote, {});

    expect(risk1.final_risk_score).toBeGreaterThan(0.5);
    expect(risk2.final_risk_score).toBeLessThan(0.3); // Negation adjusts downward
  });

  it("should lower risk for past-tense statements", async () => {
    const pastTense = "I used to hurt myself, but I don't anymore";
    const currentTense = "I hurt myself every day";

    const risk1 = await assessRisk(pastTense, {});
    const risk2 = await assessRisk(currentTense, {});

    expect(risk1.final_risk_score).toBeLessThan(risk2.final_risk_score);
  });
});
```

---

## 9. Performance Benchmarks

### Query Latency Targets

```
Moment embedding:              ~100ms (OpenAI API)
Semantic search (10K vectors): <50ms (HNSW index)
Structural search:             <20ms (10-dim vectors)
CBT analysis:                  ~3-5s (Claude streaming)
Risk assessment:               ~500ms (local + context)
Full session processing:       ~30-60s per session
```

### Optimization Checklist

- [ ] HNSW index on embeddings (lists=100 for 10K vectors)
- [ ] Connection pooling (PgBouncer)
- [ ] Query result caching (Redis)
- [ ] Batch embedding jobs (don't embed during request)
- [ ] Streaming responses for long-running analyses
- [ ] Database statistics refreshed regularly

---

## 10. Monitoring & Observability

### Key Metrics

```typescript
import { metrics } from "@opentelemetry/api";

const embeddingLatency = metrics.createHistogram("embedding_latency_ms");
const matchConfidence = metrics.createHistogram("match_confidence_score");
const riskFalsePositives = metrics.createCounter("risk_false_positives");
const sessionProcessingTime = metrics.createHistogram("session_processing_ms");

// In code:
const start = Date.now();
const embedding = await embedText(text);
embeddingLatency.record(Date.now() - start);
```

### Error Tracking (Sentry)

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

try {
  await detectCognitiveDistortions(quote, context);
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      component: "cbt_analysis",
      quote_length: quote.length,
    },
  });
  throw error;
}
```

---

## 11. Deployment Checklist

Before production:

- [ ] All migrations ran successfully
- [ ] HNSW indexes created and verified
- [ ] 40 participants + 768 moments loaded
- [ ] All embeddings computed (took ~30 min with batching)
- [ ] Risk detection tested on 50 sample cases
- [ ] CBT analysis validated by clinical advisor
- [ ] Matching accuracy > 80% (verified on test set)
- [ ] Performance benchmarks met (<100ms semantic search)
- [ ] Security audit complete (PII handling, data retention)
- [ ] Error handling covers all edge cases
- [ ] Monitoring/alerting set up
- [ ] Backup/disaster recovery tested
- [ ] Load testing (1000 concurrent sessions)
- [ ] Staging environment matches production exactly

---

## 12. Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Vector search slow | Missing HNSW index | CREATE INDEX with ivfflat and lists=100 |
| Embeddings OOM | Batching all at once | Process in chunks of 100 |
| Risk false positives | No negation analysis | Implement negation word detection |
| CBT confidence too high | No uncertainty baked in | Cap max confidence at 0.95 |
| Matching returns same person | No diversity filtering | Add participant filtering |
| Session processing timeout | Long transcript | Process in moment segments, stream results |

