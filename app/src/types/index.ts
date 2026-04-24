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
  matchExplanation?: string;
}

export interface VectorInsight {
  id: number;
  type: 'trajectory' | 'outcome_prediction' | 'method_alignment';
  title: string;
  description: string;
  confidence: number;
  supportingMetric?: string;
  icon: 'trending' | 'target' | 'link';
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
  vectorInsights?: VectorInsight[];
  experientialField?: ExperientialField;
  momentConfidence?: MomentConfidence[];
  coOccurrenceNetwork?: CoOccurrenceNetwork;
  narrativeArc?: NarrativeArc;
  analysisStatus: 'complete' | 'partial' | 'mock';
  analysisWarnings: string[];
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
  /** Verbatim quote that triggered this topic */
  triggerQuote?: string;
  /** Who said it: 'client' or 'therapist' */
  speaker?: 'client' | 'therapist';
  /** Phenomenological structure dimension */
  structureDimension?: string;
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
  source: 'risk_flag' | 'practitioner_match' | 'session_data' | 'cbt_analysis' | 'structure_profile';
  sourceDetail: string; // e.g. "Risk flag: suicidal ideation" or "Practitioner: Trauma-Focused CBT (72% match)"
  momentRef?: { quote: string; intensity: number }; // optional link to a specific session moment
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
}

// ============ HYPERNOMIC EXPERIENTIAL FIELD ============

export enum ExperientialStructure {
  EMBODIED_SELF = 'embodied_self',         // Inner + Direct Experience
  SENSORY_CONNECTION = 'sensory_connection', // Outer + Direct Experience
  NARRATIVE_SELF = 'narrative_self',         // Inner + Interpretation
  THOUGHT_MOVEMENTS = 'thought_movements',   // Outer + Interpretation
  PHENOMENAL_DISTINCTIONS = 'phenomenal_distinctions' // Clarity/Differentiation
}

export interface ExperientialFieldScore {
  structure: ExperientialStructure;
  intensity: number;     // 0-1
  clarity: number;       // 0-1: how clearly the person distinguished this
  description: string;   // Brief clinical note
}

export interface ExperientialField {
  scores: ExperientialFieldScore[];
  fieldBalance: {
    directExperience: number;  // 0-1 (average of embodied_self + sensory_connection)
    interpretation: number;     // 0-1 (average of narrative_self + thought_movements)
    innerWorld: number;         // 0-1 (average of embodied_self + narrative_self)
    outerWorld: number;         // 0-1 (average of sensory_connection + thought_movements)
  };
  phenomenalClarity: number;  // 0-1: overall differentiation quality
  dominantQuadrant: 'inner-direct' | 'outer-direct' | 'inner-interpretive' | 'outer-interpretive';
}

// ============ CONFIDENCE SCORING ============

export interface MomentConfidence {
  momentId: number;
  spontaneity: number;        // 0-1: Did the client bring this up unprompted?
  concreteDetail: number;     // 0-1: Specific examples vs. vague abstraction
  contextualRichness: number; // 0-1: Setting, people, timeframe present?
  narrativeCoherence: number; // 0-1: Fits with the rest of the story?
  overallConfidence: number;  // 0-1: Weighted average
  therapistInfluence: boolean; // Was this prompted by a leading question?
  influenceNote?: string;     // e.g., "Therapist asked directly about sleep"
}

// ============ CO-OCCURRENCE NETWORK ============

export interface CoOccurrenceEdge {
  source: StructureName;
  target: StructureName;
  weight: number;          // 0-1: strength of co-occurrence
  momentCount: number;     // How many moments these co-occurred in
}

export interface NetworkNode {
  structure: StructureName;
  centrality: number;      // 0-1: how connected this dimension is
  frequency: number;       // How often it appears across moments
  isBridge: boolean;       // Does it connect otherwise separate clusters?
}

export interface CoOccurrenceNetwork {
  nodes: NetworkNode[];
  edges: CoOccurrenceEdge[];
  communities: {
    id: number;
    label: string;
    members: StructureName[];
    description: string;
  }[];
  mostCentral: StructureName;
  bridgeDimension: StructureName | null;
}

// ============ NARRATIVE ARC / STORY MAPPING ============

export interface NarrativeTurningPoint {
  momentId: number;
  type: 'onset' | 'escalation' | 'crisis' | 'insight' | 'shift' | 'resolution';
  description: string;
  structuresBefore: StructureName[];
  structuresAfter: StructureName[];
  emotionalShift: { from: string; to: string };
}

export interface NarrativePhase {
  label: string;
  startMomentId: number;
  endMomentId: number;
  dominantStructures: StructureName[];
  dominantValence: EmotionalValence;
  description: string;
}

export interface NarrativeArc {
  phases: NarrativePhase[];
  turningPoints: NarrativeTurningPoint[];
  overallTrajectory: 'deteriorating' | 'stable' | 'improving' | 'oscillating' | 'emerging';
  gestaltSummary: string;  // 1-2 sentence phenomenological summary of the whole arc
}
