import { RiskFlag, RiskSeverity } from '@/types';
import { getOpenAIClient, hasOpenAI } from './openai-client';

// ============ RISK PATTERNS (14 categories) ============

const RISK_PATTERNS = {
  suicidal: {
    keywords: ['suicidal', 'kill myself', 'kill myself', 'end it', 'not worth living', 'want to die', 'wish i was dead', 'can\'t go on'],
    severity: RiskSeverity.HIGH,
    interventionType: 'crisis_assessment',
    baseScore: 1.0
  },
  self_harm: {
    keywords: ['cutting myself', 'cut myself', 'self harm', 'self-harm', 'harm myself', 'hurting myself', 'burn myself', 'hit myself', 'scratch myself', 'I cut', 'started cutting'],
    severity: RiskSeverity.HIGH,
    interventionType: 'safety_planning',
    baseScore: 1.0
  },
  substance_escalation: {
    keywords: ['drinking more', 'using more', 'more frequently', 'every day', 'all day', 'addiction', 'overdose', 'tolerance', 'dependence'],
    severity: RiskSeverity.HIGH,
    interventionType: 'substance_monitoring',
    baseScore: 1.0
  },
  domestic_violence: {
    keywords: ['hits me', 'hitting me', 'he hit me', 'she hit me', 'partner hit', 'punched', 'slapped', 'abusive relationship', 'abusive partner', 'domestic violence', 'violent toward', 'beaten up', 'physically abused', 'controlling behavior', 'threaten me', 'threatens me', 'afraid of him', 'afraid of her', 'scared of him', 'scared of her', 'choked me', 'pushed me'],
    severity: RiskSeverity.HIGH,
    interventionType: 'safety_planning',
    baseScore: 1.0
  },
  child_safeguarding: {
    keywords: ['child abuse', 'neglect', 'sexual abuse', 'endangered', 'child safety', 'parent stress', 'harm child', 'protecting child'],
    severity: RiskSeverity.HIGH,
    interventionType: 'mandatory_reporting',
    baseScore: 1.0
  },
  dissociation: {
    keywords: ['dissociate', 'dissociation', 'numb', 'disconnected', 'watching myself', 'detached', 'spacing out', 'blank'],
    severity: RiskSeverity.MEDIUM,
    interventionType: 'grounding',
    baseScore: 0.7
  },
  hopelessness: {
    keywords: ['hopeless', 'pointless', 'no point', 'never get better', 'always be like this', 'nothing works', 'give up'],
    severity: RiskSeverity.MEDIUM,
    interventionType: 'behavioral_activation',
    baseScore: 0.7
  },
  isolation: {
    keywords: ['isolated', 'alone', 'no one understands', 'nobody cares', 'withdrawn', 'by myself', 'lonely'],
    severity: RiskSeverity.MEDIUM,
    interventionType: 'connection_building',
    baseScore: 0.7
  },
  housing_instability: {
    keywords: ['homeless', 'housing', 'eviction', 'unstable housing', 'sleeping rough', 'no place to stay', 'losing apartment', 'rent'],
    severity: RiskSeverity.MEDIUM,
    interventionType: 'resource_referral',
    baseScore: 0.7
  },
  financial_stress: {
    keywords: ['money problems', 'poverty', 'debt', 'bills', 'can\'t afford', 'financial stress', 'struggling financially', 'broke', 'bankruptcy'],
    severity: RiskSeverity.MEDIUM,
    interventionType: 'resource_referral',
    baseScore: 0.7
  },
  employment_crisis: {
    keywords: ['job loss', 'lost job', 'fired', 'unemployed', 'workplace conflict', 'boss', 'coworker', 'work stress', 'toxic workplace'],
    severity: RiskSeverity.MEDIUM,
    interventionType: 'vocational_planning',
    baseScore: 0.7
  },
  caregiver_burnout: {
    keywords: ['caregiver', 'burnout', 'exhausted', 'overwhelmed', 'caring for', 'family member', 'elderly parent', 'ill child', 'tired of caring'],
    severity: RiskSeverity.MEDIUM,
    interventionType: 'respite_support',
    baseScore: 0.7
  },
  sleep_disruption: {
    keywords: ['can\'t sleep', 'insomnia', 'sleeping all day', 'no sleep', 'nightmares', 'waking up'],
    severity: RiskSeverity.LOW,
    interventionType: 'sleep_hygiene',
    baseScore: 0.4
  },
  avoidance: {
    keywords: ['avoiding', 'avoid', 'not dealing with', 'don\'t want to think about', 'staying away from', 'procrastinating'],
    severity: RiskSeverity.LOW,
    interventionType: 'exposure',
    baseScore: 0.4
  }
};

// ============ LAYER PATTERNS ============

const NEGATION_PHRASES = [
  "don't want to",
  "don't need to",
  "no longer",
  "not anymore",
  "would never",
  "used to but",
  "stopped",
  "haven't"
];

