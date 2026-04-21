---
name: analysis-engine
description: >
  Builds the local analysis pipeline that processes transcripts into structured
  clinical insights. Uses keyword/pattern matching — no external APIs.
---

# Analysis Engine Agent

You build the brain of SessionLens — the analysis engine that transforms raw therapy transcripts into structured clinical insights.

## YOUR JOB
Build a local analysis pipeline that:
1. Takes a raw transcript string as input
2. Segments it into meaningful moments
3. Codes each moment against the 10 phenomenological structures
4. Identifies risk signals
5. Scores emotional intensity and valence
6. Codes therapist interventions
7. Generates structure profile
8. Matches against similar cases (from mock database)
9. Matches practitioner methodologies
10. Returns a complete `AnalysisResult` object

**No external APIs.** This runs entirely in the browser using pattern matching, keyword analysis, and scoring algorithms.

## BEFORE YOU START
1. Read `app/src/types/index.ts` — understand the output types
2. Read `app/src/lib/mock-data/` — understand what data exists
3. Read `reference/v2-app.jsx` — see how V2 handled analysis (it faked it)
4. Run `cd app && npm run dev` — verify project runs

## FILES TO CREATE

### src/lib/analysis/transcript-analyzer.ts
The main analysis orchestrator.

```typescript
import { AnalysisResult, SessionInput } from '@/types';

export async function analyzeSession(input: SessionInput): Promise<AnalysisResult> {
  // 1. Segment transcript into moments
  const segments = segmentTranscript(input.transcript);

  // 2. Code each segment
  const moments = segments.map((seg, i) => codeMoment(seg, i));

  // 3. Identify risk signals
  const riskFlags = identifyRisks(moments, input.transcript);

  // 4. Build structure profile
  const structureProfile = buildStructureProfile(moments);

  // 5. Code therapist moves
  const therapistMoves = analyzeTherapistMoves(moments);

  // 6. Generate quick insight
  const quickInsight = generateQuickInsight(riskFlags, structureProfile, moments, input.sessionNumber);

  // 7. Match similar cases
  const similarCases = matchSimilarCases(structureProfile, riskFlags);

  // 8. Match practitioners
  const practitionerMatches = matchPractitioners(structureProfile, riskFlags);

  // 9. Get session history (mock longitudinal data)
  const sessionHistory = generateSessionHistory(input.sessionNumber);

  return {
    quickInsight,
    moments,
    riskFlags,
    practitionerMatches,
    similarCases,
    structureProfile,
    sessionHistory,
    therapistMoves,
  };
}
```

### src/lib/analysis/segmenter.ts
Splits transcript into meaningful clinical moments.

**Algorithm:**
1. Split transcript by paragraph breaks and speaker turns
2. Identify "Patient:" and "Therapist:" prefixes (or similar patterns)
3. Look for emotional intensity markers (exclamation, loaded words, pauses marked as "...")
4. Group adjacent sentences into moments (3-8 sentences each)
5. Select top 5-7 most clinically significant moments based on:
   - Presence of somatic language ("chest", "weight", "breathing", "stomach")
   - Emotional language ("afraid", "angry", "hopeless", "relieved")
   - Risk language ("hurt myself", "drinking more", "can't go on")
   - Relational language ("my mother", "partner", "nobody understands")
   - Insight language ("I realize", "I notice", "I've been thinking")

**Output:** Array of transcript segments with speaker, text, and approximate timestamp.

### src/lib/analysis/structure-coder.ts
Codes each moment against the 10 phenomenological structures.

**Keyword dictionaries for each structure:**

```typescript
const STRUCTURE_KEYWORDS: Record<StructureName, string[]> = {
  body: ['chest', 'weight', 'breathing', 'stomach', 'tension', 'headache', 'pain', 'tired', 'exhausted', 'numb', 'shaking', 'heart racing', 'shoulders', 'jaw', 'throat', 'heavy', 'light', 'restless', 'frozen', 'sick'],

  immediate_experience: ['right now', 'in this moment', 'as I say this', 'I notice', 'happening', 'feeling right now', 'present', 'aware', 'just noticed', 'sensation'],

  emotion: ['afraid', 'angry', 'sad', 'happy', 'anxious', 'hopeless', 'relieved', 'guilty', 'ashamed', 'frustrated', 'overwhelmed', 'numb', 'lonely', 'grateful', 'resentful', 'panicked', 'depressed', 'joyful', 'disgusted', 'terrified'],

  behaviour: ['drinking', 'sleeping', 'eating', 'avoiding', 'isolating', 'exercising', 'working', 'arguing', 'crying', 'yelling', 'withdrawing', 'cutting', 'smoking', 'using', 'running', 'hiding', 'shopping', 'scrolling', 'bingeing'],

  social: ['mother', 'father', 'partner', 'friend', 'boss', 'colleague', 'family', 'children', 'relationship', 'marriage', 'divorce', 'argument', 'support', 'lonely', 'betrayed', 'trust', 'connection', 'abandoned', 'rejected'],

  cognitive: ['think', 'believe', 'thought', 'pattern', 'always', 'never', 'should', 'must', 'can\'t', 'catastrophizing', 'ruminating', 'overthinking', 'worry', 'decision', 'plan', 'memory', 'forget', 'confused', 'rational'],

  reflective: ['realize', 'notice', 'aware', 'understand', 'insight', 'perspective', 'looking back', 'I see now', 'it occurs to me', 'metacognition', 'observe myself', 'pattern', 'step back', 'bigger picture', 'makes sense'],

  narrative: ['story', 'always been', 'identity', 'the kind of person', 'my life', 'chapter', 'turning point', 'before and after', 'used to be', 'becoming', 'who I am', 'journey', 'history', 'past', 'future', 'meaning'],

  ecological: ['neighborhood', 'city', 'culture', 'community', 'church', 'school', 'workplace', 'environment', 'society', 'political', 'economic', 'housing', 'nature', 'weather', 'season', 'tradition', 'heritage', 'immigrant'],

  normative: ['should', 'right', 'wrong', 'fair', 'unfair', 'duty', 'responsibility', 'moral', 'ethical', 'values', 'belief', 'faith', 'justice', 'deserve', 'obligation', 'principle', 'standard', 'expectation']
};
```

