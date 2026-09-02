import type { ConnectorOpportunityType, NormalizedObservation, ObservationEvidence } from './types.ts';
import { stableContentHash } from './hash.ts';

export type ParsedItem = {
  id: string;
  url: string;
  title?: string;
  description?: string;
  observedAt?: string;
  type?: ConnectorOpportunityType;
  payload: Record<string, unknown>;
  evidence: ObservationEvidence[];
};

function decodeEntities(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .trim();
}

function plainText(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const cleaned = decodeEntities(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned || undefined;
}

function tagValue(block: string, tagNames: string[]): string | undefined {
  for (const tag of tagNames) {
    const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'));
    if (match?.[1]) return decodeEntities(match[1]);
  }
  return undefined;
}

function linkValue(block: string): string | undefined {
  const href = block.match(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*>/i)?.[1];
  return href ? decodeEntities(href) : tagValue(block, ['link', 'loc']);
}

function absoluteUrl(value: string | undefined, baseUrl: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value, baseUrl);
    return url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function fieldEvidence(payload: Record<string, unknown>, sourcePath: string, extractionMethod: ObservationEvidence['extractionMethod']): ObservationEvidence[] {
  return Object.entries(payload)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([fieldPath, observedValue]) => ({ fieldPath, observedValue, sourcePath, extractionMethod }));
}

export function parseFeedXml(body: string, baseUrl: string): ParsedItem[] {
  const blocks = [...body.matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((match) => match[2]);
  return blocks.flatMap((block, index) => {
    const url = absoluteUrl(linkValue(block), baseUrl);
    const title = plainText(tagValue(block, ['title']));
    if (!url || !title) return [];
    const description = plainText(tagValue(block, ['description', 'summary', 'content']));
    const observedAt = tagValue(block, ['pubDate', 'published', 'updated']);
    const payload = { title, description, applicationUrl: url, observedAt };
    return [{
      id: tagValue(block, ['guid', 'id']) ?? url ?? `item-${index}`,
      url,
      title,
      description,
      observedAt,
      type: 'unknown' as const,
      payload,
      evidence: fieldEvidence(payload, 'feed.item', 'parser'),
    }];
  });
}

export function parseSitemapXml(body: string, baseUrl: string): ParsedItem[] {
  const blocks = [...body.matchAll(/<url\b[^>]*>([\s\S]*?)<\/url>/gi)].map((match) => match[1]);
  return blocks.flatMap((block) => {
    const url = absoluteUrl(tagValue(block, ['loc']), baseUrl);
    if (!url) return [];
    const lastModified = tagValue(block, ['lastmod']);
    const payload = { sourceUrl: url, lastModified };
    return [{
      id: url,
      url,
      observedAt: lastModified,
      type: 'unknown' as const,
      payload,
      evidence: fieldEvidence(payload, 'sitemap.url', 'parser'),
    }];
  });
}

function jsonLdType(value: unknown): string {
  if (typeof value === 'string') return value.toLowerCase();
  if (Array.isArray(value)) return value.map((entry) => typeof entry === 'string' ? entry.toLowerCase() : '').join(' ');
  return '';
}

function jsonLdValue(value: unknown): unknown {
  if (value && typeof value === 'object' && '@value' in value) return (value as { '@value': unknown })['@value'];
  return value;
}

export function parseJsonLdHtml(body: string, baseUrl: string): ParsedItem[] {
  const scripts = [...body.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1].trim());
  const documents: Record<string, unknown>[] = [];
  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script.replace(/^<!--|-->$/g, '').trim()) as unknown;
      const values = Array.isArray(parsed) ? parsed : [parsed];
      for (const value of values) {
        if (value && typeof value === 'object' && Array.isArray((value as { '@graph'?: unknown[] })['@graph'])) {
          documents.push(...((value as { '@graph': unknown[] })['@graph'].filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === 'object'))));
        } else if (value && typeof value === 'object') {
          documents.push(value as Record<string, unknown>);
        }
      }
    } catch {
      // Invalid JSON-LD is reported by the connector as a warning, not made public.
    }
  }
  return documents.flatMap((document, index) => {
    const typeName = jsonLdType(document['@type']);
    if (!typeName.includes('event') && !typeName.includes('jobposting')) return [];
    const url = absoluteUrl(String(jsonLdValue(document.url) ?? document['@id'] ?? baseUrl), baseUrl);
    const title = String(jsonLdValue(document.name ?? document.headline ?? document.title) ?? '').trim();
    if (!url || !title) return [];
    const organizerValue = jsonLdValue(document.organizer);
    const organizer = organizerValue && typeof organizerValue === 'object'
      ? String(jsonLdValue((organizerValue as Record<string, unknown>).name) ?? '')
      : String(organizerValue ?? '');
    const locationValue = jsonLdValue(document.location);
    const location = locationValue && typeof locationValue === 'object'
      ? String(jsonLdValue((locationValue as Record<string, unknown>).name) ?? '')
      : String(locationValue ?? '');
    const payload = {
      title,
      description: plainText(String(jsonLdValue(document.description) ?? '')),
      organizer: organizer || undefined,
      applicationUrl: url,
      startAt: jsonLdValue(document.startDate),
      endAt: jsonLdValue(document.endDate),
      location: location || undefined,
      isRemote: location.toLowerCase().includes('remote') || undefined,
      structuredType: document['@type'],
    };
    return [{
      id: String(document['@id'] ?? url ?? `jsonld-${index}`),
      url,
      title,
      description: typeof payload.description === 'string' ? payload.description : undefined,
      observedAt: typeof payload.startAt === 'string' ? payload.startAt : undefined,
      type: typeName.includes('jobposting') ? 'job' as const : 'unknown' as const,
      payload,
      evidence: fieldEvidence(payload, 'jsonld', 'structured_data'),
    }];
  });
}

export function toObservation(
  sourceId: string,
  item: ParsedItem,
  now: string,
  parserVersion: string,
  httpMetadata: Record<string, string>,
): NormalizedObservation {
  const normalizedPayload = { ...item.payload, opportunityType: item.type ?? 'unknown' };
  return {
    sourceId,
    sourceItemId: item.id,
    canonicalSourceUrl: item.url,
    observedAt: item.observedAt ?? now,
    contentHash: stableContentHash(JSON.stringify(normalizedPayload)),
    parserVersion,
    opportunityType: item.type ?? 'unknown',
    normalizedPayload,
    evidence: item.evidence,
    httpMetadata,
  };
}

export function sourceHash(body: string): string {
  return stableContentHash(body);
}
