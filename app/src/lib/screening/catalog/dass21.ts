import type { ScreeningInstrument, Subscale, ScoringResult, Severity } from '../types';
import { findBand } from '../types';
import { DASS_4 } from './scales';

/**
 * DASS-21 has three 7-item subscales: Depression, Anxiety, Stress.
 * Each subscale total is multiplied by 2 so cutoffs match the DASS-42
 * (the original) reference distributions.
 */

const D_BANDS = [
  { min: 0,  max: 9,  label: 'Normal',            severity: 'minimal' as Severity },
  { min: 10, max: 13, label: 'Mild',              severity: 'mild' as Severity },
  { min: 14, max: 20, label: 'Moderate',          severity: 'moderate' as Severity },
  { min: 21, max: 27, label: 'Severe',            severity: 'severe' as Severity },
  { min: 28, max: 99, label: 'Extremely severe',  severity: 'extremely_severe' as Severity },
];
const A_BANDS = [
  { min: 0,  max: 7,  label: 'Normal',            severity: 'minimal' as Severity },
  { min: 8,  max: 9,  label: 'Mild',              severity: 'mild' as Severity },
  { min: 10, max: 14, label: 'Moderate',          severity: 'moderate' as Severity },
  { min: 15, max: 19, label: 'Severe',            severity: 'severe' as Severity },
  { min: 20, max: 99, label: 'Extremely severe',  severity: 'extremely_severe' as Severity },
];
const S_BANDS = [
  { min: 0,  max: 14, label: 'Normal',            severity: 'minimal' as Severity },
  { min: 15, max: 18, label: 'Mild',              severity: 'mild' as Severity },
  { min: 19, max: 25, label: 'Moderate',          severity: 'moderate' as Severity },
  { min: 26, max: 33, label: 'Severe',            severity: 'severe' as Severity },
  { min: 34, max: 99, label: 'Extremely severe',  severity: 'extremely_severe' as Severity },
];

const SUBSCALES: Subscale[] = [
  {
    id: 'depression',
    name: 'Depression',
    itemIds: ['dass_3', 'dass_5', 'dass_10', 'dass_13', 'dass_16', 'dass_17', 'dass_21'],
    multiplier: 2,
    bands: D_BANDS,
  },
  {
    id: 'anxiety',
    name: 'Anxiety',
    itemIds: ['dass_2', 'dass_4', 'dass_7', 'dass_9', 'dass_15', 'dass_19', 'dass_20'],
    multiplier: 2,
    bands: A_BANDS,
  },
  {
    id: 'stress',
    name: 'Stress',
    itemIds: ['dass_1', 'dass_6', 'dass_8', 'dass_11', 'dass_12', 'dass_14', 'dass_18'],
    multiplier: 2,
    bands: S_BANDS,
  },
];

export const DASS21: ScreeningInstrument = {
  id: 'dass21',
  name: 'DASS-21',
  fullName: 'Depression Anxiety Stress Scales (21-item)',
  description: '21 items, 3 subscales (Depression, Anxiety, Stress). Each subscale × 2 to match DASS-42 cutoffs.',
  category: 'general',
  estimatedMinutes: 5,
  recallPeriod: 'Over the past week',
  introduction: 'Please read each statement and indicate how much it applied to you over the past week. There are no right or wrong answers.',
  defaultScale: DASS_4,
  items: [
    { id: 'dass_1',  text: 'I found it hard to wind down' },
    { id: 'dass_2',  text: 'I was aware of dryness of my mouth' },
    { id: 'dass_3',  text: "I couldn't seem to experience any positive feeling at all" },
    { id: 'dass_4',  text: 'I experienced breathing difficulty (e.g., excessively rapid breathing, breathlessness in the absence of physical exertion)' },
    { id: 'dass_5',  text: 'I found it difficult to work up the initiative to do things' },
    { id: 'dass_6',  text: 'I tended to over-react to situations' },
    { id: 'dass_7',  text: 'I experienced trembling (e.g., in the hands)' },
    { id: 'dass_8',  text: 'I felt that I was using a lot of nervous energy' },
    { id: 'dass_9',  text: 'I was worried about situations in which I might panic and make a fool of myself' },
    { id: 'dass_10', text: 'I felt that I had nothing to look forward to' },
    { id: 'dass_11', text: 'I found myself getting agitated' },
    { id: 'dass_12', text: 'I found it difficult to relax' },
    { id: 'dass_13', text: 'I felt down-hearted and blue' },
    { id: 'dass_14', text: 'I was intolerant of anything that kept me from getting on with what I was doing' },
    { id: 'dass_15', text: 'I felt I was close to panic' },
    { id: 'dass_16', text: 'I was unable to become enthusiastic about anything' },
    { id: 'dass_17', text: "I felt I wasn't worth much as a person" },
    { id: 'dass_18', text: 'I felt that I was rather touchy' },
    { id: 'dass_19', text: 'I was aware of the action of my heart in the absence of physical exertion (e.g., sense of heart rate increase, heart missing a beat)' },
    { id: 'dass_20', text: 'I felt scared without any good reason' },
    { id: 'dass_21', text: 'I felt that life was meaningless' },
  ],
  subscales: SUBSCALES,
  score(responses): ScoringResult {
    const subscaleScores: Record<string, number> = {};
    const perSubscale: ScoringResult['perSubscale'] = {};
    const flags: string[] = [];

    for (const sub of SUBSCALES) {
      const raw = sub.itemIds.reduce((sum, id) => sum + (responses[id] ?? 0), 0);
      const adjusted = raw * (sub.multiplier ?? 1);
      subscaleScores[sub.id] = adjusted;
      const band = findBand(sub.bands, adjusted);
      perSubscale[sub.id] = { total: adjusted, severity: band.severity, severityLabel: band.label };
      if (band.severity === 'severe' || band.severity === 'extremely_severe') {
        flags.push(`dass21_${sub.id}_severe`);
      }
    }

    const total = subscaleScores.depression + subscaleScores.anxiety + subscaleScores.stress;
    // Pick the most severe subscale for the headline severity.
    const order: Severity[] = ['extremely_severe', 'severe', 'moderate', 'mild', 'minimal'];
    let headline: Severity = 'minimal';
    let headlineLabel = 'Normal';
    for (const sev of order) {
      const found = Object.values(perSubscale).find((p) => p.severity === sev);
      if (found) { headline = sev; headlineLabel = found.severityLabel; break; }
    }

    return {
      total,
      subscaleScores,
      perSubscale,
      severity: headline,
      severityLabel: headlineLabel,
      guidance: 'Subscale-level severity shown below.',
      flags,
    };
  },
};
