'use client';

import { useRouter } from 'next/navigation';
import { Hackathon } from '@/lib/types';
import { getDaysRemaining } from '@/lib/utils';
import { Countdown } from '@/components/ui/Countdown';
import { Tag } from '@/components/ui/Tag';

interface HackathonCardProps {
  hackathon: Hackathon;
  spotlight?: boolean;
  index?: number;
}

type TagVariant = 'ai' | 'web3' | 'both' | 'format';

const categoryVariantMap: Record<Hackathon['category'], TagVariant> = {
  AI:    'ai',
  Web3:  'web3',
  Both:  'both',
  Other: 'format',
};

export function HackathonCard({
  hackathon,
  spotlight = false,
  index = 0,
}: HackathonCardProps) {
  const router = useRouter();

  function handleCardClick() {
    router.push(`/hackathon/${hackathon.slug}`);
  }

  const categoryVariant = categoryVariantMap[hackathon.category];
  const animDelay = `${index * 60}ms`;
  const isClosingSoon = getDaysRemaining(hackathon.submissionDeadline) <= 7;

  /* ── Spotlight card — full-width horizontal layout ── */
  if (spotlight) {
    return (
      <article
        onClick={handleCardClick}
        onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick(); }}
        tabIndex={0}
        aria-label={`${hackathon.name} — ${hackathon.prizeDisplay}. Spotlight. View details.`}
        className={`animate-fade-up flex flex-col md:flex-row cursor-pointer outline-none${isClosingSoon ? ' closing-soon-pulse' : ''}`}
        style={{
          animationDelay: animDelay,
          backgroundColor: 'var(--card-bg-featured)',
          borderRadius: 'var(--card-radius)',
          padding: 'var(--card-padding)',
          ...(isClosingSoon
            ? { borderWidth: '1px', borderStyle: 'solid' }
            : { border: '1px solid transparent' }),
          gap: 'var(--space-6)',
          position: 'relative',
          transition: 'transform var(--duration-base) var(--ease-default), box-shadow var(--duration-base) var(--ease-default)',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
          (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card-hover)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = '';
          (e.currentTarget as HTMLElement).style.boxShadow = '';
          if (isClosingSoon) (e.currentTarget as HTMLElement).style.borderColor = '';
        }}
      >
        {isClosingSoon && (
          <span
            style={{
              position: 'absolute',
              top: 'var(--space-3)',
              right: 'var(--space-3)',
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              padding: '3px var(--space-2)',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--color-danger-bg)',
              color: 'var(--color-danger-text)',
              border: '1px solid var(--color-danger-border)',
              pointerEvents: 'none',
            }}
          >
            🔥 Closing Soon
          </span>
        )}
        {/* Left: organizer + name + tags */}
        <div
          className="md:w-72"
          style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
        >
          <p
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              letterSpacing: 'var(--tracking-caps)',
              textTransform: 'uppercase',
              color: 'var(--color-olive-light)',
            }}
          >
            {hackathon.organizer}
          </p>
          <h3
            className="font-serif"
            style={{
              fontSize: 'clamp(22px, 2.5vw, 30px)',
              fontWeight: 400,
              color: '#FFFFFF',
              lineHeight: 'var(--leading-snug)',
              letterSpacing: '-0.01em',
            }}
          >
            {hackathon.name}
          </h3>
          <div className="flex flex-wrap" style={{ gap: 'var(--space-2)' }}>
            {hackathon.category !== 'Other' && (
              <Tag label={hackathon.category} variant={categoryVariant} />
            )}
            <Tag label={hackathon.format} variant="format" />
            {hackathon.isFree && <Tag label="Free" variant="format" />}
          </div>
        </div>

        {/* Vertical separator — desktop only */}
        <div
          className="hidden md:block"
          style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.12)', flexShrink: 0, alignSelf: 'stretch' }}
          aria-hidden="true"
        />

        {/* Middle: description */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'rgba(240, 238, 224, 0.70)',
              lineHeight: 'var(--leading-relaxed)',
            }}
          >
            {hackathon.description}
          </p>
        </div>

        {/* Vertical separator — desktop only */}
        <div
          className="hidden md:block"
          style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.12)', flexShrink: 0, alignSelf: 'stretch' }}
          aria-hidden="true"
        />

        {/* Right: prize + countdown */}
        <div
          className="md:w-44"
          style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 'var(--space-2)' }}
        >
          <p
            style={{
              fontSize: 'var(--text-2xs)',
              fontWeight: 500,
              letterSpacing: 'var(--tracking-caps)',
              textTransform: 'uppercase',
              color: 'var(--color-olive-light)',
            }}
          >
            Prize Pool
          </p>
          <span
            className="font-serif"
            style={{
              fontSize: 'var(--text-3xl)',
              fontWeight: 400,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {hackathon.prizeDisplay}
          </span>
          <div>
            <Countdown submissionDeadline={hackathon.submissionDeadline} />
          </div>
          <a
            href={hackathon.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px var(--space-4)',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: '#FFFFFF',
              color: 'var(--color-moss)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              textDecoration: 'none',
              transition: `background-color var(--duration-base)`,
              whiteSpace: 'nowrap',
              alignSelf: 'flex-start',
            }}
            onMouseEnter={(e) => {
              e.stopPropagation();
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(255,255,255,0.85)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#FFFFFF';
            }}
          >
            Apply →
          </a>
        </div>
      </article>
    );
  }

  /* ── Regular card ── */
  return (
    <article
      onClick={handleCardClick}
      onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick(); }}
      tabIndex={0}
      aria-label={`${hackathon.name} — ${hackathon.prizeDisplay}. View details.`}
      className={`animate-fade-up flex flex-col cursor-pointer outline-none${isClosingSoon ? ' closing-soon-pulse' : ''}`}
      style={{
        animationDelay: animDelay,
        height: '100%',
        backgroundColor: 'var(--card-bg)',
        borderRadius: 'var(--card-radius)',
        padding: 'var(--card-padding)',
        ...(isClosingSoon
          ? { borderWidth: '1px', borderStyle: 'solid' }
          : { border: '1px solid var(--color-border-default)' }),
        boxShadow: 'var(--shadow-card)',
        position: 'relative',
        transition: 'transform var(--duration-base) var(--ease-default), box-shadow var(--duration-base) var(--ease-default), border-color var(--duration-base) var(--ease-default)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(-2px)';
        el.style.boxShadow = 'var(--shadow-card-hover)';
        if (!isClosingSoon) el.style.borderColor = 'var(--color-olive)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = '';
        el.style.boxShadow = 'var(--shadow-card)';
        if (!isClosingSoon) el.style.borderColor = 'var(--color-border-default)';
        else el.style.borderColor = '';
      }}
    >
      {isClosingSoon && (
        <span
          style={{
            position: 'absolute',
            top: 'var(--space-3)',
            right: 'var(--space-3)',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            padding: '3px var(--space-2)',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--color-danger-bg)',
            color: 'var(--color-danger-text)',
            border: '1px solid var(--color-danger-border)',
            pointerEvents: 'none',
          }}
        >
          🔥 Closing Soon
        </span>
      )}
      {/* Organizer label */}
      <p
        style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 600,
          letterSpacing: 'var(--tracking-caps)',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
          marginBottom: 'var(--space-2)',
        }}
      >
        {hackathon.organizer}
      </p>

      {/* Name + category badge */}
      <div
        className="flex items-start justify-between"
        style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}
      >
        <h3
          style={{
            fontSize: 'var(--text-md)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            lineHeight: 'var(--leading-snug)',
            flex: 1,
          }}
        >
          {hackathon.name}
        </h3>
        {hackathon.category !== 'Other' && (
          <div style={{ flexShrink: 0, marginTop: '2px' }}>
            <Tag label={hackathon.category} variant={categoryVariant} />
          </div>
        )}
      </div>

      {/* Description */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--leading-relaxed)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {hackathon.description}
        </p>
      </div>

      {/* Format meta-pills */}
      <div
        className="flex flex-wrap"
        style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}
      >
        <Tag label={hackathon.format} variant="format" />
        {hackathon.isFree && <Tag label="Free" variant="format" />}
      </div>

      {/* Bottom: prize + countdown */}
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
            Prize Pool
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
            {hackathon.prizeDisplay}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-2)' }}>
          <div style={{ paddingBottom: '2px' }}>
            <Countdown submissionDeadline={hackathon.submissionDeadline} />
          </div>
          <a
            href={hackathon.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px var(--space-3)',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--color-moss)',
              color: '#FFFFFF',
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              textDecoration: 'none',
              transition: `background-color var(--duration-base)`,
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.stopPropagation();
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-moss-light)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-moss)';
            }}
          >
            Apply →
          </a>
        </div>
      </div>
    </article>
  );
}
