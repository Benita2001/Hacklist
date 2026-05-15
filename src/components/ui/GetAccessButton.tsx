'use client';

import { useState, useRef, useEffect } from 'react';

interface GetAccessButtonProps {
  variant?: 'pill' | 'inline';
}

export function GetAccessButton({ variant = 'pill' }: GetAccessButtonProps) {
  const [open, setOpen]   = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'already_subscribed' | 'error'>('idle');
  const inputRef  = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  /* Focus input when modal opens */
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  /* Close on Escape */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
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

  const buttonContent = 'Get Free Access →';

  return (
    <>
      {/* Trigger button */}
      {variant === 'pill' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center"
          style={{
            height: '32px',
            padding: '0 var(--space-4)',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--color-moss)',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            color: '#FFFFFF',
            cursor: 'pointer',
            border: 'none',
            transition: 'background-color var(--duration-base)',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-moss-light)')}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-moss)')}
        >
          {buttonContent}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={[
            'text-[color:var(--color-text-secondary)]',
            'hover:text-[color:var(--color-text-primary)]',
            'transition-colors duration-[var(--duration-base)]',
          ].join(' ')}
          style={{ fontSize: 'var(--text-sm)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          {buttonContent}
        </button>
      )}

      {/* Modal overlay */}
      {open && (
        <div
          ref={overlayRef}
          onClick={(e) => { if (e.target === overlayRef.current) setOpen(false); }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 'var(--z-modal)' as never,
            backgroundColor: 'rgba(26, 30, 10, 0.60)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-4)',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Get free access"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border-default)',
              padding: 'var(--space-8)',
              width: '100%',
              maxWidth: '460px',
              position: 'relative',
            }}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: 'var(--space-4)',
                right: 'var(--space-4)',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)')}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            {status === 'success' ? (
              /* Success state */
              <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
                <div
                  style={{
                    width: '44px', height: '44px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-success-bg)',
                    border: '1px solid var(--color-success-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto var(--space-4)',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M3.5 9L7 12.5L14.5 5" stroke="var(--color-success)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3
                  className="font-serif"
                  style={{ fontSize: 'var(--text-xl)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}
                >
                  You&apos;re in.
                </h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-moss)', fontWeight: 500, lineHeight: 'var(--leading-relaxed)' }}>
                  See you Monday.
                </p>
              </div>
            ) : status === 'already_subscribed' ? (
              /* Already subscribed state */
              <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
                <h3
                  className="font-serif"
                  style={{ fontSize: 'var(--text-xl)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}
                >
                  You&apos;re already on the list.
                </h3>
              </div>
            ) : (
              /* Form state */
              <>
                <h3
                  className="font-serif"
                  style={{
                    fontSize: 'var(--text-2xl)',
                    fontWeight: 400,
                    color: 'var(--color-text-primary)',
                    lineHeight: 'var(--leading-snug)',
                    marginBottom: 'var(--space-2)',
                    paddingRight: 'var(--space-8)',
                  }}
                >
                  Stay ahead of every deadline.
                </h3>
                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 'var(--leading-relaxed)',
                    marginBottom: 'var(--space-6)',
                  }}
                >
                  We share new hackathons, closing-soon alerts, opportunities, and AI updates every Monday.
                </p>

                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <input
                      ref={inputRef}
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Enter your email to access opportunities"
                      required
                      style={{
                        flex: 1,
                        height: '40px',
                        padding: '0 var(--space-3)',
                        borderRadius: 'var(--radius-pill)',
                        border: '1px solid var(--color-border-default)',
                        backgroundColor: 'var(--color-bg-surface)',
                        color: 'var(--color-text-primary)',
                        fontSize: 'var(--text-base)',
                        outline: 'none',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-border-focus)')}
                      onBlur={e  => (e.currentTarget.style.borderColor = 'var(--color-border-default)')}
                    />
                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      style={{
                        height: '40px',
                        padding: '0 var(--space-4)',
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor: 'var(--color-moss)',
                        color: '#FFFFFF',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 500,
                        border: 'none',
                        cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'background-color var(--duration-base)',
                        opacity: status === 'loading' ? 0.7 : 1,
                      }}
                      onMouseEnter={e => { if (status !== 'loading') (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-moss-light)'; }}
                      onMouseLeave={e => { if (status !== 'loading') (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-moss)'; }}
                    >
                      {status === 'loading' ? 'Subscribing...' : 'Get Access'}
                    </button>
                  </div>
                  {status === 'error' && (
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger-text)', marginTop: 'var(--space-2)' }}>
                      Something went wrong. Please try again.
                    </p>
                  )}
                </form>

              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
