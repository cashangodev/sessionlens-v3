/**
 * Network Analysis for Lived Experience Mapping
 *
 * Implements the core of the Pattern Theory of Self network approach
 * (Gallagher 2013; Daly et al. 2024; Tran et al. 2018) — builds a co-occurrence
 * network from session moments, computes centrality, detects bridges, and
 * identifies clusters of phenomenological dimensions.
 *
 * Simplified from full Ising-model estimation for client-side rendering with
 * moderate sample sizes (5-30 moments per session).
 */

import type { Moment } from '@/types';
import { StructureName } from '@/types';

// All 10 phenomenological dimensions from the Pattern Theory of Self framework
export const ALL_STRUCTURES: StructureName[] = [
  StructureName.BODY,
  StructureName.IMMEDIATE_EXPERIENCE,
  StructureName.EMOTION,
  StructureName.BEHAVIOUR,
  StructureName.SOCIAL,
  StructureName.COGNITIVE,
  StructureName.REFLECTIVE,
  StructureName.NARRATIVE,
  StructureName.ECOLOGICAL,
  StructureName.NORMATIVE,
];

export const STRUCTURE_LABELS: Record<StructureName, string> = {
  [StructureName.BODY]: 'Body',
  [StructureName.IMMEDIATE_EXPERIENCE]: 'Prereflective',
  [StructureName.EMOTION]: 'Emotion',
  [StructureName.BEHAVIOUR]: 'Behaviour',
  [StructureName.SOCIAL]: 'Social',
  [StructureName.COGNITIVE]: 'Cognitive',
  [StructureName.REFLECTIVE]: 'Reflective',
  [StructureName.NARRATIVE]: 'Narrative',
  [StructureName.ECOLOGICAL]: 'Ecological',
  [StructureName.NORMATIVE]: 'Normative',
};

export interface NetworkNode {
  id: StructureName;
  label: string;
  occurrences: number;
  centrality: number; // normalized 0-1 degree centrality
  rawDegree: number; // raw number of connections
  cluster: number; // cluster assignment (0, 1, 2, 3)
  isBridge: boolean;
}

export interface NetworkEdge {
  source: StructureName;
  target: StructureName;
  weight: number; // raw co-occurrence count
  normalizedWeight: number; // 0-1 for rendering
}

export interface NetworkInsight {
  id: number;
  type: 'centrality' | 'bridge' | 'cluster' | 'implication' | 'isolation' | 'absence';
  title: string;
  description: string;
}

export interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  stats: {
    totalMoments: number;
    density: number; // proportion of possible edges that exist
    strongestConnection: { source: StructureName; target: StructureName; weight: number } | null;
    mostCentral: StructureName | null;
  };
  insights: NetworkInsight[];
}

/**
 * Build the 10x10 co-occurrence matrix. Symmetric, diagonal = structure count.
 */
function buildCoOccurrenceMatrix(moments: Moment[]): Record<StructureName, Record<StructureName, number>> {
  const matrix: Record<string, Record<string, number>> = {};

  for (const s1 of ALL_STRUCTURES) {
    matrix[s1] = {};
    for (const s2 of ALL_STRUCTURES) {
      matrix[s1][s2] = 0;
    }
  }

  for (const moment of moments) {
    const structures = moment.structures || [];
    // Record each structure's presence (diagonal)
    for (const s of structures) {
      if (matrix[s]) matrix[s][s] = (matrix[s][s] || 0) + 1;
    }
    // Record pairwise co-occurrences (upper and lower triangle)
    for (let i = 0; i < structures.length; i++) {
      for (let j = i + 1; j < structures.length; j++) {
        const a = structures[i];
        const b = structures[j];
        if (matrix[a]?.[b] !== undefined) {
          matrix[a][b] += 1;
          matrix[b][a] += 1;
        }
      }
    }
  }

  return matrix as Record<StructureName, Record<StructureName, number>>;
}

/**
 * Simple community detection via connected-component clustering with weight threshold.
 * For our 10-node graph with small sample, this approximates Ising-LASSO structure.
 */
