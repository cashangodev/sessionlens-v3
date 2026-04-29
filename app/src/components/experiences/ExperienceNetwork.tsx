'use client';

import { useState, useMemo } from 'react';
import type { NetworkData, NetworkNode, NetworkEdge } from '@/lib/analysis/network-analysis';

interface ExperienceNetworkProps {
  data: NetworkData;
}

// Layout constants
const SVG_SIZE = 520;
const CENTER = SVG_SIZE / 2;
const RADIUS = 180;
const MIN_NODE_RADIUS = 14;
const MAX_NODE_RADIUS = 28;

// Cluster color palette — deep, clinical, distinguishable
const CLUSTER_COLORS = [
  { fill: '#2D7D7D', light: '#D4EAEA', label: 'Cluster A' }, // primary teal
  { fill: '#E07B6A', light: '#FADBD4', label: 'Cluster B' }, // coral
  { fill: '#6B9E7D', light: '#D4E4D8', label: 'Cluster C' }, // sage
  { fill: '#8B7EC7', light: '#E0DBEE', label: 'Cluster D' }, // lavender
  { fill: '#D4A84B', light: '#F2E4BF', label: 'Cluster E' }, // amber
  { fill: '#64748B', light: '#E2E8F0', label: 'Cluster F' }, // slate
];

function getClusterColor(cluster: number) {
  return CLUSTER_COLORS[cluster % CLUSTER_COLORS.length];
}

/**
 * Compute deterministic circular positions for the 10 dimensions.
 * Nodes from the same cluster are placed adjacent for visual coherence.
 */
function computeNodePositions(nodes: NetworkNode[]): Record<string, { x: number; y: number }> {
  // Group nodes by cluster, preserve cluster order by size
  const byCluster: Record<number, NetworkNode[]> = {};
  for (const n of nodes) {
    if (!byCluster[n.cluster]) byCluster[n.cluster] = [];
    byCluster[n.cluster].push(n);
  }

  const sortedClusters = Object.keys(byCluster)
    .map(Number)
    .sort((a, b) => byCluster[b].length - byCluster[a].length);

  // Flatten: largest cluster first, then next, etc.
  const ordered: NetworkNode[] = [];
  for (const c of sortedClusters) {
    for (const n of byCluster[c]) ordered.push(n);
  }

  const positions: Record<string, { x: number; y: number }> = {};
  const n = ordered.length;
  const angleOffset = -Math.PI / 2; // start at top

  for (let i = 0; i < n; i++) {
    const angle = angleOffset + (i * 2 * Math.PI) / n;
    positions[ordered[i].id] = {
      x: CENTER + RADIUS * Math.cos(angle),
      y: CENTER + RADIUS * Math.sin(angle),
    };
  }

  return positions;
}

function nodeRadius(node: NetworkNode): number {
  return MIN_NODE_RADIUS + (MAX_NODE_RADIUS - MIN_NODE_RADIUS) * node.centrality;
}

function edgeStrokeWidth(edge: NetworkEdge): number {
  return 1 + 5 * edge.normalizedWeight;
}

