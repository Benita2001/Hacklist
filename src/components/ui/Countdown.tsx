'use client';

import { useEffect, useState } from 'react';
import { getDaysRemaining, getCountdownUrgency } from '@/lib/utils';

interface CountdownProps {
  deadline: string | null;
}

export function Countdown({ deadline }: CountdownProps) {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDays(deadline ? getDaysRemaining(deadline) : null);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [deadline]);

  if (!deadline) return null;

  if (days === null) return null;

  const urgency = getCountdownUrgency(days);

  if (urgency === 'hidden') return null;

  const isUrgent  = urgency === 'urgent';
  const isWarning = urgency === 'warning';
  const className = isUrgent ? 'countdown-urgent' : isWarning ? 'countdown-warning' : 'countdown-normal';
  const label     = days === 1 ? '1 day left' : `${days} days left`;

  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
    >
      {isUrgent && (
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-danger-text)',
            flexShrink: 0,
          }}
        />
      )}
      <span>{label}</span>
    </span>
  );
}