function detectClusters(
  matrix: Record<StructureName, Record<StructureName, number>>,
  edgeThreshold: number,
): Record<StructureName, number> {
  const clusters: Record<string, number> = {};
  let nextCluster = 0;

  // Seeded assignment: group dimensions that have strongest mutual connections
  const visited: Set<StructureName> = new Set();

  // Sort structures by total connection strength (sum of row) descending
  const sortedStructures = [...ALL_STRUCTURES].sort((a, b) => {
    const sumA = ALL_STRUCTURES.filter((s) => s !== a).reduce((acc, s) => acc + (matrix[a][s] || 0), 0);
    const sumB = ALL_STRUCTURES.filter((s) => s !== b).reduce((acc, s) => acc + (matrix[b][s] || 0), 0);
    return sumB - sumA;
  });

  for (const seed of sortedStructures) {
    if (visited.has(seed)) continue;
    // BFS from seed, expanding only via edges above threshold
    const queue: StructureName[] = [seed];
    visited.add(seed);
    clusters[seed] = nextCluster;

    while (queue.length) {
      const current = queue.shift()!;
      for (const neighbor of ALL_STRUCTURES) {
        if (neighbor === current || visited.has(neighbor)) continue;
        if ((matrix[current][neighbor] || 0) >= edgeThreshold) {
          visited.add(neighbor);
          clusters[neighbor] = nextCluster;
          queue.push(neighbor);
        }
      }
    }
    nextCluster++;
  }

  return clusters as Record<StructureName, number>;
}

/**
 * A node is a "bridge" if removing it would disconnect members of different clusters
 * (approximation: high betweenness). Here we use a simple heuristic: a node connected
 * to multiple clusters.
 */
function detectBridges(
  matrix: Record<StructureName, Record<StructureName, number>>,
  clusters: Record<StructureName, number>,
  edgeThreshold: number,
): Set<StructureName> {
  const bridges = new Set<StructureName>();

  for (const node of ALL_STRUCTURES) {
    const connectedClusters = new Set<number>();
    for (const neighbor of ALL_STRUCTURES) {
      if (neighbor === node) continue;
      if ((matrix[node][neighbor] || 0) >= edgeThreshold) {
        connectedClusters.add(clusters[neighbor]);
      }
    }
    // If this node connects to 2+ different clusters, it's a bridge
    if (connectedClusters.size >= 2) {
      bridges.add(node);
    }
  }

  return bridges;
}

/**
 * Build full network data from an array of moments.
 * Edge threshold: keep edges with co-occurrence >= 1 (every observed connection matters
 * in small samples); upgrade to >=2 when we have more data.
 */
export function buildNetworkData(moments: Moment[]): NetworkData {
  const matrix = buildCoOccurrenceMatrix(moments);
  const edgeThreshold = 1;

  const clusters = detectClusters(matrix, edgeThreshold);
  const bridges = detectBridges(matrix, clusters, edgeThreshold);

  // Build edges (upper triangle only, avoid duplicates)
  const rawEdges: { source: StructureName; target: StructureName; weight: number }[] = [];
  for (let i = 0; i < ALL_STRUCTURES.length; i++) {
    for (let j = i + 1; j < ALL_STRUCTURES.length; j++) {
      const s = ALL_STRUCTURES[i];
      const t = ALL_STRUCTURES[j];
      const w = matrix[s][t] || 0;
      if (w >= edgeThreshold) {
        rawEdges.push({ source: s, target: t, weight: w });
      }
    }
  }

  const maxEdgeWeight = Math.max(1, ...rawEdges.map((e) => e.weight));
  const edges: NetworkEdge[] = rawEdges.map((e) => ({
    ...e,
    normalizedWeight: e.weight / maxEdgeWeight,
  }));

  // Compute degree centrality (number of neighbors via edges above threshold)
  const rawDegrees: Record<string, number> = {};
  for (const node of ALL_STRUCTURES) {
    rawDegrees[node] = 0;
    for (const other of ALL_STRUCTURES) {
      if (other === node) continue;
      if ((matrix[node][other] || 0) >= edgeThreshold) rawDegrees[node]++;
    }
  }
  const maxDegree = Math.max(1, ...Object.values(rawDegrees));

  const nodes: NetworkNode[] = ALL_STRUCTURES.map((id) => ({
    id,
    label: STRUCTURE_LABELS[id],
    occurrences: matrix[id][id] || 0,
    centrality: rawDegrees[id] / maxDegree,
    rawDegree: rawDegrees[id],
    cluster: clusters[id] ?? 0,
    isBridge: bridges.has(id),
  }));

  // Stats
  const possibleEdges = (ALL_STRUCTURES.length * (ALL_STRUCTURES.length - 1)) / 2;
  const density = edges.length / possibleEdges;
  const strongest = edges.length
    ? [...edges].sort((a, b) => b.weight - a.weight)[0]
    : null;
  const centralNode = nodes.length
    ? [...nodes].sort((a, b) => b.rawDegree - a.rawDegree || b.occurrences - a.occurrences)[0]
    : null;

  const insights = generateInsights(nodes, edges, bridges, clusters, strongest, moments.length);

  return {
    nodes,
    edges,
    stats: {
      totalMoments: moments.length,
      density,
      strongestConnection: strongest,
      mostCentral: centralNode?.id ?? null,
    },
    insights,
  };
}

