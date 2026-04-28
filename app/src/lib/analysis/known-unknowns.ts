import type { AnalysisResult, SimilarCase } from '@/types';

/**
 * Clinical-move guidance attached to a Known-Unknown entry. Two parts:
 *   - observation: WHY this absence matters / what it might indicate
 *   - probe:       a concrete example question the clinician could try
 *                  (optional — falls back to a generic prompt when missing)
 */
export interface ClinicalMove {
  observation: string;
  probe?: string;
}

export interface KnownUnknownEntry {
  id: string;
  /** The theme/concern that's frequent in neighbors but absent here */
  theme: string;
  /** What % of nearest neighbors describe this */
  percentage: number;
  /** Number of neighbor cases this came from */
  caseCount: number;
  /** Total number of neighbor cases compared against */
  totalNeighbors: number;
  /** Source moments from neighbor cases (anonymized story IDs + quote) */
  supportingCases: Array<{
    patientCode: string;
    representativeQuote: string;
  }>;
  /** Clinical move — observation + concrete probe question */
  clinicalMove: ClinicalMove;
  /** What kind of theme: presenting concern, structure, or key theme */
  themeType: 'concern' | 'structure' | 'theme';
}

const STRUCTURE_LABELS: Record<string, string> = {
  body: 'Body',
  prereflective: 'Immediate Experience',
  immediate_experience: 'Immediate Experience',
  emotion: 'Emotion',
  behaviour: 'Behaviour',
  social: 'Social',
  cognitive: 'Cognitive',
  reflective: 'Reflective',
  narrative: 'Narrative',
  ecological: 'Ecological',
  normative: 'Normative',
};

function formatStructure(s: string): string {
  return STRUCTURE_LABELS[s] || s.replace(/_/g, ' ');
}

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

/**
 * Hidden-content surfacing per theme keyword. Each entry pairs a structural
 * observation (why this content commonly stays HIDDEN early in treatment) with
 * a gentle invitational probe the clinician can use to make space for disclosure.
 *
 * IMPORTANT: this section is NOT for surfacing recovery interventions or
 * "what worked for similar clients" — that lives in Solution Matching and
 * Similar Stories. THIS section is for content the current client hasn't named
 * yet that comparable clients commonly carried but only disclosed later.
 *
 * Probes are framed as INVITATIONS, never as interventions. The clinician's
 * job is to make space; whether the client takes it up is theirs to decide.
 */
