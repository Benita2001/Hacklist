'use client';

import { useRouter } from 'next/navigation';
import { getDaysRemaining, isEndingToday } from '@/lib/utils';
import { Tag } from '@/components/ui/Tag';
import { Countdown } from '@/components/ui/Countdown';

export interface TagItem {
  label: string;
  variant: 'ai' | 'web3' | 'both' | 'format' | 'custom';
  customStyle?: React.CSSProperties;
}

interface UniversalCardProps {
  id: string;
  name: string;
  organizer: string;
  description?: string | null;
  prizeLabel: string;
  prizeValue: string | null;
  deadline: string | null;
  deadline_text: string | null;
  apply_url: string | null;
  tags: TagItem[];
  href?: string;
  index?: number;
}

function TagRenderer({ tag }: { tag: TagItem }) {
  if (tag.variant === 'custom' && tag.customStyle) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '3px 10px',
          borderRadius: '50px',
          fontSize: '11px',
          letterSpacing: '0.3px',
          lineHeight: 1.4,
          whiteSpace: 'nowrap',
          fontWeight: 400,
          ...tag.customStyle,
        }}
      >
        {tag.label}
      </span>
    );
  }
  return <Tag label={tag.label} variant={tag.variant as 'ai' | 'web3' | 'both' | 'format'} />;
}

export function UniversalCard({
  name,
  organizer,
  description,
  prizeLabel,
  prizeValue,
  deadline,
  deadline_text,
  apply_url,
  tags,
  href,
  index = 0,
}: UniversalCardProps) {
  const router = useRouter();

  const endingToday   = isEndingToday(deadline);
  const daysLeft      = deadline ? getDaysRemaining(deadline) : null;
  const isClosingSoon = !endingToday && daysLeft !== null && daysLeft <= 7;
  const animDelay     = `${index * 60}ms`;

  const deadlineLabel = deadline ? null : (deadline_text ?? 'TBD');

  const urgencyBadgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: 'var(--space-3)',
    right: 'var(--space-3)',
    fontSize: 'var(--text-xs)',
    fontWeight: 400,
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'rgba(239, 68, 68, 0.10)',
    color: 'rgb(248, 113, 113)',
    border: '1px solid rgba(239, 68, 68, 0.20)',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
  };

  const UrgencyBadge = endingToday ? (
    <span style={urgencyBadgeStyle}>Ending Today</span>
  ) : isClosingSoon ? (
    <span style={urgencyBadgeStyle}>Closing Soon</span>
  ) : null;

  const applyButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 16px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border-default)',
    backgroundColor: 'var(--color-bg-elevated)',
    color: 'var(--color-text-secondary)',
    fontSize: 'var(--text-xs)',
    fontWeight: 400,
    textDecoration: 'none',
    transition: 'border-color var(--duration-base) var(--ease-default)',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };

  // First tag (category) goes beside the name; remaining go in the tag row below
  const [primaryTag, ...remainingTags] = tags;

  function handleCardClick() {
    if (href) router.push(href);
  }

  return (
    <article
      onClick={href ? handleCardClick : undefined}
      onKeyDown={href ? (e) => { if (e.key === 'Enter') handleCardClick(); } : undefined}
      tabIndex={href ? 0 : undefined}
      aria-label={href ? `${name}. View details.` : undefined}
      className={`animate-fade-up flex flex-col${isClosingSoon ? ' closing-soon-pulse' : ''}${href ? ' cursor-pointer outline-none' : ''}`}
      style={{
        animationDelay: animDelay,
        height: '100%',
        backgroundColor: 'var(--card-bg)',
        borderRadius: 'var(--card-radius)',
        padding: 'var(--card-padding)',
        border: isClosingSoon ? '1px solid' : '1px solid var(--color-card-border)',
        boxShadow: 'var(--shadow-card)',
        position: 'relative',
        transition: 'border-color var(--duration-base) var(--ease-default)',
      }}
      onMouseEnter={e => {
        if (!isClosingSoon) (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-strong)';
      }}
      onMouseLeave={e => {
        if (!isClosingSoon) (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-card-border)';
        else (e.currentTarget as HTMLElement).style.borderColor = '';
      }}
    >
      {UrgencyBadge}

      {/* Organizer — same as HackathonCard */}
      <p
        className="truncate"
        style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 500,
          letterSpacing: 'var(--tracking-caps)',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
          marginBottom: '8px',
          display: 'block',
          maxWidth: '70%',
        }}
      >
        {organizer}
      </p>

      {/* Name + category tag */}
      <div className="flex items-start justify-between" style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 'var(--leading-snug)', letterSpacing: '-0.2px', flex: 1 }}>
          {name}
        </h3>
        {primaryTag && (
          <div style={{ flexShrink: 0, marginTop: '2px' }}>
            <TagRenderer tag={primaryTag} />
          </div>
        )}
      </div>

      {/* Description */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {description}
        </p>
      </div>

      {/* Format/type/location tags */}
      <div className="flex flex-wrap" style={{ gap: '6px', marginBottom: 'var(--space-5)' }}>
        {remainingTags.map((tag, i) => (
          <TagRenderer key={i} tag={tag} />
        ))}
      </div>

      {/* Bottom: prize + countdown + apply */}
      <div
        className="flex items-end justify-between"
        style={{ marginTop: 'auto', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-muted)', gap: 'var(--space-3)' }}
      >
        {/* Prize — flex: 1 + minWidth: 0 so it never pushes right column out */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 'var(--text-2xs)', fontWeight: 400, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
            {prizeLabel}
          </p>
          <span
            style={{ fontSize: 'var(--text-2xl)', fontWeight: 500, color: 'var(--color-moss)', letterSpacing: '-0.3px', lineHeight: 1 }}
          >
            {prizeValue ?? 'Undisclosed'}
          </span>
        </div>

        {/* Deadline + apply — flexShrink: 0 prevents deadline text from collapsing into prize */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-2)', flexShrink: 0 }}>
          <div style={{ paddingBottom: '2px', overflow: 'hidden' }}>
            {deadline ? (
              <Countdown deadline={deadline} />
            ) : (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                {deadlineLabel}
              </span>
            )}
          </div>
          {apply_url && (
            <a
              href={apply_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={applyButtonStyle}
              onMouseEnter={(e) => {
                e.stopPropagation();
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-border-strong)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-border-default)';
              }}
            >
              Apply
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
