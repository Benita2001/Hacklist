import { format, parseISO } from 'date-fns';

export function getDaysRemaining(deadline: string | null): number {
  if (!deadline) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(deadline);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function isEndingToday(deadline: string | null): boolean {
  if (!deadline) return false;
  return deadline === new Date().toISOString().split('T')[0];
}

export function getCountdownUrgency(days: number): 'hidden' | 'urgent' | 'warning' | 'muted' {
  if (!isFinite(days) || days <= 0) return 'hidden';
  if (days <= 7)  return 'urgent';
  if (days <= 14) return 'warning';
  return 'muted';
}

export function parsePrizeToNumber(prizePool: string | null): number {
  if (!prizePool) return 0;
  const match = prizePool.replace(/,/g, '').match(/\$?(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export function formatPrize(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return format(parseISO(dateString), 'MMM d, yyyy');
}

export function isExpired(deadline: string | null): boolean {
  if (!deadline) return false;
  return getDaysRemaining(deadline) <= 0;
}
