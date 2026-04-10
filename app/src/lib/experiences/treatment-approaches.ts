import { DetectedExperience, TreatmentApproach } from './types';

/**
 * Get treatment approaches matched to detected experiences.
 * In production: retrieved from evidence-based treatment database.
 * For MVP: curated mock data with realistic percentages.
 */
export function getTreatmentApproachesForExperiences(
  experiences: DetectedExperience[]
): TreatmentApproach[] {
  const categories = experiences.map((e) => e.category);
  const experienceIds = experiences.map((e) => e.id);
  const approaches: TreatmentApproach[] = [];

  // CBT for anxiety/cognitive
  if (categories.includes('anxiety') || categories.includes('cognitive')) {
    approaches.push({
      id: 'approach-cbt-anxiety',
      name: 'CBT for Performance Anxiety',
      methodology: 'Cognitive Behavioral Therapy',
      usagePercentage: 72,
      evidenceLevel: 'strong',
      typicalOutcomes: [
        '68% show significant symptom reduction within 12 sessions',
        'PHQ-9 scores improve by average 6.2 points',
        'Maintained improvement at 6-month follow-up in 74% of cases',
      ],
      interventionSteps: [
        'Psychoeducation on anxiety-performance cycle',
        'Thought record and cognitive restructuring',
        'Behavioral experiments with graded exposure',
        'Develop personalized coping toolkit',
        'Relapse prevention planning',
      ],
      targetExperienceIds: experienceIds.filter((id) =>
        experiences.find((e) => e.id === id && (e.category === 'anxiety' || e.category === 'cognitive'))
      ),
      confidence: 0.85,
    });
  }

  // ACT for perfectionism/identity
  if (categories.includes('cognitive') || categories.includes('identity')) {
    approaches.push({
      id: 'approach-act',
      name: 'ACT for Perfectionism & Self-Worth',
      methodology: 'Acceptance and Commitment Therapy',
      usagePercentage: 48,
      evidenceLevel: 'strong',
      typicalOutcomes: [
        '61% report improved psychological flexibility',
        'Values-aligned behavior increases by average 40%',
        'Self-compassion measures improve significantly',
      ],
      interventionSteps: [
        'Cognitive defusion from perfectionist thoughts',
        'Values clarification exercises',
        'Committed action toward values (not standards)',
        'Self-as-context work to broaden identity',
        'Mindfulness of inner critic without engagement',
      ],
      targetExperienceIds: experienceIds.filter((id) =>
        experiences.find((e) => e.id === id && (e.category === 'cognitive' || e.category === 'identity'))
      ),
      confidence: 0.79,
    });
  }

  // CFT for self-worth
  if (categories.includes('identity') || categories.includes('anxiety')) {
    approaches.push({
      id: 'approach-cft',
      name: 'Compassion-Focused Therapy',
      methodology: 'Compassion-Focused Therapy (CFT)',
      usagePercentage: 34,
      evidenceLevel: 'moderate',
      typicalOutcomes: [
        'Self-criticism scores decrease by average 45%',
        'Self-compassion measures show significant improvement',
        'Reduced shame and increased emotional resilience',
      ],
      interventionSteps: [
        'Psychoeducation on threat/drive/soothing systems',
        'Compassionate imagery and letter writing',
        'Compassionate mind training',
        'Challenging self-critical internal dialogue',
        'Building compassionate self-identity',
      ],
      targetExperienceIds: experienceIds.filter((id) =>
        experiences.find((e) => e.id === id && (e.category === 'identity'))
      ),
      confidence: 0.72,
    });
  }

  // Somatic/body-focused
  if (categories.includes('somatic')) {
    approaches.push({
      id: 'approach-somatic',
      name: 'Somatic Experiencing',
      methodology: 'Body-Oriented Psychotherapy',
      usagePercentage: 28,
      evidenceLevel: 'moderate',
      typicalOutcomes: [
        'Somatic symptom severity reduces by 52% average',
        'Improved interoceptive awareness',
        'Better stress response regulation',
      ],
      interventionSteps: [
        'Body scan and sensation tracking',
        'Pendulation between activation and calm',
        'Grounding and containment exercises',
        'Integration of somatic and emotional experience',
        'Building body-based coping resources',
      ],
      targetExperienceIds: experienceIds.filter((id) =>
        experiences.find((e) => e.id === id && e.category === 'somatic')
      ),
      confidence: 0.68,
    });
  }

  // Relational/interpersonal
  if (categories.includes('relationship')) {
    approaches.push({
      id: 'approach-ipt',
      name: 'Interpersonal Process Therapy',
      methodology: 'Interpersonal Therapy (IPT)',
      usagePercentage: 31,
      evidenceLevel: 'strong',
      typicalOutcomes: [
        'Improved relationship satisfaction scores',
        'Reduced social avoidance behaviors',
        'Enhanced communication skills',
      ],
      interventionSteps: [
        'Interpersonal inventory and role analysis',
        'Communication analysis and skills building',
        'In-session relational process exploration',
        'Transfer of learning to external relationships',
        'Consolidation and termination planning',
      ],
      targetExperienceIds: experienceIds.filter((id) =>
        experiences.find((e) => e.id === id && e.category === 'relationship')
      ),
      confidence: 0.65,
    });
  }

  // MBSR as supplement
  if (experiences.length > 0) {
    approaches.push({
      id: 'approach-mbsr',
      name: 'Mindfulness-Based Stress Reduction',
      methodology: 'Mindfulness-Based Interventions',
      usagePercentage: 56,
      evidenceLevel: 'strong',
      typicalOutcomes: [
        'Stress reduction in 78% of participants',
        'Improved emotion regulation capacity',
        'GAD-7 scores decrease by average 4.3 points',
      ],
      interventionSteps: [
        'Introduce mindful awareness practices',
        'Body scan meditation',
        'Mindful movement and yoga',
        'Sitting meditation with increasing duration',
        'Integration into daily routine',
      ],
      targetExperienceIds: experienceIds.slice(0, 2),
      confidence: 0.74,
    });
  }

  return approaches.sort((a, b) => b.usagePercentage - a.usagePercentage);
}
