import type { OpportunitySubmission } from '../opportunities/types.ts';
import type { ConnectorContext, ConnectorResult, DocumentResponse, OpportunityConnector, SubmissionConnectorInput } from './types.ts';
import { stableContentHash } from './hash.ts';
import { parseFeedXml, parseJsonLdHtml, parseSitemapXml, sourceHash, toObservation, type ParsedItem } from './parsers.ts';
import { fetchDocument, responseMetadata } from './transport.ts';

const DEFAULT_PARSER_VERSION = 'stage4-v1';

function nowFor(context: ConnectorContext): string {
  return context.now ?? new Date().toISOString();
}

function metrics(startedAt: number, requests: number, bytes: number, changed: boolean, skippedUnchanged: boolean, observations: number): ConnectorResult['metrics'] {
  return {
    requests,
    bytes,
    changed,
    skippedUnchanged,
    observations,
    durationMs: Math.max(0, Date.now() - startedAt),
    costUnits: requests + (bytes / (1024 * 1024)),
  };
}

function unchangedResult(context: ConnectorContext, response: DocumentResponse, startedAt: number): ConnectorResult {
  return {
    observations: [],
    sourceContentHash: context.previous?.contentHash,
    etag: response.headers.etag,
    lastModified: response.headers['last-modified'],
    metrics: metrics(startedAt, 1, 0, false, true, 0),
    warnings: [],
  };
}

async function fetchAndParse(
  context: ConnectorContext,
  parse: (body: string, baseUrl: string) => ParsedItem[],
): Promise<ConnectorResult> {
  const startedAt = Date.now();
  const response = await fetchDocument(context, { url: context.sourceUrl });
  if (response.status === 304) return unchangedResult(context, response, startedAt);
  const bodyHash = sourceHash(response.body);
  if (context.previous?.contentHash && context.previous.contentHash === bodyHash) {
    return {
      ...unchangedResult(context, response, startedAt),
      sourceContentHash: bodyHash,
    };
  }
  const items = parse(response.body, context.sourceUrl);
  const parserVersion = context.parserVersion ?? DEFAULT_PARSER_VERSION;
  const observations = items.map((item) => toObservation(context.sourceId, item, nowFor(context), parserVersion, responseMetadata(response)));
  return {
    observations,
    sourceContentHash: bodyHash,
    etag: response.headers.etag,
    lastModified: response.headers['last-modified'],
    nextCursor: observations.at(-1)?.sourceItemId,
    metrics: metrics(startedAt, 1, new TextEncoder().encode(response.body).byteLength, true, false, observations.length),
    warnings: observations.length === 0 ? [{ code: 'no_observations', message: 'The source returned no supported observations.' }] : [],
  };
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function remoteItem(
  sourceId: string,
  id: string,
  url: string,
  payload: Record<string, unknown>,
  parserVersion: string,
  now: string,
  metadata: Record<string, string>,
): ReturnType<typeof toObservation> {
  const item: ParsedItem = {
    id,
    url,
    title: stringValue(payload.title),
    description: stringValue(payload.description),
    observedAt: stringValue(payload.updatedAt) ?? stringValue(payload.publishedAt),
    type: payload.opportunityType === 'job' ? 'job' : payload.opportunityType === 'grant' ? 'grant' : 'unknown',
    payload,
    evidence: Object.entries(payload)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([fieldPath, observedValue]) => ({ fieldPath, observedValue, sourcePath: fieldPath, extractionMethod: 'structured_data' as const })),
  };
  return toObservation(sourceId, item, now, parserVersion, metadata);
}

function jsonArray(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === 'object'));
  if (!payload || typeof payload !== 'object') return [];
  const record = payload as Record<string, unknown>;
  for (const key of ['oppHits', 'opportunities', 'results', 'items', 'jobs', 'data']) {
    const nested = record[key];
    const result = jsonArray(nested);
    if (result.length > 0) return result;
  }
  return [];
}

async function fetchJson(context: ConnectorContext, request: { url: string; method?: 'GET' | 'POST'; body?: unknown }): Promise<{ response: DocumentResponse; payload: unknown; startedAt: number }> {
  const startedAt = Date.now();
  const response = await fetchDocument(context, {
    url: request.url,
    method: request.method,
    headers: { 'Content-Type': 'application/json' },
    body: request.body === undefined ? undefined : JSON.stringify(request.body),
  });
  if (response.status === 304) return { response, payload: null, startedAt };
  try {
    return { response, payload: JSON.parse(response.body) as unknown, startedAt };
  } catch {
    throw new Error('source_json_invalid');
  }
}

function jsonResult(context: ConnectorContext, response: DocumentResponse, startedAt: number, observations: ReturnType<typeof toObservation>[], body: string): ConnectorResult {
  const bodyHash = sourceHash(body);
  if (context.previous?.contentHash && context.previous.contentHash === bodyHash) {
    return { ...unchangedResult(context, response, startedAt), sourceContentHash: bodyHash };
  }
  return {
    observations,
    sourceContentHash: bodyHash,
    etag: response.headers.etag,
    lastModified: response.headers['last-modified'],
    nextCursor: observations.at(-1)?.sourceItemId,
    metrics: metrics(startedAt, 1, new TextEncoder().encode(body).byteLength, true, false, observations.length),
    warnings: observations.length === 0 ? [{ code: 'no_observations', message: 'The source returned no supported observations.' }] : [],
  };
}

