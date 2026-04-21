# SessionLens V3 — Database Upload Guide

> **Audience**: Your colleague guiding an LLM to upload data into the SessionLens Supabase database.
> **Last updated**: April 2026

---

## Quick Overview

| Table | Current Count | Purpose | Embeddings Required? |
|---|---|---|---|
| `lived_experiences` | 40 participants | Participant profiles (one per person) | YES (1536-dim vector) |
| `moments` | 768 moments | Individual therapy moments/quotes | YES (1536-dim vector) |
| `structure_codings` | 7,680 codings | 10 structure scores per moment | No |
| `practitioners` | 10 practitioners | Therapist expert profiles | No |
| `practitioner_methods` | 20 methods | Therapeutic methodologies | No |
| `practitioner_approaches` | 2 approaches | High-level therapy approaches | No |

---

## Connection Details

- **Supabase Project ID**: `uswtgkrqfwybcnygkspm`
- **Supabase URL**: `https://uswtgkrqfwybcnygkspm.supabase.co`
- **Use the `service_role` key** (not anon key) for all data uploads — RLS is enabled and only service_role has write access to research tables
- **Embedding model**: OpenAI `text-embedding-3-small` (1536 dimensions)

---

## CRITICAL: Upload Order (Foreign Keys)

Data MUST be uploaded in this exact order due to foreign key relationships:

```
1. lived_experiences  (participants — no dependencies)
2. moments            (depends on: lived_experiences.participant_id)
3. structure_codings   (depends on: moments.moment_id)
```

**If you insert moments before their participant exists in `lived_experiences`, the insert will fail.**

---

## Table 1: `lived_experiences` (Participants)

Each participant needs exactly ONE row. This is the profile that appears in "Similar Cases" on the web app.

### Schema

```sql
INSERT INTO lived_experiences (
  participant_id,          -- TEXT, unique, format: "P0001", "P0042", etc.
  nationality,             -- TEXT, e.g. "Canadian", "German", "Thai"
  age_range,               -- TEXT, e.g. "18-25", "26-35", "36-45", "46-55", "56+"
  gender,                  -- TEXT, e.g. "female", "male", "non-binary", "trans"
  summary,                 -- TEXT, 2-4 sentence clinical summary of their experience
  key_themes,              -- TEXT[], e.g. ARRAY['grief', 'isolation', 'identity']
  categories,              -- TEXT[], e.g. ARRAY['trauma', 'depression', 'anxiety']
  tags,                    -- TEXT[], free-form tags for search
  embedding_participant_level  -- vector(1536), OpenAI embedding of the summary
) VALUES (...);
```

### Example

```sql
INSERT INTO lived_experiences (
  participant_id, nationality, age_range, gender,
  summary, key_themes, categories, tags,
  embedding_participant_level
) VALUES (
  'P0701',
  'British',
  '36-45',
  'female',
  'Client presents with complex grief following the sudden loss of a parent, compounded by unresolved childhood attachment wounds. Significant somatic symptoms including chronic tension and sleep disruption. Shows emerging capacity for reflective awareness but defaults to intellectualization as defense.',
  ARRAY['grief', 'attachment', 'somatic symptoms', 'intellectualization'],
  ARRAY['grief', 'attachment disorders', 'somatic complaints'],
  ARRAY['loss', 'parent death', 'tension', 'sleep', 'defense mechanisms'],
  -- embedding goes here (1536-dim vector from OpenAI)
  '[0.0123, -0.0456, ...]'::vector
);
```

### How to generate the embedding

```python
import openai

client = openai.OpenAI(api_key="YOUR_KEY")

response = client.embeddings.create(
    model="text-embedding-3-small",
    input="Client presents with complex grief following the sudden loss of a parent..."
)
embedding = response.data[0].embedding  # List of 1536 floats
```

**What text to embed**: Use the `summary` field text.

---

## Table 2: `moments` (Individual Therapy Moments)

Each moment is a specific quote/observation from a therapy session. A participant typically has 10-30 moments.

### Schema

```sql
INSERT INTO moments (
  participant_id,              -- TEXT, must match lived_experiences.participant_id
  verbatim_quote,              -- TEXT, the exact quote from the session
  moment_anchor,               -- TEXT, 1-2 sentence context of when this moment occurred
  emotional_valence,           -- TEXT, one of: 'positive', 'negative', 'neutral', 'mixed'
  intensity,                   -- INTEGER, 1-10 scale (1=very mild, 10=extremely intense)
  structures_present,          -- TEXT[], which of the 10 structures are present
  embedding_moment_level       -- vector(1536), OpenAI embedding
) VALUES (...);
```

