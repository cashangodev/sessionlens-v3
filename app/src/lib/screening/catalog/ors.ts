import type { ScreeningInstrument, ResponseScale, SeverityBand } from '../types';
import { findBand, simpleSum } from '../types';

/**
 * ORS — visual analog scale 0–10 per item, total 0–40.
 * The patient marks each scale; the rendered control is a slider.
 */
const ORS_SLIDER: ResponseScale = Array.from({ length: 11 }, (_, i) => ({
  value: i,
  label: String(i),
  short: String(i),
}));

const BANDS: SeverityBand[] = [
  { min: 0,  max: 24, label: 'Clinical range',         severity: 'positive_screen', guidance: 'Total <25 indicates a clinical population (Miller et al. cutoff for adults).' },
  { min: 25, max: 40, label: 'Non-clinical range',     severity: 'negative_screen', guidance: 'Above the clinical cutoff. Track session-by-session for change.' },
];

export const ORS: ScreeningInstrument = {
  id: 'ors',
  name: 'ORS',
  fullName: 'Outcome Rating Scale',
  description: 'Brief 4-item outcome measure. Used at the start of each session to track change. Total 0–40; cutoff <25 = clinical range.',
  category: 'general',
  estimatedMinutes: 1,
  introduction: 'Looking back over the last week, including today, help us understand how you have been feeling by rating how well you have been doing in the following areas of your life. The line on the left represents low levels and the line on the right represents high levels.',
  repeatable: true,
  defaultScale: ORS_SLIDER,
  items: [
    { id: 'ors_individual',   text: 'Individually (Personal well-being)' },
    { id: 'ors_interpersonal', text: 'Interpersonally (Family, close relationships)' },
    { id: 'ors_socially',      text: 'Socially (Work, school, friendships)' },
    { id: 'ors_overall',       text: 'Overall (General sense of well-being)' },
  ],
  bands: BANDS,
  score(responses) {
    const total = simpleSum(this.items, responses);
    const band = findBand(BANDS, total);
    const flags: string[] = [];
    if (total < 25) flags.push('ors_clinical');
    return { total, severity: band.severity, severityLabel: band.label, guidance: band.guidance, flags };
  },
};
