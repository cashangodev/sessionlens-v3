import type { ScreeningInstrument, SeverityBand } from '../types';
import { findBand, simpleSum } from '../types';
import { CORE_5 } from './scales';

const BANDS: SeverityBand[] = [
  { min: 0,  max: 5,  label: 'Healthy',                severity: 'healthy',         guidance: '' },
  { min: 6,  max: 10, label: 'Low-level distress',     severity: 'mild',            guidance: 'Below clinical cutoff but worth tracking.' },
  { min: 11, max: 14, label: 'Mild distress',          severity: 'mild',            guidance: 'Mild range. Monitor session-to-session.' },
  { min: 15, max: 19, label: 'Moderate distress',      severity: 'moderate',        guidance: 'Moderate range — clinically significant.' },
  { min: 20, max: 24, label: 'Moderate-to-severe',     severity: 'severe',          guidance: 'Moderate-to-severe distress. Active treatment indicated.' },
  { min: 25, max: 40, label: 'Severe distress',        severity: 'extremely_severe', guidance: 'Severe distress. High clinical priority.' },
];

export const CORE10: ScreeningInstrument = {
  id: 'core10',
  name: 'CORE-10',
  fullName: 'Clinical Outcomes in Routine Evaluation – 10',
  description: 'Brief 10-item global distress measure widely used in UK NHS services. Total 0–40. Item 6 is a sentinel suicide-plan item.',
  category: 'general',
  estimatedMinutes: 3,
  recallPeriod: 'Over the last week',
  introduction: 'This form has 10 statements about how you have been over the LAST WEEK. Please read each statement and indicate how often you have felt that way.',
  repeatable: true,
  defaultScale: CORE_5,
  items: [
    { id: 'core_1',  text: 'I have felt tense, anxious or nervous' },
    { id: 'core_2',  text: 'I have felt I have someone to turn to for support when needed', reverseScored: true },
    { id: 'core_3',  text: 'I have felt able to cope when things go wrong', reverseScored: true },
    { id: 'core_4',  text: 'Talking to people has felt too much for me' },
    { id: 'core_5',  text: 'I have felt panic or terror' },
    { id: 'core_6',  text: 'I made plans to end my life', sentinel: 'suicidal_ideation' },
    { id: 'core_7',  text: 'I have had difficulty getting to sleep or staying asleep' },
    { id: 'core_8',  text: 'I have felt despairing or hopeless' },
    { id: 'core_9',  text: 'I have felt unhappy' },
    { id: 'core_10', text: 'Unwanted images or memories have been distressing me' },
  ],
  bands: BANDS,
  score(responses) {
    const total = simpleSum(this.items, responses);
    const band = findBand(BANDS, total);
    const flags: string[] = [];
    const item6 = responses['core_6'] ?? 0;
    if (item6 >= 1) flags.push('core10_item6_positive', 'suicide_plan_endorsed');
    if (total >= 20) flags.push('core10_severe');
    return { total, severity: band.severity, severityLabel: band.label, guidance: band.guidance, flags };
  },
};