### The 10 Phenomenological Structures (valid values for `structures_present`)

```
body                    — somatic awareness, physical sensations
immediate_experience    — unreflected sensation, raw experience
emotion                 — affective states, feelings
behaviour               — observable actions, patterns
social                  — relational dynamics, interpersonal
cognitive               — thought patterns, beliefs
reflective              — metacognitive awareness, insight
narrative               — story coherence, identity construction
ecological              — environmental/cultural factors
normative               — values, moral frameworks
```

### Example

```sql
INSERT INTO moments (
  participant_id, verbatim_quote, moment_anchor,
  emotional_valence, intensity, structures_present,
  embedding_moment_level
) VALUES (
  'P0701',
  'When I got the phone call about my mother, my whole body went cold. I could not feel my legs. Even now, months later, when the phone rings at night I get that same freezing sensation.',
  'Client describing the moment of learning about her mother''s death and the ongoing somatic flashback response.',
  'negative',
  9,
  ARRAY['body', 'immediate_experience', 'emotion'],
  -- embedding goes here
  '[0.0234, -0.0567, ...]'::vector
);
```

### How to generate the embedding

```python
# Combine quote + context for richer embedding
text = f"{verbatim_quote} Context: {moment_anchor}"

response = client.embeddings.create(
    model="text-embedding-3-small",
    input=text
)
embedding = response.data[0].embedding
```

**What text to embed**: Combine `verbatim_quote` + " Context: " + `moment_anchor`

---

## Table 3: `structure_codings` (10 Per Moment)

Each moment gets exactly 10 rows — one per phenomenological structure — indicating whether that structure is present and how intensely.

### Schema

```sql
INSERT INTO structure_codings (
  moment_id,           -- INTEGER, FK to moments.moment_id (auto-generated on insert)
  structure_name,      -- TEXT, one of the 10 structure names
  present,             -- BOOLEAN, is this structure present in the moment?
  intensity,           -- NUMERIC, 0.0-1.0 scale (0 = not present, 1.0 = dominant)
  keywords             -- TEXT[], evidence keywords found in the quote
) VALUES (...);
```

### Example (all 10 rows for one moment)

```sql
-- Assuming the moment above got moment_id = 769
INSERT INTO structure_codings (moment_id, structure_name, present, intensity, keywords) VALUES
  (769, 'body',                  true,  0.9, ARRAY['cold', 'freezing', 'legs', 'sensation']),
  (769, 'immediate_experience',  true,  0.8, ARRAY['phone rings', 'freezing sensation']),
  (769, 'emotion',               true,  0.7, ARRAY['fear', 'grief']),
  (769, 'behaviour',             false, 0.1, ARRAY[]::text[]),
  (769, 'social',                false, 0.1, ARRAY[]::text[]),
  (769, 'cognitive',             false, 0.2, ARRAY[]::text[]),
  (769, 'reflective',            false, 0.1, ARRAY[]::text[]),
  (769, 'narrative',             false, 0.2, ARRAY[]::text[]),
  (769, 'ecological',            false, 0.0, ARRAY[]::text[]),
  (769, 'normative',             false, 0.0, ARRAY[]::text[]);
```

### Getting the moment_id after insert

```sql
-- Insert moment and return its ID
INSERT INTO moments (...) VALUES (...) RETURNING moment_id;
```

---

## Table 4: `practitioners` (Expert Profiles)

### Schema

```sql
INSERT INTO practitioners (
  name,                        -- VARCHAR, e.g. "Dr. Somatic Specialist"
  credentials,                 -- VARCHAR, e.g. "PhD, Licensed Clinical Psychologist"
  specializations,             -- TEXT[], e.g. ARRAY['trauma', 'somatic work']
  primary_structures,          -- UUID[], references structures.structure_id (see mapping below)
  biographical_background,     -- TEXT, 2-3 sentences about their background
  treatment_philosophy,        -- TEXT, 1-2 sentences on their approach
  key_interventions,           -- JSONB, array of intervention names
  evidence_base,               -- JSONB, array of research citations
  deidentified                 -- BOOLEAN, always true for this project
) VALUES (...);
```

### Structure UUID Mapping

