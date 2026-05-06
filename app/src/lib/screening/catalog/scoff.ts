import type { ScreeningInstrument, SeverityBand } from '../types';
import { findBand, simpleSum } from '../types';
import { YES_NO } from './scales';

const BANDS: SeverityBand[] = [
  { min: 0, max: 1, label: 'Below threshold',           severity: 'negative_screen', guidance: 'No eating disorder indicated by SCOFF.' },
  { min: 2, max: 5, label: 'Possible eating disorder',  severity: 'positive_screen', guidance: 'Score ≥2 warrants further assessment for an eating disorder (e.g. EDE-Q, full clinical interview).' },
];

export const SCOFF: ScreeningInstrument = {
  id: 'scoff',
  name: 'SCOFF',
  fullName: 'SCOFF Eating Disorder Screen',
  description: 'Five yes/no items. Cutoff ≥2 indicates a likely eating disorder warranting further assessment.',
  category: 'eating',
  estimatedMinutes: 1,
  introduction: 'Please answer Yes or No to each of the following questions.',
  defaultScale: YES_NO,
  items: [
    { id: 'scoff_1', text: 'Do you make yourself Sick because you feel uncomfortably full?' },
    { id: 'scoff_2', text: 'Do you worry you have lost Control over how much you eat?' },
    { id: 'scoff_3', text: 'Have you recently lost more than One stone (about 6.4 kg / 14 pounds) in a 3-month period?' },
    { id: 'scoff_4', text: 'Do you believe yourself to be Fat when others say you are too thin?' },
    { id: 'scoff_5', text: 'Would you say that Food dominates your life?' },
  ],
  bands: BANDS,
  score(responses) {
    const total = simpleSum(this.items, responses);
    const band = findBand(BANDS, total);
    const flags: string[] = [];
    if (total >= 2) flags.push('scoff_positive');
    return { total, severity: band.severity, severityLabel: band.label, guidance: band.guidance, flags };
  },
};
