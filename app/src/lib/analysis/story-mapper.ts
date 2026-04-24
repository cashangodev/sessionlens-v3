/**
 * Story Mapper / Narrative Arc Analyzer
 * Preserves the narrative arc of each session: turning points, phases,
 * transitions between dimensions, and temporal flow.
 *
 * Prevents the "fragmentation of the Gestalt" — keeping the whole-person
 * story intact rather than breaking it into disconnected data points.
 *
 * Based on: Henriksen et al. (2021/2022), Daly et al. (2024), Maxwell (2012)
 */

import { Moment, NarrativeArc, NarrativePhase, NarrativeTurningPoint, StructureName, EmotionalValence } from '@/types';

/**
 * Detect turning points: moments where the experiential structure shifts significantly.
 */
function detectTurningPoints(moments: Moment[]): NarrativeTurningPoint[] {
  const turningPoints: NarrativeTurningPoint[] = [];

  if (moments.length < 2) return turningPoints;

  for (let i = 1; i < moments.length; i++) {
    const prev = moments[i - 1];
    const curr = moments[i];

    const prevStructs = new Set(prev.structures);
    const currStructs = new Set(curr.structures);

    // Calculate structural shift: how many structures changed?
    const overlap = curr.structures.filter(s => prevStructs.has(s)).length;
    const totalUnique = new Set([...prev.structures, ...curr.structures]).size;
    const shiftMagnitude = 1 - (overlap / Math.max(totalUnique, 1));

    // Intensity shift
    const intensityDelta = curr.intensity - prev.intensity;

    // Valence shift
    const valenceChanged = prev.valence !== curr.valence;

    // A turning point if: significant structural shift OR large intensity change + valence flip
    const isTurningPoint = shiftMagnitude >= 0.5 ||
      (Math.abs(intensityDelta) >= 3 && valenceChanged) ||
      (curr.intensity >= 8 && curr.type === 'immediate_experience');

    if (isTurningPoint) {
      // Classify the type
      let type: NarrativeTurningPoint['type'] = 'shift';
      if (intensityDelta >= 3 && curr.valence === 'negative') type = 'escalation';
      if (curr.intensity >= 8 && curr.valence === 'negative') type = 'crisis';
      if (curr.type === 'reflective' && curr.valence !== 'negative') type = 'insight';
      if (intensityDelta <= -2 && (curr.valence === 'positive' || curr.valence === 'mixed')) type = 'resolution';
      if (i === 1 && curr.intensity >= 5) type = 'onset';

      turningPoints.push({
        momentId: curr.id,
        type,
        description: generateTurningPointDescription(type, prev, curr),
        structuresBefore: prev.structures,
        structuresAfter: curr.structures,
        emotionalShift: {
          from: `${prev.valence} (intensity ${prev.intensity}/10)`,
          to: `${curr.valence} (intensity ${curr.intensity}/10)`,
        },
      });
    }
  }

  return turningPoints;
}

function generateTurningPointDescription(
  type: NarrativeTurningPoint['type'],
  prev: Moment,
  curr: Moment
): string {
  switch (type) {
    case 'onset':
      return `Session opens with ${curr.structures.join(', ')} activation — ${curr.valence} tone at intensity ${curr.intensity}/10`;
    case 'escalation':
      return `Emotional escalation: intensity rises from ${prev.intensity} to ${curr.intensity}, structures shift from ${prev.structures.join('+')} to ${curr.structures.join('+')}`;
    case 'crisis':
      return `Peak distress moment — high intensity (${curr.intensity}/10) with ${curr.structures.join(', ')} activation`;
    case 'insight':
      return `Reflective shift: client moves from ${prev.structures.join('+')} to ${curr.structures.join('+')} — metacognitive awareness emerging`;
    case 'shift':
      return `Structural transition: experiential pattern moves from ${prev.structures.join('+')} to ${curr.structures.join('+')}`;
    case 'resolution':
      return `De-escalation: intensity drops from ${prev.intensity} to ${curr.intensity}, valence shifts toward ${curr.valence}`;
  }
}

/**
 * Identify narrative phases: contiguous groups of moments with similar structure profiles.
 */
