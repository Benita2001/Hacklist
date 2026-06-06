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

const programTypeStyles: Record<string, { bg: string; color: string; border: string }> = {
  Fellowship:  { bg: '#EEEDFE', color: '#3C3489', border: '#D5D4F8' },
  Accelerator: { bg: '#E6F1FB', color: '#0C447C', border: '#C4DCEF' },
  Incubator:   { bg: '#FAEEDA', color: '#633806', border: '#F0D6A8' },
};

interface Program {
  id: string;
  name: string;
  organizer: string;
  description: string | null;
  stipend: string | null;
  duration: string | null;
  deadline: string | null;
  deadline_text: string | null;
  category: 'AI' | 'Web3' | 'Both';
  format: string | null;
  type: string | null;
  apply_url: string | null;
  verified: boolean;
}

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProgram(id: string): Promise<Program | null> {
  const { data } = await supabase.from('programs').select('*').eq('id', id).single();
  return (data as Program) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const program = await getProgram(slug);
  if (!program) return { title: 'Not Found' };
  return { title: program.name, description: program.description ?? undefined };
}

export default async function ProgramDetailPage({ params }: Props) {
  const { slug } = await params;
  const program = await getProgram(slug);

  if (!program) notFound();

  const categoryVariant = categoryVariantMap[program.category];
  const typeStyle = program.type ? programTypeStyles[program.type] : null;

  const stats: Array<{ label: string; value: string }> = [
    { label: 'Category', value: program.category },
    { label: 'Format',   value: program.format ?? '—' },
    { label: 'Type',     value: program.type ?? '—' },
    { label: 'Duration', value: program.duration ?? '—' },
    { label: 'Deadline', value: program.deadline ? formatDate(program.deadline) : (program.deadline_text ?? 'TBD') },
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
            ← Back to all programs
          </Link>

          <div style={{ maxWidth: '680px', marginBottom: 'var(--space-10)' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--color-text-muted)' }}>
                {program.organizer}
              </span>
              {program.verified && <VerifiedBadge />}
            </div>

            <h1
              className="font-serif"
              style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 400, color: 'var(--color-text-primary)', lineHeight: 'var(--leading-tight)', letterSpacing: '-0.02em', marginBottom: 'var(--space-4)' }}
            >
              {program.name}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
              <div>
                <p style={{ fontSize: 'var(--text-2xs)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                  Stipend
                </p>
                <span
                  className="font-serif"
                  style={{ fontSize: 'var(--text-3xl)', fontWeight: 400, color: 'var(--color-moss)', letterSpacing: '-0.02em', lineHeight: 1 }}
                >
                  {program.stipend ?? 'Undisclosed'}
                </span>
              </div>
              <Countdown deadline={program.deadline} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              <Tag label={program.category} variant={categoryVariant} />
              {program.format && <Tag label={program.format} variant="format" />}
              {program.type && typeStyle ? (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '3px 10px',
                  borderRadius: '50px',
                  fontSize: '11px',
                  letterSpacing: '0.3px',
                  lineHeight: 1.4,
                  whiteSpace: 'nowrap',
                  fontWeight: 500,
                  backgroundColor: typeStyle.bg,
                  color: typeStyle.color,
                  border: `1px solid ${typeStyle.border}`,
                }}>
                  {program.type}
                </span>
              ) : program.type ? (
                <Tag label={program.type} variant="format" />
              ) : null}
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

          {program.description && (
            <div style={{ maxWidth: '680px', marginBottom: 'var(--space-10)' }}>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
                About
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
                {program.description}
              </p>
            </div>
          )}

          {program.apply_url && (
            <div className="hidden md:block">
              <ApplyButton href={program.apply_url} label={`Apply to ${program.name}`} />
            </div>
          )}

        </div>
      </PageShell>

      {program.apply_url && (
        <div
          className="fixed bottom-0 left-0 right-0 md:hidden"
          style={{ zIndex: 'var(--z-sticky)' as never, backgroundColor: 'var(--color-bg-surface)', borderTop: '1px solid var(--color-border-default)', padding: 'var(--space-4)' }}
        >
          <a
            href={program.apply_url}
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