```
Body Awareness:          2bf430b3-8394-4304-beaf-87c1f82f2272
Emotion Regulation:      425ce0c8-7a82-4083-ba45-930520d9be0a
Cognitive Flexibility:   17698464-ebf2-4405-8149-d2451ca71036
Attachment & Connection: 6b978d64-93d5-4406-9ce6-04f56c7a3047
Identity & Self-Concept: 8fbb4feb-c4d5-42ba-91c1-c9892e6a2628
Relational Patterns:     5c5ca765-efdb-48b7-8476-66a50a99e265
Trauma & Safety:         107449fe-e5a8-400a-a01e-ea3b64f0168e
Meaning & Purpose:       71ddfaf6-b720-439b-8584-b7ac0d21e709
Hope & Resilience:       1d1d0c23-2ca0-41e3-9367-b9fe8986651f
Autonomy & Control:      b53dce86-9a01-466e-9e17-693c25910691
```

### Example

```sql
INSERT INTO practitioners (
  name, credentials, specializations, primary_structures,
  biographical_background, treatment_philosophy,
  key_interventions, evidence_base, deidentified
) VALUES (
  'Dr. Somatic Trauma Specialist',
  'PsyD, Somatic Experiencing Practitioner',
  ARRAY['somatic trauma', 'body-based therapy', 'nervous system regulation'],
  ARRAY['2bf430b3-8394-4304-beaf-87c1f82f2272', '107449fe-e5a8-400a-a01e-ea3b64f0168e']::uuid[],
  'Trained in Somatic Experiencing and sensorimotor psychotherapy. 12 years working with complex trauma survivors.',
  'The body holds the memory of trauma. By gently working with somatic experience, we can complete interrupted defensive responses and restore regulation.',
  '["somatic experiencing", "pendulation", "titration", "resource development", "boundary repair"]'::jsonb,
  '["Levine 1997 - Waking the Tiger", "Ogden et al. 2006 - Trauma and the Body"]'::jsonb,
  true
);
```

---

## Table 5: `practitioner_methods` (Therapeutic Methods Catalog)

### Schema

```sql
INSERT INTO practitioner_methods (
  code,                    -- VARCHAR, format: "PR-[ABBREV]-[NUM]", e.g. "PR-CBT-021"
  name,                    -- VARCHAR, e.g. "Cognitive Behavioral Therapy"
  specialty,               -- VARCHAR, e.g. "Anxiety & Depression"
  methodology,             -- TEXT, 2-3 sentence description of the method
  intervention_sequence,   -- TEXT[], ordered steps of the intervention
  outcome_patterns,        -- JSONB, typical outcomes data
  target_structures        -- TEXT[], which structures this method targets
) VALUES (...);
```

### Example

```sql
INSERT INTO practitioner_methods (
  code, name, specialty, methodology,
  intervention_sequence, outcome_patterns, target_structures
) VALUES (
  'PR-EMDR-021',
  'EMDR for Complex Trauma',
  'Complex PTSD & Dissociation',
  'Modified EMDR protocol for clients with complex trauma histories, incorporating extended stabilization phase and fractionated processing.',
  ARRAY['history taking and stabilization', 'resource development', 'target identification', 'desensitization with bilateral stimulation', 'body scan and integration'],
  '{"typical_duration": "20-40 sessions", "response_rate": "Moderate for complex PTSD", "effect_size": "0.9", "best_for": "complex trauma with dissociation"}'::jsonb,
  ARRAY['emotion', 'body', 'immediate_experience', 'narrative']
);
```

---

## Bulk Upload Script Template (Python)

For your colleague to give to an LLM — this script handles the full pipeline:

