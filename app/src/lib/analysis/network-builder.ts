/**
 * Co-Occurrence Network Builder
 * Builds a 10x10 co-occurrence matrix from therapeutic moments and derives
 * network properties: centrality, bridges, and community structure.
 *
 * Based on: Tran et al. (2018), van Borkulo et al. (2014), Epskamp et al. (2018)
 *
 * Note: This is a simplified client-computable version. The full Ising model
 * with LASSO regularisation described in the pipeline document requires R/Python
 * statistical computing and a larger corpus. This implementation uses frequency-based
 * co-occurrence with threshold filtering as an approximation.
 */

import { StructureName, Moment, CoOccurrenceNetwork, CoOccurrenceEdge, NetworkNode } from '@/types';

const ALL_STRUCTURES = Object.values(StructureName);

/**
 * Build a co-occurrence matrix from moments.
 * Each cell [i][j] counts how many moments have both structure i and structure j present.
 */
function buildCoOccurrenceMatrix(moments: Moment[]): number[][] {
  const n = ALL_STRUCTURES.length;
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (const moment of moments) {
    const present = moment.structures.map(s => ALL_STRUCTURES.indexOf(s)).filter(i => i >= 0);
    for (let a = 0; a < present.length; a++) {
      for (let b = a + 1; b < present.length; b++) {
        matrix[present[a]][present[b]] += 1;
        matrix[present[b]][present[a]] += 1;
      }
    }
  }

  return matrix;
}

/**
 * Normalize matrix to [0, 1] range.
 */
function normalizeMatrix(matrix: number[][]): number[][] {
  const max = Math.max(...matrix.flat(), 1);
  return matrix.map(row => row.map(val => val / max));
}

/**
 * Compute node-level centrality (strength centrality = sum of edge weights).
 */
function computeCentrality(normalizedMatrix: number[][]): number[] {
  return normalizedMatrix.map(row => {
    const total = row.reduce((sum, val) => sum + val, 0);
    return total;
  });
}

/**
 * Detect communities using simple modularity-based grouping.
 * Simplified version of spin glass community detection.
 */
function detectCommunities(normalizedMatrix: number[][], threshold: number = 0.3): { id: number; members: number[] }[] {
  const n = normalizedMatrix.length;
  const visited = new Set<number>();
  const communities: { id: number; members: number[] }[] = [];
  let communityId = 0;

  for (let i = 0; i < n; i++) {
    if (visited.has(i)) continue;

    // BFS from this node, following edges above threshold
    const queue = [i];
    const community: number[] = [];

    while (queue.length > 0) {
      const node = queue.shift()!;
      if (visited.has(node)) continue;
      visited.add(node);
      community.push(node);

      for (let j = 0; j < n; j++) {
        if (!visited.has(j) && normalizedMatrix[node][j] >= threshold) {
          queue.push(j);
        }
      }
    }

    if (community.length > 0) {
      communities.push({ id: communityId++, members: community });
    }
  }

  return communities;
}

/**
 * Detect bridge nodes: nodes that connect otherwise separate communities.
 */
function detectBridges(normalizedMatrix: number[][], communities: { id: number; members: number[] }[]): Set<number> {
  const bridges = new Set<number>();

  if (communities.length < 2) return bridges;

  for (let i = 0; i < normalizedMatrix.length; i++) {
    const myCommunity = communities.find(c => c.members.includes(i));
    if (!myCommunity) continue;

    const connectsTo = new Set<number>();
    for (let j = 0; j < normalizedMatrix.length; j++) {
      if (normalizedMatrix[i][j] > 0.1) {
        const otherCommunity = communities.find(c => c.members.includes(j));
        if (otherCommunity && otherCommunity.id !== myCommunity.id) {
          connectsTo.add(otherCommunity.id);
        }
      }
    }

    if (connectsTo.size > 0) bridges.add(i);
  }

  return bridges;
}

// Community labels based on which structures cluster together
const COMMUNITY_DESCRIPTIONS: Record<string, string> = {
  'body,emotion,immediate_experience': 'Embodied distress cluster — physical sensations, raw feelings, and immediate experience co-occur',
  'cognitive,reflective': 'Metacognitive cluster — thinking about thinking, insight formation',
  'narrative,normative': 'Identity-values cluster — life story connected to moral/cultural frameworks',
  'social,ecological': 'Contextual cluster — relationships and environment co-shape experience',
  'behaviour': 'Action patterns — behavioral responses to distress',
};

function labelCommunity(members: StructureName[]): string {
  const key = members.sort().join(',');
  if (COMMUNITY_DESCRIPTIONS[key]) return COMMUNITY_DESCRIPTIONS[key];

  // Fallback: describe based on member count
  if (members.length === 1) return `Isolated dimension: ${members[0]}`;
  return `Cluster of ${members.join(', ')} — these dimensions frequently co-occur in this session`;
}

export function buildCoOccurrenceNetwork(moments: Moment[]): CoOccurrenceNetwork {
  const rawMatrix = buildCoOccurrenceMatrix(moments);
  const normalizedMatrix = normalizeMatrix(rawMatrix);
  const centrality = computeCentrality(normalizedMatrix);
  const maxCentrality = Math.max(...centrality, 1);
  const normalizedCentrality = centrality.map(c => c / maxCentrality);

  // Build edges (only above threshold)
  const edges: CoOccurrenceEdge[] = [];
  for (let i = 0; i < ALL_STRUCTURES.length; i++) {
    for (let j = i + 1; j < ALL_STRUCTURES.length; j++) {
      if (normalizedMatrix[i][j] > 0.05) {
        edges.push({
          source: ALL_STRUCTURES[i],
          target: ALL_STRUCTURES[j],
          weight: Math.round(normalizedMatrix[i][j] * 100) / 100,
          momentCount: rawMatrix[i][j],
        });
      }
    }
  }

  // Detect communities
  const rawCommunities = detectCommunities(normalizedMatrix, 0.25);
  const bridges = detectBridges(normalizedMatrix, rawCommunities);

  // Frequency: how many moments each structure appears in
  const freq: number[] = Array(ALL_STRUCTURES.length).fill(0);
  for (const m of moments) {
    for (const s of m.structures) {
      const idx = ALL_STRUCTURES.indexOf(s);
      if (idx >= 0) freq[idx]++;
    }
  }

  // Build nodes
  const nodes: NetworkNode[] = ALL_STRUCTURES.map((s, i) => ({
    structure: s,
    centrality: Math.round(normalizedCentrality[i] * 100) / 100,
    frequency: freq[i],
    isBridge: bridges.has(i),
  }));

  // Communities with labels
  const communities = rawCommunities.map(c => {
    const members = c.members.map(i => ALL_STRUCTURES[i]);
    return {
      id: c.id,
      label: `Cluster ${c.id + 1}`,
      members,
      description: labelCommunity(members),
    };
  });

  // Most central and bridge
  const mostCentralIdx = normalizedCentrality.indexOf(Math.max(...normalizedCentrality));
  const bridgeNodes = nodes.filter(n => n.isBridge);

  return {
    nodes,
    edges: edges.sort((a, b) => b.weight - a.weight),
    communities,
    mostCentral: ALL_STRUCTURES[mostCentralIdx],
    bridgeDimension: bridgeNodes.length > 0 ? bridgeNodes[0].structure : null,
  };
}
