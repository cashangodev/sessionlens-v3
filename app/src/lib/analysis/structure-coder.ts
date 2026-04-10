import { StructureName, EmotionalValence } from '@/types';
import { getOpenAIClient, hasOpenAI } from './openai-client';

interface StructureCoding {
  structures: {
    name: StructureName;
    intensity: number;
    valence: EmotionalValence;
  }[];
}

const STRUCTURE_KEYWORDS: Record<StructureName, string[]> = {
  [StructureName.BODY]: [
    'chest', 'weight', 'breathing', 'stomach', 'tension', 'headache', 'pain', 'tired', 'exhausted', 'numb', 'shaking', 'heart racing',
    'shoulders', 'jaw', 'throat', 'heavy', 'frozen', 'restless', 'sick', 'dizzy', 'ache', 'tight', 'tense', 'hurts', 'aches',
    'breath', 'body', 'physical', 'somatic', 'sensation', 'feel in my body', 'physical sensation'
  ],
  [StructureName.IMMEDIATE_EXPERIENCE]: [
    'right now', 'in this moment', 'as i say this', 'i notice', 'happening', 'feeling right now', 'present', 'aware', 'just noticed',
    'sensation', 'here', 'now', 'immediately', 'this instant', 'experiencing', 'here and now', 'present moment', 'as we speak'
  ],
  [StructureName.EMOTION]: [
    'afraid', 'angry', 'sad', 'happy', 'anxious', 'hopeless', 'relieved', 'guilty', 'ashamed', 'frustrated', 'overwhelmed', 'lonely',
    'grateful', 'resentful', 'panicked', 'depressed', 'terrified', 'disgusted', 'jealous', 'hurt', 'confused', 'concerned', 'worried',
    'stressed', 'numb', 'empty', 'full', 'joyful', 'rage', 'despair', 'content', 'restless'
  ],
  [StructureName.BEHAVIOUR]: [
    'drinking', 'sleeping', 'eating', 'avoiding', 'isolating', 'exercising', 'working', 'arguing', 'crying', 'yelling', 'withdrawing',
    'cutting', 'smoking', 'running', 'hiding', 'scrolling', 'bingeing', 'purging', 'acting', 'doing', 'stopped', 'started', 'quit',
    'began', 'habit', 'action', 'behaving', 'response'
  ],
  [StructureName.SOCIAL]: [
    'mother', 'father', 'partner', 'friend', 'boss', 'family', 'children', 'relationship', 'marriage', 'divorce', 'argument', 'lonely',
    'betrayed', 'trust', 'connection', 'abandoned', 'rejected', 'colleague', 'sibling', 'spouse', 'parent', 'people', 'others',
    'social', 'loved one', 'relative', 'friend'
  ],
  [StructureName.COGNITIVE]: [
    'think', 'believe', 'thought', 'always', 'never', 'should', 'must', 'can\'t', 'worry', 'decision', 'memory', 'confused', 'rational',
    'overthinking', 'ruminating', 'catastrophizing', 'idea', 'reason', 'meaning', 'understand', 'logic', 'sense', 'believe', 'thought pattern'
  ],
  [StructureName.REFLECTIVE]: [
    'realize', 'notice', 'aware', 'understand', 'insight', 'perspective', 'looking back', 'i see now', 'occurs to me', 'observe myself',
    'pattern', 'step back', 'bigger picture', 'makes sense', 'reflection', 'meta', 'observe', 'recognize', 'discovery'
  ],
  [StructureName.NARRATIVE]: [
    'story', 'always been', 'identity', 'the kind of person', 'my life', 'chapter', 'turning point', 'used to be', 'becoming', 'who i am',
    'journey', 'history', 'meaning', 'narrative', 'arc', 'character', 'lived', 'experience', 'my whole life'
  ],
  [StructureName.ECOLOGICAL]: [
    'neighborhood', 'culture', 'community', 'church', 'school', 'workplace', 'environment', 'society', 'political', 'economic', 'housing',
    'nature', 'tradition', 'heritage', 'community', 'cultural', 'societal', 'systemic', 'system', 'world'
  ],
  [StructureName.NORMATIVE]: [
    'should', 'right', 'wrong', 'fair', 'unfair', 'duty', 'responsibility', 'moral', 'values', 'belief', 'faith', 'justice', 'deserve',
    'obligation', 'principle', 'expectation', 'ethics', 'standard', 'norm', 'right and wrong'
  ]
};