const PAST_TENSE_PATTERN = /\b(was|had|tried to|before|used to|previously|back then|years ago)\b/i;
const HYPOTHETICAL_PATTERN = /\b(if i|would i|could i|what if|hypothetically)\b/i;
const PROTECTIVE_FACTORS_PATTERN = /\b(therapist|family|friend|support|hospital|medication|coping|helped|better|improving|safe)\b/i;
const SUPPORT_NETWORK_PATTERN = /\b(family|friend|partner|spouse|group|community|church|team|colleague)\b/i;

// ============ KEYWORD MATCH HELPERS ============

interface KeywordMatch {
  keyword: string;
  index: number;
}

function findKeywordMatches(text: string, keywords: string[]): KeywordMatch[] {
  const lower = text.toLowerCase();
  const matches: KeywordMatch[] = [];

  for (const keyword of keywords) {
    const escaped = keyword.replace(/'/g, "'").replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    let match: RegExpExecArray | null;
    while ((match = regex.exec(lower)) !== null) {
      matches.push({ keyword, index: match.index });
    }
  }

  return matches;
}

// ============ LAYER 2: NEGATION ANALYSIS ============

interface NegationResult {
  detected: boolean;
  multiplier: number;
}

function analyzeNegation(text: string, keywordMatches: KeywordMatch[]): NegationResult {
  const lower = text.toLowerCase();

  for (const match of keywordMatches) {
    const searchStart = Math.max(0, match.index - 50);
    const searchEnd = Math.min(lower.length, match.index + match.keyword.length + 50);
    const window = lower.slice(searchStart, searchEnd);

    for (const phrase of NEGATION_PHRASES) {
      if (window.includes(phrase)) {
        return { detected: true, multiplier: 0.3 };
      }
    }
  }

  return { detected: false, multiplier: 1.0 };
}

// ============ LAYER 3: TEMPORAL ANALYSIS ============

interface TemporalResult {
  pastTense: boolean;
  hypothetical: boolean;
  multiplier: number;
}

function analyzeTemporality(text: string, keywordMatches: KeywordMatch[]): TemporalResult {
  const result: TemporalResult = { pastTense: false, hypothetical: false, multiplier: 1.0 };

  for (const match of keywordMatches) {
    const searchStart = Math.max(0, match.index - 80);
    const searchEnd = Math.min(text.length, match.index + match.keyword.length + 80);
    const window = text.slice(searchStart, searchEnd);

    if (PAST_TENSE_PATTERN.test(window)) {
      result.pastTense = true;
    }
    if (HYPOTHETICAL_PATTERN.test(window)) {
      result.hypothetical = true;
    }
  }

  if (result.hypothetical) {
    result.multiplier *= 0.5;
  }
  if (result.pastTense) {
    result.multiplier *= 0.6;
  }

  return result;
}

// ============ LAYER 4: CONTEXT ANALYSIS ============

interface ContextResult {
  protectiveFactors: boolean;
  supportNetwork: boolean;
  multiplier: number;
}

function analyzeContext(text: string, keywordMatches: KeywordMatch[]): ContextResult {
  const result: ContextResult = { protectiveFactors: false, supportNetwork: false, multiplier: 1.0 };

  for (const match of keywordMatches) {
    const contextStart = Math.max(0, match.index - 200);
    const contextEnd = Math.min(text.length, match.index + match.keyword.length + 200);
    const context = text.slice(contextStart, contextEnd);

    if (PROTECTIVE_FACTORS_PATTERN.test(context)) {
      result.protectiveFactors = true;
    }
    if (SUPPORT_NETWORK_PATTERN.test(context)) {
      result.supportNetwork = true;
    }
  }

  if (result.protectiveFactors) {
    result.multiplier *= 0.7;
  }
  if (result.supportNetwork) {
    result.multiplier *= 0.8;
  }

  return result;
}

// ============ SEVERITY FROM FINAL SCORE ============

function severityFromScore(score: number): RiskSeverity | null {
  if (score > 0.75) return RiskSeverity.HIGH;
  if (score > 0.40) return RiskSeverity.MEDIUM;
  if (score > 0.15) return RiskSeverity.LOW;
  return null;
}

// ============ RECOMMENDATION FROM SEVERITY ============

function recommendationForSeverity(severity: RiskSeverity): string {
  switch (severity) {
    case RiskSeverity.HIGH:
      return 'Immediate safety assessment and crisis planning required. Consider hospitalization if imminent risk.';
    case RiskSeverity.MEDIUM:
      return 'Develop targeted intervention plan. Monitor closely in follow-up sessions.';
    case RiskSeverity.LOW:
      return 'Address in treatment plan. Normalize and support coping strategies.';
  }
}

// ============ BUILD DETAIL STRING ============

function buildDetail(
  patternName: string,
  matchCount: number,
  baseScore: number,
  negation: NegationResult,
  temporal: TemporalResult,
  context: ContextResult,
  finalScore: number
): string {
  const parts: string[] = [
    `Found ${matchCount} instance(s) of ${patternName.replace(/_/g, ' ')} language.`
  ];

  if (negation.detected) {
    parts.push(`Negation detected (score adjusted \u00d70.3).`);
  }
  if (temporal.pastTense) {
    parts.push(`Past tense detected (score adjusted \u00d70.6).`);
  }
  if (temporal.hypothetical) {
    parts.push(`Hypothetical language detected (score adjusted \u00d70.5).`);
  }
  if (context.protectiveFactors) {
    parts.push(`Protective factors present (score adjusted \u00d70.7).`);
  }
  if (context.supportNetwork) {
    parts.push(`Support network mentioned (score adjusted \u00d70.8).`);
  }

  parts.push(`Final adjusted score: ${finalScore.toFixed(2)}`);

  return parts.join(' ');
}

// ============ GPT-4o PATH (unchanged) ============

async function detectWithOpenAI(transcript: string): Promise<RiskFlag[]> {
  const client = getOpenAIClient();
  if (!client) throw new Error('OpenAI client not available');

  const systemPrompt = `You are a clinical psychologist assessing risk in therapy transcripts. Identify clinical risk signals with:
1. Severity: high (imminent danger), medium (concerning pattern), low (awareness/monitoring needed)
2. Signal: brief category name
3. Detail: what you observed
4. Recommendation: clinical intervention

Return JSON: { riskFlags: [{ severity, signal, detail, recommendation }] }`;

  const userPrompt = `Assess risk in this transcript:\n\n${transcript}`;

  try {
    const response = await (client as any).chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const text = response.choices[0]?.message?.content || "";
    if (!text) throw new Error('No response content');

    const jsonMatch = text.match(/\{[\s\S]*riskFlags[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');

    const parsed = JSON.parse(jsonMatch[0]) as { riskFlags: Array<{ severity: RiskSeverity; signal: string; detail: string; interventionType?: string; recommendation?: string }> };
    return (parsed.riskFlags || []).map((flag, i: number) => ({
      id: i,
      severity: flag.severity || RiskSeverity.LOW,
      signal: flag.signal || 'Unknown',
      detail: flag.detail || '',
      algorithmMatch: 'GPT-4o',
      recommendation: flag.recommendation || 'Continue monitoring',
      interventionType: flag.interventionType || 'monitoring'
    }));
  } catch (error) {
    console.error('OpenAI risk detection error:', error);
    throw error;
  }
}

// ============ 4-LAYER CONTEXT-AWARE FALLBACK ============

function detectWithFallback(transcript: string): RiskFlag[] {
  const flags: RiskFlag[] = [];
  let flagId = 0;

  for (const [patternName, pattern] of Object.entries(RISK_PATTERNS)) {
    // Layer 1: Keyword Detection
    const keywordMatches = findKeywordMatches(transcript, pattern.keywords);
    const matchCount = keywordMatches.length;

    if (matchCount === 0) continue;

    let score = pattern.baseScore;

    // Layer 2: Negation Analysis
    const negation = analyzeNegation(transcript, keywordMatches);
    score *= negation.multiplier;

    // Layer 3: Temporal Analysis
    const temporal = analyzeTemporality(transcript, keywordMatches);
    score *= temporal.multiplier;

    // Layer 4: Context Analysis
    const context = analyzeContext(transcript, keywordMatches);
    score *= context.multiplier;

    // Safety floor: HIGH-severity categories (suicidal, self-harm, DV, child safeguarding)
    // must ALWAYS produce at least a LOW flag when keywords match.
    // Past suicidal ideation is a strong predictor — never fully suppress.
    const scoreBeforeFloor = score;
    if (pattern.severity === RiskSeverity.HIGH && score < 0.20) {
      score = 0.20;
    }

    // Determine final severity from adjusted score
    const finalSeverity = severityFromScore(score);

    // Below threshold — don't flag
    if (finalSeverity === null) continue;

    const matchedKeywords = pattern.keywords
      .filter(kw => findKeywordMatches(transcript, [kw]).length > 0)
      .join(', ');

    const detail = buildDetail(
      patternName,
      matchCount,
      pattern.baseScore,
      negation,
      temporal,
      context,
      score
    );

    const finalDetail = scoreBeforeFloor < 0.20 && pattern.severity === RiskSeverity.HIGH
      ? detail + ' Safety floor applied: HIGH-severity signals are never fully suppressed.'
      : detail;

    flags.push({
      id: flagId++,
      severity: finalSeverity,
      signal: patternName.replace(/_/g, ' '),
      detail: finalDetail,
      algorithmMatch: matchedKeywords,
      recommendation: recommendationForSeverity(finalSeverity),
      interventionType: pattern.interventionType
    });
  }

  return flags;
}

// ============ PUBLIC API ============

export async function detectRisks(transcript: string): Promise<RiskFlag[]> {
  if (hasOpenAI()) {
    try {
      return await detectWithOpenAI(transcript);
    } catch (error) {
      console.warn('Falling back to pattern-based risk detection:', error);
      return detectWithFallback(transcript);
    }
  }

  return detectWithFallback(transcript);
}
