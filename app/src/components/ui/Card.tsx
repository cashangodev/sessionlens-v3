'use client';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'highlighted' | 'warning';
  onClick?: () => void;
}

export function Card({
  children,
  className = '',
  variant = 'default',
  onClick,
}: CardProps) {
  const baseStyles = 'bg-white rounded-xl border shadow-sm transition-all duration-200 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2';

  const variantStyles = {
    default: 'border-gray-200 hover:border-gray-300 focus-within:ring-primary',
    highlighted: 'border-primary hover:border-primary/60 focus-within:ring-primary',
    warning: 'border-secondary hover:border-secondary/60 focus-within:ring-secondary',
  };

  const cursorStyle = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${cursorStyle} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {children}
    </div>
  );
}
