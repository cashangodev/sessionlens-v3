import { TherapistMoveType, TherapistMoveDistribution } from '@/types';

const THERAPIST_KEYWORDS: Record<TherapistMoveType, string[]> = {
  [TherapistMoveType.EMPATHIC_ATTUNEMENT]: [
    'tell me more', 'that sounds', 'i hear you', 'i understand', 'that must be',
    'how painful', 'that\'s difficult', 'mm-hmm', 'go on', 'what else', 'reflect back',
    'sounds like', 'it seems', 'i can see', 'i appreciate', 'thank you for sharing'
  ],
  [TherapistMoveType.CHALLENGE]: [
    'have you considered', 'what if', 'i wonder if', 'let me challenge', 'i\'m noticing',
    'could it be that', 'another way to look', 'what would happen if', 'exploring',
    'stretch yourself', 'push back', 'try something'
  ],
  [TherapistMoveType.INTERPRETATION]: [
    'it seems like', 'what i\'m noticing', 'could it be', 'my sense is', 'the pattern i see',
    'looking at this', 'my interpretation', 'i\'m hearing', 'that suggests', 'points to',
    'appears to be', 'indicates'
  ],
  [TherapistMoveType.SILENCE]: [
    '[pause]', '[silence]', '[long silence]', '[quiet moment]', '[gap]', '...'
  ],
  [TherapistMoveType.REFLECTION]: [
    'so what you\'re saying', 'let me reflect back', 'if i understand', 'what i hear',
    'you\'re saying that', 'sounds like you', 'so you felt', 'it\'s as if', 'the way you',
    'reflecting', 'mirror back'
  ]
};

function countKeywordMatches(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  let count = 0;
  for (const keyword of keywords) {
    const regex = new RegExp(`\\b${keyword.replace(/'/g, "'")}\\b`, 'gi');
    const matches = lower.match(regex);
    count += (matches?.length || 0);
  }
  return count;
}

function classifyTherapistMove(therapistText: string): TherapistMoveType {
  if (!therapistText || therapistText.length === 0) {
    return TherapistMoveType.SILENCE;
  }

  // Check for silence patterns
  if (/^\s*\[\s*(pause|silence|quiet|gap)\s*\]\s*$/i.test(therapistText.trim())) {
    return TherapistMoveType.SILENCE;
  }

  const moveScores: Record<TherapistMoveType, number> = {
    [TherapistMoveType.EMPATHIC_ATTUNEMENT]: 0,
    [TherapistMoveType.CHALLENGE]: 0,
    [TherapistMoveType.INTERPRETATION]: 0,
    [TherapistMoveType.SILENCE]: 0,
    [TherapistMoveType.REFLECTION]: 0
  };

  for (const [moveType, keywords] of Object.entries(THERAPIST_KEYWORDS)) {
    moveScores[moveType as TherapistMoveType] = countKeywordMatches(therapistText, keywords);
  }

  let bestMove = TherapistMoveType.REFLECTION;
  let bestScore = moveScores[TherapistMoveType.REFLECTION];

  for (const [moveType, score] of Object.entries(moveScores)) {
    if (score > bestScore) {
      bestScore = score;
      bestMove = moveType as TherapistMoveType;
    }
  }

  return bestScore > 0 ? bestMove : TherapistMoveType.REFLECTION;
}

export function codeTherapistMoves(therapistResponses: string[]): TherapistMoveDistribution[] {
  const moveCounts: Record<TherapistMoveType, number> = {
    [TherapistMoveType.EMPATHIC_ATTUNEMENT]: 0,
    [TherapistMoveType.CHALLENGE]: 0,
    [TherapistMoveType.INTERPRETATION]: 0,
    [TherapistMoveType.SILENCE]: 0,
    [TherapistMoveType.REFLECTION]: 0
  };

  for (const response of therapistResponses) {
    const move = classifyTherapistMove(response);
    moveCounts[move]++;
  }

  const total = therapistResponses.length || 1;

  return Object.entries(moveCounts).map(([type, count]) => ({
    type: type as TherapistMoveType,
    count,
    percentage: (count / total) * 100
  }));
}

export function classifyTherapistMoveForMoment(therapistResponse: string): TherapistMoveType {
  return classifyTherapistMove(therapistResponse);
}
