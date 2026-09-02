'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type IntentKind = 'save' | 'follow';

type OpportunityIntentActionsProps = {
  opportunityId: string;
  returnTo: string;
};

type SessionResponse = {
  authenticated?: boolean;
};

export function OpportunityIntentActions({ opportunityId, returnTo }: OpportunityIntentActionsProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [pending, setPending] = useState<IntentKind | null>(null);
  const [message, setMessage] = useState('');
  const loginHref = `/login?next=${encodeURIComponent(returnTo)}`;

  async function manageIntent(kind: IntentKind) {
    if (pending) return;
    setPending(kind);
    setMessage('');

    try {
      const sessionResponse = await fetch('/api/auth/session', { cache: 'no-store' });
      const session = await sessionResponse.json() as SessionResponse;
      if (!sessionResponse.ok || !session.authenticated) {
        router.push(loginHref);
        return;
      }

      const active = kind === 'save' ? saved : following;
      const response = await fetch(`/api/me/${kind === 'save' ? 'saves' : 'follows'}`, {
        method: active ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity_id: opportunityId, return_to: returnTo }),
      });
      const body = await response.json() as { ok?: boolean };

      if (response.status === 401) {
        router.push(loginHref);
        return;
      }
      if (!response.ok || !body.ok) {
        setMessage('This action is temporarily unavailable. Please try again.');
        return;
      }

      if (kind === 'save') setSaved(!active);
      else setFollowing(!active);
    } catch {
      setMessage('This action is temporarily unavailable. Please try again.');
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="opportunity-intent-actions" aria-label="Personal opportunity actions">
      <div className="opportunity-intent-actions__buttons">
        <button
          type="button"
          className="opportunity-intent-actions__button"
          onClick={() => manageIntent('save')}
          disabled={pending !== null}
        >
          {pending === 'save' ? 'Saving...' : saved ? 'Saved' : 'Save opportunity'}
        </button>
        <button
          type="button"
          className="opportunity-intent-actions__button"
          onClick={() => manageIntent('follow')}
          disabled={pending !== null}
        >
          {pending === 'follow' ? 'Following...' : following ? 'Following' : 'Follow updates'}
        </button>
      </div>
      <p className="opportunity-intent-actions__note">
        <Link href={loginHref}>Sign in</Link> to save, follow, and manage alerts.
      </p>
      {message && <p className="opportunity-intent-actions__message" role="status">{message}</p>}
    </div>
  );
}
