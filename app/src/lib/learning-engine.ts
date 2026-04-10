import { AnalysisResult, TherapistMoveType, Moment } from '@/types';

export interface MissedOpportunity {
  momentId: number;
  momentText: string;
  currentResponse: string;
  suggestion: string;
  moveType: TherapistMoveType;
}

export interface StrengthObservation {
  momentId: number;
  momentText: string;
  therapistResponse: string;
  observation: string;
  moveType: TherapistMoveType;
}

export interface PeerComparisonData {
  moveType: TherapistMoveType;
  yourPercentage: number;
  peerAveragePercentage: number;
}

export interface LearningResource {
  title: string;
  description: string;
  type: 'article' | 'training' | 'research';
  relevance: string[];
}

export interface LearningFeedback {
  missedOpportunities: MissedOpportunity[];
  strengths: StrengthObservation[];
  peerComparison: PeerComparisonData[];
  resources: LearningResource[];
  summary: {
    overreliance: TherapistMoveType | null;
    underutilized: TherapistMoveType | null;
    keyStrength: string;
  };
}

// Benchmark data: recommended ranges and peer averages
const RECOMMENDED_RANGES: Record<TherapistMoveType, { min: number; max: number }> = {
  [TherapistMoveType.EMPATHIC_ATTUNEMENT]: { min: 25, max: 40 },
  [TherapistMoveType.REFLECTION]: { min: 20, max: 35 },
  [TherapistMoveType.INTERPRETATION]: { min: 15, max: 25 },
  [TherapistMoveType.CHALLENGE]: { min: 10, max: 20 },
  [TherapistMoveType.SILENCE]: { min: 5, max: 15 },
};

const PEER_AVERAGES: Record<TherapistMoveType, number> = {
  [TherapistMoveType.EMPATHIC_ATTUNEMENT]: 32,
  [TherapistMoveType.REFLECTION]: 28,
  [TherapistMoveType.INTERPRETATION]: 20,
  [TherapistMoveType.CHALLENGE]: 14,
  [TherapistMoveType.SILENCE]: 6,
};

const STRENGTH_TEMPLATES: Record<TherapistMoveType, string[]> = {
  [TherapistMoveType.EMPATHIC_ATTUNEMENT]: [
    "Your empathic attunement created a safe space for the client to explore their emotions.",
    "The consistent use of empathy helped the client feel validated and heard.",
    "Your attunement to the client's affective state strengthened the therapeutic alliance.",
    "The warmth in your empathic responses encouraged deeper emotional exploration.",
  ],
  [TherapistMoveType.REFLECTION]: [
    "Your reflective responses helped consolidate the client's understanding of their experience.",
    "By mirroring back their experience, you helped the client gain clarity.",
    "Your reflections validated the client's perspective and demonstrated deep listening.",
    "The reflective statements helped make implicit processes more explicit.",
  ],
  [TherapistMoveType.INTERPRETATION]: [
    "Your interpretation offered a useful frame for understanding the pattern.",
    "This interpretation connected disparate threads into a coherent narrative.",
    "Your psychodynamic formulation deepened the work in this moment.",
    "The interpretation was well-timed and hit the edge of the client's awareness.",
  ],
  [TherapistMoveType.CHALLENGE]: [
    "Your gentle challenge invited the client to examine a limiting belief.",
    "The challenge was compassionate and prompted growth-oriented reflection.",
    "You balanced support with constructive challenge effectively.",
    "The challenge expanded the client's perspective without triggering defensiveness.",
  ],
  [TherapistMoveType.SILENCE]: [
    "Your use of silence allowed the client space to sit with and process.",
    "The pause created room for the client's own inner exploration.",
    "By maintaining silence, you honored the client's need for processing time.",
    "Your comfortable use of silence modeled that reflection need not be rushed.",
  ],
};