function generateInsights(
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  bridges: Set<StructureName>,
  clusters: Record<StructureName, number>,
  strongest: { source: StructureName; target: StructureName; weight: number } | null,
  totalMoments: number,
): NetworkInsight[] {
  const insights: NetworkInsight[] = [];

  if (!totalMoments || !edges.length) {
    return [
      {
        id: 1,
        type: 'implication',
        title: 'Insufficient data',
        description: 'This session does not have enough coded moments to construct a meaningful experience map. Additional sessions will build a richer structural picture.',
      },
    ];
  }

  // Most central
  const sortedByDegree = [...nodes].sort((a, b) => b.rawDegree - a.rawDegree);
  const top = sortedByDegree[0];
  if (top && top.rawDegree > 0) {
    insights.push({
      id: 1,
      type: 'centrality',
      title: `${top.label} is the most interconnected dimension`,
      description: `${top.label} co-occurs with ${top.rawDegree} of the other 9 dimensions across ${totalMoments} coded moments. It sits at the center of the client's experiential pattern — the dimension through which most other aspects of their experience are organized.`,
    });
  }

  // Bridges
  if (bridges.size > 0) {
    const bridgeLabels = Array.from(bridges).map((id) => STRUCTURE_LABELS[id]);
    insights.push({
      id: 2,
      type: 'bridge',
      title: `${bridgeLabels.join(', ')} bridge${bridges.size === 1 ? 's' : ''} multiple experiential clusters`,
      description: `${bridgeLabels.length === 1 ? 'This dimension connects' : 'These dimensions connect'} otherwise-separate regions of the client's experience. Targeting ${bridgeLabels.length === 1 ? 'it' : 'them'} in treatment may produce ripple effects across multiple experiential domains simultaneously.`,
    });
  }

  // Clusters
  const clusterCounts: Record<number, StructureName[]> = {};
  for (const [node, c] of Object.entries(clusters) as [StructureName, number][]) {
    if (!clusterCounts[c]) clusterCounts[c] = [];
    if (nodes.find((n) => n.id === node)?.rawDegree! > 0) {
      clusterCounts[c].push(node);
    }
  }
  const nonTrivialClusters = Object.values(clusterCounts).filter((group) => group.length >= 2);
  if (nonTrivialClusters.length >= 2) {
    const clusterDescriptions = nonTrivialClusters
      .slice(0, 3)
      .map((group) => group.map((id) => STRUCTURE_LABELS[id]).join(' + '))
      .join('; ');
    insights.push({
      id: 3,
      type: 'cluster',
      title: `${nonTrivialClusters.length} distinct experiential communities detected`,
      description: `The client's experience organizes into separable clusters: ${clusterDescriptions}. This structural pattern suggests treatment may need to address each cluster with different interventions, or target bridge dimensions to produce cross-cluster change.`,
    });
  }

  // Strongest connection
  if (strongest && strongest.weight >= 2) {
    insights.push({
      id: 4,
      type: 'implication',
      title: `Strongest linkage: ${STRUCTURE_LABELS[strongest.source]} ↔ ${STRUCTURE_LABELS[strongest.target]}`,
      description: `These two dimensions co-occur in ${strongest.weight} moments — the dominant pairing in this session. Clinically, this often indicates that these aspects of experience are being processed together and respond best to integrated interventions.`,
    });
  }

  // ─── Isolated dimensions ──────────────────────────────────────────
  // A dimension that appeared in the session (occurrences > 0) but did not
  // co-occur with ANY other dimension. Clinically: this dimension is being
  // held separately from the rest of the client's experience. Two readings:
  // (a) compartmentalization — values/body/etc. processed in isolation,
  //     possibly defensively
  // (b) genuine independence — the dimension is present but doesn't relate
  //     to the current presenting concerns
  // Either reading is worth the clinician's notice; the system should flag
  // the structural pattern, not collapse it into a single interpretation.
  const isolatedNodes = nodes.filter((n) => n.occurrences > 0 && n.rawDegree === 0);
  if (isolatedNodes.length > 0) {
    const labels = isolatedNodes.map((n) => n.label);
    const isOne = isolatedNodes.length === 1;
    insights.push({
      id: 5,
      type: 'isolation',
      title: `${labels.join(', ')} ${isOne ? 'sits' : 'sit'} alone — present but disconnected`,
      description: `${labels.join(', ')} ${isOne ? 'appears' : 'appear'} in ${
        isolatedNodes.reduce((s, n) => s + n.occurrences, 0)
      } moment${isolatedNodes.reduce((s, n) => s + n.occurrences, 0) === 1 ? '' : 's'} this session but ${isOne ? 'does' : 'do'} not co-occur with any other dimension. Two clinical readings worth holding: (a) the client may be processing this dimension separately from the rest of their experience — a form of compartmentalization that can be defensive; (b) the dimension is genuinely independent of the current presenting pattern and may not be the right entry point for intervention. Worth probing in the next session: when ${labels.join('/')} comes up, what else is happening?`,
    });
  }

  // ─── Notable absences ─────────────────────────────────────────────
  // A dimension with zero occurrences is not necessarily missing in the client's
  // life — but it IS missing from THIS session's coded experience. For some
  // dimensions (especially Normative — values/morals/cultural framing) the
  // absence itself is clinically meaningful. We surface this conservatively:
  // only flag absences when 6+ other dimensions ARE active (otherwise the
  // absence may just reflect a sparse session).
  const activeCount = nodes.filter((n) => n.occurrences > 0).length;
  const absentNodes = nodes.filter((n) => n.occurrences === 0);
  if (absentNodes.length > 0 && activeCount >= 6) {
    // Highlight conceptually noteworthy absences (Normative, Ecological, Reflective)
    // — these often indicate something specific clinically when missing while the
    // rest of experience is highly active.
    const noteworthyAbsent = absentNodes.filter((n) =>
      n.id === StructureName.NORMATIVE ||
      n.id === StructureName.ECOLOGICAL ||
      n.id === StructureName.REFLECTIVE,
    );
    if (noteworthyAbsent.length > 0) {
      const labels = noteworthyAbsent.map((n) => n.label);
      insights.push({
        id: 6,
        type: 'absence',
        title: `${labels.join(', ')} ${labels.length === 1 ? 'is' : 'are'} absent from this session's pattern`,
        description: `${activeCount} of 10 dimensions are active in this session, but ${labels.join(' and ')} ${labels.length === 1 ? 'did not surface at all' : 'did not surface'}. This is a notable structural gap rather than a sparse session. Specifically: absent ${labels[0] === 'Normative' ? 'values/moral framing can indicate that the client is processing the experience without an evaluative frame — neither right nor wrong, just happening to them' : labels[0] === 'Ecological' ? 'environmental context may indicate the experience is being held as purely internal, with the surrounding world bracketed out' : 'reflective capacity may indicate the client is inside the experience without yet being able to step back from it'}. Worth checking in the next session whether this dimension surfaces when explicitly invited.`,
      });
    }
  }

  return insights;
}
