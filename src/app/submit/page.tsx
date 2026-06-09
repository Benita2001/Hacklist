import Link from 'next/link';
import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/PageShell';
import { SubmitForm } from './SubmitForm';

export const metadata: Metadata = {
  title: 'List My Opportunity',
  description: 'List your hackathon, bounty, grant, program or job on HackList and get in front of thousands of active builders.',
};

const whatHappensNext = [
  { step: '01', text: 'Submit the form below' },
  { step: '02', text: 'Reviewed within 12 hours' },
  { step: '03', text: 'Your opportunity goes live on HackList' },
];

export default function SubmitPage() {
  return (
    <PageShell>
      <div
        style={{
          paddingTop:    'var(--space-16)',
          paddingBottom: 'var(--space-24)',
          maxWidth:      '680px',
          margin:        '0 auto',
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
            fontSize:      'clamp(36px, 5vw, 52px)',
            fontWeight:    400,
            color:         'var(--color-text-primary)',
            lineHeight:    'var(--leading-tight)',
            letterSpacing: '-0.02em',
            marginBottom:  'var(--space-4)',
          }}
        >
          List your{' '}
          <em style={{ color: 'var(--color-moss)', fontStyle: 'italic' }}>opportunity.</em>
        </h1>

        <p
          style={{
            fontSize:      'var(--text-md)',
            color:         'var(--color-text-secondary)',
            lineHeight:    'var(--leading-relaxed)',
            marginBottom:  'var(--space-8)',
          }}
        >
          Get any hackathon, bounty, grant, program or job in front of thousands of AI and Web3 builders actively looking for their next opportunity.
        </p>

        {/* What Happens Next */}
        <div
          className="submit-info-card"
          style={{
            borderRadius: 'var(--radius-md)',
            padding:      'var(--space-6)',
            marginBottom: 'var(--space-10)',
          }}
        >
          <p
            className="form-section-label"
            style={{
              fontSize:      'var(--text-xs)',
              fontWeight:    500,
              letterSpacing: 'var(--tracking-caps)',
              textTransform: 'uppercase',
              marginBottom:  'var(--space-4)',
            }}
          >
            What Happens Next
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {whatHappensNext.map(({ step, text }) => (
              <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
                <span
                  style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600, lineHeight: 1, flexShrink: 0, minWidth: '24px', color: 'var(--color-moss)', letterSpacing: '0.04em' }}
                >
                  {step}
                </span>
                <span className="submit-info-card-text" style={{ fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)', paddingTop: '1px' }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <SubmitForm />

      </div>
    </PageShell>
  );
}
