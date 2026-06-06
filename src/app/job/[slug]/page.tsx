export const revalidate = 300;

import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { PageShell } from '@/components/layout/PageShell';
import { Tag } from '@/components/ui/Tag';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { Countdown } from '@/components/ui/Countdown';
import { ApplyButton } from '@/components/ui/ApplyButton';

type TagVariant = 'ai' | 'web3' | 'both' | 'format';

const categoryVariantMap: Record<'AI' | 'Web3' | 'Both', TagVariant> = {
  AI: 'ai', Web3: 'web3', Both: 'both',
};

interface Job {
  id: string;
  title: string;
  company: string;
  description: string | null;
  salary: string | null;
  deadline: string | null;
  deadline_text: string | null;
  category: 'AI' | 'Web3' | 'Both';
  format: string | null;
  location: string | null;
  apply_url: string | null;
  verified: boolean;
}

interface Props {
  params: Promise<{ slug: string }>;
}

async function getJob(id: string): Promise<Job | null> {
  const { data } = await supabase.from('jobs').select('*').eq('id', id).single();
  return (data as Job) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) return { title: 'Not Found' };
  return { title: job.title, description: job.description ?? undefined };
}

export default async function JobDetailPage({ params }: Props) {
  const { slug } = await params;
  const job = await getJob(slug);

  if (!job) notFound();

  const categoryVariant = categoryVariantMap[job.category];

  const stats: Array<{ label: string; value: string }> = [
    { label: 'Category', value: job.category },
    { label: 'Format',   value: job.format ?? '—' },
    { label: 'Location', value: job.location ?? '—' },
    { label: 'Deadline', value: job.deadline ? formatDate(job.deadline) : (job.deadline_text ?? 'TBD') },
  ];

  return (
    <>
      <PageShell>
        <div style={{ paddingTop: 'var(--space-10)', paddingBottom: 'var(--space-24)' }}>

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
            ← Back to all jobs
          </Link>

          <div style={{ maxWidth: '680px', marginBottom: 'var(--space-10)' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--color-text-muted)' }}>
                {job.company}
              </span>
              {job.verified && <VerifiedBadge />}
            </div>

            <h1
              className="font-serif"
              style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 400, color: 'var(--color-text-primary)', lineHeight: 'var(--leading-tight)', letterSpacing: '-0.02em', marginBottom: 'var(--space-4)' }}
            >
              {job.title}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
              <div>
                <p style={{ fontSize: 'var(--text-2xs)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                  Salary
                </p>
                <span
                  className="font-serif"
                  style={{ fontSize: 'var(--text-3xl)', fontWeight: 400, color: 'var(--color-moss)', letterSpacing: '-0.02em', lineHeight: 1 }}
                >
                  {job.salary ?? 'Undisclosed'}
                </span>
              </div>
              <Countdown deadline={job.deadline} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              <Tag label={job.category} variant={categoryVariant} />
              {job.format && <Tag label={job.format} variant="format" />}
              {job.location && <Tag label={job.location} variant="format" />}
            </div>
          </div>

          <div
            className="grid grid-cols-2 sm:grid-cols-4"
            style={{ gap: '16px', marginBottom: 'var(--space-10)', maxWidth: '680px' }}
          >
            {stats.map(stat => (
              <div
                key={stat.label}
                style={{
                  backgroundColor: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border-muted)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)',
                }}
              >
                <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {stat.label}
                </span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 'var(--leading-snug)' }}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>

          {job.description && (
            <div style={{ maxWidth: '680px', marginBottom: 'var(--space-10)' }}>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
                About
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
                {job.description}
              </p>
            </div>
          )}

          {job.apply_url && (
            <div className="hidden md:block">
              <ApplyButton href={job.apply_url} label={`Apply to ${job.title}`} />
            </div>
          )}

        </div>
      </PageShell>

      {job.apply_url && (
        <div
          className="fixed bottom-0 left-0 right-0 md:hidden"
          style={{ zIndex: 'var(--z-sticky)' as never, backgroundColor: 'var(--color-bg-surface)', borderTop: '1px solid var(--color-border-default)', padding: 'var(--space-4)' }}
        >
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: '12px 24px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
              border: '1px solid transparent',
              fontSize: 'var(--text-base)',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'background-color var(--duration-base) var(--ease-default)',
            }}
          >
            Apply Now
          </a>
        </div>
      )}
    </>
  );
}
