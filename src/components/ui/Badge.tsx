interface BadgeProps {
  label: string;
  variant: 'success' | 'danger' | 'warning' | 'muted';
}

const variantClasses: Record<BadgeProps['variant'], string> = {
  success: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
  danger:  'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]',
  warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]',
  muted:   'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]',
};

export function Badge({ label, variant }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center',
        'px-[var(--badge-px)] py-[var(--badge-py)]',
        'rounded-[var(--badge-radius)]',
        'text-[length:var(--badge-font-size)]',
        'font-medium',
        'tracking-[var(--badge-tracking)]',
        variantClasses[variant],
      ].join(' ')}
    >
      {label}
    </span>
  );
}
