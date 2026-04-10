'use client';

import { StructureName } from '@/types';
import { getStructure } from '@/lib/structures';

interface StructureBadgeProps {
  name: StructureName;
  className?: string;
}

export function StructureBadge({ name, className = '' }: StructureBadgeProps) {
  const structure = getStructure(name);
  const bgColor = structure.color;

  return (
    <span
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium text-white whitespace-nowrap transition-opacity hover:opacity-90 ${className}`}
      style={{ backgroundColor: bgColor }}
      title={structure.label}
    >
      {structure.label}
    </span>
  );
}
