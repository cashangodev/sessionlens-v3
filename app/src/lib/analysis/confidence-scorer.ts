/**
 * Confidence Scorer
 * Scores each therapeutic moment on 4 qualities from phenomenological methodology:
 * Spontaneity, Concrete Detail, Contextual Richness, Narrative Coherence.
 * Also detects therapist influence (leading questions).
 *
 * Based on: Henriksen et al. (2021/2022), Fisher et al. (1987), Daly et al. (2024)
 */

import { Moment, MomentConfidence, TherapistMoveType } from '@/types';

// Keywords indicating concrete, specific language (vs. abstract/vague)
const CONCRETE_MARKERS = [
  'remember', 'felt like', 'i could feel', 'i saw', 'i heard', 'it was',
  'that moment', 'specific', 'exactly', 'for example', 'one time', 'last week',
  'yesterday', 'this morning', 'my heart', 'my chest', 'my stomach', 'the room',
  'i said', 'they said', 'i noticed', 'it hit me',
];

// Keywords indicating contextual richness (setting, people, timeframe)
const CONTEXT_MARKERS = [
  'at work', 'at home', 'in the office', 'with my', 'my partner', 'my boss',
  'my mother', 'my father', 'my friend', 'in the morning', 'at night', 'during',
  'while i was', 'when i', 'the doctor', 'the meeting', 'the phone', 'the kitchen',
  'after that', 'before that', 'since then', 'for years', 'growing up',
];

// Therapist moves that are more likely to produce influenced responses
const LEADING_MOVES: TherapistMoveType[] = [
  TherapistMoveType.CHALLENGE,
  TherapistMoveType.INTERPRETATION,
];

// Phrases in therapist quotes that suggest leading questions
const LEADING_PHRASES = [
  'do you think', 'would you say', 'could it be', 'is it possible',
  'did you feel', 'does that', 'have you noticed', 'have you ever',
  'what about', 'and the sleep', 'tell me about your',
];

export function scoreMomentConfidence(
  moments: Moment[],
  allMomentsInSession: Moment[] = []
): MomentConfidence[] {
  return moments.map((moment, index) => {
    const quote = moment.quote.toLowerCase();
    const therapistQuote = (moment.therapistQuote || '').toLowerCase();

    // 1. SPONTANEITY: Higher if not preceded by a leading question
    let spontaneity = 0.7; // Default baseline
    const isLeadingMove = LEADING_MOVES.includes(moment.therapistMove);
    const hasLeadingPhrase = LEADING_PHRASES.some(p => therapistQuote.includes(p));

    if (isLeadingMove || hasLeadingPhrase) {
      spontaneity = 0.35;
    }
    // Bonus for unprompted disclosures (empathic attunement or silence before)
    if (moment.therapistMove === TherapistMoveType.EMPATHIC_ATTUNEMENT ||
        moment.therapistMove === TherapistMoveType.SILENCE) {
      spontaneity = Math.min(spontaneity + 0.2, 1.0);
    }
    // Extra bonus for high intensity moments (person felt compelled to share)
    if (moment.intensity >= 8) {
      spontaneity = Math.min(spontaneity + 0.1, 1.0);
    }

    // 2. CONCRETE DETAIL: Count concrete markers in the quote
    const concreteHits = CONCRETE_MARKERS.filter(m => quote.includes(m)).length;
    const concreteDetail = Math.min(concreteHits / 4, 1.0);

    // 3. CONTEXTUAL RICHNESS: Setting, people, timeframe
    const contextHits = CONTEXT_MARKERS.filter(m => quote.includes(m)).length;
    const contextualRichness = Math.min(contextHits / 3, 1.0);

    // 4. NARRATIVE COHERENCE: Does this moment connect to others?
    let narrativeCoherence = 0.5; // baseline
    if (allMomentsInSession.length > 1) {
      // Check for thematic overlap with other moments
      const thisStructures = new Set(moment.structures);
      const connectedMoments = allMomentsInSession.filter((m, i) =>
        i !== index && m.structures.some(s => thisStructures.has(s))
      );
      narrativeCoherence = Math.min(connectedMoments.length / (allMomentsInSession.length - 1) + 0.3, 1.0);
    }
    // Bonus for moments that reference past/future (narrative threading)
    if (moment.type === 'recalled_past' || moment.type === 'future_oriented') {
      narrativeCoherence = Math.min(narrativeCoherence + 0.15, 1.0);
    }

    // OVERALL: Weighted average (spontaneity weighted highest per Henriksen)
    const overallConfidence =
      spontaneity * 0.35 +
      concreteDetail * 0.25 +
      contextualRichness * 0.20 +
      narrativeCoherence * 0.20;

    // THERAPIST INFLUENCE FLAG
    const therapistInfluence = isLeadingMove || hasLeadingPhrase;
    let influenceNote: string | undefined;
    if (therapistInfluence) {
      if (hasLeadingPhrase) {
        const matchedPhrase = LEADING_PHRASES.find(p => therapistQuote.includes(p));
        influenceNote = `Therapist prompt detected: "${matchedPhrase}"`;
      } else {
        influenceNote = `Response followed ${moment.therapistMove} move`;
      }
    }

    return {
      momentId: moment.id,
      spontaneity: Math.round(spontaneity * 100) / 100,
      concreteDetail: Math.round(concreteDetail * 100) / 100,
      contextualRichness: Math.round(contextualRichness * 100) / 100,
      narrativeCoherence: Math.round(narrativeCoherence * 100) / 100,
      overallConfidence: Math.round(overallConfidence * 100) / 100,
      therapistInfluence,
      influenceNote,
    };
  });
}
