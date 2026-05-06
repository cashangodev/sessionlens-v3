import type { ScreeningInstrument, SeverityBand, ResponseScale } from '../types';
import { findBand, simpleSum } from '../types';
import { SEVERITY_5 } from './scales';

const BANDS: SeverityBand[] = [
  { min: 0,  max: 7,  label: 'No clinically significant insomnia', severity: 'no_clinical',   guidance: '' },
  { min: 8,  max: 14, label: 'Subthreshold insomnia',              severity: 'subthreshold',  guidance: 'Sleep difficulties present but below clinical threshold.' },
  { min: 15, max: 21, label: 'Clinical insomnia (moderate)',        severity: 'moderate',      guidance: 'Clinically significant insomnia. Consider CBT-I and/or sleep medicine referral.' },
  { min: 22, max: 28, label: 'Clinical insomnia (severe)',          severity: 'severe',        guidance: 'Severe clinical insomnia. Active treatment indicated.' },
];

const SATISFACTION_5: ResponseScale = [
  { value: 0, label: 'Very satisfied',     short: '0' },
  { value: 1, label: 'Satisfied',          short: '1' },
  { value: 2, label: 'Neutral',            short: '2' },
  { value: 3, label: 'Dissatisfied',       short: '3' },
  { value: 4, label: 'Very dissatisfied',  short: '4' },
];

const NOTICEABLE_5: ResponseScale = [
  { value: 0, label: 'Not at all noticeable', short: '0' },
  { value: 1, label: 'A little',              short: '1' },
  { value: 2, label: 'Somewhat',              short: '2' },
  { value: 3, label: 'Much',                  short: '3' },
  { value: 4, label: 'Very much noticeable',  short: '4' },
];

const WORRY_5: ResponseScale = [
  { value: 0, label: 'Not at all worried', short: '0' },
  { value: 1, label: 'A little',           short: '1' },
  { value: 2, label: 'Somewhat',           short: '2' },
  { value: 3, label: 'Much',               short: '3' },
  { value: 4, label: 'Very much worried',  short: '4' },
];

const INTERFERE_5: ResponseScale = [
  { value: 0, label: 'Not at all interfering', short: '0' },
  { value: 1, label: 'A little',               short: '1' },
  { value: 2, label: 'Somewhat',               short: '2' },
  { value: 3, label: 'Much',                   short: '3' },
  { value: 4, label: 'Very much interfering',  short: '4' },
];

export const ISI: ScreeningInstrument = {
  id: 'isi',
  name: 'ISI',
  fullName: 'Insomnia Severity Index',
  description: 'Seven-item insomnia severity screener. Total 0–28.',
  category: 'sleep',
  estimatedMinutes: 3,
  recallPeriod: 'For the LAST 2 WEEKS',
  introduction: 'Please rate the CURRENT (i.e., LAST 2 WEEKS) SEVERITY of your insomnia problem(s).',
  defaultScale: SEVERITY_5,
  items: [
    { id: 'isi_1', text: 'Difficulty falling asleep' },
    { id: 'isi_2', text: 'Difficulty staying asleep' },
    { id: 'isi_3', text: 'Problem waking up too early' },
    { id: 'isi_4', text: 'How SATISFIED/DISSATISFIED are you with your CURRENT sleep pattern?', scale: SATISFACTION_5 },
    { id: 'isi_5', text: 'How NOTICEABLE to others do you think your sleep problem is in terms of impairing the quality of your life?', scale: NOTICEABLE_5 },
    { id: 'isi_6', text: 'How WORRIED/DISTRESSED are you about your current sleep problem?', scale: WORRY_5 },
    { id: 'isi_7', text: 'To what extent do you consider your sleep problem to INTERFERE with your daily functioning (e.g. daytime fatigue, mood, ability to function at work/daily chores, concentration, memory, mood)?', scale: INTERFERE_5 },
  ],
  bands: BANDS,
  score(responses) {
    const total = simpleSum(this.items, responses);
    const band = findBand(BANDS, total);
    const flags: string[] = [];
    if (total >= 15) flags.push('isi_clinical');
    return { total, severity: band.severity, severityLabel: band.label, guidance: band.guidance, flags };
  },
};
