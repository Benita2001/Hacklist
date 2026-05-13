import { ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

export function PageShell({ children, className = '' }: PageShellProps) {
  return (
    <main
      className={[
        'w-full mx-auto',
        'max-w-[var(--max-width-site)]',
        'px-[var(--space-6)] md:px-[var(--space-8)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </main>
  );
}
