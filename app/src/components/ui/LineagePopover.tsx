'use client';

import { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

export interface LineageSnippet {
  text: string;
  momentId?: string | number;
  timestamp?: string;
  speaker?: 'client' | 'therapist';
  /** Optional label that appears above this specific snippet
   * (e.g. "Evidence", "Surrounding moment", "Trigger"). When omitted,
   * the snippet renders without a per-quote header. */
  label?: string;
}

interface LineagePopoverProps {
  snippets: LineageSnippet[];
  methodology?: string;
  literatureRef?: string;
  children: React.ReactNode;
  className?: string;
  /**
   * Layout mode of the trigger wrapper.
   * - 'inline' (default) — renders an inline-flex span with a separate info icon
   *   next to the children. Used when the lineage is attached to a label or piece of text.
   * - 'block' — renders a full-width block. The children become the entire trigger
   *   (no separate info icon is added). Use when the lineage is attached to a
   *   block element like a heatmap cell, a table row, or a card.
   */
  mode?: 'inline' | 'block';
}

/**
 * Format an arbitrary timestamp string as [mm:ss] when possible.
 * Accepts inputs like "00:01:30", "1:30", "90", "90s" and returns "[01:30]".
 */
function formatTimestamp(ts?: string): string {
  if (!ts) return '';
  const trimmed = ts.trim();
  // Already bracketed
  if (/^\[\d+:\d+\]$/.test(trimmed)) return trimmed;
  const colonParts = trimmed.split(':').map((s) => s.trim()).filter(Boolean);
  if (colonParts.length >= 2) {
    // Take last two segments as mm:ss
    const mm = colonParts[colonParts.length - 2].padStart(2, '0');
    const ss = colonParts[colonParts.length - 1].padStart(2, '0');
    return `[${mm}:${ss}]`;
  }
  const numMatch = trimmed.match(/^(\d+)/);
  if (numMatch) {
    const total = parseInt(numMatch[1], 10);
    const mm = Math.floor(total / 60).toString().padStart(2, '0');
    const ss = (total % 60).toString().padStart(2, '0');
    return `[${mm}:${ss}]`;
  }
  return `[${trimmed}]`;
}

export function LineagePopover({
  snippets,
  methodology,
  literatureRef,
  children,
  className = '',
  mode = 'inline',
}: LineagePopoverProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<'bottom' | 'top' | 'left' | 'right'>('bottom');
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Container is a span in inline mode and a div in block mode (so block-level
  // children — heatmap cells, cards, table rows — can fill the parent's width
  // without being collapsed by an inline-flex layout).
  const containerRef = useRef<HTMLElement>(null);

  const validSnippets = (snippets || []).filter((s) => s && typeof s.text === 'string' && s.text.trim().length > 0);
  const hasSnippets = validSnippets.length > 0;
  const hasAnyContent = hasSnippets || !!methodology || !!literatureRef;

  // Position adapts to viewport edges
  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const spaceRight = window.innerWidth - rect.right;
      const POPOVER_HEIGHT_ESTIMATE = 320;
      const POPOVER_WIDTH_ESTIMATE = 384; // max-w-md = 28rem = 448, but cap a bit lower

      if (spaceBelow >= POPOVER_HEIGHT_ESTIMATE) {
        setPosition('bottom');
      } else if (spaceAbove >= POPOVER_HEIGHT_ESTIMATE) {
        setPosition('top');
      } else if (spaceRight >= POPOVER_WIDTH_ESTIMATE) {
        setPosition('right');
      } else {
        setPosition('left');
      }
    }
  }, [isVisible]);

  // Click-outside-to-close
  useEffect(() => {
    if (!isVisible) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsVisible(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isVisible]);

  // Don't render the icon at all if we have nothing to show
  if (!hasAnyContent) {
    return <>{children}</>;
  }

  const positionClasses: Record<typeof position, string> = {
    bottom: 'top-full left-0 mt-2',
    top: 'bottom-full left-0 mb-2',
    left: 'top-0 right-full mr-2',
    right: 'top-0 left-full ml-2',
  };

  // The inner popover content (header + body) is identical between inline and block
  // modes. Extracted to avoid duplication across the two render branches.
  const renderPopoverBody = () => (
    <>
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
            <Info className="w-3 h-3 text-primary" />
          </div>
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Source lineage</p>
        </div>
      </div>

      <div className="p-4 space-y-4 max-h-[24rem] overflow-y-auto">
        {hasSnippets && (
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {validSnippets.length === 1 ? 'Source quote' : `Source quotes (${validSnippets.length})`}
            </p>
            <div className="space-y-3">
              {validSnippets.map((s, i) => {
                const ts = formatTimestamp(s.timestamp);
                return (
                  <div key={`${s.momentId ?? i}-${i}`}>
                    {s.label && (
                      <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">
                        {s.label}
                      </p>
                    )}
                    <blockquote className="border-l-2 border-primary/30 bg-gray-50 pl-3 pr-2 py-2 rounded-r-md">
                      <p className="text-xs text-gray-700 italic leading-relaxed">
                        {ts && <span className="not-italic font-mono text-[10px] text-gray-500 mr-1">{ts}</span>}
                        &ldquo;{s.text}&rdquo;
                      </p>
                      {s.speaker && (
                        <p className="text-[10px] text-gray-400 mt-1 not-italic">
                          &mdash; {s.speaker === 'therapist' ? 'Therapist' : 'Client'}
                        </p>
                      )}
                    </blockquote>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {methodology && (
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Methodology</p>
            <p className="text-xs text-gray-700 leading-relaxed">{methodology}</p>
          </div>
        )}

        {literatureRef && (
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Literature</p>
            <p className="text-xs text-gray-600 leading-relaxed">{literatureRef}</p>
          </div>
        )}
      </div>
    </>
  );

  // In block mode, the children become the entire trigger (a transparent button
  // wraps them). The container is a div so the children can be block-level.
  if (mode === 'block') {
    return (
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className={`relative block w-full ${className}`}
      >
        <button
          ref={triggerRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsVisible((v) => !v);
          }}
          className="block w-full text-left p-0 m-0 bg-transparent border-0 cursor-pointer"
          aria-label="Show source lineage"
        >
          {children}
        </button>

        {isVisible && (
          <div
            ref={popoverRef}
            onClick={(e) => e.stopPropagation()}
            className={`absolute z-50 ${positionClasses[position]} w-[22rem] max-w-md bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden animate-in fade-in duration-150`}
          >
            {renderPopoverBody()}
          </div>
        )}
      </div>
    );
  }

  return (
    <span ref={containerRef as React.RefObject<HTMLSpanElement>} className={`relative inline-flex items-center gap-1 ${className}`}>
      {children}
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsVisible((v) => !v);
        }}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-gray-400 hover:text-primary transition-colors"
        aria-label="Show source lineage"
      >
        <Info className="w-3 h-3" strokeWidth={2.25} />
      </button>

      {isVisible && (
        <div
          ref={popoverRef}
          onClick={(e) => e.stopPropagation()}
          className={`absolute z-50 ${positionClasses[position]} w-[22rem] max-w-md bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden animate-in fade-in duration-150`}
        >
          {renderPopoverBody()}
        </div>
      )}
    </span>
  );
}
