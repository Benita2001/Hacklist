function stableHash(value: string): string {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function jobIdempotencyKey(queue: string, sourceId: string, itemId: string, contentHash: string): string {
  const input = [queue, sourceId, itemId, contentHash].map((value) => value.trim()).join(':');
  return `job:${stableHash(input)}:${stableHash(input.split('').reverse().join(''))}`;
}

export function notificationIdempotencyKey(userId: string, channel: string, opportunityId: string, version: number, reason: string): string {
  return `notification:${userId}:${channel}:${opportunityId}:${version}:${reason}`.slice(0, 500);
}