const MISSED_OPPORTUNITY_TEMPLATES: Record<TherapistMoveType, { intro: string; alternative: string }[]> = {
  [TherapistMoveType.CHALLENGE]: [
    {
      intro: "In this moment, the client expressed a limiting belief.",
      alternative: "A gentle challenge could have invited them to examine this belief more closely.",
    },
    {
      intro: "When the client mentioned feeling stuck, this was an opportunity to expand perspective.",
      alternative: "A thoughtful challenge might have helped them see alternative possibilities.",
    },
  ],
  [TherapistMoveType.INTERPRETATION]: [
    {
      intro: "This moment revealed a pattern worth naming explicitly.",
      alternative: "An interpretation could have connected this to earlier material or dynamics.",
    },
    {
      intro: "The client's language here pointed to an underlying structure.",
      alternative: "A deeper interpretation might have illuminated the implicit meaning.",
    },
  ],
  [TherapistMoveType.SILENCE]: [
    {
      intro: "This was a moment of high emotional activation.",
      alternative: "A pause might have given the client time to feel fully into the experience.",
    },
    {
      intro: "After this statement, the client appeared to need space for reflection.",
      alternative: "A comfortable silence might have deepened their introspection.",
    },
  ],
  [TherapistMoveType.EMPATHIC_ATTUNEMENT]: [
    {
      intro: "The client's affective state shifted noticeably here.",
      alternative: "Acknowledging this shift with empathic attunement might have deepened the connection.",
    },
  ],
  [TherapistMoveType.REFLECTION]: [
    {
      intro: "In this sequence, the client shared something complex and multi-layered.",
      alternative: "Reflecting back the nuance might have demonstrated deep listening.",
    },
  ],
};

const LEARNING_RESOURCES: Record<TherapistMoveType, LearningResource[]> = {
  [TherapistMoveType.CHALLENGE]: [
    {
      title: "Optimal Challenge: Stretching Without Breaking",
      description: "Research on how to deliver challenge in ways that promote growth rather than resistance.",
      type: "article",
      relevance: ["challenge", "therapeutic-rupture", "growth"],
    },
    {
      title: "The Two-Chair Technique and Internal Conflict",
      description: "Gestalt methods for helping clients challenge their own limiting beliefs safely.",
      type: "training",
      relevance: ["challenge", "experiential", "autonomy"],
    },
  ],
  [TherapistMoveType.INTERPRETATION]: [
    {
      title: "Psychodynamic Formulation: Timing and Dosage",
      description: "When and how to offer interpretations that land rather than resist.",
      type: "article",
      relevance: ["interpretation", "psychodynamic", "timing"],
    },
    {
      title: "Working With Transference and Countertransference",
      description: "Using the therapeutic relationship as data for interpretation.",
      type: "training",
      relevance: ["interpretation", "relationship", "dynamics"],
    },
  ],
  [TherapistMoveType.SILENCE]: [
    {
      title: "The Power of Pause: Silence in Therapy",
      description: "Research on how silence supports client processing and introspection.",
      type: "article",
      relevance: ["silence", "processing", "presence"],
    },
    {
      title: "Comfortable Silence: Overcoming Therapist Anxiety",
      description: "Clinical training on managing the impulse to fill space.",
      type: "training",
      relevance: ["silence", "presence", "therapist-anxiety"],
    },
  ],
  [TherapistMoveType.EMPATHIC_ATTUNEMENT]: [
    {
      title: "Affect Attunement Across the Lifespan",
      description: "Research on moment-to-moment affective resonance and its role in healing.",
      type: "article",
      relevance: ["empathic-attunement", "affect", "relationship"],
    },
  ],
  [TherapistMoveType.REFLECTION]: [
    {
      title: "Motivational Interviewing: The Art of Reflection",
      description: "Evidence-based approaches to reflective listening that deepen understanding.",
      type: "article",
      relevance: ["reflection", "listening", "autonomy"],
    },
  ],
};

