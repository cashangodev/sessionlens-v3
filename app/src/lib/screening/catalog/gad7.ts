import type { ScreeningInstrument, SeverityBand } from '../types';
import { findBand, simpleSum } from '../types';
import { FREQUENCY_4 } from './scales';

const BANDS: SeverityBand[] = [
  { min: 0,  max: 4,  label: 'Minimal anxiety',  severity: 'minimal',  guidance: 'Symptoms may not need treatment.' },
  { min: 5,  max: 9,  label: 'Mild anxiety',     severity: 'mild',     guidance: 'Monitor; repeat at follow-up.' },
  { min: 10, max: 14, label: 'Moderate anxiety', severity: 'moderate', guidance: 'Possible clinically significant condition. Further evaluation recommended.' },
  { min: 15, max: 21, label: 'Severe anxiety',   severity: 'severe',   guidance: 'Active treatment likely warranted.' },
];

export const GAD7: ScreeningInstrument = {
  id: 'gad7',
  name: 'GAD-7',
  fullName: 'Generalized Anxiety Disorder-7',
  description: 'Generalized anxiety screener. Scores 0–21, severity bands from minimal to severe.',
  category: 'anxiety',
  estimatedMinutes: 2,
  recallPeriod: 'Over the last 2 weeks',
  introduction: 'Over the last 2 weeks, how often have you been bothered by the following problems?',
  defaultScale: FREQUENCY_4,
  items: [
    { id: 'gad7_1', text: 'Feeling nervous, anxious, or on edge' },
    { id: 'gad7_2', text: 'Not being able to stop or control worrying' },
    { id: 'gad7_3', text: 'Worrying too much about different things' },
    { id: 'gad7_4', text: 'Trouble relaxing' },
    { id: 'gad7_5', text: 'Being so restless that it is hard to sit still' },
    { id: 'gad7_6', text: 'Becoming easily annoyed or irritable' },
    { id: 'gad7_7', text: 'Feeling afraid, as if something awful might happen' },
  ],
  bands: BANDS,
  score(responses) {
    const total = simpleSum(this.items, responses);
    const band = findBand(BANDS, total);
    const flags: string[] = [];
    if (total >= 15) flags.push('gad7_severe');
    return { total, severity: band.severity, severityLabel: band.label, guidance: band.guidance, flags };
  },
};
