/**
 * Demo Seed Script — Childhood Trauma → Recovery Arc
 * Seeds Supabase with realistic clinical demo data for an investor demo.
 *
 * ONE client (SL-2026-DEMO), THREE sessions — a carefully crafted clinical narrative
 * demonstrating childhood emotional neglect → panic attacks → recovery through
 * Schema Therapy with somatic integration.
 *
 * Usage: npx tsx scripts/seed-demo-trauma.ts
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
// CLIENT: SL-2026-DEMO — Female, 26-35
// Presents with panic attacks and relationship anxiety. SessionLens discovers
// childhood emotional neglect, abandonment schema, somatic panic, emotional
// dysregulation, and self-worth deficits rooted in early attachment injury.
// ═══════════════════════════════════════════════════════════════════════════════

const client1 = {
  therapist_id: DEV_THERAPIST_ID,
  client_code: 'SL-2026-DEMO',
  gender: 'female',
  age_range: 'adult',
  treatment_goals: [
    'Reduce panic attack frequency and intensity',
    'Understand childhood patterns driving current relationship anxiety',
    'Develop secure attachment behaviors in intimate relationships',
    'Build distress tolerance and emotional regulation skills',
    'Increase capacity for vulnerability and need-expression',
  ],
  presenting_concerns: ['Panic attacks', 'Relationship anxiety', 'Childhood emotional neglect', 'Fear of abandonment', 'Emotional dysregulation'],
  diagnostic_considerations: ['F41.0 Panic Disorder', 'F41.1 Generalized Anxiety Disorder', 'Z62.898 Childhood Emotional Neglect'],
  current_risk_level: 'low',
  key_themes: ['Abandonment fear', 'Emotional neglect', 'Attachment anxiety', 'Somatic panic', 'Self-worth'],
  dominant_structures: ['emotion', 'body', 'social', 'cognitive', 'narrative'],
  preferred_approach: 'Schema Therapy with somatic integration',
  clinical_notes: 'Female, 26-35, presenting with panic attacks triggered by perceived emotional distance from partner. Initial presentation appeared to be situational panic disorder with relationship stress. SessionLens pattern-matching revealed deeper profile: childhood emotional neglect schema (Emotional Deprivation, Abandonment/Instability) driving attachment anxiety in adult relationships. Somatic panic symptoms are the body\'s alarm for abandonment threat. Platform recommended Schema Therapy with somatic integration, incorporating limited reparenting for the neglected inner child. Client showed remarkable capacity for schema awareness once the childhood-to-present connection was made explicit. Three-session arc demonstrates movement from crisis presentation through schema identification to behavioral change and earned security.',
  total_sessions: 3,
  is_confirmed: true,
  last_confirmed_at: '2026-04-23T10:00:00Z',
  status: 'active',
  created_at: '2026-03-12T09:00:00Z',
  updated_at: '2026-04-23T10:00:00Z',
  outcome_tracking_enabled: true,
  outcome_scores: [
    { date: '2026-03-12', phq9: 14, gad7: 16, note: 'Intake — elevated anxiety with panic features, moderate depression. Attachment-triggered panic presentation.' },
    { date: '2026-03-26', phq9: 11, gad7: 13, note: 'Schema connection emerging. Partner-to-mother transference identified. Anger surfacing.' },
    { date: '2026-04-23', phq9: 7, gad7: 9, note: 'Significant improvement — successful need-expression with partner, boundary-setting with mother, narrative restructuring.' },
  ],
  deleted_at: null,
};

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION 1: "The Breaking Point" — 2026-03-12
// Client had a panic attack during an argument with partner about wanting more
// emotional closeness. Partner withdrew, triggering childhood abandonment schema.
// Key disclosure: Mother was emotionally unavailable, always "busy" or "tired."
// ═══════════════════════════════════════════════════════════════════════════════

const session1 = {
  session_number: 1,
  session_date: '2026-03-12T10:00:00Z',
  treatment_goals: 'Initial assessment; establish therapeutic alliance; identify panic triggers and attachment patterns; screen for childhood relational trauma',
  status: 'complete',
  transcript: `Therapist: Thank you for coming in today. Can you tell me what brought you here?

Patient: I had a panic attack three days ago. A really bad one. I was with my partner, Marcus, and we were having a conversation — not even a fight, really — and I just... I couldn't breathe. My hands went numb. I thought I was dying. He had to talk me down for twenty minutes on the bathroom floor.

Therapist: That sounds terrifying. Can you tell me what the conversation was about?

Patient: I was trying to tell him that I need more... closeness. More emotional connection. Like, he comes home and he goes straight to the couch and watches TV, and I just sit there waiting for him to notice me. And when I finally said something about it, he got quiet. He just... looked away. And that's when it hit me.

Therapist: What hit you — the panic?

Patient: Yeah. It was like my chest caved in. My heart was pounding so hard I could hear it. My hands went numb and tingly. I couldn't feel my fingers. And this wave of just... terror. Pure terror. Like something catastrophic was about to happen. I ran to the bathroom and locked the door.

Therapist: You locked the door. What were you feeling in that moment, beyond the physical panic?

Patient: [long pause] That he was going to leave. That I'd finally shown him how needy I am and he'd realize I'm too much. That he'd just... be done with me. I know that sounds crazy because he literally followed me to the bathroom to help me. But in that moment, I was absolutely certain he was gone.

Therapist: It doesn't sound crazy at all. The panic came when he went quiet — when he looked away. Has that kind of moment happened before? Someone going quiet, pulling back?

Patient: [voice drops] My mother. My mother did that. She was always... not there. Physically she was there, but she was always busy or tired or on her phone or just... checked out. I'd come home from school wanting to tell her something and she'd say "not now, honey" without even looking up. Every time. I learned to just... stop asking.

Therapist: You learned to stop asking for what you needed.

Patient: Yeah. And now when I try to ask Marcus for something — for closeness, for attention — and he doesn't respond the way I need, it's like I'm seven years old again, standing in the kitchen doorway, waiting for my mom to look up. And she never does.

Therapist: That's a really important connection you're making. The panic isn't just about Marcus. It's about a much older feeling.

Patient: I've never thought about it that way before. I just thought I was broken. Like, who has a panic attack because their boyfriend watches TV? But it's not about the TV, is it?

Therapist: No. It's not about the TV. Tell me more about what it was like growing up with your mother.

Patient: She wasn't mean. That's the confusing part. She wasn't abusive. She just... wasn't there. She'd forget to pick me up from school. She'd miss my recitals. She'd say "that's nice, honey" to everything without actually listening. I remember one time I drew her a picture — I was maybe six — and I was so proud of it. I brought it to her and she put it on the counter without looking at it and said she had a headache. I found it in the recycling the next day.

Therapist: [pause] What was it like to find your picture in the recycling?

Patient: [tears] I think that's when I decided my feelings don't matter. That I'm too much. That wanting things from people is dangerous because they'll just throw you away. God, I haven't thought about that in years.

Therapist: Your body remembers, even when your mind hasn't thought about it in years. The chest tightness, the numbness in your hands — your body is sounding an alarm for the little girl who learned that asking for love is dangerous.

Patient: [crying] I just want someone to stay in the room. That's all I've ever wanted. For someone to just... stay.`,
  analysis_result: {
    quickInsight: {
      riskLevel: 'high' as const,
      clinicalPriority: 'Panic disorder with clear attachment trigger; childhood emotional neglect schema activated in intimate relationship; somatic panic features require immediate stabilization',
      prognosis: 'Guarded-to-fair — client demonstrates emotional depth and emerging insight but attachment activation is intense; panic frequency reportedly increasing',
      topRecommendation: 'Schema Therapy with somatic integration targeting Abandonment/Instability and Emotional Deprivation schemas; limited reparenting indicated for neglected inner child work',
      sessionNumber: 1,
    },
    moments: [
      {
        id: 1,
        timestamp: '00:01:30',
        quote: 'My hands went numb. I thought I was dying. He had to talk me down for twenty minutes on the bathroom floor.',
        context: 'Severe panic attack with prominent somatic features — depersonalization in hands, cardiac distress perception, catastrophic cognition. Duration (20 minutes) and location (bathroom floor) indicate significant functional impairment.',
        type: 'recalled_past' as const,
        valence: 'negative' as const,
        intensity: 9,
        structures: ['body' as const, 'emotion' as const, 'immediate_experience' as const],
        therapistMove: 'empathic_attunement' as const,
        therapistQuote: 'That sounds terrifying. Can you tell me what the conversation was about?',
      },
      {
        id: 2,
        timestamp: '00:04:00',
        quote: 'She was always busy or tired or on her phone or just checked out. I\'d come home from school wanting to tell her something and she\'d say "not now, honey" without even looking up.',
        context: 'Core childhood neglect disclosure. Pattern of chronic emotional unavailability from primary attachment figure. Mother physically present but psychologically absent — hallmark of emotional neglect.',
        type: 'recalled_past' as const,
        valence: 'negative' as const,
        intensity: 8,
        structures: ['narrative' as const, 'social' as const, 'emotion' as const, 'cognitive' as const],
        therapistMove: 'reflection' as const,
        therapistQuote: 'You learned to stop asking for what you needed.',
      },
      {
        id: 3,
        timestamp: '00:06:30',
        quote: 'I just thought I was broken. Like, who has a panic attack because their boyfriend watches TV? But it\'s not about the TV, is it?',
        context: 'Client dismisses and minimizes her own needs — internalized message that her emotional responses are disproportionate or pathological. Emerging insight that the trigger is relational, not situational.',
        type: 'reflective' as const,
        valence: 'mixed' as const,
        intensity: 7,
        structures: ['cognitive' as const, 'emotion' as const, 'reflective' as const],
        therapistMove: 'interpretation' as const,
        therapistQuote: 'The panic isn\'t just about Marcus. It\'s about a much older feeling.',
      },
      {
        id: 4,
        timestamp: '00:09:00',
        quote: 'I drew her a picture and she put it on the counter without looking at it and said she had a headache. I found it in the recycling the next day.',
        context: 'Crystallizing childhood neglect memory — the discarded drawing as a concrete symbol of emotional abandonment. This memory likely functions as a schema-origin event for Emotional Deprivation.',
        type: 'recalled_past' as const,
        valence: 'negative' as const,
        intensity: 9,
        structures: ['narrative' as const, 'emotion' as const, 'social' as const, 'body' as const],
        therapistMove: 'empathic_attunement' as const,
        therapistQuote: 'What was it like to find your picture in the recycling?',
      },
      {
        id: 5,
        timestamp: '00:11:15',
        quote: 'I think that\'s when I decided my feelings don\'t matter. That I\'m too much. That wanting things from people is dangerous because they\'ll just throw you away.',
        context: 'Client articulates the core schema: "I am too much and my needs are dangerous." This belief drives both the suppression of needs and the panic when needs inevitably surface in intimate relationships.',
        type: 'reflective' as const,
        valence: 'negative' as const,
        intensity: 9,
        structures: ['cognitive' as const, 'emotion' as const, 'narrative' as const, 'social' as const],
        therapistMove: 'empathic_attunement' as const,
        therapistQuote: 'Your body remembers, even when your mind hasn\'t thought about it in years.',
      },
      {
        id: 6,
        timestamp: '00:13:30',
        quote: 'I just want someone to stay in the room. That\'s all I\'ve ever wanted. For someone to just stay.',
        context: 'Therapeutic rupture into core longing — the abandonment wound expressed directly. "Stay in the room" as metaphor for sustained emotional presence. This is the therapeutic entry point for limited reparenting and corrective emotional experience.',
        type: 'immediate_experience' as const,
        valence: 'negative' as const,
        intensity: 10,
        structures: ['emotion' as const, 'social' as const, 'body' as const, 'immediate_experience' as const],
        therapistMove: 'silence' as const,
        therapistQuote: '[Therapist held compassionate silence, allowing the depth of this longing to be witnessed without being managed or interpreted away]',
      },
    ],
    riskFlags: [
      {
        id: 1,
        severity: 'high' as const,
        signal: 'Escalating Panic Frequency with Attachment Trigger',
        detail: 'Client reports panic attacks increasing in frequency over past two months, all triggered by perceived emotional withdrawal from partner. Most recent attack lasted 20 minutes with prominent somatic features (hand numbness, chest compression, tachycardia). Pattern indicates attachment-activated panic rather than classic panic disorder.',
        algorithmMatch: 'panic escalation, attachment trigger, somatic panic, relationship anxiety, abandonment fear, 20-minute duration',
        recommendation: 'Immediate somatic stabilization protocol; teach grounding techniques for acute panic; reframe panic as attachment alarm rather than medical emergency; establish safety plan with partner',
        interventionType: 'immediate',
      },
      {
        id: 2,
        severity: 'medium' as const,
        signal: 'Dissociative Features During Conflict',
        detail: 'Hand numbness and inability to feel fingers during panic suggests mild dissociative features under attachment threat. Client locked bathroom door — withdrawal and isolation response when attachment system is overwhelmed.',
        algorithmMatch: 'dissociation, numbness, depersonalization, conflict avoidance, isolation during distress, bathroom locking',
        recommendation: 'Screen for broader dissociative symptoms; establish grounding protocol; monitor for escalation of dissociative features; consider window of tolerance assessment',
        interventionType: 'monitor',
      },
      {
        id: 3,
        severity: 'medium' as const,
        signal: 'Childhood Emotional Neglect Pattern',
        detail: 'Chronic emotional unavailability of primary caregiver (mother). Formative memories of dismissal ("not now, honey"), missed events, and symbolic rejection (drawing in recycling). Client internalized "my feelings don\'t matter" and "I am too much" as core beliefs.',
        algorithmMatch: 'childhood neglect, emotional deprivation, attachment injury, caregiver unavailability, internalized worthlessness, schema origin',
        recommendation: 'Formal schema assessment (YSQ-S3) targeting Emotional Deprivation and Abandonment/Instability; begin limited reparenting within therapeutic relationship; coordinate Schema Therapy with somatic integration for body-held attachment wounds',
        interventionType: 'immediate',
      },
    ],
    practitionerMatches: [
      {
        id: 1,
        code: 'PR-SCHEMA-042',
        name: 'Dr. Rebecca Morrison',
        specialty: 'Schema Therapy with Limited Reparenting',
        methodology: 'Schema therapy targeting Abandonment/Instability and Emotional Deprivation schemas through limited reparenting, mode work, and behavioral pattern breaking. Integrates somatic awareness for clients whose attachment wounds are held in the body as panic and somatic distress.',
        matchScore: 0.93,
        interventionSequence: [
          'Schema identification — map Abandonment/Instability and Emotional Deprivation schemas to childhood origin memories (drawing in recycling, "not now honey")',
          'Limited reparenting — provide consistent emotional attunement within the therapeutic relationship to model corrective experience',
          'Mode work — identify and dialogue with the Abandoned Child, Detached Protector, and Demanding Critic modes',
          'Behavioral pattern breaking — practice expressing needs in relationship with graduated exposure',
          'Schema healing — integrate narrative restructuring with somatic release to update the body\'s threat detection system',
        ],
        outcomePatterns: [
          { metric: 'Panic frequency reduction', change: '-78% over 12 sessions', confidence: 0.90 },
          { metric: 'GAD-7 improvement', change: '-9.2 points avg over 12 sessions', confidence: 0.87 },
          { metric: 'Relationship satisfaction (CSI)', change: '+45% improvement', confidence: 0.84 },
          { metric: 'Schema severity (YSQ)', change: '-52% reduction in abandonment domain', confidence: 0.86 },
        ],
        matchReasoning: 'Highest match. Client presents with textbook Abandonment/Instability and Emotional Deprivation schemas rooted in childhood emotional neglect. The panic attacks are schema-driven — triggered by perceived partner withdrawal that activates the childhood "mother looking away" template. Schema Therapy\'s limited reparenting directly addresses the developmental deficit, while mode work helps the client differentiate between the Abandoned Child\'s terror and the adult\'s reality. Across 8,234 cases with this profile, Schema Therapy with somatic integration produces 78% significant improvement vs. 52% for CBT-focused panic protocols alone.',
        targetStructures: ['emotion' as const, 'social' as const, 'narrative' as const, 'cognitive' as const],
      },
      {
        id: 2,
        code: 'PR-ATTACHMENT-017',
        name: 'Dr. James Chen',
        specialty: 'Attachment-Focused Therapy with Somatic Awareness',
        methodology: 'Attachment-based therapy integrating somatic awareness for clients with childhood neglect histories. Uses the therapeutic relationship as a corrective attachment experience while building body-based awareness of attachment activation patterns.',
        matchScore: 0.88,
        interventionSequence: [
          'Attachment mapping — identify internal working models of self and other based on early experiences with mother',
          'Somatic awareness — build capacity to notice attachment activation in the body before panic escalation',
          'Corrective emotional experience — use the therapeutic relationship to practice receiving consistent attunement',
          'Earned secure attachment — gradually transfer corrective experience to partner relationship through guided conversations',
        ],
        outcomePatterns: [
          { metric: 'Attachment security (ECR-R)', change: '+38% improvement over 14 sessions', confidence: 0.84 },
          { metric: 'Panic frequency reduction', change: '-65% over 14 sessions', confidence: 0.82 },
          { metric: 'Relationship satisfaction', change: 'Significant improvement in 72% of cases', confidence: 0.80 },
          { metric: 'Somatic distress reduction', change: '-55% reported frequency', confidence: 0.78 },
        ],
        matchReasoning: 'Strong match for attachment-specific work. The "stay in the room" disclosure is a direct expression of the insecure attachment system seeking proximity. Attachment-based therapy would provide the corrective relational experience this client\'s developmental history denied. Slightly lower match than Schema Therapy due to less structured protocol for panic symptom management.',
        targetStructures: ['social' as const, 'body' as const, 'emotion' as const, 'reflective' as const],
      },
      {
        id: 3,
        code: 'PR-SOMATIC-089',
        name: 'Dr. Amara Okonkwo',
        specialty: 'Somatic Experiencing for Developmental Trauma',
        methodology: 'Somatic experiencing combined with relational psychotherapy for developmental trauma. Uses pendulation, titration, and completion of thwarted defensive responses to discharge body-held attachment wounds.',
        matchScore: 0.84,
        interventionSequence: [
          'Resourcing — build internal and external resources for somatic regulation before processing trauma material',
          'Pendulation — track the body\'s oscillation between activation and calm during attachment-related content',
          'Titration — process childhood neglect material in small, manageable doses to prevent overwhelm',
          'Completion of defensive responses — allow the body to complete the reaching/seeking movements that were thwarted in childhood',
        ],
        outcomePatterns: [
          { metric: 'Somatic panic symptom reduction', change: '-72% over 10 sessions', confidence: 0.86 },
          { metric: 'Window of tolerance expansion', change: '+48% measured capacity', confidence: 0.82 },
          { metric: 'PHQ-9 improvement', change: '-6.8 points avg', confidence: 0.78 },
          { metric: 'Dissociative symptom reduction', change: '-58% on DES', confidence: 0.80 },
        ],
        matchReasoning: 'The prominent somatic features (hand numbness, chest compression, breathing difficulty) suggest significant body-held trauma that somatic approaches address directly. The hand numbness in particular may represent a thwarted reaching response — the child who learned not to reach for comfort. Somatic Experiencing would allow completion of these truncated attachment movements.',
        targetStructures: ['body' as const, 'immediate_experience' as const, 'emotion' as const],
      },
      {
        id: 4,
        code: 'PR-DBT-055',
        name: 'Dr. Priya Sharma',
        specialty: 'Dialectical Behavior Therapy — Emotion Regulation Module',
        methodology: 'DBT skills training with emphasis on distress tolerance and emotion regulation for clients with attachment-driven emotional dysregulation. TIPP skills for acute panic management.',
        matchScore: 0.71,
        interventionSequence: [
          'TIPP skills for immediate panic management — Temperature, Intense exercise, Paced breathing, Paired muscle relaxation',
          'Distress tolerance skills for relationship conflict moments — STOP, ACCEPTS, self-soothe',
          'Emotion regulation — identify and label attachment emotions without judgment',
          'Interpersonal effectiveness — DEAR MAN for expressing needs to partner',
          'Mindfulness — observe attachment activation without acting from schema',
        ],
        outcomePatterns: [
          { metric: 'Panic management effectiveness', change: '+62% self-efficacy', confidence: 0.78 },
          { metric: 'Emotional dysregulation episodes', change: '-48% frequency', confidence: 0.76 },
          { metric: 'Distress tolerance capacity', change: '+55% improvement', confidence: 0.80 },
          { metric: 'GAD-7 improvement', change: '-5.8 points avg', confidence: 0.74 },
        ],
        matchReasoning: 'DBT offers strong skills-based intervention for the acute panic and emotional dysregulation, particularly the TIPP skills for in-the-moment crisis. However, DBT as standalone may not adequately address the deeper schema-level attachment injury driving the presentation. Best positioned as adjunct skill set within Schema Therapy framework.',
        targetStructures: ['emotion' as const, 'behaviour' as const, 'body' as const, 'cognitive' as const],
      },
      {
        id: 5,
        code: 'PR-EFT-028',
        name: 'Dr. Katherine Wells',
        specialty: 'Emotionally Focused Individual Therapy',
        methodology: 'Emotionally Focused Therapy adapted for individual work, targeting attachment injuries through accessing and restructuring core emotional responses. Maps the pursue-withdraw cycle in the partner relationship.',
        matchScore: 0.66,
        interventionSequence: [
          'Map the pursue-withdraw cycle — client pursues emotional closeness, partner withdraws, triggering panic',
          'Access primary attachment emotions beneath the anxiety — longing, grief, fear of loss',
          'Restructure emotional responses by validating attachment needs as legitimate rather than "too much"',
          'Facilitate new interaction patterns with partner through guided vulnerability exercises',
          'Consolidate new attachment-secure behavioral patterns in the relationship',
        ],
        outcomePatterns: [
          { metric: 'Relationship satisfaction', change: '+52% improvement', confidence: 0.76 },
          { metric: 'Attachment security', change: '+35% improvement on ECR-R', confidence: 0.72 },
          { metric: 'Panic frequency', change: '-42% reduction', confidence: 0.68 },
          { metric: 'Emotional accessibility', change: '+48% improvement', confidence: 0.74 },
        ],
        matchReasoning: 'EFT directly maps the pursue-withdraw dynamic present in the partner relationship and validates attachment needs. However, individual EFT may not provide sufficient structured protocol for the somatic panic features and childhood schema work. Best considered for couples work as adjunct once individual stabilization is achieved.',
        targetStructures: ['emotion' as const, 'social' as const, 'reflective' as const],
      },
    ],
    similarCases: [
      {
        id: 1,
        patientCode: 'SL-2024-0847',
        matchScore: 0.91,
        presentingConcerns: ['Relationship Anxiety', 'Panic Attacks', 'Childhood Emotional Neglect', 'Abandonment Fear'],
        dominantStructures: ['emotion' as const, 'social' as const, 'body' as const],
        sessionCount: 12,
        keyThemes: ['attachment panic', 'emotional neglect schema', 'partner withdrawal trigger', 'somatic distress', 'need suppression'],
        outcome: 'significant_improvement',
        outcomeDetail: 'GAD-7 from 18 to 5 over 12 sessions using Schema Therapy with somatic integration. Breakthrough came when client connected partner\'s silence to mother\'s emotional absence. Panic attacks reduced from 3x/week to 1x/month. Relationship satisfaction improved 55%.',
        representativeQuote: 'I spent my whole life apologizing for having needs. Therapy taught me that needing people isn\'t weakness — it\'s human.',
        matchExplanation: 'Matched on: attachment-activated panic during intimate conflict, childhood emotional neglect schema, somatic dissociation during perceived abandonment. This patient\'s trajectory from body-dominant processing to narrative integration mirrors your client\'s emerging pattern.',
      },
      {
        id: 2,
        patientCode: 'SL-2023-1293',
        matchScore: 0.86,
        presentingConcerns: ['Abandonment Schema', 'Somatic Panic', 'Emotional Dysregulation', 'Childhood Neglect'],
        dominantStructures: ['emotion' as const, 'body' as const, 'cognitive' as const],
        sessionCount: 8,
        keyThemes: ['body-held abandonment', 'chest tightness', 'hand numbness', 'schema activation in relationships', 'inner child work'],
        outcome: 'marked_improvement',
        outcomeDetail: 'PHQ-9 from 16 to 7 over 8 sessions. Somatic panic symptoms resolved once the attachment wound was processed somatically. Client described the body as "finally feeling safe enough to let go of the alarm." Key turning point was completing a thwarted reaching movement in session.',
        representativeQuote: 'My body was telling me what my words couldn\'t — that the little girl inside me was still waiting by that door, still hoping someone would come.',
        matchExplanation: 'Matched on: somatic panic with hand numbness and chest compression co-occurring with childhood neglect disclosure. Both patients presented with body-held abandonment where physical symptoms preceded conscious schema awareness, suggesting a shared somatic-first processing pathway.',
      },
      {
        id: 3,
        patientCode: 'SL-2024-0156',
        matchScore: 0.82,
        presentingConcerns: ['Childhood Neglect', 'Adult Anxiety', 'Relationship Difficulties', 'Self-Worth Deficits'],
        dominantStructures: ['narrative' as const, 'social' as const, 'reflective' as const],
        sessionCount: 15,
        keyThemes: ['narrative restructuring', 'emotional neglect processing', 'inner child dialogue', 'earned secure attachment', 'self-compassion development'],
        outcome: 'substantial_progress',
        outcomeDetail: 'Longer treatment course due to deeply entrenched neglect schema. PHQ-9 from 15 to 8. Client benefited from narrative restructuring — writing letters to younger self and creating a coherent story of the neglect that distinguished past from present. Relationship patterns improved in final third of treatment.',
        representativeQuote: 'I used to tell myself I had a normal childhood. Writing the real story — the one where a little girl was invisible — was the hardest and most freeing thing I\'ve done.',
        matchExplanation: 'Matched on: narrative restructuring of childhood emotional neglect with inner child dialogue. Semantic similarity strongest in the narrative-reflective domain where both patients moved from minimizing the neglect ("she did her best") to acknowledging its impact on self-worth and relational patterns.',
      },
      {
        id: 4,
        patientCode: 'SL-2024-0934',
        matchScore: 0.78,
        presentingConcerns: ['Panic Disorder', 'Attachment Anxiety', 'Emotional Suppression', 'Somatic Complaints'],
        dominantStructures: ['body' as const, 'emotion' as const, 'cognitive' as const, 'behaviour' as const],
        sessionCount: 10,
        keyThemes: ['panic as attachment alarm', 'need suppression', 'somatic holding', 'partner dynamics'],
        outcome: 'significant_improvement',
        outcomeDetail: 'GAD-7 from 17 to 6 over 10 sessions. Panic attacks eliminated once client learned to express needs before the attachment alarm fired. Somatic symptoms (chest tightness, hand numbness) resolved in parallel with relational improvement.',
        representativeQuote: 'The panic was my body screaming the words I was too afraid to say: please don\'t leave.',
        matchExplanation: 'Matched on: panic as attachment alarm with need suppression as the causal mechanism. Both patients demonstrated the same paradox — suppressing emotional needs until the body expresses them as panic — and both responded to interventions that reframed panic as communication rather than pathology.',
      },
      {
        id: 5,
        patientCode: 'SL-2023-0671',
        matchScore: 0.74,
        presentingConcerns: ['Childhood Emotional Neglect', 'Abandonment Fear', 'Emotional Dysregulation', 'Low Self-Worth'],
        dominantStructures: ['emotion' as const, 'narrative' as const, 'social' as const, 'reflective' as const],
        sessionCount: 14,
        keyThemes: ['neglect schema', 'abandonment terror', 'emotional flooding', 'people-pleasing', 'self-worth reconstruction'],
        outcome: 'significant_improvement',
        outcomeDetail: 'PHQ-9 from 18 to 6 over 14 sessions. Deep schema work required extended treatment. Client initially resistant to acknowledging neglect — "she did her best" defense maintained for 4 sessions before giving way to authentic grief and anger.',
        representativeQuote: 'I protected my mother\'s reputation for thirty years. The day I let myself be angry at her was the day I started getting better.',
        matchExplanation: 'Matched on: childhood emotional neglect with prolonged defense of the neglecting parent and internalized worthlessness. Semantic overlap strongest in the emotion-narrative domain where both patients articulated the "she did her best" defense before accessing legitimate anger at the deprivation.',
      },
      {
        id: 6,
        patientCode: 'SL-2024-1102',
        matchScore: 0.69,
        presentingConcerns: ['Relationship Anxiety', 'Somatic Panic', 'Self-Worth Deficits', 'Fear of Abandonment'],
        dominantStructures: ['body' as const, 'social' as const, 'emotion' as const, 'cognitive' as const],
        sessionCount: 11,
        keyThemes: ['somatic panic in relationships', 'fear of being "too much"', 'chest tightness', 'approval seeking', 'conflict avoidance'],
        outcome: 'moderate_improvement',
        outcomeDetail: 'GAD-7 from 15 to 9 over 11 sessions. Somatic panic reduced 60% but abandonment schema proved more entrenched than initial assessment suggested. Client transferred to longer-term schema therapy program for continued work.',
        representativeQuote: 'I made myself small enough to fit inside someone else\'s comfort zone. Getting bigger again is the scariest thing I\'ve ever done.',
        matchExplanation: 'Matched on: somatic panic in intimate relationships with fear of being "too much" as the core cognitive schema. Both patients presented with chest tightness and approval-seeking behaviors driven by the belief that authentic self-expression would trigger abandonment.',
      },
    ],
    structureProfile: {
      body: 0.88,
      immediate_experience: 0.68,
      emotion: 0.92,
      behaviour: 0.45,
      social: 0.75,
      cognitive: 0.55,
      reflective: 0.25,
      narrative: 0.62,
      ecological: 0.20,
      normative: 0.30,
    } as Record<string, number>,
    sessionHistory: [
      { session: 1, emotionalIntensity: 8.5, reflectiveCapacity: 2.8, emotionalRegulation: 2.2, therapeuticAlliance: 3.5 },
    ],
    therapistMoves: [
      { type: 'empathic_attunement' as const, count: 4, percentage: 45 },
      { type: 'reflection' as const, count: 2, percentage: 25 },
      { type: 'interpretation' as const, count: 1, percentage: 15 },
      { type: 'silence' as const, count: 1, percentage: 10 },
      { type: 'challenge' as const, count: 0, percentage: 5 },
    ],
    clinicianReport: '## Session Overview\nSession 1 intake assessment with a female client (26-35) presenting with escalating panic attacks triggered by perceived emotional withdrawal from her intimate partner. Overall impression: acute attachment-activated panic disorder with underlying childhood emotional neglect schema.\n\n## Key Clinical Observations\n- **Severe somatic panic features:** 20-minute episode with chest compression, hand numbness, tachycardia, and catastrophic ideation; client locked herself in the bathroom — a withdrawal-under-threat response consistent with disorganized attachment activation\n- **Childhood emotional neglect disclosed:** Mother chronically emotionally unavailable — physically present but psychologically absent; formative memory of drawing placed in recycling without being seen functions as schema-origin event\n- **Core maladaptive belief identified:** "I decided my feelings don\'t matter" and fear of being "too much" directly suppresses need-expression, creating a paradox where suppressed needs emerge as panic\n\n## Risk Assessment\n- **Current Risk Level:** High\n- **Risk Factors:** Panic frequency escalation (increasing over past two months), dissociative features during conflict (hand numbness, depersonalization), depth of childhood neglect pattern, isolation response under attachment threat\n- **Protective Factors:** Capacity for emotional depth and emerging insight, supportive partner (stayed and helped during panic), willingness to engage in therapy, ability to make childhood-to-present connections\n\n## Phenomenological Structure Analysis\n- **Dominant Structures:** Emotion (32%), Body (28%), Social (18%), Narrative (12%), Cognitive (10%)\n- **Notable Patterns:** Somatic features (hand numbness) may represent thwarted reaching responses — a body-level memory of the child who stopped reaching for unavailable comfort. Attachment activation drives a body-emotion-social cascade.\n\n## Treatment Progress\nBaseline session. Pattern matching across 8,234 cases with this profile indicates Schema Therapy with somatic integration as the optimal approach, producing 78% significant improvement vs. 52% for standard panic-focused CBT.\n\n## Clinical Recommendations\n1. Immediate somatic stabilization protocol with grounding techniques for acute panic; reframe panic as attachment alarm rather than medical emergency\n2. Formal schema assessment (YSQ-S3) targeting Emotional Deprivation and Abandonment/Instability schemas\n3. Establish corrective emotional experience within the therapeutic relationship through limited reparenting; careful titration of schema work given intensity of attachment activation\n\n## Plan for Next Session\n- Assess effectiveness of somatic grounding technique between sessions\n- Begin mapping the partner-to-mother transference pattern in detail\n- Introduce interoceptive awareness exercises to expand body-based recognition of attachment activation',
    patientReport: '## What We Explored Today\nThank you for trusting me with everything you shared today — especially the memories of your mother and the drawing. Those aren\'t easy things to bring into the room, and the fact that you did tells me something important: you\'re ready to understand what\'s really happening when the panic hits.\n\n## What Stood Out\n- **The panic attacks are not a sign that you\'re broken.** They\'re a signal — your body\'s alarm system firing because it learned, a long time ago, that when someone goes quiet or looks away, it means you\'re about to be left alone.\n- **That alarm made sense when you were little.** Waiting for your mom to look up from her phone, learning to stop asking — your nervous system adapted to protect you. Now, as an adult, the alarm is going off in situations where the danger isn\'t the same.\n- **The connection you made between Marcus and your mother was a breakthrough.** Recognizing that the panic isn\'t about the TV, but about a much older feeling of being unseen, is the first step toward change.\n\n## Your Strengths\n- You showed remarkable courage by sharing painful childhood memories in our very first session — that takes real bravery\n- You already have the capacity for deep insight, making the connection between past and present on your own when you said "it\'s not about the TV, is it?"\n\n## Things to Reflect On\nThis week, notice when the old alarm goes off. You don\'t need to fix it or fight it — just notice it. See if you can gently ask yourself: "Is this about right now, or is this about back then?" There\'s no wrong answer. The noticing itself is the work.\n\n## Before Our Next Session\n- **Practice the grounding technique:** When you notice panic starting (chest tightness, hand numbness), put both hands on your chest, take three slow breaths, and say to yourself "This is now. I am safe." You don\'t need to believe it yet — just practice saying it.\n- **Keep a brief feelings journal:** Jot down one moment each day when you noticed yourself wanting something from Marcus but holding back. Just note what you wanted and what you felt in your body.\n- **Be gentle with yourself:** You\'ve carried this alone for a long time. Sharing it today was an act of courage, and you deserve to rest after that.',
    cbtAnalysis: {
      distortions: [
        { type: 'Catastrophizing', confidence: 0.92, evidence: 'I was absolutely certain he was gone — that he\'d realize I\'m too much and just be done with me.', alternativeThought: 'Marcus followed me to the bathroom and spent 20 minutes helping me calm down. His behavior shows commitment, not abandonment. My certainty of being left is a prediction, not a fact.', momentIndex: 0 },
        { type: 'Emotional Reasoning', confidence: 0.88, evidence: 'I just thought I was broken. Who has a panic attack because their boyfriend watches TV?', alternativeThought: 'Having a strong emotional response doesn\'t mean I\'m broken — it means I have unmet needs and a nervous system shaped by early experiences. The reaction is disproportionate to TV but proportionate to abandonment.', momentIndex: 2 },
        { type: 'Mind Reading', confidence: 0.85, evidence: 'He\'d realize I\'m too much. He thinks I\'m exhausting.', alternativeThought: 'I have no evidence Marcus thinks I\'m exhausting. He stayed and helped during the panic attack. I\'m projecting my mother\'s response onto him.', momentIndex: 0 },
        { type: 'Overgeneralization', confidence: 0.82, evidence: 'Wanting things from people is dangerous because they\'ll just throw you away.', alternativeThought: 'One parent\'s emotional unavailability does not define all relationships. Marcus has shown up consistently. The "everyone leaves" belief is a generalization from one source.', momentIndex: 4 },
      ],
      overallDistortionLoad: 0.82,
      treatmentReadiness: 0.58,
      dominantPatterns: ['Catastrophizing', 'Emotional Reasoning', 'Mind Reading', 'Overgeneralization'],
      automaticThoughts: [
        { content: 'I am too much — my needs will drive people away', beliefStrength: 0.90, supportsWellbeing: false },
        { content: 'If I show someone how much I need them, they will leave', beliefStrength: 0.88, supportsWellbeing: false },
        { content: 'My feelings don\'t matter — I should be able to handle this alone', beliefStrength: 0.85, supportsWellbeing: false },
      ],
      behavioralPatterns: ['Need suppression until panic erupts', 'Withdrawal and isolation during distress', 'Hypervigilance to partner\'s emotional cues', 'Conflict avoidance followed by emotional flooding'],
    },
    vectorInsights: [
      { id: 1, type: 'trajectory', title: 'Somatic \u2192 Attachment Breakthrough Pattern', description: 'In 73% of semantically similar cases (8/11 patients), body-focused emotional processing like your client\'s panic attacks preceded attachment insight breakthroughs within 2-4 sessions. The somatic activation appears to be a gateway to schema recognition \u2014 not just a symptom to eliminate.', confidence: 0.87, supportingMetric: '73% trajectory match across 11 similar cases', icon: 'trending' },
      { id: 2, type: 'outcome_prediction', title: 'Treatment Response Forecast', description: 'Patients with similar moment patterns at intake showed significant improvement by Session 4-6 when Schema Therapy with somatic integration was used. Average PHQ-9 reduction: 48%, GAD-7 reduction: 52%. Standard CBT alone produced only 23% improvement in this profile.', confidence: 0.82, supportingMetric: 'PHQ-9 avg reduction 48% with Schema Therapy vs 23% CBT-only', icon: 'target' },
      { id: 3, type: 'method_alignment', title: 'Limited Reparenting Alignment', description: 'Your client\'s disclosure about childhood emotional neglect \u2014 specifically the drawing thrown in the recycling \u2014 has 0.91 semantic alignment with moments where limited reparenting interventions produced the strongest outcomes. The "never good enough" schema activation is the precise entry point this methodology targets.', confidence: 0.91, supportingMetric: '0.91 semantic alignment with high-outcome limited reparenting cases', icon: 'link' },
    ],
    analysisStatus: 'complete' as const,
    analysisWarnings: [],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION 2: "Connecting the Dots" — 2026-03-26
// Client practiced grounding between sessions. Had a "smaller" panic but caught
// it earlier. Key insight: "I'm not upset because he left the room — I'm upset
// because it felt like she left the room." Anger toward mother emerges.
// ═══════════════════════════════════════════════════════════════════════════════

const session2 = {
  session_number: 2,
  session_date: '2026-03-26T10:00:00Z',
  treatment_goals: 'Process grounding practice outcomes; deepen schema awareness connecting partner triggers to childhood patterns; explore emerging anger toward mother; begin reframing "too much" as legitimate need',
  status: 'complete',
  transcript: `Therapist: Welcome back. How have the past two weeks been?

Patient: Better. I mean, not perfect, but better. I did the grounding thing you taught me — the hands on chest, three breaths, "this is now, I am safe." I used it maybe five or six times. And I had another panic moment, but it was... smaller. Like I caught it earlier.

Therapist: You caught it earlier. Tell me about that.

Patient: Marcus and I were cooking dinner and he got a text and walked into the other room to take a call. And I felt it start — that drop in my stomach, the tightness. But this time I put my hands on my chest and I thought, "He's taking a phone call. He's not leaving." And it didn't spiral. It was still uncomfortable, but it wasn't a full attack. It lasted maybe three minutes instead of twenty.

Therapist: That's a significant change. You were able to observe the activation instead of being consumed by it. What did you notice in your body during those three minutes?

Patient: The chest thing, but also — I noticed something new. My shoulders. They were up around my ears. Like I was bracing. And I thought, "What am I bracing for?" And the answer was: I'm bracing for him not to come back. I'm bracing for the moment he decides I'm not worth coming back to.

Therapist: And did he come back?

Patient: [small laugh] He came back forty-five seconds later asking if I wanted garlic in the sauce. Forty-five seconds. And I'd already written the whole story of being abandoned.

Therapist: So your body writes the abandonment story in forty-five seconds. That story was written a long time ago, wasn't it?

Patient: [pause] Yeah. And I realized something this week. Something big. When Marcus leaves the room, I'm not upset because he left the room. I'm upset because it felt like she left the room. My mother. Every time he goes quiet or steps away, my body thinks it's her. It's like my nervous system doesn't know the difference.

Therapist: That's a profound insight. Your nervous system learned its lessons about closeness and distance from your mother, and it's applying those lessons to Marcus.

Patient: And I've been thinking about something else. I've been thinking about being angry. At her. I've never let myself be angry at my mother before. I always made excuses — she was tired, she was overwhelmed, she was doing her best. But you know what? I was a child. I needed her. And she wasn't there. And that's not okay.

Therapist: What's it like to say that — "it's not okay"?

Patient: Terrifying. And also... kind of freeing? Like I've been holding my breath for twenty years and I just exhaled. But I also feel guilty. Like I'm betraying her by being angry.

Therapist: You can be angry and still love someone. Those aren't opposites.

Patient: [tears] I keep thinking about the drawing. The one she threw away. And I realized — I've been treating my own needs the same way she treated that drawing. I crumple them up and throw them away before anyone can see them. I do it to myself now. She taught me that my needs are recyclable. Disposable.

Therapist: And what if they're not? What if your needs are not disposable?

Patient: [long pause] Then I've been wrong about myself for a very long time. And that's... a lot to sit with.

Therapist: Let's sit with it together. I want to try something. Close your eyes. Notice where you feel the tension right now.

Patient: My chest. And my throat. Like there's something stuck.

Therapist: Just breathe into that space. You don't need to push through it. What does that tightness want to say?

Patient: [crying quietly] It wants to say: I deserved more. I deserved a mother who looked at my drawing. I deserved someone who stayed in the room.

Therapist: Yes. You did. And you still deserve that. That need hasn't gone away — it just went underground. We're bringing it back into the light.

Patient: I'm scared that if I let myself need things from people, I'll be disappointed again. What if Marcus can't give me what I need either?

Therapist: That's a real fear, and we'll work with it. But here's what I notice: Marcus came back from the phone call in forty-five seconds. He sat on the bathroom floor with you for twenty minutes during a panic attack. The evidence suggests he's not your mother. The question is whether your nervous system can learn that.

Patient: I want it to. I really do.`,
  analysis_result: {
    quickInsight: {
      riskLevel: 'moderate' as const,
      clinicalPriority: 'Schema activation pattern confirmed — partner triggers map directly to childhood neglect. Anger toward mother emerging for first time. Somatic holding in chest and throat requires continued attention.',
      prognosis: 'Fair-to-good — client demonstrating rapid schema awareness and capacity for emotional processing; grounding technique reducing panic severity; anger emergence is a positive prognostic indicator',
      topRecommendation: 'Continue Schema Therapy with somatic integration; support anger processing toward mother; begin graduated need-expression exercises with partner; body scan to map somatic holding patterns',
      sessionNumber: 2,
    },
    moments: [
      {
        id: 1,
        timestamp: '00:01:30',
        quote: 'I did the grounding thing — hands on chest, three breaths, "this is now, I am safe." It didn\'t spiral. It lasted maybe three minutes instead of twenty.',
        context: 'Successful application of somatic grounding technique. Panic duration reduced from 20 minutes to 3 minutes. Client demonstrating capacity for self-regulation using interoceptive awareness.',
        type: 'recalled_past' as const,
        valence: 'positive' as const,
        intensity: 6,
        structures: ['body' as const, 'cognitive' as const, 'reflective' as const, 'immediate_experience' as const],
        therapistMove: 'reflection' as const,
        therapistQuote: 'You caught it earlier. Tell me about that.',
      },
      {
        id: 2,
        timestamp: '00:04:30',
        quote: 'I\'m not upset because he left the room. I\'m upset because it felt like she left the room. My mother. My nervous system doesn\'t know the difference.',
        context: 'Critical schema insight — client independently identifies the partner-to-mother transference at the somatic level. This is the central therapeutic insight: current panic is a re-experiencing of childhood abandonment, not a response to present threat.',
        type: 'reflective' as const,
        valence: 'mixed' as const,
        intensity: 9,
        structures: ['cognitive' as const, 'emotion' as const, 'social' as const, 'narrative' as const],
        therapistMove: 'interpretation' as const,
        therapistQuote: 'Your nervous system learned its lessons about closeness and distance from your mother, and it\'s applying those lessons to Marcus.',
      },
      {
        id: 3,
        timestamp: '00:07:00',
        quote: 'I was a child. I needed her. And she wasn\'t there. And that\'s not okay.',
        context: 'First expression of anger toward mother. Client moving from protective excusing ("she was tired, she was doing her best") to legitimate grievance. Anger emergence in childhood neglect cases is a strong positive prognostic indicator — it signals the client is beginning to assign responsibility accurately.',
        type: 'immediate_experience' as const,
        valence: 'negative' as const,
        intensity: 8,
        structures: ['emotion' as const, 'social' as const, 'narrative' as const, 'normative' as const],
        therapistMove: 'empathic_attunement' as const,
        therapistQuote: 'What\'s it like to say that — "it\'s not okay"?',
      },
      {
        id: 4,
        timestamp: '00:09:15',
        quote: 'I\'ve been treating my own needs the same way she treated that drawing. I crumple them up and throw them away before anyone can see them.',
        context: 'Powerful schema-level insight: client recognizes she has internalized the mother\'s dismissal and now perpetuates the neglect internally. The discarded drawing becomes a metaphor for self-directed emotional neglect.',
        type: 'reflective' as const,
        valence: 'negative' as const,
        intensity: 9,
        structures: ['reflective' as const, 'cognitive' as const, 'narrative' as const, 'emotion' as const],
        therapistMove: 'challenge' as const,
        therapistQuote: 'And what if they\'re not? What if your needs are not disposable?',
      },
      {
        id: 5,
        timestamp: '00:11:30',
        quote: 'I deserved more. I deserved a mother who looked at my drawing. I deserved someone who stayed in the room.',
        context: 'Body-mediated disclosure during guided somatic exercise. Client accesses grief and righteous anger through the body (chest and throat tightness). The throat blockage releasing into words represents somatic processing in real time.',
        type: 'immediate_experience' as const,
        valence: 'negative' as const,
        intensity: 10,
        structures: ['body' as const, 'emotion' as const, 'immediate_experience' as const, 'social' as const],
        therapistMove: 'empathic_attunement' as const,
        therapistQuote: 'Yes. You did. And you still deserve that. That need hasn\'t gone away — it just went underground.',
      },
      {
        id: 6,
        timestamp: '00:14:00',
        quote: 'I\'m scared that if I let myself need things from people, I\'ll be disappointed again. What if Marcus can\'t give me what I need either?',
        context: 'Anticipatory fear about relational vulnerability. Client at the threshold of behavioral change — can she risk expressing needs to a partner who might not meet them? The fear is appropriate and must be honored rather than dismissed.',
        type: 'reflective' as const,
        valence: 'negative' as const,
        intensity: 7,
        structures: ['cognitive' as const, 'social' as const, 'emotion' as const, 'reflective' as const],
        therapistMove: 'interpretation' as const,
        therapistQuote: 'Marcus came back from the phone call in forty-five seconds. The evidence suggests he\'s not your mother. The question is whether your nervous system can learn that.',
      },
    ],
    riskFlags: [
      {
        id: 1,
        severity: 'medium' as const,
        signal: 'Residual Panic with Improving Trajectory',
        detail: 'Panic still occurring but duration reduced from 20 minutes to 3 minutes with grounding technique. Client catching activation earlier and applying somatic regulation. Frequency reduced but not eliminated.',
        algorithmMatch: 'panic reduction, grounding success, residual activation, attachment trigger, improving trajectory',
        recommendation: 'Reinforce grounding protocol; expand to include shoulder-drop and jaw-release components; continue tracking panic frequency and duration for outcome measurement',
        interventionType: 'monitor',
      },
      {
        id: 2,
        severity: 'low' as const,
        signal: 'Anger Suppression Habit with Emerging Breakthrough',
        detail: 'Lifelong pattern of suppressing anger toward mother now breaking through. Client experiencing simultaneous anger and guilt — the guilt representing the old schema ("being angry means I\'m bad/ungrateful"). Anger emergence is therapeutically positive but requires careful processing to prevent premature cutoff.',
        algorithmMatch: 'anger emergence, guilt co-occurrence, mother-directed anger, schema shift, childhood neglect processing',
        recommendation: 'Support anger expression in graduated doses; normalize guilt as expected companion to anger in neglect survivors; use chair work or letter-writing to facilitate safe anger processing; monitor for anger turning inward as depression',
        interventionType: 'monitor',
      },
    ],
    practitionerMatches: [
      {
        id: 1,
        code: 'PR-SCHEMA-042',
        name: 'Dr. Rebecca Morrison',
        specialty: 'Schema Therapy with Limited Reparenting',
        methodology: 'Schema therapy validated by Session 2 — Abandonment/Instability and Emotional Deprivation schemas confirmed. Client independently identifying schema activation pattern (partner → mother transference). Protocol entering active schema processing phase with anger work and behavioral change preparation.',
        matchScore: 0.94,
        interventionSequence: [
          'Process emerging anger toward mother using chair work or letter-writing — provide safe container for grief and rage',
          'Deepen the partner-to-mother transference awareness through mode mapping — identify the Abandoned Child mode that activates during partner withdrawal',
          'Continue limited reparenting — validate needs that were dismissed in childhood ("you deserved someone who looked at your drawing")',
          'Prepare for behavioral pattern breaking — graduated need-expression exercises with partner, starting small',
          'Begin narrative restructuring — help client construct coherent story of neglect that distinguishes past from present',
        ],
        outcomePatterns: [
          { metric: 'Panic frequency reduction', change: '-78% over 12 sessions (client on track)', confidence: 0.91 },
          { metric: 'GAD-7 improvement', change: '-9.2 points avg (current trajectory: -3 after 2 sessions)', confidence: 0.88 },
          { metric: 'Schema severity (YSQ)', change: '-52% abandonment domain (actively processing)', confidence: 0.87 },
          { metric: 'Relationship satisfaction', change: '+45% improvement predicted', confidence: 0.85 },
        ],
        matchReasoning: 'Session 2 strongly validates Schema Therapy. Client\'s independent identification of the partner→mother transference and her insight about self-perpetuating the neglect pattern ("I crumple up my needs and throw them away") demonstrate natural schema awareness. The anger emergence toward mother is a critical therapeutic marker — Schema Therapy provides the mode framework to process this anger safely. Match score increases from 0.93 to 0.94 based on Session 2 data.',
        targetStructures: ['emotion' as const, 'social' as const, 'narrative' as const, 'cognitive' as const],
      },
      {
        id: 2,
        code: 'PR-ATTACHMENT-017',
        name: 'Dr. James Chen',
        specialty: 'Attachment-Focused Therapy with Somatic Awareness',
        methodology: 'Attachment-based therapy confirmed as strong complement. Client\'s somatic awareness developing rapidly — noticed shoulder bracing pattern and correctly identified it as abandonment anticipation. Attachment mapping can now include explicit mother→partner transference data.',
        matchScore: 0.89,
        interventionSequence: [
          'Update attachment map — integrate the partner→mother transference insight and somatic holding patterns',
          'Somatic awareness expansion — shoulders, chest, throat now identified as attachment activation sites',
          'Corrective emotional experience — therapist as consistent, attuned presence during anger and grief processing',
          'Graduated earned security — small need-expression experiments with partner, tracked somatically',
        ],
        outcomePatterns: [
          { metric: 'Attachment security (ECR-R)', change: '+38% improvement (actively shifting)', confidence: 0.85 },
          { metric: 'Panic frequency reduction', change: '-65% (currently at -40% after 2 sessions)', confidence: 0.83 },
          { metric: 'Somatic distress reduction', change: '-55% (chest tightness reducing)', confidence: 0.80 },
          { metric: 'Relationship satisfaction', change: 'Positive trajectory initiated', confidence: 0.78 },
        ],
        matchReasoning: 'Attachment-focused therapy rises in relevance after Session 2. The client\'s developing somatic awareness of attachment activation (shoulder bracing, chest tightening) provides ideal material for attachment-somatic integration work. The therapeutic relationship itself is functioning as a corrective attachment experience — client bringing vulnerability and receiving consistent attunement.',
        targetStructures: ['social' as const, 'body' as const, 'emotion' as const, 'reflective' as const],
      },
      {
        id: 3,
        code: 'PR-SOMATIC-089',
        name: 'Dr. Amara Okonkwo',
        specialty: 'Somatic Experiencing for Developmental Trauma',
        methodology: 'Somatic Experiencing increasingly relevant given the body scan discovery (chest tightness + throat blockage = held grief and anger). Throat releasing into words during the session represents spontaneous somatic processing that could be deepened with SE techniques.',
        matchScore: 0.85,
        interventionSequence: [
          'Resource the grounding gains — formalize the hands-on-chest protocol as a somatic anchor',
          'Pendulation between activation (abandonment fear) and resource (therapist/partner presence)',
          'Process the throat blockage — complete the interrupted vocalization (asking for needs)',
          'Titrate anger processing somatically — notice body changes as anger toward mother is expressed',
        ],
        outcomePatterns: [
          { metric: 'Somatic panic symptom reduction', change: '-72% (chest tightness already reducing)', confidence: 0.87 },
          { metric: 'Window of tolerance expansion', change: '+48% (expanding — caught panic in 3 min vs 20)', confidence: 0.84 },
          { metric: 'Vocal expression capacity', change: '+42% (throat releasing during session)', confidence: 0.80 },
          { metric: 'Grief/anger integration', change: '+38% somatic completion', confidence: 0.78 },
        ],
        matchReasoning: 'The throat tightness emerging as a body-held expression of suppressed needs ("something stuck... it wants to say: I deserved more") is textbook somatic experiencing material. The spontaneous somatic release during the body scan exercise suggests this client would respond exceptionally well to deeper SE work. Consider integrating SE techniques within the Schema Therapy framework.',
        targetStructures: ['body' as const, 'immediate_experience' as const, 'emotion' as const],
      },
      {
        id: 4,
        code: 'PR-DBT-055',
        name: 'Dr. Priya Sharma',
        specialty: 'Dialectical Behavior Therapy — Emotion Regulation Module',
        methodology: 'DBT skills remain relevant as adjunct — the grounding technique success demonstrates skill acquisition capacity. DEAR MAN framework appropriate for the upcoming need-expression work with partner.',
        matchScore: 0.70,
        interventionSequence: [
          'Build on grounding success with expanded distress tolerance repertoire',
          'DEAR MAN preparation for graduated need-expression with partner',
          'Emotion regulation skills for managing anger-guilt oscillation',
          'Mindfulness of attachment-activated emotions without schema-driven action',
        ],
        outcomePatterns: [
          { metric: 'Panic management effectiveness', change: '+62% self-efficacy (already demonstrating)', confidence: 0.78 },
          { metric: 'Distress tolerance capacity', change: '+55% improvement', confidence: 0.76 },
          { metric: 'Interpersonal effectiveness', change: '+42% with DEAR MAN', confidence: 0.72 },
          { metric: 'Emotional dysregulation episodes', change: '-48% frequency', confidence: 0.74 },
        ],
        matchReasoning: 'DBT skill acquisition confirmed by successful grounding use. DEAR MAN framework will be useful as client prepares to express needs to partner. However, DBT remains best positioned as skill set within Schema Therapy rather than standalone approach for this depth of attachment injury.',
        targetStructures: ['emotion' as const, 'behaviour' as const, 'body' as const, 'cognitive' as const],
      },
      {
        id: 5,
        code: 'PR-EFT-028',
        name: 'Dr. Katherine Wells',
        specialty: 'Emotionally Focused Individual Therapy',
        methodology: 'EFT approach validated by the pursue-withdraw dynamic now explicitly mapped. Client recognizes her pursuit of closeness triggers partner withdrawal. Individual EFT could support couples work as treatment progresses.',
        matchScore: 0.68,
        interventionSequence: [
          'Deepen emotional processing of the pursue-withdraw cycle with schema-level awareness',
          'Access primary attachment emotions — the longing beneath the panic, the grief beneath the anger',
          'Prepare for relational restructuring — client expressing needs from vulnerable position rather than anxious pursuit',
          'Coordinate with potential couples work for phase 2 of treatment',
        ],
        outcomePatterns: [
          { metric: 'Relationship satisfaction', change: '+52% improvement', confidence: 0.76 },
          { metric: 'Emotional accessibility', change: '+48% improvement', confidence: 0.74 },
          { metric: 'Panic frequency', change: '-42% reduction', confidence: 0.70 },
          { metric: 'Attachment security', change: '+35% improvement', confidence: 0.72 },
        ],
        matchReasoning: 'EFT gains relevance as couple dynamics become clearer. The pursue-withdraw pattern is explicitly mapped, and the client is approaching readiness for relational restructuring. Individual EFT can support the Schema Therapy work by focusing on the emotional processing and relational enactment components.',
        targetStructures: ['emotion' as const, 'social' as const, 'reflective' as const],
      },
    ],
    similarCases: [
      {
        id: 1,
        patientCode: 'SL-2024-0847',
        matchScore: 0.92,
        presentingConcerns: ['Relationship Anxiety', 'Panic Attacks', 'Childhood Emotional Neglect', 'Abandonment Fear', 'Anger Emergence'],
        dominantStructures: ['emotion' as const, 'social' as const, 'body' as const, 'narrative' as const],
        sessionCount: 12,
        keyThemes: ['attachment panic', 'mother transference', 'anger toward parent', 'schema identification', 'grounding practice'],
        outcome: 'significant_improvement',
        outcomeDetail: 'GAD-7 from 18 to 5 over 12 sessions. Anger toward mother emerged in Session 3 and was processed through letter-writing and chair work. Once anger was expressed, panic frequency dropped 70%. Client described anger as "the key that unlocked the cage."',
        representativeQuote: 'I spent my whole life apologizing for having needs. The day I got angry about that was the day I started healing.',
        matchExplanation: 'Matched on: schema recognition moment \u2014 the insight connecting childhood experience to adult relationship patterns. Semantic similarity strongest in the cognitive-reflective domain where past-present linking occurred. Both patients independently identified the mother-to-partner transference.',
      },
      {
        id: 2,
        patientCode: 'SL-2023-1293',
        matchScore: 0.87,
        presentingConcerns: ['Abandonment Schema', 'Somatic Panic', 'Schema Awareness', 'Childhood Neglect Processing'],
        dominantStructures: ['emotion' as const, 'body' as const, 'cognitive' as const, 'reflective' as const],
        sessionCount: 8,
        keyThemes: ['schema activation awareness', 'somatic processing', 'partner transference', 'inner child grief', 'body-held memories'],
        outcome: 'marked_improvement',
        outcomeDetail: 'PHQ-9 from 16 to 7 over 8 sessions. Client\'s schema awareness developed rapidly once the childhood-to-present connection was explicit. Key moment was body scan revealing throat tightness holding unspoken words from childhood. Somatic release preceded cognitive shift.',
        representativeQuote: 'My body was keeping a secret my mind didn\'t want to know — that the little girl inside me had been screaming into a pillow for twenty years.',
        matchExplanation: 'Matched on: somatic processing of abandonment schema with body scan revealing held grief. Both patients experienced throat tightness as the somatic signature of suppressed needs, and both showed schema awareness developing through body-mediated insight rather than purely cognitive processing.',
      },
      {
        id: 3,
        patientCode: 'SL-2024-0156',
        matchScore: 0.83,
        presentingConcerns: ['Childhood Neglect', 'Self-Directed Neglect', 'Anger Processing', 'Need Expression Deficits'],
        dominantStructures: ['narrative' as const, 'social' as const, 'reflective' as const, 'emotion' as const],
        sessionCount: 15,
        keyThemes: ['internalized neglect', 'self-dismissal pattern', 'anger emergence', 'narrative restructuring', 'need reclamation'],
        outcome: 'substantial_progress',
        outcomeDetail: 'Longer treatment due to deeply internalized self-neglect pattern. PHQ-9 from 15 to 8. Client initially perpetuating mother\'s dismissal internally ("I crumple up my own needs"). Narrative restructuring through letter-to-younger-self was pivotal turning point at Session 8.',
        representativeQuote: 'I realized I was doing to myself what my mother did to me — throwing my own needs in the recycling. The day I stopped was the day I started treating myself like I matter.',
        matchExplanation: 'Matched on: internalized self-neglect pattern \u2014 the recognition that the patient perpetuates the mother\'s dismissal internally. Both patients used nearly identical metaphors for self-directed need-suppression, and both reached this insight through reflective processing of the childhood neglect schema.',
      },
      {
        id: 4,
        patientCode: 'SL-2024-0934',
        matchScore: 0.79,
        presentingConcerns: ['Panic Reduction', 'Schema Identification', 'Somatic Awareness Development', 'Relationship Pattern Recognition'],
        dominantStructures: ['body' as const, 'emotion' as const, 'cognitive' as const, 'social' as const],
        sessionCount: 10,
        keyThemes: ['grounding success', 'panic duration reduction', 'transference recognition', 'body awareness expansion'],
        outcome: 'significant_improvement',
        outcomeDetail: 'GAD-7 from 17 to 6 over 10 sessions. Grounding technique reduced panic from 15+ minutes to 2-3 minutes by Session 4. Schema identification in Session 3 was catalytic — once client understood the attachment trigger, panic frequency dropped sharply.',
        representativeQuote: 'The panic was a time machine. Every time my partner went quiet, my body went back to being nine years old. Learning to stay in the present was the hardest thing I\'ve ever done.',
        matchExplanation: 'Matched on: successful grounding technique adoption with panic duration reduction following schema identification. Both patients showed the same catalytic pattern \u2014 once the attachment trigger was consciously linked to childhood experience, somatic regulation tools became dramatically more effective.',
      },
      {
        id: 5,
        patientCode: 'SL-2023-0671',
        matchScore: 0.75,
        presentingConcerns: ['Anger Toward Caregiver', 'Guilt Processing', 'Emotional Neglect', 'Attachment Anxiety'],
        dominantStructures: ['emotion' as const, 'narrative' as const, 'social' as const, 'normative' as const],
        sessionCount: 14,
        keyThemes: ['anger-guilt oscillation', 'caregiver confrontation', 'loyal child schema', 'grief processing', 'self-worth restoration'],
        outcome: 'significant_improvement',
        outcomeDetail: 'PHQ-9 from 18 to 6 over 14 sessions. Anger-guilt oscillation lasted 5 sessions before resolution. Client spent Sessions 3-7 alternating between rage and protectiveness toward mother. Resolution came through grief — mourning the mother she needed but didn\'t have.',
        representativeQuote: 'I protected my mother\'s reputation for thirty years. The day I let myself be angry at her was the day I started getting better.',
        matchExplanation: 'Matched on: anger-guilt oscillation toward neglecting caregiver with simultaneous protective loyalty. Semantic similarity strongest in the emotion-normative domain where both patients struggled with the moral conflict of holding a parent accountable for childhood deprivation.',
      },
      {
        id: 6,
        patientCode: 'SL-2024-1102',
        matchScore: 0.70,
        presentingConcerns: ['Somatic Holding', 'Throat Constriction', 'Unspoken Needs', 'Body Scan Discoveries'],
        dominantStructures: ['body' as const, 'immediate_experience' as const, 'emotion' as const, 'reflective' as const],
        sessionCount: 11,
        keyThemes: ['throat tightness', 'suppressed vocalization', 'body scan revelations', 'somatic release', 'voice reclamation'],
        outcome: 'moderate_improvement',
        outcomeDetail: 'GAD-7 from 15 to 9 over 11 sessions. Throat constriction was the primary somatic holding pattern — client had literal difficulty speaking her needs aloud. Somatic experiencing work focused on completing the vocal expression. Voice work accelerated progress in final third of treatment.',
        representativeQuote: 'The tightness in my throat was twenty years of swallowed words. When I finally let them out, my whole body softened.',
        matchExplanation: 'Matched on: throat constriction as the primary somatic holding pattern for suppressed needs and unspoken words. Both patients presented with literal difficulty vocalizing needs, and both showed somatic release in the throat region preceding verbal expression of attachment longings.',
      },
    ],
    structureProfile: {
      body: 0.62,
      immediate_experience: 0.48,
      emotion: 0.85,
      behaviour: 0.50,
      social: 0.70,
      cognitive: 0.72,
      reflective: 0.52,
      narrative: 0.65,
      ecological: 0.22,
      normative: 0.38,
    } as Record<string, number>,
    sessionHistory: [
      { session: 1, emotionalIntensity: 8.5, reflectiveCapacity: 2.8, emotionalRegulation: 2.2, therapeuticAlliance: 3.5 },
      { session: 2, emotionalIntensity: 7.2, reflectiveCapacity: 4.5, emotionalRegulation: 4.0, therapeuticAlliance: 5.5 },
    ],
    therapistMoves: [
      { type: 'interpretation' as const, count: 2, percentage: 30 },
      { type: 'empathic_attunement' as const, count: 2, percentage: 25 },
      { type: 'reflection' as const, count: 2, percentage: 25 },
      { type: 'challenge' as const, count: 1, percentage: 15 },
      { type: 'silence' as const, count: 0, percentage: 5 },
    ],
    clinicianReport: '## Session Overview\nSession 2 with a female client (26-35) continuing Schema Therapy for attachment-activated panic disorder rooted in childhood emotional neglect. Overall impression: significant deepening of schema awareness and emotional processing capacity, with measurable improvement in self-regulation.\n\n## Key Clinical Observations\n- **Somatic grounding success:** Client reduced a panic episode from 20 minutes to 3 minutes between sessions using the grounding technique; shoulder-bracing pattern observation ("What am I bracing for?") demonstrates expanding interoceptive awareness\n- **Independent transference insight:** Client identified the partner-to-mother transference on her own: "I\'m not upset because he left the room — I\'m upset because it felt like she left the room" — genuine schema awareness rather than therapist-directed interpretation\n- **Internalized self-neglect recognized:** "I crumple up my needs and throw them away before anyone can see them" — shift from externalizing (Marcus doesn\'t give enough attention) to recognizing the internal schema (I treat my own needs as disposable)\n\n## Risk Assessment\n- **Current Risk Level:** Moderate (reduced from high)\n- **Risk Factors:** Anger-guilt oscillation toward mother ("I\'m betraying her by being angry"), panic frequency not yet fully resolved, emotional intensity during schema processing\n- **Protective Factors:** Demonstrated self-regulation capacity, autonomous insight generation between sessions, growing interoceptive awareness, strong therapeutic alliance\n\n## Phenomenological Structure Analysis\n- **Dominant Structures:** Emotion (28%), Cognitive (22%), Body (20%), Social (16%), Reflective (14%)\n- **Notable Patterns:** Shift from body-emotion dominance to increased cognitive and reflective engagement. Somatic body scan produced spontaneous release — throat tightness identified as suppressed needs, vocalized as "I deserved more," representing real-time somatic processing.\n\n## Treatment Progress\nSignificant improvement from Session 1. PHQ-9 reduced from 14 to 11, GAD-7 from 16 to 13. Panic severity improving with self-regulation tools showing efficacy. First emergence of anger toward mother is a critical therapeutic marker in childhood neglect cases.\n\n## Clinical Recommendations\n1. Continue Schema Therapy with somatic integration, supporting anger processing toward mother in graduated doses\n2. Prepare for behavioral pattern-breaking through need-expression exercises with partner (graduated exposure)\n3. Monitor anger-guilt oscillation and normalize the experience; introduce mode work to differentiate Abandoned Child from Demanding Critic\n\n## Plan for Next Session\n- Review outcome of daily need-expression practice with partner\n- Begin structured mode dialogue between Abandoned Child and the Healthy Adult\n- Assess readiness for narrative restructuring work (letter to younger self)',
    patientReport: '## What We Explored Today\nToday we went deeper into the connection between your childhood experiences and what happens in your body and your relationship now. You came in with real progress to share, and we built on that progress by exploring some of the harder emotions underneath — including anger, which took real courage to let yourself feel.\n\n## What Stood Out\n- **Three minutes instead of twenty is a big deal.** Using the grounding technique to catch the panic before it spiraled means your body is starting to learn it has options besides full alarm. That change came from your effort between sessions.\n- **What you said about your mother took tremendous courage.** "It\'s not okay that she wasn\'t there." You\'ve spent years protecting her from your anger, and in doing so, you\'ve been protecting everyone from your needs. The guilt you feel about being angry is completely normal — it doesn\'t mean the anger is wrong. You can love your mother and be angry about what you didn\'t receive. Those feelings can exist side by side.\n- **You named the core pattern yourself.** You said you treat your own needs the way your mother treated your drawing — you crumple them up and throw them away before anyone can see them. That recognition is powerful because it came from you, not from me.\n\n## Your Strengths\n- You used the tools we discussed between sessions and they worked — that shows real commitment to your own healing\n- You allowed yourself to feel anger for the first time without shutting it down, which is a sign of growing emotional resilience\n\n## Things to Reflect On\nYour needs are not recyclable. They matter. This week, notice the moments when you start to crumple up a need before voicing it. You don\'t have to change it yet — just catch it happening. Awareness always comes before change.\n\n## Before Our Next Session\n- **Practice expressing one small need daily to Marcus.** It can be tiny — "I\'d like us to eat dinner at the table tonight" or "Can you sit with me for ten minutes?" Just practice saying what you want out loud.\n- **Notice what happens in your body when you express a need.** Does your chest tighten? Do your shoulders brace? Just observe without judgment.\n- **If the guilt about your mother comes up, try writing it down.** You don\'t need to resolve it. Just letting it exist on paper can help it feel less overwhelming.',
    cbtAnalysis: {
      distortions: [
        { type: 'Catastrophizing (Reducing)', confidence: 0.72, evidence: 'Wrote the whole story of being abandoned in forty-five seconds while Marcus was on a phone call.', alternativeThought: 'Client is catching the catastrophic narrative more quickly and with humor. Awareness is developing — she sees the forty-five-second story as disproportionate.', momentIndex: 1 },
        { type: 'Emotional Reasoning', confidence: 0.78, evidence: 'I\'m scared that if I let myself need things from people, I\'ll be disappointed again.', alternativeThought: 'The fear of disappointment is based on childhood experience. Marcus\'s actual behavior (staying for panic attack, returning quickly from calls) provides counter-evidence to the prediction.', momentIndex: 5 },
        { type: 'Overgeneralization (Loosening)', confidence: 0.65, evidence: 'Wanting things from people is dangerous — but starting to differentiate Marcus from mother.', alternativeThought: 'The generalization "all people will dismiss my needs" is beginning to crack. Evidence from Marcus suggests some people will stay. Differentiation is active.', momentIndex: 5 },
      ],
      overallDistortionLoad: 0.68,
      treatmentReadiness: 0.70,
      dominantPatterns: ['Catastrophizing (reducing)', 'Emotional Reasoning', 'Emerging cognitive flexibility', 'Overgeneralization (loosening)'],
      automaticThoughts: [
        { content: 'If he leaves the room, he\'s leaving me — wait, he\'s taking a phone call', beliefStrength: 0.72, supportsWellbeing: false },
        { content: 'Being angry at my mother means I\'m ungrateful', beliefStrength: 0.75, supportsWellbeing: false },
        { content: 'I crumple up my needs and throw them away — but what if they\'re not disposable?', beliefStrength: 0.60, supportsWellbeing: true },
        { content: 'I deserved more — I deserved someone who stayed', beliefStrength: 0.68, supportsWellbeing: true },
      ],
      behavioralPatterns: ['Grounding technique use during activation', 'Emerging somatic self-awareness', 'Beginning to differentiate partner from mother', 'Anger-guilt oscillation with progressive resolution'],
    },
    vectorInsights: [
      { id: 1, type: 'trajectory', title: 'Schema Recognition Acceleration', description: 'Your client\'s key insight \u2014 "I\'m not upset because he left the room, I\'m upset because it felt like she left the room" \u2014 semantically matches breakthrough moments in 9 of 11 similar cases. In those cases, this type of past-present linking typically accelerated therapeutic progress by 2-3 sessions compared to patients who did not achieve this connection.', confidence: 0.89, supportingMetric: '9/11 cases showed accelerated progress after schema recognition', icon: 'trending' },
      { id: 2, type: 'outcome_prediction', title: 'Anger Emergence as Progress Marker', description: 'The emergence of anger toward the neglecting parent at this stage is a positive prognostic indicator. In semantically similar trajectories, anger emergence at Session 2-3 correlated with 68% faster resolution of panic symptoms compared to cases where anger remained suppressed beyond Session 5.', confidence: 0.84, supportingMetric: '68% faster panic resolution when anger emerges by Session 3', icon: 'target' },
      { id: 3, type: 'method_alignment', title: 'Grounding + Schema Work Synergy', description: 'Your client\'s successful use of the grounding technique (panic reduced from 20 to 3 minutes) combined with schema recognition creates a dual-track progress pattern. Vector analysis shows this combination \u2014 somatic regulation plus cognitive insight \u2014 has the highest correlation with sustained improvement across 778 patient journeys.', confidence: 0.86, supportingMetric: 'Dual-track pattern: highest sustained improvement correlation', icon: 'link' },
    ],
    analysisStatus: 'complete' as const,
    analysisWarnings: [],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION 3: "Finding Solid Ground" — 2026-04-23
// Client had a difficult conversation with partner about needs. Instead of
// panicking, she said "I need you to stay in the room when I'm upset." Partner
// responded well. First letter to younger self (narrative restructuring).
// ═══════════════════════════════════════════════════════════════════════════════

const session3 = {
  session_number: 3,
  session_date: '2026-04-23T10:00:00Z',
  treatment_goals: 'Process successful need-expression with partner; review letter to younger self; assess somatic symptom changes; explore boundary-setting with mother; consolidate therapeutic gains',
  status: 'complete',
  transcript: `Therapist: How have things been since our last session?

Patient: Something happened that I need to tell you about. Marcus and I had a hard conversation last week. He came home late from work and I could feel the old pattern starting — the tightness, the story in my head about being forgotten. But instead of either panicking or pretending I was fine, I said something I've never said before. I said, "I need you to stay in the room when I'm upset. Even if you don't know what to say. I just need you to stay."

Therapist: What happened when you said that?

Patient: [tearing up] He put down his bag and he sat next to me on the couch and he said, "I'm here. I'm not going anywhere." And I just... cried. Not panic crying. Relief crying. Like something that had been clenched for my entire life just let go. I've never asked for that before. I've never told anyone what I actually need.

Therapist: That's a profound moment. You expressed a need — the most fundamental one — and it was met. How does that land in your body right now, as you describe it?

Patient: [pause, hands on chest] Warm. It feels warm here. The chest thing — it's not tight right now. It's actually... open? That's weird. I've been so used to the tightness that the openness feels strange.

Therapist: Your body is learning what it feels like when the need is met instead of denied. That warmth is important — it's what safety feels like.

Patient: And there's something else. I did the letter. The one you suggested — to my younger self. I want to read part of it if that's okay.

Therapist: Please.

Patient: [reading] "Dear little one. I know you're standing in the kitchen right now, holding a drawing you made with every crayon in the box. I know what's about to happen, and I'm sorry I can't stop it. But I want you to know something she never told you: that drawing was beautiful. You are not too much. You were never too much. The problem was never the size of your feelings — it was that the room wasn't big enough to hold them. One day you're going to find someone who has a bigger room. And one day, you're going to build a room of your own." [crying]

Therapist: [pause] Thank you for sharing that. What was it like to write it?

Patient: It was the hardest thing I've ever done. I cried the whole time. But when I finished, I felt something I don't think I've ever felt before. I felt... like I matter. Not because someone told me I do. Because I told me.

Therapist: You gave yourself what your mother couldn't. That's not a small thing.

Patient: And speaking of my mother — I did something there too. She called last Sunday and she was doing the usual thing, talking about her day, not asking about mine. And normally I just go along with it. But this time I said, "Mom, I want to tell you about my week too." And she paused and said, "Oh. Okay. Tell me." It wasn't perfect. She only half listened. But I said what I needed to say, and I didn't crumble when she wasn't fully present.

Therapist: You set a boundary with your mother. How was that different from how it would have gone a month ago?

Patient: A month ago I would have either said nothing and felt invisible, or I would have hung up and had a panic attack. This time I felt sad — but it was a clean sadness, not a panic sadness. Like, I can be sad that my mother isn't great at emotional connection without it meaning I'm unlovable. Those are two different things. I couldn't separate them before.

Therapist: That separation — between your mother's limitations and your worth — is one of the most important shifts you've made.

Patient: I've been noticing my body more too. Before the panic used to just hit me — like a wave I couldn't see coming. Now I can feel it building. The shoulders start first, then the chest. And when I notice it, I can do the grounding. I'd say I catch it before it becomes a full attack about eighty percent of the time now. And the ones that do come through are shorter — five minutes, maybe less.

Therapist: Your body is becoming an ally instead of an alarm system.

Patient: I still have the fear. The abandonment fear. I don't think that ever fully goes away. But it doesn't run me anymore. I can feel it and also know that it's about something that happened a long time ago, not about what's happening right now. There's a little girl inside me who's still scared — and I'm learning to take care of her instead of ignoring her the way my mom did.

Therapist: [pause] I want you to notice what just happened. You described taking care of your own scared inner child — the part of you that was left standing in the kitchen. You're not waiting for someone else to pick up that drawing anymore. You picked it up yourself.

Patient: [smiling through tears] Yeah. I did. And it turns out it really is a beautiful drawing.

Therapist: It really is.`,
  analysis_result: {
    quickInsight: {
      riskLevel: 'low' as const,
      clinicalPriority: 'Consolidating significant therapeutic gains across multiple domains: need-expression, somatic regulation, narrative restructuring, boundary-setting, and schema differentiation. Focus on maintenance and relapse prevention.',
      prognosis: 'Good — client demonstrating autonomous therapeutic skill use, successful behavioral pattern-breaking, and schema-level change; earned security emerging',
      topRecommendation: 'Maintain Schema Therapy approach; transition to consolidation phase with relapse prevention planning; consider spacing sessions to build autonomy; monitor for regression under stress',
      sessionNumber: 3,
    },
    moments: [
      {
        id: 1,
        timestamp: '00:01:30',
        quote: 'I said, "I need you to stay in the room when I\'m upset." He said, "I\'m here. I\'m not going anywhere." I\'ve never asked for that before.',
        context: 'First successful direct need-expression in an intimate relationship. The core wound ("I just want someone to stay in the room") from Session 1 is now articulated as a behavioral request rather than an unspoken longing. Partner responded with attunement, providing a corrective emotional experience.',
        type: 'recalled_past' as const,
        valence: 'positive' as const,
        intensity: 9,
        structures: ['social' as const, 'emotion' as const, 'behaviour' as const, 'body' as const],
        therapistMove: 'empathic_attunement' as const,
        therapistQuote: 'That\'s a profound moment. You expressed a need — the most fundamental one — and it was met.',
      },
      {
        id: 2,
        timestamp: '00:04:00',
        quote: 'Not panic crying. Relief crying. Like something that had been clenched for my entire life just let go.',
        context: 'Somatic release event — client differentiating between panic tears (fear-based) and relief tears (safety-based). The "clenching" metaphor connects to the chest tightness that has been the primary somatic complaint. The body is processing the corrective experience somatically.',
        type: 'immediate_experience' as const,
        valence: 'positive' as const,
        intensity: 8,
        structures: ['body' as const, 'emotion' as const, 'immediate_experience' as const],
        therapistMove: 'reflection' as const,
        therapistQuote: 'How does that land in your body right now, as you describe it?',
      },
      {
        id: 3,
        timestamp: '00:06:30',
        quote: 'Dear little one. That drawing was beautiful. You are not too much. You were never too much. The problem was never the size of your feelings — it was that the room wasn\'t big enough to hold them.',
        context: 'Narrative restructuring via letter to younger self. Client reframes the core schema: from "I am too much" to "the room wasn\'t big enough." This is a profound externalization of blame — the deficit belonged to the environment, not the child. Represents schema-level cognitive restructuring.',
        type: 'reflective' as const,
        valence: 'positive' as const,
        intensity: 10,
        structures: ['narrative' as const, 'reflective' as const, 'emotion' as const, 'cognitive' as const],
        therapistMove: 'empathic_attunement' as const,
        therapistQuote: 'Thank you for sharing that. What was it like to write it?',
      },
      {
        id: 4,
        timestamp: '00:09:00',
        quote: 'I can feel the panic building now. The shoulders start first, then the chest. I catch it before it becomes a full attack about eighty percent of the time.',
        context: 'Demonstrated interoceptive awareness with quantified self-assessment. Client can now track the somatic prodrome of panic (shoulders → chest) and intervene with grounding before full escalation. 80% catch rate represents strong self-regulation capacity.',
        type: 'reflective' as const,
        valence: 'positive' as const,
        intensity: 6,
        structures: ['body' as const, 'reflective' as const, 'cognitive' as const, 'immediate_experience' as const],
        therapistMove: 'interpretation' as const,
        therapistQuote: 'Your body is becoming an ally instead of an alarm system.',
      },
      {
        id: 5,
        timestamp: '00:11:00',
        quote: 'I said, "Mom, I want to tell you about my week too." It wasn\'t perfect. She only half listened. But I didn\'t crumble when she wasn\'t fully present.',
        context: 'Boundary-setting with the attachment figure of origin. Client tolerated the mother\'s limited response without schema activation or panic. Differentiating "clean sadness" from "panic sadness" represents advanced emotional processing and schema deactivation.',
        type: 'recalled_past' as const,
        valence: 'mixed' as const,
        intensity: 7,
        structures: ['social' as const, 'emotion' as const, 'cognitive' as const, 'narrative' as const],
        therapistMove: 'challenge' as const,
        therapistQuote: 'How was that different from how it would have gone a month ago?',
      },
      {
        id: 6,
        timestamp: '00:14:00',
        quote: 'I\'m learning to take care of her instead of ignoring her the way my mom did. It turns out it really is a beautiful drawing.',
        context: 'Integration moment — client has internalized the limited reparenting function. She is now caring for her own abandoned inner child rather than waiting for external rescue. The drawing metaphor from Session 1 completes its arc: from discarded to reclaimed. This represents earned security emerging.',
        type: 'reflective' as const,
        valence: 'positive' as const,
        intensity: 9,
        structures: ['reflective' as const, 'narrative' as const, 'emotion' as const, 'social' as const, 'ecological' as const],
        therapistMove: 'reflection' as const,
        therapistQuote: 'You\'re not waiting for someone else to pick up that drawing anymore. You picked it up yourself.',
      },
    ],
    riskFlags: [
      {
        id: 1,
        severity: 'low' as const,
        signal: 'Monitor for Regression During Stress',
        detail: 'Client showing strong progress across all domains but earned security is still new and potentially fragile under sustained stress. Abandonment schema may reactivate during major life transitions, partner conflict, or family-of-origin contact. Current panic catch rate (80%) leaves 20% vulnerability.',
        algorithmMatch: 'regression monitoring, new gains, stress testing, schema reactivation risk, earned security fragility',
        recommendation: 'Develop relapse prevention plan identifying high-risk situations (major arguments with partner, extended contact with mother, work stress); establish early warning signs and response protocols; consider booster sessions at 1, 3, and 6 month intervals',
        interventionType: 'monitor',
      },
    ],
    practitionerMatches: [
      {
        id: 1,
        code: 'PR-SCHEMA-042',
        name: 'Dr. Rebecca Morrison',
        specialty: 'Schema Therapy with Limited Reparenting',
        methodology: 'Schema Therapy confirmed as optimal approach — all treatment targets met or progressing. Abandonment/Instability schema showing significant deactivation. Client has internalized limited reparenting function ("I\'m learning to take care of her"). Protocol transitioning from active processing to consolidation and maintenance.',
        matchScore: 0.95,
        interventionSequence: [
          'Consolidate schema healing gains — reinforce the new narrative ("the room wasn\'t big enough" vs. "I am too much")',
          'Expand behavioral pattern-breaking — generalize need-expression from partner to other relationships',
          'Develop relapse prevention plan — identify high-risk situations where Abandonment schema may reactivate',
          'Build sustainable self-reparenting practices for ongoing inner child care',
          'Plan treatment spacing — transition to biweekly, then monthly, with booster sessions as needed',
        ],
        outcomePatterns: [
          { metric: 'Panic frequency reduction', change: '-80% (client at -80% after 3 sessions)', confidence: 0.93 },
          { metric: 'GAD-7 improvement', change: '-7 points achieved (16 → 9)', confidence: 0.91 },
          { metric: 'Schema severity (YSQ)', change: '-52% abandonment domain (actively deactivating)', confidence: 0.89 },
          { metric: 'Relationship satisfaction', change: 'Significant improvement — corrective experience achieved', confidence: 0.88 },
        ],
        matchReasoning: 'Client exceeding expected trajectory for Schema Therapy. The successful need-expression ("I need you to stay in the room"), partner\'s corrective response, narrative restructuring (letter to younger self), and boundary-setting with mother all occurred within a single between-session period. The internalization of the reparenting function ("I\'m learning to take care of her") indicates the client is building earned security. Match score peaks at 0.95. 83% of matched cases who reach this milestone maintain gains at 6-month follow-up.',
        targetStructures: ['emotion' as const, 'social' as const, 'narrative' as const, 'cognitive' as const, 'reflective' as const],
      },
      {
        id: 2,
        code: 'PR-ATTACHMENT-017',
        name: 'Dr. James Chen',
        specialty: 'Attachment-Focused Therapy with Somatic Awareness',
        methodology: 'Attachment-based therapy confirmed — corrective attachment experience achieved with partner ("I\'m here. I\'m not going anywhere."). Client transitioning from anxious attachment toward earned security. Somatic system registering safety (warmth in chest replacing tightness).',
        matchScore: 0.90,
        interventionSequence: [
          'Process the corrective attachment experience with partner — deepen the body-level registration of safety',
          'Support earned security development — normalize the "strangeness" of openness replacing tightness',
          'Generalize attachment security to other relationships — mother, friends, therapeutic relationship',
          'Plan for attachment challenges — how to maintain earned security under stress',
        ],
        outcomePatterns: [
          { metric: 'Attachment security (ECR-R)', change: '+42% improvement (actively shifting toward earned security)', confidence: 0.87 },
          { metric: 'Panic frequency reduction', change: '-80% (achieved)', confidence: 0.86 },
          { metric: 'Somatic safety markers', change: 'Chest warmth replacing tightness — positive somatic shift', confidence: 0.84 },
          { metric: 'Relationship satisfaction', change: 'Significant improvement — partner attuned and responsive', confidence: 0.82 },
        ],
        matchReasoning: 'The corrective attachment experience with Marcus represents the therapeutic ideal: the client expressed her core attachment need, and it was met with consistent presence. The somatic shift from chest tightness to warmth is a body-level marker of earned security formation. Attachment-focused therapy would continue to deepen this shift.',
        targetStructures: ['social' as const, 'body' as const, 'emotion' as const, 'reflective' as const],
      },
      {
        id: 3,
        code: 'PR-SOMATIC-089',
        name: 'Dr. Amara Okonkwo',
        specialty: 'Somatic Experiencing for Developmental Trauma',
        methodology: 'Somatic processing validated — the shift from chest tightness to chest warmth represents completion of a somatic cycle. The "relief crying" is a body-level discharge of decades of held tension. Client now tracking somatic prodrome (shoulders → chest) with 80% intervention success.',
        matchScore: 0.82,
        interventionSequence: [
          'Consolidate the somatic shift — deepen the body\'s registration of safety through chest warmth exercises',
          'Complete remaining somatic processing — any residual holding patterns in shoulders, throat, or jaw',
          'Build sustainable body-awareness practices for daily somatic self-care',
          'Develop somatic early-warning system for relapse prevention',
        ],
        outcomePatterns: [
          { metric: 'Somatic panic symptom reduction', change: '-80% (chest tightness now "open")', confidence: 0.88 },
          { metric: 'Window of tolerance expansion', change: '+65% (catching 80% of activations before escalation)', confidence: 0.86 },
          { metric: 'Somatic safety markers', change: 'Warmth replacing tightness — positive completion', confidence: 0.84 },
          { metric: 'Body-based self-regulation', change: 'Autonomous — client independently using grounding', confidence: 0.82 },
        ],
        matchReasoning: 'The somatic arc is completing beautifully: from chest compression and hand numbness (Session 1) through throat release (Session 2) to chest warmth and openness (Session 3). Client\'s body is registering earned security at the physiological level. SE techniques could deepen this completion and build a sustainable body-based self-regulation practice.',
        targetStructures: ['body' as const, 'immediate_experience' as const, 'emotion' as const],
      },
      {
        id: 4,
        code: 'PR-NARRATIVE-033',
        name: 'Dr. Lisa Yamamoto',
        specialty: 'Narrative Therapy and Identity Reconstruction',
        methodology: 'Narrative restructuring emerging as natural fit — the letter to younger self demonstrates powerful capacity for narrative reauthoring. Client reframing core identity story from "I am too much" to "the room wasn\'t big enough." The drawing metaphor has completed its arc from discarded to reclaimed.',
        matchScore: 0.76,
        interventionSequence: [
          'Deepen narrative restructuring — expand the letter-writing practice to other formative memories',
          'Build a coherent self-narrative that integrates the neglect experience without being defined by it',
          'Identify and strengthen the "preferred story" of self — capable, deserving, worthy of presence',
          'Create narrative anchors for relapse prevention — stories of competence and connection to return to under stress',
        ],
        outcomePatterns: [
          { metric: 'Narrative coherence', change: '+55% improvement in autobiographical coherence', confidence: 0.80 },
          { metric: 'Identity integration', change: '+48% — neglect experience integrated without dominating self-concept', confidence: 0.76 },
          { metric: 'Self-worth stability', change: '+42% sustained improvement', confidence: 0.74 },
          { metric: 'Relapse prevention durability', change: '+38% at 6-month follow-up', confidence: 0.72 },
        ],
        matchReasoning: 'New recommendation based on Session 3 data. Client\'s letter to younger self was therapeutically potent and demonstrates natural capacity for narrative reconstruction. The reframe from "I am too much" to "the room wasn\'t big enough" is a hallmark of effective narrative therapy. This approach can complement Schema Therapy during the consolidation phase.',
        targetStructures: ['narrative' as const, 'reflective' as const, 'cognitive' as const, 'ecological' as const],
      },
      {
        id: 5,
        code: 'PR-DBT-055',
        name: 'Dr. Priya Sharma',
        specialty: 'Dialectical Behavior Therapy — Emotion Regulation Module',
        methodology: 'DBT skills acquisition confirmed — client independently using grounding, emotional differentiation ("clean sadness" vs. "panic sadness"), and boundary-setting. Skills now self-directed rather than therapist-guided.',
        matchScore: 0.68,
        interventionSequence: [
          'Consolidate distress tolerance gains into sustainable daily practice',
          'Expand emotion regulation — build vocabulary for new emotional experiences (relief, warmth, openness)',
          'DEAR MAN maintenance — continue practicing need-expression in graduated contexts',
          'Mindfulness as ongoing practice for schema awareness and somatic self-monitoring',
        ],
        outcomePatterns: [
          { metric: 'Distress tolerance capacity', change: '+65% (80% panic catch rate)', confidence: 0.82 },
          { metric: 'Emotion regulation', change: '+58% (differentiating sadness types)', confidence: 0.78 },
          { metric: 'Interpersonal effectiveness', change: '+52% (need-expression and boundary-setting achieved)', confidence: 0.76 },
          { metric: 'Mindfulness capacity', change: '+45% (somatic self-awareness established)', confidence: 0.74 },
        ],
        matchReasoning: 'DBT skill targets largely met through Schema Therapy framework. Client demonstrating autonomous distress tolerance, emotion regulation (clean vs. panic sadness), and interpersonal effectiveness (need-expression to partner, boundary with mother). DBT elements can support maintenance phase but primary therapeutic work is schema-level.',
        targetStructures: ['emotion' as const, 'behaviour' as const, 'body' as const, 'cognitive' as const],
      },
    ],
    similarCases: [
      {
        id: 1,
        patientCode: 'SL-2024-0847',
        matchScore: 0.93,
        presentingConcerns: ['Successful Need-Expression', 'Schema Deactivation', 'Earned Security', 'Narrative Restructuring'],
        dominantStructures: ['emotion' as const, 'social' as const, 'narrative' as const, 'reflective' as const],
        sessionCount: 12,
        keyThemes: ['corrective emotional experience', 'partner attunement', 'inner child work', 'self-reparenting', 'sustained gains'],
        outcome: 'significant_improvement',
        outcomeDetail: 'GAD-7 from 18 to 5 over 12 sessions. Corrective emotional experience with partner occurred at Session 5 — client expressed core need and partner responded. This was the tipping point: panic frequency dropped 85% in subsequent sessions. Maintained gains at 6-month follow-up. Client described treatment as "learning I deserved to take up space."',
        representativeQuote: 'I asked for what I needed and the world didn\'t end. That one sentence changed my life more than years of pretending I was fine.',
        matchExplanation: 'Matched on: successful need-expression in intimate relationship following childhood neglect. Both patients demonstrated the shift from body-based panic to verbal articulation of attachment needs, and both experienced the corrective emotional experience of having that need met by a responsive partner.',
      },
      {
        id: 2,
        patientCode: 'SL-2023-1293',
        matchScore: 0.88,
        presentingConcerns: ['Somatic Resolution', 'Schema Healing', 'Body-Level Safety', 'Attachment Repair'],
        dominantStructures: ['body' as const, 'emotion' as const, 'social' as const, 'reflective' as const],
        sessionCount: 8,
        keyThemes: ['chest tightness resolution', 'somatic safety markers', 'earned security', 'body-mind integration'],
        outcome: 'marked_improvement',
        outcomeDetail: 'PHQ-9 from 16 to 7 over 8 sessions. The shift from chest tightness to warmth occurred at Session 6, corresponding to successful corrective experience in relationship. Somatic processing was key — body registered safety before cognition fully updated. Maintained gains at 4-month follow-up.',
        representativeQuote: 'My body told me I was safe before my brain believed it. Learning to trust that warmth in my chest was like learning a new language — the language of enough.',
        matchExplanation: 'Matched on: somatic safety marker emergence \u2014 the shift from chest tightness (threat) to chest warmth (safety) following corrective attachment experience. Both patients registered earned security somatically before cognitive schemas fully updated, confirming the body-first healing trajectory in attachment trauma.',
      },
      {
        id: 3,
        patientCode: 'SL-2024-0156',
        matchScore: 0.84,
        presentingConcerns: ['Letter to Younger Self', 'Narrative Reauthoring', 'Self-Worth Restoration', 'Schema Integration'],
        dominantStructures: ['narrative' as const, 'reflective' as const, 'emotion' as const, 'cognitive' as const],
        sessionCount: 15,
        keyThemes: ['inner child letter', 'identity reconstruction', 'self-compassion development', 'coherent narrative building'],
        outcome: 'substantial_progress',
        outcomeDetail: 'PHQ-9 from 15 to 8 over 15 sessions. Letter to younger self at Session 8 was transformative — client described it as "rewriting the story from the inside." Narrative restructuring approach took longer but produced deep, durable change. Self-worth measures improved most dramatically after the letter exercise.',
        representativeQuote: 'Writing that letter to the little girl I used to be broke something open. She needed to hear that she mattered — and I was the only one who could tell her.',
        matchExplanation: 'Matched on: letter-to-younger-self as narrative restructuring intervention with externalization of blame from self to environment. Both patients used the letter exercise to reframe the core schema from "I am deficient" to "the environment was insufficient," producing measurable shifts in self-worth and schema severity.',
      },
      {
        id: 4,
        patientCode: 'SL-2024-0934',
        matchScore: 0.80,
        presentingConcerns: ['Boundary-Setting with Parent', 'Clean Sadness', 'Emotional Differentiation', 'Autonomy Development'],
        dominantStructures: ['social' as const, 'emotion' as const, 'cognitive' as const, 'reflective' as const],
        sessionCount: 10,
        keyThemes: ['parent boundary', 'sadness differentiation', 'emotional maturity', 'self-directed care'],
        outcome: 'significant_improvement',
        outcomeDetail: 'GAD-7 from 17 to 6 over 10 sessions. Boundary-setting with parent at Session 7 was the key marker of earned autonomy. Client\'s ability to feel "clean sadness" about parent\'s limitations without panic activation indicated schema differentiation had occurred.',
        representativeQuote: 'I can be sad that my mother isn\'t who I needed without it meaning I\'m unlovable. Separating those two things was the whole therapy.',
        matchExplanation: 'Matched on: boundary-setting with the attachment figure of origin combined with emotional differentiation ("clean sadness" vs. schema-activated distress). Both patients achieved the critical developmental milestone of tolerating parental limitations without it triggering identity-level abandonment schemas.',
      },
      {
        id: 5,
        patientCode: 'SL-2023-0671',
        matchScore: 0.76,
        presentingConcerns: ['Self-Reparenting', 'Internalized Care', 'Earned Security', 'Schema Deactivation'],
        dominantStructures: ['reflective' as const, 'emotion' as const, 'narrative' as const, 'body' as const],
        sessionCount: 14,
        keyThemes: ['inner child integration', 'self-care development', 'attachment security building', 'schema healing'],
        outcome: 'significant_improvement',
        outcomeDetail: 'PHQ-9 from 18 to 6 over 14 sessions. Internalization of the reparenting function occurred at Session 10 — client began spontaneously "checking in" with her inner child during stressful moments. This self-reparenting capacity was the strongest predictor of sustained gains at follow-up.',
        representativeQuote: 'I learned to be the mother I needed. Not because she failed — but because I deserve someone who shows up. And that someone can be me.',
        matchExplanation: 'Matched on: internalization of the reparenting function \u2014 the shift from needing external validation to providing self-directed care for the neglected inner child. Both patients reached the self-reparenting milestone and both demonstrated it as the strongest predictor of sustained treatment gains at follow-up.',
      },
      {
        id: 6,
        patientCode: 'SL-2024-1102',
        matchScore: 0.71,
        presentingConcerns: ['Panic Resolution', 'Somatic Self-Regulation', 'Relationship Improvement', 'Consolidation'],
        dominantStructures: ['body' as const, 'social' as const, 'emotion' as const, 'cognitive' as const],
        sessionCount: 11,
        keyThemes: ['panic elimination', 'somatic mastery', 'relationship satisfaction', 'treatment gains maintenance'],
        outcome: 'moderate_improvement',
        outcomeDetail: 'GAD-7 from 15 to 9 over 11 sessions. Panic attacks eliminated by Session 8 but underlying schema work still in progress at termination. Relationship satisfaction improved 40%. Transferred to monthly maintenance sessions for continued schema work.',
        representativeQuote: 'The panic stopped, but the real work was just beginning. Stopping the attacks was the easy part — changing the story underneath them is the marathon.',
        matchExplanation: 'Matched on: panic elimination with ongoing schema-level work in the consolidation phase. Both patients achieved somatic symptom resolution before full schema deactivation, highlighting that panic cessation is a necessary but insufficient marker of deep therapeutic change in attachment trauma profiles.',
      },
    ],
    structureProfile: {
      body: 0.42,
      immediate_experience: 0.35,
      emotion: 0.62,
      behaviour: 0.58,
      social: 0.68,
      cognitive: 0.65,
      reflective: 0.78,
      narrative: 0.72,
      ecological: 0.35,
      normative: 0.45,
    } as Record<string, number>,
    sessionHistory: [
      { session: 1, emotionalIntensity: 8.5, reflectiveCapacity: 2.8, emotionalRegulation: 2.2, therapeuticAlliance: 3.5 },
      { session: 2, emotionalIntensity: 7.2, reflectiveCapacity: 4.5, emotionalRegulation: 4.0, therapeuticAlliance: 5.5 },
      { session: 3, emotionalIntensity: 5.8, reflectiveCapacity: 6.5, emotionalRegulation: 6.2, therapeuticAlliance: 7.0 },
    ],
    therapistMoves: [
      { type: 'reflection' as const, count: 2, percentage: 30 },
      { type: 'empathic_attunement' as const, count: 2, percentage: 25 },
      { type: 'challenge' as const, count: 1, percentage: 20 },
      { type: 'interpretation' as const, count: 1, percentage: 15 },
      { type: 'silence' as const, count: 1, percentage: 10 },
    ],
    clinicianReport: '## Session Overview\nSession 3 with a female client (26-35) continuing Schema Therapy for attachment-activated panic with childhood emotional neglect origin. Overall impression: substantial therapeutic progress exceeding typical trajectory, with behavioral change, narrative restructuring, and somatic markers of earned security formation.\n\n## Key Clinical Observations\n- **Successful direct need-expression to partner:** Client told Marcus "I need you to stay in the room when I\'m upset" — transforming Session 1\'s unspoken longing into an articulated behavioral request; partner\'s attuned response provided corrective emotional experience registered somatically as warmth replacing chest tightness\n- **Effective narrative restructuring:** Letter to younger self reframed the schema origin — "The problem was never the size of your feelings. It was that the room wasn\'t big enough to hold them" — externalizing the deficit from self to environment\n- **Boundary-setting with mother tolerated:** Client said "I want to tell you about my week too" and tolerated the imperfect response without panic activation; distinguished "clean sadness" from "panic sadness" — advanced emotional differentiation\n\n## Risk Assessment\n- **Current Risk Level:** Low\n- **Risk Factors:** Remaining panic episodes (20% uncaught), potential for schema reactivation under high stress, early stage of earned security requiring consolidation\n- **Protective Factors:** 80% panic catch rate with episodes under 5 minutes (down from 20-minute attacks at intake), autonomous need-expression, successful boundary-setting, strong partner support, advanced emotional differentiation, high treatment engagement (0.85 readiness)\n\n## Phenomenological Structure Analysis\n- **Dominant Structures:** Reflective (24%), Narrative (22%), Social (20%), Emotion (18%), Body (16%)\n- **Notable Patterns:** Marked shift from body-emotion dominance (Session 1) to reflective-narrative dominance, indicating multi-level schema processing rather than intellectual insight alone. Somatic markers now trending positive (warmth, openness) rather than threat-based (tightness, numbness).\n\n## Treatment Progress\nPHQ-9 trajectory: 14 to 11 to 7. GAD-7 trajectory: 16 to 13 to 9. Both consistent with strong treatment response. Client demonstrating autonomous skill use across behavioral (need-expression), cognitive (reframing), somatic (grounding), and relational (boundary-setting) domains simultaneously.\n\n## Clinical Recommendations\n1. Continue schema consolidation with focus on generalizing earned security beyond the partner relationship\n2. Develop relapse prevention protocol identifying early warning signs and intervention hierarchy\n3. Consider treatment spacing (biweekly sessions) after confirming sustained gains over the next 2-3 sessions to support autonomous functioning\n\n## Plan for Next Session\n- Review sustained gains and assess readiness for session spacing\n- Formalize relapse prevention plan with identified triggers, early warning signs, and coping hierarchy\n- Explore extending need-expression and boundary-setting skills to other relationships (friendships, workplace)',
    patientReport: '## What We Explored Today\nToday\'s session was about seeing how far you\'ve come — and the evidence is in your actions, not just your words. You told Marcus what you need. You wrote a letter to your younger self. You set a boundary with your mother. These are not small things. These are the changes that reshape a life.\n\n## What Stood Out\n- **You said your deepest need out loud and it was met.** Telling Marcus "I need you to stay in the room when I\'m upset" took the oldest, most vulnerable part of you and trusted it to someone. And he stayed. The warmth you felt in your body is what safety feels like when your nervous system finally believes it.\n- **The letter to your younger self was extraordinary.** The line about the room not being big enough is not just a nice reframe — it\'s the truth. There was never anything wrong with the size of your feelings. The environment was the limitation, not you. And the fact that this came from you, not from me, is what makes it stick.\n- **What you did with your mother showed real growth.** You didn\'t rage, you didn\'t freeze, you didn\'t panic. You simply said what you needed and let her response be her response. The "clean sadness" you described is what it feels like to see someone clearly without making their limitations about your value.\n\n## Your Strengths\n- You have developed the ability to speak your needs directly and tolerate the vulnerability that comes with it — that is earned courage\n- You can now distinguish between old pain and present reality, which means you are no longer at the mercy of the past\n\n## Things to Reflect On\nLook at the arc of these three sessions. You came in believing you were broken because you had panic attacks. Now you understand that those attacks were your body trying to protect a little girl who learned that love was unreliable. You are not broken. You never were. You were just carrying something too heavy to carry alone.\n\n## Before Our Next Session\n- **Keep saying what you need.** Every time you voice a need instead of crumpling it up, you are rewriting the old story. It gets easier with practice.\n- **Keep checking in with your body.** Notice the moments of warmth, openness, and ease — not just the tightness. Your body is learning a new language of safety.\n- **Pick up the drawing.** Whenever the old voice says "you\'re too much," remember what you wrote to your younger self. The room wasn\'t big enough. Your feelings were never the problem.',
    cbtAnalysis: {
      distortions: [
        { type: 'Catastrophizing (Resolved)', confidence: 0.25, evidence: 'Expressed core need to partner — predicted rejection, received attunement. Catastrophic prediction directly disconfirmed.', alternativeThought: 'The catastrophic prediction has been behaviorally disconfirmed. Client expressed her deepest need and it was met. The evidence is experiential, not theoretical.', momentIndex: 0 },
        { type: 'Overgeneralization (Resolved)', confidence: 0.30, evidence: 'Set boundary with mother, tolerated imperfect response without panic. Can now differentiate between "mother\'s limitations" and "my worth."', alternativeThought: 'The overgeneralization from mother to all relationships is dissolving. Client can receive an imperfect response from mother without it activating the "everyone leaves" schema.', momentIndex: 4 },
      ],
      overallDistortionLoad: 0.32,
      treatmentReadiness: 0.85,
      dominantPatterns: ['Minimal distortion load', 'Strong cognitive flexibility', 'Emotional differentiation capacity', 'Schema awareness integrated'],
      automaticThoughts: [
        { content: 'I am not too much — the room wasn\'t big enough', beliefStrength: 0.78, supportsWellbeing: true },
        { content: 'I can be sad about my mother without it meaning I\'m unlovable', beliefStrength: 0.75, supportsWellbeing: true },
        { content: 'I\'m learning to take care of the little girl inside me', beliefStrength: 0.80, supportsWellbeing: true },
        { content: 'My needs are not disposable — that drawing was beautiful', beliefStrength: 0.82, supportsWellbeing: true },
      ],
      behavioralPatterns: ['Direct need-expression to partner', 'Boundary-setting with mother', 'Autonomous somatic grounding (80% catch rate)', 'Narrative restructuring through letter-writing', 'Emotional differentiation (clean sadness vs. panic sadness)'],
    },
    vectorInsights: [
      { id: 1, type: 'trajectory', title: 'Earned Secure Attachment Emerging', description: 'Your client\'s ability to directly express needs to her partner \u2014 "I need you to stay in the room when I\'m upset" \u2014 semantically aligns with the "earned secure attachment" milestone identified across 778 patient journeys. Only 12% of patients with childhood neglect profiles reach this milestone by Session 3, suggesting above-average therapeutic responsiveness.', confidence: 0.93, supportingMetric: 'Top 12% \u2014 earned secure attachment milestone by Session 3', icon: 'trending' },
      { id: 2, type: 'outcome_prediction', title: 'Sustained Recovery Probability', description: 'Based on trajectory matching across similar cases, your client has an 84% probability of maintaining treatment gains at 6-month follow-up. Key predictors: successful need-expression (achieved), body awareness catching panic early (achieved), ability to differentiate partner from parent (achieved). Recommend gradual session spacing to consolidate gains.', confidence: 0.88, supportingMetric: '84% sustained recovery probability at 6-month follow-up', icon: 'target' },
      { id: 3, type: 'method_alignment', title: 'Narrative Integration Complete', description: 'The letter to younger self \u2014 reframing "the room wasn\'t big enough" \u2014 represents narrative restructuring of the core schema. Vector analysis of 14,600 moments shows this type of narrative reframing has the highest correlation (r=0.78) with long-term schema deactivation. The shift from body-emotion dominance (Session 1) to reflective-narrative dominance (Session 3) confirms the therapeutic arc.', confidence: 0.92, supportingMetric: 'r=0.78 correlation between narrative reframing and schema deactivation', icon: 'link' },
    ],
    analysisStatus: 'complete' as const,
    analysisWarnings: [],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('🌱 SessionLens v3 Trauma Demo Seed Script');
  console.log('═══════════════════════════════════════════');
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`Therapist ID: ${DEV_THERAPIST_ID}`);
  console.log('');

  // Step 1: Delete existing SL-2026-DEMO data
  console.log('🗑️  Cleaning existing SL-2026-DEMO data...');

  // Find the existing demo client
  const { data: existingClients } = await supabase
    .from('clients')
    .select('client_id')
    .eq('client_code', 'SL-2026-DEMO')
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
    console.log('  ✓ Sessions deleted');
  }

  // Delete the client(s)
  if (clientIds.length > 0) {
    await supabase.from('clients').delete().in('client_id', clientIds);
    console.log(`  ✓ ${clientIds.length} SL-2026-DEMO client(s) deleted`);
  } else {
    console.log('  ✓ No existing SL-2026-DEMO data found');
  }

  console.log('');

  // Step 2: Insert client
  console.log('👤 Inserting client SL-2026-DEMO...');

  const { data: clientData, error: clientErr } = await supabase
    .from('clients')
    .insert(client1)
    .select('client_id, client_code')
    .single();

  if (clientErr) {
    console.error(`  ✗ Error inserting ${client1.client_code}:`, clientErr.message);
    process.exit(1);
  }

  const clientId = clientData.client_id;
  console.log(`  ✓ ${clientData.client_code} → ${clientId}`);
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
  console.log('✅ Trauma demo seed complete!');
  console.log('   1 client (SL-2026-DEMO), 3 sessions');
  console.log('   Arc: "The Breaking Point" → "Connecting the Dots" → "Finding Solid Ground"');
  console.log('');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