export function ExperienceNetwork({ data }: ExperienceNetworkProps) {
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null);

  const positions = useMemo(() => computeNodePositions(data.nodes), [data.nodes]);

  const hasData = data.edges.length > 0;

  // Which clusters actually appear (excluding singletons to reduce legend noise)
  const usedClusters = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const n of data.nodes) {
      if (n.rawDegree > 0) counts[n.cluster] = (counts[n.cluster] || 0) + 1;
    }
    return Object.keys(counts).map(Number);
  }, [data.nodes]);

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="w-full h-auto max-w-[520px] mx-auto block"
        role="img"
        aria-label="Experience map network graph"
      >
        {/* Background concentric rings for aesthetic depth */}
        <circle cx={CENTER} cy={CENTER} r={RADIUS + 40} fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 4" opacity="0.6" />
        <circle cx={CENTER} cy={CENTER} r={RADIUS - 40} fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 4" opacity="0.4" />

        {/* Center label */}
        <text
          x={CENTER}
          y={CENTER - 5}
          textAnchor="middle"
          className="text-[10px] fill-gray-400 font-medium uppercase tracking-wider"
        >
          Lived
        </text>
        <text
          x={CENTER}
          y={CENTER + 10}
          textAnchor="middle"
          className="text-[10px] fill-gray-400 font-medium uppercase tracking-wider"
        >
          Experience
        </text>

        {/* Edges */}
        <g>
          {data.edges.map((edge, i) => {
            const s = positions[edge.source];
            const t = positions[edge.target];
            if (!s || !t) return null;
            const isHovered = hoveredNode && (hoveredNode.id === edge.source || hoveredNode.id === edge.target);
            return (
              <line
                key={`edge-${i}`}
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                stroke={isHovered ? '#2D7D7D' : '#94A3B8'}
                strokeWidth={edgeStrokeWidth(edge)}
                strokeOpacity={isHovered ? 0.85 : 0.35}
                strokeLinecap="round"
                style={{ transition: 'stroke 0.2s, stroke-opacity 0.2s' }}
              />
            );
          })}
        </g>

        {/* Nodes */}
        <g>
          {data.nodes.map((node) => {
            const pos = positions[node.id];
            if (!pos) return null;
            const r = nodeRadius(node);
            const color = getClusterColor(node.cluster);
            const isHovered = hoveredNode?.id === node.id;
            const isNeighbor = hoveredNode
              ? data.edges.some(
                  (e) =>
                    (e.source === hoveredNode.id && e.target === node.id) ||
                    (e.target === hoveredNode.id && e.source === node.id),
                )
              : false;
            const dim = hoveredNode && !isHovered && !isNeighbor;

            // Label position: outside the node, radially outward
            const dx = pos.x - CENTER;
            const dy = pos.y - CENTER;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const labelOffset = r + 14;
            const labelX = pos.x + (dx / dist) * labelOffset;
            const labelY = pos.y + (dy / dist) * labelOffset;
            const textAnchor = dx > 10 ? 'start' : dx < -10 ? 'end' : 'middle';

            return (
              <g
                key={node.id}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                opacity={dim ? 0.35 : 1}
              >
                {/* Bridge indicator ring */}
                {node.isBridge && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={r + 4}
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="1.5"
                    strokeDasharray="2 3"
                  />
                )}
                {/* Isolation indicator — node is present but has zero connections.
                    Rose-coloured dashed ring distinguishes it from bridges (amber).
                    Mirrors the "isolation" insight surfaced in the Pattern Insights panel. */}
                {!node.isBridge && node.occurrences > 0 && node.rawDegree === 0 && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={r + 5}
                    fill="none"
                    stroke="#F43F5E"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                )}
                {/* Node circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={r}
                  fill={color.fill}
                  stroke="white"
                  strokeWidth="3"
                  style={{ transition: 'r 0.2s' }}
                />
                {/* Occurrence count inside node (if fits) */}
                {r >= 18 && (
                  <text
                    x={pos.x}
                    y={pos.y + 4}
                    textAnchor="middle"
                    className="text-xs fill-white font-bold pointer-events-none"
                  >
                    {node.occurrences}
                  </text>
                )}
                {/* Label */}
                <text
                  x={labelX}
                  y={labelY + 4}
                  textAnchor={textAnchor}
                  className="text-[11px] fill-gray-700 font-semibold pointer-events-none"
                  style={{ paintOrder: 'stroke', stroke: 'white', strokeWidth: 3, strokeLinejoin: 'round' }}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Hover tooltip */}
      {hoveredNode && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-xl px-4 py-3 min-w-[260px] max-w-[360px] text-left pointer-events-none">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ background: getClusterColor(hoveredNode.cluster).fill }}
            />
            <p className="text-sm font-bold text-gray-900">{hoveredNode.label}</p>
            {hoveredNode.isBridge && (
              <span className="text-[9px] font-bold uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Bridge</span>
            )}
            {!hoveredNode.isBridge && hoveredNode.occurrences > 0 && hoveredNode.rawDegree === 0 && (
              <span className="text-[9px] font-bold uppercase bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full">Isolated</span>
            )}
            {hoveredNode.occurrences === 0 && (
              <span className="text-[9px] font-bold uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">Absent</span>
            )}
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            {hoveredNode.occurrences === 0 ? (
              <>Did not surface in this session&apos;s coded moments. Absent dimensions can be a notable structural gap when the rest of experience is highly active.</>
            ) : (
              <>
                Present in <span className="font-semibold text-gray-900">{hoveredNode.occurrences}</span> moment{hoveredNode.occurrences !== 1 ? 's' : ''} &middot; connected to{' '}
                <span className="font-semibold text-gray-900">{hoveredNode.rawDegree}</span> of 9 other dimensions
              </>
            )}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!hasData && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 rounded-xl px-4 py-3 border border-gray-200 text-center">
            <p className="text-sm text-gray-500">Not enough coded moments to build a network yet.</p>
          </div>
        </div>
      )}

      {/* Legend — only show indicators that actually exist on this network so we don't
          promise visual elements that aren't on screen */}
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 items-center justify-center text-xs">
        {usedClusters.map((c) => {
          const color = getClusterColor(c);
          return (
            <div key={c} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ background: color.fill }} />
              <span className="text-gray-600">{color.label}</span>
            </div>
          );
        })}
        {data.nodes.some((n) => n.isBridge) && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border-2 border-amber-500 border-dashed" />
            <span className="text-gray-600">Bridge dimension</span>
          </div>
        )}
        {data.nodes.some((n) => n.occurrences > 0 && n.rawDegree === 0) && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border-2 border-rose-500 border-dashed" />
            <span className="text-gray-600">Isolated (present but disconnected)</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400">Node size = centrality</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400">Edge thickness = co-occurrence</span>
        </div>
      </div>
    </div>
  );
}
