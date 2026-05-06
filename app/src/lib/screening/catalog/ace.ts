import type { ScreeningInstrument, SeverityBand } from '../types';
import { findBand, simpleSum } from '../types';
import { YES_NO } from './scales';

const BANDS: SeverityBand[] = [
  { min: 0,  max: 0,  label: 'No reported ACEs',     severity: 'minimal',  guidance: '' },
  { min: 1,  max: 3,  label: 'Some ACE exposure',    severity: 'mild',     guidance: 'ACE exposure present. Consider trauma-informed framing in clinical work.' },
  { min: 4,  max: 10, label: 'High ACE exposure',    severity: 'high_risk', guidance: 'High ACE exposure (≥4) is a robust predictor of adult mental and physical health outcomes. Trauma-informed care strongly indicated.' },
];

export const ACE: ScreeningInstrument = {
  id: 'ace',
  name: 'ACE',
  fullName: 'Adverse Childhood Experiences',
  description: 'Ten yes/no items about adverse experiences before age 18. Each YES = 1 point. ≥4 indicates high exposure.',
  category: 'history',
  estimatedMinutes: 4,
  introduction: 'These questions refer to your first 18 years of life. The information you provide here is treated as sensitive — please answer honestly. You can skip any item if you prefer.',
  defaultScale: YES_NO,
  items: [
    { id: 'ace_1',  text: 'Did a parent or other adult in the household often or very often swear at you, insult you, put you down, or humiliate you? Or act in a way that made you afraid that you might be physically hurt?' },
    { id: 'ace_2',  text: 'Did a parent or other adult in the household often or very often push, grab, slap, or throw something at you? Or ever hit you so hard that you had marks or were injured?' },
    { id: 'ace_3',  text: 'Did an adult or person at least 5 years older than you ever touch or fondle you or have you touch their body in a sexual way? Or attempt or actually have oral, anal, or vaginal intercourse with you?' },
    { id: 'ace_4',  text: 'Did you often or very often feel that no one in your family loved you or thought you were important or special? Or your family didn\'t look out for each other, feel close to each other, or support each other?' },
    { id: 'ace_5',  text: 'Did you often or very often feel that you didn\'t have enough to eat, had to wear dirty clothes, and had no one to protect you? Or your parents were too drunk or high to take care of you or take you to the doctor if you needed it?' },
    { id: 'ace_6',  text: 'Were your parents ever separated or divorced?' },
    { id: 'ace_7',  text: 'Was your mother or stepmother often or very often pushed, grabbed, slapped, or had something thrown at her? Or sometimes, often, or very often kicked, bitten, hit with a fist, or hit with something hard? Or ever repeatedly hit for at least a few minutes or threatened with a gun or knife?' },
    { id: 'ace_8',  text: 'Did you live with anyone who was a problem drinker or alcoholic, or who used street drugs?' },
    { id: 'ace_9',  text: 'Was a household member depressed or mentally ill, or did a household member attempt suicide?' },
    { id: 'ace_10', text: 'Did a household member go to prison?' },
  ],
  bands: BANDS,
  score(responses) {
    const total = simpleSum(this.items, responses);
    const band = findBand(BANDS, total);
    const flags: string[] = [];
    if (total >= 4) flags.push('ace_high_exposure');
    return { total, severity: band.severity, severityLabel: band.label, guidance: band.guidance, flags };
  },
};
