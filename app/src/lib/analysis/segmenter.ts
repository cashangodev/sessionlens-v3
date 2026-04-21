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
  // First, try to extract just the client/patient speech (remove speaker labels)
  const cleaned = text.replace(/^(Client|Patient|Therapist|Doctor|Counselor|Clinician):\s*/gim, '').trim();

  // Split into sentences but keep delimiters for natural reading
  const sentences = cleaned.match(/[^.!?]*[.!?]+/g)?.map(s => s.trim()).filter(s => s.length > 15) || [];
  if (sentences.length === 0) return cleaned.substring(0, 250);

  // Score each sentence by clinical relevance
  let bestIdx = 0;
  let bestScore = -1;

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    const emotionalScore = scoreKeywords(s, EMOTIONAL_KEYWORDS);
    const somaticScore = scoreKeywords(s, SOMATIC_KEYWORDS);
    const riskScore = scoreKeywords(s, RISK_KEYWORDS);
    const insightScore = scoreKeywords(s, INSIGHT_KEYWORDS);
    const totalScore = emotionalScore * 2 + somaticScore * 1.5 + riskScore * 3 + insightScore * 2;
    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestIdx = i;
    }
  }

  // Take the best sentence plus 1-2 surrounding sentences for context
  const startIdx = Math.max(0, bestIdx - 1);
  const endIdx = Math.min(sentences.length, bestIdx + 2);
  const quote = sentences.slice(startIdx, endIdx).join(' ').trim();

  // Cap at 300 chars to keep it readable but meaningful
  if (quote.length > 300) {
    return quote.substring(0, 297) + '...';
  }
  return quote;
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

  const systemPrompt = `You are a clinical psychologist analyzing a therapy session transcript. Identify the 5-7 most clinically significant moments from the CLIENT's speech only.

For each moment, extract:
1. "quote": The client's EXACT words — 1-3 complete sentences that capture the emotional core. Must be long enough to be meaningful (minimum 20 words). Copy verbatim from the transcript.
2. "context": What was being discussed — the therapist's question that prompted this and what followed (2-3 sentences).
3. "type": One of: immediate_experience, recalled_past, future_oriented, reflective
4. "therapistResponse": The therapist's response/intervention that directly followed.

IMPORTANT: Prioritize moments that reveal:
- Risk signals (substance use, self-harm, suicidal ideation)
- Core beliefs and cognitive distortions
- Emotional breakthroughs or insights
- Somatic experiences tied to psychological content
- Relationship patterns

Return a JSON array with objects: { quote, context, type, therapistResponse }`;

  const userPrompt = `Analyze this therapy transcript and identify significant moments:\n\n${transcript}`;

  try {
    const response = await (client as any).chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
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
  // Split transcript into speaker turns (Client/Patient vs Therapist)
  const turnPattern = /(?:^|\n)((?:Client|Patient|Therapist|Doctor|Counselor|Clinician):\s*)/gi;
  const turns: { speaker: string; text: string; startPos: number }[] = [];

  let lastIdx = 0;
  let lastSpeaker = '';
  let match: RegExpExecArray | null;
  const turnRegex = /(?:^|\n)((?:Client|Patient|Therapist|Doctor|Counselor|Clinician):)\s*/gi;

  while ((match = turnRegex.exec(transcript)) !== null) {
    if (lastSpeaker && lastIdx > 0) {
      turns.push({
        speaker: lastSpeaker,
        text: transcript.slice(lastIdx, match.index).trim(),
        startPos: lastIdx,
      });
    }
    lastSpeaker = match[1].replace(':', '').trim().toLowerCase();
    lastIdx = match.index + match[0].length;
  }
  // Push last turn
  if (lastSpeaker) {
    turns.push({
      speaker: lastSpeaker,
      text: transcript.slice(lastIdx).trim(),
      startPos: lastIdx,
    });
  }

  // If no speaker turns found, fall back to paragraph splitting
  if (turns.length === 0) {
    const paragraphs = transcript.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 20);
    turns.push(...paragraphs.map((p, i) => ({ speaker: 'client', text: p, startPos: i * 100 })));
  }

  // Score only client/patient turns by clinical relevance
  const clientTurns = turns.filter(t =>
    t.speaker === 'client' || t.speaker === 'patient'
  );

  const scoredTurns = clientTurns.map((turn, idx) => {
    const emotionalScore = scoreKeywords(turn.text, EMOTIONAL_KEYWORDS);
    const somaticScore = scoreKeywords(turn.text, SOMATIC_KEYWORDS);
    const riskScore = scoreKeywords(turn.text, RISK_KEYWORDS);
    const insightScore = scoreKeywords(turn.text, INSIGHT_KEYWORDS);

    const totalScore = emotionalScore * 2 + somaticScore * 1.5 + riskScore * 3 + insightScore * 2;
    // Bonus for longer, more substantive turns
    const lengthBonus = Math.min(turn.text.length / 200, 1.5);

    return { turn, idx, score: totalScore * lengthBonus };
  });

  const topMoments = scoredTurns
    .sort((a, b) => b.score - a.score)
    .slice(0, 7)
    .sort((a, b) => a.idx - b.idx);

  const totalTurns = turns.length;

  const segments: RawSegment[] = topMoments.map((moment, i) => {
    // Find the therapist turn that follows this client turn
    const turnIndex = turns.indexOf(moment.turn);
    const nextTurn = turnIndex >= 0 && turnIndex + 1 < turns.length ? turns[turnIndex + 1] : null;
    const prevTurn = turnIndex > 0 ? turns[turnIndex - 1] : null;

    // Build context from surrounding turns
    const context = [
      prevTurn ? `${prevTurn.speaker}: ${prevTurn.text.substring(0, 150)}` : '',
      moment.turn.text,
      nextTurn ? `${nextTurn.speaker}: ${nextTurn.text.substring(0, 150)}` : '',
    ].filter(s => s).join('\n');

    // Estimate timestamp based on position in transcript
    const positionRatio = moment.turn.startPos / Math.max(transcript.length, 1);
    const estimatedMinute = Math.round(positionRatio * 50);

    return {
      id: i,
      timestamp: `${estimatedMinute}:00`,
      quote: extractQuote(moment.turn.text),
      context: context.substring(0, 500),
      type: determineMomentType(moment.turn.text),
      therapistResponse: nextTurn && nextTurn.speaker !== 'client' && nextTurn.speaker !== 'patient'
        ? nextTurn.text.substring(0, 250)
        : '[No response recorded]',
    };
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
