import { StructureName, Moment, RiskFlag } from '@/types';
import {
  DetectedExperience,
  MatchedCase,
  ExperiencesAnalysis,
} from './types';
import { getTreatmentApproachesForExperiences } from './treatment-approaches';

/**
 * Detect lived experiences from session moments.
 * In production this would call an LLM. For MVP, uses rule-based detection.
 */
export function detectExperiences(
  moments: Moment[],
  riskFlags: RiskFlag[],
  structureProfile: Record<StructureName, number>
): DetectedExperience[] {
  const experiences: DetectedExperience[] = [];
  const allQuotes = moments.map((m) => m.quote.toLowerCase()).join(' ');

  // Anxiety detection
  if (
    allQuotes.includes('anxi') ||
    allQuotes.includes('worry') ||
    allQuotes.includes('nervous') ||
    allQuotes.includes('panic') ||
    structureProfile[StructureName.BODY] > 0.1
  ) {
    const triggerMoment = moments.find(
      (m) =>
        m.quote.toLowerCase().includes('anxi') ||
        m.quote.toLowerCase().includes('worry') ||
        m.quote.toLowerCase().includes('nervous')
    );
    experiences.push({
      id: 'exp-anxiety-1',
      label: 'Performance Anxiety',
      category: 'anxiety',
      triggerQuote: triggerMoment?.quote || moments[0]?.quote || '',
      confidence: 0.87,
      structures: [StructureName.EMOTION, StructureName.BODY, StructureName.COGNITIVE],
      description:
        'Client exhibits anxiety specifically tied to performance evaluation and fear of judgment. Somatic symptoms (tension, racing heart) co-occur with cognitive distortions around perfectionism.',
      severity: 'moderate',
    });
  }

  // Perfectionism detection
  if (
    allQuotes.includes('perfect') ||
    allQuotes.includes('good enough') ||
    allQuotes.includes('standard') ||
    allQuotes.includes('expect')
  ) {
    const triggerMoment = moments.find(
      (m) =>
        m.quote.toLowerCase().includes('perfect') ||
        m.quote.toLowerCase().includes('good enough')
    );
    experiences.push({
      id: 'exp-perfectionism-1',
      label: 'Perfectionism Loop',
      category: 'cognitive',
      triggerQuote: triggerMoment?.quote || moments[1]?.quote || '',
      confidence: 0.82,
      structures: [StructureName.COGNITIVE, StructureName.NORMATIVE, StructureName.EMOTION],
      description:
        'Recurring pattern of setting unrealistically high standards, followed by self-criticism when they are not met. Creates a reinforcing cycle of anxiety and avoidance.',
      severity: 'moderate',
    });
  }

  // Self-worth / identity issues
  if (
    allQuotes.includes('worth') ||
    allQuotes.includes('failure') ||
    allQuotes.includes('not enough') ||
    allQuotes.includes('identity')
  ) {
    const triggerMoment = moments.find(
      (m) =>
        m.quote.toLowerCase().includes('worth') ||
        m.quote.toLowerCase().includes('failure')
    );
    experiences.push({
      id: 'exp-selfworth-1',
      label: 'Self-Worth Deficit',
      category: 'identity',
      triggerQuote: triggerMoment?.quote || moments[2]?.quote || '',
      confidence: 0.74,
      structures: [StructureName.NARRATIVE, StructureName.REFLECTIVE, StructureName.EMOTION],
      description:
        'Client narrative centers on perceived inadequacy. Identity construction heavily weighted toward achievement, with limited self-compassion or intrinsic valuing.',
      severity: 'moderate',
    });
  }

  // Relationship/social patterns
  if (
    allQuotes.includes('relationship') ||
    allQuotes.includes('partner') ||
    allQuotes.includes('friend') ||
    allQuotes.includes('alone') ||
    structureProfile[StructureName.SOCIAL] > 0.1
  ) {
    const triggerMoment = moments.find(
      (m) =>
        m.quote.toLowerCase().includes('relationship') ||
        m.quote.toLowerCase().includes('alone')
    );
    if (triggerMoment) {
      experiences.push({
        id: 'exp-relational-1',
        label: 'Relational Avoidance',
        category: 'relationship',
        triggerQuote: triggerMoment.quote,
        confidence: 0.69,
        structures: [StructureName.SOCIAL, StructureName.BEHAVIOUR, StructureName.EMOTION],
        description:
          'Client shows pattern of withdrawing from social connections when stressed. May be protective strategy linked to fear of vulnerability or judgment.',
        severity: 'mild',
      });
    }
  }

  // Somatic awareness
  if (
    allQuotes.includes('body') ||
    allQuotes.includes('tension') ||
    allQuotes.includes('sleep') ||
    allQuotes.includes('chest') ||
    allQuotes.includes('stomach')
  ) {
    const triggerMoment = moments.find(
      (m) =>
        m.quote.toLowerCase().includes('tension') ||
        m.quote.toLowerCase().includes('body') ||
        m.quote.toLowerCase().includes('sleep')
    );
    if (triggerMoment) {
      experiences.push({
        id: 'exp-somatic-1',
        label: 'Somatic Stress Response',
        category: 'somatic',
        triggerQuote: triggerMoment.quote,
        confidence: 0.78,
        structures: [StructureName.BODY, StructureName.IMMEDIATE_EXPERIENCE],
        description:
          'Physical manifestations of psychological distress. Client shows awareness of body signals but limited integration with emotional processing.',
        severity: 'mild',
      });
    }
  }

  // Ensure we always have at least 2 experiences for demo
  if (experiences.length === 0) {
    experiences.push(
      {
        id: 'exp-general-1',
        label: 'Emotional Dysregulation',
        category: 'anxiety',
        triggerQuote: moments[0]?.quote || 'No specific quote detected',
        confidence: 0.65,
        structures: [StructureName.EMOTION, StructureName.COGNITIVE],
        description:
          'Client shows difficulty managing emotional responses in stressful situations. Patterns suggest under-developed coping strategies.',
        severity: 'moderate',
      },
      {
        id: 'exp-general-2',
        label: 'Cognitive Rigidity',
        category: 'cognitive',
        triggerQuote: moments[1]?.quote || 'No specific quote detected',
        confidence: 0.58,
        structures: [StructureName.COGNITIVE, StructureName.REFLECTIVE],
        description:
          'Tendency toward black-and-white thinking with limited flexibility in perspective-taking. May benefit from cognitive restructuring approaches.',
        severity: 'mild',
      }
    );
  }

  return experiences;
}