const CLINICAL_MOVES: Record<string, ClinicalMove> = {
  // ─── Childhood / family-of-origin material commonly hidden early ───
  'childhood': {
    observation: 'Specific childhood memories often surface in comparable trajectories only after enough trust accumulates. Clients may carry vivid material they treat as "not relevant" or "ancient history" until invited to bring it in.',
    probe: 'A gentle invitation: "When this current pattern shows up, does it remind you of anything from earlier in your life — even something that feels too small or too long ago to matter?"',
  },
  'emotional neglect': {
    observation: 'Emotional neglect is one of the most under-disclosed childhood experiences in this profile. Clients often don\'t name it as neglect because nothing overtly bad happened — what was missing is harder to point at than what was present.',
    probe: 'Invite without leading: "Looking back at being a kid — were there things you needed emotionally that didn\'t reliably come from the people around you, even if there was no obvious harm?"',
  },
  'family of origin': {
    observation: 'Family-of-origin dynamics often sit unnamed in early sessions because clients filter what feels "loyal" to share. Comparable cases brought this in once they felt it wouldn\'t be used to indict their family.',
    probe: 'A safe opening: "What were the unspoken rules in your family growing up — about feelings, needs, conflict, or what was okay to talk about?"',
  },
  'parental dynamics': {
    observation: 'Parental conflict, favoritism, or chronic tension that the client witnessed often goes unmentioned because they weren\'t the "target." But comparable clients later named these as foundational.',
    probe: 'A door without a push: "What was it like in your house growing up when your parents were stressed, fighting, or going through hard times?"',
  },
  'sibling dynamics': {
    observation: 'Sibling relationships — especially comparison, parentification, or being the "fine one" — are rarely raised early. Comparable clients later identified them as central organizing forces.',
    probe: 'Try: "What role did you play in your family — were you the responsible one, the fine one, the worry, the peacemaker — and what did siblings see that maybe parents didn\'t?"',
  },

  // ─── Specific commonly-hidden content categories ───
  trauma: {
    observation: 'Comparable clients often carried trauma history that didn\'t surface early because they didn\'t identify what happened to them as "trauma" — the word can feel either too dramatic or too clinical to claim.',
    probe: 'Avoid the loaded word: "Has there been an experience or period in your life where afterward you noticed yourself changed — startled more easily, holding back more, watching more carefully?"',
  },
  shame: {
    observation: 'Shame is the most consistently under-disclosed thread in this profile. Comparable clients usually named it only once explicitly invited and assured it wouldn\'t change how they were seen.',
    probe: 'Make the topic itself sayable: "Is there a part of any of this that feels harder to bring into the room than the rest — something you find yourself editing or stepping around?"',
  },
  'self-criticism': {
    observation: 'Internal self-talk patterns often go unmentioned because clients assume "everyone thinks that way" or feel embarrassed to quote themselves. Comparable cases later named this as central.',
    probe: 'Invite the actual voice: "When you mess something up or fall short, what does the voice in your head actually say to you — word for word, even if it sounds harsh out loud?"',
  },
  'anger': {
    observation: 'Anger toward people the client also loves (especially caregivers) often gets bypassed early. Comparable clients later identified it as a held-back layer beneath the more "acceptable" feelings of grief or guilt.',
    probe: 'Make space for the complicated version: "Is there anyone you love who you also carry some anger toward — even if you also feel guilty about being angry?"',
  },
  'unspoken needs': {
    observation: 'Unmet needs in current relationships often go unmentioned because clients pre-emptively decide they\'re "asking too much." Comparable cases later disclosed needs they\'d been editing out.',
    probe: 'Ask about what gets edited: "Are there things you wish you could ask for from the people closest to you, that you find yourself not asking?"',
  },
  'sleep': {
    observation: 'Sleep difficulties, nightmares, and night-time vulnerability are easy to forget to mention day-of-session. Comparable clients later identified sleep as where the unprocessed material lived.',
    probe: 'Ask about the unguarded hours: "What\'s sleep been like lately — when you\'re falling asleep, in the middle of the night, in your dreams?"',
  },
  'substance': {
    observation: 'Use of alcohol, weed, or other substances to manage difficult feelings often goes unmentioned because clients don\'t see it as "a problem." Comparable clients named it as part of the pattern only when invited non-judgmentally.',
    probe: 'No moralizing: "How do you take the edge off when things feel too much — anything you reach for, drink, smoke, scroll, work, eat — and is it doing what you need it to?"',
  },
  'eating': {
    observation: 'Disordered relationships with food often stay unmentioned in attachment-focused work because clients assume it\'s a different problem. Comparable cases named it once the link to emotional regulation became safer to discuss.',
    probe: 'Open the door without naming a disorder: "What\'s your relationship with food like, especially when you\'re stressed or low — any patterns you\'ve noticed yourself or wished you could change?"',
  },
  'body image': {
    observation: 'Body image and embodied self-experience often go unsaid because clients feel it\'s superficial relative to "the real issues." Comparable clients later identified it as deeply linked.',
    probe: 'Connect it to the emotional layer: "What\'s your relationship with your body been like during this period — how you see it, how you treat it, how you feel inside it?"',
  },
  'sexual': {
    observation: 'Sexual difficulties, history, or experiences are rarely volunteered without explicit invitation. Comparable cases described carrying significant material in this domain that affected the presenting concern.',
    probe: 'Open the topic safely, no expectation to answer now: "I want to make sure there\'s space for it — is there anything in the sexual or intimate part of your life you\'d want to bring in at some point, even if not today?"',
  },
  'religious': {
    observation: 'Religious or spiritual material — including loss of faith, family religious pressure, or experiences in religious communities — often goes unmentioned as if irrelevant. Comparable cases later named it as central.',
    probe: 'Try: "Did religion or spirituality shape your childhood or your current life in any way — and how does that fit (or not fit) with what you\'re going through now?"',
  },
  'stigma': {
    observation: 'Cultural, racial, sexuality, or class-related stigma often gets compartmentalized away from the "therapy stuff." Comparable clients identified it as a quiet pressure shaping what they could even let themselves want.',
    probe: 'Acknowledge the layer exists: "Is there a way the broader world\'s expectations or assumptions about who you are have made any of this harder to navigate or talk about?"',
  },
  'health anxiety': {
    observation: 'Worry about physical health — symptoms checked obsessively, fears about specific illnesses — often goes unmentioned because clients assume it\'s separate from "the real issue." Comparable cases later identified it as part of the pattern.',
    probe: 'Try: "Are there any physical symptoms or health concerns you find yourself worrying about more than feels useful — even ones you\'ve had checked and were told are fine?"',
  },
  'friendships': {
    observation: 'Friendship losses, friend-group dynamics, or chronic loneliness in the friend domain are often skipped over for romantic and family material. Comparable clients later identified them as significant.',
    probe: 'Ask about the friend layer: "What\'s the friendship part of your life been like — close people, recent losses, anyone you\'ve drifted from or wished you were closer to?"',
  },
  'work': {
    observation: 'Work / vocational stress and identity-through-work are rarely raised in attachment-focused sessions because clients separate them mentally. Comparable cases identified work as where suppressed material gets enacted.',
    probe: 'Try: "How are things at work — not just busy or not busy, but how does it feel to be there, who you are when you\'re there, what it gives or takes?"',
  },
  'money': {
    observation: 'Money — especially shame around money, family-of-origin attitudes about money, or financial dependence — is one of the most under-disclosed topics. Comparable cases later named it as a major silent pressure.',
    probe: 'Open the topic without making it transactional: "Is money — having it, not having it, what your family modeled around it — a pressure that\'s shaping any of this in the background?"',
  },
};

