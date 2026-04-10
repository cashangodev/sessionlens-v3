import { AnalysisResult, RiskSeverity } from '@/types';

export interface ClinicalNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface DAPNote {
  data: string;
  assessment: string;
  plan: string;
}

function generateSubjective(analysis: AnalysisResult): string {
  const moments = analysis.moments.slice(0, 3); // Key moments
  const mainConcern = analysis.quickInsight.clinicalPriority;

  const momentSummaries = moments
    .map(m => `Client reported: "${m.quote}"`)
    .join(' ');

  const emotionalTone = analysis.moments
    .filter(m => m.intensity > 6)
    .length > 0 ? 'heightened emotional intensity' : 'manageable emotional presentation';

  return `Client presented with ${mainConcern}. ${momentSummaries} Client demonstrated ${emotionalTone} throughout the session. Expressed ${analysis.quickInsight.prognosis?.toLowerCase() || 'mixed'} outlook on progress.`;
}

function generateObjective(analysis: AnalysisResult): string {
  const highIntensityMoments = analysis.moments.filter(m => m.intensity >= 7).length;
  const structures = Object.entries(analysis.structureProfile)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name]) => name.replace(/_/g, ' '))
    .join(', ');

  const riskFlags = analysis.riskFlags.filter(f => f.severity === RiskSeverity.HIGH);
  const riskStatement = riskFlags.length > 0
    ? `HIGH RISK factors identified: ${riskFlags.map(f => f.signal).join(', ')}.`
    : 'No acute safety concerns noted.';

  const therapistMoves = analysis.therapistMoves
    .sort((a, b) => b.count - a.count)
    .slice(0, 2)
    .map(m => m.type.replace(/_/g, ' '))
    .join(' and ');

  return `Session #${analysis.quickInsight.sessionNumber}. Client demonstrated ${highIntensityMoments} moments of significant emotional intensity. Dominant psychological structures: ${structures}. Therapist employed ${therapistMoves} throughout session. ${riskStatement} Engagement and therapeutic alliance appeared solid.`;
}

function generateAssessment(analysis: AnalysisResult): string {
  const priority = analysis.quickInsight.clinicalPriority;
  const riskLevel = analysis.quickInsight.riskLevel;
  const prognosis = analysis.quickInsight.prognosis;

  const mainIssues = analysis.moments
    .slice(0, 2)
    .map(m => m.context.split('\n')[0])
    .join('; ');

  const activeRisks = analysis.riskFlags
    .filter(f => f.severity !== 'low')
    .map(f => `${f.signal} (${f.severity})`)
    .join(', ');

  return `Primary clinical concern: ${priority}. Risk level: ${riskLevel}. Client's presenting issues relate to: ${mainIssues}. ${activeRisks ? `Active clinical risks: ${activeRisks}. ` : ''}Prognosis: ${prognosis}. Client demonstrates capacity for reflection and appears motivated for change. Recommend continued focus on skill-building and emotional regulation.`;
}

function generatePlan(analysis: AnalysisResult): string {
  const topRecommendation = analysis.quickInsight.topRecommendation;
  const riskFlags = analysis.riskFlags;

  const interventions: string[] = [];

  // Add risk-specific interventions
  if (riskFlags.some(f => f.severity === RiskSeverity.HIGH)) {
    interventions.push('Conduct formal safety assessment; implement crisis plan if needed');
  }

  // Add recommendation
  interventions.push(topRecommendation);

  // Add structure-based interventions
  const dominantStructures = Object.entries(analysis.structureProfile)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 1);

  if (dominantStructures.length > 0) {
    const structure = dominantStructures[0][0];
    if (structure.includes('emotion')) {
      interventions.push('Continue developing emotional regulation skills');
    }
    if (structure.includes('cognitive')) {
      interventions.push('Explore thought patterns and cognitive restructuring');
    }
    if (structure.includes('body')) {
      interventions.push('Implement somatic awareness and grounding techniques');
    }
  }

  interventions.push('Schedule follow-up session in 1 week');
  interventions.push('Review session notes and homework compliance');

  return interventions.join('\n• ');
}

function generateDAPData(analysis: AnalysisResult): string {
  const moments = analysis.moments.slice(0, 2);
  const observations: string[] = [];

  moments.forEach(m => {
    observations.push(`• Client stated: "${m.quote}"`);
    observations.push(`  - Context: ${m.context.split('\n')[0]}`);
    observations.push(`  - Emotional intensity: ${m.intensity}/10`);
  });

  observations.push(`• Observed emotional regulation: ${analysis.sessionHistory[0]?.emotionalRegulation ?? 6}/10`);
  observations.push(`• Therapeutic alliance: ${analysis.sessionHistory[0]?.therapeuticAlliance ?? 7}/10`);

  if (analysis.riskFlags.length > 0) {
    observations.push(`• Risk factors identified:`);
    analysis.riskFlags.forEach(f => {
      observations.push(`  - ${f.signal}: ${f.detail}`);
    });
  }

  return observations.join('\n');
}

function generateDAPAssessment(analysis: AnalysisResult): string {
  const priority = analysis.quickInsight.clinicalPriority;
  const riskLevel = analysis.quickInsight.riskLevel;

  const assessment: string[] = [];
  assessment.push(`Primary concern: ${priority}`);
  assessment.push(`Risk level: ${riskLevel}`);

  const patterns = analysis.moments
    .map(m => m.context.split('\n')[0])
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 2);

  assessment.push(`Pattern: Client shows recurring themes around ${patterns.join(' and ')}`);
  assessment.push(`Strengths: Client demonstrates ${analysis.sessionHistory[0]?.reflectiveCapacity ?? 6 >= 6 ? 'good' : 'developing'} reflective capacity`);
  assessment.push(`Prognosis: ${analysis.quickInsight.prognosis}`);

  return assessment.join('\n');
}

function generateDAPPlan(analysis: AnalysisResult): string {
  const topRecommendation = analysis.quickInsight.topRecommendation;

  const planItems: string[] = [];
  planItems.push(`1. ${topRecommendation}`);
  planItems.push(`2. Continue building on therapeutic gains from previous sessions`);
  planItems.push(`3. Assign homework: Practice skill(s) introduced in session`);

  if (analysis.riskFlags.some(f => f.severity !== 'low')) {
    planItems.push(`4. Monitor and reassess risk at next session`);
  } else {
    planItems.push(`4. Continue current treatment trajectory`);
  }

  planItems.push(`5. Next session in 1 week`);

  return planItems.join('\n');
}

export function generateSOAPNote(analysis: AnalysisResult): ClinicalNote {
  return {
    subjective: generateSubjective(analysis),
    objective: generateObjective(analysis),
    assessment: generateAssessment(analysis),
    plan: generatePlan(analysis),
  };
}

export function generateDAPNote(analysis: AnalysisResult): DAPNote {
  return {
    data: generateDAPData(analysis),
    assessment: generateDAPAssessment(analysis),
    plan: generateDAPPlan(analysis),
  };
}

export function formatSOAPAsText(note: ClinicalNote): string {
  return `SOAP NOTE

SUBJECTIVE
${note.subjective}

OBJECTIVE
${note.objective}

ASSESSMENT
${note.assessment}

PLAN
• ${note.plan}`;
}

export function formatDAPAsText(note: DAPNote): string {
  return `DAP NOTE

DATA
${note.data}

ASSESSMENT
${note.assessment}

PLAN
${note.plan}`;
}
