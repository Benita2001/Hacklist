'use client';

interface ApplyButtonProps {
  href: string;
  label: string;
}

export function ApplyButton({ href, label }: ApplyButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '28rem',
        padding: '12px 24px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--btn-primary-bg)',
        color: 'var(--btn-primary-text)',
        border: '1px solid transparent',
        fontSize: 'var(--text-base)',
        fontWeight: 600,
        textDecoration: 'none',
        transition: 'background-color var(--duration-base) var(--ease-default)',
        letterSpacing: '-0.01em',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--btn-primary-bg-hover)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--btn-primary-bg)';
      }}
    >
      {label}
    </a>
  );
}
