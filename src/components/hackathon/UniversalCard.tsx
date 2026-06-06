'use client';

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
  prizeLabel: string;
  prizeValue: string | null;
  deadline: string | null;
  deadline_text: string | null;
  apply_url: string | null;
  tags: TagItem[];
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
          fontWeight: 500,
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
  prizeLabel,
  prizeValue,
  deadline,
  deadline_text,
  apply_url,
  tags,
  index = 0,
}: UniversalCardProps) {
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
    fontWeight: 500,
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
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'border-color var(--duration-base) var(--ease-default)',
    whiteSpace: 'nowrap',
  };

  // First tag goes in the header row beside the name; rest go in the tag row below
  const [primaryTag, ...remainingTags] = tags;

  return (
    <article
      className={`animate-fade-up flex flex-col${isClosingSoon ? ' closing-soon-pulse' : ''}`}
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

      {/* Organizer */}
      <p
        className="truncate"
        style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 600,
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

      {/* Name + primary tag */}
      <div
        className="flex items-start justify-between"
        style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}
      >
        <h3
          style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            lineHeight: 'var(--leading-snug)',
            letterSpacing: '-0.01em',
            flex: 1,
          }}
        >
          {name}
        </h3>
        {primaryTag && (
          <div style={{ flexShrink: 0, marginTop: '2px' }}>
            <TagRenderer tag={primaryTag} />
          </div>
        )}
      </div>

      {/* Remaining tags */}
      {remainingTags.length > 0 && (
        <div className="flex flex-wrap" style={{ gap: '6px', marginBottom: 'var(--space-5)' }}>
          {remainingTags.map((tag, i) => (
            <TagRenderer key={i} tag={tag} />
          ))}
        </div>
      )}

      {/* Bottom: prize + countdown + apply */}
      <div
        className="flex items-end justify-between"
        style={{
          marginTop: 'auto',
          paddingTop: 'var(--space-4)',
          borderTop: '1px solid var(--color-border-muted)',
        }}
      >
        <div>
          <p
            style={{
              fontSize: 'var(--text-2xs)',
              fontWeight: 500,
              letterSpacing: 'var(--tracking-caps)',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              marginBottom: '4px',
            }}
          >
            {prizeLabel}
          </p>
          <span
            className="font-serif"
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 400,
              color: 'var(--color-moss)',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {prizeValue ?? 'Undisclosed'}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 'var(--space-2)',
          }}
        >
          <div style={{ paddingBottom: '2px' }}>
            {deadline ? (
              <Countdown deadline={deadline} />
            ) : (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                {deadlineLabel}
              </span>
            )}
          </div>
          {apply_url && (
            <a
              href={apply_url}
              target="_blank"
              rel="noopener noreferrer"
              style={applyButtonStyle}
              onMouseEnter={(e) => {
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
