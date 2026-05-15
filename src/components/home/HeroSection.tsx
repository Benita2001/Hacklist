'use client';

import { useState, useEffect, useRef } from 'react';
import { Hackathon } from '@/lib/types';
import { parsePrizeToNumber } from '@/lib/utils';

interface HeroSectionProps {
  hackathons: Hackathon[];
}

export function HeroSection({ hackathons }: HeroSectionProps) {
  const [email, setEmail]               = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [status, setStatus]             = useState<'idle' | 'loading' | 'success' | 'already_subscribed' | 'error'>('idle');
  const [isMobile, setIsMobile]         = useState(false);
  const prizeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || status === 'loading') return;
    setStatus('loading');
    try {
      const res  = await fetch('/api/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json() as { success: boolean; message?: string };
      if (data.success && data.message === 'already_subscribed') setStatus('already_subscribed');
      else if (data.success)                                       setStatus('success');
      else                                                         setStatus('error');
    } catch {
      setStatus('error');
    }
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
            className="font-serif hero-prize-number"
            style={{
              fontWeight: 400,
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
          {status === 'success' ? (
            <div
              className="animate-fade-in"
              style={{
                textAlign:       'center',
                padding:         'var(--space-6)',
                backgroundColor: 'var(--color-bg-surface)',
                border:          '1px solid var(--color-border-default)',
                borderRadius:    'var(--radius-lg)',
              }}
            >
              {/* Checkmark */}
              <div
                style={{
                  width:           '44px',
                  height:          '44px',
                  borderRadius:    '50%',
                  backgroundColor: 'var(--color-accent-bg)',
                  border:          '1px solid var(--color-accent-border)',
                  display:         'flex',
                  alignItems:      'center',
                  justifyContent:  'center',
                  margin:          '0 auto var(--space-4)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M4 10L8 14L16 6" stroke="var(--color-moss)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Headline */}
              <p
                className="font-serif"
                style={{
                  fontSize:      '24px',
                  fontWeight:    400,
                  color:         'var(--color-text-primary)',
                  letterSpacing: '-0.01em',
                  marginBottom:  'var(--space-3)',
                }}
              >
                You&apos;re in🎉
              </p>

              {/* Body */}
              <p
                style={{
                  fontSize:     'var(--text-sm)',
                  color:        'var(--color-text-muted)',
                  lineHeight:   'var(--leading-relaxed)',
                  marginBottom: 'var(--space-5)',
                }}
              >
                Check your inbox every Monday for new hackathons, closing-soon alerts and opportunities.
              </p>

              {/* Divider */}
              <div style={{ height: '1px', backgroundColor: 'var(--color-border-default)', marginBottom: 'var(--space-4)' }} />

              {/* Telegram */}
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                Join the conversation on{' '}
                <a
                  href="https://t.me/hacklistwithbeni"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--color-moss)', fontWeight: 500, textDecoration: 'none' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline')}
                  onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none')}
                >
                  Telegram
                </a>
              </p>
            </div>
          ) : status === 'already_subscribed' ? (
            <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-moss)', padding: 'var(--space-4) 0' }}>
              You&apos;re already on the list.
            </p>
          ) : (
            <>
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
                  placeholder={isMobile ? 'Your email' : 'Enter your email to access hackathon opportunities'}
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
                  disabled={status === 'loading'}
                  style={{
                    flexShrink: 0,
                    height: '48px',
                    padding: '0 var(--space-5)',
                    backgroundColor: 'var(--color-moss)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 500,
                    fontSize: 'var(--text-sm)',
                    cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'background-color var(--duration-base)',
                    opacity: status === 'loading' ? 0.7 : 1,
                  }}
                  onMouseEnter={e => { if (status !== 'loading') (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-moss-light)'; }}
                  onMouseLeave={e => { if (status !== 'loading') (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-moss)'; }}
                >
                  {status === 'loading' ? 'Subscribing...' : 'Get Free Access →'}
                </button>
              </form>
              {status === 'error' && (
                <p style={{ textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-danger-text)', marginTop: 'var(--space-2)' }}>
                  Something went wrong. Please try again.
                </p>
              )}
            </>
          )}
        </div>

      </div>
    </section>
  );
}
