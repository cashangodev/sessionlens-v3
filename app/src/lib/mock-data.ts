import {
  AnalysisResult,
  StructureName,
  EmotionalValence,
  RiskSeverity,
  TherapistMoveType,
} from '@/types';

export const MOCK_ANALYSIS: AnalysisResult = {
  quickInsight: {
    riskLevel: 'moderate',
    clinicalPriority: 'Anxiety with emerging dissociative features; careful monitoring recommended',
    prognosis: 'Good - Client shows strong insight and therapeutic engagement',
    topRecommendation: 'Continue exploring somatic awareness techniques alongside cognitive restructuring',
    sessionNumber: 5,
  },

  moments: [
    {
      id: 1,
      timestamp: '00:02:15',
      quote: 'When I think about going back to work, my chest gets tight. It\'s like... I can\'t breathe.',
      context:
        'Client describing physical response to anticipated stressor. First mention of somatic symptom.',
      type: 'immediate_experience',
      valence: EmotionalValence.NEGATIVE,
      intensity: 8,
      structures: [
        StructureName.BODY,
        StructureName.EMOTION,
        StructureName.IMMEDIATE_EXPERIENCE,
      ],
      therapistMove: TherapistMoveType.EMPATHIC_ATTUNEMENT,
      therapistQuote: 'So when you think about work, your body responds with tightness and difficulty breathing.',
    },
    {
      id: 2,
      timestamp: '00:05:43',
      quote:
        'I used to love my job. I felt competent. Now I just feel like a failure whenever I make a mistake.',
      context: 'Narrative shift - comparing past self to present self. Identity concern emerging.',
      type: 'recalled_past',
      valence: EmotionalValence.MIXED,
      intensity: 7,
      structures: [
        StructureName.NARRATIVE,
        StructureName.COGNITIVE,
        StructureName.EMOTION,
      ],
      therapistMove: TherapistMoveType.REFLECTION,
      therapistQuote:
        'There\'s a real shift you\'re describing - from feeling competent to feeling like a failure.',
    },
    {
      id: 3,
      timestamp: '00:12:08',
      quote: 'My family says I should just push through it. That I\'m being too sensitive.',
      context: 'External pressure from social system. Normative conflict visible.',
      type: 'immediate_experience',
      valence: EmotionalValence.NEGATIVE,
      intensity: 6,
      structures: [StructureName.SOCIAL, StructureName.NORMATIVE, StructureName.EMOTION],
      therapistMove: TherapistMoveType.INTERPRETATION,
      therapistQuote:
        'So there\'s this tension between what your family expects and what you\'re actually experiencing.',
    },
    {
      id: 4,
      timestamp: '00:18:31',
      quote:
        'Wait... I never thought about it that way. Maybe I\'m not a failure - maybe I\'m just overwhelmed right now.',
      context: 'Metacognitive shift. Client demonstrates reflective capacity and self-compassion.',
      type: 'reflective',
      valence: EmotionalValence.POSITIVE,
      intensity: 5,
      structures: [
        StructureName.REFLECTIVE,
        StructureName.COGNITIVE,
        StructureName.NARRATIVE,
      ],
      therapistMove: TherapistMoveType.SILENCE,
      therapistQuote: '[Therapist paused here, allowing space for this insight to settle]',
    },
    {
      id: 5,
      timestamp: '00:24:17',
      quote: 'I think next week I could try going in for just two hours. See how that feels.',
      context: 'Future-oriented, collaborative planning. Behavioral activation beginning.',
      type: 'future_oriented',
      valence: EmotionalValence.POSITIVE,
      intensity: 4,
      structures: [
        StructureName.BEHAVIOUR,
        StructureName.COGNITIVE,
        StructureName.SOCIAL,
      ],
      therapistMove: TherapistMoveType.REFLECTION,
      therapistQuote:
        'That sounds like a thoughtful experiment - something manageable that builds toward your goal.',
    },
  ],

  riskFlags: [
    {
      id: 1,
      severity: RiskSeverity.MEDIUM,
      signal: 'Emerging Dissociative Features',
      detail:
        'Client reported feeling disconnected from body during peak anxiety. Single mention but warrants monitoring.',
      algorithmMatch:
        'Phrase "I can\'t breathe" combined with somatic avoidance and emotional numbing language detected in proximity.',
      recommendation:
        'Validate dissociative experience; introduce grounding techniques; monitor for escalation.',
      interventionType: 'Somatic Grounding',
    },
    {
      id: 2,
      severity: RiskSeverity.LOW,
      signal: 'Perfectionistic Beliefs',
      detail:
        'Narrative reveals all-or-nothing thinking about competence. One mistake = total failure.',
      algorithmMatch:
        'High intensity emotional response to performance-related content; cognitive rigidity patterns.',
      recommendation:
        'Gently challenge black-and-white thinking; explore middle ground; build self-compassion.',
      interventionType: 'Cognitive Restructuring',
    },
  ],

  practitionerMatches: [
    {
      id: 1,
      code: 'PT-CBT-2847',
      name: 'Dr. Rachel Morrison',
      specialty: 'Cognitive-Behavioral Therapy',
      matchScore: 0.92,
      methodology: 'Graded Exposure with Cognitive Restructuring',
      interventionSequence: [
        'Establish safety and assess current anxiety',
        'Identify and challenge catastrophic thoughts',
        'Introduce somatic awareness and grounding',
        'Create graduated exposure hierarchy',
        'Practice in-session exposure with therapist support',
        'Assign behavioral experiments between sessions',
      ],
      outcomePatterns: [
        {
          metric: 'Anxiety Reduction',
          change: '-45% average over 6 sessions',
          confidence: 0.88,
        },
        {
          metric: 'Return to Work',
          change: '78% successfully returned within 8 weeks',
          confidence: 0.85,
        },
        { metric: 'Quality of Life', change: '+52% at 3-month follow-up', confidence: 0.81 },
      ],
      matchReasoning:
        'Matches on somatic presentation and workplace anxiety. CBT framework aligns with client\'s strong cognitive capacity and capacity for behavioral experimentation.',
      targetStructures: [
        StructureName.BODY,
        StructureName.COGNITIVE,
        StructureName.BEHAVIOUR,
        StructureName.EMOTION,
      ],
    },
    {
      id: 2,
      code: 'PT-SENSORIMOTOR-1523',
      name: 'James Chen, LMHC',
      specialty: 'Somatic & Sensorimotor Psychotherapy',
      matchScore: 0.87,
      methodology: 'Sensorimotor Psychotherapy for Trauma & Anxiety',
      interventionSequence: [
        'Develop bottom-up awareness of bodily responses',
        'Track physical tension and defensive patterns',
        'Facilitate conscious completion of interrupted responses',
        'Build sense of safety through movement and grounding',
        'Integrate somatic awareness with emotional processing',
      ],
      outcomePatterns: [
        { metric: 'Somatic Symptom Relief', change: '-61% over 8 sessions', confidence: 0.89 },
        {
          metric: 'Emotional Regulation',
          change: '+43% improvement in stress response',
          confidence: 0.82,
        },
        {
          metric: 'Body Trust',
          change: '+58% increase in somatic awareness capacity',
          confidence: 0.84,
        },
      ],
      matchReasoning:
        'Strong match for primary somatic presentation. Client\'s immediate experience of chest tightness and breathing difficulties are core somatic issues. This approach prioritizes the body as primary therapeutic entry point.',
      targetStructures: [
        StructureName.BODY,
        StructureName.IMMEDIATE_EXPERIENCE,
        StructureName.EMOTION,
        StructureName.BEHAVIOUR,
      ],
    },
    {
      id: 3,
      code: 'PT-ACT-3891',
      name: 'Dr. Priya Patel',
      specialty: 'Acceptance and Commitment Therapy',
      matchScore: 0.84,
      methodology: 'Acceptance & Commitment Therapy with Values Clarification',
      interventionSequence: [
        'Explore cost of experiential avoidance',
        'Clarify core values and life directions',
        'Practice psychological flexibility through exposure',
        'Develop commitment to valued actions despite anxiety',
        'Monitor progress on meaningful behavior change',
      ],
      outcomePatterns: [
        {
          metric: 'Psychological Flexibility',
          change: '+49% increase in willingness to experience anxiety',
          confidence: 0.86,
        },
        {
          metric: 'Values-Aligned Action',
          change: '71% engaged in meaningful work-related activities',
          confidence: 0.83,
        },
        {
          metric: 'Wellbeing',
          change: '+38% improvement in life satisfaction',
          confidence: 0.79,
        },
      ],
      matchReasoning:
        'Matches on client\'s narrative conflict between family expectations and personal values. ACT framework addresses both somatic symptoms and the existential/identity concerns evident in session.',
      targetStructures: [
        StructureName.NARRATIVE,
        StructureName.NORMATIVE,
        StructureName.BEHAVIOUR,
        StructureName.COGNITIVE,
      ],
    },
  ],

  similarCases: [
    {
      id: 1,
      patientCode: 'SL-2023-4782',
      matchScore: 0.89,
      presentingConcerns: ['Work-related anxiety', 'Loss of confidence', 'Somatic complaints'],
      dominantStructures: [
        StructureName.BODY,
        StructureName.EMOTION,
        StructureName.COGNITIVE,
      ],
      sessionCount: 8,
      keyThemes: ['Perfectionism', 'Workplace pressure', 'Identity shift', 'Somatic anxiety'],
      outcome: 'Significant improvement',
      outcomeDetail:
        'Client successfully returned to work on modified schedule. Anxiety symptoms reduced by 60% within 6 weeks. Developed effective somatic coping strategies.',
      representativeQuote:
        '"I still get nervous, but now I know how to calm my body down. And I\'m being kinder to myself about mistakes."',
    },
    {
      id: 2,
      patientCode: 'SL-2023-5891',
      matchScore: 0.85,
      presentingConcerns: ['Anxiety', 'Workplace transition', 'Family conflict'],
      dominantStructures: [
        StructureName.SOCIAL,
        StructureName.NORMATIVE,
        StructureName.EMOTION,
      ],
      sessionCount: 6,
      keyThemes: ['Family expectations', 'Values clarification', 'Boundary setting'],
      outcome: 'Significant improvement',
      outcomeDetail:
        'Client established clearer boundaries with family regarding career decisions. Anxiety decreased as alignment between personal values and actions improved.',
      representativeQuote:
        '"I realized I was living for my parents\' approval, not for myself. Changing that has made a huge difference."',
    },
    {
      id: 3,
      patientCode: 'SL-2024-1247',
      matchScore: 0.81,
      presentingConcerns: ['Somatic symptoms', 'Emotional regulation', 'Avoidance behaviors'],
      dominantStructures: [
        StructureName.BODY,
        StructureName.BEHAVIOUR,
        StructureName.REFLECTIVE,
      ],
      sessionCount: 10,
      keyThemes: ['Trauma aftermath', 'Body awareness', 'Gradual exposure'],
      outcome: 'Moderate improvement',
      outcomeDetail:
        'Client developed improved somatic awareness and capacity to tolerate difficult emotions. Able to engage in previously avoided activities with reduced anxiety.',
      representativeQuote:
        '"Therapy helped me understand that my body is trying to protect me, not punish me. That changed everything."',
    },
  ],

  structureProfile: {
    [StructureName.BODY]: 0.85,
    [StructureName.IMMEDIATE_EXPERIENCE]: 0.78,
    [StructureName.EMOTION]: 0.82,
    [StructureName.BEHAVIOUR]: 0.71,
    [StructureName.SOCIAL]: 0.68,
    [StructureName.COGNITIVE]: 0.75,
    [StructureName.REFLECTIVE]: 0.69,
    [StructureName.NARRATIVE]: 0.74,
    [StructureName.ECOLOGICAL]: 0.52,
    [StructureName.NORMATIVE]: 0.65,
  },

  sessionHistory: [
    {
      session: 1,
      emotionalIntensity: 8.2,
      reflectiveCapacity: 3.1,
      emotionalRegulation: 2.8,
      therapeuticAlliance: 3.4,
    },
    {
      session: 2,
      emotionalIntensity: 7.8,
      reflectiveCapacity: 3.6,
      emotionalRegulation: 3.2,
      therapeuticAlliance: 4.1,
    },
    {
      session: 3,
      emotionalIntensity: 7.3,
      reflectiveCapacity: 4.2,
      emotionalRegulation: 3.7,
      therapeuticAlliance: 4.5,
    },
    {
      session: 4,
      emotionalIntensity: 6.9,
      reflectiveCapacity: 4.8,
      emotionalRegulation: 4.1,
      therapeuticAlliance: 4.8,
    },
    {
      session: 5,
      emotionalIntensity: 6.2,
      reflectiveCapacity: 5.3,
      emotionalRegulation: 4.6,
      therapeuticAlliance: 5.1,
    },
  ],

  therapistMoves: [
    { type: TherapistMoveType.EMPATHIC_ATTUNEMENT, count: 8, percentage: 32 },
    { type: TherapistMoveType.REFLECTION, count: 7, percentage: 28 },
    { type: TherapistMoveType.INTERPRETATION, count: 5, percentage: 20 },
    { type: TherapistMoveType.SILENCE, count: 3, percentage: 12 },
    { type: TherapistMoveType.CHALLENGE, count: 2, percentage: 8 },
  ],

  clinicianReport: `Session 5 Analysis: Client presents with ongoing workplace anxiety and emerging somatic symptoms. Physical manifestations (chest tightness, breathing difficulty) are primary presenting features. Throughout session, client demonstrates increasing capacity for self-reflection and cognitive flexibility. Notable shift in session: client moves from self-blame ("I'm a failure") to contextual understanding ("I'm overwhelmed") - indicating growing metacognitive awareness.

Risk Assessment: Low-to-moderate risk profile. Dissociative features mentioned once (disconnection from body) warrant monitoring but do not indicate acute dissociation. No safety concerns identified. Client maintains protective factors: strong therapeutic alliance, cognitive capacity, family support (despite some conflict), and demonstrated behavioral activation.

Treatment Trajectory: Positive. Client shows measurable improvement across emotional regulation (2.8 to 4.6 on 10-point scale) and reflective capacity (3.1 to 5.3). Recommend continuing current approach with increased emphasis on somatic interventions given the body-based nature of anxiety presentation.

Next Steps: Consider graded exposure to work environment; consolidate somatic grounding techniques; explore perfectionism and identity narratives; maintain family psychoeducation regarding anxiety response patterns.`,

  patientReport: `Session Summary: Your Session 5

What We Explored Together:
You shared how anxiety shows up in your body when thinking about work - that tight feeling in your chest and difficulty breathing. We talked about how this experience is real and understandable given what you've been through. Together we looked at how your thinking about yourself has shifted from feeling competent to feeling like a failure.

What Stood Out:
A really important moment happened when you recognized something on your own: you're not a failure, you're just overwhelmed right now. That kind of insight - seeing your situation more clearly and with more compassion - is exactly the growth that leads to feeling better.

Your Strengths:
- You show up and engage honestly in therapy, even when it's hard
- You can reflect on your own patterns (this is a real skill!)
- You're willing to experiment with new approaches
- You're thinking about returning to work in a gradual, manageable way

Suggestions for You:
- Practice the grounding technique we discussed when you notice that chest tightness
- Notice throughout the week when you're being hard on yourself about mistakes
- Try spending time in your body - walks, stretching - to rebuild trust in your physical sensations
- Remember that progress isn't linear; some days will feel harder than others, and that's okay

We're moving in a really positive direction. Your nervous system is already learning that it's okay to feel safer. Keep practicing.`,

  analysisStatus: 'mock',
  analysisWarnings: ['This is mock data — not derived from a real analysis pipeline'],
};
