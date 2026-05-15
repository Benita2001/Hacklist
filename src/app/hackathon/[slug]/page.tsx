import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { PageShell } from '@/components/layout/PageShell';
import { Tag } from '@/components/ui/Tag';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { Countdown } from '@/components/ui/Countdown';
import { Button } from '@/components/ui/Button';
import type { Hackathon } from '@/lib/types';

type TagVariant = 'ai' | 'web3' | 'both' | 'format';

const categoryVariantMap: Record<Hackathon['category'], TagVariant> = {
  AI:   'ai',
  Web3: 'web3',
  Both: 'both',
};

interface Props {
  params: Promise<{ slug: string }>;
}

async function getHackathon(id: string): Promise<Hackathon | null> {
  const { data } = await supabase
    .from('hackathons')
    .select('*')
    .eq('id', id)
    .single();
  return (data as Hackathon) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const hackathon = await getHackathon(slug);
  if (!hackathon) return { title: 'Not Found' };
  return {
    title: hackathon.name,
    description: hackathon.description ?? undefined,
  };
}

export default async function HackathonDetailPage({ params }: Props) {
  const { slug } = await params;
  const hackathon = await getHackathon(slug);

  if (!hackathon) notFound();

  const categoryVariant = categoryVariantMap[hackathon.category];

  const stats: Array<{ label: string; value: string }> = [
    { label: 'Category', value: hackathon.category },
    { label: 'Format',   value: hackathon.format },
    { label: 'Deadline', value: hackathon.deadline ? formatDate(hackathon.deadline) : (hackathon.deadline_text ?? 'TBD') },
    { label: 'Entry',    value: hackathon.free_to_enter ? 'Free' : 'Paid' },
  ];

  return (
    <>
      <PageShell>
        <div style={{ paddingTop: 'var(--space-10)', paddingBottom: 'var(--space-24)' }}>

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
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--color-text-muted)' }}>
                {hackathon.organizer}
              </span>
              {hackathon.verified && <VerifiedBadge />}
            </div>

            {/* Name */}
            <h1
              className="font-serif"
              style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 400, color: 'var(--color-text-primary)', lineHeight: 'var(--leading-tight)', letterSpacing: '-0.02em', marginBottom: 'var(--space-4)' }}
            >
              {hackathon.name}
            </h1>

            {/* Prize + countdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
              <span
                className="font-serif"
                style={{ fontSize: 'var(--text-3xl)', fontWeight: 400, color: 'var(--color-moss)', letterSpacing: '-0.02em', lineHeight: 1 }}
              >
                {hackathon.prize_pool ?? 'Undisclosed'}
              </span>
              <Countdown deadline={hackathon.deadline} />
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <Tag label={hackathon.category} variant={categoryVariant} />
              <Tag label={hackathon.format} variant="format" />
              {hackathon.free_to_enter && <Tag label="Free" variant="format" />}
            </div>
          </div>

          {/* Stats grid */}
          <div
            className="grid grid-cols-2 sm:grid-cols-4"
            style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-10)', maxWidth: '680px' }}
          >
            {stats.map(stat => (
              <div
                key={stat.label}
                style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}
              >
                <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--color-text-muted)' }}>
                  {stat.label}
                </span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 'var(--leading-snug)' }}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>

          {/* Description */}
          {hackathon.description && (
            <div style={{ maxWidth: '680px', marginBottom: 'var(--space-10)' }}>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
                About
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
                {hackathon.description}
              </p>
            </div>
          )}

          {/* Apply button */}
          {hackathon.apply_url && (
            <div className="hidden md:flex">
              <Button variant="primary" size="lg" href={hackathon.apply_url}>
                Apply to {hackathon.name} →
              </Button>
            </div>
          )}

        </div>
      </PageShell>

      {/* Mobile sticky apply bar */}
      {hackathon.apply_url && (
        <div
          className="fixed bottom-0 left-0 right-0 md:hidden"
          style={{ zIndex: 'var(--z-sticky)' as never, backgroundColor: 'var(--color-bg-surface)', borderTop: '1px solid var(--color-border-default)', padding: 'var(--space-4)' }}
        >
          <Button variant="primary" size="lg" href={hackathon.apply_url} className="w-full">
            Apply Now →
          </Button>
        </div>
      )}
    </>
  );
}