function identifyPhases(moments: Moment[]): NarrativePhase[] {
  if (moments.length === 0) return [];
  if (moments.length <= 2) {
    return [{
      label: 'Session',
      startMomentId: moments[0].id,
      endMomentId: moments[moments.length - 1].id,
      dominantStructures: getMostFrequent(moments.flatMap(m => m.structures)),
      dominantValence: getMostFrequentValence(moments),
      description: 'Single-phase session',
    }];
  }

  const phases: NarrativePhase[] = [];
  let phaseStart = 0;

  for (let i = 1; i <= moments.length; i++) {
    const isEnd = i === moments.length;
    const structuralShift = !isEnd && (() => {
      const prevStructs = new Set(moments[i - 1].structures);
      const overlap = moments[i].structures.filter(s => prevStructs.has(s)).length;
      const totalUnique = new Set([...moments[i - 1].structures, ...moments[i].structures]).size;
      return (1 - overlap / Math.max(totalUnique, 1)) >= 0.6;
    })();
    const valenceFlip = !isEnd && moments[i].valence !== moments[i - 1].valence &&
      moments[i].valence !== 'mixed' && moments[i - 1].valence !== 'mixed';

    if (isEnd || (structuralShift && valenceFlip)) {
      const phaseMoments = moments.slice(phaseStart, i);
      const allStructs = phaseMoments.flatMap(m => m.structures);
      const dominant = getMostFrequent(allStructs);
      const valence = getMostFrequentValence(phaseMoments);

      const phaseLabels = ['Opening', 'Development', 'Deepening', 'Integration', 'Closing'];
      const label = phaseLabels[phases.length] || `Phase ${phases.length + 1}`;

      phases.push({
        label,
        startMomentId: phaseMoments[0].id,
        endMomentId: phaseMoments[phaseMoments.length - 1].id,
        dominantStructures: dominant,
        dominantValence: valence,
        description: `${label}: ${dominant.join(', ')} dominant, ${valence} valence`,
      });

      phaseStart = i;
    }
  }

  return phases;
}

function getMostFrequent(items: StructureName[]): StructureName[] {
  const counts: Record<string, number> = {};
  items.forEach(i => { counts[i] = (counts[i] || 0) + 1; });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(e => e[0] as StructureName);
}

function getMostFrequentValence(moments: Moment[]): EmotionalValence {
  const counts: Record<string, number> = {};
  moments.forEach(m => { counts[m.valence] = (counts[m.valence] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as EmotionalValence || EmotionalValence.NEUTRAL;
}

/**
 * Determine overall trajectory from moment intensities and valences.
 */
function computeTrajectory(moments: Moment[]): NarrativeArc['overallTrajectory'] {
  if (moments.length < 2) return 'stable';

  const firstHalf = moments.slice(0, Math.ceil(moments.length / 2));
  const secondHalf = moments.slice(Math.ceil(moments.length / 2));

  const avgFirst = firstHalf.reduce((s, m) => s + m.intensity, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((s, m) => s + m.intensity, 0) / secondHalf.length;

  const firstNeg = firstHalf.filter(m => m.valence === 'negative').length / firstHalf.length;
  const secondNeg = secondHalf.filter(m => m.valence === 'negative').length / secondHalf.length;

  // Check for oscillation
  let oscillations = 0;
  for (let i = 1; i < moments.length; i++) {
    if (Math.abs(moments[i].intensity - moments[i - 1].intensity) >= 3) oscillations++;
  }
  if (oscillations >= moments.length * 0.5) return 'oscillating';

  // Deteriorating: intensity rising AND more negative
  if (avgSecond > avgFirst + 1 && secondNeg > firstNeg + 0.2) return 'deteriorating';

  // Improving: intensity dropping OR more positive
  if (avgSecond < avgFirst - 1 || secondNeg < firstNeg - 0.2) return 'improving';

  // Emerging: structures diversifying
  const firstStructCount = new Set(firstHalf.flatMap(m => m.structures)).size;
  const secondStructCount = new Set(secondHalf.flatMap(m => m.structures)).size;
  if (secondStructCount > firstStructCount + 1) return 'emerging';

  return 'stable';
}

export function mapNarrativeArc(moments: Moment[]): NarrativeArc {
  const turningPoints = detectTurningPoints(moments);
  const phases = identifyPhases(moments);
  const overallTrajectory = computeTrajectory(moments);

  // Generate Gestalt summary
  const dominantStructs = getMostFrequent(moments.flatMap(m => m.structures));
  const avgIntensity = moments.reduce((s, m) => s + m.intensity, 0) / Math.max(moments.length, 1);
  const hasInsight = turningPoints.some(tp => tp.type === 'insight');
  const hasCrisis = turningPoints.some(tp => tp.type === 'crisis');

  let gestaltSummary = '';
  if (hasCrisis && hasInsight) {
    gestaltSummary = `Session moves through crisis to insight — ${dominantStructs.join(', ')} structures anchor the experience. The person's distress peaks and then shifts as reflective capacity emerges.`;
  } else if (hasCrisis) {
    gestaltSummary = `Session centres on distress with ${dominantStructs.join(', ')} activation at intensity ${Math.round(avgIntensity)}/10. The experiential pattern shows ${overallTrajectory} trajectory without clear resolution.`;
  } else if (hasInsight) {
    gestaltSummary = `Session builds toward insight through ${dominantStructs.join(', ')} dimensions. The person develops metacognitive awareness and begins connecting experiential patterns.`;
  } else {
    gestaltSummary = `Session maintains a ${overallTrajectory} trajectory through ${dominantStructs.join(', ')} dimensions at moderate intensity (${Math.round(avgIntensity)}/10). Experiential pattern is ${phases.length > 2 ? 'multi-phased' : 'relatively stable'}.`;
  }

  return {
    phases,
    turningPoints,
    overallTrajectory,
    gestaltSummary,
  };
}
