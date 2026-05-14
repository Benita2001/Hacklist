import { ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

export function PageShell({ children, className = '' }: PageShellProps) {
  return (
    <main
      className={className || undefined}
      style={{
        width: '100%',
        maxWidth: '1200px',
        marginLeft: 'auto',
        marginRight: 'auto',
        paddingLeft: 'clamp(24px, 4vw, 48px)',
        paddingRight: 'clamp(24px, 4vw, 48px)',
      }}
    >
      {children}
    </main>
  );
}