export function createSubmissionConnector(input: SubmissionConnectorInput): OpportunityConnector {
  return {
    id: 'direct-submissions',
    async discover(context): Promise<ConnectorResult> {
      const now = nowFor(context);
      const parserVersion = context.parserVersion ?? DEFAULT_PARSER_VERSION;
      const observations = input.submissions.map((submission) => {
        const payload = submissionPayload(submission);
        const id = `submission:${stableContentHash(JSON.stringify(payload))}`;
        return remoteItem(input.sourceId, id, submission.applyUrl, payload, parserVersion, now, { 'content-type': 'application/json' });
      });
      return {
        observations,
        metrics: metrics(Date.now(), 0, 0, true, false, observations.length),
        warnings: [],
      };
    },
  };
}

function submissionPayload(submission: OpportunitySubmission): Record<string, unknown> {
  return {
    opportunityType: submission.opportunityType,
    title: submission.opportunityName,
    organizer: submission.organizer,
    applicationUrl: submission.applyUrl,
    category: submission.category,
    description: submission.description || undefined,
    deadline: submission.deadline || undefined,
    prizeOrFunding: submission.prizePool || undefined,
    format: submission.format || undefined,
    details: submission.details,
  };
}

export function createRssAtomConnector(): OpportunityConnector {
  return { id: 'rss-atom', discover: (context) => fetchAndParse(context, parseFeedXml) };
}

export function createSitemapConnector(): OpportunityConnector {
  return { id: 'sitemap', discover: (context) => fetchAndParse(context, parseSitemapXml) };
}

export function createJsonLdConnector(): OpportunityConnector {
  return { id: 'json-ld', discover: (context) => fetchAndParse(context, parseJsonLdHtml) };
}

export function createGrantsGovConnector(query: Record<string, unknown> = { keyword: 'technology' }): OpportunityConnector {
  return {
    id: 'grants-gov',
    async discover(context): Promise<ConnectorResult> {
      const { response, payload, startedAt } = await fetchJson(context, { url: context.sourceUrl || 'https://api.grants.gov/v1/api/search2', method: 'POST', body: query });
      if (response.status === 304) return unchangedResult(context, response, startedAt);
      const items = jsonArray(payload);
      const parserVersion = context.parserVersion ?? DEFAULT_PARSER_VERSION;
      const observations = items.flatMap((item, index) => {
        const id = stringValue(item.opportunityId ?? item.opportunityNumber ?? item.id) ?? `grant-${index}`;
        const url = stringValue(item.url ?? item.opportunityUrl ?? item.link) ?? `https://www.grants.gov/search-results-detail/${encodeURIComponent(id)}`;
        const title = stringValue(item.opportunityTitle ?? item.title ?? item.name);
        if (!title) return [];
        return [remoteItem(context.sourceId, id, url, {
          opportunityType: 'grant',
          title,
          organizer: stringValue(item.agencyName ?? item.agency),
          description: stringValue(item.description ?? item.synopsis),
          applicationUrl: url,
          announcementAt: stringValue(item.openDate ?? item.postDate),
          deadline: stringValue(item.closeDate ?? item.closeDateText),
          eligibility: stringValue(item.eligibility),
        }, parserVersion, nowFor(context), responseMetadata(response))];
      });
      return jsonResult(context, response, startedAt, observations, response.body);
    },
  };
}

export function createGreenhouseConnector(boardToken: string): OpportunityConnector {
  return {
    id: 'greenhouse',
    async discover(context): Promise<ConnectorResult> {
      const endpoint = context.sourceUrl || `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs?content=true`;
      const { response, payload, startedAt } = await fetchJson(context, { url: endpoint });
      if (response.status === 304) return unchangedResult(context, response, startedAt);
      const items = jsonArray(payload);
      const parserVersion = context.parserVersion ?? DEFAULT_PARSER_VERSION;
      const observations = items.flatMap((item, index) => {
        const id = stringValue(item.id) ?? `greenhouse-${index}`;
        const url = stringValue(item.absolute_url ?? item.url);
        const title = stringValue(item.title);
        if (!url || !title) return [];
        const location = stringValue(objectValue(item.location).name);
        return [remoteItem(context.sourceId, `greenhouse:${id}`, url, {
          opportunityType: 'job',
          title,
          description: stringValue(item.content ?? item.description),
          applicationUrl: url,
          location,
          updatedAt: stringValue(item.updated_at),
          departments: item.departments,
          offices: item.offices,
        }, parserVersion, nowFor(context), responseMetadata(response))];
      });
      return jsonResult(context, response, startedAt, observations, response.body);
    },
  };
}

export function createLeverConnector(site: string, eu = false): OpportunityConnector {
  return {
    id: 'lever',
    async discover(context): Promise<ConnectorResult> {
      const endpoint = context.sourceUrl || `https://${eu ? 'api.eu.lever.co' : 'api.lever.co'}/v0/postings/${encodeURIComponent(site)}?mode=json`;
      const { response, payload, startedAt } = await fetchJson(context, { url: endpoint });
      if (response.status === 304) return unchangedResult(context, response, startedAt);
      const items = jsonArray(payload);
      const parserVersion = context.parserVersion ?? DEFAULT_PARSER_VERSION;
      const observations = items.flatMap((item, index) => {
        const id = stringValue(item.id) ?? `lever-${index}`;
        const url = stringValue(item.hostedUrl ?? item.applyUrl);
        const title = stringValue(item.text ?? item.title);
        if (!url || !title) return [];
        const categories = objectValue(item.categories);
        return [remoteItem(context.sourceId, `lever:${id}`, url, {
          opportunityType: 'job',
          title,
          description: stringValue(item.descriptionPlain ?? item.description),
          applicationUrl: stringValue(item.applyUrl) ?? url,
          location: stringValue(categories.location),
          workplaceType: stringValue(item.workplaceType),
          commitment: stringValue(categories.commitment),
          team: stringValue(categories.team),
          salaryRange: item.salaryRange,
        }, parserVersion, nowFor(context), responseMetadata(response))];
      });
      return jsonResult(context, response, startedAt, observations, response.body);
    },
  };
}
