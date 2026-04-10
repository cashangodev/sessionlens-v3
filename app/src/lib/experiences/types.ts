import { StructureName } from '@/types';

// ============ LIVED EXPERIENCES DATA LAYER ============

/** A clinical situation detected in the session transcript */
export interface DetectedExperience {
  id: string;
  /** Short label e.g. "Performance Anxiety", "Perfectionism Loop" */
  label: string;
  /** Category of experience */
  category: ExperienceCategory;
  /** Exact quote from transcript that triggered detection */
  triggerQuote: string;
  /** AI confidence in detection (0-1) */
  confidence: number;
  /** Which phenomenological structures are involved */
  structures: StructureName[];
  /** Brief clinical description */
  description: string;
  /** Severity/impact level */
  severity: 'mild' | 'moderate' | 'severe';
}

export type ExperienceCategory =
  | 'anxiety'
  | 'depression'
  | 'trauma'
  | 'relationship'
  | 'identity'
  | 'behavioral'
  | 'cognitive'
  | 'somatic'
  | 'existential';

/** A matched similar case from the archive */
export interface MatchedCase {
  id: string;
  patientCode: string;
  /** How similar this case is (0-100) */
  matchScore: number;
  /** What the patient presented with */
  presentingIssues: string[];
  /** What interventions were used */
  interventionsUsed: string[];
  /** Outcome of treatment */
  outcome: CaseOutcome;
  /** Number of sessions in treatment */
  sessionCount: number;
  /** Key contextual differences from current case */
  contextualDifferences: string[];
  /** Representative quote from that case */
  quote: string;
}

export type CaseOutcome = 'significant_improvement' | 'moderate_improvement' | 'minimal_change' | 'ongoing';

/** A treatment approach with evidence */
export interface TreatmentApproach {
  id: string;
  /** e.g. "CBT for Performance Anxiety" */
  name: string;
  /** e.g. "Cognitive Behavioral Therapy" */
  methodology: string;
  /** What percentage of practitioners use this for similar cases */
  usagePercentage: number;
  /** Evidence level */
  evidenceLevel: 'strong' | 'moderate' | 'emerging';
  /** Typical outcomes */
  typicalOutcomes: string[];
  /** Key intervention steps */
  interventionSteps: string[];
  /** Which detected experiences this addresses */
  targetExperienceIds: string[];
  /** Confidence in recommendation (0-1) */
  confidence: number;
}

/** Full experiences analysis result */
export interface ExperiencesAnalysis {
  detectedExperiences: DetectedExperience[];
  matchedCases: MatchedCase[];
  treatmentApproaches: TreatmentApproach[];
  /** AI analysis metadata */
  meta: {
    analysisModel: string;
    analysisVersion: string;
    generatedAt: string;
  };
}