```python
"""
SessionLens V3 — Bulk Data Upload Script
Uploads participant profiles, moments, and structure codings to Supabase.
Generates OpenAI embeddings automatically.

Requirements:
  pip install supabase openai

Environment variables:
  SUPABASE_URL=https://uswtgkrqfwybcnygkspm.supabase.co
  SUPABASE_SERVICE_KEY=your_service_role_key  (NOT anon key!)
  OPENAI_API_KEY=your_openai_api_key
"""

import os
import json
import time
from supabase import create_client
import openai

# ---- Config ----
supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_KEY"]  # Must be service_role key for write access
)
openai_client = openai.OpenAI(api_key=os.environ["OPENAI_API_KEY"])

EMBEDDING_MODEL = "text-embedding-3-small"  # 1536 dimensions
BATCH_SIZE = 50  # OpenAI supports up to 2048 inputs per batch


def generate_embedding(text: str) -> list[float]:
    """Generate a single embedding."""
    response = openai_client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=text
    )
    return response.data[0].embedding


def generate_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """Generate embeddings in batch (faster, cheaper)."""
    response = openai_client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=texts
    )
    return [item.embedding for item in response.data]


# ---- Step 1: Upload Participants ----
def upload_participant(participant: dict):
    """
    participant = {
        "participant_id": "P0701",
        "nationality": "British",
        "age_range": "36-45",
        "gender": "female",
        "summary": "Client presents with...",
        "key_themes": ["grief", "attachment"],
        "categories": ["grief", "attachment disorders"],
        "tags": ["loss", "parent death"]
    }
    """
    # Generate embedding from summary
    embedding = generate_embedding(participant["summary"])

    result = supabase.table("lived_experiences").insert({
        **participant,
        "embedding_participant_level": embedding
    }).execute()

    print(f"  Uploaded participant {participant['participant_id']}")
    return result


# ---- Step 2: Upload Moments ----
def upload_moments(participant_id: str, moments: list[dict]):
    """
    moments = [{
        "verbatim_quote": "When I got the phone call...",
        "moment_anchor": "Client describing the moment...",
        "emotional_valence": "negative",  # positive/negative/neutral/mixed
        "intensity": 9,                    # 1-10
        "structures_present": ["body", "immediate_experience", "emotion"]
    }, ...]
    """
    # Generate embeddings in batch
    texts = [
        f"{m['verbatim_quote']} Context: {m['moment_anchor']}"
        for m in moments
    ]

    # Process in batches of BATCH_SIZE
    all_embeddings = []
    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i:i + BATCH_SIZE]
        embeddings = generate_embeddings_batch(batch)
        all_embeddings.extend(embeddings)
        if i + BATCH_SIZE < len(texts):
            time.sleep(0.5)  # Rate limiting

    moment_ids = []
    for moment, embedding in zip(moments, all_embeddings):
        result = supabase.table("moments").insert({
            "participant_id": participant_id,
            "verbatim_quote": moment["verbatim_quote"],
            "moment_anchor": moment["moment_anchor"],
            "emotional_valence": moment["emotional_valence"],
            "intensity": moment["intensity"],
            "structures_present": moment["structures_present"],
            "embedding_moment_level": embedding
        }).execute()

        moment_id = result.data[0]["moment_id"]
        moment_ids.append(moment_id)
        print(f"  Uploaded moment {moment_id} for {participant_id}")

    return moment_ids


# ---- Step 3: Upload Structure Codings ----
STRUCTURE_NAMES = [
    "body", "immediate_experience", "emotion", "behaviour", "social",
    "cognitive", "reflective", "narrative", "ecological", "normative"
]

def upload_structure_codings(moment_id: int, structures_present: list[str], quote: str):
    """
    Auto-generates 10 structure coding rows for a moment.
    structures_present: which structures are active in this moment.
    """
    rows = []
    for structure in STRUCTURE_NAMES:
        is_present = structure in structures_present
        rows.append({
            "moment_id": moment_id,
            "structure_name": structure,
            "present": is_present,
            "intensity": 0.7 if is_present else 0.1,  # Customize as needed
            "keywords": []  # Optionally extract from quote
        })

    supabase.table("structure_codings").insert(rows).execute()
    print(f"  Uploaded 10 structure codings for moment {moment_id}")


# ---- Full Pipeline ----
def upload_full_participant_data(participant: dict, moments: list[dict]):
    """Upload a complete participant with all their moments and codings."""
    print(f"\n{'='*50}")
    print(f"Uploading participant {participant['participant_id']}")
    print(f"{'='*50}")

    # Step 1: Upload participant profile
    upload_participant(participant)

    # Step 2: Upload all moments
    moment_ids = upload_moments(participant["participant_id"], moments)

    # Step 3: Upload structure codings for each moment
    for moment_id, moment in zip(moment_ids, moments):
        upload_structure_codings(
            moment_id,
            moment["structures_present"],
            moment["verbatim_quote"]
        )

    print(f"\nDone! Uploaded {len(moments)} moments with {len(moments) * 10} structure codings.")


# ---- Example Usage ----
if __name__ == "__main__":
    participant = {
        "participant_id": "P0701",
        "nationality": "British",
        "age_range": "36-45",
        "gender": "female",
        "summary": "Client presents with complex grief following sudden parental loss, compounded by childhood attachment wounds. Shows somatic symptoms and emerging reflective capacity.",
        "key_themes": ["grief", "attachment", "somatic symptoms"],
        "categories": ["grief", "attachment disorders", "somatic complaints"],
        "tags": ["loss", "parent death", "tension", "sleep"]
    }

    moments = [
        {
            "verbatim_quote": "When I got the phone call about my mother, my whole body went cold. I could not feel my legs.",
            "moment_anchor": "Client describing the moment of learning about her mother's death.",
            "emotional_valence": "negative",
            "intensity": 9,
            "structures_present": ["body", "immediate_experience", "emotion"]
        },
        {
            "verbatim_quote": "I keep thinking I should have called her more. If I had just picked up the phone that Sunday, maybe she would have told me something was wrong.",
            "moment_anchor": "Client expressing guilt and counterfactual thinking about missed opportunities.",
            "emotional_valence": "negative",
            "intensity": 7,
            "structures_present": ["cognitive", "emotion", "normative"]
        },
        {
            "verbatim_quote": "My partner says I have become a different person since it happened. I do not disagree. But I do not know who I was before either.",
            "moment_anchor": "Client reflecting on identity disruption and relational impact of grief.",
            "emotional_valence": "mixed",
            "intensity": 6,
            "structures_present": ["narrative", "social", "reflective"]
        }
    ]

    upload_full_participant_data(participant, moments)
```

