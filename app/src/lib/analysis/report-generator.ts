import { Moment, RiskFlag, StructureName, PractitionerMatch } from '@/types';
import { getOpenAIClient, hasOpenAI } from './openai-client';

async function generateWithOpenAI(
  moments: Moment[],
  riskFlags: RiskFlag[],
  structureProfile: Record<StructureName, number>,
  practitionerMatches: PractitionerMatch[],
  sessionNumber: number
): Promise<{ clinicianReport: string; patientReport: string }> {
  const client = getOpenAIClient();
  if (!client) throw new Error('OpenAI client not available');

  const systemPrompt = `You are a clinical psychologist generating session reports. Create two reports:
1. Clinician report: professional clinical summary for the clinical record
2. Patient report: warm, accessible summary for the client to take home

Both should reference specific moments from the session and provide actionable next steps.`;

  const userPrompt = `Session ${sessionNumber}. Key moments: ${moments.map(m => `"${m.quote}"`).join('; ')}
Risk flags: ${riskFlags.map(r => r.signal).join(', ')}
Top structures: ${Object.entries(structureProfile)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([s]) => s)
    .join(', ')}
Recommended methods: ${practitionerMatches.map(m => m.name).join(', ')}`;

  try {
    const response = await (client as any).chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const text = response.choices[0]?.message?.content || '';
    const clinicianMatch = text.match(/## Clinician Report([\s\S]*?)(?=## Patient Report|$)/);
    const patientMatch = text.match(/## Patient Report([\s\S]*?)$/);

    const clinicianReport = clinicianMatch ? clinicianMatch[1].trim() : 'Clinical summary generated.';
    const patientReport = patientMatch ? patientMatch[1].trim() : 'Session summary for your reflection.';

    return { clinicianReport, patientReport };
  } catch (error) {
    console.error('OpenAI report generation error:', error);
    throw error;
  }
}

function generateWithFallback(
  moments: Moment[],
  riskFlags: RiskFlag[],
  structureProfile: Record<StructureName, number>,
  practitionerMatches: PractitionerMatch[],
  sessionNumber: number
): { clinicianReport: string; patientReport: string } {
  // Generate clinician report
  const topStructures = Object.entries(structureProfile)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([s]) => s);

  const presentingConcernsFromRisk = riskFlags.map(r => r.signal).join(', ');
  const momentSummaries = moments
    .slice(0, 3)
    .map(m => `- ${m.quote}: Structures: ${m.structures.join(', ')}. Therapist response: ${m.therapistMove}`)
    .join('\n');

  const clinicianReport = `SESSION ${sessionNumber} CLINICAL SUMMARY

PRESENTING CONCERNS:
${presentingConcernsFromRisk || 'General therapeutic exploration'}

KEY CLINICAL OBSERVATIONS:
${momentSummaries}

STRUCTURE PROFILE (Top 3):
${topStructures.join(', ')}

RISK ASSESSMENT:
${
  riskFlags.length > 0
    ? riskFlags.map(f => `- ${f.signal} (${f.severity}): ${f.detail}`).join('\n')
    : 'No significant risk flags identified.'
}

TREATMENT RECOMMENDATIONS:
${practitionerMatches.slice(0, 2).map(m => `- ${m.name}: ${m.methodology}`).join('\n')}

NEXT STEPS:
Continue weekly sessions focusing on ${topStructures[0]?.replace(/_/g, ' ') || 'emotional processing'}. Monitor for any changes in symptom patterns.`;

  // Generate patient report
  const accessibleStructures = topStructures.map(s => s.replace(/_/g, ' '));
  const patientStrengths = moments
    .filter(m => m.valence === 'positive' || m.valence === 'mixed')
    .slice(0, 2)
    .map(m => `- ${m.quote}`)
    .join('\n');

  const patientReport = `YOUR SESSION SUMMARY

WHAT WE EXPLORED TOGETHER:
We spent our time together diving into some important themes for you. Here's what stood out:

${moments.slice(0, 2).map(m => `"${m.quote}"`).join('\n\n')}

KEY OBSERVATIONS:
In this session, we noticed some patterns around ${accessibleStructures.slice(0, 2).join(' and ')}. This is really valuable awareness to build on.

YOUR STRENGTHS:
${
  patientStrengths
    ? `We observed several strengths today:\n${patientStrengths}`
    : 'You showed real openness and engagement in our work together.'
}

SUGGESTIONS FOR YOU:
Between now and our next session, I'd like you to notice moments when you feel the themes we discussed. Journaling can help, or just mental note-taking.

REMEMBER:
You're doing important work here. Change is happening, even when it's not immediately obvious. Be patient and kind with yourself.`;

  return { clinicianReport, patientReport };
}

export async function generateReports(
  moments: Moment[],
  riskFlags: RiskFlag[],
  structureProfile: Record<StructureName, number>,
  practitionerMatches: PractitionerMatch[],
  sessionNumber: number
): Promise<{ clinicianReport: string; patientReport: string }> {
  if (hasOpenAI()) {
    try {
      return await generateWithOpenAI(moments, riskFlags, structureProfile, practitionerMatches, sessionNumber);
    } catch (error) {
      console.warn('Falling back to template-based report generation:', error);
      return generateWithFallback(moments, riskFlags, structureProfile, practitionerMatches, sessionNumber);
    }
  }

  return generateWithFallback(moments, riskFlags, structureProfile, practitionerMatches, sessionNumber);
}
