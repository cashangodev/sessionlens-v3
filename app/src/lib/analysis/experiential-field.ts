/**
 * Experiential Field Analyzer
 * Maps PTS 10-dimension structure coding to the Hypernomic 5-structure experiential field.
 * Based on the Pattern Theory of Self (Gallagher 2013; Daly et al. 2024) mapped to
 * Hypernomic's 2×2 experiential axes (Direct Experience ↔ Interpretation × Inner ↔ Outer).
 */

import { StructureName, ExperientialStructure, ExperientialField, ExperientialFieldScore, Moment } from '@/types';

// Mapping: which PTS structures contribute to which Hypernomic structures
const FIELD_MAPPING: Record<ExperientialStructure, { structures: StructureName[]; weights: number[] }> = {
  [ExperientialStructure.EMBODIED_SELF]: {
    structures: [StructureName.BODY, StructureName.IMMEDIATE_EXPERIENCE, StructureName.EMOTION],
    weights: [0.45, 0.35, 0.20],
  },
  [ExperientialStructure.SENSORY_CONNECTION]: {
    structures: [StructureName.ECOLOGICAL, StructureName.SOCIAL, StructureName.IMMEDIATE_EXPERIENCE],
    weights: [0.40, 0.35, 0.25],
  },
  [ExperientialStructure.NARRATIVE_SELF]: {
    structures: [StructureName.NARRATIVE, StructureName.REFLECTIVE, StructureName.NORMATIVE],
    weights: [0.45, 0.30, 0.25],
  },
  [ExperientialStructure.THOUGHT_MOVEMENTS]: {
    structures: [StructureName.COGNITIVE, StructureName.BEHAVIOUR, StructureName.SOCIAL],
    weights: [0.45, 0.30, 0.25],
  },
  [ExperientialStructure.PHENOMENAL_DISTINCTIONS]: {
    structures: [StructureName.REFLECTIVE, StructureName.IMMEDIATE_EXPERIENCE, StructureName.COGNITIVE],
    weights: [0.40, 0.35, 0.25],
  },
};

const FIELD_LABELS: Record<ExperientialStructure, string> = {
  [ExperientialStructure.EMBODIED_SELF]: 'Embodied Self',
  [ExperientialStructure.SENSORY_CONNECTION]: 'Sensory Connection',
  [ExperientialStructure.NARRATIVE_SELF]: 'Narrative Self',
  [ExperientialStructure.THOUGHT_MOVEMENTS]: 'Thought Movements',
  [ExperientialStructure.PHENOMENAL_DISTINCTIONS]: 'Phenomenal Distinctions',
};

export function computeExperientialField(
  moments: Moment[],
  structureProfile: Record<StructureName, number>
): ExperientialField {
  const scores: ExperientialFieldScore[] = [];

  for (const [fieldKey, mapping] of Object.entries(FIELD_MAPPING)) {
    const field = fieldKey as ExperientialStructure;
    let intensity = 0;
    let clarity = 0;

    mapping.structures.forEach((struct, i) => {
      const profileVal = structureProfile[struct] || 0;
      intensity += profileVal * mapping.weights[i];
    });

    // Clarity: based on how many moments have MULTIPLE structures co-occurring
    // High co-occurrence = high clarity (person can distinguish multiple layers simultaneously)
    const relevantMoments = moments.filter(m =>
      m.structures.some(s => mapping.structures.includes(s))
    );
    const multiDimMoments = relevantMoments.filter(m => m.structures.length >= 2);
    clarity = relevantMoments.length > 0
      ? multiDimMoments.length / relevantMoments.length
      : 0;

    // Generate description based on dominant contributing structures
    const topContributors = mapping.structures
      .map((s, i) => ({ name: s, contribution: (structureProfile[s] || 0) * mapping.weights[i] }))
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 2);

    const description = topContributors.length > 0
      ? `Driven primarily by ${topContributors.map(c => c.name).join(' and ')} dimensions`
      : 'Minimal presence in this session';

    scores.push({ structure: field, intensity: Math.min(intensity, 1), clarity: Math.min(clarity, 1), description });
  }

  const embodied = scores.find(s => s.structure === ExperientialStructure.EMBODIED_SELF)!;
  const sensory = scores.find(s => s.structure === ExperientialStructure.SENSORY_CONNECTION)!;
  const narrativeSelf = scores.find(s => s.structure === ExperientialStructure.NARRATIVE_SELF)!;
  const thoughts = scores.find(s => s.structure === ExperientialStructure.THOUGHT_MOVEMENTS)!;
  const phenomenal = scores.find(s => s.structure === ExperientialStructure.PHENOMENAL_DISTINCTIONS)!;

  const fieldBalance = {
    directExperience: (embodied.intensity + sensory.intensity) / 2,
    interpretation: (narrativeSelf.intensity + thoughts.intensity) / 2,
    innerWorld: (embodied.intensity + narrativeSelf.intensity) / 2,
    outerWorld: (sensory.intensity + thoughts.intensity) / 2,
  };

  // Determine dominant quadrant
  const quadrants = [
    { key: 'inner-direct' as const, val: embodied.intensity },
    { key: 'outer-direct' as const, val: sensory.intensity },
    { key: 'inner-interpretive' as const, val: narrativeSelf.intensity },
    { key: 'outer-interpretive' as const, val: thoughts.intensity },
  ];
  const dominantQuadrant = quadrants.sort((a, b) => b.val - a.val)[0].key;

  return {
    scores,
    fieldBalance,
    phenomenalClarity: phenomenal.intensity,
    dominantQuadrant,
  };
}
