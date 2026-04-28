'use client';

import React from 'react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

export interface StructureBarDatum {
  name: string;
  score: number; // 0..1
  color: string;
}

interface StructureBarProps {
  data: StructureBarDatum[];
  /**
   * Optional render function to wrap each row's label in (e.g. a LineagePopover trigger).
   * Receives the datum and the default label node, returns a node.
   */
  renderLabel?: (d: StructureBarDatum, defaultLabel: React.ReactNode) => React.ReactNode;
}

// Friendlier display labels for structures whose enum names are awkward
const DISPLAY_NAME: Record<string, string> = {
  immediate_experience: 'Immediate exp.',
};

function displayName(rawName: string): string {
  const key = rawName.toLowerCase();
  if (DISPLAY_NAME[key]) return DISPLAY_NAME[key];
  return rawName.replace(/_/g, ' ');
}

/**
 * Compact horizontal bar visualization for the dominant phenomenological-structure
 * profile. Renders without recharts (a pure CSS bar) for two reasons:
 * 1. Each bar is only ~24px tall and we want exact pixel control.
 * 2. We need each row's label to remain a real DOM element so a LineagePopover
 *    trigger can wrap it (Recharts re-renders ticks via SVG which makes
 *    arbitrary React-children-as-popover-trigger awkward).
 *
 * Visual style mirrors the existing teal-tinted bars elsewhere in the app
 * (e.g. CBT distortion confidence, therapist-move distribution).
 */
export function StructureBar({ data, renderLabel }: StructureBarProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Column header — hosts a single InfoTooltip explaining the % calculation */}
      <div className="flex items-center gap-3 pb-1 border-b border-gray-100">
        <div className="w-36 flex-shrink-0">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Pattern</span>
        </div>
        <div className="flex-1" />
        <div className="w-16 flex items-center justify-end gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Weight</span>
          <InfoTooltip
            title="How aggregate weight is calculated"
            description="Each percentage is the share of the session's total emotional intensity that was tagged to this experience pattern. Patterns appearing in high-intensity moments score higher than those appearing in mild ones."
            methodology="weight(structure) = Σ(intensity of moments tagged with structure) / Σ(intensity of all moments). Normalized to 0–100%. Multiple patterns can share weight when a single moment is coded across several dimensions."
          />
        </div>
      </div>

      {data.map((d) => {
        const pct = Math.round(Math.max(0, Math.min(1, d.score)) * 100);
        const defaultLabel = (
          <span className="text-xs font-medium text-gray-700 capitalize whitespace-nowrap">
            {displayName(d.name)}
          </span>
        );
        const labelNode = renderLabel ? renderLabel(d, defaultLabel) : defaultLabel;
        return (
          <div key={d.name} className="flex items-center gap-3" style={{ minHeight: 24 }}>
            <div className="w-36 flex-shrink-0">{labelNode}</div>
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(pct, 2)}%`,
                  backgroundColor: d.color,
                }}
              />
            </div>
            <span
              className="text-xs font-mono text-gray-600 w-16 text-right tabular-nums cursor-help"
              title={`${pct}% of this session's emotional intensity was tagged with ${displayName(d.name).toLowerCase()}.`}
            >
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default StructureBar;
