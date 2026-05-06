import type { ScreeningInstrument, SeverityBand } from '../types';
import { findBand, simpleSum } from '../types';

const BANDS: SeverityBand[] = [
  { min: 0,  max: 2,  label: 'Low risk',  severity: 'negative_screen', guidance: 'Below the commonly used cutoff for hazardous drinking.' },
  { min: 3,  max: 4,  label: 'Borderline',  severity: 'positive_screen', guidance: 'Possible hazardous drinking — particularly in women (cutoff ≥3) and adults over 65.' },
  { min: 5,  max: 7,  label: 'Hazardous',   severity: 'positive_screen', guidance: 'Indicates hazardous drinking. Brief intervention or further assessment recommended.' },
  { min: 8,  max: 12, label: 'Probable AUD', severity: 'high_risk',     guidance: 'High likelihood of an alcohol use disorder. Further assessment recommended.' },
];

export const AUDITC: ScreeningInstrument = {
  id: 'auditc',
  name: 'AUDIT-C',
  fullName: 'Alcohol Use Disorders Identification Test (Concise)',
  description: 'Three-item alcohol screen. Cutoff ≥4 (men) or ≥3 (women) indicates hazardous drinking.',
  category: 'substance',
  estimatedMinutes: 1,
  introduction: 'These three questions are about your use of alcohol over the past year.',
  items: [
    {
      id: 'auditc_1',
      text: 'How often did you have a drink containing alcohol in the past year?',
      scale: [
        { value: 0, label: 'Never' },
        { value: 1, label: 'Monthly or less' },
        { value: 2, label: '2 to 4 times a month' },
        { value: 3, label: '2 to 3 times a week' },
        { value: 4, label: '4 or more times a week' },
      ],
    },
    {
      id: 'auditc_2',
      text: 'How many standard drinks containing alcohol did you have on a typical day when drinking in the past year?',
      scale: [
        { value: 0, label: '1 or 2' },
        { value: 1, label: '3 or 4' },
        { value: 2, label: '5 or 6' },
        { value: 3, label: '7 to 9' },
        { value: 4, label: '10 or more' },
      ],
    },
    {
      id: 'auditc_3',
      text: 'How often did you have six or more drinks on one occasion in the past year?',
      scale: [
        { value: 0, label: 'Never' },
        { value: 1, label: 'Less than monthly' },
        { value: 2, label: 'Monthly' },
        { value: 3, label: 'Weekly' },
        { value: 4, label: 'Daily or almost daily' },
      ],
    },
  ],
  bands: BANDS,
  score(responses) {
    const total = simpleSum(this.items, responses);
    const band = findBand(BANDS, total);
    const flags: string[] = [];
    if (total >= 4) flags.push('auditc_positive');
    if (total >= 8) flags.push('auditc_probable_aud');
    return { total, severity: band.severity, severityLabel: band.label, guidance: band.guidance, flags };
  },
};
