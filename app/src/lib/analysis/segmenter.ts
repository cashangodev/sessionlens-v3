import { getOpenAIClient, hasOpenAI } from './openai-client';

interface RawSegment {
  id: number;
  timestamp: string;
  quote: string;
  context: string;
  type: 'immediate_experience' | 'recalled_past' | 'future_oriented' | 'reflective';
  therapistResponse: string;
  rawContent?: string;
}

const EMOTIONAL_KEYWORDS = [
  'afraid', 'angry', 'sad', 'happy', 'anxious', 'hopeless', 'relieved', 'guilty', 'ashamed',
  'frustrated', 'overwhelmed', 'lonely', 'grateful', 'resentful', 'panicked', 'depressed',
  'terrified', 'disgusted', 'jealous', 'hurt', 'confused', 'concerned', 'worried', 'stressed'
];

const SOMATIC_KEYWORDS = [
  'chest', 'weight', 'breathing', 'stomach', 'tension', 'headache', 'pain', 'tired', 'exhausted',
  'numb', 'shaking', 'heart racing', 'shoulders', 'jaw', 'throat', 'heavy', 'frozen', 'restless',
  'sick', 'dizzy', 'ache', 'tight', 'tense', 'hurts', 'aches'
];

const RISK_KEYWORDS = [
  'suicidal', 'kill myself', 'end it', 'harm', 'cut', 'drinking', 'drugs', 'substance',
  'addiction', 'overdose', 'dangerous', 'abuse', 'trauma'
];

const INSIGHT_KEYWORDS = [
  'realize', 'notice', 'aware', 'understand', 'insight', 'perspective', 'looking back',
  'see now', 'occurs to me', 'observe myself', 'pattern', 'step back', 'bigger picture',
  'makes sense', 'learned', 'growth'
];

function scoreKeywords(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const keyword of keywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = lower.match(regex);
    score += (matches?.length || 0);
  }
  return score;
}

function extractQuote(text: string): string {
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
  if (sentences.length === 0) return text.substring(0, 100);

  let bestSentence = sentences[0];
  let bestScore = scoreKeywords(sentences[0], EMOTIONAL_KEYWORDS) + scoreKeywords(sentences[0], SOMATIC_KEYWORDS);

  for (const sentence of sentences) {
    const emotionalScore = scoreKeywords(sentence, EMOTIONAL_KEYWORDS);
    const somaticScore = scoreKeywords(sentence, SOMATIC_KEYWORDS);
    const totalScore = emotionalScore + somaticScore;
    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestSentence = sentence;
    }
  }

  return bestSentence.substring(0, 150);
}

function determineMomentType(text: string): 'immediate_experience' | 'recalled_past' | 'future_oriented' | 'reflective' {
  const lower = text.toLowerCase();

  if (/right now|in this moment|as i say|i notice|happening|feeling right now|present|just noticed|sensation|here and now/.test(lower)) {
    return 'immediate_experience';
  }
  if (/used to|when i was|back then|remember|years ago|childhood|past|years|never/.test(lower)) {
    return 'recalled_past';
  }
  if (/will|going to|might|could|hope|worried that|what if|fear|planning|next/.test(lower)) {
    return 'future_oriented';
  }
  return 'reflective';
}

function extractTherapistResponse(transcript: string, patientTextEnd: number): string {
  const remaining = transcript.substring(patientTextEnd);
  const therapistMatch = remaining.match(/(?:Therapist|Counselor|Doctor|Clinician):\s*([^\n]+(?:\n(?!(?:Patient|Client|Therapist|Counselor|Doctor|Clinician):)[^\n]*)*)/i);
  return therapistMatch ? therapistMatch[1].trim().substring(0, 200) : '[No response recorded]';
}

async function segmentWithOpenAI(transcript: string): Promise<RawSegment[]> {
  const client = getOpenAIClient();
  if (!client) return [];

  const systemPrompt = `You are a clinical psychologist analyzing a therapy session transcript. Identify the 5-7 most clinically significant moments. For each moment, extract:
1. The patient's exact quote (most emotionally significant sentence)
2. Surrounding context (2-3 sentences before and after)
3. Moment type: immediate_experience, recalled_past, future_oriented, or reflective
4. The therapist's response/intervention that followed

Return a JSON array with objects: { quote, context, type, therapistResponse }`;

  const userPrompt = `Analyze this therapy transcript and identify significant moments:\n\n${transcript}`;

  try {
    const response = await (client as any).chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const text = response.choices[0]?.message?.content || "";
    if (!text) return [];

    const jsonMatch = text.match(/\[\s*{[\s\S]*}\s*\]/);
    if (!jsonMatch) return [];

    const moments = JSON.parse(jsonMatch[0]) as Array<{
      quote: string;
      context: string;
      type: 'immediate_experience' | 'recalled_past' | 'future_oriented' | 'reflective';
      therapistResponse: string;
    }>;
    return moments.map((m, i: number) => ({
      id: i,
      timestamp: `${Math.floor(i * 5)}:00`,
      quote: m.quote || '',
      context: m.context || '',
      type: m.type || 'reflective',
      therapistResponse: m.therapistResponse || ''
    }));
  } catch (error) {
    console.error('OpenAI segmentation error:', error);
    return [];
  }
}

function segmentWithFallback(transcript: string): RawSegment[] {
  const paragraphs = transcript.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 20);

  const scoredParagraphs = paragraphs.map((para, idx) => {
    const emotionalScore = scoreKeywords(para, EMOTIONAL_KEYWORDS);
    const somaticScore = scoreKeywords(para, SOMATIC_KEYWORDS);
    const riskScore = scoreKeywords(para, RISK_KEYWORDS);
    const insightScore = scoreKeywords(para, INSIGHT_KEYWORDS);

    const totalScore = emotionalScore * 2 + somaticScore * 1.5 + riskScore * 3 + insightScore * 1;

    return { para, idx, score: totalScore };
  });

  const topMoments = scoredParagraphs
    .sort((a, b) => b.score - a.score)
    .slice(0, 7)
    .sort((a, b) => a.idx - b.idx);

  const segments: RawSegment[] = [];

  topMoments.forEach((moment, i) => {
    const beforeIdx = Math.max(0, moment.idx - 1);
    const afterIdx = Math.min(paragraphs.length - 1, moment.idx + 1);

    const context = [
      beforeIdx !== moment.idx ? paragraphs[beforeIdx] : '',
      paragraphs[moment.idx],
      afterIdx !== moment.idx ? paragraphs[afterIdx] : ''
    ].filter(s => s).join(' ');

    segments.push({
      id: i,
      timestamp: `${Math.floor(i * 5)}:00`,
      quote: extractQuote(moment.para),
      context: context.substring(0, 400),
      type: determineMomentType(moment.para),
      therapistResponse: extractTherapistResponse(transcript, transcript.indexOf(moment.para) + moment.para.length)
    });
  });

  return segments;
}

export async function segmentTranscript(transcript: string): Promise<RawSegment[]> {
  if (hasOpenAI()) {
    const openaiSegments = await segmentWithOpenAI(transcript);
    if (openaiSegments.length > 0) {
      return openaiSegments;
    }
  }

  return segmentWithFallback(transcript);
}