**Scoring algorithm:**
- Count keyword matches per structure per moment
- Normalize to 0.0-1.0 scale
- Assign top 2-4 structures to each moment
- Weight: exact matches > partial matches > context matches

### src/lib/analysis/risk-detector.ts
Identifies clinical risk signals.

**Risk patterns to detect:**

HIGH severity:
- Suicidal ideation: "kill myself", "end it", "not worth living", "better off dead", "no reason to go on"
- Self-harm: "cutting", "hurt myself", "burning", "hitting myself"
- Substance escalation: "drinking more", "using again", "relapsed", "need it to cope"
- Dissociation: "not real", "watching myself", "can't feel anything", "disappeared"

MEDIUM severity:
- High emotional intensity without reflective structures present
- Social isolation: "nobody", "alone", "no one understands", "pushing people away"
- Sleep disruption: "can't sleep", "sleeping all day", "nightmares every night"
- Hopelessness: "nothing will change", "always been this way", "no point"

LOW severity:
- Avoidance patterns: "don't want to talk about", "changed the subject"
- Mild cognitive distortions: "always", "never", "everyone"

**Output:** Array of RiskFlag objects with severity, signal, detail, recommendation.

### src/lib/analysis/therapist-coder.ts
Codes therapist interventions.

**Detection patterns:**
- **Empathic Attunement**: "Tell me more", "That sounds", "I hear you", "How did that feel", reflective statements
- **Challenge**: "Have you considered", "What if", "I wonder if", "Is it possible", "Let's examine"
- **Interpretation**: "It seems like", "What I'm noticing is", "There might be a connection", "Could it be that"
- **Silence**: [noted pauses], "[silence]", "[pause]", long gaps between therapist turns
- **Reflection**: "So what you're saying is", "Let me reflect back", "If I understand correctly"

### src/lib/analysis/case-matcher.ts
Matches against the mock similar case database.

**Algorithm:**
1. Build a structure profile vector (10 dimensions) from the current session
2. Compare against 20-30 pre-built case profiles (in mock data)
3. Score similarity using cosine similarity or simple distance
4. Return top 3 matches above 60% threshold
5. Each match includes the pre-written case narrative

### src/lib/analysis/practitioner-matcher.ts
Matches practitioner methodologies.

**Algorithm:**
1. Look at dominant structures (top 3-4 by prevalence)
2. Look at risk flag types
3. Match against practitioner profiles that target those structures
4. Return top 3 matches with reasoning

**Pre-built matches (in mock data):**
- Trauma-Focused CBT → targets: cognitive, emotion, body, behaviour
- Somatic Experiencing → targets: body, immediate_experience, emotion
- Emotionally Focused Therapy → targets: emotion, social, reflective
- Narrative Therapy → targets: narrative, reflective, cognitive
- DBT Skills → targets: emotion, behaviour, cognitive, reflective
- Acceptance & Commitment → targets: cognitive, normative, reflective
- EMDR → targets: body, emotion, immediate_experience, narrative

### src/lib/analysis/report-generator.ts
Generates report text.

**Clinician Report:**
- Professional, clinical language
- Structured: Presenting Concerns → Key Findings → Risk Assessment → Structure Profile → Recommendations → Documentation Notes

**Patient Report:**
- Warm, accessible, non-clinical language
- Structured: What We Explored → What Stood Out → Your Strengths → Suggestions → Encouragement

## CRITICAL: Make It Feel Real
The analysis doesn't need to be clinically accurate — it needs to feel PLAUSIBLE and INTELLIGENT.

When the demo transcript is analyzed:
- The moments extracted should feel like real clinical insights
- The risk flags should be relevant to what's in the transcript
- The structure coding should make sense
- The practitioner matches should be logically connected

For non-demo transcripts (user-pasted text):
- The keyword-based analysis should still produce reasonable results
- Even if the text isn't a therapy transcript, it should degrade gracefully
- If the text is too short, return a "insufficient data" result

## VERIFY YOUR WORK
```bash
# Write a simple test
cd app
npx tsx -e "
  import { analyzeSession } from './src/lib/analysis/transcript-analyzer';
  import { DEMO_TRANSCRIPT } from './src/lib/mock-data/demo-transcript';

  const result = await analyzeSession({
    transcript: DEMO_TRANSCRIPT,
    treatmentGoals: 'Reduce anxiety, improve emotional regulation',
    sessionNumber: 3,
  });

  console.log('Moments:', result.moments.length);
  console.log('Risk flags:', result.riskFlags.length);
  console.log('Similar cases:', result.similarCases.length);
  console.log('Practitioner matches:', result.practitionerMatches.length);
  console.log('Structure profile keys:', Object.keys(result.structureProfile).length);
  console.log('PASS');
"
```

Also: `npm run build` must pass.

## LOG YOUR WORK
Append to `../logs/PROGRESS.md`:
```markdown
## Analysis Engine — [timestamp]
### Built
- (list every module)
### Analysis Quality
- Demo transcript: produces X moments, Y risk flags, Z matches
- Empty transcript: handles gracefully? Y/N
- Short text: handles gracefully? Y/N
### Issues
- (anything that doesn't work)
```
