import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ReactMarkdown, { type Components } from 'react-markdown';
import { getHackathonBySlug, getAllHackathons } from '@/lib/data';
import { formatDate, isExpired } from '@/lib/utils';
import { PageShell } from '@/components/layout/PageShell';
import { Tag } from '@/components/ui/Tag';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { Countdown } from '@/components/ui/Countdown';
import { Button } from '@/components/ui/Button';
import type { Hackathon } from '@/lib/types';

type TagVariant = 'ai' | 'web3' | 'both' | 'format';

const categoryVariantMap: Record<Hackathon['category'], TagVariant> = {
  AI: 'ai',
  Web3: 'web3',
  Both: 'both',
  Other: 'format',
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllHackathons().map((h) => ({ slug: h.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const hackathon = getHackathonBySlug(slug);
  if (!hackathon) return { title: 'Not Found' };
  return {
    title: hackathon.name,
    description: hackathon.description,
  };
}

const mdComponents: Components = {
  h1: ({ children }) => (
    <h1 className="font-serif" style={{ fontSize: 'var(--text-2xl)', fontWeight: 400, color: 'var(--color-text-primary)', marginTop: 'var(--space-6)', marginBottom: 'var(--space-3)', lineHeight: 'var(--leading-snug)' }}>
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: 'var(--space-6)', marginBottom: 'var(--space-2)', lineHeight: 'var(--leading-snug)' }}>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-4)' }}>
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul style={{ listStyle: 'disc', paddingLeft: 'var(--space-5)', marginBottom: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol style={{ listStyle: 'decimal', paddingLeft: 'var(--space-5)', marginBottom: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
      {children}
    </li>
  ),
  strong: ({ children }) => (
    <strong style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
      {children}
    </strong>
  ),
};

export default async function HackathonDetailPage({ params }: Props) {
  const { slug } = await params;
  const hackathon = getHackathonBySlug(slug);

  if (!hackathon) {
    notFound();
  }

  const categoryVariant = categoryVariantMap[hackathon.category];
  const expired = isExpired(hackathon.submissionDeadline);

  const stats: Array<{ label: string; value: string }> = [
    { label: 'Start Date',  value: formatDate(hackathon.startDate) },
    { label: 'End Date',    value: formatDate(hackathon.endDate) },
    { label: 'Deadline',    value: formatDate(hackathon.submissionDeadline) },
    { label: 'Team Size',   value: hackathon.teamSize },
    { label: 'Format',      value: hackathon.format },
    { label: 'Eligibility', value: hackathon.eligibility },
  ];

  return (
    <>
      <PageShell>
        <div style={{ paddingTop: 'var(--space-10)', paddingBottom: 'var(--space-24)' }}>

          {/* Expired banner */}
          {expired && (
            <div
              style={{
                marginBottom: 'var(--space-6)',
                padding: 'var(--space-3) var(--space-4)',
                backgroundColor: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-text-muted)',
                  flexShrink: 0,
                }}
                aria-hidden="true"
              />
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                This hackathon has ended.
              </p>
            </div>
          )}

          {/* Back link */}
          <Link
            href="/"
            className={[
              'inline-flex items-center gap-[var(--space-1)]',
              'text-[color:var(--color-text-secondary)]',
              'hover:text-[color:var(--color-text-primary)]',
              'transition-colors duration-[var(--duration-base)]',
            ].join(' ')}
            style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-8)', display: 'inline-flex' }}
          >
            ← Back to all hackathons
          </Link>

          {/* Header block */}
          <div style={{ maxWidth: '680px', marginBottom: 'var(--space-10)' }}>

            {/* Organizer + verified */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--tracking-caps)',
                  color: 'var(--color-text-muted)',
                }}
              >
                {hackathon.organizer}
              </span>
              {hackathon.isVerified && <VerifiedBadge />}
            </div>

            {/* Name */}
            <h1
              className="font-serif"
              style={{
                fontSize: 'clamp(32px, 5vw, 48px)',
                fontWeight: 400,
                color: 'var(--color-text-primary)',
                lineHeight: 'var(--leading-tight)',
                letterSpacing: '-0.02em',
                marginBottom: 'var(--space-4)',
              }}
            >
              {hackathon.name}
            </h1>

            {/* Prize + countdown row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
              <span
                className="font-serif"
                style={{
                  fontSize: 'var(--text-3xl)',
                  fontWeight: 400,
                  color: 'var(--color-moss)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}
              >
                {hackathon.prizeDisplay}
              </span>
              <Countdown submissionDeadline={hackathon.submissionDeadline} />
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <Tag label={hackathon.category} variant={categoryVariant} />
              <Tag label={hackathon.format} variant="format" />
              {hackathon.isFree && <Tag label="Free" variant="format" />}
            </div>
          </div>

          {/* Stats grid */}
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6"
            style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-10)' }}
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-1)',
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--text-2xs)',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--tracking-caps)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {stat.label}
                </span>
                <span
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    color: 'var(--color-text-primary)',
                    lineHeight: 'var(--leading-snug)',
                  }}
                >
                  {stat.value}
                </span>
              </div>
            ))}
          </div>

          {/* About */}
          <div style={{ maxWidth: '680px', marginBottom: 'var(--space-10)' }}>
            <p
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-caps)',
                color: 'var(--color-text-muted)',
                marginBottom: 'var(--space-4)',
              }}
            >
              About
            </p>
            <ReactMarkdown components={mdComponents}>
              {hackathon.longDescription}
            </ReactMarkdown>
          </div>

          {/* Judging criteria */}
          {hackathon.judgingCriteria.length > 0 && (
            <div style={{ maxWidth: '680px', marginBottom: 'var(--space-10)' }}>
              <p
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--tracking-caps)',
                  color: 'var(--color-text-muted)',
                  marginBottom: 'var(--space-6)',
                }}
              >
                What Judges Want
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                {hackathon.judgingCriteria.map((criterion) => (
                  <div key={criterion.name}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {criterion.name}
                      </span>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-moss)' }}>
                        {criterion.weight}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: '3px',
                        backgroundColor: 'var(--color-border-default)',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: 'var(--space-3)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${criterion.weight}%`,
                          backgroundColor: 'var(--color-olive)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      />
                    </div>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
                      {criterion.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prize breakdown */}
          {hackathon.prizeBreakdown.length > 0 && (
            <div style={{ maxWidth: '400px', marginBottom: 'var(--space-10)' }}>
              <p
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--tracking-caps)',
                  color: 'var(--color-text-muted)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                Prize Breakdown
              </p>
              <div
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                }}
              >
                {hackathon.prizeBreakdown.map((row, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-4) var(--space-5)',
                      borderBottom: i < hackathon.prizeBreakdown.length - 1
                        ? '1px solid var(--color-border-default)'
                        : 'none',
                    }}
                  >
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      {row.place}
                    </span>
                    <span
                      className="font-serif"
                      style={{ fontSize: 'var(--text-lg)', fontWeight: 400, color: 'var(--color-moss)' }}
                    >
                      {row.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Desktop apply button */}
          <div className="hidden md:flex">
            <Button variant="primary" size="lg" href={hackathon.applyUrl}>
              Apply to {hackathon.name} →
            </Button>
          </div>

        </div>
      </PageShell>

      {/* Mobile sticky apply bar */}
      <div
        className="fixed bottom-0 left-0 right-0 md:hidden"
        style={{
          zIndex: 'var(--z-sticky)' as never,
          backgroundColor: 'var(--color-bg-surface)',
          borderTop: '1px solid var(--color-border-default)',
          padding: 'var(--space-4)',
        }}
      >
        <Button variant="primary" size="lg" href={hackathon.applyUrl} className="w-full">
          Apply Now →
        </Button>
      </div>
    </>
  );
}
