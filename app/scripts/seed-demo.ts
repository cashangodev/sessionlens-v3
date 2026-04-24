/**
 * Demo Seed Script for SessionLens v3
 * Seeds Supabase with realistic clinical demo data for the SympathIQ partnership demo.
 *
 * ONE client, THREE sessions — a carefully crafted clinical narrative demonstrating
 * how SessionLens helps therapists discover things they wouldn't find on their own.
 *
 * Usage: npx tsx scripts/seed-demo.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const DEV_THERAPIST_ID = 'a0000000-0000-0000-0000-000000000001';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE env vars. Check .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT: CL-4521 — Male, 34, software engineer
// Presents with work anxiety. SessionLens discovers perfectionism, sleep
// disturbance, somatic complaints, emotional dysregulation, avoidance behaviors.
// ═══════════════════════════════════════════════════════════════════════════════

const client1 = {
  therapist_id: DEV_THERAPIST_ID,
  client_code: 'CL-4521',
  gender: 'male',
  age_range: 'adult',
  treatment_goals: [
    'Reduce work-related anxiety and somatic symptoms',
    'Address underlying perfectionism and self-critical patterns',
    'Improve sleep quality and emotional regulation',
    'Develop healthy boundary-setting behaviors',
  ],
  presenting_concerns: ['Work-related anxiety', 'Stress', 'Chest tightness', 'Performance pressure'],
  diagnostic_considerations: ['Generalized Anxiety Disorder', 'Adjustment Disorder with Anxiety', 'Insomnia Disorder'],
  current_risk_level: 'low',
  key_themes: ['Perfectionism', 'Sleep disturbance', 'Somatic complaints', 'Emotional dysregulation', 'Avoidance'],
  dominant_structures: ['body', 'emotion', 'cognitive', 'narrative'],
  preferred_approach: 'ACT with somatic integration',
  clinical_notes: 'Male, 34, software engineer presenting with work anxiety and stress. Initial presentation appeared straightforward — workplace performance pressure with anticipatory anxiety. SessionLens pattern-matching revealed a deeper profile: perfectionism rooted in family-of-origin dynamics, unreported sleep disturbance, and emerging somatic complaints. Platform recommended ACT + somatic integration over standard CBT, which proved highly effective. Client showed rapid engagement with ACT defusion techniques and progressive improvement across all outcome measures.',
  total_sessions: 3,
  is_confirmed: true,
  last_confirmed_at: '2026-04-07T10:00:00Z',
  status: 'active',
  created_at: '2026-03-03T09:00:00Z',
  updated_at: '2026-04-07T10:00:00Z',
  outcome_tracking_enabled: true,
  outcome_scores: [
    { date: '2026-03-10', phq9: 16, gad7: 14, note: 'Intake — elevated anxiety, moderate depression. Standard work anxiety presentation.' },
    { date: '2026-03-24', phq9: 12, gad7: 10, note: 'Sleep disturbance and perfectionism confirmed. Pivoting to ACT + somatic approach.' },
    { date: '2026-04-07', phq9: 8, gad7: 6, note: 'Significant improvement — ACT techniques engaging well, boundary-setting emerging.' },
  ],
  deleted_at: null,
};

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION 1: "The Surface" — 2026-03-10
// Standard work anxiety presentation. Client mentions passing out but dismisses
// it. SessionLens flags sleep disturbance and perfectionism before the client
// names them.
// ═══════════════════════════════════════════════════════════════════════════════

const session1 = {
  session_number: 1,
  session_date: '2026-03-10T10:00:00Z',
  treatment_goals: 'Initial assessment; establish therapeutic alliance; identify primary anxiety triggers and somatic symptoms',
  status: 'complete',
  transcript: `Therapist: Thanks for coming in today. Tell me what's been going on for you.

Client: Yeah, so... work has been really stressful. I'm a software engineer — senior level — and the deadlines have been insane lately. I've been having this chest tightness, especially on Sunday nights. Like, I can feel Monday coming. My whole body tenses up.

Therapist: Your body is telling you something. Can you describe that chest tightness a bit more?

Client: It's like a band around my ribs. Sometimes it gets so bad I feel like I can't breathe properly. Actually, I passed out at work about a month ago. I was in a sprint planning meeting and just... went down. They called an ambulance. ER said everything was fine, probably just stress. I went back to work the next day.

Therapist: You passed out at work, went to the ER, and returned to work the next day. What was that like?

Client: I mean, what else was I going to do? We had a release deadline. People were counting on me. I can't just... not show up. I've never missed a deadline in six years.

Therapist: Never missed a deadline in six years. That's a long track record to maintain. What would it mean if you did miss one?

Client: [pause] I don't know. I guess... people would realize I'm not actually that good at this. That I've been faking it. Like, the whole thing would unravel. They'd see I'm just... average.

Therapist: So there's a version of yourself that you're working very hard to keep up. And the cost of that is showing up in your body.

Client: Yeah. When you put it that way, it does sound kind of unsustainable. But I don't really know how to do it differently. This is just how I've always been. My dad used to say "good isn't good enough" — and I guess I just internalized that.

Therapist: That phrase — "good isn't good enough." When you hear it now, what comes up for you?

Client: Honestly? I barely notice it anymore. It's just... the background noise. It's how I operate. Get up, perform, don't complain. Weekends I'm usually so wiped I just zone out watching TV. I don't really do anything.`,
  analysis_result: {
    quickInsight: {
      riskLevel: 'moderate' as const,
      clinicalPriority: 'Workplace anxiety with somatic features and possible perfectionism-driven presentation; screen for sleep disturbance',
      prognosis: 'Good — client demonstrates emerging insight and willingness to explore; somatic symptoms require monitoring',
      topRecommendation: 'Consider ACT with somatic integration over standard CBT; pattern matching suggests superior outcomes for this profile',
      sessionNumber: 1,
    },
    moments: [
      {
        id: 1,
        timestamp: '00:01:45',
        quote: 'I can feel Monday coming. My whole body tenses up.',
        context: 'Somatic presentation of anticipatory anxiety — body-based symptoms dominating the initial disclosure. Classic anxiety somatization.',
        type: 'immediate_experience' as const,
        valence: 'negative' as const,
        intensity: 7,
        structures: ['body' as const, 'emotion' as const, 'immediate_experience' as const],
        therapistMove: 'empathic_attunement' as const,
        therapistQuote: 'Your body is telling you something. Can you describe that chest tightness a bit more?',
      },
      {
        id: 2,
        timestamp: '00:03:30',
        quote: 'I passed out at work about a month ago. They called an ambulance. ER said everything was fine, probably just stress. I went back to work the next day.',
        context: 'Critical disclosure delivered with striking minimization. Syncope event normalized and dismissed — significant somatic complaint treated as inconvenience.',
        type: 'recalled_past' as const,
        valence: 'negative' as const,
        intensity: 8,
        structures: ['body' as const, 'behaviour' as const, 'narrative' as const],
        therapistMove: 'reflection' as const,
        therapistQuote: 'You passed out at work, went to the ER, and returned to work the next day. What was that like?',
      },
      {
        id: 3,
        timestamp: '00:05:15',
        quote: 'I\'ve never missed a deadline in six years.',
        context: 'Perfectionist identity marker — six years of flawless performance used as evidence of competence and self-worth. Behavioral rigidity.',
        type: 'reflective' as const,
        valence: 'mixed' as const,
        intensity: 6,
        structures: ['cognitive' as const, 'narrative' as const, 'normative' as const],
        therapistMove: 'interpretation' as const,
        therapistQuote: 'Never missed a deadline in six years. That\'s a long track record to maintain.',
      },
      {
        id: 4,
        timestamp: '00:07:00',
        quote: 'People would realize I\'m not actually that good at this. That I\'ve been faking it. Like, the whole thing would unravel.',
        context: 'Impostor phenomenon articulated clearly. Core fear of exposure driving perfectionist compensatory behavior.',
        type: 'immediate_experience' as const,
        valence: 'negative' as const,
        intensity: 9,
        structures: ['emotion' as const, 'cognitive' as const, 'social' as const],
        therapistMove: 'empathic_attunement' as const,
        therapistQuote: 'So there\'s a version of yourself that you\'re working very hard to keep up. And the cost of that is showing up in your body.',
      },
      {
        id: 5,
        timestamp: '00:09:30',
        quote: 'My dad used to say "good isn\'t good enough" — and I guess I just internalized that.',
        context: 'Family-of-origin revelation. Perfectionism traced to paternal messaging. Stated with emotional flatness suggesting incomplete processing.',
        type: 'recalled_past' as const,
        valence: 'negative' as const,
        intensity: 7,
        structures: ['narrative' as const, 'cognitive' as const, 'social' as const],
        therapistMove: 'challenge' as const,
        therapistQuote: 'That phrase — "good isn\'t good enough." When you hear it now, what comes up for you?',
      },
      {
        id: 6,
        timestamp: '00:11:45',
        quote: 'Weekends I\'m usually so wiped I just zone out watching TV. I don\'t really do anything.',
        context: 'Avoidance and withdrawal pattern. Weekend collapse suggesting emotional and physical depletion. Possible anhedonia marker.',
        type: 'reflective' as const,
        valence: 'negative' as const,
        intensity: 5,
        structures: ['behaviour' as const, 'emotion' as const, 'ecological' as const],
        therapistMove: 'silence' as const,
        therapistQuote: '[Therapist allowed space for the client to sit with this observation]',
      },
    ],
    riskFlags: [
      {
        id: 1,
        severity: 'medium' as const,
        signal: 'Syncope Event with Minimization',
        detail: 'Client passed out at work, was taken to ER by ambulance, and returned to work the next day. Significant somatic event dismissed as routine — pattern of body-signal override.',
        algorithmMatch: 'syncope, somatic escalation, minimization, ER visit, immediate return to stressor',
        recommendation: 'Obtain medical clearance documentation; monitor for recurrence; establish somatic awareness baseline',
        interventionType: 'immediate',
      },
      {
        id: 2,
        severity: 'medium' as const,
        signal: 'Perfectionism-Driven Overfunction',
        detail: 'Six years without missing a deadline despite escalating physical symptoms. Identity fused with performance. Impostor phenomenon driving compensatory overwork.',
        algorithmMatch: 'perfectionism, impostor syndrome, overwork, identity fusion, performance anxiety',
        recommendation: 'Assess burnout severity using validated measure; explore perfectionism schemas; begin values clarification',
        interventionType: 'monitor',
      },
      {
        id: 3,
        severity: 'low' as const,
        signal: 'Weekend Withdrawal Pattern',
        detail: 'Complete collapse on weekends — "zone out watching TV, don\'t really do anything." Possible anhedonia or exhaustion-driven avoidance.',
        algorithmMatch: 'withdrawal, anhedonia, avoidance, exhaustion, social isolation',
        recommendation: 'Screen for depression severity; assess social connectedness; monitor for worsening withdrawal',
        interventionType: 'monitor',
      },
    ],
    practitionerMatches: [
      {
        id: 1,
        code: 'PM-001',
        name: 'Dr. Elena Vasquez',
        specialty: 'Acceptance and Commitment Therapy with Somatic Integration',
        methodology: 'ACT-Somatic Protocol — combines acceptance and defusion techniques with somatic experiencing and interoceptive awareness training. Targets the perfectionism-anxiety-somatization cycle by building psychological flexibility while simultaneously addressing body-held stress patterns.',
        matchScore: 0.87,
        interventionSequence: [
          'Establish interoceptive awareness baseline — map body-held anxiety patterns and somatic signals',
          'Introduce cognitive defusion for perfectionist self-talk using ACT metaphors (Passengers on the Bus, Hands as Thoughts)',
          'Values clarification to distinguish authentic goals from fear-driven performance',
          'Somatic processing of chest tightness and tension patterns with grounded exposure',
          'Behavioral commitment experiments aligned with values rather than perfectionist standards',
        ],
        outcomePatterns: [
          { metric: 'PHQ-9 reduction', change: '-8.2 points avg over 8 sessions', confidence: 0.88 },
          { metric: 'GAD-7 improvement', change: '-7.8 points avg over 8 sessions', confidence: 0.85 },
          { metric: 'Somatic symptom reduction', change: '-62% reported frequency', confidence: 0.82 },
          { metric: 'Psychological flexibility (AAQ-II)', change: '+34% improvement', confidence: 0.86 },
        ],
        matchReasoning: 'Highest match. Client presents with fused perfectionist identity, body-based anxiety, and somatic symptoms that standard cognitive restructuring often fails to resolve. ACT\'s defusion approach directly targets the "good isn\'t good enough" schema without fighting it, while somatic integration addresses the chest tightness and syncope pattern. Across 10,847 cases in the dataset, this profile responds to ACT + somatic work 23% better than standard CBT.',
        targetStructures: ['body' as const, 'emotion' as const, 'cognitive' as const, 'immediate_experience' as const],
      },
      {
        id: 2,
        code: 'PM-002',
        name: 'Dr. James Whitfield',
        specialty: 'Cognitive-Behavioral Therapy with Behavioral Experiments',
        methodology: 'Modified Beckian CBT Protocol — structured cognitive restructuring targeting catastrophic predictions with systematic behavioral experiments. Emphasizes evidence-gathering against core beliefs through graded exposure to feared outcomes.',
        matchScore: 0.79,
        interventionSequence: [
          'Map automatic thoughts and core beliefs around competence and performance',
          'Introduce thought records targeting catastrophic predictions about deadlines and evaluation',
          'Design behavioral experiments testing predictions (e.g., declining one low-priority task)',
          'Process disconfirming evidence to update core beliefs about self-worth',
          'Develop maintenance plan with ongoing cognitive monitoring and relapse prevention',
        ],
        outcomePatterns: [
          { metric: 'PHQ-9 reduction', change: '-5.8 points avg over 10 sessions', confidence: 0.82 },
          { metric: 'GAD-7 improvement', change: '-6.4 points avg over 10 sessions', confidence: 0.80 },
          { metric: 'Return-to-function rate', change: '+72%', confidence: 0.78 },
          { metric: 'Cognitive distortion frequency', change: '-48% reduction', confidence: 0.84 },
        ],
        matchReasoning: 'Strong match for the cognitive distortion profile — catastrophizing and impostor beliefs are well-targeted by behavioral experiments. However, this approach may underserve the somatic component. Cases with prominent body-based symptoms show 15% lower response rates with pure CBT vs. ACT + somatic protocols.',
        targetStructures: ['cognitive' as const, 'behaviour' as const, 'social' as const],
      },
      {
        id: 3,
        code: 'PM-003',
        name: 'Dr. Sarah Okonkwo',
        specialty: 'Mindfulness-Based Stress Reduction',
        methodology: 'MBSR Adapted for Performance Anxiety — 8-week mindfulness-based protocol adapted for high-performing professionals with anxiety somatization. Integrates body scan meditation, mindful movement, and stress physiology psychoeducation.',
        matchScore: 0.72,
        interventionSequence: [
          'Psychoeducation on stress physiology and the anxiety-performance curve',
          'Introduction to body scan meditation with focus on chest and jaw tension areas',
          'Mindful awareness of perfectionist thought patterns without engagement',
          'Develop daily formal and informal mindfulness practices',
          'Integration into workplace routines — micro-mindfulness at desk, pre-meeting grounding',
        ],
        outcomePatterns: [
          { metric: 'GAD-7 improvement', change: '-5.2 points avg over 8 weeks', confidence: 0.76 },
          { metric: 'Somatic symptom reduction', change: '-45% reported frequency', confidence: 0.74 },
          { metric: 'Perceived stress (PSS)', change: '-38% reduction', confidence: 0.78 },
          { metric: 'Sleep quality improvement', change: '+32% on PSQI', confidence: 0.72 },
        ],
        matchReasoning: 'Good fit for the somatic component and stress physiology. MBSR can build body awareness that this client currently overrides. However, may be insufficient as standalone for the depth of perfectionism and impostor dynamics present. Best considered as adjunct to ACT or CBT.',
        targetStructures: ['body' as const, 'immediate_experience' as const, 'ecological' as const],
      },
      {
        id: 4,
        code: 'PM-004',
        name: 'Dr. Michael Petrov',
        specialty: 'Compassion-Focused Therapy',
        methodology: 'CFT for Self-Critical Perfectionism — targets the inner critic and shame-based self-evaluation through compassionate mind training. Develops the "compassionate self" as alternative to the perfectionist driver.',
        matchScore: 0.65,
        interventionSequence: [
          'Assess threat, drive, and soothing system balance — identify drive system dominance',
          'Psychoeducation on the three-circle model and evolved brain functions',
          'Compassionate imagery and self-to-self relating exercises',
          'Challenge the inner critic voice (father\'s message) with compassionate alternative',
          'Develop compassionate behavioral responses to perceived failure scenarios',
        ],
        outcomePatterns: [
          { metric: 'Self-compassion (SCS)', change: '+42% improvement', confidence: 0.78 },
          { metric: 'PHQ-9 reduction', change: '-4.8 points avg', confidence: 0.72 },
          { metric: 'Self-criticism frequency', change: '-55% reduction', confidence: 0.80 },
          { metric: 'Perfectionism (FMPS)', change: '-28% reduction', confidence: 0.68 },
        ],
        matchReasoning: 'The father\'s "good isn\'t good enough" message and impostor phenomenon suggest a shame-based self-evaluative system that CFT directly addresses. However, client\'s current emotional access is limited — he describes the phrase as "background noise" — which may slow CFT engagement initially.',
        targetStructures: ['emotion' as const, 'cognitive' as const, 'reflective' as const, 'narrative' as const],
      },
      {
        id: 5,
        code: 'PM-005',
        name: 'Dr. Aisha Williams',
        specialty: 'Interpersonal Process Therapy',
        methodology: 'IPT for Workplace Relational Patterns — examines how interpersonal schemas (especially authority-subordinate dynamics) maintain anxiety through people-pleasing, conflict avoidance, and over-responsibility.',
        matchScore: 0.58,
        interventionSequence: [
          'Map interpersonal patterns — identify people-pleasing and conflict avoidance in workplace relationships',
          'Explore parallels between manager dynamics and father relationship',
          'Practice assertive communication and boundary-setting in session through role-play',
          'Generalize assertiveness to workplace interactions with graded difficulty',
          'Consolidate relational gains and develop maintenance strategies for boundary-setting',
        ],
        outcomePatterns: [
          { metric: 'Interpersonal distress', change: '-38% reduction', confidence: 0.70 },
          { metric: 'Assertiveness (RAS)', change: '+45% improvement', confidence: 0.72 },
          { metric: 'GAD-7 improvement', change: '-4.2 points avg', confidence: 0.68 },
          { metric: 'Workplace satisfaction', change: '+35% improvement', confidence: 0.66 },
        ],
        matchReasoning: 'Client\'s inability to say no to his manager and the father-origin perfectionism suggest interpersonal schemas maintaining anxiety. IPT would address the relational driver but may not adequately target somatic symptoms or the broader perfectionist cognitive pattern.',
        targetStructures: ['social' as const, 'narrative' as const, 'behaviour' as const],
      },
    ],
    // 8 similar cases — carefully designed so correlations emerge:
    // "Workplace Anxiety" + "Sleep Disturbance": 6/8 = 75%
    // "Workplace Anxiety" + "Perfectionism": 5/8 = 63%
    // "Somatic Complaints" + "Perfectionism": 4/8 = 50%
    // "Emotional Dysregulation" + "Somatic Complaints": 4/8 = 50%
    similarCases: [
      {
        id: 1,
        patientCode: 'RX-2847',
        matchScore: 0.92,
        presentingConcerns: ['Workplace Anxiety', 'Sleep Disturbance', 'Perfectionism', 'Somatic Complaints'],
        dominantStructures: ['body' as const, 'emotion' as const, 'cognitive' as const, 'narrative' as const],
        sessionCount: 10,
        keyThemes: ['perfectionism', 'insomnia', 'chest tightness', 'performance pressure'],
        outcome: 'significant_improvement',
        outcomeDetail: 'PHQ-9 dropped from 18 to 6 over 10 sessions using ACT + somatic protocol. Breakthrough came when client connected childhood achievement pressure to adult work patterns. Sleep normalized by session 6.',
        representativeQuote: 'I realized I was running on my father\'s operating system. Once I saw the code, I could start rewriting it.',
      },
      {
        id: 2,
        patientCode: 'RX-3104',
        matchScore: 0.88,
        presentingConcerns: ['Workplace Anxiety', 'Sleep Disturbance', 'Perfectionism', 'Emotional Dysregulation'],
        dominantStructures: ['emotion' as const, 'cognitive' as const, 'body' as const, 'reflective' as const],
        sessionCount: 12,
        keyThemes: ['impostor syndrome', 'rumination', 'anger suppression', 'sleep onset insomnia'],
        outcome: 'significant_improvement',
        outcomeDetail: 'GAD-7 improved from 16 to 5 over 12 sessions. Key turning point was learning to defuse from perfectionist thoughts rather than arguing with them. Emotional regulation improved dramatically once sleep was addressed.',
        representativeQuote: 'I used to think my anxiety was the enemy. Now I see it as an alarm system that got stuck — I don\'t need to fight it, I need to recalibrate it.',
      },
      {
        id: 3,
        patientCode: 'RX-1956',
        matchScore: 0.84,
        presentingConcerns: ['Workplace Anxiety', 'Sleep Disturbance', 'Somatic Complaints', 'Emotional Dysregulation'],
        dominantStructures: ['body' as const, 'emotion' as const, 'immediate_experience' as const, 'behaviour' as const],
        sessionCount: 8,
        keyThemes: ['tension headaches', 'jaw clenching', 'insomnia', 'irritability'],
        outcome: 'significant_improvement',
        outcomeDetail: 'Somatic symptoms (headaches, jaw clenching) reduced 70% over 8 sessions. Sleep improved from 4 hours to 7 hours average. Emotional dysregulation addressed through interoceptive awareness training.',
        representativeQuote: 'My body was keeping score of every deadline I white-knuckled through. Learning to listen to it instead of override it changed everything.',
      },
      {
        id: 4,
        patientCode: 'RX-4213',
        matchScore: 0.79,
        presentingConcerns: ['Workplace Anxiety', 'Perfectionism', 'Somatic Complaints', 'Avoidance Behaviors'],
        dominantStructures: ['cognitive' as const, 'body' as const, 'behaviour' as const, 'normative' as const],
        sessionCount: 14,
        keyThemes: ['perfectionism', 'GI distress', 'meeting avoidance', 'procrastination'],
        outcome: 'moderate_improvement',
        outcomeDetail: 'Longer treatment course due to entrenched avoidance patterns. PHQ-9 reduced from 15 to 9. Perfectionism softened but not fully resolved. GI symptoms reduced 40%. Client transferred to group ACT program for continued work.',
        representativeQuote: 'I\'d rather redo a task five times in private than show someone an imperfect first draft. That\'s not excellence — that\'s fear wearing a disguise.',
      },
      {
        id: 5,
        patientCode: 'RX-0871',
        matchScore: 0.75,
        presentingConcerns: ['Workplace Anxiety', 'Sleep Disturbance', 'Avoidance Behaviors', 'Emotional Dysregulation'],
        dominantStructures: ['behaviour' as const, 'emotion' as const, 'body' as const, 'ecological' as const],
        sessionCount: 9,
        keyThemes: ['social withdrawal', 'insomnia', 'emotional flooding', 'work avoidance'],
        outcome: 'significant_improvement',
        outcomeDetail: 'GAD-7 dropped from 17 to 7 over 9 sessions. Sleep disturbance was the primary maintenance factor — once addressed, emotional regulation and avoidance behaviors improved rapidly.',
        representativeQuote: 'Turns out the insomnia wasn\'t a side effect — it was the main event. Fix the sleep, and half the anxiety fixes itself.',
      },
      {
        id: 6,
        patientCode: 'RX-5539',
        matchScore: 0.71,
        presentingConcerns: ['Workplace Anxiety', 'Sleep Disturbance', 'Perfectionism', 'Somatic Complaints', 'Emotional Dysregulation'],
        dominantStructures: ['body' as const, 'cognitive' as const, 'emotion' as const, 'social' as const],
        sessionCount: 11,
        keyThemes: ['perfectionism', 'chest pain', 'insomnia', 'emotional suppression'],
        outcome: 'significant_improvement',
        outcomeDetail: 'Complex presentation with all five factors. ACT + somatic protocol produced significant improvement across all domains. PHQ-9 from 19 to 7. Key was addressing perfectionism and sleep simultaneously rather than sequentially.',
        representativeQuote: 'I spent thirty years trying to be perfect and all I got was exhausted. Letting "good enough" be good enough was the hardest and best thing I\'ve ever done.',
      },
      {
        id: 7,
        patientCode: 'RX-6782',
        matchScore: 0.66,
        presentingConcerns: ['Somatic Complaints', 'Perfectionism', 'Emotional Dysregulation', 'Avoidance Behaviors'],
        dominantStructures: ['body' as const, 'cognitive' as const, 'emotion' as const, 'reflective' as const],
        sessionCount: 7,
        keyThemes: ['tension headaches', 'self-criticism', 'emotional shutdown', 'social avoidance'],
        outcome: 'moderate_improvement',
        outcomeDetail: 'Somatic symptoms reduced 50%. Perfectionism awareness improved but behavioral change was slower. Emotional dysregulation remained a challenge — client benefited from adding DBT distress tolerance skills.',
        representativeQuote: 'The headaches were my body\'s way of saying what my mouth couldn\'t: enough.',
      },
      {
        id: 8,
        patientCode: 'RX-8195',
        matchScore: 0.61,
        presentingConcerns: ['Perfectionism', 'Avoidance Behaviors', 'Somatic Complaints'],
        dominantStructures: ['cognitive' as const, 'behaviour' as const, 'body' as const, 'narrative' as const],
        sessionCount: 6,
        keyThemes: ['impossibly high standards', 'procrastination', 'muscle tension', 'work paralysis'],
        outcome: 'moderate_improvement',
        outcomeDetail: 'Short treatment focused primarily on perfectionism and avoidance cycle. Somatic complaints (chronic muscle tension) reduced 35%. Client continued with self-directed ACT workbook after termination.',
        representativeQuote: 'I always thought perfectionism was my superpower. It\'s actually my kryptonite — it doesn\'t make me better, it makes me stuck.',
      },
    ],
    structureProfile: {
      body: 0.82,
      immediate_experience: 0.68,
      emotion: 0.75,
      behaviour: 0.58,
      social: 0.62,
      cognitive: 0.85,
      reflective: 0.42,
      narrative: 0.72,
      ecological: 0.38,
      normative: 0.65,
    } as Record<string, number>,
    sessionHistory: [
      { session: 1, emotionalIntensity: 7.5, reflectiveCapacity: 4.8, emotionalRegulation: 4.2, therapeuticAlliance: 5.5 },
    ],
    therapistMoves: [
      { type: 'empathic_attunement' as const, count: 2, percentage: 33 },
      { type: 'reflection' as const, count: 1, percentage: 17 },
      { type: 'interpretation' as const, count: 1, percentage: 17 },
      { type: 'challenge' as const, count: 1, percentage: 17 },
      { type: 'silence' as const, count: 1, percentage: 17 },
    ],
    clinicianReport: 'Session 1 assessment reveals a 34-year-old male software engineer presenting with workplace anxiety and prominent somatic features — chest tightness, anticipatory physical distress, and a recent syncope event that was markedly minimized. The client returned to work the day after an ER visit, reflecting a pattern of body-signal override that warrants clinical attention.\n\nBeneath the surface presentation, several deeper patterns are emerging. A six-year streak of never missing a deadline suggests rigid perfectionism fused with professional identity. The disclosure of his father\'s message — "good isn\'t good enough" — points to family-of-origin schemas driving current behavior. Weekend withdrawal and zoning out may indicate early anhedonia or exhaustion-driven avoidance. The client\'s emotional access is currently limited; he describes significant childhood messaging as "background noise."\n\nPattern matching across 10,847 cases flags sleep disturbance (75% co-occurrence) and perfectionism (63%) as likely additional factors not yet reported by the client. ACT with somatic integration is recommended over standard CBT based on outcome data from matched profiles. Recommend screening for sleep disturbance and expanding assessment of perfectionism schemas in the next session.',
    patientReport: 'Thank you for being so open in our first session — it takes courage to sit with these feelings instead of pushing through them the way you usually do. What stood out to me is how hard your body has been working to get your attention: the chest tightness, the Sunday night tension, even the passing out. These aren\'t signs of weakness — they\'re signals that something needs to change.\n\nThe pattern you described — never missing a deadline, going back to work the day after an ER visit, your dad\'s voice saying "good isn\'t good enough" — these are all connected. We\'re going to explore that connection together. I\'d also like to check in about your sleep and how you\'re feeling on the weekends, because those pieces matter more than they might seem right now.\n\nFor this week, I\'d like you to just notice — without trying to change anything — when that chest tightness shows up. What\'s happening? What were you thinking about? You don\'t need to fix it yet. Just notice.',
    cbtAnalysis: {
      distortions: [
        { type: 'Catastrophizing', confidence: 0.88, evidence: 'If I miss a deadline, people would realize I\'m not actually that good at this. The whole thing would unravel.', alternativeThought: 'Missing one deadline in six years would demonstrate humanity, not incompetence. Most colleagues have missed deadlines without career consequences.', momentIndex: 3 },
        { type: 'All-or-Nothing Thinking', confidence: 0.85, evidence: 'I\'m either perfect or I\'m average. Good isn\'t good enough.', alternativeThought: 'Performance exists on a spectrum. Being very good without being perfect is still valuable and sustainable.', momentIndex: 4 },
        { type: 'Mind Reading', confidence: 0.78, evidence: 'People would realize I\'m not actually that good at this. That I\'ve been faking it.', alternativeThought: 'I have no evidence that colleagues view me as faking. Six years of meeting every deadline suggests I am genuinely competent.', momentIndex: 3 },
        { type: 'Minimization', confidence: 0.82, evidence: 'ER said everything was fine, probably just stress. I went back to work the next day.', alternativeThought: 'Passing out and requiring an ambulance is medically significant regardless of ER findings. Returning to work immediately denied my body recovery time.', momentIndex: 1 },
      ],
      overallDistortionLoad: 0.76,
      treatmentReadiness: 0.62,
      dominantPatterns: ['Catastrophizing', 'All-or-Nothing Thinking', 'Mind Reading', 'Minimization'],
      automaticThoughts: [
        { content: 'If I\'m not perfect, I\'m worthless', beliefStrength: 0.85, supportsWellbeing: false },
        { content: 'Asking for help means I can\'t handle it', beliefStrength: 0.80, supportsWellbeing: false },
        { content: 'My body is overreacting — I just need to push through', beliefStrength: 0.78, supportsWellbeing: false },
      ],
      behavioralPatterns: ['Overwork as anxiety management', 'Minimization of physical symptoms', 'Avoidance of vulnerability', 'Weekend withdrawal and collapse'],
    },
    experientialField: {
      scores: [
        { structure: 'embodied_self', intensity: 0.78, clarity: 0.65, description: 'Strong somatic presentation — chest tightness, body tension, anticipatory physical responses' },
        { structure: 'sensory_connection', intensity: 0.35, clarity: 0.30, description: 'Limited environmental awareness; focus is inward on body and work pressure' },
        { structure: 'narrative_self', intensity: 0.52, clarity: 0.45, description: 'Emerging identity narrative around being a "performer" — not yet fully articulated' },
        { structure: 'thought_movements', intensity: 0.68, clarity: 0.55, description: 'Active cognitive processing — catastrophizing about work, racing thoughts about deadlines' },
        { structure: 'phenomenal_distinctions', intensity: 0.40, clarity: 0.35, description: 'Moderate differentiation — can distinguish body from thoughts but merges emotion with physical sensation' },
      ],
      fieldBalance: { directExperience: 0.57, interpretation: 0.60, innerWorld: 0.65, outerWorld: 0.52 },
      phenomenalClarity: 0.40,
      dominantQuadrant: 'inner-direct',
    },
    momentConfidence: [
      { momentId: 1, spontaneity: 0.85, concreteDetail: 0.80, contextualRichness: 0.65, narrativeCoherence: 0.70, overallConfidence: 0.76, therapistInfluence: false },
      { momentId: 2, spontaneity: 0.90, concreteDetail: 0.75, contextualRichness: 0.70, narrativeCoherence: 0.75, overallConfidence: 0.79, therapistInfluence: false },
      { momentId: 3, spontaneity: 0.45, concreteDetail: 0.60, contextualRichness: 0.50, narrativeCoherence: 0.65, overallConfidence: 0.55, therapistInfluence: true, influenceNote: 'Therapist asked directly about sleep patterns' },
      { momentId: 4, spontaneity: 0.80, concreteDetail: 0.85, contextualRichness: 0.75, narrativeCoherence: 0.80, overallConfidence: 0.80, therapistInfluence: false },
      { momentId: 5, spontaneity: 0.70, concreteDetail: 0.55, contextualRichness: 0.45, narrativeCoherence: 0.60, overallConfidence: 0.59, therapistInfluence: false },
      { momentId: 6, spontaneity: 0.75, concreteDetail: 0.70, contextualRichness: 0.60, narrativeCoherence: 0.85, overallConfidence: 0.73, therapistInfluence: false },
    ],
    coOccurrenceNetwork: {
      nodes: [
        { structure: 'body', centrality: 0.92, frequency: 5, isBridge: true },
        { structure: 'immediate_experience', centrality: 0.75, frequency: 4, isBridge: false },
        { structure: 'emotion', centrality: 0.88, frequency: 5, isBridge: true },
        { structure: 'behaviour', centrality: 0.45, frequency: 2, isBridge: false },
        { structure: 'social', centrality: 0.30, frequency: 2, isBridge: false },
        { structure: 'cognitive', centrality: 0.82, frequency: 4, isBridge: false },
        { structure: 'reflective', centrality: 0.35, frequency: 1, isBridge: false },
        { structure: 'narrative', centrality: 0.40, frequency: 2, isBridge: false },
        { structure: 'ecological', centrality: 0.20, frequency: 1, isBridge: false },
        { structure: 'normative', centrality: 0.25, frequency: 1, isBridge: false },
      ],
      edges: [
        { source: 'body', target: 'emotion', weight: 0.85, momentCount: 4 },
        { source: 'body', target: 'immediate_experience', weight: 0.72, momentCount: 3 },
        { source: 'body', target: 'cognitive', weight: 0.65, momentCount: 3 },
        { source: 'emotion', target: 'cognitive', weight: 0.70, momentCount: 3 },
        { source: 'emotion', target: 'immediate_experience', weight: 0.60, momentCount: 2 },
        { source: 'cognitive', target: 'narrative', weight: 0.45, momentCount: 2 },
        { source: 'cognitive', target: 'behaviour', weight: 0.40, momentCount: 1 },
        { source: 'social', target: 'normative', weight: 0.35, momentCount: 1 },
        { source: 'body', target: 'behaviour', weight: 0.30, momentCount: 1 },
      ],
      communities: [
        { id: 0, label: 'Embodied Distress', members: ['body', 'emotion', 'immediate_experience'], description: 'Physical sensations, raw affect, and immediate experience form the core distress cluster — this is where the anxiety lives in the body' },
        { id: 1, label: 'Cognitive Loop', members: ['cognitive', 'narrative', 'behaviour'], description: 'Thinking patterns, self-story, and behavioral responses cluster together — the "worry-and-avoid" loop' },
        { id: 2, label: 'Context', members: ['social', 'ecological', 'normative', 'reflective'], description: 'Peripheral dimensions — relationships, environment, and values are present but not strongly integrated yet' },
      ],
      mostCentral: 'body',
      bridgeDimension: 'emotion',
    },
    narrativeArc: {
      phases: [
        { label: 'Opening', startMomentId: 1, endMomentId: 2, dominantStructures: ['body', 'emotion', 'immediate_experience'], dominantValence: 'negative', description: 'Client presents somatic anxiety — chest tightness, body tension, Monday dread' },
        { label: 'Deepening', startMomentId: 3, endMomentId: 4, dominantStructures: ['cognitive', 'body', 'emotion'], dominantValence: 'negative', description: 'Reveals catastrophic thinking and sleep disruption — SessionLens prediction window opens' },
        { label: 'Emerging Insight', startMomentId: 5, endMomentId: 6, dominantStructures: ['cognitive', 'narrative', 'reflective'], dominantValence: 'mixed', description: 'First glimmers of self-awareness — connects work pattern to deeper self-criticism' },
      ],
      turningPoints: [
        { momentId: 3, type: 'escalation', description: 'Sleep disruption surfaces — client dismisses it but intensity spikes. This is where SessionLens flags the hidden pattern.', structuresBefore: ['body', 'emotion'], structuresAfter: ['cognitive', 'body', 'behaviour'], emotionalShift: { from: 'negative (intensity 7/10)', to: 'negative (intensity 8/10)' } },
        { momentId: 5, type: 'insight', description: 'Client begins connecting work anxiety to self-worth — shifts from somatic to reflective. First metacognitive moment.', structuresBefore: ['cognitive', 'body'], structuresAfter: ['reflective', 'narrative', 'cognitive'], emotionalShift: { from: 'negative (intensity 6/10)', to: 'mixed (intensity 5/10)' } },
      ],
      overallTrajectory: 'emerging',
      gestaltSummary: 'Session opens with somatic distress and moves toward early insight. The client\'s anxiety is experienced primarily in the body, but cognitive patterns (perfectionism, catastrophizing) emerge as the session deepens. The connection between physical symptoms and self-critical narrative is beginning to surface — the experiential architecture is shifting from pure body-emotion toward cognitive-reflective integration.',
    },
    analysisStatus: 'complete' as const,
    analysisWarnings: [],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION 2: "The Revelation" — 2026-03-24
// Everything SessionLens predicted in Session 1 is confirmed by the client.
// Sleep disturbance, perfectionism, somatic escalation, avoidance — all present.
// New patterns emerge: family-of-origin depth, depressive risk if untreated.
// ═══════════════════════════════════════════════════════════════════════════════

const session2 = {
  session_number: 2,
  session_date: '2026-03-24T10:00:00Z',
  treatment_goals: 'Explore sleep disturbance and perfectionism patterns flagged by analysis; assess family-of-origin dynamics; begin ACT framework introduction',
  status: 'complete',
  transcript: `Therapist: Good to see you again. How has the past two weeks been?

Client: Honestly? Not great. I've been thinking a lot about what we talked about — the chest tightness, the pushing through. And I realized there's something I didn't mention last time. I haven't been sleeping. Like, at all. I'm up at 3am most nights, just... lying there, running through every possible thing that could go wrong at work the next day. Every scenario. Every conversation. It's been going on for months.

Therapist: Months. So the sleep disturbance has been there for a while, underneath everything else.

Client: Yeah. I didn't think it was connected. I thought the anxiety was about work and the sleep was just... a separate thing. But after last session, I started noticing — the nights I sleep worst are the nights I've been hardest on myself during the day.

Therapist: That's a really important observation. The perfectionism and the sleep — they're feeding each other.

Client: And there's more. I've been getting these headaches. Like, tension headaches across my forehead and behind my eyes. And I noticed I clench my jaw — I think I do it in my sleep too, because I wake up with my jaw aching. My dentist actually mentioned it last year but I ignored it.

Therapist: Your body has been trying to tell you this for a while.

Client: [long pause] Yeah. Yeah, it has. And I've been ignoring it because... that's what I do. That's what my dad did. He worked sixty-hour weeks his whole life and never complained once. I remember being maybe eight or nine, and I got a 92 on a math test. I was so proud. And he looked at it and said, "Where did the other eight points go?" Just like that. No smile. No "good job." Just... where are the missing points.

Therapist: What was that like for you? That moment?

Client: [voice breaking] I don't think I've ever told anyone that story. I remember feeling like the floor dropped out. Like nothing I did would ever be enough. And I think... I think I've been chasing those eight points my entire life.

Therapist: Chasing those eight points. That's a powerful way to put it.

Client: And the crazy thing is, I've started avoiding things now. I turned down a dinner with friends last weekend because I was too exhausted. I skipped my brother's birthday video call. I told myself I was too tired, but really I think I was afraid they'd see how messed up I am. I don't want anyone to see me like this.

Therapist: So the perfectionism says you have to be fine. And when you're not fine, you withdraw. You hide.

Client: [pause] Yeah. That's exactly it. I'm either performing or I'm hiding. There's no in-between.`,
  analysis_result: {
    quickInsight: {
      riskLevel: 'moderate' as const,
      clinicalPriority: 'Confirmed sleep disturbance and perfectionism pattern; emerging avoidance and emotional dysregulation; family-of-origin schema activated',
      prognosis: 'Good — client showing rapid insight development; emotional access improving; ACT + somatic approach validated by presentation',
      topRecommendation: 'Begin ACT defusion work targeting perfectionist self-talk; add schema elements for family-of-origin pattern; address sleep hygiene as parallel intervention',
      sessionNumber: 2,
    },
    moments: [
      {
        id: 1,
        timestamp: '00:01:15',
        quote: 'I haven\'t been sleeping. I\'m up at 3am most nights, just lying there, running through every possible thing that could go wrong at work the next day.',
        context: 'Sleep disturbance confirmed — exactly as predicted by Session 1 pattern matching. Rumination-driven insomnia with catastrophic anticipatory processing.',
        type: 'immediate_experience' as const,
        valence: 'negative' as const,
        intensity: 8,
        structures: ['body' as const, 'cognitive' as const, 'immediate_experience' as const],
        therapistMove: 'reflection' as const,
        therapistQuote: 'Months. So the sleep disturbance has been there for a while, underneath everything else.',
      },
      {
        id: 2,
        timestamp: '00:03:45',
        quote: 'The nights I sleep worst are the nights I\'ve been hardest on myself during the day.',
        context: 'Client independently identifies the perfectionism-sleep connection. Metacognitive awareness rapidly developing between sessions.',
        type: 'reflective' as const,
        valence: 'mixed' as const,
        intensity: 6,
        structures: ['reflective' as const, 'cognitive' as const, 'body' as const],
        therapistMove: 'interpretation' as const,
        therapistQuote: 'The perfectionism and the sleep — they\'re feeding each other.',
      },
      {
        id: 3,
        timestamp: '00:05:30',
        quote: 'I\'ve been getting these headaches. And I noticed I clench my jaw — I think I do it in my sleep too, because I wake up with my jaw aching.',
        context: 'Somatic complaints expanding — tension headaches and bruxism joining chest tightness. Body holding stress the mind won\'t process.',
        type: 'immediate_experience' as const,
        valence: 'negative' as const,
        intensity: 7,
        structures: ['body' as const, 'immediate_experience' as const, 'emotion' as const],
        therapistMove: 'empathic_attunement' as const,
        therapistQuote: 'Your body has been trying to tell you this for a while.',
      },
      {
        id: 4,
        timestamp: '00:08:00',
        quote: 'I got a 92 on a math test. I was so proud. And he looked at it and said, "Where did the other eight points go?" I think I\'ve been chasing those eight points my entire life.',
        context: 'Core family-of-origin memory surfaced with full emotional charge. Schema crystallization moment — the perfectionism origin story. Voice breaking indicates emotional processing occurring in real time.',
        type: 'recalled_past' as const,
        valence: 'negative' as const,
        intensity: 9,
        structures: ['narrative' as const, 'emotion' as const, 'cognitive' as const, 'social' as const],
        therapistMove: 'empathic_attunement' as const,
        therapistQuote: 'What was that like for you? That moment?',
      },
      {
        id: 5,
        timestamp: '00:11:00',
        quote: 'I turned down a dinner with friends last weekend. I skipped my brother\'s birthday video call. I don\'t want anyone to see me like this.',
        context: 'Avoidance behavior confirmed — social withdrawal driven by perfectionist need to appear "fine." Isolation increasing.',
        type: 'recalled_past' as const,
        valence: 'negative' as const,
        intensity: 7,
        structures: ['behaviour' as const, 'social' as const, 'emotion' as const],
        therapistMove: 'interpretation' as const,
        therapistQuote: 'So the perfectionism says you have to be fine. And when you\'re not fine, you withdraw. You hide.',
      },
      {
        id: 6,
        timestamp: '00:13:00',
        quote: 'I\'m either performing or I\'m hiding. There\'s no in-between.',
        context: 'Client articulates the binary trap with striking clarity. All-or-nothing framework governing social engagement. High insight moment.',
        type: 'reflective' as const,
        valence: 'negative' as const,
        intensity: 8,
        structures: ['reflective' as const, 'cognitive' as const, 'behaviour' as const, 'narrative' as const],
        therapistMove: 'silence' as const,
        therapistQuote: '[Therapist held space, allowing the weight of this recognition to land]',
      },
    ],
    riskFlags: [
      {
        id: 1,
        severity: 'medium' as const,
        signal: 'Chronic Sleep Disturbance',
        detail: 'Months of 3am waking with catastrophic rumination. Sleep onset insomnia and bruxism. Sleep deprivation maintaining and amplifying anxiety, perfectionism, and emotional dysregulation.',
        algorithmMatch: 'insomnia, rumination, sleep onset difficulty, bruxism, 3am waking, catastrophic anticipation',
        recommendation: 'Introduce sleep hygiene protocol; consider sleep restriction therapy; assess for referral to sleep medicine if behavioral interventions insufficient',
        interventionType: 'immediate',
      },
      {
        id: 2,
        severity: 'medium' as const,
        signal: 'Social Withdrawal Escalation',
        detail: 'Declining social invitations, skipping family events, isolating from support network. Perfectionism-driven hiding pattern increasing in scope.',
        algorithmMatch: 'social withdrawal, avoidance, isolation, family avoidance, support network deterioration',
        recommendation: 'Monitor for depressive episode development; gradually reintroduce social contact through values-based behavioral activation',
        interventionType: 'monitor',
      },
      {
        id: 3,
        severity: 'low' as const,
        signal: 'Somatic Symptom Expansion',
        detail: 'Chest tightness now joined by tension headaches and bruxism. Body-held stress accumulating. Dentist flagged jaw clenching a year ago — pattern predates current presentation.',
        algorithmMatch: 'tension headaches, bruxism, jaw clenching, chest tightness, somatic escalation',
        recommendation: 'Continue somatic awareness training; coordinate with dentist regarding night guard; monitor for further somatic expansion',
        interventionType: 'monitor',
      },
    ],
    practitionerMatches: [
      {
        id: 1,
        code: 'PM-001',
        name: 'Dr. Elena Vasquez',
        specialty: 'Acceptance and Commitment Therapy with Somatic Integration',
        methodology: 'ACT-Somatic Protocol — validated by Session 1 predictions and Session 2 confirmation of sleep disturbance, perfectionism, and somatic expansion. Protocol now refined to include sleep-focused components and family-of-origin schema work.',
        matchScore: 0.89,
        interventionSequence: [
          'Defusion from perfectionist self-talk — "Where did the other eight points go?" as target cognition',
          'Somatic awareness and release work for jaw clenching, chest tightness, and tension headaches',
          'Values clarification: What does a meaningful life look like without perfectionist performance?',
          'Sleep-focused ACT intervention — defusion from 3am catastrophic rumination',
          'Behavioral commitment experiments: one social reconnection, one boundary at work',
        ],
        outcomePatterns: [
          { metric: 'PHQ-9 reduction', change: '-8.2 points avg over 8 sessions', confidence: 0.89 },
          { metric: 'GAD-7 improvement', change: '-7.8 points avg over 8 sessions', confidence: 0.86 },
          { metric: 'Sleep quality (PSQI)', change: '+58% improvement', confidence: 0.84 },
          { metric: 'Somatic symptom reduction', change: '-62% reported frequency', confidence: 0.83 },
        ],
        matchReasoning: 'Session 2 strongly validates ACT + somatic as primary approach. All predicted patterns confirmed. Client\'s emerging metaphorical language ("chasing those eight points") indicates natural affinity for ACT\'s metaphor-based defusion work. Somatic component critical given multi-site body symptoms.',
        targetStructures: ['body' as const, 'emotion' as const, 'cognitive' as const, 'narrative' as const],
      },
      {
        id: 2,
        code: 'PM-002',
        name: 'Dr. James Whitfield',
        specialty: 'Cognitive-Behavioral Therapy with Behavioral Experiments',
        methodology: 'Modified Beckian CBT — still applicable for cognitive distortion patterns but increasingly secondary to ACT + somatic given confirmed somatic and sleep presentation.',
        matchScore: 0.76,
        interventionSequence: [
          'Thought records targeting 3am catastrophic predictions',
          'Behavioral experiments testing perfectionist predictions in work settings',
          'Cognitive restructuring of "Where did the other eight points go?" schema',
          'Graded exposure to imperfection through deliberate "good enough" experiments',
          'Relapse prevention and cognitive maintenance plan',
        ],
        outcomePatterns: [
          { metric: 'PHQ-9 reduction', change: '-5.8 points avg over 10 sessions', confidence: 0.80 },
          { metric: 'GAD-7 improvement', change: '-6.4 points avg over 10 sessions', confidence: 0.78 },
          { metric: 'Cognitive distortion frequency', change: '-48% reduction', confidence: 0.82 },
          { metric: 'Sleep improvement', change: '+28% on PSQI', confidence: 0.68 },
        ],
        matchReasoning: 'CBT remains viable for cognitive components but sleep improvement rates are significantly lower than ACT + somatic protocols for this profile (28% vs 58%). The somatic multi-site presentation further favors body-integrative approaches.',
        targetStructures: ['cognitive' as const, 'behaviour' as const, 'social' as const],
      },
      {
        id: 3,
        code: 'PM-006',
        name: 'Dr. Thomas Brennan',
        specialty: 'Schema Therapy',
        methodology: 'Young Schema Therapy — targets early maladaptive schemas (Unrelenting Standards, Defectiveness) activated by family-of-origin dynamics. Uses limited reparenting and experiential techniques to process childhood schema origins.',
        matchScore: 0.74,
        interventionSequence: [
          'Schema identification — map Unrelenting Standards and Defectiveness schemas to childhood origins',
          'Limited reparenting: provide the validation the father\'s response denied',
          'Chair work with the Demanding Parent mode vs. Healthy Adult mode',
          'Experiential processing of the "92 on the math test" memory',
          'Schema mode management for real-world situations — recognizing when the Demanding Parent activates',
        ],
        outcomePatterns: [
          { metric: 'Schema severity (YSQ)', change: '-42% reduction over 12 sessions', confidence: 0.78 },
          { metric: 'PHQ-9 reduction', change: '-5.5 points avg', confidence: 0.74 },
          { metric: 'Self-criticism frequency', change: '-52% reduction', confidence: 0.80 },
          { metric: 'Interpersonal functioning', change: '+38% improvement', confidence: 0.72 },
        ],
        matchReasoning: 'Schema Therapy rises in relevance after Session 2. The "92 on the math test" memory is a textbook schema origin moment. Unrelenting Standards schema clearly activated. Combining ACT + Schema elements produces 78% significant improvement rate in matched cases with family-of-origin perfectionism patterns.',
        targetStructures: ['narrative' as const, 'emotion' as const, 'cognitive' as const, 'reflective' as const],
      },
      {
        id: 4,
        code: 'PM-003',
        name: 'Dr. Sarah Okonkwo',
        specialty: 'Mindfulness-Based Stress Reduction',
        methodology: 'MBSR adapted for chronic stress with sleep component. Body scan meditation and mindful movement to address multi-site somatic symptoms.',
        matchScore: 0.68,
        interventionSequence: [
          'Body scan meditation targeting jaw, chest, and forehead tension areas',
          'Mindful awareness of perfectionist thought patterns during daily activities',
          'Sleep-focused mindfulness — MBSR for insomnia adaptation',
          'Develop daily formal and informal mindfulness practices',
          'Integration of mindfulness into pre-sleep routine and workplace stress moments',
        ],
        outcomePatterns: [
          { metric: 'GAD-7 improvement', change: '-5.2 points avg', confidence: 0.74 },
          { metric: 'Somatic symptom reduction', change: '-45% reported frequency', confidence: 0.72 },
          { metric: 'Sleep quality improvement', change: '+35% on PSQI', confidence: 0.70 },
          { metric: 'Perceived stress (PSS)', change: '-38% reduction', confidence: 0.76 },
        ],
        matchReasoning: 'MBSR addresses somatic and sleep components well but insufficient as standalone for the depth of schema-level perfectionism now confirmed. Best as adjunct technique within ACT framework.',
        targetStructures: ['body' as const, 'immediate_experience' as const, 'ecological' as const],
      },
      {
        id: 5,
        code: 'PM-004',
        name: 'Dr. Michael Petrov',
        specialty: 'Compassion-Focused Therapy',
        methodology: 'CFT for self-critical perfectionism with family-of-origin reparenting elements. Developing the compassionate self as antidote to the paternal Demanding Parent voice.',
        matchScore: 0.63,
        interventionSequence: [
          'Three-circle model psychoeducation — identify threat-drive dominance and depleted soothing system',
          'Compassionate imagery work — developing the compassionate self who responds to the 9-year-old with the math test',
          'Self-to-self compassionate letter writing',
          'Compassionate behavioral responses when perfectionist urges arise',
          'Building sustainable self-compassion practices for ongoing self-care',
        ],
        outcomePatterns: [
          { metric: 'Self-compassion (SCS)', change: '+42% improvement', confidence: 0.76 },
          { metric: 'PHQ-9 reduction', change: '-4.8 points avg', confidence: 0.70 },
          { metric: 'Self-criticism frequency', change: '-55% reduction', confidence: 0.78 },
          { metric: 'Perfectionism (FMPS)', change: '-28% reduction', confidence: 0.66 },
        ],
        matchReasoning: 'Client\'s emotional breakthrough in Session 2 (voice breaking during math test memory) suggests improved emotional access compared to Session 1. CFT now more viable as client can access vulnerability. However, ACT + Schema integration likely more efficient.',
        targetStructures: ['emotion' as const, 'cognitive' as const, 'reflective' as const, 'narrative' as const],
      },
    ],
    // Session 2 correlations:
    // "Sleep Disturbance" + "Emotional Dysregulation": 6/8 = 75%
    // "Perfectionism" + "Family-of-Origin Patterns": 5/8 = 63%
    // "Avoidance Behaviors" + "Emotional Dysregulation": 5/8 = 63%
    // "Untreated Anxiety" + "Depressive Symptoms": 4/8 = 50%
    similarCases: [
      {
        id: 1,
        patientCode: 'RX-3301',
        matchScore: 0.93,
        presentingConcerns: ['Sleep Disturbance', 'Emotional Dysregulation', 'Perfectionism', 'Family-of-Origin Patterns'],
        dominantStructures: ['body' as const, 'emotion' as const, 'cognitive' as const, 'narrative' as const],
        sessionCount: 10,
        keyThemes: ['insomnia', 'emotional flooding', 'perfectionism', 'critical father', 'schema activation'],
        outcome: 'significant_improvement',
        outcomeDetail: 'PHQ-9 from 17 to 5 over 10 sessions. Father\'s critical voice identified as schema origin in session 3. ACT + schema integration produced rapid deactivation of Unrelenting Standards schema. Sleep normalized by session 7.',
        representativeQuote: 'I heard my father in every email from my boss. Once I separated those two voices, the anxiety had nowhere to attach.',
      },
      {
        id: 2,
        patientCode: 'RX-4478',
        matchScore: 0.89,
        presentingConcerns: ['Sleep Disturbance', 'Emotional Dysregulation', 'Avoidance Behaviors', 'Family-of-Origin Patterns'],
        dominantStructures: ['emotion' as const, 'behaviour' as const, 'narrative' as const, 'social' as const],
        sessionCount: 12,
        keyThemes: ['rumination-insomnia cycle', 'emotional shutdown', 'social avoidance', 'maternal enmeshment'],
        outcome: 'significant_improvement',
        outcomeDetail: 'GAD-7 from 15 to 4 over 12 sessions. Family-of-origin patterns (maternal anxiety modeling) driving avoidance and emotional dysregulation. Sleep improved 65% once avoidance cycle interrupted through values-based activation.',
        representativeQuote: 'I was doing exactly what my mother did — retreating into the house when things got hard. Breaking that pattern meant breaking a family tradition.',
      },
      {
        id: 3,
        patientCode: 'RX-2156',
        matchScore: 0.85,
        presentingConcerns: ['Sleep Disturbance', 'Emotional Dysregulation', 'Perfectionism', 'Untreated Anxiety'],
        dominantStructures: ['body' as const, 'cognitive' as const, 'emotion' as const, 'immediate_experience' as const],
        sessionCount: 8,
        keyThemes: ['chronic insomnia', 'emotional suppression', 'impossibly high standards', 'generalized anxiety'],
        outcome: 'significant_improvement',
        outcomeDetail: 'Untreated anxiety of 4+ years duration. PHQ-9 from 19 to 8 over 8 sessions. Emotional dysregulation was the maintenance factor — once client could tolerate distress without perfectionist compensation, both sleep and anxiety improved.',
        representativeQuote: 'Four years of white-knuckling it. I thought that was strength. It was just a slow-motion crisis.',
      },
      {
        id: 4,
        patientCode: 'RX-5892',
        matchScore: 0.81,
        presentingConcerns: ['Avoidance Behaviors', 'Emotional Dysregulation', 'Family-of-Origin Patterns', 'Untreated Anxiety'],
        dominantStructures: ['behaviour' as const, 'emotion' as const, 'narrative' as const, 'reflective' as const],
        sessionCount: 14,
        keyThemes: ['social withdrawal', 'anger suppression', 'paternal criticism', 'generalized anxiety', 'depression risk'],
        outcome: 'moderate_improvement',
        outcomeDetail: 'Longer treatment needed due to deep family-of-origin patterns. PHQ-9 from 16 to 10. Avoidance and emotional dysregulation improved but required ongoing schema work. Depressive symptoms emerged mid-treatment but stabilized with intervention.',
        representativeQuote: 'My dad never said he was proud of me. I spent twenty years trying to earn those words. Therapy helped me stop waiting.',
      },
      {
        id: 5,
        patientCode: 'RX-6234',
        matchScore: 0.77,
        presentingConcerns: ['Sleep Disturbance', 'Avoidance Behaviors', 'Emotional Dysregulation', 'Perfectionism', 'Depressive Symptoms'],
        dominantStructures: ['body' as const, 'emotion' as const, 'behaviour' as const, 'cognitive' as const],
        sessionCount: 11,
        keyThemes: ['insomnia', 'procrastination', 'emotional flooding', 'self-criticism', 'anhedonia'],
        outcome: 'significant_improvement',
        outcomeDetail: 'Depressive symptoms developed after 6 months of untreated anxiety and sleep deprivation. Early intervention with ACT + sleep protocol prevented full depressive episode. PHQ-9 from 18 to 7.',
        representativeQuote: 'The depression crept in through the back door while I was busy fighting the anxiety at the front. Treating the sleep changed everything.',
      },
      {
        id: 6,
        patientCode: 'RX-7103',
        matchScore: 0.73,
        presentingConcerns: ['Perfectionism', 'Family-of-Origin Patterns', 'Sleep Disturbance', 'Emotional Dysregulation'],
        dominantStructures: ['cognitive' as const, 'narrative' as const, 'body' as const, 'emotion' as const],
        sessionCount: 9,
        keyThemes: ['unrelenting standards', 'father\'s expectations', 'chronic insomnia', 'emotional constriction'],
        outcome: 'significant_improvement',
        outcomeDetail: 'Schema therapy + ACT combination. Unrelenting Standards schema from paternal origin reduced 60% on YSQ. Sleep improved from 3.5 to 7 hours. Emotional range expanded significantly.',
        representativeQuote: 'My father gave me his work ethic. He also gave me his inability to rest. I can keep one and let go of the other.',
      },
      {
        id: 7,
        patientCode: 'RX-8467',
        matchScore: 0.68,
        presentingConcerns: ['Avoidance Behaviors', 'Emotional Dysregulation', 'Untreated Anxiety', 'Depressive Symptoms'],
        dominantStructures: ['behaviour' as const, 'emotion' as const, 'body' as const, 'social' as const],
        sessionCount: 16,
        keyThemes: ['social isolation', 'emotional shutdown', 'chronic anxiety', 'emerging depression'],
        outcome: 'moderate_improvement',
        outcomeDetail: 'Untreated anxiety progressed to comorbid depression over 8 months. Longer treatment needed. PHQ-9 peaked at 22 before treatment, reduced to 12. Case illustrates risk of delayed intervention.',
        representativeQuote: 'I waited so long that the anxiety invited depression over for dinner. They became roommates. I should have come sooner.',
      },
      {
        id: 8,
        patientCode: 'RX-9015',
        matchScore: 0.63,
        presentingConcerns: ['Family-of-Origin Patterns', 'Perfectionism', 'Untreated Anxiety', 'Depressive Symptoms'],
        dominantStructures: ['narrative' as const, 'cognitive' as const, 'emotion' as const, 'reflective' as const],
        sessionCount: 13,
        keyThemes: ['maternal perfectionism', 'achievement orientation', 'chronic worry', 'dysthymia'],
        outcome: 'moderate_improvement',
        outcomeDetail: 'Deep family-of-origin perfectionism required extended schema work. Depressive symptoms preceded anxiety treatment by 2 years. PHQ-9 from 20 to 11. Perfectionism partially resolved — ongoing maintenance recommended.',
        representativeQuote: 'My mother made sure I was always the best in class. She thought she was helping. She was building a prison.',
      },
    ],
    structureProfile: {
      body: 0.78,
      immediate_experience: 0.72,
      emotion: 0.82,
      behaviour: 0.68,
      social: 0.65,
      cognitive: 0.80,
      reflective: 0.58,
      narrative: 0.85,
      ecological: 0.35,
      normative: 0.60,
    } as Record<string, number>,
    sessionHistory: [
      { session: 1, emotionalIntensity: 7.5, reflectiveCapacity: 4.8, emotionalRegulation: 4.2, therapeuticAlliance: 5.5 },
      { session: 2, emotionalIntensity: 8.5, reflectiveCapacity: 6.5, emotionalRegulation: 5.0, therapeuticAlliance: 7.2 },
    ],
    therapistMoves: [
      { type: 'empathic_attunement' as const, count: 2, percentage: 33 },
      { type: 'reflection' as const, count: 1, percentage: 17 },
      { type: 'interpretation' as const, count: 2, percentage: 33 },
      { type: 'silence' as const, count: 1, percentage: 17 },
    ],
    clinicianReport: 'Session 2 represents a significant deepening of the therapeutic work. Every pattern flagged by SessionLens after Session 1 has now been confirmed by the client: sleep disturbance (months of 3am waking with catastrophic rumination), perfectionism (traced to a formative childhood memory with his father), somatic symptom expansion (tension headaches and bruxism joining the chest tightness), and avoidance behaviors (declining social invitations, skipping family events).\n\nThe pivotal moment was the "92 on the math test" memory — a textbook schema origin for Unrelenting Standards. The client\'s voice broke as he shared it, indicating genuine emotional processing rather than intellectualized recall. His subsequent articulation — "I\'ve been chasing those eight points my entire life" — demonstrates rapidly developing metacognitive capacity and natural affinity for metaphorical thinking that will serve ACT work well.\n\nThe binary framework he described ("I\'m either performing or I\'m hiding — there\'s no in-between") reveals the all-or-nothing structure maintaining both the perfectionism and the avoidance. Treatment plan updated to ACT + somatic integration with schema therapy elements, as recommended. Sleep hygiene and defusion from 3am rumination will be prioritized alongside the broader perfectionism work. Risk of depressive episode development if current trajectory continues without intervention — similar cases show 50% progression to depressive symptoms when sleep disturbance and avoidance co-occur untreated.',
    patientReport: 'What you shared today took real courage — especially the story about your dad and the math test. That memory has been quietly running your life for twenty-five years, and today you brought it into the light. That\'s not a small thing.\n\nThe connections you\'re making between sessions are impressive: noticing that the nights you sleep worst are the nights you\'ve been hardest on yourself, recognizing that the headaches and jaw clenching are part of the same pattern. Your body and mind are not separate systems — they\'re one system that\'s been working overtime to keep you "perfect."\n\nHere\'s what I want you to sit with this week: you said "I\'m either performing or I\'m hiding." What if there\'s a third option? Not performing, not hiding — just being. We\'re going to work on building that in-between space. For now, I\'d like you to try one thing: when you notice the perfectionist voice (your dad\'s voice, the "where are the other eight points" voice), just notice it. Don\'t argue with it. Don\'t obey it. Just notice it and say to yourself: "There\'s that voice again." That\'s all. We\'ll build from there.',
    cbtAnalysis: {
      distortions: [
        { type: 'Catastrophizing', confidence: 0.90, evidence: 'Running through every possible thing that could go wrong at work the next day at 3am', alternativeThought: 'Most catastrophic predictions never materialize. The 3am mind amplifies threat signals — this is anxiety, not forecasting.', momentIndex: 0 },
        { type: 'All-or-Nothing Thinking', confidence: 0.92, evidence: 'I\'m either performing or I\'m hiding. There\'s no in-between.', alternativeThought: 'Life exists on a spectrum. Being imperfect in public is neither performing nor hiding — it\'s being human.', momentIndex: 5 },
        { type: 'Emotional Reasoning', confidence: 0.80, evidence: 'I was afraid they\'d see how messed up I am', alternativeThought: 'Feeling "messed up" is not the same as being messed up. Friends and family see someone they care about, not a performance review.', momentIndex: 4 },
        { type: 'Should Statements', confidence: 0.85, evidence: 'Where did the other eight points go? (internalized as: I should always get 100%)', alternativeThought: 'The expectation of perfection is not a moral obligation. A 92 is an excellent score by any reasonable standard.', momentIndex: 3 },
      ],
      overallDistortionLoad: 0.78,
      treatmentReadiness: 0.72,
      dominantPatterns: ['All-or-Nothing Thinking', 'Catastrophizing', 'Should Statements', 'Emotional Reasoning'],
      automaticThoughts: [
        { content: 'I\'ve been chasing those eight points my entire life', beliefStrength: 0.88, supportsWellbeing: false },
        { content: 'If they see I\'m not fine, they\'ll see how messed up I really am', beliefStrength: 0.82, supportsWellbeing: false },
        { content: 'The only options are performing or hiding', beliefStrength: 0.80, supportsWellbeing: false },
        { content: 'My body should just cooperate — I need to push through', beliefStrength: 0.75, supportsWellbeing: false },
      ],
      behavioralPatterns: ['Rumination-insomnia cycle', 'Social withdrawal when imperfect', 'Body-signal override', 'Performance-or-hide binary'],
    },
    experientialField: {
      scores: [
        { structure: 'embodied_self', intensity: 0.65, clarity: 0.72, description: 'Body still present but client can now name and locate sensations with greater precision' },
        { structure: 'sensory_connection', intensity: 0.48, clarity: 0.55, description: 'Growing awareness of how environment shapes experience — office, childhood home memories' },
        { structure: 'narrative_self', intensity: 0.82, clarity: 0.75, description: 'Strong identity narrative emerging — connecting current patterns to family-of-origin dynamics' },
        { structure: 'thought_movements', intensity: 0.58, clarity: 0.62, description: 'Active reappraisal of cognitive patterns — beginning to observe thoughts rather than fuse with them' },
        { structure: 'phenomenal_distinctions', intensity: 0.65, clarity: 0.60, description: 'Improving differentiation — can now separate "what I feel" from "what I think about what I feel"' },
      ],
      fieldBalance: { directExperience: 0.57, interpretation: 0.70, innerWorld: 0.74, outerWorld: 0.53 },
      phenomenalClarity: 0.65,
      dominantQuadrant: 'inner-interpretive',
    },
    momentConfidence: [
      { momentId: 1, spontaneity: 0.92, concreteDetail: 0.88, contextualRichness: 0.80, narrativeCoherence: 0.85, overallConfidence: 0.87, therapistInfluence: false },
      { momentId: 2, spontaneity: 0.88, concreteDetail: 0.82, contextualRichness: 0.75, narrativeCoherence: 0.80, overallConfidence: 0.82, therapistInfluence: false },
      { momentId: 3, spontaneity: 0.95, concreteDetail: 0.90, contextualRichness: 0.85, narrativeCoherence: 0.90, overallConfidence: 0.90, therapistInfluence: false },
      { momentId: 4, spontaneity: 0.50, concreteDetail: 0.75, contextualRichness: 0.70, narrativeCoherence: 0.85, overallConfidence: 0.69, therapistInfluence: true, influenceNote: 'Therapist interpretation preceded this disclosure — connecting family patterns' },
      { momentId: 5, spontaneity: 0.85, concreteDetail: 0.80, contextualRichness: 0.72, narrativeCoherence: 0.88, overallConfidence: 0.82, therapistInfluence: false },
      { momentId: 6, spontaneity: 0.78, concreteDetail: 0.72, contextualRichness: 0.65, narrativeCoherence: 0.92, overallConfidence: 0.77, therapistInfluence: false },
    ],
    coOccurrenceNetwork: {
      nodes: [
        { structure: 'body', centrality: 0.60, frequency: 3, isBridge: false },
        { structure: 'immediate_experience', centrality: 0.45, frequency: 2, isBridge: false },
        { structure: 'emotion', centrality: 0.85, frequency: 5, isBridge: true },
        { structure: 'behaviour', centrality: 0.50, frequency: 3, isBridge: false },
        { structure: 'social', centrality: 0.55, frequency: 3, isBridge: false },
        { structure: 'cognitive', centrality: 0.78, frequency: 4, isBridge: true },
        { structure: 'reflective', centrality: 0.72, frequency: 4, isBridge: false },
        { structure: 'narrative', centrality: 0.90, frequency: 5, isBridge: true },
        { structure: 'ecological', centrality: 0.35, frequency: 2, isBridge: false },
        { structure: 'normative', centrality: 0.48, frequency: 2, isBridge: false },
      ],
      edges: [
        { source: 'narrative', target: 'emotion', weight: 0.88, momentCount: 4 },
        { source: 'narrative', target: 'reflective', weight: 0.82, momentCount: 4 },
        { source: 'emotion', target: 'cognitive', weight: 0.75, momentCount: 3 },
        { source: 'narrative', target: 'social', weight: 0.70, momentCount: 3 },
        { source: 'cognitive', target: 'reflective', weight: 0.68, momentCount: 3 },
        { source: 'body', target: 'emotion', weight: 0.55, momentCount: 2 },
        { source: 'emotion', target: 'normative', weight: 0.50, momentCount: 2 },
        { source: 'behaviour', target: 'cognitive', weight: 0.45, momentCount: 2 },
        { source: 'social', target: 'normative', weight: 0.42, momentCount: 1 },
        { source: 'ecological', target: 'narrative', weight: 0.38, momentCount: 1 },
      ],
      communities: [
        { id: 0, label: 'Identity Core', members: ['narrative', 'emotion', 'reflective'], description: 'Life story, feeling, and self-observation form the core — the client is making meaning of their experience' },
        { id: 1, label: 'Cognitive-Behavioral', members: ['cognitive', 'behaviour', 'social'], description: 'Thinking, action, and relationships cluster — patterns of perfectionistic striving in social contexts' },
        { id: 2, label: 'Grounding', members: ['body', 'immediate_experience', 'ecological', 'normative'], description: 'Body, environment, and values provide the sensory ground — less central but stabilising' },
      ],
      mostCentral: 'narrative',
      bridgeDimension: 'emotion',
    },
    narrativeArc: {
      phases: [
        { label: 'Confirmation', startMomentId: 1, endMomentId: 2, dominantStructures: ['body', 'emotion', 'cognitive'], dominantValence: 'negative', description: 'Client confirms SessionLens predictions — sleep disturbance real, perfectionism acknowledged' },
        { label: 'Revelation', startMomentId: 3, endMomentId: 4, dominantStructures: ['narrative', 'emotion', 'social'], dominantValence: 'negative', description: 'Family-of-origin patterns surface — father\'s voice becomes the inner critic. Most phenomenologically rich phase.' },
        { label: 'Reframing', startMomentId: 5, endMomentId: 6, dominantStructures: ['reflective', 'cognitive', 'narrative'], dominantValence: 'mixed', description: 'Client begins to observe patterns rather than just live them — ACT defusion starts working' },
      ],
      turningPoints: [
        { momentId: 3, type: 'crisis', description: 'Family-of-origin revelation — client connects father\'s expectations to current perfectionism. Highest spontaneity score (0.95) and concrete detail. Genuine disclosure.', structuresBefore: ['body', 'emotion'], structuresAfter: ['narrative', 'emotion', 'social'], emotionalShift: { from: 'negative (intensity 7/10)', to: 'negative (intensity 9/10)' } },
        { momentId: 5, type: 'insight', description: 'ACT defusion moment — client begins to separate self from thoughts. "I am not my anxiety" shift. Structural move from narrative-emotion to reflective-cognitive.', structuresBefore: ['narrative', 'emotion', 'social'], structuresAfter: ['reflective', 'cognitive', 'narrative'], emotionalShift: { from: 'negative (intensity 8/10)', to: 'mixed (intensity 5/10)' } },
      ],
      overallTrajectory: 'emerging',
      gestaltSummary: 'The experiential architecture reorganises dramatically in this session. Where Session 1 was body-centred, Session 2 becomes narrative-centred — the client is now making meaning, not just feeling symptoms. The family-of-origin revelation is phenomenologically the richest moment across all sessions (highest spontaneity, concrete detail, and contextual richness). The shift from "I feel anxious" to "I learned to perform for love" represents a fundamental change in how the experience is structured.',
    },
    analysisStatus: 'complete' as const,
    analysisWarnings: [],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION 3: "The Progress" — 2026-04-07
// Client engaging with ACT techniques. Defused from a perfectionist thought.
// Sleeping better. Set a boundary at work. Recognizing his father's voice.
// Risk drops. Prognosis improves to excellent.
// ═══════════════════════════════════════════════════════════════════════════════

const session3 = {
  session_number: 3,
  session_date: '2026-04-07T10:00:00Z',
  treatment_goals: 'Review ACT defusion practice; assess sleep and somatic symptom changes; process boundary-setting experience; reinforce therapeutic gains',
  status: 'complete',
  transcript: `Therapist: How have the last two weeks been?

Client: Actually... good. Like, genuinely good. Something happened at work that I want to tell you about. So we were in a sprint planning meeting — same kind of meeting where I passed out, actually — and my manager was about to assign me another project on top of the three I'm already running. And I felt it start: the chest tightness, the jaw clenching. But this time I noticed it. I actually said to myself, "There's that voice again."

Therapist: You used the defusion technique. What happened next?

Client: I said no. I actually said, "I don't have capacity for this right now." And I didn't die. Nobody fired me. My manager just said, "Okay, I'll ask David." That was it. Six years of terror about saying no, and the answer was just... "okay." I almost laughed in the meeting.

Therapist: That's a significant moment. You felt the old pattern activate, you noticed it, and you chose differently.

Client: And the crazy thing is, I slept that night. Like really slept. I think I got seven hours. I haven't slept seven hours in... I don't even know. Months? And the next few nights were better too. I'm averaging maybe six, six and a half now. The 3am thing still happens sometimes, but not every night. And when it does, I do that thing we talked about — I notice the thoughts instead of getting on the train with them.

Therapist: How does your body feel compared to two weeks ago?

Client: The chest tightness is still there sometimes, but it's... quieter. Like it used to be a shout and now it's more of a murmur. The headaches are less frequent — maybe once a week instead of every day. The jaw thing is still happening at night but my dentist gave me a night guard, which actually helps.

Therapist: So your body is starting to quiet down as you give it permission to not be in constant emergency mode.

Client: Yeah. And there's something else. I was on a call with my brother last week — the one I'd been avoiding — and he said something about our dad. He said, "You know Dad was just scared, right? He pushed us because he was terrified we'd end up like Grandpa." And I'd never thought about it that way. My grandfather was an immigrant who struggled financially his whole life. My dad's perfectionism wasn't just cruelty — it was his fear of failure, passed down. I'm not excusing what he said to nine-year-old me. But understanding where it came from... it loosened something.

Therapist: What did it loosen?

Client: The anger, maybe? Or the grip. Like, I've been carrying his fear as my own. And it doesn't actually belong to me. I can put it down. I don't need to chase those eight points because those were his eight points, not mine.

Therapist: [pause] That's a profound recognition. Those were his eight points, not yours.

Client: I feel lighter. I know I'm not fixed — the anxiety is still there, the perfectionism still pops up. But it doesn't own me the way it did. I have a choice now. I didn't have that before.`,
  analysis_result: {
    quickInsight: {
      riskLevel: 'low' as const,
      clinicalPriority: 'Consolidate therapeutic gains; continue ACT defusion and somatic work; begin relapse prevention planning',
      prognosis: 'Excellent — rapid treatment response; client demonstrating autonomous use of therapeutic techniques; multiple domains improving simultaneously',
      topRecommendation: 'Maintain ACT + somatic approach; introduce relapse prevention in sessions 5-6; consider tapering to biweekly after session 6',
      sessionNumber: 3,
    },
    moments: [
      {
        id: 1,
        timestamp: '00:01:30',
        quote: 'I felt the chest tightness, the jaw clenching. But this time I noticed it. I actually said to myself, "There\'s that voice again."',
        context: 'ACT defusion technique applied in vivo at the exact site of previous syncope. Client bridging therapy learning to real-world application autonomously.',
        type: 'recalled_past' as const,
        valence: 'positive' as const,
        intensity: 7,
        structures: ['body' as const, 'cognitive' as const, 'reflective' as const, 'immediate_experience' as const],
        therapistMove: 'reflection' as const,
        therapistQuote: 'You used the defusion technique. What happened next?',
      },
      {
        id: 2,
        timestamp: '00:03:00',
        quote: 'I said, "I don\'t have capacity for this right now." And I didn\'t die. Nobody fired me. My manager just said, "Okay, I\'ll ask David."',
        context: 'First boundary-setting in six years. Catastrophic prediction directly disconfirmed. Behavioral breakthrough with emotional and somatic mastery.',
        type: 'recalled_past' as const,
        valence: 'positive' as const,
        intensity: 8,
        structures: ['behaviour' as const, 'social' as const, 'cognitive' as const, 'emotion' as const],
        therapistMove: 'empathic_attunement' as const,
        therapistQuote: 'That\'s a significant moment. You felt the old pattern activate, you noticed it, and you chose differently.',
      },
      {
        id: 3,
        timestamp: '00:05:15',
        quote: 'I slept that night. Like really slept. I think I got seven hours. I\'m averaging maybe six, six and a half now.',
        context: 'Sleep improvement directly following boundary-setting — confirming the perfectionism-sleep connection. Physiological regulation improving with psychological flexibility.',
        type: 'immediate_experience' as const,
        valence: 'positive' as const,
        intensity: 6,
        structures: ['body' as const, 'immediate_experience' as const, 'ecological' as const],
        therapistMove: 'reflection' as const,
        therapistQuote: 'How does your body feel compared to two weeks ago?',
      },
      {
        id: 4,
        timestamp: '00:07:30',
        quote: 'The chest tightness is still there sometimes, but it\'s quieter. Like it used to be a shout and now it\'s more of a murmur.',
        context: 'Somatic awareness language developing — client using metaphor to describe body state changes. Shift from body-signal override to body-signal attunement.',
        type: 'immediate_experience' as const,
        valence: 'mixed' as const,
        intensity: 4,
        structures: ['body' as const, 'immediate_experience' as const, 'reflective' as const],
        therapistMove: 'interpretation' as const,
        therapistQuote: 'Your body is starting to quiet down as you give it permission to not be in constant emergency mode.',
      },
      {
        id: 5,
        timestamp: '00:10:00',
        quote: 'I\'ve been carrying his fear as my own. And it doesn\'t actually belong to me. I can put it down. I don\'t need to chase those eight points because those were his eight points, not mine.',
        context: 'Schema deactivation moment. Intergenerational transmission of perfectionism recognized and separated from self. Defusion from father\'s narrative occurring at a deep structural level.',
        type: 'reflective' as const,
        valence: 'positive' as const,
        intensity: 9,
        structures: ['narrative' as const, 'reflective' as const, 'emotion' as const, 'cognitive' as const],
        therapistMove: 'silence' as const,
        therapistQuote: '[Therapist paused to honor the weight of this recognition] That\'s a profound recognition. Those were his eight points, not yours.',
      },
      {
        id: 6,
        timestamp: '00:13:00',
        quote: 'I feel lighter. The anxiety is still there, the perfectionism still pops up. But it doesn\'t own me the way it did. I have a choice now.',
        context: 'Psychological flexibility articulated. Client recognizes ongoing vulnerability while asserting agency. Hallmark of ACT therapeutic response.',
        type: 'reflective' as const,
        valence: 'positive' as const,
        intensity: 7,
        structures: ['reflective' as const, 'emotion' as const, 'cognitive' as const, 'narrative' as const],
        therapistMove: 'empathic_attunement' as const,
        therapistQuote: '[Therapist reflected the significance of this shift with warmth and presence]',
      },
    ],
    riskFlags: [
      {
        id: 1,
        severity: 'low' as const,
        signal: 'Residual Somatic Symptoms',
        detail: 'Chest tightness reduced to "murmur" level. Headaches weekly vs. daily. Jaw clenching ongoing but managed with night guard. All trends favorable.',
        algorithmMatch: 'residual somatic symptoms, improvement trajectory, chest tightness reduced, headache frequency decreased',
        recommendation: 'Continue somatic awareness work; monitor for plateau or regression; maintain dental coordination for bruxism',
        interventionType: 'monitor',
      },
      {
        id: 2,
        severity: 'low' as const,
        signal: 'Intermittent Sleep Disturbance',
        detail: 'Sleep improved from 4 hours to 6-7 hours average. 3am waking still occurs occasionally but client applies defusion technique. Strong positive trajectory.',
        algorithmMatch: 'sleep improvement, intermittent insomnia, defusion application, positive trajectory',
        recommendation: 'Reinforce sleep hygiene gains; continue defusion practice for residual nighttime rumination; reassess at session 5',
        interventionType: 'monitor',
      },
    ],
    practitionerMatches: [
      {
        id: 1,
        code: 'PM-001',
        name: 'Dr. Elena Vasquez',
        specialty: 'Acceptance and Commitment Therapy with Somatic Integration',
        methodology: 'ACT-Somatic Protocol — confirmed as optimal approach. Client demonstrating autonomous defusion, somatic awareness, and values-based behavioral change. Protocol entering consolidation and relapse prevention phase.',
        matchScore: 0.91,
        interventionSequence: [
          'Consolidate defusion gains — expand from perfectionism to other domains where fusion occurs',
          'Deepen somatic awareness — transition from symptom monitoring to interoceptive intelligence',
          'Values-based life design: what does a meaningful career look like without perfectionism as driver?',
          'Introduce relapse prevention framework — identify early warning signs and response plans',
          'Prepare for treatment spacing — build confidence in autonomous skill use between sessions',
        ],
        outcomePatterns: [
          { metric: 'PHQ-9 reduction', change: '-47% avg over 8 sessions (client on track)', confidence: 0.91 },
          { metric: 'GAD-7 improvement', change: '-57% avg over 8 sessions (client exceeding)', confidence: 0.89 },
          { metric: 'Psychological flexibility (AAQ-II)', change: '+38% improvement predicted', confidence: 0.87 },
          { metric: '6-month maintenance rate', change: '63% maintain gains at follow-up', confidence: 0.85 },
        ],
        matchReasoning: 'Client\'s trajectory confirms ACT + somatic as optimal approach. Autonomous use of defusion in the same meeting type where syncope occurred demonstrates genuine skill acquisition, not just compliance. The schema insight about intergenerational perfectionism ("those were his eight points, not mine") shows defusion operating at narrative-structural level. Matched cases show 75% significant improvement with this trajectory.',
        targetStructures: ['body' as const, 'emotion' as const, 'cognitive' as const, 'narrative' as const, 'reflective' as const],
      },
      {
        id: 2,
        code: 'PM-002',
        name: 'Dr. James Whitfield',
        specialty: 'Cognitive-Behavioral Therapy with Behavioral Experiments',
        methodology: 'CBT behavioral experiments — the boundary-setting success functions as a powerful behavioral experiment within any framework. CBT elements remain supportive but ACT is primary driver.',
        matchScore: 0.74,
        interventionSequence: [
          'Document and process the boundary-setting behavioral experiment outcome',
          'Design additional experiments targeting remaining perfectionist predictions',
          'Develop cognitive maintenance plan for ongoing distortion monitoring',
          'Build response plan for high-risk situations (major deadlines, performance reviews)',
          'Transition to self-directed cognitive monitoring with therapist check-ins',
        ],
        outcomePatterns: [
          { metric: 'Behavioral experiment success rate', change: '82% predictions disconfirmed', confidence: 0.84 },
          { metric: 'Cognitive distortion frequency', change: '-52% reduction at current trajectory', confidence: 0.80 },
          { metric: 'Return-to-function rate', change: '+78%', confidence: 0.78 },
          { metric: 'Treatment satisfaction', change: '4.7/5.0', confidence: 0.86 },
        ],
        matchReasoning: 'The boundary-setting success is a textbook behavioral experiment — predicted catastrophe (being fired, being seen as incompetent) vs. actual outcome ("Okay, I\'ll ask David"). This disconfirming evidence is powerful regardless of framework. CBT elements can complement ACT as consolidation progresses.',
        targetStructures: ['cognitive' as const, 'behaviour' as const, 'social' as const],
      },
      {
        id: 3,
        code: 'PM-006',
        name: 'Dr. Thomas Brennan',
        specialty: 'Schema Therapy',
        methodology: 'Schema Therapy — the intergenerational insight (grandfather\'s struggles → father\'s fear → client\'s perfectionism) represents schema-level processing occurring naturally within the ACT framework. Schema elements integrated.',
        matchScore: 0.72,
        interventionSequence: [
          'Process the intergenerational perfectionism insight — grandfather → father → client transmission',
          'Strengthen the Healthy Adult mode that emerged in the boundary-setting moment',
          'Continue separating the Demanding Parent voice from the client\'s authentic values',
          'Chair work to complete the processing of the "92 on the math test" memory if needed',
          'Build schema awareness for ongoing self-monitoring',
        ],
        outcomePatterns: [
          { metric: 'Schema severity (YSQ)', change: '-48% reduction at current trajectory', confidence: 0.80 },
          { metric: 'Self-criticism frequency', change: '-58% reduction', confidence: 0.82 },
          { metric: 'Intergenerational pattern recognition', change: 'Achieved', confidence: 0.92 },
          { metric: 'Healthy Adult mode activation', change: '+45% increase', confidence: 0.78 },
        ],
        matchReasoning: 'The brother\'s revelation about the grandfather provides crucial intergenerational context that deepens the schema work. Client\'s statement "those were his eight points, not mine" represents advanced schema deactivation. Schema elements are being naturally integrated within the ACT framework.',
        targetStructures: ['narrative' as const, 'emotion' as const, 'cognitive' as const, 'reflective' as const],
      },
      {
        id: 4,
        code: 'PM-007',
        name: 'Dr. Lisa Chang',
        specialty: 'Relapse Prevention and Maintenance Therapy',
        methodology: 'Structured Relapse Prevention Protocol — designed for clients showing rapid improvement to ensure durability of gains. Identifies triggers, builds response hierarchies, and creates sustainable self-care routines.',
        matchScore: 0.67,
        interventionSequence: [
          'Map high-risk situations — major deadlines, performance reviews, family gatherings',
          'Develop tiered response plan: green (maintenance), yellow (early warning), red (crisis)',
          'Practice in-session rehearsal of challenging scenarios with ACT tools',
          'Create sustainable daily practices (sleep hygiene, somatic check-ins, defusion)',
          'Design tapering schedule with planned booster sessions',
        ],
        outcomePatterns: [
          { metric: '6-month maintenance rate', change: '68% maintain gains with structured RP', confidence: 0.82 },
          { metric: '12-month maintenance rate', change: '54% maintain gains with booster sessions', confidence: 0.76 },
          { metric: 'Time to relapse (if occurs)', change: 'Extended by avg 4.2 months', confidence: 0.74 },
          { metric: 'Self-efficacy post-treatment', change: '+42% improvement', confidence: 0.80 },
        ],
        matchReasoning: 'New recommendation based on treatment trajectory. Client showing rapid improvement — matched cases suggest introducing relapse prevention in sessions 5-6 to cement gains. Particularly important given the depth of family-of-origin patterns that may reactivate under stress.',
        targetStructures: ['cognitive' as const, 'behaviour' as const, 'reflective' as const, 'ecological' as const],
      },
      {
        id: 5,
        code: 'PM-003',
        name: 'Dr. Sarah Okonkwo',
        specialty: 'Mindfulness-Based Stress Reduction',
        methodology: 'MBSR for maintenance — the client\'s developing somatic awareness ("shout to murmur" metaphor) and nighttime defusion practice align with mindfulness as ongoing self-care tool.',
        matchScore: 0.62,
        interventionSequence: [
          'Formalize the somatic awareness practice the client is already developing',
          'Introduce brief body scan meditation for daily use',
          'Teach mindful transitions between work and home to prevent weekend collapse',
          'Develop pre-sleep mindfulness routine to support continued sleep improvement',
          'Build sustainable 10-minute daily mindfulness practice for long-term maintenance',
        ],
        outcomePatterns: [
          { metric: 'Sustained somatic awareness', change: '+55% at 6-month follow-up', confidence: 0.74 },
          { metric: 'Perceived stress maintenance', change: '-32% sustained reduction', confidence: 0.72 },
          { metric: 'Sleep quality maintenance', change: '+42% sustained on PSQI', confidence: 0.70 },
          { metric: 'Daily practice adherence', change: '58% at 3 months', confidence: 0.68 },
        ],
        matchReasoning: 'Client is naturally developing mindfulness skills (noticing body signals, observing thoughts without engagement). MBSR can formalize these into a sustainable daily practice for long-term maintenance. Best positioned as a maintenance tool rather than primary intervention at this stage.',
        targetStructures: ['body' as const, 'immediate_experience' as const, 'ecological' as const, 'reflective' as const],
      },
    ],
    // Session 3 correlations:
    // "ACT Engagement" + "Significant Improvement": 6/8 = 75%
    // "Boundary Setting" + "Reduced Anxiety": 5/8 = 63%
    // "Somatic Awareness" + "Sleep Improvement": 5/8 = 63%
    // "Schema Recognition" + "Sustained Progress": 4/8 = 50%
    similarCases: [
      {
        id: 1,
        patientCode: 'RX-1124',
        matchScore: 0.94,
        presentingConcerns: ['ACT Engagement', 'Significant Improvement', 'Boundary Setting', 'Reduced Anxiety'],
        dominantStructures: ['cognitive' as const, 'behaviour' as const, 'body' as const, 'reflective' as const],
        sessionCount: 8,
        keyThemes: ['defusion mastery', 'workplace boundaries', 'anxiety reduction', 'values-based action'],
        outcome: 'significant_improvement',
        outcomeDetail: 'PHQ-9 from 17 to 5 over 8 sessions. ACT engagement was the key predictor — client who actively practiced defusion between sessions showed 47% greater improvement than passive participants. Boundary-setting experiments were the behavioral turning point.',
        representativeQuote: 'I stopped fighting the thoughts and started watching them. Turns out they\'re much less scary when you\'re in the audience instead of on the stage.',
      },
      {
        id: 2,
        patientCode: 'RX-2258',
        matchScore: 0.90,
        presentingConcerns: ['ACT Engagement', 'Significant Improvement', 'Somatic Awareness', 'Sleep Improvement'],
        dominantStructures: ['body' as const, 'emotion' as const, 'cognitive' as const, 'immediate_experience' as const],
        sessionCount: 10,
        keyThemes: ['somatic release', 'sleep normalization', 'defusion practice', 'body-mind integration'],
        outcome: 'significant_improvement',
        outcomeDetail: 'Sleep improved from 3.5 to 7.5 hours over 10 sessions. Somatic symptoms reduced 75%. ACT + somatic integration produced improvements across all domains simultaneously rather than sequentially.',
        representativeQuote: 'My body and I are on the same team now. For years we were fighting each other. Turns out all it wanted was for me to listen.',
      },
      {
        id: 3,
        patientCode: 'RX-3392',
        matchScore: 0.86,
        presentingConcerns: ['ACT Engagement', 'Significant Improvement', 'Schema Recognition', 'Boundary Setting'],
        dominantStructures: ['cognitive' as const, 'narrative' as const, 'reflective' as const, 'behaviour' as const],
        sessionCount: 12,
        keyThemes: ['schema deactivation', 'assertiveness development', 'defusion mastery', 'intergenerational insight'],
        outcome: 'significant_improvement',
        outcomeDetail: 'GAD-7 from 16 to 4 over 12 sessions. Schema recognition of father\'s perfectionism was the turning point — once intergenerational transmission was understood, defusion deepened dramatically. Maintained gains at 6-month follow-up.',
        representativeQuote: 'Understanding why my father was the way he was didn\'t excuse it — but it freed me from repeating it.',
      },
      {
        id: 4,
        patientCode: 'RX-4467',
        matchScore: 0.82,
        presentingConcerns: ['Boundary Setting', 'Reduced Anxiety', 'Somatic Awareness', 'Sleep Improvement'],
        dominantStructures: ['behaviour' as const, 'body' as const, 'emotion' as const, 'social' as const],
        sessionCount: 9,
        keyThemes: ['assertiveness', 'anxiety reduction', 'body attunement', 'sleep hygiene'],
        outcome: 'significant_improvement',
        outcomeDetail: 'PHQ-9 from 15 to 6 over 9 sessions. First boundary-setting at work was the behavioral tipping point — anxiety and sleep improved dramatically in the weeks following. Somatic symptoms tracked behavioral changes closely.',
        representativeQuote: 'The first time I said no to my boss, I braced for the sky to fall. It didn\'t. And I slept eight hours that night for the first time in a year.',
      },
      {
        id: 5,
        patientCode: 'RX-5501',
        matchScore: 0.78,
        presentingConcerns: ['ACT Engagement', 'Significant Improvement', 'Somatic Awareness', 'Reduced Anxiety', 'Sleep Improvement'],
        dominantStructures: ['body' as const, 'cognitive' as const, 'emotion' as const, 'reflective' as const],
        sessionCount: 8,
        keyThemes: ['comprehensive improvement', 'ACT skills mastery', 'somatic integration', 'sustained gains'],
        outcome: 'significant_improvement',
        outcomeDetail: 'All five domains improved simultaneously. PHQ-9 from 18 to 7. Average PHQ-9 reduction was 47% over 8 sessions for this treatment trajectory. Client maintained gains at 6-month follow-up with self-directed practice.',
        representativeQuote: 'Everything changed when I realized that anxiety isn\'t a sign I\'m broken — it\'s a sign I care. I just needed to learn to care without destroying myself.',
      },
      {
        id: 6,
        patientCode: 'RX-6639',
        matchScore: 0.73,
        presentingConcerns: ['Boundary Setting', 'Reduced Anxiety', 'ACT Engagement', 'Schema Recognition', 'Sustained Progress'],
        dominantStructures: ['behaviour' as const, 'cognitive' as const, 'narrative' as const, 'social' as const],
        sessionCount: 11,
        keyThemes: ['workplace boundaries', 'anxiety management', 'family pattern recognition', 'long-term maintenance'],
        outcome: 'significant_improvement',
        outcomeDetail: 'GAD-7 from 14 to 5 over 11 sessions. Combined ACT + schema approach. Boundary-setting generalized from workplace to family relationships by session 8. Maintained gains at 6-month follow-up.',
        representativeQuote: 'I set a boundary with my mother last week. If I can do that, I can do anything. The hardest boundaries are the ones you owe to the people you love.',
      },
      {
        id: 7,
        patientCode: 'RX-7712',
        matchScore: 0.67,
        presentingConcerns: ['Schema Recognition', 'Sustained Progress', 'Somatic Awareness', 'Sleep Improvement'],
        dominantStructures: ['narrative' as const, 'reflective' as const, 'body' as const, 'cognitive' as const],
        sessionCount: 14,
        keyThemes: ['intergenerational insight', 'sustained improvement', 'body awareness', 'sleep restoration'],
        outcome: 'moderate_improvement',
        outcomeDetail: 'Longer treatment due to deeper schema work. PHQ-9 from 20 to 10. Schema recognition was slower but once achieved, produced stable improvement. Sleep and somatic gains maintained at follow-up even when mood fluctuated.',
        representativeQuote: 'The insight about my parents didn\'t come like lightning. It came like sunrise — slowly, then all at once. And once I could see clearly, I couldn\'t unsee it.',
      },
      {
        id: 8,
        patientCode: 'RX-8845',
        matchScore: 0.62,
        presentingConcerns: ['ACT Engagement', 'Sustained Progress', 'Schema Recognition', 'Reduced Anxiety'],
        dominantStructures: ['cognitive' as const, 'reflective' as const, 'emotion' as const, 'narrative' as const],
        sessionCount: 10,
        keyThemes: ['defusion practice', 'ongoing improvement', 'family pattern awareness', 'anxiety management'],
        outcome: 'moderate_improvement',
        outcomeDetail: 'PHQ-9 from 16 to 9 over 10 sessions. ACT engagement moderate but consistent. Schema recognition provided context that sustained motivation for change. 63% of similar cases maintained gains at 6-month follow-up.',
        representativeQuote: 'I\'m not cured. I\'m aware. And somehow that\'s better — because awareness is something I chose, and cured is something I\'d just be waiting to lose.',
      },
    ],
    structureProfile: {
      body: 0.72,
      immediate_experience: 0.65,
      emotion: 0.70,
      behaviour: 0.78,
      social: 0.72,
      cognitive: 0.75,
      reflective: 0.82,
      narrative: 0.88,
      ecological: 0.55,
      normative: 0.58,
    } as Record<string, number>,
    sessionHistory: [
      { session: 1, emotionalIntensity: 7.5, reflectiveCapacity: 4.8, emotionalRegulation: 4.2, therapeuticAlliance: 5.5 },
      { session: 2, emotionalIntensity: 8.5, reflectiveCapacity: 6.5, emotionalRegulation: 5.0, therapeuticAlliance: 7.2 },
      { session: 3, emotionalIntensity: 7.0, reflectiveCapacity: 8.2, emotionalRegulation: 7.5, therapeuticAlliance: 8.5 },
    ],
    therapistMoves: [
      { type: 'empathic_attunement' as const, count: 2, percentage: 33 },
      { type: 'reflection' as const, count: 2, percentage: 33 },
      { type: 'interpretation' as const, count: 1, percentage: 17 },
      { type: 'silence' as const, count: 1, percentage: 17 },
    ],
    clinicianReport: 'Session 3 demonstrates significant therapeutic progress across multiple domains. The client applied the ACT defusion technique autonomously during a sprint planning meeting — the same meeting context where his syncope event occurred — and successfully set a boundary with his manager for the first time in six years. The catastrophic prediction ("they\'ll think I\'m incompetent") was directly disconfirmed ("Okay, I\'ll ask David"). This represents a genuine behavioral breakthrough, not compliance.\n\nSleep has improved substantially: from approximately 4 hours with nightly 3am waking to 6-7 hours with intermittent disturbance. Somatic symptoms are reducing — chest tightness described as going from "a shout to a murmur," headaches from daily to weekly, bruxism managed with night guard. The client\'s developing somatic metaphorical language indicates interoceptive awareness is genuinely building rather than being intellectually performed.\n\nThe most clinically significant moment was the intergenerational insight catalyzed by his brother\'s revelation about their grandfather. The client\'s articulation — "those were his eight points, not mine" — represents schema-level deactivation of the Unrelenting Standards pattern. He is differentiating his father\'s fear from his own identity. Prognosis upgraded from "good" to "excellent." PHQ-9 trajectory (16 → 12 → 8) and GAD-7 trajectory (14 → 10 → 6) are consistent with strong treatment response. Recommend introducing relapse prevention framework in sessions 5-6 and considering treatment spacing after session 6. Outcome data from matched cases predicts continued improvement with 75% achieving significant improvement on this trajectory.',
    patientReport: 'What you did in that meeting was extraordinary — not because saying "I don\'t have capacity" is a dramatic act, but because of what it meant for you. Six years of silence, six years of believing the sky would fall if you said no, and then you did it and the sky held. You proved your own catastrophic prediction wrong with evidence you generated yourself. That\'s not me helping you — that\'s you helping yourself.\n\nThe sleep improvement makes perfect sense: your body has been in emergency mode because it believed it had to be. When you gave yourself permission to set a boundary, your body got the message too. The chest tightness going from a "shout to a murmur" is your nervous system recalibrating. Keep listening to it.\n\nWhat your brother said about your grandfather is a piece of the puzzle I\'m glad you have now. Understanding that your father\'s perfectionism came from his own fear doesn\'t erase the impact it had on you — but it does mean you can stop carrying his fear. "Those were his eight points, not mine" is one of the most important things you\'ve said in our work together. You\'re not fixed — and you named that honestly — but you have something you didn\'t have before: a choice. That choice is yours to keep.',
    cbtAnalysis: {
      distortions: [
        { type: 'Catastrophizing (Disconfirmed)', confidence: 0.35, evidence: 'Six years of terror about saying no — predicted firing/incompetence judgment. Actual outcome: "Okay, I\'ll ask David."', alternativeThought: 'The predicted catastrophe was directly tested and did not occur. This is powerful behavioral evidence against the catastrophic prediction pattern.', momentIndex: 1 },
        { type: 'All-or-Nothing Thinking (Softening)', confidence: 0.45, evidence: 'I\'m not fixed — the anxiety is still there, the perfectionism still pops up. But it doesn\'t own me.', alternativeThought: 'Client is spontaneously adopting a spectrum view: improvement without perfection. The all-or-nothing framework is loosening.', momentIndex: 5 },
      ],
      overallDistortionLoad: 0.42,
      treatmentReadiness: 0.88,
      dominantPatterns: ['Catastrophizing (reducing)', 'All-or-Nothing Thinking (softening)', 'Emerging psychological flexibility'],
      automaticThoughts: [
        { content: 'Those were his eight points, not mine', beliefStrength: 0.75, supportsWellbeing: true },
        { content: 'I have a choice now — I didn\'t have that before', beliefStrength: 0.80, supportsWellbeing: true },
        { content: 'The anxiety is still there but it doesn\'t own me', beliefStrength: 0.72, supportsWellbeing: true },
      ],
      behavioralPatterns: ['Autonomous defusion practice', 'Boundary-setting at work', 'Social reconnection (brother call)', 'Somatic self-monitoring', 'Sleep improvement through reduced rumination'],
    },
    experientialField: {
      scores: [
        { structure: 'embodied_self', intensity: 0.50, clarity: 0.80, description: 'Body awareness now a tool rather than a threat — client uses somatic check-ins deliberately' },
        { structure: 'sensory_connection', intensity: 0.60, clarity: 0.70, description: 'Reconnection with environment — noticing nature, workspace changes, social settings positively' },
        { structure: 'narrative_self', intensity: 0.72, clarity: 0.82, description: 'Identity narrative integrating — "I am someone who is learning" rather than "I am broken"' },
        { structure: 'thought_movements', intensity: 0.55, clarity: 0.75, description: 'Cognitive patterns shifting — can catch catastrophizing in real-time, beginning to defuse' },
        { structure: 'phenomenal_distinctions', intensity: 0.78, clarity: 0.80, description: 'High differentiation — clearly distinguishes body from emotion from thought. Can observe own experience.' },
      ],
      fieldBalance: { directExperience: 0.55, interpretation: 0.64, innerWorld: 0.61, outerWorld: 0.58 },
      phenomenalClarity: 0.78,
      dominantQuadrant: 'inner-interpretive',
    },
    momentConfidence: [
      { momentId: 1, spontaneity: 0.88, concreteDetail: 0.85, contextualRichness: 0.82, narrativeCoherence: 0.90, overallConfidence: 0.87, therapistInfluence: false },
      { momentId: 2, spontaneity: 0.82, concreteDetail: 0.78, contextualRichness: 0.75, narrativeCoherence: 0.88, overallConfidence: 0.81, therapistInfluence: false },
      { momentId: 3, spontaneity: 0.90, concreteDetail: 0.88, contextualRichness: 0.80, narrativeCoherence: 0.92, overallConfidence: 0.88, therapistInfluence: false },
      { momentId: 4, spontaneity: 0.78, concreteDetail: 0.82, contextualRichness: 0.78, narrativeCoherence: 0.85, overallConfidence: 0.81, therapistInfluence: false },
      { momentId: 5, spontaneity: 0.92, concreteDetail: 0.90, contextualRichness: 0.85, narrativeCoherence: 0.95, overallConfidence: 0.91, therapistInfluence: false },
      { momentId: 6, spontaneity: 0.85, concreteDetail: 0.80, contextualRichness: 0.78, narrativeCoherence: 0.90, overallConfidence: 0.84, therapistInfluence: false },
    ],
    coOccurrenceNetwork: {
      nodes: [
        { structure: 'body', centrality: 0.50, frequency: 3, isBridge: false },
        { structure: 'immediate_experience', centrality: 0.40, frequency: 2, isBridge: false },
        { structure: 'emotion', centrality: 0.72, frequency: 4, isBridge: false },
        { structure: 'behaviour', centrality: 0.68, frequency: 4, isBridge: true },
        { structure: 'social', centrality: 0.65, frequency: 3, isBridge: false },
        { structure: 'cognitive', centrality: 0.70, frequency: 4, isBridge: false },
        { structure: 'reflective', centrality: 0.88, frequency: 5, isBridge: true },
        { structure: 'narrative', centrality: 0.80, frequency: 4, isBridge: false },
        { structure: 'ecological', centrality: 0.55, frequency: 3, isBridge: false },
        { structure: 'normative', centrality: 0.45, frequency: 2, isBridge: false },
      ],
      edges: [
        { source: 'reflective', target: 'narrative', weight: 0.85, momentCount: 4 },
        { source: 'reflective', target: 'behaviour', weight: 0.78, momentCount: 3 },
        { source: 'reflective', target: 'cognitive', weight: 0.75, momentCount: 3 },
        { source: 'emotion', target: 'social', weight: 0.72, momentCount: 3 },
        { source: 'behaviour', target: 'social', weight: 0.68, momentCount: 3 },
        { source: 'narrative', target: 'emotion', weight: 0.65, momentCount: 2 },
        { source: 'ecological', target: 'social', weight: 0.58, momentCount: 2 },
        { source: 'body', target: 'reflective', weight: 0.52, momentCount: 2 },
        { source: 'cognitive', target: 'behaviour', weight: 0.50, momentCount: 2 },
        { source: 'ecological', target: 'behaviour', weight: 0.45, momentCount: 2 },
      ],
      communities: [
        { id: 0, label: 'Reflective Core', members: ['reflective', 'narrative', 'cognitive'], description: 'Self-observation, meaning-making, and thought patterns form the new centre — the client is processing, not just experiencing' },
        { id: 1, label: 'Social Reconnection', members: ['emotion', 'social', 'ecological'], description: 'Feelings, relationships, and environment clustering — recovery is being narrated through reconnection with people and places' },
        { id: 2, label: 'Embodied Action', members: ['body', 'behaviour', 'immediate_experience', 'normative'], description: 'Physical experience connected to new behavioral choices and values — embodied change, not just cognitive' },
      ],
      mostCentral: 'reflective',
      bridgeDimension: 'behaviour',
    },
    narrativeArc: {
      phases: [
        { label: 'Progress Report', startMomentId: 1, endMomentId: 2, dominantStructures: ['reflective', 'body', 'emotion'], dominantValence: 'positive', description: 'Client reports concrete improvements — sleep better, physical symptoms reduced, awareness growing' },
        { label: 'Integration', startMomentId: 3, endMomentId: 4, dominantStructures: ['narrative', 'reflective', 'behaviour'], dominantValence: 'mixed', description: 'Connecting insights to daily life — boundary-setting at work, observing perfectionism in real-time' },
        { label: 'Forward Vision', startMomentId: 5, endMomentId: 6, dominantStructures: ['narrative', 'social', 'ecological'], dominantValence: 'positive', description: 'Client articulates a new self-story — "I am learning to be enough." Social and environmental reconnection.' },
      ],
      turningPoints: [
        { momentId: 3, type: 'insight', description: 'Integration moment — client describes catching a perfectionist thought mid-meeting and choosing differently. Behavioral change grounded in reflective awareness.', structuresBefore: ['reflective', 'body'], structuresAfter: ['narrative', 'behaviour', 'cognitive'], emotionalShift: { from: 'positive (intensity 4/10)', to: 'mixed (intensity 5/10)' } },
        { momentId: 5, type: 'resolution', description: 'New narrative crystallises — client moves from "I am my anxiety" to "I am someone learning a new way." Highest narrative coherence across all sessions (0.95).', structuresBefore: ['narrative', 'behaviour'], structuresAfter: ['narrative', 'social', 'ecological'], emotionalShift: { from: 'mixed (intensity 5/10)', to: 'positive (intensity 3/10)' } },
      ],
      overallTrajectory: 'improving',
      gestaltSummary: 'The experiential architecture has fundamentally reorganised. Where Session 1 was body-centred (anxiety in the chest) and Session 2 was narrative-centred (making meaning of family patterns), Session 3 is reflective-centred — the client can now observe their own experience. The most central dimension has shifted from body → narrative → reflective across three sessions. This is the phenomenological signature of therapeutic change: not the absence of symptoms, but the capacity to hold and observe experience. Phenomenal clarity has risen from 0.40 to 0.78.',
    },
    analysisStatus: 'complete' as const,
    analysisWarnings: [],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('🌱 SessionLens v3 Demo Seed Script');
  console.log('═══════════════════════════════════════════');
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`Therapist ID: ${DEV_THERAPIST_ID}`);
  console.log('');

  // Step 1: Delete ALL existing demo data (aggressive cleanup)
  console.log('🗑️  Cleaning ALL existing demo data...');

  // First get all client IDs for this therapist
  const { data: existingClients } = await supabase
    .from('clients')
    .select('client_id')
    .eq('therapist_id', DEV_THERAPIST_ID);

  const clientIds = (existingClients || []).map((c: { client_id: string }) => c.client_id);

  // Delete outcome scores for these clients
  if (clientIds.length > 0) {
    await supabase.from('outcome_scores').delete().in('client_id', clientIds);
    console.log('  ✓ Outcome scores deleted');
  }

  // Delete sessions for these clients
  if (clientIds.length > 0) {
    await supabase.from('sessions').delete().in('client_id', clientIds);
    console.log('  ✓ Sessions deleted (by client_id)');
  }

  // Also delete sessions by therapist_id as backup
  const { error: delSessionsErr } = await supabase
    .from('sessions')
    .delete()
    .eq('therapist_id', DEV_THERAPIST_ID);

  if (delSessionsErr) {
    console.error('  Note: session cleanup by therapist_id:', delSessionsErr.message);
  } else {
    console.log('  ✓ Sessions deleted (by therapist_id)');
  }

  // Delete ALL clients for this therapist
  const { error: delClientsErr } = await supabase
    .from('clients')
    .delete()
    .eq('therapist_id', DEV_THERAPIST_ID);

  if (delClientsErr) {
    console.error('  Error deleting clients:', delClientsErr.message);
    // Fallback: delete known client codes
    for (const code of ['CL-4521', 'CL-7803', 'CL-2156']) {
      await supabase.from('clients').delete().eq('client_code', code).eq('therapist_id', DEV_THERAPIST_ID);
    }
    console.log('  ✓ Clients cleaned up (fallback)');
  } else {
    console.log(`  ✓ ${clientIds.length} clients deleted`);
  }

  console.log('');

  // Extra cleanup: delete CL-4521 by client_code directly (catches orphaned records)
  await supabase.from('clients').delete().eq('client_code', 'CL-4521');
  console.log('  ✓ CL-4521 force-cleaned by client_code');
  console.log('');

  // Step 2: Insert client
  console.log('👤 Inserting client...');

  const { data: clientData, error: clientErr } = await supabase
    .from('clients')
    .insert(client1)
    .select('client_id, client_code')
    .single();

  let finalClientId: string;
  let finalClientCode: string;

  if (clientErr) {
    console.error(`  ✗ Error inserting ${client1.client_code}:`, clientErr.message);
    // Try to find the existing client
    console.log('  ↻ Looking for existing CL-4521...');
    const { data: existing } = await supabase
      .from('clients')
      .select('client_id, client_code')
      .eq('client_code', 'CL-4521')
      .single();
    if (existing) {
      finalClientId = existing.client_id;
      finalClientCode = existing.client_code;
      console.log(`  ✓ Found existing ${finalClientCode} → ${finalClientId}`);
      // Clean out old sessions for this client
      await supabase.from('sessions').delete().eq('client_id', finalClientId);
      await supabase.from('outcome_scores').delete().eq('client_id', finalClientId);
      // Update the client record
      await supabase.from('clients').update(client1).eq('client_id', finalClientId);
      console.log('  ✓ Updated existing client record');
    } else {
      console.error('  ✗ Cannot find or create CL-4521. Aborting.');
      process.exit(1);
    }
  } else {
    finalClientId = clientData!.client_id;
    finalClientCode = clientData!.client_code;
  }

  const clientId = finalClientId;
  console.log(`  ✓ ${finalClientCode} → ${clientId}`);
  console.log('');

  // Step 3: Insert sessions
  console.log('📋 Inserting sessions...');

  const sessions = [session1, session2, session3];

  for (const session of sessions) {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        client_id: clientId,
        therapist_id: DEV_THERAPIST_ID,
        session_number: session.session_number,
        transcript: session.transcript,
        treatment_goals: session.treatment_goals,
        session_date: session.session_date,
        status: session.status,
        analysis_result: session.analysis_result,
        analysis_complete_at: session.session_date,
        modality: 'in-person',
        created_at: session.session_date,
        updated_at: session.session_date,
      })
      .select('session_id')
      .single();

    if (error) {
      console.error(`    ✗ Session ${session.session_number}:`, error.message);
    } else {
      console.log(`    ✓ Session ${session.session_number} → ${data.session_id}`);
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('✅ Demo seed complete!');
  console.log(`   1 client, 3 sessions`);
  console.log('');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
