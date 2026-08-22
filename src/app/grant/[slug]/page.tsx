export const revalidate = 300;

import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSupabase } from '@/lib/supabase';
import { canonicalOpportunityId } from '@/domain/opportunities/canonical-adapter';
import { formatDate } from '@/lib/utils';
import { PageShell } from '@/components/layout/PageShell';
import { Tag } from '@/components/ui/Tag';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { Countdown } from '@/components/ui/Countdown';
import { ApplyButton } from '@/components/ui/ApplyButton';
import { OpportunityTrustPanel } from '@/components/opportunity/OpportunityTrustPanel';

type TagVariant = 'ai' | 'web3' | 'both' | 'format';

const categoryVariantMap: Record<'AI' | 'Web3' | 'Both', TagVariant> = {
  AI: 'ai', Web3: 'web3', Both: 'both',
};

interface Grant {
  id: string;
  name: string;
  organizer: string;
  description: string | null;
  amount: string | null;
  deadline: string | null;
  deadline_text: string | null;
  category: 'AI' | 'Web3' | 'Both';
  ecosystem: string | null;
  format: string | null;
  free_to_apply: boolean;
  apply_url: string | null;
  verified: boolean;
}

interface Props {
  params: Promise<{ slug: string }>;
}

async function getGrant(id: string): Promise<Grant | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.from('grants').select('*').eq('id', id).eq('verified', true).single();
  return (data as Grant) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const grant = await getGrant(slug);
  if (!grant) return { title: 'Not Found' };
  return { title: grant.name, description: grant.description ?? undefined };
}

export default async function GrantDetailPage({ params }: Props) {
  const { slug } = await params;
  const grant = await getGrant(slug);

  if (!grant) notFound();

  const categoryVariant = categoryVariantMap[grant.category];

  const stats: Array<{ label: string; value: string }> = [
    { label: 'Category',  value: grant.category },
    { label: 'Ecosystem', value: grant.ecosystem ?? '—' },
    { label: 'Format',    value: grant.format ?? '—' },
    { label: 'Entry',     value: grant.free_to_apply ? 'Free' : 'Paid' },
    { label: 'Deadline',  value: grant.deadline ? formatDate(grant.deadline) : (grant.deadline_text ?? 'TBD') },
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
            ← Back to all grants
          </Link>

          <div style={{ maxWidth: '680px', marginBottom: 'var(--space-10)' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--color-text-muted)' }}>
                {grant.organizer}
              </span>
              {grant.verified && <VerifiedBadge />}
            </div>

            <h1
              style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 400, color: 'var(--color-text-primary)', lineHeight: 'var(--leading-tight)', letterSpacing: '-0.5px', marginBottom: 'var(--space-4)' }}
            >
              {grant.name}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
              <div>
                <p style={{ fontSize: 'var(--text-2xs)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                  Amount
                </p>
                <span
                  style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-3xl)', fontWeight: 400, color: 'var(--color-moss)', letterSpacing: '-0.3px', lineHeight: 1 }}
                >
                  {grant.amount ?? 'Undisclosed'}
                </span>
              </div>
              <Countdown deadline={grant.deadline} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              <Tag label={grant.category} variant={categoryVariant} />
              {grant.ecosystem && <Tag label={grant.ecosystem} variant="format" />}
              {grant.format && <Tag label={grant.format} variant="format" />}
              {grant.free_to_apply && <Tag label="Free" variant="format" />}
            </div>
          </div>

          <div
            className="grid grid-cols-2 sm:grid-cols-3"
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

          <OpportunityTrustPanel
            organizer={grant.organizer}
            verified={grant.verified}
            applicationUrl={grant.apply_url}
            deadline={grant.deadline}
            deadlineText={grant.deadline_text}
            opportunityId={canonicalOpportunityId('grant', grant.id)}
            returnTo={`/grant/${grant.id}`}
          />

          {grant.description && (
            <div style={{ maxWidth: '680px', marginBottom: 'var(--space-10)' }}>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
                About
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
                {grant.description}
              </p>
            </div>
          )}

          {grant.apply_url && (
            <div className="hidden md:block">
              <ApplyButton href={grant.apply_url} label={`Apply to ${grant.name}`} />
            </div>
          )}

        </div>
      </PageShell>

      {grant.apply_url && (
        <div
          className="fixed bottom-0 left-0 right-0 md:hidden"
          style={{ zIndex: 'var(--z-sticky)' as never, backgroundColor: 'var(--color-bg-surface)', borderTop: '1px solid var(--color-border-default)', padding: 'var(--space-4)' }}
        >
          <a
            href={grant.apply_url}
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
