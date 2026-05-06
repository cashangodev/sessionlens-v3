import type { ScreeningInstrument, SeverityBand } from '../types';
import { findBand, simpleSum } from '../types';
import { DISTRESS_5 } from './scales';

const BANDS: SeverityBand[] = [
  { min: 0,  max: 32, label: 'Below probable PTSD threshold', severity: 'negative_screen', guidance: 'Below the commonly used screening cutoff.' },
  { min: 33, max: 80, label: 'Probable PTSD',                 severity: 'positive_screen', guidance: 'Score ≥33 suggests probable PTSD per VA recommended cutoff. Consider structured diagnostic interview (e.g. CAPS-5).' },
];

export const PCL5: ScreeningInstrument = {
  id: 'pcl5',
  name: 'PCL-5',
  fullName: 'PTSD Checklist for DSM-5',
  description: 'PTSD symptom screener. 20 items, scored 0–80. Cutoff ≥33 suggests probable PTSD.',
  category: 'trauma',
  estimatedMinutes: 5,
  recallPeriod: 'In the past month',
  introduction: 'Below is a list of problems that people sometimes have in response to a very stressful experience. Please read each one carefully, then indicate how much you have been bothered by that problem in the past month.',
  defaultScale: DISTRESS_5,
  items: [
    { id: 'pcl5_1',  text: 'Repeated, disturbing, and unwanted memories of the stressful experience' },
    { id: 'pcl5_2',  text: 'Repeated, disturbing dreams of the stressful experience' },
    { id: 'pcl5_3',  text: 'Suddenly feeling or acting as if the stressful experience were actually happening again (as if you were actually back there reliving it)' },
    { id: 'pcl5_4',  text: 'Feeling very upset when something reminded you of the stressful experience' },
    { id: 'pcl5_5',  text: 'Having strong physical reactions when something reminded you of the stressful experience (heart pounding, trouble breathing, sweating)' },
    { id: 'pcl5_6',  text: 'Avoiding memories, thoughts, or feelings related to the stressful experience' },
    { id: 'pcl5_7',  text: 'Avoiding external reminders of the stressful experience (people, places, conversations, activities, objects, or situations)' },
    { id: 'pcl5_8',  text: 'Trouble remembering important parts of the stressful experience' },
    { id: 'pcl5_9',  text: 'Having strong negative beliefs about yourself, other people, or the world (such as: I am bad, there is something seriously wrong with me, no one can be trusted, the world is completely dangerous)' },
    { id: 'pcl5_10', text: 'Blaming yourself or someone else for the stressful experience or what happened after it' },
    { id: 'pcl5_11', text: 'Having strong negative feelings such as fear, horror, anger, guilt, or shame' },
    { id: 'pcl5_12', text: 'Loss of interest in activities that you used to enjoy' },
    { id: 'pcl5_13', text: 'Feeling distant or cut off from other people' },
    { id: 'pcl5_14', text: 'Trouble experiencing positive feelings (being unable to feel happiness or have loving feelings for people close to you)' },
    { id: 'pcl5_15', text: 'Irritable behavior, angry outbursts, or acting aggressively' },
    { id: 'pcl5_16', text: 'Taking too many risks or doing things that could cause you harm' },
    { id: 'pcl5_17', text: 'Being "superalert" or watchful or on guard' },
    { id: 'pcl5_18', text: 'Feeling jumpy or easily startled' },
    { id: 'pcl5_19', text: 'Having difficulty concentrating' },
    { id: 'pcl5_20', text: 'Trouble falling or staying asleep' },
  ],
  bands: BANDS,
  score(responses) {
    const total = simpleSum(this.items, responses);
    const band = findBand(BANDS, total);
    const flags: string[] = [];
    if (total >= 33) flags.push('pcl5_probable_ptsd');
    return { total, severity: band.severity, severityLabel: band.label, guidance: band.guidance, flags };
  },
};
