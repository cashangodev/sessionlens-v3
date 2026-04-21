/**
 * Demo Seed Script for SessionLens v3
 * Seeds Supabase with realistic clinical demo data for the SympathIQ partnership demo.
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
// CLIENT 1: CL-4521 — Work anxiety & burnout, 5 sessions, star client
// ═══════════════════════════════════════════════════════════════════════════════

const client1 = {
  therapist_id: DEV_THERAPIST_ID,
  client_code: 'CL-4521',
  gender: 'female',
  age_range: 'adult',
  treatment_goals: [
    'Reduce work-related anxiety symptoms',
    'Develop sustainable work-life boundaries',
    'Build somatic awareness and grounding skills',
    'Challenge perfectionist thinking patterns',
  ],
  presenting_concerns: ['Work-related anxiety', 'Burnout', 'Somatic symptoms', 'Perfectionism'],
  diagnostic_considerations: ['Generalized Anxiety Disorder', 'Adjustment Disorder with Anxiety', 'Burnout Syndrome'],
  current_risk_level: 'low',
  key_themes: ['Perfectionism', 'Work identity', 'Somatic anxiety', 'Boundary setting', 'Self-compassion'],
  dominant_structures: ['body', 'emotion', 'cognitive', 'narrative'],
  preferred_approach: 'Integrative CBT with somatic awareness',
  clinical_notes: 'High-functioning professional presenting with escalating anxiety tied to workplace performance pressure. Strong therapeutic alliance established early. Demonstrates excellent reflective capacity and willingness to engage in behavioral experiments. Somatic symptoms (chest tightness, shallow breathing) are primary anxiety markers. Family system adds pressure through minimizing language. Clear improvement trajectory across sessions.',
  total_sessions: 5,
  is_confirmed: true,
  last_confirmed_at: '2026-04-18T10:00:00Z',
  status: 'active',
  created_at: '2026-03-03T09:00:00Z',
  updated_at: '2026-04-18T10:00:00Z',
  outcome_tracking_enabled: true,
  outcome_scores: [
    { date: '2026-03-05', phq9: 16, gad7: 14, note: 'Intake — elevated anxiety and moderate depression' },
    { date: '2026-03-12', phq9: 14, gad7: 13, note: 'Slight improvement, beginning to identify patterns' },
    { date: '2026-03-19', phq9: 12, gad7: 11, note: 'Grounding techniques showing effect' },
    { date: '2026-04-02', phq9: 10, gad7: 9, note: 'Returned to work part-time, managing well' },
    { date: '2026-04-16', phq9: 8, gad7: 7, note: 'Significant improvement — self-compassion emerging' },
  ],
  deleted_at: null,
};

const client1Sessions = [
  {
    session_number: 1,
    session_date: '2026-03-05T10:00:00Z',
    treatment_goals: 'Initial assessment; establish therapeutic alliance; identify primary concerns',
    status: 'complete',
    transcript: `Therapist: Welcome. I'm glad you reached out. Can you tell me what brought you here today?

Client: I... I don't even know where to start. Work has just become this thing that I dread. Every Sunday night I feel physically sick thinking about Monday. My chest gets tight, my breathing gets shallow. I used to love what I do — I'm a product manager at a tech company — but now it just feels like I'm drowning.

Therapist: That sounds really overwhelming. The physical sensations you're describing — the tightness, the shallow breathing — those are important signals.

Client: Yeah, and my partner keeps saying I should just take a break, but I can't. If I take time off, everything falls apart. I'm the one holding it together. That's what I do.

Therapist: So there's this sense of responsibility — that if you step back, things collapse. I'm curious about that belief.

Client: I mean... logically I know the company won't fall apart. But it feels that way. And my manager has been piling on more projects. I haven't said no once in three years.

Therapist: Not once in three years. What do you think would happen if you said no?

Client: [long pause] They'd think I can't handle it. That I'm not good enough. And that terrifies me more than burning out, honestly.

Therapist: So there's a choice between protecting yourself and being seen as competent. That's a painful bind to be in.

Client: When you put it like that... yeah. It is painful. I never really let myself feel that.`,
    analysis_result: {
      quickInsight: {
        riskLevel: 'moderate',
        clinicalPriority: 'Workplace anxiety with somatic features; assess burnout severity and establish safety',
        prognosis: 'Good — client demonstrates strong insight and verbal fluency',
        topRecommendation: 'Establish psychoeducation around anxiety-burnout cycle; begin somatic awareness training',
        sessionNumber: 1,
      },
      moments: [
        {
          id: 1,
          timestamp: '00:01:30',
          quote: 'Every Sunday night I feel physically sick thinking about Monday. My chest gets tight, my breathing gets shallow.',
          context: 'Opening disclosure — somatic symptoms linked to anticipatory anxiety. Clear body-based presentation.',
          type: 'immediate_experience',
          valence: 'negative',
          intensity: 8,
          structures: ['body', 'emotion', 'immediate_experience'],
          therapistMove: 'empathic_attunement',
          therapistQuote: 'The physical sensations you\'re describing — the tightness, the shallow breathing — those are important signals.',
        },
        {
          id: 2,
          timestamp: '00:04:12',
          quote: 'If I take time off, everything falls apart. I\'m the one holding it together. That\'s what I do.',
          context: 'Core belief surfacing — over-responsibility and identity fusion with work performance.',
          type: 'reflective',
          valence: 'negative',
          intensity: 7,
          structures: ['cognitive', 'narrative', 'social'],
          therapistMove: 'interpretation',
          therapistQuote: 'So there\'s this sense of responsibility — that if you step back, things collapse.',
        },
        {
          id: 3,
          timestamp: '00:06:45',
          quote: 'I haven\'t said no once in three years.',
          context: 'Behavioral pattern revealed — complete absence of boundary-setting in professional context.',
          type: 'recalled_past',
          valence: 'negative',
          intensity: 6,
          structures: ['behaviour', 'social', 'normative'],
          therapistMove: 'reflection',
          therapistQuote: 'Not once in three years. What do you think would happen if you said no?',
        },
        {
          id: 4,
          timestamp: '00:08:20',
          quote: 'They\'d think I can\'t handle it. That I\'m not good enough. And that terrifies me more than burning out.',
          context: 'Core fear articulated — competence anxiety driving self-destructive work patterns.',
          type: 'immediate_experience',
          valence: 'negative',
          intensity: 9,
          structures: ['emotion', 'cognitive', 'social'],
          therapistMove: 'empathic_attunement',
          therapistQuote: 'So there\'s a choice between protecting yourself and being seen as competent. That\'s a painful bind.',
        },
        {
          id: 5,
          timestamp: '00:10:05',
          quote: 'I never really let myself feel that.',
          context: 'Emerging awareness of emotional avoidance pattern. First metacognitive moment in session.',
          type: 'reflective',
          valence: 'mixed',
          intensity: 5,
          structures: ['reflective', 'emotion'],
          therapistMove: 'silence',
          therapistQuote: '[Therapist held space, allowing the client to sit with this recognition]',
        },
      ],
      riskFlags: [
        {
          id: 1,
          signal: 'Burnout Progression',
          severity: 'medium',
          detail: 'Three years without boundary-setting; physical symptoms escalating; dread cycle established',
          algorithmMatch: 'burnout, boundary-setting, physical symptoms, dread cycle',
          recommendation: 'Monitor for depressive episode; assess sleep and appetite changes; consider medical consultation for somatic symptoms',
          interventionType: 'monitor',
        },
        {
          id: 2,
          signal: 'Somatic Escalation',
          severity: 'medium',
          detail: 'Chest tightness, shallow breathing, feeling physically sick — all tied to anticipatory anxiety',
          algorithmMatch: 'chest tightness, shallow breathing, physically sick, anticipatory anxiety',
          recommendation: 'Introduce diaphragmatic breathing; rule out cardiac concerns if symptoms intensify',
          interventionType: 'immediate',
        },
      ],
      structureProfile: {
        body: 0.82,
        immediate_experience: 0.75,
        emotion: 0.78,
        behaviour: 0.65,
        social: 0.72,
        cognitive: 0.80,
        reflective: 0.45,
        narrative: 0.70,
        ecological: 0.55,
        normative: 0.68,
      },
      cbtAnalysis: {
        distortions: [
          { type: 'Catastrophizing', confidence: 0.85, evidence: 'If I take time off, everything falls apart', alternativeThought: 'The team has managed before and can adapt to temporary changes', momentIndex: 1 },
          { type: 'All-or-Nothing Thinking', confidence: 0.82, evidence: 'I\'m not good enough if I can\'t handle everything', alternativeThought: 'Competence exists on a spectrum; setting limits is also a professional skill', momentIndex: 3 },
        ],
        dominantPatterns: ['Catastrophizing', 'All-or-Nothing Thinking', 'Mind Reading'],
        behavioralPatterns: ['Overwork as anxiety management', 'Avoidance of boundary-setting', 'Emotional suppression'],
        automaticThoughts: [
          { content: 'If I say no, they\'ll think I\'m incompetent', beliefStrength: 0.85, supportsWellbeing: false },
          { content: 'I have to hold everything together or it collapses', beliefStrength: 0.80, supportsWellbeing: false },
        ],
        overallDistortionLoad: 0.72,
        treatmentReadiness: 0.65,
      },
      similarCases: [
        {
          id: 1,
          patientCode: 'SC-0412',
          matchScore: 0.91,
          presentingConcerns: ['somatic anxiety', 'workplace burnout', 'perfectionism', 'boundary issues'],
          dominantStructures: ['body', 'emotion', 'cognitive', 'narrative'],
          sessionCount: 10,
          keyThemes: ['Approval-seeking', 'Overwork pattern', 'Somatic anxiety', 'Boundary development'],
          outcome: 'Full recovery',
          outcomeDetail: 'Full recovery over 10 sessions; returned to work with sustainable boundaries. Breakthrough came when client connected childhood approval-seeking to adult overwork pattern.',
          representativeQuote: 'I realized I was working for my father\'s approval, not my manager\'s — once I saw that, the pattern lost its power.',
        },
      ],
      practitionerMatches: [
        {
          id: 1,
          code: 'PM-001',
          name: 'Dr. Rachel Morrison',
          specialty: 'Cognitive-Behavioral Therapy',
          methodology: 'Graded Exposure with Cognitive Restructuring',
          matchScore: 0.88,
          interventionSequence: ['Establish somatic awareness baseline', 'Introduce cognitive restructuring for catastrophic predictions', 'Design graded boundary-setting experiments', 'Process outcomes and consolidate gains'],
          outcomePatterns: [
            { metric: 'Return-to-function rate', change: '+78%', confidence: 0.85 },
            { metric: 'GAD-7 reduction', change: '-6.2 points', confidence: 0.80 },
          ],
          matchReasoning: 'Behavioral experiments targeting catastrophic predictions about boundary-setting',
          targetStructures: ['cognitive', 'behaviour', 'body'],
        },
      ],
      sessionHistory: [
        { session: 1, emotionalIntensity: 8.0, reflectiveCapacity: 3.2, emotionalRegulation: 2.9, therapeuticAlliance: 3.8 },
      ],
      therapistMoves: [
        { type: 'empathic_attunement', count: 4, percentage: 36 },
        { type: 'reflection', count: 3, percentage: 27 },
        { type: 'interpretation', count: 2, percentage: 18 },
        { type: 'silence', count: 2, percentage: 18 },
      ],
      clinicianReport: 'Session 1: Initial assessment reveals high-functioning professional with escalating workplace anxiety and burnout. Primary presentation is somatic (chest tightness, breathing difficulty, nausea). Core cognitive patterns include catastrophizing about workplace consequences of boundary-setting and all-or-nothing thinking about competence. Client demonstrates strong verbal capacity and early reflective awareness. Therapeutic alliance established quickly. Recommend: psychoeducation on anxiety cycle, introduce basic somatic grounding, explore belief system around competence and worth.',
      patientReport: 'Welcome to therapy. Today we explored what\'s been happening at work and how it\'s affecting your body and mind. You shared something really important — that the fear of being seen as "not good enough" has been keeping you from protecting yourself. That\'s a powerful insight to start with. For this week, try noticing when your chest gets tight and simply naming it: "anxiety is here." We\'ll build from there.',
      analysisStatus: 'complete',
      analysisWarnings: [],
    },
  },
  {
    session_number: 2,
    session_date: '2026-03-12T10:00:00Z',
    treatment_goals: 'Deepen somatic awareness; begin challenging perfectionist cognitions',
    status: 'complete',
    transcript: `Therapist: How has the week been since we last met?

Client: Better, actually. I tried what you suggested — naming the anxiety when it shows up. It's weird, but it actually helps a little. Like, "oh, there's that tightness again." It doesn't make it go away but it makes me feel less... consumed by it.

Therapist: That's a really important distinction — between being consumed by anxiety and being able to observe it. You've already started building that observer capacity.

Client: I also noticed something. The tightness comes most when I get a Slack message from my manager. Even if it's just "hey, got a minute?" My body reacts before I even know what he wants.

Therapist: Your body has learned to associate those messages with threat. That's a conditioned response — it makes perfect sense given what you've been through.

Client: Is that... normal? Like, is that what anxiety is?

Therapist: Absolutely. Your nervous system is doing exactly what it's designed to do — protecting you from perceived danger. The work we'll do together is helping your system learn what's actually dangerous versus what just feels that way.

Client: [breathing deeply] That actually makes me feel less broken. I've been telling myself something is wrong with me for months.

Therapist: There's nothing wrong with you. Your body is responding to real, sustained pressure. What would it be like to believe that — really believe it?

Client: [long pause] I think... I'd be less hard on myself. I'd stop trying to just push through it.`,
    analysis_result: {
      quickInsight: {
        riskLevel: 'moderate',
        clinicalPriority: 'Building somatic literacy; normalizing anxiety response; reducing self-blame',
        prognosis: 'Good — client already implementing strategies and showing metacognitive gains',
        topRecommendation: 'Continue somatic awareness work; introduce conditioned response psychoeducation',
        sessionNumber: 2,
      },
      moments: [
        {
          id: 1,
          timestamp: '00:01:20',
          quote: 'I tried naming the anxiety when it shows up. It doesn\'t make it go away but it makes me feel less consumed by it.',
          context: 'Client reporting successful between-session practice. Early signs of decentering from emotional experience.',
          type: 'reflective',
          valence: 'positive',
          intensity: 4,
          structures: ['reflective', 'emotion', 'cognitive'],
          therapistMove: 'reflection',
          therapistQuote: 'That\'s a really important distinction — between being consumed by anxiety and being able to observe it.',
        },
        {
          id: 2,
          timestamp: '00:03:45',
          quote: 'The tightness comes most when I get a Slack message from my manager. Even if it\'s just "hey, got a minute?"',
          context: 'Client identifying specific trigger with somatic precision. Conditioned anxiety response becoming conscious.',
          type: 'immediate_experience',
          valence: 'negative',
          intensity: 7,
          structures: ['body', 'immediate_experience', 'social'],
          therapistMove: 'interpretation',
          therapistQuote: 'Your body has learned to associate those messages with threat. That\'s a conditioned response.',
        },
        {
          id: 3,
          timestamp: '00:06:30',
          quote: 'That actually makes me feel less broken. I\'ve been telling myself something is wrong with me for months.',
          context: 'Psychoeducation landing — client experiencing relief from normalization. Self-blame beginning to soften.',
          type: 'reflective',
          valence: 'positive',
          intensity: 6,
          structures: ['cognitive', 'emotion', 'reflective'],
          therapistMove: 'empathic_attunement',
          therapistQuote: 'There\'s nothing wrong with you. Your body is responding to real, sustained pressure.',
        },
        {
          id: 4,
          timestamp: '00:08:50',
          quote: 'I think I\'d be less hard on myself. I\'d stop trying to just push through it.',
          context: 'Future-oriented reflection — imagining a different relationship with self. Behavioral change becoming conceivable.',
          type: 'future_oriented',
          valence: 'positive',
          intensity: 5,
          structures: ['cognitive', 'narrative', 'behaviour'],
          therapistMove: 'silence',
          therapistQuote: '[Therapist allowed space for this emerging self-compassion]',
        },
      ],
      riskFlags: [
        {
          id: 1,
          signal: 'Conditioned Anxiety Response',
          severity: 'low',
          detail: 'Physiological startle response to neutral Slack messages from manager',
          algorithmMatch: 'startle response, hypervigilance, workplace trigger',
          recommendation: 'Continue psychoeducation; consider introducing brief mindfulness practice before checking messages',
          interventionType: 'monitor',
        },
      ],
      structureProfile: {
        body: 0.80,
        immediate_experience: 0.72,
        emotion: 0.75,
        behaviour: 0.60,
        social: 0.68,
        cognitive: 0.82,
        reflective: 0.58,
        narrative: 0.65,
        ecological: 0.50,
        normative: 0.60,
      },
      cbtAnalysis: {
        distortions: [
          { type: 'Labeling', confidence: 0.75, evidence: 'Something is wrong with me', alternativeThought: 'I\'m having a normal stress response to abnormal levels of pressure', momentIndex: 2 },
          { type: 'Should Statements', confidence: 0.70, evidence: 'I should just push through it', alternativeThought: 'Resting and recovering is a valid and necessary response to burnout', momentIndex: 3 },
        ],
        dominantPatterns: ['Self-blame', 'Should Statements', 'Labeling'],
        behavioralPatterns: ['Push-through mentality', 'Anxiety naming (new, adaptive)', 'Hypervigilance to work communications'],
        automaticThoughts: [
          { content: 'Something is wrong with me', beliefStrength: 0.65, supportsWellbeing: false },
          { content: 'I should be able to handle this', beliefStrength: 0.70, supportsWellbeing: false },
          { content: 'Naming anxiety helps me feel less consumed', beliefStrength: 0.55, supportsWellbeing: true },
        ],
        overallDistortionLoad: 0.58,
        treatmentReadiness: 0.72,
      },
      similarCases: [],
      practitionerMatches: [],
      sessionHistory: [
        { session: 1, emotionalIntensity: 8.0, reflectiveCapacity: 3.2, emotionalRegulation: 2.9, therapeuticAlliance: 3.8 },
        { session: 2, emotionalIntensity: 7.2, reflectiveCapacity: 4.0, emotionalRegulation: 3.5, therapeuticAlliance: 4.3 },
      ],
      therapistMoves: [
        { type: 'empathic_attunement', count: 3, percentage: 30 },
        { type: 'reflection', count: 3, percentage: 30 },
        { type: 'interpretation', count: 2, percentage: 20 },
        { type: 'silence', count: 2, percentage: 20 },
      ],
      clinicianReport: 'Session 2: Client reports successful implementation of anxiety-naming technique between sessions. Notable somatic awareness gain — identified specific trigger (manager Slack messages) with precision. Psychoeducation on conditioned responses produced visible relief and reduction in self-blame. Client moving from "something is wrong with me" toward "my body is responding normally to abnormal pressure." Alliance strengthening. Recommend continuing somatic work and beginning gentle cognitive challenging of perfectionist standards.',
      patientReport: 'Great progress this week! You noticed that naming your anxiety — just saying "there it is" — helps you feel less overwhelmed by it. That\'s a real skill you\'re building. We also talked about how your body\'s reaction to Slack messages is a learned response, not a sign that something is wrong with you. This week, try the same naming practice when you notice the Slack-trigger tightness. You might also try one slow breath before opening messages.',
      analysisStatus: 'complete',
      analysisWarnings: [],
    },
  },
  {
    session_number: 3,
    session_date: '2026-03-19T10:00:00Z',
    treatment_goals: 'Introduce grounding techniques; explore boundary-setting',
    status: 'complete',
    transcript: `Therapist: You mentioned wanting to talk about boundaries today. What's been coming up?

Client: So I actually did something this week. My manager asked me to take on another project — our fourth major launch this quarter — and I said... I said I needed to check my capacity first. I didn't say no exactly, but I didn't say yes immediately either.

Therapist: That's significant. How did that feel?

Client: Terrifying. [laughs] My heart was pounding. But also... kind of powerful? Like, I had a choice. I've never felt like I had a choice before.

Therapist: You discovered that there's space between the request and your response. That's agency.

Client: And the thing is — he just said "okay, let me know by Friday." That's it. No anger, no judgment. All that catastrophizing in my head and he just... was fine with it.

Therapist: So reality didn't match the catastrophe your mind predicted. What do you make of that?

Client: I think... I've been running on a story that isn't true. Or at least isn't as true as I thought. The world doesn't end when I don't say yes immediately.

Therapist: That's a really important piece of learning. Your nervous system gave you the danger signal, and you chose to respond differently anyway. That takes courage.

Client: I'm still figuring out what to tell him. But just having the space to figure it out — that feels new.`,
    analysis_result: {
      quickInsight: {
        riskLevel: 'low',
        clinicalPriority: 'Consolidating boundary-setting gains; processing new behavioral evidence against catastrophic beliefs',
        prognosis: 'Very good — client independently initiating behavioral experiments with positive outcomes',
        topRecommendation: 'Reinforce boundary success; help client articulate what she needs from the manager conversation',
        sessionNumber: 3,
      },
      moments: [
        {
          id: 1,
          timestamp: '00:01:45',
          quote: 'I said I needed to check my capacity first. I didn\'t say no exactly, but I didn\'t say yes immediately either.',
          context: 'Client reporting first-ever boundary-setting attempt at work. Major behavioral shift.',
          type: 'recalled_past',
          valence: 'positive',
          intensity: 6,
          structures: ['behaviour', 'social', 'cognitive'],
          therapistMove: 'reflection',
          therapistQuote: 'That\'s significant. How did that feel?',
        },
        {
          id: 2,
          timestamp: '00:03:10',
          quote: 'Terrifying. But also kind of powerful? Like, I had a choice. I\'ve never felt like I had a choice before.',
          context: 'Simultaneous fear and empowerment — mixed valence moment indicating growth edge.',
          type: 'immediate_experience',
          valence: 'mixed',
          intensity: 8,
          structures: ['emotion', 'body', 'cognitive'],
          therapistMove: 'interpretation',
          therapistQuote: 'You discovered that there\'s space between the request and your response. That\'s agency.',
        },
        {
          id: 3,
          timestamp: '00:05:30',
          quote: 'All that catastrophizing in my head and he just... was fine with it.',
          context: 'Behavioral evidence disconfirming catastrophic prediction. Key learning moment.',
          type: 'reflective',
          valence: 'positive',
          intensity: 5,
          structures: ['cognitive', 'reflective', 'social'],
          therapistMove: 'challenge',
          therapistQuote: 'So reality didn\'t match the catastrophe your mind predicted. What do you make of that?',
        },
        {
          id: 4,
          timestamp: '00:07:20',
          quote: 'I\'ve been running on a story that isn\'t true. Or at least isn\'t as true as I thought.',
          context: 'Metacognitive insight — client recognizing the constructed nature of catastrophic narrative.',
          type: 'reflective',
          valence: 'positive',
          intensity: 7,
          structures: ['reflective', 'narrative', 'cognitive'],
          therapistMove: 'empathic_attunement',
          therapistQuote: 'That\'s a really important piece of learning. That takes courage.',
        },
      ],
      riskFlags: [
        {
          id: 1,
          signal: 'Residual Anxiety',
          severity: 'low',
          detail: 'Heart pounding during boundary-setting attempt; fear response still active',
          algorithmMatch: 'heart pounding, fear response, boundary-setting',
          recommendation: 'Normalize continued anxiety during behavioral experiments; celebrate acting despite fear',
          interventionType: 'monitor',
        },
      ],
      structureProfile: {
        body: 0.68,
        immediate_experience: 0.70,
        emotion: 0.72,
        behaviour: 0.82,
        social: 0.78,
        cognitive: 0.85,
        reflective: 0.72,
        narrative: 0.75,
        ecological: 0.55,
        normative: 0.62,
      },
      cbtAnalysis: {
        distortions: [
          { type: 'Fortune Telling', confidence: 0.68, evidence: 'All that catastrophizing in my head', alternativeThought: 'I predicted disaster but reality was neutral — I can\'t trust my anxious predictions', momentIndex: 2 },
        ],
        dominantPatterns: ['Fortune Telling (weakening)', 'Catastrophizing (disconfirmed)'],
        behavioralPatterns: ['Boundary-setting (new)', 'Pause before responding (new)', 'Anxiety tolerance'],
        automaticThoughts: [
          { content: 'The world doesn\'t end when I don\'t say yes immediately', beliefStrength: 0.60, supportsWellbeing: true },
          { content: 'I have a choice', beliefStrength: 0.55, supportsWellbeing: true },
        ],
        overallDistortionLoad: 0.42,
        treatmentReadiness: 0.82,
      },
      similarCases: [],
      practitionerMatches: [],
      sessionHistory: [
        { session: 1, emotionalIntensity: 8.0, reflectiveCapacity: 3.2, emotionalRegulation: 2.9, therapeuticAlliance: 3.8 },
        { session: 2, emotionalIntensity: 7.2, reflectiveCapacity: 4.0, emotionalRegulation: 3.5, therapeuticAlliance: 4.3 },
        { session: 3, emotionalIntensity: 6.5, reflectiveCapacity: 4.8, emotionalRegulation: 4.2, therapeuticAlliance: 4.7 },
      ],
      therapistMoves: [
        { type: 'reflection', count: 3, percentage: 33 },
        { type: 'interpretation', count: 2, percentage: 22 },
        { type: 'empathic_attunement', count: 2, percentage: 22 },
        { type: 'challenge', count: 1, percentage: 11 },
        { type: 'silence', count: 1, percentage: 11 },
      ],
      clinicianReport: 'Session 3: Significant behavioral progress. Client independently attempted boundary-setting with manager — first time in 3 years. Reported mixed emotional response (fear + empowerment) indicating healthy growth edge engagement. Catastrophic prediction was disconfirmed by reality (manager responded neutrally). Client demonstrating strong metacognitive capacity: "I\'ve been running on a story that isn\'t true." Distortion load decreasing. Treatment trajectory very positive.',
      patientReport: 'What happened this week was genuinely brave. You changed a 3-year pattern by giving yourself permission to pause before saying yes. And you learned something important — your mind predicted disaster, but reality was much more neutral. That gap between prediction and reality is where healing happens. This week, notice other places where your catastrophic predictions might not match what actually happens.',
      analysisStatus: 'complete',
      analysisWarnings: [],
    },
  },
  {
    session_number: 4,
    session_date: '2026-04-02T10:00:00Z',
    treatment_goals: 'Process return to work; consolidate cognitive restructuring gains',
    status: 'complete',
    transcript: `Therapist: You mentioned you started going back in three days a week. How is that going?

Client: It's... manageable. Which feels like a miracle given where I was a month ago. I'm using the breathing technique before meetings, and I set up my calendar with actual breaks. Like, blocked time that says "focus time" where no one can book me.

Therapist: You're structuring your environment to support yourself. That's proactive rather than reactive.

Client: Exactly. And I had an interesting moment on Tuesday. My manager gave some critical feedback on a presentation, and my first thought was "I'm terrible at this." But then I caught it. I actually thought, "wait, that's the catastrophizing thing."

Therapist: You caught the pattern in real time. That's remarkable progress.

Client: It still stung. The feedback still hurt. But it didn't spiral. Like, normally that would ruin my whole day — maybe my whole week. But this time it was just... a moment.

Therapist: A moment rather than a spiral. The feelings were still there, but they had a beginning, a middle, and an end.

Client: Yeah. And I think that's because I'm not adding the story on top anymore. The feedback was just feedback. I was adding "and therefore you're worthless" which... isn't actually what he said.

Therapist: So you're learning to separate the event from the interpretation. That's cognitive flexibility in action.

Client: It feels like I'm becoming a different person. Or maybe... becoming more myself? I don't know how to say it.`,
    analysis_result: {
      quickInsight: {
        riskLevel: 'low',
        clinicalPriority: 'Consolidating workplace re-integration; strengthening cognitive flexibility',
        prognosis: 'Very good — active coping strategies in place, metacognitive gains holding in real-world contexts',
        topRecommendation: 'Explore identity narrative shift; prepare for potential setbacks with relapse prevention psychoeducation',
        sessionNumber: 4,
      },
      moments: [
        {
          id: 1,
          timestamp: '00:01:30',
          quote: 'It\'s manageable. Which feels like a miracle given where I was a month ago.',
          context: 'Client acknowledging own progress — self-efficacy building. Comparing present to past with gratitude.',
          type: 'reflective',
          valence: 'positive',
          intensity: 5,
          structures: ['reflective', 'emotion', 'narrative'],
          therapistMove: 'reflection',
          therapistQuote: 'You\'re structuring your environment to support yourself. That\'s proactive rather than reactive.',
        },
        {
          id: 2,
          timestamp: '00:04:00',
          quote: 'My first thought was "I\'m terrible at this." But then I caught it. I actually thought, "wait, that\'s the catastrophizing thing."',
          context: 'Real-time cognitive defusion in workplace context. Client catching distorted thought mid-stream.',
          type: 'recalled_past',
          valence: 'positive',
          intensity: 6,
          structures: ['cognitive', 'reflective', 'emotion'],
          therapistMove: 'empathic_attunement',
          therapistQuote: 'You caught the pattern in real time. That\'s remarkable progress.',
        },
        {
          id: 3,
          timestamp: '00:06:15',
          quote: 'Normally that would ruin my whole day — maybe my whole week. But this time it was just... a moment.',
          context: 'Emotional containment demonstrated — feelings arising and passing without spiraling.',
          type: 'reflective',
          valence: 'positive',
          intensity: 4,
          structures: ['emotion', 'reflective', 'cognitive'],
          therapistMove: 'reflection',
          therapistQuote: 'A moment rather than a spiral. The feelings were still there, but they had a beginning, a middle, and an end.',
        },
        {
          id: 4,
          timestamp: '00:08:40',
          quote: 'I was adding "and therefore you\'re worthless" which isn\'t actually what he said.',
          context: 'Client identifying the added interpretation layer. Clear cognitive restructuring in action.',
          type: 'reflective',
          valence: 'positive',
          intensity: 5,
          structures: ['cognitive', 'narrative', 'reflective'],
          therapistMove: 'interpretation',
          therapistQuote: 'You\'re learning to separate the event from the interpretation. That\'s cognitive flexibility in action.',
        },
        {
          id: 5,
          timestamp: '00:10:20',
          quote: 'It feels like I\'m becoming a different person. Or maybe... becoming more myself?',
          context: 'Identity-level shift emerging. Client sensing fundamental change in self-relationship.',
          type: 'reflective',
          valence: 'positive',
          intensity: 7,
          structures: ['narrative', 'reflective', 'emotion'],
          therapistMove: 'silence',
          therapistQuote: '[Therapist allowed this profound self-recognition to resonate]',
        },
      ],
      riskFlags: [
        {
          id: 1,
          signal: 'Setback Vulnerability',
          severity: 'low',
          detail: 'Rapid progress may create vulnerability if client encounters major stressor',
          algorithmMatch: 'rapid progress, vulnerability, stressor, setback risk',
          recommendation: 'Proactive relapse prevention; discuss how to handle a "bad day" without losing confidence in progress',
          interventionType: 'monitor',
        },
      ],
      structureProfile: {
        body: 0.60,
        immediate_experience: 0.65,
        emotion: 0.70,
        behaviour: 0.78,
        social: 0.72,
        cognitive: 0.88,
        reflective: 0.82,
        narrative: 0.80,
        ecological: 0.58,
        normative: 0.55,
      },
      cbtAnalysis: {
        distortions: [
          { type: 'Labeling', confidence: 0.60, evidence: '"I\'m terrible at this" (caught and corrected in real-time)', alternativeThought: 'Client self-corrected: identified this as catastrophizing pattern', momentIndex: 1 },
        ],
        dominantPatterns: ['Labeling (weakening)', 'Catastrophizing (actively resisted)'],
        behavioralPatterns: ['Proactive environment structuring', 'Real-time cognitive catching', 'Boundary maintenance', 'Breathing practice before meetings'],
        automaticThoughts: [
          { content: 'Feedback is just feedback, not a verdict on my worth', beliefStrength: 0.60, supportsWellbeing: true },
          { content: 'I can feel hurt without spiraling', beliefStrength: 0.65, supportsWellbeing: true },
          { content: 'I\'m becoming more myself', beliefStrength: 0.50, supportsWellbeing: true },
        ],
        overallDistortionLoad: 0.30,
        treatmentReadiness: 0.90,
      },
      similarCases: [],
      practitionerMatches: [],
      sessionHistory: [
        { session: 1, emotionalIntensity: 8.0, reflectiveCapacity: 3.2, emotionalRegulation: 2.9, therapeuticAlliance: 3.8 },
        { session: 2, emotionalIntensity: 7.2, reflectiveCapacity: 4.0, emotionalRegulation: 3.5, therapeuticAlliance: 4.3 },
        { session: 3, emotionalIntensity: 6.5, reflectiveCapacity: 4.8, emotionalRegulation: 4.2, therapeuticAlliance: 4.7 },
        { session: 4, emotionalIntensity: 5.8, reflectiveCapacity: 5.5, emotionalRegulation: 4.8, therapeuticAlliance: 5.0 },
      ],
      therapistMoves: [
        { type: 'reflection', count: 3, percentage: 33 },
        { type: 'empathic_attunement', count: 2, percentage: 22 },
        { type: 'interpretation', count: 2, percentage: 22 },
        { type: 'silence', count: 2, percentage: 22 },
      ],
      clinicianReport: 'Session 4: Excellent progress consolidation. Client has returned to work 3 days/week with proactive environmental supports (calendar blocking, breathing before meetings). Demonstrated real-time cognitive defusion when receiving critical feedback — caught catastrophic thought and reframed independently. Emotional regulation markedly improved: difficult feelings arising and passing without spiraling. Identity-level language emerging ("becoming more myself"). Distortion load significantly reduced. Consider beginning relapse prevention planning.',
      patientReport: 'You\'re doing something really sophisticated — catching your anxious thoughts in real time and choosing not to follow them into a spiral. The fact that feedback could sting without ruining your day shows how much your relationship with difficult feelings has changed. You\'re not adding "therefore I\'m worthless" on top anymore. That\'s huge. This week, keep noticing the space between what happens and what you tell yourself about what happened.',
      analysisStatus: 'complete',
      analysisWarnings: [],
    },
  },
  {
    session_number: 5,
    session_date: '2026-04-16T10:00:00Z',
    treatment_goals: 'Review progress; explore deeper identity shifts; plan for sustainable wellness',
    status: 'complete',
    transcript: `Therapist: We're at session five now. I'd like to check in on how things feel overall.

Client: Honestly? I feel like a different person than the one who walked in here six weeks ago. That sounds dramatic but it's true. I was in survival mode — just white-knuckling through every day. Now I actually have moments where I enjoy my work again.

Therapist: That's a significant shift — from survival to moments of enjoyment. What do you think made the difference?

Client: I think it was understanding that my anxiety wasn't a character flaw. It was my body trying to protect me from something real. Once I stopped fighting it and started listening to it, everything changed.

Therapist: You shifted from fighting your experience to being curious about it.

Client: Yes! And the boundary thing — I actually told my manager last week that I can't take on the Q3 planning project. Full sentence, clear answer. And I didn't die. [laughs] He actually said he respected that I knew my limits.

Therapist: How did your body respond when he said that?

Client: [pauses] My shoulders dropped. Like, physically dropped. I didn't realize how much tension I was carrying in anticipation of him being angry. My body was bracing for something that never came.

Therapist: So your body is also learning — not just your mind. The body is updating its predictions.

Client: That's such a good way to put it. My body is learning it's safe. I still get anxious sometimes — like yesterday in a big meeting — but it passes. I breathe, I name it, and it passes. It doesn't own me anymore.

Therapist: "It doesn't own me anymore." That feels like a really important statement.

Client: [gets emotional] Sorry... I just... I spent so long thinking I was broken. That I couldn't handle what everyone else handles easily. And now I realize... maybe everyone is struggling. And maybe asking for help wasn't weakness, it was the strongest thing I've done.

Therapist: Take your time. What you're feeling right now is important.

Client: [crying softly] I'm just grateful. I didn't know it could be different. I thought this was just how life was going to be.

Therapist: And now?

Client: Now I know I have choices. I have tools. And I have... permission to take care of myself. That still feels new but it feels real.`,
    analysis_result: {
      quickInsight: {
        riskLevel: 'low',
        clinicalPriority: 'Consolidating identity-level gains; establishing sustainable self-care framework for long-term maintenance',
        prognosis: 'Excellent — marked improvement across all domains; client demonstrates internalized coping capacity',
        topRecommendation: 'Transition toward maintenance phase; discuss session frequency reduction; reinforce relapse prevention strategies',
        sessionNumber: 5,
      },
      moments: [
        {
          id: 1,
          timestamp: '00:01:15',
          quote: 'I feel like a different person than the one who walked in here six weeks ago. I was in survival mode — just white-knuckling through every day.',
          context: 'Client reflecting on therapeutic journey with clear self-awareness. Strong narrative coherence around change.',
          type: 'reflective',
          valence: 'positive',
          intensity: 6,
          structures: ['narrative', 'reflective', 'emotion'],
          therapistMove: 'reflection',
          therapistQuote: 'That\'s a significant shift — from survival to moments of enjoyment. What do you think made the difference?',
        },
        {
          id: 2,
          timestamp: '00:03:00',
          quote: 'My anxiety wasn\'t a character flaw. It was my body trying to protect me from something real. Once I stopped fighting it and started listening to it, everything changed.',
          context: 'Integrated understanding of anxiety function — psychoeducation fully internalized. Paradigm shift complete.',
          type: 'reflective',
          valence: 'positive',
          intensity: 7,
          structures: ['cognitive', 'body', 'reflective', 'narrative'],
          therapistMove: 'interpretation',
          therapistQuote: 'You shifted from fighting your experience to being curious about it.',
        },
        {
          id: 3,
          timestamp: '00:04:30',
          quote: 'I actually told my manager last week that I can\'t take on the Q3 planning project. Full sentence, clear answer. And I didn\'t die.',
          context: 'Definitive boundary-setting — evolution from tentative "checking capacity" to clear direct communication.',
          type: 'recalled_past',
          valence: 'positive',
          intensity: 5,
          structures: ['behaviour', 'social', 'cognitive'],
          therapistMove: 'empathic_attunement',
          therapistQuote: 'How did your body respond when he said that?',
        },
        {
          id: 4,
          timestamp: '00:05:45',
          quote: 'My shoulders dropped. Like, physically dropped. I didn\'t realize how much tension I was carrying in anticipation of him being angry.',
          context: 'Somatic release in response to positive social outcome. Body-level evidence of safety learning.',
          type: 'immediate_experience',
          valence: 'positive',
          intensity: 7,
          structures: ['body', 'immediate_experience', 'emotion'],
          therapistMove: 'interpretation',
          therapistQuote: 'Your body is also learning — not just your mind. The body is updating its predictions.',
        },
        {
          id: 5,
          timestamp: '00:07:10',
          quote: 'I still get anxious sometimes — like yesterday in a big meeting — but it passes. I breathe, I name it, and it passes. It doesn\'t own me anymore.',
          context: 'Demonstrating integrated coping toolkit. Anxiety still present but no longer dysregulating.',
          type: 'reflective',
          valence: 'positive',
          intensity: 5,
          structures: ['emotion', 'body', 'reflective', 'behaviour'],
          therapistMove: 'reflection',
          therapistQuote: '"It doesn\'t own me anymore." That feels like a really important statement.',
        },
        {
          id: 6,
          timestamp: '00:08:30',
          quote: 'I spent so long thinking I was broken. That I couldn\'t handle what everyone else handles easily.',
          context: 'Emotional processing of past self-narrative. Grief for time spent in unnecessary suffering.',
          type: 'recalled_past',
          valence: 'negative',
          intensity: 8,
          structures: ['emotion', 'narrative', 'cognitive'],
          therapistMove: 'silence',
          therapistQuote: '[Therapist held compassionate silence during emotional release]',
        },
        {
          id: 7,
          timestamp: '00:09:45',
          quote: 'Maybe asking for help wasn\'t weakness, it was the strongest thing I\'ve done.',
          context: 'Fundamental reframe of help-seeking behavior. Core belief shift from weakness to strength.',
          type: 'reflective',
          valence: 'positive',
          intensity: 9,
          structures: ['cognitive', 'narrative', 'normative', 'reflective'],
          therapistMove: 'empathic_attunement',
          therapistQuote: 'Take your time. What you\'re feeling right now is important.',
        },
        {
          id: 8,
          timestamp: '00:11:20',
          quote: 'Now I know I have choices. I have tools. And I have permission to take care of myself.',
          context: 'Integration statement — client articulating internalized therapeutic gains across cognitive, behavioral, and identity domains.',
          type: 'future_oriented',
          valence: 'positive',
          intensity: 7,
          structures: ['cognitive', 'behaviour', 'narrative', 'reflective'],
          therapistMove: 'reflection',
          therapistQuote: 'And now? [Inviting the client to articulate her own vision of what comes next]',
        },
      ],
      riskFlags: [
        {
          id: 1,
          signal: 'Emotional Vulnerability',
          severity: 'low',
          detail: 'Client became tearful processing past suffering — appropriate emotional response, not dysregulation',
          algorithmMatch: 'tearful, emotional processing, grief, relief',
          recommendation: 'Normalize emotional processing of therapeutic gains; no intervention needed',
          interventionType: 'monitor',
        },
        {
          id: 2,
          signal: 'Premature Termination Risk',
          severity: 'low',
          detail: 'Client feeling dramatically better — may want to end therapy before consolidating gains',
          algorithmMatch: 'rapid improvement, termination risk, early dropout',
          recommendation: 'Discuss transition to maintenance phase rather than abrupt termination; space sessions to biweekly',
          interventionType: 'monitor',
        },
        {
          id: 3,
          signal: 'Residual Workplace Anxiety',
          severity: 'low',
          detail: 'Client reports still experiencing anxiety in large meetings',
          algorithmMatch: 'anxiety, large meetings, residual symptoms',
          recommendation: 'Continue practicing existing coping skills; consider graded exposure to higher-stakes meetings if needed',
          interventionType: 'monitor',
        },
      ],
      structureProfile: {
        body: 0.75,
        immediate_experience: 0.70,
        emotion: 0.82,
        behaviour: 0.80,
        social: 0.75,
        cognitive: 0.90,
        reflective: 0.88,
        narrative: 0.85,
        ecological: 0.60,
        normative: 0.72,
      },
      cbtAnalysis: {
        distortions: [
          { type: 'Labeling (Historical)', confidence: 0.40, evidence: '"I spent so long thinking I was broken" — now recognized as inaccurate', alternativeThought: 'Client has fully reframed: anxiety as protection, not brokenness', momentIndex: 5 },
          { type: 'Mind Reading (Weakening)', confidence: 0.35, evidence: 'Anticipated manager anger; received respect instead', alternativeThought: 'Others may actually value my honesty about capacity', momentIndex: 2 },
          { type: 'Personalization (Resolved)', confidence: 0.30, evidence: '"What everyone else handles easily" — comparison to imagined others', alternativeThought: 'Maybe everyone is struggling; my experience is valid', momentIndex: 5 },
        ],
        dominantPatterns: ['Previously dominant patterns now recognized and actively resisted', 'Emerging self-compassion framework'],
        behavioralPatterns: ['Clear boundary communication', 'Regular breathing practice', 'Anxiety naming', 'Proactive calendar management', 'Help-seeking normalized'],
        automaticThoughts: [
          { content: 'I have choices and tools to handle difficulty', beliefStrength: 0.75, supportsWellbeing: true },
          { content: 'Asking for help is strength, not weakness', beliefStrength: 0.70, supportsWellbeing: true },
          { content: 'Anxiety passes — it doesn\'t own me', beliefStrength: 0.72, supportsWellbeing: true },
          { content: 'I deserve to take care of myself', beliefStrength: 0.65, supportsWellbeing: true },
        ],
        overallDistortionLoad: 0.18,
        treatmentReadiness: 0.95,
      },
      similarCases: [
        {
          id: 1,
          patientCode: 'SC-0518',
          matchScore: 0.93,
          presentingConcerns: ['work anxiety', 'burnout recovery', 'perfectionism', 'somatic presentation', 'rapid improvement'],
          dominantStructures: ['body', 'emotion', 'cognitive', 'behaviour'],
          sessionCount: 6,
          keyThemes: ['Anxiety-as-protection reframe', 'Boundary experiments', 'Somatic grounding'],
          outcome: 'Sustained improvement',
          outcomeDetail: 'Sustained improvement at 6-month follow-up. Maintained boundaries, reduced work hours by 15%, anxiety scores in normal range. Clients who internalize the anxiety-as-protection frame tend to maintain gains at 6-month follow-up.',
          representativeQuote: 'The moment I stopped fighting the anxiety and started listening to it, I finally felt like I was on the same team as my own body.',
        },
        {
          id: 2,
          patientCode: 'SC-0623',
          matchScore: 0.87,
          presentingConcerns: ['identity-work fusion', 'perfectionism', 'self-worth tied to performance'],
          dominantStructures: ['narrative', 'cognitive', 'reflective'],
          sessionCount: 12,
          keyThemes: ['Identity reconstruction', 'Values clarification', 'Self-compassion'],
          outcome: 'Significant improvement',
          outcomeDetail: 'Client reports life satisfaction increase of 40% at 3 months. Career remained stable with healthier relationship to work. The "becoming more myself" language often signals durable identity-level change rather than symptom-level coping.',
          representativeQuote: 'I used to think I was my productivity. Now I know I\'m the person who gets to choose what to produce — and what to let go.',
        },
        {
          id: 3,
          patientCode: 'SC-0731',
          matchScore: 0.84,
          presentingConcerns: ['somatic anxiety', 'workplace communication triggers', 'conditioned responses'],
          dominantStructures: ['body', 'immediate_experience', 'cognitive'],
          sessionCount: 8,
          keyThemes: ['Interoceptive exposure', 'Breathing retraining', 'Cognitive defusion'],
          outcome: 'Full recovery',
          outcomeDetail: 'GAD-7 dropped from 15 to 5 over 8 sessions. Maintained at 12-month follow-up. Somatic symptoms that respond to naming and breathing techniques within 4 sessions predict excellent long-term outcomes.',
          representativeQuote: 'My chest used to seize up every time a client email came in. Now I notice the flicker and let it pass — it\'s just information, not danger.',
        },
      ],
      practitionerMatches: [
        {
          id: 1,
          code: 'PM-001',
          name: 'Dr. Rachel Morrison',
          specialty: 'Cognitive-Behavioral Therapy',
          methodology: 'Graded Exposure with Cognitive Restructuring',
          matchScore: 0.94,
          interventionSequence: ['Identify catastrophic predictions', 'Design behavioral experiments', 'Process disconfirming evidence', 'Generalize cognitive flexibility to new contexts'],
          outcomePatterns: [
            { metric: 'Gains maintenance at 6 months', change: '+92%', confidence: 0.88 },
            { metric: 'Self-initiated experiments', change: 'Achieved', confidence: 0.90 },
          ],
          matchReasoning: 'Behavioral experiments targeting catastrophic predictions — client already implementing independently',
          targetStructures: ['cognitive', 'behaviour', 'social'],
        },
        {
          id: 2,
          code: 'PM-002',
          name: 'Dr. Priya Patel',
          specialty: 'Acceptance and Commitment Therapy',
          methodology: 'Values-Based Action with Psychological Flexibility',
          matchScore: 0.89,
          interventionSequence: ['Identify core values beneath performance identity', 'Practice defusion from self-critical narratives', 'Commit to values-aligned boundary actions', 'Integrate acceptance of difficult emotions'],
          outcomePatterns: [
            { metric: 'Values alignment score', change: '+45%', confidence: 0.82 },
            { metric: 'Identity flexibility', change: 'Significant improvement', confidence: 0.78 },
          ],
          matchReasoning: 'Defusion from "broken" self-narrative; values-driven boundary setting. ACT framework strongly indicated when clients demonstrate "becoming myself" language.',
          targetStructures: ['narrative', 'cognitive', 'reflective'],
        },
        {
          id: 3,
          code: 'PM-003',
          name: 'James Chen, LMHC',
          specialty: 'Somatic & Sensorimotor Psychotherapy',
          methodology: 'Body-Based Processing and Nervous System Regulation',
          matchScore: 0.82,
          interventionSequence: ['Track somatic markers of safety and threat', 'Build interoceptive awareness vocabulary', 'Practice pendulation between activation and calm', 'Integrate somatic evidence of change into narrative'],
          outcomePatterns: [
            { metric: 'Somatic symptom reduction', change: '-60%', confidence: 0.80 },
            { metric: 'Body-based coping durability', change: 'More durable than cognitive-only', confidence: 0.75 },
          ],
          matchReasoning: 'Tracking somatic shifts as evidence of safety learning — "shoulders dropping" as therapeutic milestone',
          targetStructures: ['body', 'immediate_experience', 'emotion'],
        },
      ],
      sessionHistory: [
        { session: 1, emotionalIntensity: 8.0, reflectiveCapacity: 3.2, emotionalRegulation: 2.9, therapeuticAlliance: 3.8 },
        { session: 2, emotionalIntensity: 7.2, reflectiveCapacity: 4.0, emotionalRegulation: 3.5, therapeuticAlliance: 4.3 },
        { session: 3, emotionalIntensity: 6.5, reflectiveCapacity: 4.8, emotionalRegulation: 4.2, therapeuticAlliance: 4.7 },
        { session: 4, emotionalIntensity: 5.8, reflectiveCapacity: 5.5, emotionalRegulation: 4.8, therapeuticAlliance: 5.0 },
        { session: 5, emotionalIntensity: 6.8, reflectiveCapacity: 6.2, emotionalRegulation: 5.5, therapeuticAlliance: 5.3 },
      ],
      therapistMoves: [
        { type: 'reflection', count: 4, percentage: 31 },
        { type: 'empathic_attunement', count: 3, percentage: 23 },
        { type: 'interpretation', count: 3, percentage: 23 },
        { type: 'silence', count: 2, percentage: 15 },
        { type: 'challenge', count: 1, percentage: 8 },
      ],
      clinicianReport: `Session 5 Review: Client demonstrates comprehensive improvement across all therapeutic domains. Return to work successful (3 days/week with proactive supports). Boundary-setting has progressed from tentative ("checking capacity") to assertive ("I can't take on this project"). Manager responded positively, reinforcing new behavior.

Key therapeutic gains:
1. Cognitive: Real-time identification and correction of catastrophic thinking. Overall distortion load reduced from 0.72 to 0.18.
2. Somatic: Body awareness integrated into daily coping. Reports "shoulders dropping" as somatic evidence of safety learning.
3. Behavioral: Calendar management, breathing practice, clear communication of limits all maintained consistently.
4. Identity: Shift from "something is wrong with me" to "asking for help is the strongest thing I've done." Deep narrative restructuring.

PHQ-9 trajectory: 16 → 14 → 12 → 10 → 8 (50% reduction)
GAD-7 trajectory: 14 → 13 → 11 → 9 → 7 (50% reduction)

Risk Assessment: Low. No safety concerns. Protective factors strong: therapeutic alliance, cognitive flexibility, social support, behavioral toolkit, self-compassion emerging.

Recommendation: Transition to biweekly sessions for maintenance. Focus on relapse prevention planning and continued identity consolidation. Consider termination planning in 3-4 additional sessions if gains remain stable.`,
      patientReport: `Session 5 Summary:

What an incredible journey these past six weeks have been. Today you reflected on how much has changed — from white-knuckling through every day to actually enjoying moments at work again.

Key insights from today:
- You recognized that anxiety was never a character flaw — it was your body protecting you
- You set a clear boundary with your manager and he respected it
- Your body is learning safety alongside your mind (those dropping shoulders!)
- Feeling emotions — even tears of relief — is healthy and human

What's different now:
- You have tools: breathing, naming, pausing before responding
- You have choices: saying no is an option, and the world doesn't end
- You have self-compassion: asking for help is strength, not weakness

Going forward, we'll meet every two weeks to make sure these changes stick. Some days will still be hard — that's normal. But you have everything you need to handle those days differently than before.

You should be proud of the work you've done here. It takes real courage to change patterns that have been running for years.`,
      analysisStatus: 'complete',
      analysisWarnings: [],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT 2: CL-7803 — Relationship issues & mild depression, 3 sessions
// ═══════════════════════════════════════════════════════════════════════════════

const client2 = {
  therapist_id: DEV_THERAPIST_ID,
  client_code: 'CL-7803',
  gender: 'male',
  age_range: 'middle-aged',
  treatment_goals: [
    'Improve communication patterns in marriage',
    'Address withdrawal and emotional avoidance',
    'Process feelings of inadequacy as partner and father',
    'Develop emotional vocabulary and expression',
  ],
  presenting_concerns: ['Relationship difficulties', 'Mild depression', 'Emotional withdrawal', 'Communication issues'],
  diagnostic_considerations: ['Persistent Depressive Disorder (mild)', 'Adjustment Disorder with Depressed Mood'],
  current_risk_level: 'low',
  key_themes: ['Emotional avoidance', 'Masculine role expectations', 'Marital communication', 'Vulnerability', 'Father role'],
  dominant_structures: ['social', 'emotion', 'normative', 'narrative'],
  preferred_approach: 'Emotionally Focused Therapy with narrative elements',
  clinical_notes: 'Mid-career professional presenting with relational distress. Partner initiated couples therapy ultimatum. Client demonstrates alexithymia features — difficulty identifying and naming emotions. Underneath withdrawal lies fear of inadequacy and rejection. Good engagement once trust established. Moderate improvement trajectory.',
  total_sessions: 3,
  is_confirmed: true,
  last_confirmed_at: '2026-04-10T14:00:00Z',
  status: 'active',
  created_at: '2026-03-17T14:00:00Z',
  updated_at: '2026-04-10T14:00:00Z',
  outcome_tracking_enabled: true,
  outcome_scores: [
    { date: '2026-03-19', phq9: 12, gad7: 8, note: 'Intake — mild depression, low anxiety' },
    { date: '2026-03-26', phq9: 11, gad7: 7, note: 'Beginning to engage with emotional content' },
    { date: '2026-04-09', phq9: 9, gad7: 6, note: 'Improved after first vulnerable conversation with wife' },
  ],
  deleted_at: null,
};

const client2Sessions = [
  {
    session_number: 1,
    session_date: '2026-03-19T14:00:00Z',
    treatment_goals: 'Initial assessment; understand relational context; build rapport',
    status: 'complete',
    transcript: `Therapist: What brings you in today?

Client: My wife said I needed to come. [pause] I mean, that sounds bad. It's not an ultimatum exactly. She just... she says I've shut down. That I'm not present anymore. And I guess she's right.

Therapist: What does "shut down" look like for you?

Client: I come home, I eat dinner, I watch TV, I go to bed. On weekends I do stuff with the kids but even then I'm... going through the motions. Sarah says she feels like she's living with a roommate, not a husband.

Therapist: And how does it feel hearing that from her?

Client: [long pause] I don't know. That's the problem, isn't it? I don't know how it feels. I know it should bother me. And somewhere it does. But I can't... access it.

Therapist: You know something is there, but there's a wall between you and it. Is that close?

Client: Yeah. A wall. I think I built it a long time ago and now I don't know how to take it down. My dad was the same way — never talked about feelings, just provided. I thought that was enough.

Therapist: You learned that providing was how a man shows love. And now the rules have changed.

Client: And I don't know how to play by the new rules. I love my wife. I love my kids. But I don't know how to show it the way they need me to.`,
    analysis_result: {
      quickInsight: {
        riskLevel: 'low',
        clinicalPriority: 'Alexithymia features with relational distress; establish emotional vocabulary baseline',
        prognosis: 'Moderate — client willing to engage but emotional access is limited; will require patient, consistent work',
        topRecommendation: 'Build emotional literacy; normalize the difficulty of vulnerability for men socialized to suppress',
        sessionNumber: 1,
      },
      moments: [
        {
          id: 1,
          timestamp: '00:02:30',
          quote: 'She says I\'ve shut down. That I\'m not present anymore. And I guess she\'s right.',
          context: 'Client acknowledging partner\'s feedback with passive agreement. Minimal emotional engagement with content.',
          type: 'recalled_past',
          valence: 'negative',
          intensity: 4,
          structures: ['social', 'narrative'],
          therapistMove: 'reflection',
          therapistQuote: 'What does "shut down" look like for you?',
        },
        {
          id: 2,
          timestamp: '00:04:45',
          quote: 'I don\'t know how it feels. That\'s the problem, isn\'t it? I can\'t access it.',
          context: 'Core presentation — alexithymia. Client aware of emotional deficit but unable to overcome it.',
          type: 'immediate_experience',
          valence: 'mixed',
          intensity: 5,
          structures: ['emotion', 'reflective', 'cognitive'],
          therapistMove: 'empathic_attunement',
          therapistQuote: 'You know something is there, but there\'s a wall between you and it.',
        },
        {
          id: 3,
          timestamp: '00:06:20',
          quote: 'My dad was the same way — never talked about feelings, just provided. I thought that was enough.',
          context: 'Intergenerational pattern identified. Masculine emotional suppression modeled by father.',
          type: 'recalled_past',
          valence: 'neutral',
          intensity: 5,
          structures: ['narrative', 'normative', 'social'],
          therapistMove: 'interpretation',
          therapistQuote: 'You learned that providing was how a man shows love. And now the rules have changed.',
        },
        {
          id: 4,
          timestamp: '00:08:10',
          quote: 'I love my wife. I love my kids. But I don\'t know how to show it the way they need me to.',
          context: 'Love is present but unexpressed — gap between internal state and behavioral expression.',
          type: 'immediate_experience',
          valence: 'negative',
          intensity: 6,
          structures: ['emotion', 'social', 'behaviour'],
          therapistMove: 'empathic_attunement',
          therapistQuote: '[Therapist acknowledged the pain of loving but not knowing how to show it]',
        },
      ],
      riskFlags: [
        {
          id: 1,
          signal: 'Relational Isolation',
          severity: 'medium',
          detail: 'Going through the motions; partner describing him as a roommate; emotional shutdown',
          algorithmMatch: 'emotional shutdown, withdrawal, relational distance, roommate',
          recommendation: 'Monitor for deepening depression; assess marital stability; encourage small connection experiments',
          interventionType: 'monitor',
        },
      ],
      structureProfile: {
        body: 0.35,
        immediate_experience: 0.40,
        emotion: 0.45,
        behaviour: 0.55,
        social: 0.80,
        cognitive: 0.60,
        reflective: 0.50,
        narrative: 0.72,
        ecological: 0.45,
        normative: 0.78,
      },
      cbtAnalysis: {
        distortions: [
          { type: 'Should Statements', confidence: 0.72, evidence: 'I thought providing was enough', alternativeThought: 'There are many valid ways to show love; I can learn new ones', momentIndex: 2 },
        ],
        dominantPatterns: ['Emotional avoidance', 'Masculine role rigidity'],
        behavioralPatterns: ['Withdrawal from emotional engagement', 'Going through motions', 'TV as avoidance'],
        automaticThoughts: [
          { content: 'I should be able to just provide and that should be enough', beliefStrength: 0.70, supportsWellbeing: false },
          { content: 'I don\'t know how to do what they need', beliefStrength: 0.75, supportsWellbeing: false },
        ],
        overallDistortionLoad: 0.50,
        treatmentReadiness: 0.55,
      },
      similarCases: [],
      practitionerMatches: [
        {
          id: 1,
          code: 'PM-004',
          name: 'Dr. Marcus Webb',
          specialty: 'Emotionally Focused Therapy',
          methodology: 'EFT for Individual Attachment Work',
          matchScore: 0.86,
          interventionSequence: ['Identify withdrawal cycle and triggers', 'Access underlying attachment fears', 'Facilitate emotional expression in session', 'Generalize vulnerability to partner interactions'],
          outcomePatterns: [
            { metric: 'Relational improvement', change: '+73%', confidence: 0.82 },
            { metric: 'Emotional vocabulary expansion', change: 'Significant', confidence: 0.78 },
          ],
          matchReasoning: 'Accessing underlying attachment fears beneath withdrawal behavior',
          targetStructures: ['emotion', 'social', 'narrative'],
        },
      ],
      sessionHistory: [
        { session: 1, emotionalIntensity: 4.5, reflectiveCapacity: 3.8, emotionalRegulation: 5.0, therapeuticAlliance: 3.5 },
      ],
      therapistMoves: [
        { type: 'empathic_attunement', count: 3, percentage: 37 },
        { type: 'reflection', count: 2, percentage: 25 },
        { type: 'interpretation', count: 2, percentage: 25 },
        { type: 'silence', count: 1, percentage: 12 },
      ],
      clinicianReport: 'Session 1: Male, 40s, presenting with relational distress at partner\'s insistence. Demonstrates alexithymic features — limited emotional vocabulary, difficulty accessing affect, relies on intellectualization and behavioral description rather than emotional expression. Intergenerational pattern clear: father modeled stoic, provider-only masculinity. Client is willing to engage but struggles to go beyond surface-level reflection. Rapport established; client seems relieved to have space to explore. Recommend building emotional vocabulary gradually; normalize difficulty; avoid pushing too fast.',
      patientReport: 'Thank you for coming in today. I know this wasn\'t easy, and it takes real courage to sit in a room and talk about things you usually keep inside. What I noticed today is that you do care deeply — about Sarah, about your kids. The challenge isn\'t that the love isn\'t there; it\'s that you haven\'t been taught how to express it in ways they can feel. That\'s a skill, and skills can be learned. For this week, try noticing one moment each day where you feel something — anything — and just name it silently to yourself.',
      analysisStatus: 'complete',
      analysisWarnings: [],
    },
  },
  {
    session_number: 2,
    session_date: '2026-03-26T14:00:00Z',
    treatment_goals: 'Build emotional vocabulary; explore withdrawal pattern triggers',
    status: 'complete',
    transcript: `Therapist: Were you able to try the noticing exercise this week?

Client: I tried. It's harder than I expected. Most of the time I notice... nothing. But there was one moment. Sarah was putting the kids to bed and she was singing to our daughter, and I felt... something. In my chest. Something warm.

Therapist: A warmth in your chest. Can you stay with that for a moment? What else was there?

Client: I think it was... love? Or maybe sadness that I don't do that. That I'm not part of those moments the way she is. I stood in the doorway watching and I thought, "I should be in there." But I didn't go in.

Therapist: What stopped you?

Client: I don't know. Habit? Fear? Like if I walked in and tried to be part of it, it would be awkward. They have their rhythm and I'm... outside it.

Therapist: So there's a sense of being on the outside of your own family's intimacy. That must be lonely.

Client: [voice changes] Yeah. It is lonely. God, I haven't said that word out loud in... maybe ever.

Therapist: What's it like to say it now?

Client: Scary. But also... a relief? Like I've been carrying this thing alone and just naming it makes it lighter.`,
    analysis_result: {
      quickInsight: {
        riskLevel: 'low',
        clinicalPriority: 'First emotional breakthrough — loneliness acknowledged; build from this opening',
        prognosis: 'Improving — client demonstrating capacity to access and name emotions when guided',
        topRecommendation: 'Gently expand emotional vocabulary; use somatic cues as gateway to affect; explore the "doorway" metaphor',
        sessionNumber: 2,
      },
      moments: [
        {
          id: 1,
          timestamp: '00:02:00',
          quote: 'Sarah was putting the kids to bed and she was singing to our daughter, and I felt something. In my chest. Something warm.',
          context: 'First somatic emotional awareness reported between sessions. Gateway to affect through body.',
          type: 'recalled_past',
          valence: 'positive',
          intensity: 5,
          structures: ['body', 'emotion', 'social'],
          therapistMove: 'empathic_attunement',
          therapistQuote: 'A warmth in your chest. Can you stay with that for a moment?',
        },
        {
          id: 2,
          timestamp: '00:04:30',
          quote: 'I stood in the doorway watching and I thought, "I should be in there." But I didn\'t go in.',
          context: 'Powerful metaphor — literally and figuratively on the threshold of emotional connection.',
          type: 'recalled_past',
          valence: 'negative',
          intensity: 6,
          structures: ['behaviour', 'social', 'emotion'],
          therapistMove: 'reflection',
          therapistQuote: 'What stopped you?',
        },
        {
          id: 3,
          timestamp: '00:06:45',
          quote: 'It is lonely. I haven\'t said that word out loud in maybe ever.',
          context: 'Breakthrough moment — first time naming core emotional state. Voice change indicates genuine affect.',
          type: 'immediate_experience',
          valence: 'negative',
          intensity: 8,
          structures: ['emotion', 'reflective', 'narrative'],
          therapistMove: 'reflection',
          therapistQuote: 'What\'s it like to say it now?',
        },
        {
          id: 4,
          timestamp: '00:07:30',
          quote: 'Naming it makes it lighter.',
          context: 'Experience of emotional expression as relief rather than threat. Key therapeutic moment.',
          type: 'immediate_experience',
          valence: 'positive',
          intensity: 6,
          structures: ['emotion', 'reflective', 'cognitive'],
          therapistMove: 'silence',
          therapistQuote: '[Therapist allowed the relief of this naming to settle]',
        },
      ],
      riskFlags: [],
      structureProfile: {
        body: 0.50,
        immediate_experience: 0.55,
        emotion: 0.62,
        behaviour: 0.55,
        social: 0.78,
        cognitive: 0.58,
        reflective: 0.60,
        narrative: 0.70,
        ecological: 0.42,
        normative: 0.72,
      },
      cbtAnalysis: {
        distortions: [
          { type: 'Fortune Telling', confidence: 0.65, evidence: 'If I walked in it would be awkward', alternativeThought: 'I could try stepping in and see what actually happens', momentIndex: 1 },
        ],
        dominantPatterns: ['Avoidance of vulnerability', 'Fortune Telling'],
        behavioralPatterns: ['Observation from distance', 'Emotion naming (emerging)', 'Somatic awareness (new)'],
        automaticThoughts: [
          { content: 'They have their rhythm and I\'m outside it', beliefStrength: 0.65, supportsWellbeing: false },
          { content: 'Naming feelings makes them lighter', beliefStrength: 0.50, supportsWellbeing: true },
        ],
        overallDistortionLoad: 0.42,
        treatmentReadiness: 0.65,
      },
      similarCases: [],
      practitionerMatches: [],
      sessionHistory: [
        { session: 1, emotionalIntensity: 4.5, reflectiveCapacity: 3.8, emotionalRegulation: 5.0, therapeuticAlliance: 3.5 },
        { session: 2, emotionalIntensity: 6.2, reflectiveCapacity: 4.5, emotionalRegulation: 4.8, therapeuticAlliance: 4.2 },
      ],
      therapistMoves: [
        { type: 'empathic_attunement', count: 3, percentage: 37 },
        { type: 'reflection', count: 3, percentage: 37 },
        { type: 'silence', count: 2, percentage: 25 },
      ],
      clinicianReport: 'Session 2: Significant emotional breakthrough. Client reported first between-session somatic awareness of emotion (warmth in chest while observing wife with children). The "doorway" metaphor is rich and worth returning to — client literally and figuratively standing at the threshold of connection. Most significant moment: naming loneliness for the first time ("maybe ever"). Voice change and visible affect shift indicate genuine emotional access. Client experienced naming as relief, not threat — very encouraging for prognosis.',
      patientReport: 'Something important happened today — you named loneliness. And you noticed that saying it out loud made it lighter, not heavier. That moment in the doorway watching Sarah sing to your daughter — the warmth you felt and the sadness that you weren\'t in there — that\'s your heart telling you what it wants. This week, try one small "walking through the doorway" moment. It doesn\'t have to be big. Maybe sitting on the bed while Sarah reads to the kids. Just being in the room.',
      analysisStatus: 'complete',
      analysisWarnings: [],
    },
  },
  {
    session_number: 3,
    session_date: '2026-04-09T14:00:00Z',
    treatment_goals: 'Process first vulnerable conversation with partner; deepen emotional expression',
    status: 'complete',
    transcript: `Therapist: You look different today. Something shifted?

Client: I told Sarah. About being lonely. We were lying in bed on Saturday night and I just... said it. "I feel lonely in our marriage. And I know it's my fault."

Therapist: What happened?

Client: She cried. But not angry crying. She said, "I've been waiting three years for you to say something real to me." And then she held me and I... I cried too. First time in I don't know how long.

Therapist: How was that — letting yourself be seen like that?

Client: Terrifying and wonderful at the same time. Like jumping off a cliff and discovering you can fly. I kept waiting for the shame to hit. For her to think less of me. But she just... held me tighter.

Therapist: The thing you were most afraid of — being vulnerable — turned out to be exactly what she needed from you.

Client: I wasted so much time being scared of something that was actually what would save us. That makes me angry at myself.

Therapist: I notice that shift — from tenderness to self-criticism. Can you hold both? The grief about lost time AND the gratitude that you're here now?

Client: [pause] Yeah. I can try. I'm here now. That has to count for something.`,
    analysis_result: {
      quickInsight: {
        riskLevel: 'low',
        clinicalPriority: 'Processing relational breakthrough; managing self-criticism about "wasted time"; deepening vulnerability capacity',
        prognosis: 'Good — major relational breakthrough; partner responsive; cycle of withdrawal beginning to shift',
        topRecommendation: 'Validate courage of vulnerability; address self-blame gently; build on breakthrough without pressure to perform',
        sessionNumber: 3,
      },
      moments: [
        {
          id: 1,
          timestamp: '00:01:00',
          quote: 'I told Sarah. About being lonely. I just said it.',
          context: 'Client reporting major between-session behavioral experiment — direct emotional communication with partner.',
          type: 'recalled_past',
          valence: 'positive',
          intensity: 7,
          structures: ['social', 'emotion', 'behaviour'],
          therapistMove: 'reflection',
          therapistQuote: 'What happened?',
        },
        {
          id: 2,
          timestamp: '00:02:45',
          quote: 'She said, "I\'ve been waiting three years for you to say something real to me." And then she held me and I cried too.',
          context: 'Partner\'s response — validation and connection. Client allowing tears for first time in years.',
          type: 'recalled_past',
          valence: 'positive',
          intensity: 9,
          structures: ['emotion', 'social', 'body', 'immediate_experience'],
          therapistMove: 'empathic_attunement',
          therapistQuote: 'How was that — letting yourself be seen like that?',
        },
        {
          id: 3,
          timestamp: '00:04:20',
          quote: 'Like jumping off a cliff and discovering you can fly. I kept waiting for the shame to hit but she just held me tighter.',
          context: 'Disconfirmation of shame prediction. Vulnerability met with closeness, not rejection.',
          type: 'reflective',
          valence: 'positive',
          intensity: 8,
          structures: ['emotion', 'cognitive', 'social', 'reflective'],
          therapistMove: 'interpretation',
          therapistQuote: 'The thing you were most afraid of turned out to be exactly what she needed from you.',
        },
        {
          id: 4,
          timestamp: '00:06:00',
          quote: 'I wasted so much time being scared of something that was actually what would save us.',
          context: 'Grief emerging alongside progress — common pattern when clients realize the cost of old strategies.',
          type: 'reflective',
          valence: 'mixed',
          intensity: 7,
          structures: ['narrative', 'emotion', 'cognitive'],
          therapistMove: 'challenge',
          therapistQuote: 'Can you hold both? The grief about lost time AND the gratitude that you\'re here now?',
        },
        {
          id: 5,
          timestamp: '00:07:30',
          quote: 'I\'m here now. That has to count for something.',
          context: 'Self-compassion emerging within self-criticism. Present-moment orientation developing.',
          type: 'reflective',
          valence: 'positive',
          intensity: 5,
          structures: ['reflective', 'cognitive', 'emotion'],
          therapistMove: 'silence',
          therapistQuote: '[Therapist allowed this landing to settle]',
        },
      ],
      riskFlags: [
        {
          id: 1,
          signal: 'Self-Criticism Risk',
          severity: 'low',
          detail: '"I wasted so much time" — shift from tenderness to anger at self',
          algorithmMatch: 'wasted time, self-blame, self-criticism, anger at self',
          recommendation: 'Monitor for excessive self-blame; redirect toward self-compassion; normalize grief as part of growth',
          interventionType: 'monitor',
        },
      ],
      structureProfile: {
        body: 0.55,
        immediate_experience: 0.62,
        emotion: 0.78,
        behaviour: 0.72,
        social: 0.85,
        cognitive: 0.68,
        reflective: 0.72,
        narrative: 0.75,
        ecological: 0.48,
        normative: 0.65,
      },
      cbtAnalysis: {
        distortions: [
          { type: 'All-or-Nothing (self-directed)', confidence: 0.55, evidence: 'I wasted so much time', alternativeThought: 'I\'m changing now and that matters', momentIndex: 3 },
        ],
        dominantPatterns: ['Self-criticism about past avoidance', 'All-or-Nothing (weakening)'],
        behavioralPatterns: ['Direct emotional communication (new)', 'Allowing tears', 'Physical closeness with partner'],
        automaticThoughts: [
          { content: 'I\'m here now and that counts', beliefStrength: 0.55, supportsWellbeing: true },
          { content: 'Vulnerability brings connection, not rejection', beliefStrength: 0.60, supportsWellbeing: true },
        ],
        overallDistortionLoad: 0.32,
        treatmentReadiness: 0.78,
      },
      similarCases: [
        {
          id: 1,
          patientCode: 'SC-0845',
          matchScore: 0.88,
          presentingConcerns: ['emotional avoidance', 'partner-prompted therapy', 'first vulnerability breakthrough'],
          dominantStructures: ['social', 'emotion', 'normative', 'narrative'],
          sessionCount: 10,
          keyThemes: ['Emotional avoidance', 'Intergenerational stoicism', 'Vulnerability practice', 'Partner responsiveness'],
          outcome: 'Significant improvement',
          outcomeDetail: 'Couple reported 60% improvement in relational satisfaction at 3 months. Individual depressive symptoms resolved. Partners of emotionally avoidant men often respond with immediate warmth when vulnerability appears.',
          representativeQuote: 'The night I told her I was scared of losing her, she held me like she\'d been waiting years for me to say it. She had.',
        },
      ],
      practitionerMatches: [
        {
          id: 1,
          code: 'PM-004',
          name: 'Dr. Marcus Webb',
          specialty: 'Emotionally Focused Therapy',
          methodology: 'EFT for Attachment Repair',
          matchScore: 0.91,
          interventionSequence: ['Process breakthrough vulnerability experience', 'Use positive partner response as corrective emotional experience', 'Update internal attachment model', 'Generalize emotional expression to other relationships'],
          outcomePatterns: [
            { metric: 'Sustained relational improvement at 6 months', change: '+85%', confidence: 0.86 },
            { metric: 'Depressive symptom resolution', change: 'Full resolution', confidence: 0.78 },
          ],
          matchReasoning: 'Using positive partner response as corrective emotional experience to update attachment model',
          targetStructures: ['emotion', 'social', 'narrative', 'reflective'],
        },
      ],
      sessionHistory: [
        { session: 1, emotionalIntensity: 4.5, reflectiveCapacity: 3.8, emotionalRegulation: 5.0, therapeuticAlliance: 3.5 },
        { session: 2, emotionalIntensity: 6.2, reflectiveCapacity: 4.5, emotionalRegulation: 4.8, therapeuticAlliance: 4.2 },
        { session: 3, emotionalIntensity: 7.8, reflectiveCapacity: 5.2, emotionalRegulation: 4.5, therapeuticAlliance: 4.8 },
      ],
      therapistMoves: [
        { type: 'empathic_attunement', count: 3, percentage: 30 },
        { type: 'reflection', count: 3, percentage: 30 },
        { type: 'interpretation', count: 2, percentage: 20 },
        { type: 'challenge', count: 1, percentage: 10 },
        { type: 'silence', count: 1, percentage: 10 },
      ],
      clinicianReport: 'Session 3: Major breakthrough. Client independently disclosed loneliness to partner — first direct emotional communication in years. Partner responded with immediate warmth and tears ("I\'ve been waiting three years"). Client allowed himself to cry, experienced connection rather than expected shame. This is a corrective emotional experience of high therapeutic value. Self-criticism emerging about "wasted time" — needs gentle addressing. PHQ-9 improved to 9 (from 12). Prognosis upgraded to good.',
      patientReport: 'What you did this week took immense courage. Telling Sarah you feel lonely — and allowing yourself to cry with her — was the bravest thing you\'ve done in a long time. And notice: she didn\'t judge you or think less of you. She held you tighter. That\'s what vulnerability does — it invites connection. Be gentle with yourself about the time you feel was "wasted." You\'re here now, and that matters. This week, try one more small moment of honesty with Sarah. It doesn\'t have to be as big as Saturday — even "I liked spending time with you tonight" counts.',
      analysisStatus: 'complete',
      analysisWarnings: [],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT 3: CL-2156 — Social anxiety & identity exploration, 2 sessions
// ═══════════════════════════════════════════════════════════════════════════════

const client3 = {
  therapist_id: DEV_THERAPIST_ID,
  client_code: 'CL-2156',
  gender: 'other',
  age_range: 'young-adult',
  treatment_goals: [
    'Reduce social anxiety in professional settings',
    'Explore gender identity with less self-judgment',
    'Build authentic self-expression capacity',
    'Develop distress tolerance for identity uncertainty',
  ],
  presenting_concerns: ['Social anxiety', 'Identity exploration', 'Self-expression difficulties', 'Workplace authenticity'],
  diagnostic_considerations: ['Social Anxiety Disorder', 'Gender Dysphoria (exploratory)'],
  current_risk_level: 'low',
  key_themes: ['Authenticity', 'Social performance', 'Gender identity', 'Belonging', 'Vulnerability in groups'],
  dominant_structures: ['social', 'normative', 'narrative', 'emotion'],
  preferred_approach: 'Affirmative therapy with ACT elements',
  clinical_notes: 'Young professional presenting with social anxiety intersecting with gender identity exploration. Highly articulate and self-aware but struggles to bring authentic self into social contexts. Uses intellectualization as defense. Good engagement from session one. Early stage but promising trajectory.',
  total_sessions: 2,
  is_confirmed: true,
  last_confirmed_at: '2026-04-14T11:00:00Z',
  status: 'active',
  created_at: '2026-04-07T11:00:00Z',
  updated_at: '2026-04-14T11:00:00Z',
  outcome_tracking_enabled: true,
  outcome_scores: [
    { date: '2026-04-07', phq9: 8, gad7: 13, note: 'Intake — moderate anxiety, mild depression' },
    { date: '2026-04-14', phq9: 7, gad7: 12, note: 'Slight improvement; feeling heard' },
  ],
  deleted_at: null,
};

const client3Sessions = [
  {
    session_number: 1,
    session_date: '2026-04-07T11:00:00Z',
    treatment_goals: 'Initial assessment; understand social anxiety context; explore identity concerns',
    status: 'complete',
    transcript: `Therapist: Welcome. Tell me what's been going on for you.

Client: So I've been struggling with this thing where... I know who I am when I'm alone. Like, at home, in my journal, I feel clear. I'm non-binary, I use they/them, I'm creative, I'm thoughtful. But the second I walk into work or a social situation, all of that disappears and I become this... performance of normalcy.

Therapist: A performance. Say more about what that performance looks like.

Client: I code-switch. I use my deadname with colleagues because it's "easier." I laugh at jokes that actually hurt. I shrink myself to fit into spaces that weren't designed for me. And then I go home exhausted because maintaining that mask takes everything I have.

Therapist: So the exhaustion isn't just social anxiety — it's the energy cost of suppressing your authentic self.

Client: Exactly. And I know, intellectually, that I could just... be myself. People probably wouldn't care that much. But there's this terror. Like if I show the real me and they reject it, there's nowhere left to hide.

Therapist: If the mask gets rejected, you can always put on a different one. But if the real you gets rejected...

Client: Then it's actually me they're rejecting. Not the character I'm playing. And I don't know if I could survive that.

Therapist: That's a really honest and vulnerable thing to name. The stakes feel existential — not just social discomfort but a threat to your core self.

Client: Yeah. I think that's why I keep choosing the mask. It's lonely but it's safe.`,
    analysis_result: {
      quickInsight: {
        riskLevel: 'low',
        clinicalPriority: 'Social anxiety intertwined with identity suppression; authenticity vs. safety conflict central',
        prognosis: 'Good — client is highly articulate, insightful, and motivated; strong capacity for therapeutic work',
        topRecommendation: 'Validate the protective function of masking while gently exploring small experiments in authenticity',
        sessionNumber: 1,
      },
      moments: [
        {
          id: 1,
          timestamp: '00:01:45',
          quote: 'I know who I am when I\'m alone. But the second I walk into work or a social situation, all of that disappears and I become this performance of normalcy.',
          context: 'Core presentation articulated with clarity — authentic self exists but is suppressed in social contexts.',
          type: 'reflective',
          valence: 'negative',
          intensity: 7,
          structures: ['narrative', 'social', 'normative'],
          therapistMove: 'reflection',
          therapistQuote: 'A performance. Say more about what that performance looks like.',
        },
        {
          id: 2,
          timestamp: '00:03:30',
          quote: 'I use my deadname with colleagues because it\'s "easier." I laugh at jokes that actually hurt. I shrink myself to fit into spaces that weren\'t designed for me.',
          context: 'Specific examples of self-suppression — deadnaming self, tolerating microaggressions, literal shrinking.',
          type: 'recalled_past',
          valence: 'negative',
          intensity: 7,
          structures: ['behaviour', 'social', 'normative', 'emotion'],
          therapistMove: 'interpretation',
          therapistQuote: 'The exhaustion isn\'t just social anxiety — it\'s the energy cost of suppressing your authentic self.',
        },
        {
          id: 3,
          timestamp: '00:05:15',
          quote: 'If I show the real me and they reject it, there\'s nowhere left to hide.',
          context: 'Core fear articulated — vulnerability of authenticity. Existential stakes of being seen.',
          type: 'immediate_experience',
          valence: 'negative',
          intensity: 8,
          structures: ['emotion', 'cognitive', 'social'],
          therapistMove: 'empathic_attunement',
          therapistQuote: 'If the mask gets rejected, you can always put on a different one. But if the real you gets rejected...',
        },
        {
          id: 4,
          timestamp: '00:07:00',
          quote: 'I keep choosing the mask. It\'s lonely but it\'s safe.',
          context: 'Client naming the trade-off consciously — safety purchased at the cost of connection and authenticity.',
          type: 'reflective',
          valence: 'mixed',
          intensity: 6,
          structures: ['reflective', 'emotion', 'behaviour'],
          therapistMove: 'silence',
          therapistQuote: '[Therapist held space for this painful recognition]',
        },
      ],
      riskFlags: [
        {
          id: 1,
          signal: 'Identity-Related Distress',
          severity: 'low',
          detail: 'Self-deadnaming; describes suppression as exhausting; fear of existential rejection',
          algorithmMatch: 'deadnaming, identity suppression, exhaustion, rejection fear, minority stress',
          recommendation: 'Affirm identity; explore safe contexts for authenticity; monitor for minority stress escalation',
          interventionType: 'monitor',
        },
      ],
      structureProfile: {
        body: 0.40,
        immediate_experience: 0.60,
        emotion: 0.72,
        behaviour: 0.68,
        social: 0.88,
        cognitive: 0.75,
        reflective: 0.78,
        narrative: 0.82,
        ecological: 0.55,
        normative: 0.85,
      },
      cbtAnalysis: {
        distortions: [
          { type: 'Catastrophizing', confidence: 0.78, evidence: 'I don\'t know if I could survive that [rejection]', alternativeThought: 'Rejection would be painful but not annihilating; I have survived difficulty before', momentIndex: 2 },
          { type: 'Fortune Telling', confidence: 0.72, evidence: 'Assumes rejection is the most likely outcome of authenticity', alternativeThought: 'Some people will affirm me; I don\'t know who until I try', momentIndex: 2 },
        ],
        dominantPatterns: ['Catastrophizing about social rejection', 'Fortune Telling', 'Safety behaviors (masking)'],
        behavioralPatterns: ['Code-switching', 'Self-deadnaming', 'Masking authentic expression', 'Intellectual engagement as defense'],
        automaticThoughts: [
          { content: 'Being myself will lead to rejection', beliefStrength: 0.75, supportsWellbeing: false },
          { content: 'The mask is lonely but safe', beliefStrength: 0.70, supportsWellbeing: false },
        ],
        overallDistortionLoad: 0.55,
        treatmentReadiness: 0.72,
      },
      similarCases: [
        {
          id: 1,
          patientCode: 'SC-0956',
          matchScore: 0.86,
          presentingConcerns: ['non-binary identity', 'workplace masking', 'social anxiety', 'authenticity conflict'],
          dominantStructures: ['social', 'normative', 'narrative', 'emotion'],
          sessionCount: 8,
          keyThemes: ['Graded authenticity', 'Safe person identification', 'Minority stress processing', 'Values clarification'],
          outcome: 'Significant improvement',
          outcomeDetail: 'Anxiety reduced by 45% over 8 sessions. Came out at work to 3 colleagues. Reports feeling "actually present" for first time. Clients who start with one safe person tend to generalize more successfully.',
          representativeQuote: 'The first time someone at work used my real name, I felt like I existed for the first time in that building.',
        },
      ],
      practitionerMatches: [
        {
          id: 1,
          code: 'PM-005',
          name: 'Dr. Alex Rivera',
          specialty: 'Gender-Affirmative Therapy',
          methodology: 'ACT-based Affirmative Therapy',
          matchScore: 0.90,
          interventionSequence: ['Affirm identity and validate masking as protective', 'Clarify core values around authenticity', 'Design graded authenticity experiments starting with safest contexts', 'Process minority stress and build resilience toolkit'],
          outcomePatterns: [
            { metric: 'Clinically significant anxiety reduction', change: '-82%', confidence: 0.84 },
            { metric: 'Authenticity in social contexts', change: 'Significant improvement', confidence: 0.80 },
          ],
          matchReasoning: 'Values-based behavioral experiments in authenticity — starting with lowest-stakes contexts',
          targetStructures: ['social', 'normative', 'narrative', 'behaviour'],
        },
      ],
      sessionHistory: [
        { session: 1, emotionalIntensity: 7.0, reflectiveCapacity: 5.5, emotionalRegulation: 4.5, therapeuticAlliance: 4.2 },
      ],
      therapistMoves: [
        { type: 'reflection', count: 2, percentage: 29 },
        { type: 'empathic_attunement', count: 2, percentage: 29 },
        { type: 'interpretation', count: 2, percentage: 29 },
        { type: 'silence', count: 1, percentage: 14 },
      ],
      clinicianReport: 'Session 1: Non-binary client, 20s, presenting with social anxiety intertwined with identity suppression. Highly articulate and self-aware — demonstrates strong reflective capacity from session one. Core conflict: authenticity vs. safety. Masks identity at work (uses deadname, tolerates microaggressions) at significant psychological cost (exhaustion, loneliness). Fear is existential: "If the real me gets rejected, there\'s nowhere to hide." Intellectualization serves as defense but client readily accesses emotion when held. Recommend affirmative approach with gradual authenticity experiments.',
      patientReport: 'Thank you for trusting me with something so personal today. What you shared about the gap between who you are at home and who you perform at work — that\'s not a small thing. The exhaustion you feel makes complete sense: maintaining a mask is incredibly draining work. I also want to name something you said that felt important: "It\'s lonely but it\'s safe." That trade-off is real, and you\'re allowed to question whether it\'s still worth the cost. For this week, notice one moment where you feel the mask go on. You don\'t have to change anything — just notice.',
      analysisStatus: 'complete',
      analysisWarnings: [],
    },
  },
  {
    session_number: 2,
    session_date: '2026-04-14T11:00:00Z',
    treatment_goals: 'Explore safe contexts for authenticity; identify values around self-expression',
    status: 'complete',
    transcript: `Therapist: How has the noticing gone this week?

Client: Constantly. [laughs] Once you start looking for the mask, you see it everywhere. But the interesting thing is — I noticed that there are degrees. Like, with my friend Jamie, I'm maybe 80% myself. With my team at work, maybe 30%. With my parents... [sighs] Maybe 10%.

Therapist: So it's not binary — mask on or off. There's a spectrum of how much of yourself you let show, depending on who you're with.

Client: Right. And that's actually helpful because it means I don't have to go from 0 to 100. I can just... nudge it. Like, what if I went from 30% to 40% at work? That feels less terrifying than "be your full authentic self in front of everyone."

Therapist: You're finding your own pace. What would 40% look like?

Client: Maybe... correcting someone when they use my deadname? I haven't told anyone at work my real name yet. But my closest colleague, Priya — I think she'd be cool with it. She uses they/them for another friend already.

Therapist: You've already identified a safe person to try this with. That's significant.

Client: It is? It just feels like such a small thing compared to where I want to end up.

Therapist: Small experiments create real data. Right now your anxiety is running on predictions. Priya's actual response would be information — not imagination.

Client: [smiles] Okay. Yeah. Maybe I'll talk to Priya this week. The real me is so tired of being a secret.`,
    analysis_result: {
      quickInsight: {
        riskLevel: 'low',
        clinicalPriority: 'Client self-generating graded exposure plan; support authentic self-disclosure experiment with identified safe person',
        prognosis: 'Good — client showing agency, self-awareness, and willingness to take calibrated risks',
        topRecommendation: 'Support Priya disclosure experiment; process outcome regardless of response; continue values exploration',
        sessionNumber: 2,
      },
      moments: [
        {
          id: 1,
          timestamp: '00:01:30',
          quote: 'Once you start looking for the mask, you see it everywhere. With my friend Jamie, I\'m maybe 80% myself. With my team, maybe 30%. With my parents, maybe 10%.',
          context: 'Client developed nuanced awareness of authenticity spectrum. Moving beyond binary thinking about masking.',
          type: 'reflective',
          valence: 'mixed',
          intensity: 5,
          structures: ['reflective', 'social', 'cognitive'],
          therapistMove: 'interpretation',
          therapistQuote: 'It\'s not binary. There\'s a spectrum depending on who you\'re with.',
        },
        {
          id: 2,
          timestamp: '00:03:45',
          quote: 'What if I went from 30% to 40% at work? That feels less terrifying than "be your full authentic self in front of everyone."',
          context: 'Client self-generating graded approach. Therapeutic insight emerging independently.',
          type: 'future_oriented',
          valence: 'positive',
          intensity: 5,
          structures: ['cognitive', 'behaviour', 'social'],
          therapistMove: 'reflection',
          therapistQuote: 'You\'re finding your own pace. What would 40% look like?',
        },
        {
          id: 3,
          timestamp: '00:05:30',
          quote: 'My closest colleague, Priya — I think she\'d be cool with it. She uses they/them for another friend already.',
          context: 'Identified specific safe person for authenticity experiment. Grounding prediction in evidence.',
          type: 'future_oriented',
          valence: 'positive',
          intensity: 5,
          structures: ['social', 'behaviour', 'cognitive'],
          therapistMove: 'empathic_attunement',
          therapistQuote: 'You\'ve already identified a safe person to try this with. That\'s significant.',
        },
        {
          id: 4,
          timestamp: '00:07:45',
          quote: 'The real me is so tired of being a secret.',
          context: 'Emotional declaration of readiness for change. Internal motivation crystallizing.',
          type: 'immediate_experience',
          valence: 'mixed',
          intensity: 7,
          structures: ['emotion', 'narrative', 'reflective'],
          therapistMove: 'silence',
          therapistQuote: '[Therapist honored this statement with space]',
        },
      ],
      riskFlags: [],
      structureProfile: {
        body: 0.38,
        immediate_experience: 0.58,
        emotion: 0.68,
        behaviour: 0.72,
        social: 0.85,
        cognitive: 0.80,
        reflective: 0.82,
        narrative: 0.78,
        ecological: 0.52,
        normative: 0.80,
      },
      cbtAnalysis: {
        distortions: [
          { type: 'Minimization', confidence: 0.55, evidence: 'It just feels like such a small thing', alternativeThought: 'Small experiments create real data and build toward bigger change', momentIndex: 1 },
        ],
        dominantPatterns: ['Minimization of progress', 'Fortune Telling (weakening)'],
        behavioralPatterns: ['Awareness of masking degrees (new)', 'Self-generated graded exposure', 'Identifying safe people'],
        automaticThoughts: [
          { content: 'I can go from 30% to 40% — I don\'t have to be 100% all at once', beliefStrength: 0.60, supportsWellbeing: true },
          { content: 'Priya would probably be safe to try with', beliefStrength: 0.65, supportsWellbeing: true },
          { content: 'The real me is tired of being a secret', beliefStrength: 0.75, supportsWellbeing: true },
        ],
        overallDistortionLoad: 0.38,
        treatmentReadiness: 0.80,
      },
      similarCases: [],
      practitionerMatches: [],
      sessionHistory: [
        { session: 1, emotionalIntensity: 7.0, reflectiveCapacity: 5.5, emotionalRegulation: 4.5, therapeuticAlliance: 4.2 },
        { session: 2, emotionalIntensity: 5.8, reflectiveCapacity: 6.0, emotionalRegulation: 5.0, therapeuticAlliance: 4.8 },
      ],
      therapistMoves: [
        { type: 'reflection', count: 2, percentage: 33 },
        { type: 'interpretation', count: 2, percentage: 33 },
        { type: 'empathic_attunement', count: 1, percentage: 17 },
        { type: 'silence', count: 1, percentage: 17 },
      ],
      clinicianReport: 'Session 2: Excellent engagement and self-directed progress. Client independently developed a nuanced "percentage" framework for authenticity across relationships — moving beyond binary masking/unmasking conceptualization. Self-generated a graded exposure plan (30% → 40% at work). Identified specific safe colleague (Priya) for name disclosure experiment. Shows strong agency, reflective capacity, and emerging readiness for behavioral change. The statement "the real me is tired of being a secret" indicates motivational tipping point.',
      patientReport: 'The framework you developed — thinking of authenticity as percentages rather than all-or-nothing — is genuinely sophisticated. It gives you permission to move at your own pace rather than feeling like you have to bare everything at once. Talking to Priya about your name would be a beautiful first experiment. Remember: whatever happens is information. If she responds well, wonderful. If it\'s awkward, you\'ll have handled it and that\'s data too. You\'re not a secret anymore — you\'re just choosing how and when to unfold.',
      analysisStatus: 'complete',
      analysisWarnings: [],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('🌱 SessionLens v3 Demo Seed Script');
  console.log('═══════════════════════════════════════════');
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`Therapist ID: ${DEV_THERAPIST_ID}`);
  console.log('');

  // Step 1: Delete existing demo data
  console.log('🗑️  Cleaning existing demo data...');

  // Delete sessions first (FK dependency)
  const { error: delSessionsErr } = await supabase
    .from('sessions')
    .delete()
    .eq('therapist_id', DEV_THERAPIST_ID);

  if (delSessionsErr) {
    console.error('  Error deleting sessions:', delSessionsErr.message);
  } else {
    console.log('  ✓ Sessions deleted');
  }

  // Delete clients — also clear any soft-deleted records that may block unique constraint
  const { error: delClientsErr } = await supabase
    .from('clients')
    .delete()
    .eq('therapist_id', DEV_THERAPIST_ID);

  if (delClientsErr) {
    console.error('  Error deleting clients:', delClientsErr.message);
    // Try deleting by specific client codes as fallback
    for (const code of ['CL-4521', 'CL-7803', 'CL-2156']) {
      await supabase.from('clients').delete().eq('client_code', code).eq('therapist_id', DEV_THERAPIST_ID);
    }
    console.log('  ✓ Clients cleaned up (fallback)');
  } else {
    console.log('  ✓ Clients deleted');
  }

  console.log('');

  // Step 2: Insert clients
  console.log('👤 Inserting clients...');

  const clients = [client1, client2, client3];
  const insertedClients: Record<string, string> = {}; // clientCode -> client_id

  for (const client of clients) {
    const { data, error } = await supabase
      .from('clients')
      .insert(client)
      .select('client_id, client_code')
      .single();

    if (error) {
      console.error(`  ✗ Error inserting ${client.client_code}:`, error.message);
      continue;
    }

    insertedClients[data.client_code] = data.client_id;
    console.log(`  ✓ ${client.client_code} → ${data.client_id}`);
  }

  console.log('');

  // Step 3: Insert sessions
  console.log('📋 Inserting sessions...');

  const allSessions = [
    { clientCode: 'CL-4521', sessions: client1Sessions },
    { clientCode: 'CL-7803', sessions: client2Sessions },
    { clientCode: 'CL-2156', sessions: client3Sessions },
  ];

  for (const { clientCode, sessions } of allSessions) {
    const clientId = insertedClients[clientCode];
    if (!clientId) {
      console.error(`  ✗ Skipping sessions for ${clientCode} — client not inserted`);
      continue;
    }

    console.log(`  ${clientCode}:`);

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
  }

  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('✅ Demo seed complete!');
  console.log(`   ${clients.length} clients, ${client1Sessions.length + client2Sessions.length + client3Sessions.length} sessions`);
  console.log('');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
