interface TagProps {
  label: string;
  variant: 'ai' | 'web3' | 'both' | 'format';
}

const variantStyles: Record<TagProps['variant'], React.CSSProperties> = {
  ai: {
    backgroundColor: 'var(--color-tag-ai-bg)',
    color:           'var(--color-tag-ai-text)',
    border:          '1px solid var(--color-tag-ai-border)',
    fontWeight:      600,
  },
  web3: {
    backgroundColor: 'var(--color-tag-web3-bg)',
    color:           'var(--color-tag-web3-text)',
    border:          '1px solid var(--color-tag-web3-border)',
    fontWeight:      600,
  },
  both: {
    backgroundColor: 'var(--color-tag-both-bg)',
    color:           'var(--color-tag-both-text)',
    border:          '1px solid var(--color-tag-both-border)',
    fontWeight:      600,
  },
  format: {
    backgroundColor: 'var(--color-tag-format-bg)',
    color:           'var(--color-tag-format-text)',
    border:          '1px solid var(--color-tag-format-border)',
    fontWeight:      400,
  },
};

export function Tag({ label, variant }: TagProps) {
  return (
    <span
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        padding:       '3px 10px',
        borderRadius:  '50px',
        fontSize:      '11px',
        letterSpacing: '0.3px',
        lineHeight:    1.4,
        whiteSpace:    'nowrap',
        ...variantStyles[variant],
      }}
    >
      {label}
    </span>
  );
}
