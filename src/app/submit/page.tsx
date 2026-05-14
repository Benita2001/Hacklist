import Link from 'next/link';
import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'List My Opportunity',
  description: 'List your hackathon on HackList and get in front of thousands of active builders.',
};

const whatWeNeed = [
  'Hackathon name and organizer',
  'Prize pool total and breakdown',
  'Start date and submission deadline',
  'Direct apply URL',
  'Category (AI / Web3 / Both)',
  'One-sentence description',
];

const whatHappensNext = [
  { step: '01', text: 'Submit the form below' },
  { step: '02', text: 'We review within 48 hours' },
  { step: '03', text: 'Your hackathon goes live on HackList' },
];

export default function SubmitPage() {
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

        {/* Back link */}
        <Link
          href="/"
          className={[
            'inline-flex items-center gap-[var(--space-1)]',
            'text-[color:var(--color-text-secondary)]',
            'hover:text-[color:var(--color-text-primary)]',
            'transition-colors duration-[var(--duration-base)]',
          ].join(' ')}
          style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-10)', display: 'inline-flex' }}
        >
          ← Back
        </Link>

        {/* Headline */}
        <h1
          className="font-serif"
          style={{
            fontSize: 'clamp(36px, 5vw, 52px)',
            fontWeight: 400,
            color: 'var(--color-text-primary)',
            lineHeight: 'var(--leading-tight)',
            letterSpacing: '-0.02em',
            marginBottom: 'var(--space-4)',
          }}
        >
          List your{' '}
          <em style={{ color: 'var(--color-moss)', fontStyle: 'italic' }}>opportunity.</em>
        </h1>

        <p
          style={{
            fontSize: 'var(--text-md)',
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--leading-relaxed)',
            maxWidth: '560px',
            marginBottom: 'var(--space-12)',
          }}
        >
          Get your hackathon in front of thousands of builders actively looking for their next challenge. Free to list. No account needed.
        </p>

        {/* Two-card grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2"
          style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-12)' }}
        >
          {/* What We Need */}
          <div
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-6)',
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
              What We Need
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {whatWeNeed.map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    style={{ flexShrink: 0, marginTop: '3px', color: 'var(--color-olive)' }}
                    aria-hidden="true"
                  >
                    <path d="M2 7L5.5 10.5L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* What Happens Next */}
          <div
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-6)',
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
              What Happens Next
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {whatHappensNext.map(({ step, text }) => (
                <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
                  <span
                    className="font-serif"
                    style={{
                      fontSize: 'var(--text-lg)',
                      fontWeight: 400,
                      color: 'var(--color-moss)',
                      lineHeight: 1,
                      flexShrink: 0,
                      minWidth: '24px',
                    }}
                  >
                    {step}
                  </span>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)', paddingTop: '1px' }}>
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
          <Button variant="primary" size="lg" href={siteConfig.tallyFormUrl}>
            List My Opportunity →
          </Button>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Free to list. No account needed. Reviewed within 48 hours.
          </p>
        </div>

      </div>
    </PageShell>
  );
}
