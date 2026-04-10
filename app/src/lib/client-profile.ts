import { AnalysisResult, StructureName } from '@/types';

// ============ CLIENT PROFILE TYPES ============

export type ClientGender = 'male' | 'female' | 'other' | '';
export type ClientAgeRange = '' | 'child' | 'adolescent' | 'young-adult' | 'adult' | 'middle-aged' | 'senior';

export interface ClientProfile {
  clientCode: string;
  /** Client gender (optional) */
  gender: ClientGender;
  /** Client age range (optional) */
  ageRange: ClientAgeRange;
  /** Auto-extracted, doctor-confirmed */
  treatmentGoals: string[];
  /** Auto-extracted presenting concerns */
  presentingConcerns: string[];
  /** Auto-detected primary diagnosis considerations (NOT diagnoses) */
  diagnosticConsiderations: string[];
  /** Risk level from most recent session */
  currentRiskLevel: 'high' | 'moderate' | 'low';
  /** Auto-detected key themes across sessions */
  keyThemes: string[];
  /** Dominant phenomenological structures */
  dominantStructures: StructureName[];
  /** Preferred therapeutic approach (doctor-selected or AI-suggested) */
  preferredApproach: string;
  /** Free-text clinical notes from doctor */
  clinicalNotes: string;
  /** Session count */
  totalSessions: number;
  /** When profile was first created */
  createdAt: string;
  /** When doctor last confirmed/edited */
  lastConfirmedAt: string | null;
  /** Whether doctor has reviewed and confirmed this profile */
  isConfirmed: boolean;
}

// ============ IN-MEMORY STORE ============

const profileStore = new Map<string, ClientProfile>();

export function getClientProfile(clientCode: string): ClientProfile | null {
  return profileStore.get(clientCode.toLowerCase()) || null;
}

export function storeClientProfile(profile: ClientProfile): void {
  profileStore.set(profile.clientCode.toLowerCase(), profile);
}

export function listClientProfiles(): ClientProfile[] {
  return Array.from(profileStore.values());
}

/** Create a new blank client (no sessions yet). */
export function createBlankClient(
  clientCode: string,
  gender: ClientGender = '',
  ageRange: ClientAgeRange = '',
  clinicalNotes: string = ''
): ClientProfile {
  const profile: ClientProfile = {
    clientCode,
    gender,
    ageRange,
    treatmentGoals: [],
    presentingConcerns: [],
    diagnosticConsiderations: [],
    currentRiskLevel: 'low',
    keyThemes: [],
    dominantStructures: [],
    preferredApproach: '',
    clinicalNotes,
    totalSessions: 0,
    createdAt: new Date().toISOString(),
    lastConfirmedAt: null,
    isConfirmed: false,
  };
  storeClientProfile(profile);
  return profile;
}

/** Generate a unique client code like CL-XXXX */
export function generateClientCode(): string {
  const num = Math.floor(Math.random() * 9000) + 1000;
  const code = `CL-${num}`;
  // If collision, try again
  if (getClientProfile(code)) return generateClientCode();
  return code;
}

// ============ PROFILE EXTRACTION FROM ANALYSIS ============

/**
 * Extract a client profile from the first session analysis.
 * In production this would use an LLM. For MVP, uses rule-based extraction.
 */
