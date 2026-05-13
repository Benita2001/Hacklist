'use client';

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'search' | 'email' | 'text';
  showIcon?: boolean;
  className?: string;
}

export function Input({
  value,
  onChange,
  placeholder = 'Search hackathons…',
  type = 'search',
  showIcon = true,
  className = '',
}: InputProps) {
  const hasIcon = showIcon && type === 'search';

  return (
    <div
      className={[
        'relative flex items-center w-full',
        'h-[var(--input-height)]',
        'bg-[var(--input-bg)]',
        'border border-[var(--input-border)]',
        'rounded-[var(--input-radius)]',
        'transition-[border-color]',
        'duration-[var(--duration-base)]',
        '[transition-timing-function:var(--ease-default)]',
        'focus-within:border-[var(--input-border-focus)]',
        className,
      ].join(' ')}
    >
      {hasIcon && (
        <span
          className="absolute left-[var(--input-px)] flex items-center pointer-events-none"
          aria-hidden="true"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="7"
              cy="7"
              r="4.5"
              stroke="var(--color-text-secondary)"
              strokeWidth="1.25"
            />
            <line
              x1="10.5"
              y1="10.5"
              x2="13.5"
              y2="13.5"
              stroke="var(--color-text-secondary)"
              strokeWidth="1.25"
              strokeLinecap="round"
            />
          </svg>
        </span>
      )}

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={[
          'w-full h-full',
          hasIcon
            ? 'pl-[calc(var(--input-px)+var(--space-6))]'
            : 'pl-[var(--input-px)]',
          'pr-[var(--input-px)]',
          'bg-transparent',
          'text-[color:var(--input-text)]',
          'text-[length:var(--input-font-size)]',
          'placeholder:text-[color:var(--input-placeholder)]',
          'outline-none border-none',
          '[appearance:textfield]',
          type === 'search' ? '[&::-webkit-search-cancel-button]:hidden' : '',
        ].filter(Boolean).join(' ')}
      />
    </div>
  );
}