function getClinicalMove(theme: string): ClinicalMove {
  const lower = normalize(theme);
  for (const [key, move] of Object.entries(CLINICAL_MOVES)) {
    if (lower.includes(key)) return move;
  }
  return {
    observation: `Comparable clients carried "${theme}" prominently but it hasn't surfaced in this session's coded material. May simply not be present here — but worth a gentle invitation, since this profile sometimes leaves it unnamed early.`,
    probe: `An invitation, no expectation: "I notice some people dealing with similar things have described ${theme.toLowerCase()} — does any of that resonate with what you\'re carrying, or does it feel off?"`,
  };
}

/**
 * Build the set of themes already present in the current session.
 * Includes structures from coded moments + keywords from clinicalPriority.
 */
function getCurrentThemes(analysis: AnalysisResult): Set<string> {
  const set = new Set<string>();

  // 1. Structures from moments
  const moments = Array.isArray(analysis.moments) ? analysis.moments : [];
  moments.forEach((m) => {
    const structures = Array.isArray(m.structures) ? m.structures : [];
    structures.forEach((s) => {
      set.add(normalize(String(s)));
      set.add(normalize(formatStructure(String(s))));
    });
  });

  // 2. Distortions / dominantPatterns from CBT analysis
  const cbt = analysis.cbtAnalysis;
  if (cbt) {
    const dominant = Array.isArray(cbt.dominantPatterns) ? cbt.dominantPatterns : [];
    dominant.forEach((d) => set.add(normalize(d)));
    const distortions = Array.isArray(cbt.distortions) ? cbt.distortions : [];
    distortions.forEach((d) => {
      if (d?.type) set.add(normalize(d.type));
    });
  }

  // 3. clinicalPriority keywords
  const priority = analysis.quickInsight?.clinicalPriority || '';
  priority
    .split(/[\s,;.]+/)
    .map((w) => normalize(w))
    .filter((w) => w.length > 3)
    .forEach((w) => set.add(w));

  return set;
}

interface ThemeRecord {
  display: string;
  cases: SimilarCase[];
  type: 'concern' | 'structure' | 'theme';
}

export function extractKnownUnknowns(analysis: AnalysisResult): KnownUnknownEntry[] {
  if (!analysis) return [];

  const cases = Array.isArray(analysis.similarCases) ? analysis.similarCases : [];
  const totalNeighbors = cases.length;

  // Need a meaningful neighbor pool
  if (totalNeighbors < 3) return [];
  // Don't fabricate from mock data
  if (analysis.analysisStatus === 'mock') return [];

  const currentThemes = getCurrentThemes(analysis);

  // Pool of (normalized → record) collected across all cases
  const pool = new Map<string, ThemeRecord>();

  function addTheme(raw: string, type: 'concern' | 'structure' | 'theme', c: SimilarCase) {
    if (!raw || typeof raw !== 'string') return;
    const display = type === 'structure' ? formatStructure(raw) : raw;
    const key = normalize(display);
    if (!key) return;
    if (!pool.has(key)) {
      pool.set(key, { display, cases: [], type });
    }
    const rec = pool.get(key)!;
    if (!rec.cases.find((x) => x.id === c.id)) {
      rec.cases.push(c);
    }
  }

  cases.forEach((c) => {
    const concerns = Array.isArray(c.presentingConcerns) ? c.presentingConcerns : [];
    const themes = Array.isArray(c.keyThemes) ? c.keyThemes : [];
    const structures = Array.isArray(c.dominantStructures) ? c.dominantStructures : [];
    concerns.forEach((x) => addTheme(x, 'concern', c));
    themes.forEach((x) => addTheme(x, 'theme', c));
    structures.forEach((x) => addTheme(String(x), 'structure', c));
  });

  // Filter: must NOT be present in current session
  // Threshold: caseCount >= 2 AND percentage >= 40
  const entries: KnownUnknownEntry[] = [];

  pool.forEach((rec, key) => {
    if (currentThemes.has(key)) return;
    // Also check normalized display variants
    if (currentThemes.has(normalize(rec.display))) return;

    const caseCount = rec.cases.length;
    const percentage = Math.round((caseCount / totalNeighbors) * 100);

    if (caseCount < 2) return;
    if (percentage < 40) return;

    const supportingCases = rec.cases
      .filter((c) => c.representativeQuote && c.representativeQuote.trim().length > 0)
      .slice(0, 5)
      .map((c) => ({
        patientCode: c.patientCode,
        representativeQuote: c.representativeQuote,
      }));

    entries.push({
      id: `ku-${rec.type}-${key.replace(/\s+/g, '-')}`,
      theme: rec.display,
      percentage,
      caseCount,
      totalNeighbors,
      supportingCases,
      clinicalMove: getClinicalMove(rec.display),
      themeType: rec.type,
    });
  });

  // Sort by percentage descending, then caseCount, then theme name
  entries.sort((a, b) => {
    if (b.percentage !== a.percentage) return b.percentage - a.percentage;
    if (b.caseCount !== a.caseCount) return b.caseCount - a.caseCount;
    return a.theme.localeCompare(b.theme);
  });

  return entries.slice(0, 5);
}
