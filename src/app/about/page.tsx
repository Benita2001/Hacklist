import Link from 'next/link';
import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/PageShell';

export const metadata: Metadata = {
  title: 'About',
  description: 'HackList is a prize-first, deadline-sorted hackathon discovery aggregator built for builders.',
};

const values = [
  {
    label: 'Updated Daily',
    description: 'New hackathons added every day.',
  },
  {
    label: 'AI + Web3',
    description: 'Curated focus on the two fastest-moving categories in tech.',
  },
  {
    label: 'Prize-First',
    description: 'Deadline sorted so the most urgent opportunities always surface first.',
  },
] as const;

export default function AboutPage() {
  return (
    <PageShell>
      <div
        style={{
          paddingTop: 'var(--space-16)',
          paddingBottom: 'var(--space-24)',
          maxWidth: 'var(--max-width-prose)',
          margin: '0 auto',
        }}
      >

        {/* Headline */}
        <h1
          className="font-serif"
          style={{
            fontSize: 'clamp(36px, 5vw, 52px)',
            fontWeight: 400,
            color: 'var(--color-text-primary)',
            lineHeight: 'var(--leading-tight)',
            letterSpacing: '-0.02em',
            marginBottom: 'var(--space-8)',
          }}
        >
          About HackList
        </h1>

        {/* Body */}
        <p
          style={{
            fontSize: 'var(--text-md)',
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--leading-relaxed)',
            marginBottom: 'var(--space-12)',
          }}
        >
          HackList exists because finding a good hackathon shouldn&apos;t be hard. Other sites
          are built by hackathon organizers and builders are left hunting across five different
          sites, missing deadlines and losing track of prize pools. HackList fixes that. One clean
          list, every active AI and Web3 hackathon, sorted by deadline. Every Apply button takes
          you directly to the original listing.
        </p>

        {/* Value boxes */}
        <div
          className="grid grid-cols-1 sm:grid-cols-3"
          style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-12)' }}
        >
          {values.map(({ label, description }) => (
            <div
              key={label}
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-5)',
              }}
            >
              <p
                className="font-serif"
                style={{
                  fontSize: 'var(--text-xl)',
                  fontWeight: 400,
                  color: 'var(--color-moss)',
                  lineHeight: 1,
                  marginBottom: 'var(--space-2)',
                }}
              >
                {label}
              </p>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 'var(--leading-relaxed)',
                }}
              >
                {description}
              </p>
            </div>
          ))}
        </div>

        {/* Back link */}
        <Link
          href="/"
          className={[
            'inline-flex items-center gap-[var(--space-1)]',
            'text-[color:var(--color-text-secondary)]',
            'hover:text-[color:var(--color-text-primary)]',
            'transition-colors duration-[var(--duration-base)]',
          ].join(' ')}
          style={{ fontSize: 'var(--text-sm)' }}
        >
          ← Back to hackathons
        </Link>

      </div>
    </PageShell>
  );
}
