import type { ScreeningInstrument, ResponseScale, SeverityBand } from '../types';
import { findBand, simpleSum } from '../types';

const SRS_SLIDER: ResponseScale = Array.from({ length: 11 }, (_, i) => ({
  value: i,
  label: String(i),
  short: String(i),
}));

const BANDS: SeverityBand[] = [
  { min: 0,  max: 35, label: 'Concerning alliance', severity: 'positive_screen', guidance: 'Total <36 suggests an alliance issue worth discussing in the next session.' },
  { min: 36, max: 40, label: 'Strong alliance',     severity: 'negative_screen', guidance: 'Strong therapeutic alliance reported. Continue current approach.' },
];

export const SRS: ScreeningInstrument = {
  id: 'srs',
  name: 'SRS',
  fullName: 'Session Rating Scale',
  description: 'Brief 4-item alliance measure. Used at the end of each session to monitor the working relationship. Total <36 is concerning.',
  category: 'general',
  estimatedMinutes: 1,
  introduction: 'Please rate today\'s session by sliding each scale to indicate how things felt for you.',
  repeatable: true,
  defaultScale: SRS_SLIDER,
  items: [
    { id: 'srs_relationship', text: 'Relationship — I felt heard, understood, and respected.' },
    { id: 'srs_goals',         text: 'Goals and Topics — We worked on and talked about what I wanted to work on and talk about.' },
    { id: 'srs_approach',      text: "Approach or Method — The therapist's approach is a good fit for me." },
    { id: 'srs_overall',       text: 'Overall — There was something missing in the session today / Overall, today\'s session was right for me.' },
  ],
  bands: BANDS,
  score(responses) {
    const total = simpleSum(this.items, responses);
    const band = findBand(BANDS, total);
    const flags: string[] = [];
    if (total < 36) flags.push('srs_alliance_concern');
    return { total, severity: band.severity, severityLabel: band.label, guidance: band.guidance, flags };
  },
};
