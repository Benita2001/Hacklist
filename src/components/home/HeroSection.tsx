'use client';

import { useState, useEffect, useRef } from 'react';
import { Hackathon } from '@/lib/types';
import { parsePrizeToNumber } from '@/lib/utils';

interface HeroSectionProps {
  hackathons: Hackathon[];
}

export function HeroSection({ hackathons }: HeroSectionProps) {
  const [email, setEmail]               = useState('');
  const [submitted, setSubmitted]       = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const prizeRef = useRef<HTMLSpanElement>(null);

  const totalPrize = hackathons.reduce((sum, h) => sum + parsePrizeToNumber(h.prize_pool), 0);

  useEffect(() => {
    const el = prizeRef.current;
    if (!el || !totalPrize) return;
    const end      = totalPrize;
    const duration = 2000;
    const startTime = performance.now();
    function update(currentTime: number) {
      const elapsed  = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      const current  = Math.floor(eased * end);
      el!.textContent = '$' + current.toLocaleString() + '+';
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }, [totalPrize]);

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  return (
    <section style={{ paddingTop: 'var(--space-16)', paddingBottom: 'var(--space-10)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>

        {/* Headline */}
        <h1
          className="font-serif"
          style={{
            fontSize: 'clamp(48px, 7vw, 72px)',
            lineHeight: 'var(--leading-tight)',
            letterSpacing: '-0.02em',
            margin: '0 auto var(--space-6)',
          }}
        >
          <span style={{ display: 'block', fontWeight: 500, fontStyle: 'normal', color: 'var(--color-moss)' }}>
            The fastest way to find
          </span>
          <span style={{ display: 'block', fontWeight: 400, fontStyle: 'normal', color: 'var(--color-moss)' }}>
            AI &amp; Web3 hackathons
          </span>
          <em style={{ display: 'block', fontWeight: 400, fontStyle: 'italic', color: 'var(--color-moss)' }}>
            worth your time.
          </em>
        </h1>

        {/* Prize number */}
        <div style={{ margin: '0 auto var(--space-8)', paddingTop: 'var(--space-3)' }}>
          <span
            ref={prizeRef}
            className="font-serif"
            style={{
              fontSize: '64px',
              fontWeight: 400,
              color: 'var(--color-moss)',
              lineHeight: 1,
              letterSpacing: '-0.03em',
              display: 'block',
              marginBottom: 'var(--space-2)',
            }}
          >
            $0+
          </span>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', letterSpacing: 'var(--tracking-wide)' }}>
            in active prizes waiting for you
          </span>
        </div>

        {/* Email capture */}
        <div style={{ maxWidth: '520px', margin: '0 auto' }}>
          {submitted ? (
            <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-moss)', padding: 'var(--space-4) 0' }}>
              You&apos;re in. Hackathons every Monday, straight to your inbox.
            </p>
          ) : (
            <form
              onSubmit={handleEmailSubmit}
              style={{
                display: 'flex',
                border: `1.5px solid ${emailFocused ? 'var(--color-moss)' : 'var(--color-border-default)'}`,
                borderRadius: 'var(--radius-pill)',
                overflow: 'hidden',
                backgroundColor: 'var(--color-bg-surface)',
                transition: 'border-color var(--duration-base)',
              }}
            >
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                placeholder="Enter your email to access hackathon opportunities"
                required
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: 'none',
                  outline: 'none',
                  padding: '0 var(--space-5)',
                  height: '48px',
                  backgroundColor: 'transparent',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-primary)',
                }}
              />
              <button
                type="submit"
                style={{
                  flexShrink: 0,
                  height: '48px',
                  padding: '0 var(--space-5)',
                  backgroundColor: 'var(--color-moss)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 500,
                  fontSize: 'var(--text-sm)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background-color var(--duration-base)',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-moss-light)')}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-moss)')}
              >
                Get Free Access →
              </button>
            </form>
          )}
        </div>

      </div>
    </section>
  );
}