export function extractProfileFromAnalysis(
  clientCode: string,
  transcript: string,
  analysisResult: AnalysisResult,
  manualTreatmentGoals?: string
): ClientProfile {
  const existing = getClientProfile(clientCode);
  const allText = transcript.toLowerCase();

  // Extract presenting concerns from moments and risk flags
  const concerns: string[] = [];
  const themes: string[] = [];

  // Detect concerns from transcript content
  const concernDetectors: { keywords: string[]; concern: string }[] = [
    { keywords: ['anxi', 'worry', 'nervous', 'panic', 'fear'], concern: 'Anxiety symptoms' },
    { keywords: ['depress', 'sad', 'hopeless', 'empty', 'numb'], concern: 'Depressive symptoms' },
    { keywords: ['sleep', 'insomnia', 'nightmare', 'tired'], concern: 'Sleep disturbance' },
    { keywords: ['work', 'job', 'career', 'boss', 'fired', 'burnout'], concern: 'Work-related stress' },
    { keywords: ['relationship', 'partner', 'marriage', 'divorce', 'breakup'], concern: 'Relationship difficulties' },
    { keywords: ['trauma', 'abuse', 'accident', 'ptsd', 'flashback'], concern: 'Trauma history' },
    { keywords: ['anger', 'rage', 'frustrat', 'irritab'], concern: 'Anger management' },
    { keywords: ['self-harm', 'cutting', 'hurt myself'], concern: 'Self-harm behaviors' },
    { keywords: ['suicid', 'kill myself', 'end it', 'not worth living'], concern: 'Suicidal ideation' },
    { keywords: ['substance', 'alcohol', 'drug', 'drinking', 'smoking'], concern: 'Substance use' },
    { keywords: ['eating', 'weight', 'binge', 'purge', 'starv'], concern: 'Eating concerns' },
    { keywords: ['perfect', 'standard', 'good enough', 'failure'], concern: 'Perfectionism' },
    { keywords: ['confidence', 'self-esteem', 'worth', 'inadequa'], concern: 'Low self-worth' },
    { keywords: ['social', 'isolat', 'alone', 'lonely', 'withdraw'], concern: 'Social withdrawal' },
    { keywords: ['grief', 'loss', 'death', 'mourn', 'bereav'], concern: 'Grief/loss' },
    { keywords: ['child', 'parent', 'mother', 'father', 'family'], concern: 'Family dynamics' },
    { keywords: ['body', 'pain', 'tension', 'headache', 'stomach'], concern: 'Somatic complaints' },
    { keywords: ['focus', 'concentrat', 'attention', 'distract', 'adhd'], concern: 'Attention/concentration' },
    { keywords: ['cope', 'overwhelm', 'manage', 'stress'], concern: 'Stress management' },
  ];

  concernDetectors.forEach(({ keywords, concern }) => {
    const matchCount = keywords.reduce(
      (sum, kw) => sum + (allText.split(kw).length - 1),
      0
    );
    if (matchCount > 0) {
      concerns.push(concern);
      if (matchCount >= 2) themes.push(concern);
    }
  });

  // Extract treatment goals from transcript
  const extractedGoals: string[] = [];

  // Parse manual goals if provided
  if (manualTreatmentGoals?.trim()) {
    manualTreatmentGoals.split(',').forEach((g) => {
      const trimmed = g.trim();
      if (trimmed) extractedGoals.push(trimmed);
    });
  }

  // Auto-generate goals from detected concerns
  const goalMap: Record<string, string> = {
    'Anxiety symptoms': 'Reduce anxiety symptoms and develop coping strategies',
    'Depressive symptoms': 'Alleviate depressive symptoms and improve daily functioning',
    'Sleep disturbance': 'Improve sleep quality and establish healthy sleep patterns',
    'Work-related stress': 'Develop workplace stress management strategies',
    'Relationship difficulties': 'Improve relationship communication and satisfaction',
    'Perfectionism': 'Challenge perfectionist thinking and develop self-compassion',
    'Low self-worth': 'Build self-esteem and positive self-concept',
    'Social withdrawal': 'Increase social engagement and build support network',
    'Stress management': 'Develop effective stress management toolkit',
    'Somatic complaints': 'Address mind-body connection and reduce somatic symptoms',
    'Anger management': 'Develop healthy anger expression and regulation skills',
    'Trauma history': 'Process traumatic experiences in a safe therapeutic environment',
    'Grief/loss': 'Process grief and adjust to loss',
  };

  concerns.forEach((concern) => {
    const goal = goalMap[concern];
    if (goal && !extractedGoals.includes(goal)) {
      extractedGoals.push(goal);
    }
  });

  // Limit to top 5 most relevant goals
  const topGoals = extractedGoals.slice(0, 5);

  // Get dominant structures
  const sortedStructures = Object.entries(analysisResult.structureProfile)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([name]) => name as StructureName);

  // Suggest diagnostic considerations
  const diagnosticConsiderations: string[] = [];
  if (concerns.includes('Anxiety symptoms')) {
    diagnosticConsiderations.push('Generalized Anxiety Disorder (F41.1) — to evaluate');
  }
  if (concerns.includes('Depressive symptoms')) {
    diagnosticConsiderations.push('Major Depressive Disorder (F32) — to evaluate');
  }
  if (concerns.includes('Trauma history')) {
    diagnosticConsiderations.push('Post-Traumatic Stress Disorder (F43.1) — to evaluate');
  }
  if (concerns.includes('Perfectionism') || concerns.includes('Low self-worth')) {
    diagnosticConsiderations.push('Adjustment Disorder (F43.2) — to consider');
  }
  if (diagnosticConsiderations.length === 0) {
    diagnosticConsiderations.push('No specific diagnostic indicators detected — further assessment recommended');
  }

  // Suggest approach based on concerns
  let preferredApproach = 'Integrative approach — to be determined';
  if (concerns.includes('Anxiety symptoms') || concerns.includes('Perfectionism')) {
    preferredApproach = 'Cognitive Behavioral Therapy (CBT)';
  } else if (concerns.includes('Trauma history')) {
    preferredApproach = 'Trauma-focused therapy (EMDR/CPT)';
  } else if (concerns.includes('Relationship difficulties')) {
    preferredApproach = 'Interpersonal Therapy (IPT)';
  } else if (concerns.includes('Low self-worth')) {
    preferredApproach = 'Compassion-Focused Therapy (CFT)';
  }

  // Merge with existing profile if available
  if (existing) {
    return {
      ...existing,
      presentingConcerns: Array.from(new Set([...existing.presentingConcerns, ...concerns])),
      keyThemes: Array.from(new Set([...existing.keyThemes, ...themes])),
      dominantStructures: sortedStructures,
      currentRiskLevel: analysisResult.quickInsight.riskLevel,
      totalSessions: existing.totalSessions + 1,
      // Don't overwrite confirmed goals
      treatmentGoals: existing.isConfirmed ? existing.treatmentGoals : topGoals,
      diagnosticConsiderations: existing.isConfirmed
        ? existing.diagnosticConsiderations
        : Array.from(new Set([...existing.diagnosticConsiderations, ...diagnosticConsiderations])),
    };
  }

  return {
    clientCode,
    gender: '' as ClientGender,
    ageRange: '' as ClientAgeRange,
    treatmentGoals: topGoals,
    presentingConcerns: concerns.slice(0, 8),
    diagnosticConsiderations,
    currentRiskLevel: analysisResult.quickInsight.riskLevel,
    keyThemes: themes.slice(0, 6),
    dominantStructures: sortedStructures,
    preferredApproach,
    clinicalNotes: '',
    totalSessions: 1,
    createdAt: new Date().toISOString(),
    lastConfirmedAt: null,
    isConfirmed: false,
  };
}
