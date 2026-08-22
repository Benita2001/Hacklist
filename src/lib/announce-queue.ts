import { getServerConfig } from '@/config/env';

export interface AnnounceBody {
  name:           string;
  organizer:      string;
  prize_pool:     string;
  deadline?:      string | null;
  deadline_text?: string | null;
  category:       string;
  format:         string;
  description:    string;
  apply_url:      string;
}

interface QueueItem {
  hackathon:   AnnounceBody;
  enqueuedAt:  number;
  scheduledAt: number;
}

const COOLDOWN_MS  = 60 * 60 * 1000; // 60 minutes

let lastSentAt: number | null = null;
const queue: QueueItem[] = [];

function he(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function sendToTelegram(body: AnnounceBody): Promise<void> {
  const config = getServerConfig();
  const token = config.telegramBotToken;
  const chatId = config.telegramChatId;
  if (!token || !chatId) throw new Error('telegram_not_configured');

  const deadlineDisplay = body.deadline_text || body.deadline || 'TBD';

  const message = `🆕 New on HackList

<b>${he(body.name)}</b>
Organizer: ${he(body.organizer)}
Prize Pool: ${he(body.prize_pool || 'Undisclosed')}
Deadline: ${he(deadlineDisplay)}
Category: ${he(body.category)} | ${he(body.format)}

${he(body.description || '')}

Apply → ${he(body.apply_url)}

Find more opportunities at hacklist.io

Join the HackList community <a href="https://t.me/hacklistchat">here</a>`;

  const res = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id:                  chatId,
        text:                     message,
        parse_mode:               'HTML',
        disable_web_page_preview: false,
      }),
      signal: AbortSignal.timeout(8_000),
    },
  );

  const data = await res.json() as { ok: boolean; description?: string };
  if (!data.ok) throw new Error(data.description ?? 'Telegram error');

  lastSentAt = Date.now();
  console.log(`[announce-queue] Sent "${body.name}" at ${new Date(lastSentAt).toISOString()}`);
}

export async function enqueueOrSend(
  hackathon: AnnounceBody,
): Promise<{ queued: boolean; scheduledAt?: string }> {
  if (!getServerConfig().announceEnabled) throw new Error('announcements_disabled');
  const now = Date.now();
  const canSend = lastSentAt === null || now - lastSentAt >= COOLDOWN_MS;

  if (canSend) {
    await sendToTelegram(hackathon);
    return { queued: false };
  }

  const scheduledAt = lastSentAt! + COOLDOWN_MS;
  queue.push({ hackathon, enqueuedAt: now, scheduledAt });
  console.log(
    `[announce-queue] Queued "${hackathon.name}" → scheduled ${new Date(scheduledAt).toISOString()}`,
  );
  return { queued: true, scheduledAt: new Date(scheduledAt).toISOString() };
}

export async function processQueue(): Promise<{ sent: number; remaining: number }> {
  if (!getServerConfig().announceEnabled) throw new Error('announcements_disabled');
  const now = Date.now();
  let sent = 0;

  while (queue.length > 0 && queue[0].scheduledAt <= now) {
    const item = queue.shift()!;
    try {
      await sendToTelegram(item.hackathon);
      sent++;
    } catch (err) {
      console.error(`[announce-queue] Failed to send "${item.hackathon.name}":`, err);
    }
  }

  return { sent, remaining: queue.length };
}

export function getQueueStatus() {
  return {
    lastSentAt: lastSentAt ? new Date(lastSentAt).toISOString() : null,
    cooldownEndsAt: lastSentAt ? new Date(lastSentAt + COOLDOWN_MS).toISOString() : null,
    queueLength: queue.length,
    items: queue.map(item => ({
      name:        item.hackathon.name,
      enqueuedAt:  new Date(item.enqueuedAt).toISOString(),
      scheduledAt: new Date(item.scheduledAt).toISOString(),
    })),
  };
}

// The queue is intentionally not auto-processed. In-process scheduling is not
// durable on serverless hosts; the approved worker must call processQueue.
