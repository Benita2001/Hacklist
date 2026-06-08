'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Hackathon } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Tag } from '@/components/ui/Tag';
import { Countdown } from '@/components/ui/Countdown';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

interface HackathonModalProps {
  hackathon: Hackathon;
  onClose: () => void;
}

type TagVariant = 'ai' | 'web3' | 'both' | 'format';

const categoryVariantMap: Record<Hackathon['category'], TagVariant> = {
  AI:   'ai',
  Web3: 'web3',
  Both: 'both',
};

function CloseIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M1 1L11 11M11 1L1 11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ── Modal inner DOM — rendered via portal ── */
function ModalInner({ hackathon, onClose }: HackathonModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const categoryVariant = categoryVariantMap[hackathon.category];

  const deadlineDisplay = hackathon.deadline
    ? formatDate(hackathon.deadline)
    : (hackathon.deadline_text ?? 'TBD');

  const infoStats = [
    { label: 'Category', value: hackathon.category },
    { label: 'Format',   value: hackathon.format },
    { label: 'Deadline', value: deadlineDisplay },
  ];

  // Move focus into modal on open
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  return (
    /* Backdrop */
    <div
      className="modal-backdrop fixed inset-0 flex items-end md:items-center justify-center p-0 md:p-4"
      style={{ zIndex: 400, backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      {/* Shell — responsive shape via .modal-shell class in globals.css */}
      <div
        ref={containerRef}
        tabIndex={-1}
        className="modal-sheet modal-shell w-full md:max-w-2xl relative flex flex-col outline-none"
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-default)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.45), 0 4px 20px rgba(0,0,0,0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={hackathon.name}
      >
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-[10px] pb-0 flex-shrink-0 md:hidden" aria-hidden="true">
          <span
            className="block w-12 rounded-full"
            style={{ height: '3px', backgroundColor: 'var(--color-border-strong)' }}
          />
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute flex items-center justify-center"
          style={{
            top: '20px',
            right: '20px',
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border-default)',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            transition: `color var(--duration-base) var(--ease-default),
                         border-color var(--duration-base) var(--ease-default)`,
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.color = 'var(--color-text-primary)';
            el.style.borderColor = 'var(--color-border-strong)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.color = 'var(--color-text-muted)';
            el.style.borderColor = 'var(--color-border-default)';
          }}
        >
          <CloseIcon />
        </button>

        {/* Scrollable body */}
        <div
          className="modal-scroll overflow-y-auto flex-1"
          style={{
            padding: 'clamp(20px, 4vw, 32px)',
            paddingTop: '22px',
          }}
        >

          {/* ── HEADER ── */}
          <div style={{ paddingRight: '44px', marginBottom: 'var(--space-5)' }}>

            {/* Organizer + verified */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <span style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-caps)',
                color: 'var(--color-text-muted)',
              }}>
                {hackathon.organizer}
              </span>
              {hackathon.verified && <VerifiedBadge />}
            </div>

            {/* Name */}
            <h2
              style={{
                fontSize: 'clamp(22px, 4vw, 34px)',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                lineHeight: 'var(--leading-snug)',
                letterSpacing: '-0.5px',
                marginBottom: 'var(--space-3)',
              }}
            >
              {hackathon.name}
            </h2>

            {/* Prize pool */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <p style={{
                fontSize: '10px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-mono)',
                marginBottom: '4px',
              }}>
                Prize Pool
              </p>
              <span
                style={{
                  fontSize: 'var(--text-3xl)',
                  fontWeight: 700,
                  color: 'var(--color-moss)',
                  letterSpacing: '-0.3px',
                  lineHeight: 1,
                }}
              >
                {hackathon.prize_pool ?? 'Undisclosed'}
              </span>
            </div>

            {/* Tags + countdown */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
              <Tag label={hackathon.category} variant={categoryVariant} />
              <Tag label={hackathon.format} variant="format" />
              {hackathon.free_to_enter && <Tag label="Free" variant="format" />}
              {hackathon.deadline && (
                <>
                  <span
                    aria-hidden="true"
                    style={{ color: 'var(--color-border-strong)', fontSize: '14px', userSelect: 'none', lineHeight: 1 }}
                  >
                    ·
                  </span>
                  <Countdown deadline={hackathon.deadline} />
                </>
              )}
            </div>
          </div>

          {/* ── DIVIDER ── */}
          <div style={{ height: '1px', backgroundColor: 'var(--color-border-muted)', marginBottom: 'var(--space-5)' }} />

          {/* ── INFO MATRIX ── */}
          <div className="grid grid-cols-3" style={{ gap: '12px', marginBottom: 'var(--space-5)' }}>
            {infoStats.map(stat => (
              <div
                key={stat.label}
                style={{
                  backgroundColor: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  textAlign: 'left',
                }}
              >
                <span style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {stat.label}
                </span>
                <span style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  lineHeight: 'var(--leading-snug)',
                }}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>

          {/* ── DESCRIPTION ── */}
          {hackathon.description && (
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <p style={{
                fontSize: '10px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-mono)',
                marginBottom: 'var(--space-3)',
              }}>
                About
              </p>
              <p style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--leading-relaxed)',
              }}>
                {hackathon.description}
              </p>
            </div>
          )}

          {/* ── APPLY CTA ── */}
          {hackathon.apply_url && (
            <a
              href={hackathon.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                maxWidth: '20rem',
                padding: '11px 24px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--btn-primary-bg)',
                color: 'var(--btn-primary-text)',
                border: '1px solid transparent',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                textDecoration: 'none',
                letterSpacing: '-0.01em',
                transition: 'background-color var(--duration-base) var(--ease-default)',
                marginBottom: 'var(--space-4)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--btn-primary-bg-hover)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--btn-primary-bg)'; }}
            >
              Apply Now
            </a>
          )}

        </div>
      </div>
    </div>
  );
}

/* ── Portal wrapper ── */
export function HackathonModal({ hackathon, onClose }: HackathonModalProps) {
  const [mounted, setMounted] = useState(false);

  // SSR safety
  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll lock + ESC key
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <ModalInner hackathon={hackathon} onClose={onClose} />,
    document.body,
  );
}
