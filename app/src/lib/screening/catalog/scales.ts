import type { ResponseScale } from '../types';

/** Standard 0–3 frequency scale used by PHQ-9 and GAD-7. */
export const FREQUENCY_4: ResponseScale = [
  { value: 0, label: 'Not at all',                   short: '0' },
  { value: 1, label: 'Several days',                 short: '1' },
  { value: 2, label: 'More than half the days',      short: '2' },
  { value: 3, label: 'Nearly every day',             short: '3' },
];

/** Standard 0–4 distress scale used by PCL-5. */
export const DISTRESS_5: ResponseScale = [
  { value: 0, label: 'Not at all',   short: '0' },
  { value: 1, label: 'A little bit', short: '1' },
  { value: 2, label: 'Moderately',   short: '2' },
  { value: 3, label: 'Quite a bit',  short: '3' },
  { value: 4, label: 'Extremely',    short: '4' },
];

/** Standard 0–4 severity scale used by ISI. */
export const SEVERITY_5: ResponseScale = [
  { value: 0, label: 'None',        short: '0' },
  { value: 1, label: 'Mild',        short: '1' },
  { value: 2, label: 'Moderate',    short: '2' },
  { value: 3, label: 'Severe',      short: '3' },
  { value: 4, label: 'Very severe', short: '4' },
];

/** DASS-21: "applied to me over the past week" 0–3 scale. */
export const DASS_4: ResponseScale = [
  { value: 0, label: 'Did not apply to me at all',                                              short: '0' },
  { value: 1, label: 'Applied to me to some degree, or some of the time',                       short: '1' },
  { value: 2, label: 'Applied to me to a considerable degree, or a good part of the time',      short: '2' },
  { value: 3, label: 'Applied to me very much, or most of the time',                             short: '3' },
];

/** CORE-10: "over the last week" 0–4 scale. */
export const CORE_5: ResponseScale = [
  { value: 0, label: 'Not at all',           short: '0' },
  { value: 1, label: 'Only occasionally',    short: '1' },
  { value: 2, label: 'Sometimes',            short: '2' },
  { value: 3, label: 'Often',                short: '3' },
  { value: 4, label: 'Most or all the time', short: '4' },
];

/** Yes/No binary, scored 0/1. Used by ACE, SCOFF, C-SSRS items. */
export const YES_NO: ResponseScale = [
  { value: 0, label: 'No',  short: 'No' },
  { value: 1, label: 'Yes', short: 'Yes' },
];

/** AUDIT/DUDIT use varying 0–4 scales — specified per-item in the instrument. */
