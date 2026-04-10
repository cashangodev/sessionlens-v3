// ============ ENUMS ============

export enum StructureName {
  BODY = 'body',
  IMMEDIATE_EXPERIENCE = 'immediate_experience',
  EMOTION = 'emotion',
  BEHAVIOUR = 'behaviour',
  SOCIAL = 'social',
  COGNITIVE = 'cognitive',
  REFLECTIVE = 'reflective',
  NARRATIVE = 'narrative',
  ECOLOGICAL = 'ecological',
  NORMATIVE = 'normative'
}

export enum EmotionalValence {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
  MIXED = 'mixed'
}

export enum RiskSeverity {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum TherapistMoveType {
  EMPATHIC_ATTUNEMENT = 'empathic_attunement',
  CHALLENGE = 'challenge',
  INTERPRETATION = 'interpretation',
  SILENCE = 'silence',
  REFLECTION = 'reflection'
}

export enum SessionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  ANALYZED = 'analyzed',
  ERROR = 'error'
}

// ============ CORE TYPES ============

export interface Structure {
  name: StructureName;
  label: string;
  description: string;
  color: string;
  icon: string;
}

export interface Moment {
  id: number;
  timestamp: string;
  quote: string;
  context: string;
  type: 'immediate_experience' | 'recalled_past' | 'future_oriented' | 'reflective';
  valence: EmotionalValence;
  intensity: number;
  structures: StructureName[];
  therapistMove: TherapistMoveType;
  therapistQuote: string;
}

export interface RiskFlag {
  id: number;
  severity: RiskSeverity;
  signal: string;
  detail: string;
  algorithmMatch: string;
  recommendation: string;
  interventionType: string;
}

export interface PractitionerMatch {
  id: number;
  code: string;
  name: string;
  specialty: string;
  matchScore: number;
  methodology: string;
  interventionSequence: string[];
  outcomePatterns: { metric: string; change: string; confidence: number }[];
  matchReasoning: string;
  targetStructures: StructureName[];
}

export interface SimilarCase {
  id: number;
  patientCode: string;
  matchScore: number;
  presentingConcerns: string[];
  dominantStructures: StructureName[];
  sessionCount: number;
  keyThemes: string[];
  outcome: string;
  outcomeDetail: string;
  representativeQuote: string;
}

export interface QuickInsight {
  riskLevel: 'high' | 'moderate' | 'low';
  clinicalPriority: string;
  prognosis: string;
  topRecommendation: string;
  sessionNumber: number;
}

export interface SessionHistoryPoint {
  session: number;
  emotionalIntensity: number;
  reflectiveCapacity: number;
  emotionalRegulation: number;
  therapeuticAlliance: number;
}

export interface TherapistMoveDistribution {
  type: TherapistMoveType;
  count: number;
  percentage: number;
}

export interface CognitiveDistortion {
  type: string;
  confidence: number;
  evidence: string;
  alternativeThought: string;
  momentIndex: number;
}

export interface CBTAnalysisResult {
  distortions: CognitiveDistortion[];
  overallDistortionLoad: number;
  treatmentReadiness: number;
  dominantPatterns: string[];
  automaticThoughts: {
    content: string;
    beliefStrength: number;
    supportsWellbeing: boolean;
  }[];
  behavioralPatterns: string[];
}

export interface AnalysisResult {
  quickInsight: QuickInsight;
  moments: Moment[];
  riskFlags: RiskFlag[];
  practitionerMatches: PractitionerMatch[];
  similarCases: SimilarCase[];
  structureProfile: Record<StructureName, number>;
  sessionHistory: SessionHistoryPoint[];
  therapistMoves: TherapistMoveDistribution[];
  clinicianReport: string;
  patientReport: string;
  cbtAnalysis?: CBTAnalysisResult;
}

export interface SessionInput {
  transcript: string;
  treatmentGoals: string;
  sessionNumber: number;
  clientId?: string;
}

// ============ DATABASE TYPES ============

export interface DbTherapist {
  id: string;
  clerk_id: string;
  email: string;
  name: string;
  practice_name: string | null;
  created_at: string;
}

export interface DbClient {
  id: string;
  therapist_id: string;
  client_code: string;
  presenting_concerns: string[];
  notes: string | null;
  created_at: string;
}

export interface DbSession {
  id: string;
  client_id: string;
  therapist_id: string;
  session_number: number;
  transcript: string;
  treatment_goals: string;
  status: SessionStatus;
  analysis_result: AnalysisResult | null;
  created_at: string;
  analyzed_at: string | null;
}

export interface DbPractitionerMethod {
  id: string;
  code: string;
  name: string;
  specialty: string;
  methodology: string;
  intervention_sequence: string[];
  outcome_patterns: { metric: string; change: string; confidence: number }[];
  target_structures: StructureName[];
}

export interface DbSimilarCase {
  id: string;
  patient_code: string;
  presenting_concerns: string[];
  dominant_structures: StructureName[];
  structure_profile: Record<StructureName, number>;
  session_count: number;
  key_themes: string[];
  outcome: string;
  outcome_detail: string;
  representative_quote: string;
}

export type AnalysisTab = 'overview' | 'experiences' | 'analysis' | 'progress';

// ============ SESSION OVERVIEW TYPES ============

export interface OutcomeMeasure {
  name: string;
  abbreviation: string;
  score: number | null;
  previousScore: number | null;
  maxScore: number;
  severity: string;
  change: 'improved' | 'worsened' | 'stable' | 'new';
}

export interface ExtractedTopic {
  id: string;
  label: string;
  /** AI confidence 0-1 */
  confidence: number;
  /** Number of times referenced in session */
  mentions: number;
}

export interface ClinicalFlag {
  id: string;
  type: 'risk' | 'protective' | 'notable';
  label: string;
  /** EXACT quote from transcript */
  transcriptQuote: string;
  /** Timestamp or location in transcript */
  location: string;
  severity: RiskSeverity;
  /** AI confidence 0-1 */
  confidence: number;
}

export interface RecommendedNextStep {
  id: string;
  category: 'immediate' | 'next_session' | 'ongoing';
  description: string;
  rationale: string;
  confidence: number;
}

// ============ SESSION ANALYSIS TYPES ============

export interface DiagnosticConsideration {
  id: string;
  code: string;
  name: string;
  /** Indicators observed */
  indicators: string[];
  /** Confidence 0-1 */
  confidence: number;
  /** "rule_in" | "rule_out" | "monitor" */
  status: 'rule_in' | 'rule_out' | 'monitor';
}

export interface TreatmentOption {
  id: string;
  name: string;
  description: string;
  evidenceBase: string;
  suitability: 'high' | 'moderate' | 'low';
  rationale: string;
}

export interface RiskSafetyItem {
  id: string;
  label: string;
  status: 'addressed' | 'needs_attention' | 'not_applicable';
  notes: string;
  /** Whether therapist has checked this off */
  therapistConfirmed: boolean;
}

// ============ CLIENT PROGRESS TYPES ============

export interface SessionTimelineEntry {
  sessionNumber: number;
  date: string;
  mainTopics: string[];
  riskLevel: 'high' | 'moderate' | 'low';
  keyInsight: string;
}

export interface TopicEvolution {
  topic: string;
  /** Session numbers where this topic appeared */
  sessions: number[];
  /** Trend: is the topic increasing, decreasing, or stable */
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface TreatmentPlanItem {
  id: string;
  goal: string;
  status: 'not_started' | 'in_progress' | 'achieved';
  progressPercent: number;
  lastUpdatedSession: number;
  notes: string;
}