const EMOTIONAL_VALENCE_KEYWORDS = {
  positive: ['happy', 'grateful', 'relieved', 'hopeful', 'proud', 'loved', 'safe', 'content', 'peaceful', 'joyful', 'good', 'better', 'progress'],
  negative: ['sad', 'angry', 'afraid', 'ashamed', 'hopeless', 'depressed', 'lonely', 'devastated', 'hurt', 'betrayed', 'anxious', 'terrified'],
  neutral: ['neutral', 'okay', 'fine', 'normal', 'usual', 'regular', 'typical']
};

function countKeywordMatches(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  let count = 0;
  for (const keyword of keywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = lower.match(regex);
    count += (matches?.length || 0);
  }
  return count;
}

function detectValence(text: string): EmotionalValence {
  const positiveCount = countKeywordMatches(text, EMOTIONAL_VALENCE_KEYWORDS.positive);
  const negativeCount = countKeywordMatches(text, EMOTIONAL_VALENCE_KEYWORDS.negative);

  if (positiveCount > 0 && negativeCount > 0) return EmotionalValence.MIXED;
  if (positiveCount > negativeCount) return EmotionalValence.POSITIVE;
  if (negativeCount > positiveCount) return EmotionalValence.NEGATIVE;
  return EmotionalValence.NEUTRAL;
}

async function codeWithOpenAI(quote: string, context: string): Promise<StructureCoding> {
  const client = getOpenAIClient();
  if (!client) throw new Error('OpenAI client not available');

  const systemPrompt = `You are a clinical psychologist. For the given therapeutic moment, identify which of these 10 phenomenological structures are present:
1. body - somatic awareness, physical sensations
2. immediate_experience - raw present-moment experience
3. emotion - affective states, feelings
4. behaviour - observable actions, patterns
5. social - relational dynamics, interpersonal patterns
6. cognitive - thought patterns, beliefs
7. reflective - metacognitive awareness, insight
8. narrative - identity construction, meaning-making
9. ecological - environmental context, cultural factors
10. normative - values, moral frameworks

For each structure present, rate intensity (0-1) and identify valence (positive/negative/neutral/mixed).
Return JSON: { structures: [{ name, intensity, valence }] } - include only top 2-4 structures.`;

  const userPrompt = `Quote: "${quote}"\nContext: "${context}"`;

  try {
    const response = await (client as any).chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const text = response.choices[0]?.message?.content || "";
    if (!text) throw new Error('No response text');

    const jsonMatch = text.match(/\{[\s\S]*structures[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');

    return JSON.parse(jsonMatch[0]) as StructureCoding;
  } catch (error) {
    console.error('OpenAI structure coding error:', error);
    throw error;
  }
}

function codeWithFallback(quote: string, context: string): StructureCoding {
  const fullText = `${quote} ${context}`;
  const valence = detectValence(fullText);

  const structureScores: Record<StructureName, number> = {} as Record<StructureName, number>;

  for (const structureName of Object.values(StructureName)) {
    const keywords = STRUCTURE_KEYWORDS[structureName];
    structureScores[structureName] = countKeywordMatches(fullText, keywords);
  }

  const sortedStructures = Object.entries(structureScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .filter(([, score]) => score > 0);

  const maxScore = Math.max(...Object.values(structureScores));

  const structures = sortedStructures.map(([name, score]) => ({
    name: name as StructureName,
    intensity: Math.min(1, score / Math.max(1, maxScore)),
    valence
  }));

  return { structures };
}

export async function codeStructures(quote: string, context: string): Promise<StructureCoding> {
  if (hasOpenAI()) {
    try {
      return await codeWithOpenAI(quote, context);
    } catch (error) {
      console.warn('Falling back to keyword-based coding:', error);
      return codeWithFallback(quote, context);
    }
  }

  return codeWithFallback(quote, context);
}
