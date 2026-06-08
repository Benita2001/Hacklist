'use client';

import { useState } from 'react';

export function HeroSection() {
  const [email, setEmail]               = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [status, setStatus]             = useState<'idle' | 'loading' | 'success' | 'already_subscribed' | 'error'>('idle');

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
    <section style={{ paddingTop: 'var(--space-16)', paddingBottom: 'var(--space-6)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>

        {/* Headline */}
        <h1
          style={{
            fontSize: 'clamp(48px, 7vw, 72px)',
            lineHeight: 'var(--leading-tight)',
            letterSpacing: '-0.5px',
            margin: '0 auto var(--space-6)',
            fontWeight: 700,
          }}
        >
          <span style={{ display: 'block', fontWeight: 700, fontStyle: 'normal', color: 'var(--color-moss)' }}>
            The fastest way to find
          </span>
          <span style={{ display: 'block', fontWeight: 700, fontStyle: 'normal', color: 'var(--color-moss)' }}>
            AI &amp; Web3 opportunities
          </span>
          <em style={{ display: 'block', fontFamily: 'var(--font-fraunces)', fontWeight: 600, fontStyle: 'italic', color: 'var(--color-moss)', letterSpacing: 0 }}>
            worth your time
          </em>
        </h1>

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
              <p
                style={{
                  fontSize:   'var(--text-sm)',
                  color:      'var(--color-text-muted)',
                  lineHeight: 'var(--leading-relaxed)',
                }}
              >
                Check your inbox🎉<br />Your welcome email is on its way.
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
                  className="email-input"
                  placeholder="Enter your email for opportunities"
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

        {/* Category pills — between email input and spotlight */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '8px',
            marginTop: 'var(--space-6)',
          }}
        >
          {['Hackathons', 'Bounties', 'Grants', 'Programs', 'Jobs'].map(label => (
            <span
              key={label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '6px 16px',
                borderRadius: '20px',
                border: '1px solid #3D4820',
                backgroundColor: 'transparent',
                color: '#3D4820',
                fontSize: '13px',
                transition: 'background-color 200ms ease, color 200ms ease',
                cursor: 'default',
                userSelect: 'none',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLSpanElement;
                el.style.backgroundColor = '#3D4820';
                el.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLSpanElement;
                el.style.backgroundColor = 'transparent';
                el.style.color = '#3D4820';
              }}
            >
              {label}
            </span>
          ))}
        </div>

      </div>
    </section>
  );
}
