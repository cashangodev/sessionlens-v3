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

/**
 * A single moment from a lived-experience story that the person describes
 * as a turning point — something they noticed, named, started, or that
 * shifted for them. Surfaced in the "What helped this person" panel.
 *
 * These are NOT clinician annotations — they are the participant's own
 * words about what helped, drawn from their coded moments by valence +
 * structure + turning-point keyword filters.
 */
export interface HelpfulMoment {
  /** Verbatim quote from the participant's own account. */
  quote: string;
  /** Optional timestamp in the source recording. */
  timestamp?: string;
  /** Reference to the source moment record. */
  momentId?: string | number;
  /** PTS structures activated in this moment — lets the clinician map intervention type. */
  structures: StructureName[];
}

/**
 * Compact representation of how a story's experience-pattern reorganized
 * over the arc of the participant's narrative. Computed by splitting the
 * story's coded moments into early/late halves by timestamp and reporting
 * the dominant structures in each half.
 *
 * Stated as DATA, not as prescription. The clinician decides whether the
 * shift is meaningful for their client.
 */
export interface StoryJourney {
  /** Top 1–3 dominant structures in the story's earliest moments. */
  early: StructureName[];
  /** Top 1–3 dominant structures in the story's latest moments. */
  late: StructureName[];
  /** Total coded moment count for the story. */
  momentCount: number;
}

export interface SimilarCase {
  id: number;
  patientCode: string;
  matchScore: number;
  presentingConcerns: string[];
  dominantStructures: StructureName[];
  keyThemes: string[];
  representativeQuote: string;

  /** Demographic snapshot drawn from real lived_experiences fields. */
  ageRange?: string;
  gender?: string;
  primaryTopic?: string;

  /** One-sentence basis for the match — derived from shared structures + dominant shared theme. */
  matchBasis?: string;

  /** Top 2–4 turning-point quotes from this person's own account. */
  helpfulMoments?: HelpfulMoment[];

  /** Structural arc (early → late) over the story's coded moments. */
  journey?: StoryJourney;
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

export interface TopicOccurrence {
  quote: string;
  timestamp?: string;
  speaker?: 'client' | 'therapist';
  momentId?: string | number;
  structures?: string[];
}

export interface ExtractedTopic {
  id: string;
  label: string;
  /** AI confidence 0-1 */
  confidence: number;
  /** Number of times referenced in session — equals occurrences.length when occurrences are populated */
  mentions: number;
  /** Number of matching moments/lines for this topic */
  count?: number;
  /** Phenomenological structure label this topic maps to (e.g. 'emotional', 'somatic', 'cognitive + somatic') */
  structure?: string;
  /** Every matching snippet for this topic */
  occurrences?: TopicOccurrence[];
  /** @deprecated Use occurrences[0] instead */
  triggerQuote?: string;
  /** @deprecated Use occurrences[0].speaker instead */
  speaker?: 'client' | 'therapist';
  /** @deprecated Use structure instead */
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
  /**
   * Whether this flag calls for immediate clinical action or just forward-looking
   * monitoring. Drives the icon shape (alarm vs watch) so a "monitor" flag with low
   * severity doesn't visually shout the same way a high-severity acute risk does.
   */
  interventionType?: 'immediate' | 'monitor';
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
  /** Trend direction */
  trend?: 'increasing' | 'decreasing' | 'stable' | 'new' | 'resolved';
}

export interface TreatmentPlanItem {
  id: string;
  goal: string;
  status: 'active' | 'completed' | 'paused' | 'in_progress' | 'not_started' | 'achieved';
  progress?: number;
  progressPercent?: number;
  lastUpdatedSession?: number;
  notes?: string;
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
