'use client';

interface BadgeProps {
  label: string;
  color?: string;
  variant?: 'risk-high' | 'risk-medium' | 'risk-low' | 'structure' | 'info';
}

export function Badge({ label, color, variant = 'info' }: BadgeProps) {
  const baseStyles = 'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors';

  const variantStyles = {
    'risk-high': 'bg-red-100 text-red-700 hover:bg-red-200',
    'risk-medium': 'bg-amber-100 text-amber-700 hover:bg-amber-200',
    'risk-low': 'bg-green-100 text-green-700 hover:bg-green-200',
    'info': 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    'structure': color
      ? 'text-white'
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  };

  return (
    <span
      className={`${baseStyles} ${variantStyles[variant]}`}
      style={color && variant === 'structure' ? { backgroundColor: color } : {}}
    >
      {label}
    </span>
  );
}
