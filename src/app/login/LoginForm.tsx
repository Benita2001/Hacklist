'use client';

import { useState } from 'react';

export function LoginForm({ nextPath, initialError }: { nextPath: string; initialError?: string }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(initialError ? 'That sign-in link is no longer valid. Request a new one.' : '');
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage('');
    try {
      const response = await fetch('/api/auth/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, return_to: nextPath }),
      });
      const body = await response.json() as { ok?: boolean; error?: string };
      setMessage(body.ok ? 'Check your email to continue.' : body.error === 'invalid_email' ? 'Enter a valid email address.' : 'Sign-in is temporarily unavailable. Please try again.');
    } catch {
      setMessage('Sign-in is temporarily unavailable. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: '16px', maxWidth: '420px' }}>
      <label htmlFor="email" style={{ display: 'grid', gap: '8px' }}>
        <span>Email address</span>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          style={{ padding: '13px 16px', borderRadius: '8px', border: '1px solid var(--color-border-muted)', background: 'var(--color-surface)' }}
        />
      </label>
      <button type="submit" disabled={pending} style={{ padding: '14px 18px', border: 0, borderRadius: '999px', background: 'var(--color-moss)', color: 'var(--btn-primary-text)', cursor: pending ? 'wait' : 'pointer' }}>
        {pending ? 'Sending...' : 'Send sign-in link'}
      </button>
      {message && <p role="status" style={{ margin: 0, color: 'var(--color-text-muted)' }}>{message}</p>}
    </form>
  );
}
