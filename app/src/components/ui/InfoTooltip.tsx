'use client';

import { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  title: string;
  description: string;
  methodology?: string;
  className?: string;
}

export function InfoTooltip({ title, description, methodology, className = '' }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<'bottom' | 'top' | 'left'>('bottom');
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceRight = window.innerWidth - rect.right;

      if (spaceBelow < 200 && rect.top > 200) {
        setPosition('top');
      } else if (spaceRight < 320) {
        setPosition('left');
      } else {
        setPosition('bottom');
      }
    }
  }, [isVisible]);

  const positionClasses = {
    bottom: 'top-full left-0 mt-2',
    top: 'bottom-full left-0 mb-2',
    left: 'top-0 right-full mr-2',
  };

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={(e) => {
          e.stopPropagation();
          setIsVisible(!isVisible);
        }}
        className="w-5 h-5 rounded-full bg-gray-100 hover:bg-primary/10 flex items-center justify-center transition-all duration-200 group"
        aria-label={`Info: ${title}`}
      >
        <Info className="w-3 h-3 text-gray-400 group-hover:text-primary transition-colors" />
      </button>

      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 ${positionClasses[position]} w-72 sm:w-80 bg-white rounded-xl border border-gray-200 shadow-lg p-4 animate-in fade-in duration-150`}
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
        >
          {/* Arrow */}
          <div className="absolute -top-1.5 left-4 w-3 h-3 bg-white border-l border-t border-gray-200 rotate-45"
               style={{ display: position === 'bottom' ? 'block' : 'none' }} />

          <div className="flex items-start gap-2.5 mb-2">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Info className="w-3 h-3 text-primary" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 leading-tight">{title}</h4>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed ml-7 mb-2">{description}</p>

          {methodology && (
            <div className="ml-7 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Methodology</p>
              <p className="text-xs text-gray-600 leading-relaxed">{methodology}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