/**
 * Match similar cases from the archive.
 * In production: vector similarity search against case database.
 * For MVP: returns curated mock matches.
 */
export function matchCases(experiences: DetectedExperience[]): MatchedCase[] {
  const categories = experiences.map((e) => e.category);

  const casePool: MatchedCase[] = [
    {
      id: 'case-001',
      patientCode: 'SL-2024-0147',
      matchScore: 89,
      presentingIssues: ['Performance anxiety', 'Perfectionism', 'Work-related stress'],
      interventionsUsed: ['CBT restructuring', 'Behavioral experiments', 'Mindfulness-based stress reduction'],
      outcome: 'significant_improvement',
      sessionCount: 12,
      contextualDifferences: ['Older client (45)', 'Corporate setting vs academic', 'Co-morbid insomnia'],
      quote: 'After the behavioral experiments, I realized my catastrophic predictions almost never came true.',
    },
    {
      id: 'case-002',
      patientCode: 'SL-2024-0203',
      matchScore: 82,
      presentingIssues: ['Self-worth issues', 'Anxiety', 'Relationship difficulties'],
      interventionsUsed: ['Schema therapy', 'Compassion-focused therapy', 'Interpersonal process work'],
      outcome: 'moderate_improvement',
      sessionCount: 18,
      contextualDifferences: ['Childhood trauma history', 'Male client', 'Previous therapy experience'],
      quote: 'Learning to notice my inner critic without believing it changed everything.',
    },
    {
      id: 'case-003',
      patientCode: 'SL-2023-0089',
      matchScore: 76,
      presentingIssues: ['Generalized anxiety', 'Somatic symptoms', 'Avoidance patterns'],
      interventionsUsed: ['ACT', 'Somatic experiencing', 'Graded exposure'],
      outcome: 'significant_improvement',
      sessionCount: 15,
      contextualDifferences: ['Younger client (22)', 'Student context', 'No perfectionism component'],
      quote: 'When I stopped fighting the anxiety and just let it be there, it actually got smaller.',
    },
    {
      id: 'case-004',
      patientCode: 'SL-2024-0312',
      matchScore: 71,
      presentingIssues: ['Identity exploration', 'Perfectionism', 'Social withdrawal'],
      interventionsUsed: ['Narrative therapy', 'Values clarification', 'Social skills building'],
      outcome: 'moderate_improvement',
      sessionCount: 10,
      contextualDifferences: ['Career transition context', 'Strong family support', 'No somatic symptoms'],
      quote: 'I started writing a different story about who I am, not just who I should be.',
    },
    {
      id: 'case-005',
      patientCode: 'SL-2023-0456',
      matchScore: 65,
      presentingIssues: ['Burnout', 'Emotional exhaustion', 'Cognitive rigidity'],
      interventionsUsed: ['Psychoeducation', 'Behavioral activation', 'Cognitive defusion'],
      outcome: 'ongoing',
      sessionCount: 8,
      contextualDifferences: ['Healthcare professional', 'Different anxiety presentation', 'Currently in treatment'],
      quote: 'I never realized how much my thinking patterns were keeping me stuck.',
    },
  ];

  // Sort by relevance to detected experiences
  const scored = casePool.map((c) => {
    let bonus = 0;
    if (categories.includes('anxiety') && c.presentingIssues.some((i) => i.toLowerCase().includes('anxiety'))) bonus += 5;
    if (categories.includes('cognitive') && c.presentingIssues.some((i) => i.toLowerCase().includes('perfectionism'))) bonus += 3;
    if (categories.includes('identity') && c.presentingIssues.some((i) => i.toLowerCase().includes('worth') || i.toLowerCase().includes('identity'))) bonus += 4;
    return { ...c, matchScore: Math.min(95, c.matchScore + bonus) };
  });

  return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 4);
}

/**
 * Build the complete experiences analysis from session data.
 */
export function buildExperiencesAnalysis(
  moments: Moment[],
  riskFlags: RiskFlag[],
  structureProfile: Record<StructureName, number>
): ExperiencesAnalysis {
  const detectedExperiences = detectExperiences(moments, riskFlags, structureProfile);
  const matchedCases = matchCases(detectedExperiences);
  const treatmentApproaches = getTreatmentApproachesForExperiences(detectedExperiences);

  return {
    detectedExperiences,
    matchedCases,
    treatmentApproaches,
    meta: {
      analysisModel: 'SessionLens Phenomenological Engine v3.0 (local)',
      analysisVersion: '3.0.0-mvp',
      generatedAt: new Date().toISOString(),
    },
  };
}
