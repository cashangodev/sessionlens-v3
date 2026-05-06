import type { ScreeningInstrument, SeverityBand } from '../types';
import { findBand, simpleSum } from '../types';

const BANDS: SeverityBand[] = [
  { min: 0,  max: 5,  label: 'Below threshold',           severity: 'negative_screen', guidance: 'No drug-related problems indicated by the standard cutoff.' },
  { min: 6,  max: 24, label: 'Likely drug-related problems', severity: 'positive_screen', guidance: 'Score ≥6 (men) / ≥2 (women) suggests drug-related problems. Brief intervention or further assessment recommended.' },
  { min: 25, max: 44, label: 'Likely drug dependence',     severity: 'high_risk',       guidance: 'Score ≥25 indicates likely heavy drug use / dependence. Comprehensive assessment recommended.' },
];

export const DUDIT: ScreeningInstrument = {
  id: 'dudit',
  name: 'DUDIT',
  fullName: 'Drug Use Disorders Identification Test',
  description: '11-item drug-use screen. Cutoff ≥6 (men) or ≥2 (women); ≥25 suggests dependence.',
  category: 'substance',
  estimatedMinutes: 3,
  introduction: 'These questions are about your use of drugs other than alcohol or nicotine. "Drugs" includes cannabis, cocaine, amphetamines, opioids, sedatives or sleeping pills (without a doctor\'s prescription), hallucinogens, solvents, GHB, anabolic steroids, and any other recreational substances.',
  items: [
    {
      id: 'dudit_1',
      text: 'How often did you use drugs other than alcohol in the past year?',
      scale: [
        { value: 0, label: 'Never' },
        { value: 1, label: 'Once a month or less often' },
        { value: 2, label: '2 to 4 times a month' },
        { value: 3, label: '2 to 3 times a week' },
        { value: 4, label: '4 or more times a week' },
      ],
    },
    {
      id: 'dudit_2',
      text: 'Do you use more than one type of drug on the same occasion?',
      scale: [
        { value: 0, label: 'Never' },
        { value: 1, label: 'Once a month or less often' },
        { value: 2, label: '2 to 4 times a month' },
        { value: 3, label: '2 to 3 times a week' },
        { value: 4, label: '4 or more times a week' },
      ],
    },
    {
      id: 'dudit_3',
      text: 'How many times do you take drugs on a typical day when you use drugs?',
      scale: [
        { value: 0, label: '0' },
        { value: 1, label: '1 to 2' },
        { value: 2, label: '3 to 4' },
        { value: 3, label: '5 to 6' },
        { value: 4, label: '7 or more' },
      ],
    },
    {
      id: 'dudit_4',
      text: 'How often are you influenced heavily by drugs?',
      scale: [
        { value: 0, label: 'Never' },
        { value: 1, label: 'Less often than once a month' },
        { value: 2, label: 'Every month' },
        { value: 3, label: 'Every week' },
        { value: 4, label: 'Daily or almost every day' },
      ],
    },
    {
      id: 'dudit_5',
      text: 'Over the past year, have you felt that your longing for drugs was so strong that you could not resist it?',
      scale: [
        { value: 0, label: 'Never' },
        { value: 1, label: 'Less often than once a month' },
        { value: 2, label: 'Every month' },
        { value: 3, label: 'Every week' },
        { value: 4, label: 'Daily or almost every day' },
      ],
    },
    {
      id: 'dudit_6',
      text: 'Has it happened, over the past year, that you have not been able to stop taking drugs once you started?',
      scale: [
        { value: 0, label: 'Never' },
        { value: 1, label: 'Less often than once a month' },
        { value: 2, label: 'Every month' },
        { value: 3, label: 'Every week' },
        { value: 4, label: 'Daily or almost every day' },
      ],
    },
    {
      id: 'dudit_7',
      text: 'How often over the past year have you taken drugs and then neglected to do something you should have done?',
      scale: [
        { value: 0, label: 'Never' },
        { value: 1, label: 'Less often than once a month' },
        { value: 2, label: 'Every month' },
        { value: 3, label: 'Every week' },
        { value: 4, label: 'Daily or almost every day' },
      ],
    },
    {
      id: 'dudit_8',
      text: 'How often over the past year have you needed to take a drug the morning after heavy drug use the day before?',
      scale: [
        { value: 0, label: 'Never' },
        { value: 1, label: 'Less often than once a month' },
        { value: 2, label: 'Every month' },
        { value: 3, label: 'Every week' },
        { value: 4, label: 'Daily or almost every day' },
      ],
    },
    {
      id: 'dudit_9',
      text: 'How often over the past year have you had guilt feelings or a bad conscience because you used drugs?',
      scale: [
        { value: 0, label: 'Never' },
        { value: 1, label: 'Less often than once a month' },
        { value: 2, label: 'Every month' },
        { value: 3, label: 'Every week' },
        { value: 4, label: 'Daily or almost every day' },
      ],
    },
    {
      id: 'dudit_10',
      text: 'Have you or anyone else been hurt (mentally or physically) because you used drugs?',
      scale: [
        { value: 0, label: 'No' },
        { value: 2, label: 'Yes, but not in the past year' },
        { value: 4, label: 'Yes, in the past year' },
      ],
    },
    {
      id: 'dudit_11',
      text: 'Has a relative, friend, doctor, or anyone else been worried about your drug use or said to you that you should stop using drugs?',
      scale: [
        { value: 0, label: 'No' },
        { value: 2, label: 'Yes, but not in the past year' },
        { value: 4, label: 'Yes, in the past year' },
      ],
    },
  ],
  bands: BANDS,
  score(responses) {
    const total = simpleSum(this.items, responses);
    const band = findBand(BANDS, total);
    const flags: string[] = [];
    if (total >= 6) flags.push('dudit_positive');
    if (total >= 25) flags.push('dudit_likely_dependence');
    return { total, severity: band.severity, severityLabel: band.label, guidance: band.guidance, flags };
  },
};
