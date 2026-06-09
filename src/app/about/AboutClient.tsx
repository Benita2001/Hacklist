'use client';

import Link from 'next/link';
import { PageShell } from '@/components/layout/PageShell';

const values = [
  {
    label: 'Updated Daily',
    description: 'New opportunities added every day across all five categories.',
  },
  {
    label: 'Never Miss a Deadline',
    description: 'Everything sorted by deadline so the most urgent opportunities always surface first.',
  },
  {
    label: 'Trusted by 10,000+ Builders',
    description: 'A growing community of AI and Web3 builders who find their next opportunity on HackList.',
  },
] as const;

export function AboutClient() {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--space-8)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hacklist-logo.png" alt="HackList" style={{ height: '32px', width: 'auto', flexShrink: 0 }} />
          <h1
            className="font-serif"
            style={{
              fontSize: 'clamp(36px, 5vw, 52px)',
              fontWeight: 400,
              color: 'var(--color-text-primary)',
              lineHeight: 'var(--leading-tight)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            About HackList
          </h1>
        </div>

        {/* Body */}
        <p
          style={{
            fontSize: 'var(--text-md)',
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--leading-relaxed)',
            marginBottom: 'var(--space-12)',
          }}
        >
          HackList exists because finding good opportunities shouldn&apos;t take hours. Builders
          were hunting across five different sites, missing deadlines, losing track of prize pools
          and scrolling through outdated listings. HackList fixes that. One clean place for every
          AI and Web3 opportunity worth your time&nbsp;: hackathons, bounties, grants, programs and
          jobs sorted by deadline, verified before publishing. Every Apply button takes you directly
          to the original listing.
        </p>

        {/* Value boxes */}
        <div
          className="grid grid-cols-1 md:grid-cols-3"
          style={{ gap: 'var(--space-8)', marginBottom: 'var(--space-12)' }}
        >
          {values.map(({ label, description }) => (
            <div
              key={label}
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                border: '1px solid var(--color-card-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-6)',
                textAlign: 'left',
              }}
            >
              <p
                style={{
                  fontSize: 'var(--text-base)',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.3,
                  marginBottom: 'var(--space-2)',
                }}
              >
                {label}
              </p>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  lineHeight: 'var(--leading-relaxed)',
                }}
              >
                {description}
              </p>
            </div>
          ))}
        </div>

        {/* Community section */}
        <div
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-8)',
            marginBottom: 'var(--space-8)',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              letterSpacing: 'var(--tracking-caps)',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              marginBottom: 'var(--space-4)',
            }}
          >
            Join the community
          </p>
          <a
            href="https://t.me/hacklistwithbeni"
            target="_blank"
            rel="noopener noreferrer"
            className="font-serif"
            style={{
              fontSize: 'var(--text-xl)',
              fontWeight: 400,
              color: 'var(--color-moss)',
              textDecoration: 'none',
              transition: 'opacity var(--duration-base)',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.opacity = '0.75')}
            onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.opacity = '1')}
          >
            Join HackList on Telegram →
          </a>
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
