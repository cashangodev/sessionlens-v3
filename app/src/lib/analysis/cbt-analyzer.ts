import { getOpenAIClient, hasOpenAI } from './openai-client';

// ============ TYPES ============

export interface CognitiveDistortion {
  type: string;
  confidence: number;
  evidence: string;
  alternativeThought: string;
  momentIndex: number;
}

export interface CBTAnalysisResult {
  distortions: CognitiveDistortion[];
  overallDistortionLoad: number;
  treatmentReadiness: number;
  dominantPatterns: string[];
  automaticThoughts: {
    content: string;
    beliefStrength: number;
    supportsWellbeing: boolean;
  }[];
  behavioralPatterns: string[];
}

// ============ CONSTANTS ============

const MAX_CONFIDENCE = 0.95;

const DISTORTION_TYPES = [
  'Catastrophizing',
  'All-or-nothing thinking',
  'Overgeneralization',
  'Mental filtering',
  'Disqualifying the positive',
  'Mind reading',
  'Fortune telling',
  'Magnification/Minimization',
  'Emotional reasoning',
  'Should statements',
  'Labeling',
  'Personalization',
  'Blaming',
  'Always being right',
  'Fallacy of change',
] as const;

// ============ KEYWORD RULES FOR FALLBACK ============

interface KeywordRule {
  patterns: RegExp[];
  distortionType: string;
  defaultConfidence: number;
}

