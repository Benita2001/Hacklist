import Link from 'next/link';
import { PageShell } from '@/components/layout/PageShell';

export default function HackathonNotFound() {
  return (
    <PageShell>
      <div className="flex flex-col items-center justify-center py-[var(--space-24)] gap-[var(--space-4)] text-center">
        <p
          className={[
            'text-[length:var(--text-base)]',
            'text-[color:var(--color-text-secondary)]',
          ].join(' ')}
        >
          Hackathon not found.
        </p>
        <Link
          href="/"
          className={[
            'text-[length:var(--text-sm)]',
            'text-[color:var(--color-accent)]',
            'hover:underline',
          ].join(' ')}
        >
          ← Back to all hackathons
        </Link>
      </div>
    </PageShell>
  );
}
