import { Structure, StructureName } from '@/types';

export const STRUCTURES: Structure[] = [
  { name: StructureName.BODY, label: 'Body', description: 'Somatic awareness, physical sensations, bodily states', color: '#F97316', icon: 'Heart' },
  { name: StructureName.IMMEDIATE_EXPERIENCE, label: 'Immediate Experience', description: 'Prereflective, unreflected sensation, raw present-moment experience', color: '#EAB308', icon: 'Zap' },
  { name: StructureName.EMOTION, label: 'Emotion', description: 'Affective states, feelings, emotional responses', color: '#EC4899', icon: 'Heart' },
  { name: StructureName.BEHAVIOUR, label: 'Behaviour', description: 'Observable actions, behavioral patterns, habits', color: '#8B5CF6', icon: 'Activity' },
  { name: StructureName.SOCIAL, label: 'Social', description: 'Relational dynamics, interpersonal patterns, connections', color: '#06B6D4', icon: 'Users' },
  { name: StructureName.COGNITIVE, label: 'Cognitive', description: 'Thought patterns, beliefs, cognitive schemas', color: '#4F46E5', icon: 'Brain' },
  { name: StructureName.REFLECTIVE, label: 'Reflective', description: 'Metacognitive awareness, insight, self-observation', color: '#10B981', icon: 'Eye' },
  { name: StructureName.NARRATIVE, label: 'Narrative', description: 'Story coherence, identity construction, meaning-making', color: '#7C3AED', icon: 'BookOpen' },
  { name: StructureName.ECOLOGICAL, label: 'Ecological', description: 'Environmental factors, cultural context, systemic influences', color: '#8D5D8D', icon: 'Globe' },
  { name: StructureName.NORMATIVE, label: 'Normative', description: 'Values, moral frameworks, ethical standards, expectations', color: '#B91C8C', icon: 'Scale' },
];

export function getStructure(name: StructureName): Structure {
  return STRUCTURES.find(s => s.name === name)!;
}

export function getStructureColor(name: StructureName): string {
  return getStructure(name).color;
}
