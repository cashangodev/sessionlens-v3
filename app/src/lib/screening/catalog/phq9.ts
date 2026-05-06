import type { ScreeningInstrument, SeverityBand } from '../types';
import { findBand, simpleSum } from '../types';
import { FREQUENCY_4 } from './scales';

const BANDS: SeverityBand[] = [
  { min: 0,  max: 4,  label: 'Minimal depression',           severity: 'minimal',           guidance: 'Symptoms may not need treatment.' },
  { min: 5,  max: 9,  label: 'Mild depression',              severity: 'mild',              guidance: 'Watchful waiting; repeat at follow-up.' },
  { min: 10, max: 14, label: 'Moderate depression',          severity: 'moderate',          guidance: 'Treatment plan; counseling, follow-up, and/or pharmacotherapy.' },
  { min: 15, max: 19, label: 'Moderately severe depression', severity: 'moderately_severe', guidance: 'Active treatment with pharmacotherapy and/or psychotherapy.' },
  { min: 20, max: 27, label: 'Severe depression',            severity: 'severe',            guidance: 'Immediate initiation of pharmacotherapy and expedited referral to a mental health specialist.' },
];

export const PHQ9: ScreeningInstrument = {
  id: 'phq9',
  name: 'PHQ-9',
  fullName: 'Patient Health Questionnaire-9',
  description: 'Depression screener. Scores 0–27, severity bands from minimal to severe.',
  category: 'depression',
  estimatedMinutes: 3,
  recallPeriod: 'Over the last 2 weeks',
  introduction: 'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
  defaultScale: FREQUENCY_4,
  items: [
    { id: 'phq9_1', text: 'Little interest or pleasure in doing things' },
    { id: 'phq9_2', text: 'Feeling down, depressed, or hopeless' },
    { id: 'phq9_3', text: 'Trouble falling or staying asleep, or sleeping too much' },
    { id: 'phq9_4', text: 'Feeling tired or having little energy' },
    { id: 'phq9_5', text: 'Poor appetite or overeating' },
    { id: 'phq9_6', text: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down' },
    { id: 'phq9_7', text: 'Trouble concentrating on things, such as reading the newspaper or watching television' },
    { id: 'phq9_8', text: 'Moving or speaking so slowly that other people could have noticed. Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual' },
    { id: 'phq9_9', text: 'Thoughts that you would be better off dead, or of hurting yourself in some way', sentinel: 'suicidal_ideation' },
  ],
  bands: BANDS,
  score(responses) {
    const items = this.items;
    const total = simpleSum(items, responses);
    const band = findBand(BANDS, total);
    const flags: string[] = [];
    const q9 = responses['phq9_9'] ?? 0;
    // Standard of care: any positive endorsement on item 9 triggers
    // suicide risk follow-up (we auto-add C-SSRS downstream).
    if (q9 >= 1) flags.push('phq9_q9_positive', 'suicide_ideation_endorsed');
    if (total >= 20) flags.push('phq9_severe');
    return {
      total,
      severity: band.severity,
      severityLabel: band.label,
      guidance: band.guidance,
      flags,
    };
  },
};