export function generateLearningFeedback(analysis: AnalysisResult): LearningFeedback {
  const therapistMoves = analysis.therapistMoves;
  const moments = analysis.moments;

  // Find over-reliance and underutilization
  let overreliance: TherapistMoveType | null = null;
  let underutilized: TherapistMoveType | null = null;
  let maxPercentage = 0;
  let minPercentage = 100;

  for (const move of therapistMoves) {
    if (move.percentage > maxPercentage) {
      maxPercentage = move.percentage;
      overreliance = move.type;
    }
    if (move.percentage < minPercentage) {
      minPercentage = move.percentage;
      underutilized = move.type;
    }
  }

  // Check if overreliance is actually outside recommended range
  if (overreliance) {
    const range = RECOMMENDED_RANGES[overreliance];
    if (maxPercentage <= range.max) {
      overreliance = null;
    }
  }

  // Check if underutilized is actually below recommendation
  if (underutilized && minPercentage > 0) {
    const range = RECOMMENDED_RANGES[underutilized];
    if (minPercentage >= range.min) {
      underutilized = null;
    }
  }

  // Generate missed opportunities
  const missedOpportunities: MissedOpportunity[] = [];

  // Find moments where a particular move could have been used more effectively
  for (let i = 0; i < Math.min(moments.length, 8); i++) {
    const moment = moments[i];
    // Suggest alternatives based on client intensity and valence
    const suggestedMoveType =
      moment.intensity > 7 && moment.valence === 'negative'
        ? TherapistMoveType.SILENCE
        : moment.quote.includes('stuck') || moment.quote.includes('trapped')
          ? TherapistMoveType.CHALLENGE
          : i % 2 === 0 && Math.random() > 0.6
            ? TherapistMoveType.INTERPRETATION
            : null;

    if (suggestedMoveType && moment.therapistMove !== suggestedMoveType) {
      const templates = MISSED_OPPORTUNITY_TEMPLATES[suggestedMoveType] || [];
      if (templates.length > 0) {
        const template = templates[Math.floor(Math.random() * templates.length)];
        missedOpportunities.push({
          momentId: moment.id,
          momentText: moment.quote.substring(0, 80),
          currentResponse: moment.therapistQuote.substring(0, 60),
          suggestion: `${template.intro} ${template.alternative}`,
          moveType: suggestedMoveType,
        });
      }
    }

    if (missedOpportunities.length >= 3) break;
  }

  // Generate strength observations
  const strengths: StrengthObservation[] = [];
  const moveTypesUsed = Array.from(new Set(moments.map((m) => m.therapistMove)));

  for (const moveType of moveTypesUsed) {
    const momentsWithMove = moments.filter((m) => m.therapistMove === moveType);
    if (momentsWithMove.length > 0) {
      const randomMoment = momentsWithMove[Math.floor(Math.random() * momentsWithMove.length)];
      const templates = STRENGTH_TEMPLATES[moveType as TherapistMoveType];
      const template = templates[Math.floor(Math.random() * templates.length)];

      strengths.push({
        momentId: randomMoment.id,
        momentText: randomMoment.quote.substring(0, 100),
        therapistResponse: randomMoment.therapistQuote.substring(0, 80),
        observation: template,
        moveType,
      });

      if (strengths.length >= 3) break;
    }
  }

  // Generate peer comparison
  const peerComparison: PeerComparisonData[] = therapistMoves.map((move) => ({
    moveType: move.type,
    yourPercentage: move.percentage,
    peerAveragePercentage: PEER_AVERAGES[move.type],
  }));

  // Generate learning resources
  const resources: LearningResource[] = [];
  const relevantMoveTypes: TherapistMoveType[] = [];

  if (overreliance) relevantMoveTypes.push(overreliance);
  if (underutilized) relevantMoveTypes.push(underutilized);

  // Add the move with lowest usage as a learning area
  const lowestUsageMove = therapistMoves.reduce((min, curr) =>
    curr.percentage < min.percentage ? curr : min
  );
  if (!relevantMoveTypes.includes(lowestUsageMove.type)) {
    relevantMoveTypes.push(lowestUsageMove.type);
  }

  for (const moveType of relevantMoveTypes) {
    const moveResources = LEARNING_RESOURCES[moveType] || [];
    resources.push(...moveResources.slice(0, 2));
  }

  // Get unique resources and limit to 3
  const uniqueResources = Array.from(
    new Map(resources.map((r) => [r.title, r])).values()
  ).slice(0, 3);

  // Determine key strength
  const strongestMove = therapistMoves.reduce((max, curr) =>
    curr.percentage > max.percentage ? curr : max
  );
  const strengthTemplates = STRENGTH_TEMPLATES[strongestMove.type];
  const keyStrength =
    strengthTemplates[Math.floor(Math.random() * strengthTemplates.length)];

  return {
    missedOpportunities,
    strengths,
    peerComparison,
    resources: uniqueResources,
    summary: {
      overreliance,
      underutilized,
      keyStrength,
    },
  };
}
