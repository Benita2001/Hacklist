import { format, parseISO } from "date-fns";

export function getDaysRemaining(deadline: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  return Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getCountdownUrgency(
  days: number
): "hidden" | "urgent" | "warning" | "muted" {
  if (days <= 0) return "hidden";
  if (days <= 7) return "urgent";
  if (days <= 14) return "warning";
  return "muted";
}

export function formatPrize(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return format(parseISO(dateString), "MMM d, yyyy");
}

export function isExpired(deadline: string): boolean {
  return getDaysRemaining(deadline) <= 0;
}

export function getSourceLabel(platform: string): string {
  const labels: Record<string, string> = {
    devpost: "Devpost",
    dorahacks: "DoraHacks",
    lablab: "Lablab.ai",
    gitcoin: "Gitcoin",
    other: "Other",
  };
  return labels[platform] ?? platform;
}
