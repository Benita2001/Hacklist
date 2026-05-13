export function VerifiedBadge() {
  return (
    <span
      className={[
        'inline-flex items-center gap-[var(--space-1)]',
        'text-[length:var(--text-xs)]',
        'text-[color:var(--color-success)]',
        'font-medium',
      ].join(' ')}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="6" cy="6" r="5.5" stroke="var(--color-success)" strokeWidth="1" />
        <path
          d="M3.5 6L5.5 8L8.5 4"
          stroke="var(--color-success)"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>Verified</span>
    </span>
  );
}
