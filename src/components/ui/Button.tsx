'use client';

import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  className?: string;
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: [
    'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]',
    'border border-transparent',
    'hover:bg-[var(--btn-primary-bg-hover)]',
  ].join(' '),
  ghost: [
    'bg-transparent text-[var(--btn-ghost-text)]',
    'border border-[var(--btn-ghost-border)]',
    'hover:bg-[var(--btn-ghost-bg-hover)] hover:border-[var(--color-border-strong)]',
  ].join(' '),
  danger: [
    'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]',
    'border border-[var(--color-danger-border)]',
    'hover:border-[var(--color-danger)]',
  ].join(' '),
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-[var(--btn-height-sm)] px-[var(--btn-px-sm)] text-[length:var(--badge-font-size)]',
  md: 'h-[var(--btn-height-md)] px-[var(--btn-px)] text-[length:var(--btn-font-size)]',
  lg: 'h-[var(--btn-height-lg)] px-[var(--btn-px-lg)] text-[length:var(--input-font-size)]',
};

const baseClasses = [
  'inline-flex items-center justify-center gap-[var(--space-2)]',
  'rounded-[var(--btn-radius)]',
  'font-medium',
  'whitespace-nowrap select-none',
  'transition-[border-color,background-color]',
  'duration-[var(--duration-base)]',
  '[transition-timing-function:var(--ease-default)]',
].join(' ');

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  href,
  disabled = false,
  className = '',
}: ButtonProps) {
  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        aria-disabled={disabled}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  );
}
