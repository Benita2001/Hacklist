'use client';

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  placeholder?: string;
  type?: 'search' | 'email' | 'text';
  showIcon?: boolean;
  className?: string;
  autoComplete?: string;
}

export function Input({
  value,
  onChange,
  id,
  name,
  placeholder = 'Search hackathons…',
  type = 'search',
  showIcon = true,
  className = '',
  autoComplete,
}: InputProps) {
  const hasIcon = showIcon && type === 'search';

  return (
    <div
      className={[
        'flex items-center w-full',
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
          className="flex items-center shrink-0 pl-[var(--input-px)] pointer-events-none select-none"
          aria-hidden="true"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="7"
              cy="7"
              r="4.5"
              stroke="var(--color-text-muted)"
              strokeWidth="1.25"
            />
            <line
              x1="10.5"
              y1="10.5"
              x2="13.5"
              y2="13.5"
              stroke="var(--color-text-muted)"
              strokeWidth="1.25"
              strokeLinecap="round"
            />
          </svg>
        </span>
      )}

      <input
        id={id}
        name={name ?? type}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={[
          'flex-1 h-full',
          hasIcon ? 'pl-2' : 'pl-[var(--input-px)]',
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