---

## Data Quality Checklist

Before uploading, verify:

- [ ] **participant_id is unique** — no duplicates in `lived_experiences`
- [ ] **participant_id exists** in `lived_experiences` before inserting moments
- [ ] **emotional_valence** is one of: `positive`, `negative`, `neutral`, `mixed`
- [ ] **intensity** is an integer between 1 and 10
- [ ] **structures_present** only contains valid structure names (see list above)
- [ ] **Each moment gets exactly 10 structure_codings** (one per structure)
- [ ] **Embeddings are 1536 dimensions** (text-embedding-3-small)
- [ ] **Summary text is 2-4 sentences** (not too short for meaningful embedding)
- [ ] **Quotes are actual verbatim text** (not paraphrased)
- [ ] **All data is de-identified** — no real patient names, locations, or identifiable details
- [ ] **Age range format** is consistent: "18-25", "26-35", "36-45", "46-55", "56+"
- [ ] **Gender values** are consistent: "female", "male", "non-binary", "trans"

---

## Verifying Uploads

After uploading, run these SQL queries to verify integrity:

```sql
-- Check for orphan moments (moments without a participant)
SELECT COUNT(*) FROM moments m
LEFT JOIN lived_experiences le ON m.participant_id = le.participant_id
WHERE le.participant_id IS NULL;
-- Should be 0

-- Check for moments missing embeddings
SELECT COUNT(*) FROM moments WHERE embedding_moment_level IS NULL;
-- Should be 0

-- Check for incomplete structure codings
SELECT m.moment_id, COUNT(sc.id) as coding_count
FROM moments m
LEFT JOIN structure_codings sc ON m.moment_id = sc.moment_id
GROUP BY m.moment_id
HAVING COUNT(sc.id) != 10;
-- Should return no rows

-- Check totals
SELECT 'lived_experiences' as tbl, COUNT(*) FROM lived_experiences
UNION ALL SELECT 'moments', COUNT(*) FROM moments
UNION ALL SELECT 'structure_codings', COUNT(*) FROM structure_codings;
```

---

## Storage Buckets (for Audio/Transcript Files)

Two storage buckets are configured:

| Bucket | Purpose | Max Size | Allowed Types |
|---|---|---|---|
| `session-files` | Audio recordings & transcripts | 50MB | audio/webm, audio/mp4, audio/ogg, audio/mpeg, audio/wav, text/plain, application/pdf |
| `exports` | Generated PDF reports | 10MB | application/pdf, text/plain, text/csv |

### Uploading files via Supabase client

```python
# Upload audio file
with open("session_recording.webm", "rb") as f:
    supabase.storage.from_("session-files").upload(
        path=f"sessions/{session_id}/audio.webm",
        file=f,
        file_options={"content-type": "audio/webm"}
    )

# Upload transcript
with open("transcript.txt", "rb") as f:
    supabase.storage.from_("session-files").upload(
        path=f"sessions/{session_id}/transcript.txt",
        file=f,
        file_options={"content-type": "text/plain"}
    )
```

---

## Security Notes

- **RLS is enabled** on all tables — only `service_role` key can write to research tables
- **Never use the `service_role` key in client-side code** — it bypasses all security
- The `anon` key has read-only access to research data (moments, lived_experiences, etc.)
- Session data (therapist/client specific) is locked down to the owning therapist

---

## Common Issues

| Problem | Solution |
|---|---|
| "violates foreign key constraint" | Upload `lived_experiences` before `moments` |
| "duplicate key value" | participant_id already exists — use a new one |
| Embedding dimension mismatch | Make sure you're using `text-embedding-3-small` (1536 dims), NOT `text-embedding-3-large` (3072 dims) |
| "permission denied for table" | You're using the `anon` key — switch to `service_role` key |
| Matching engine returns no results | Check that embeddings were generated — NULL embeddings are skipped |
