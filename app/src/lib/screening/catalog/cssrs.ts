import type { ScreeningInstrument, ScoringResult, Severity } from '../types';
import { YES_NO } from './scales';

/**
 * C-SSRS Screener (6-item public-domain screener version).
 *
 * Q1–Q5: past-month ideation/intent/plan/behavior.
 * Q6:    lifetime suicidal behavior.
 *
 * Q3–Q5 only display if Q2 = "Yes" (active ideation in the past month).
 * Risk level is tier-based, not a sum:
 *   - Q6 = Yes (any lifetime behavior) → HIGH RISK
 *   - Q4 or Q5 = Yes (intent or plan)  → HIGH RISK
 *   - Q3 = Yes (method)                → MODERATE RISK
 *   - Q2 = Yes (active ideation)       → MODERATE RISK
 *   - Q1 = Yes only (passive)          → LOW RISK
 *   - All No                            → no acute concern
 */
export const CSSRS: ScreeningInstrument = {
  id: 'cssrs',
  name: 'C-SSRS',
  fullName: 'Columbia Suicide Severity Rating Scale (Screener)',
  description: 'Six-item suicide risk screener. Tier-based risk (low / moderate / high) — not a sum.',
  category: 'risk',
  estimatedMinutes: 2,
  introduction: 'These questions are about thoughts of suicide. Please answer each one honestly — your answers help your therapist provide the right support.',
  defaultScale: YES_NO,
  items: [
    {
      id: 'cssrs_1',
      text: 'Have you wished you were dead or wished you could go to sleep and not wake up?',
      sentinel: 'suicidal_ideation',
    },
    {
      id: 'cssrs_2',
      text: 'Have you actually had any thoughts of killing yourself?',
      sentinel: 'suicidal_ideation',
    },
    {
      id: 'cssrs_3',
      text: 'Have you been thinking about how you might do this?',
      conditional: { showIfItemId: 'cssrs_2', minValue: 1 },
    },
    {
      id: 'cssrs_4',
      text: 'Have you had these thoughts and had some intention of acting on them?',
      conditional: { showIfItemId: 'cssrs_2', minValue: 1 },
    },
    {
      id: 'cssrs_5',
      text: 'Have you started to work out or worked out the details of how to kill yourself? Do you intend to carry out this plan?',
      conditional: { showIfItemId: 'cssrs_2', minValue: 1 },
      sentinel: 'self_harm',
    },
    {
      id: 'cssrs_6',
      text: 'Have you ever done anything, started to do anything, or prepared to do anything to end your life? (Examples: collected pills, got a gun, gave away valuables, wrote a will or suicide note, took out pills but didn\'t swallow any, held a gun but changed your mind, cut yourself, tried to hang yourself, etc.)',
      sentinel: 'self_harm',
    },
  ],
  score(responses): ScoringResult {
    const q = (id: string) => (responses[id] ?? 0) >= 1;
    const flags: string[] = [];

    let severity: Severity = 'minimal';
    let label = 'No risk identified';
    let guidance = '';

    if (q('cssrs_6')) {
      severity = 'very_high_risk';
      label = 'Very high risk — lifetime suicidal behavior endorsed';
      guidance = 'Lifetime suicide attempt or preparatory behavior. Conduct full risk assessment, develop safety plan, and consider higher level of care if current ideation is also present.';
      flags.push('cssrs_lifetime_behavior', 'cssrs_high_risk');
    } else if (q('cssrs_4') || q('cssrs_5')) {
      severity = 'high_risk';
      label = 'High risk — intent or plan endorsed';
      guidance = 'Active ideation with intent or plan. Conduct full risk assessment and develop safety plan before next session.';
      flags.push('cssrs_intent_or_plan', 'cssrs_high_risk');
    } else if (q('cssrs_3')) {
      severity = 'moderate_risk';
      label = 'Moderate risk — ideation with method';
      guidance = 'Active ideation with method consideration. Conduct risk assessment and discuss safety plan.';
      flags.push('cssrs_method_endorsed', 'cssrs_moderate_risk');
    } else if (q('cssrs_2')) {
      severity = 'moderate_risk';
      label = 'Moderate risk — active suicidal ideation';
      guidance = 'Active suicidal ideation in the past month. Conduct risk assessment.';
      flags.push('cssrs_active_ideation', 'cssrs_moderate_risk');
    } else if (q('cssrs_1')) {
      severity = 'low_risk';
      label = 'Low risk — passive ideation';
      guidance = 'Passive death ideation only. Monitor and revisit at follow-up.';
      flags.push('cssrs_passive_ideation', 'cssrs_low_risk');
    }

    // Total: count of YES answers. Useful as a coarse trend indicator
    // across re-screens; not a clinical cutoff.
    const total = (this.items.map((i) => responses[i.id] ?? 0).reduce((s: number, n) => s + n, 0));

    return {
      total,
      severity,
      severityLabel: label,
      guidance,
      flags,
    };
  },
};