const KEYWORD_RULES: KeywordRule[] = [
  {
    patterns: [/\balways\b/i, /\bnever\b/i, /\beveryone\b/i, /\bnobody\b/i],
    distortionType: 'Overgeneralization',
    defaultConfidence: 0.6,
  },
  {
    patterns: [/\bshould\b/i, /\bmust\b/i, /\bhave to\b/i],
    distortionType: 'Should statements',
    defaultConfidence: 0.6,
  },
  {
    patterns: [/\bworst\b/i, /\bterrible\b/i, /\bdisaster\b/i, /\bcatastrophe\b/i],
    distortionType: 'Catastrophizing',
    defaultConfidence: 0.65,
  },
  {
    patterns: [/\bmy fault\b/i, /\bbecause of me\b/i, /\bI caused\b/i],
    distortionType: 'Personalization',
    defaultConfidence: 0.6,
  },
  {
    patterns: [/\bthey think\b/i, /\bthey must feel\b/i, /\beveryone sees\b/i],
    distortionType: 'Mind reading',
    defaultConfidence: 0.55,
  },
  {
    patterns: [/\bI'm a\b/i, /\bI'm just\b/i, /\bI'm nothing\b/i],
    distortionType: 'Labeling',
    defaultConfidence: 0.6,
  },
];

// ============ DIAGNOSIS-OF-THOUGHT PROMPT ============

function buildDoTPrompt(
  moments: { quote: string; context: string }[],
  participantContext?: { themes?: string[]; beliefs?: string[] }
): string {
  const momentBlock = moments
    .map((m, i) => `[Moment ${i}]\nQuote: "${m.quote}"\nContext: ${m.context}`)
    .join('\n\n');

  const contextBlock = participantContext
    ? `\nParticipant context:\n- Themes: ${(participantContext.themes ?? []).join(', ') || 'none provided'}\n- Core beliefs: ${(participantContext.beliefs ?? []).join(', ') || 'none provided'}`
    : '';

  return `You are a CBT-trained clinical analyst. Analyze the following therapy session moments for cognitive distortions using the Diagnosis-of-Thought (DoT) prompting framework.

${momentBlock}
${contextBlock}

Apply the 3-stage Diagnosis-of-Thought framework:

**Stage 1 — Fact vs. Interpretation Separation**
For each moment, separate the objective facts stated from the subjective interpretations the speaker is making. Identify where the speaker conflates interpretation with reality.

**Stage 2 — Cognitive Distortion Scoring**
Score each of the following 15 cognitive distortion types on a 0-1 confidence scale for each moment where they appear. Only include distortions with confidence > 0.2:
${DISTORTION_TYPES.map((d, i) => `${i + 1}. ${d}`).join('\n')}

**Stage 3 — Schema Linking**
Link detected distortions to underlying core beliefs/schemas (e.g., defectiveness, abandonment, incompetence, unlovability).

Return your analysis as a JSON object with this exact structure (no markdown, no code fences, pure JSON only):
{
  "distortions": [
    {
      "type": "<distortion type name>",
      "confidence": <0-0.95>,
      "evidence": "<exact quote excerpt that triggered detection>",
      "alternativeThought": "<CBT reframing suggestion>",
      "momentIndex": <index of the moment>
    }
  ],
  "overallDistortionLoad": <0-1 average severity across all moments>,
  "treatmentReadiness": <0-1 estimate of client openness to cognitive restructuring>,
  "dominantPatterns": ["<top 2-3 recurring distortion types>"],
  "automaticThoughts": [
    {
      "content": "<identified automatic thought>",
      "beliefStrength": <0-1>,
      "supportsWellbeing": <true/false>
    }
  ],
  "behavioralPatterns": ["<observable behavioral patterns linked to distortions>"]
}

Rules:
- Maximum confidence for any single distortion is 0.95
- Only include distortions you have genuine evidence for
- alternativeThought should be a realistic, compassionate reframing
- dominantPatterns should contain the 2-3 most frequently occurring distortion types
- Be precise with momentIndex — it must match the moment numbering above`;
}

// ============ FALLBACK DETECTION ============

function detectDistortionsFallback(
  moments: { quote: string; context: string }[]
): CBTAnalysisResult {
  const distortions: CognitiveDistortion[] = [];
  const distortionTypeCounts: Record<string, number> = {};

  for (let i = 0; i < moments.length; i++) {
    const text = `${moments[i].quote} ${moments[i].context}`;

    for (const rule of KEYWORD_RULES) {
      for (const pattern of rule.patterns) {
        const match = text.match(pattern);
        if (match) {
          const confidence = Math.min(rule.defaultConfidence, MAX_CONFIDENCE);
          const start = Math.max(0, (match.index ?? 0) - 20);
          const end = Math.min(text.length, (match.index ?? 0) + match[0].length + 20);
          const evidence = text.slice(start, end).trim();

          distortions.push({
            type: rule.distortionType,
            confidence,
            evidence,
            alternativeThought: generateFallbackReframe(rule.distortionType),
            momentIndex: i,
          });

          distortionTypeCounts[rule.distortionType] =
            (distortionTypeCounts[rule.distortionType] ?? 0) + 1;

          // Only match first pattern per rule per moment
          break;
        }
      }
    }
  }

  const sortedTypes = Object.entries(distortionTypeCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([type]) => type);

  const avgConfidence =
    distortions.length > 0
      ? distortions.reduce((sum, d) => sum + d.confidence, 0) / distortions.length
      : 0;

  return {
    distortions,
    overallDistortionLoad: Math.min(avgConfidence, MAX_CONFIDENCE),
    treatmentReadiness: 0.5,
    dominantPatterns: sortedTypes.slice(0, 3),
    automaticThoughts: distortions.slice(0, 5).map((d) => ({
      content: d.evidence,
      beliefStrength: d.confidence,
      supportsWellbeing: false,
    })),
    behavioralPatterns: inferBehavioralPatterns(distortions),
  };
}

function generateFallbackReframe(distortionType: string): string {
  const reframes: Record<string, string> = {
    Overgeneralization:
      'Consider specific instances rather than using absolute terms. What are the exceptions?',
    'Should statements':
      'Try replacing "should" with "I would prefer" or "It would be helpful if" to reduce self-pressure.',
    Catastrophizing:
      'What is the most likely outcome, rather than the worst-case scenario? How have similar situations turned out before?',
    Personalization:
      'Consider all the factors that contributed to this situation. What was outside your control?',
    'Mind reading':
      "Without direct evidence, we can't know what others are thinking. What other explanations are possible?",
    Labeling:
      'A single behavior or situation does not define who you are. What evidence contradicts this label?',
  };

  return reframes[distortionType] ?? 'Consider what evidence supports and contradicts this thought.';
}

function inferBehavioralPatterns(distortions: CognitiveDistortion[]): string[] {
  const patterns: string[] = [];
  const types = new Set(distortions.map((d) => d.type));

  if (types.has('Catastrophizing') || types.has('Fortune telling')) {
    patterns.push('Avoidance of uncertain or challenging situations');
  }
  if (types.has('Personalization') || types.has('Blaming')) {
    patterns.push('Difficulty with shared responsibility in relationships');
  }
  if (types.has('Should statements')) {
    patterns.push('Rigid behavioral expectations leading to frustration');
  }
  if (types.has('Labeling') || types.has('All-or-nothing thinking')) {
    patterns.push('Self-critical internal dialogue affecting motivation');
  }

  return patterns.length > 0 ? patterns : ['No clear behavioral patterns detected from keywords'];
}

// ============ OPENAI ANALYSIS ============

function clampConfidence(value: number): number {
  return Math.min(Math.max(value, 0), MAX_CONFIDENCE);
}

function validateAndClamp(raw: CBTAnalysisResult): CBTAnalysisResult {
  return {
    ...raw,
    overallDistortionLoad: clampConfidence(raw.overallDistortionLoad ?? 0),
    treatmentReadiness: clampConfidence(raw.treatmentReadiness ?? 0),
    dominantPatterns: raw.dominantPatterns ?? [],
    automaticThoughts: (raw.automaticThoughts ?? []).map((t) => ({
      ...t,
      beliefStrength: clampConfidence(t.beliefStrength ?? 0),
    })),
    behavioralPatterns: raw.behavioralPatterns ?? [],
    distortions: (raw.distortions ?? []).map((d) => ({
      ...d,
      confidence: clampConfidence(d.confidence ?? 0),
      momentIndex: d.momentIndex ?? 0,
    })),
  };
}

// ============ MAIN EXPORT ============

export async function analyzeCognitiveDistortions(
  moments: { quote: string; context: string }[],
  participantContext?: { themes?: string[]; beliefs?: string[] }
): Promise<CBTAnalysisResult> {
  if (moments.length === 0) {
    return {
      distortions: [],
      overallDistortionLoad: 0,
      treatmentReadiness: 0,
      dominantPatterns: [],
      automaticThoughts: [],
      behavioralPatterns: [],
    };
  }

  if (!hasOpenAI()) {
    return detectDistortionsFallback(moments);
  }

  const client = getOpenAIClient();
  if (!client) {
    return detectDistortionsFallback(moments);
  }

  try {
    const prompt = buildDoTPrompt(moments, participantContext);

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a clinical CBT analyst. Respond with valid JSON only, no markdown formatting.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn('CBT analyzer: empty response from OpenAI, falling back to rule-based detection');
      return detectDistortionsFallback(moments);
    }

    const parsed = JSON.parse(content) as CBTAnalysisResult;
    return validateAndClamp(parsed);
  } catch (error) {
    console.error('CBT analyzer: OpenAI call failed, falling back to rule-based detection', error);
    return detectDistortionsFallback(moments);
  }
}
