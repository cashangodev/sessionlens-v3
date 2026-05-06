/**
 * Types for the pre-session screening engine.
 *
 * Each instrument is a static, hardcoded TS object — these are standardized
 * clinical instruments with fixed wording. Mutating them or letting the DB
 * version drift would break score validity, so they live in code.
 */

export type Severity =
  | 'minimal'
  | 'mild'
  | 'moderate'
  | 'moderately_severe'
  | 'severe'
  | 'extremely_severe'
  | 'low_risk'
  | 'moderate_risk'
  | 'high_risk'
  | 'very_high_risk'
  | 'no_clinical'
  | 'subthreshold'
  | 'positive_screen'
  | 'negative_screen'
  | 'healthy';

export interface ResponseOption {
  value: number;
  label: string;
  /** Optional short label used in heatmaps / dense UI */
  short?: string;
}

export type ResponseScale = ResponseOption[];

export interface ScreeningItem {
  /** Stable id, e.g. "phq9_1". Used as item_id in screening_responses. */
  id: string;
  text: string;
  /** Per-item scale override. If omitted, the instrument's defaultScale applies. */
  scale?: ResponseScale;
  /** CORE-10 has reverse-scored items; flag here so scoring inverts the value. */
  reverseScored?: boolean;
  /**
   * Conditional display. C-SSRS questions 3-5 only appear if Q2 = "Yes" (1).
   * The patient UI hides the item; if it's required for scoring, scoring
   * treats unanswered conditionals as 0.
   */
  conditional?: {
    showIfItemId: string;
    minValue: number;
  };
  /** Mark the item as a known clinical sentinel — e.g. PHQ-9 q9 is the
   *  suicidal-ideation item. Surfaced to UI for special handling. */
  sentinel?: SentinelItem;
}

export type SentinelItem = 'suicidal_ideation' | 'self_harm';

export interface SeverityBand {
  min: number;
  max: number;
  label: string;
  severity: Severity;
  /** Brief clinician-facing guidance. Renders in the results card. */
  guidance?: string;
}

export interface Subscale {
  id: string;
  name: string;
  itemIds: string[];
  /** Multiplier applied to the subscale total (DASS-21 sums × 2 for DASS-42-equivalent comparison). */
  multiplier?: number;
  bands: SeverityBand[];
}

export interface ScoringResult {
  total: number;
  subscaleScores?: Record<string, number>;
  severity: Severity;
  severityLabel: string;
  guidance?: string;
  /** Standardized flags downstream code can react to (e.g. "phq9_q9_positive" → auto-add C-SSRS). */
  flags: string[];
  perSubscale?: Record<string, { total: number; severity: Severity; severityLabel: string }>;
}

export interface ScreeningInstrument {
  id: string;
  name: string;
  fullName: string;
  /** One-line clinician-facing description. */
  description: string;
  /** Estimated minutes to complete. Surfaced on the patient onboarding gate. */
  estimatedMinutes: number;
  /** Recall window phrasing, e.g. "Over the last 2 weeks". Shown above items. */
  recallPeriod?: string;
  /** Patient-facing intro text. Shown once before the items. */
  introduction?: string;
  /** Default response scale applied to each item unless the item overrides. */
  defaultScale?: ResponseScale;
  items: ScreeningItem[];
  /** Top-level severity bands (when there's a single total score). */
  bands?: SeverityBand[];
  /** Subscale definitions (DASS-21 has 3, C-SSRS has 2). */
  subscales?: Subscale[];
  /**
   * Score the responses. Each instrument owns its scoring rules — most are
   * sums against the bands array, but some (C-SSRS) use a tier-based
   * algorithm and some (CORE-10) reverse-score specific items.
   */
  score: (responses: ItemResponses) => ScoringResult;
  /** Per-instrument categories — used for filtering / grouping in the picker UI. */
  category: ScreeningCategory;
  /** True if appropriate for repeated session-by-session use (ORS, SRS, CORE-10). */
  repeatable?: boolean;
}

export type ScreeningCategory =
  | 'depression'
  | 'anxiety'
  | 'trauma'
  | 'substance'
  | 'sleep'
  | 'eating'
  | 'risk'
  | 'history'
  | 'general';

export type ItemResponses = Record<string, number | undefined>;

/**
 * Helper: pick the band whose [min, max] contains `total`. Bands are
 * inclusive on both ends and assumed to cover the full possible range
 * without gaps.
 */
export function findBand(bands: SeverityBand[], total: number): SeverityBand {
  const found = bands.find((b) => total >= b.min && total <= b.max);
  if (!found) {
    // This means a band was misconfigured. We fail loud rather than guess.
    throw new Error(`No severity band contains score ${total}`);
  }
  return found;
}

/**
 * Helper: simple-sum scoring. Most instruments collapse to this once
 * reverse-scoring is applied at the item level.
 */
export function simpleSum(items: ScreeningItem[], responses: ItemResponses): number {
  let total = 0;
  for (const item of items) {
    const raw = responses[item.id];
    if (raw === undefined) continue;
    total += item.reverseScored ? maxScale(item) - raw : raw;
  }
  return total;
}

function maxScale(item: ScreeningItem): number {
  if (!item.scale || item.scale.length === 0) return 0;
  return Math.max(...item.scale.map((o) => o.value));
}
