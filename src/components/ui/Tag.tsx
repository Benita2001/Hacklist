interface TagProps {
  label: string;
  variant: 'ai' | 'web3' | 'both' | 'format';
}

const variantClasses: Record<TagProps['variant'], string> = {
  ai:     'bg-[var(--color-tag-ai-bg)] text-[var(--color-tag-ai-text)] border-[var(--color-tag-ai-border)]',
  web3:   'bg-[var(--color-tag-web3-bg)] text-[var(--color-tag-web3-text)] border-[var(--color-tag-web3-border)]',
  both:   'bg-[var(--color-tag-both-bg)] text-[var(--color-tag-both-text)] border-[var(--color-tag-both-border)]',
  format: 'bg-[var(--color-tag-format-bg)] text-[var(--color-tag-format-text)] border-[var(--color-tag-format-border)]',
};

export function Tag({ label, variant }: TagProps) {
  return (
    <span
      className={[
        'inline-flex items-center',
        'px-[var(--tag-px)] py-[var(--tag-py)]',
        'rounded-[var(--radius-sm)]',
        'text-[length:var(--tag-font-size)]',
        'font-medium',
        'tracking-[var(--tag-tracking)]',
        'border',
        variantClasses[variant],
      ].join(' ')}
    >
      {label}
    </span>
  );
}
