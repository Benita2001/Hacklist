import type { ConnectorContext, DocumentRequest, DocumentResponse } from './types.ts';

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_RESPONSE_BYTES = 5 * 1024 * 1024;

function isPrivateIpv4(hostname: string): boolean {
  const octets = hostname.split('.').map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b] = octets;
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

export function assertSafeSourceUrl(value: string): URL {
  const url = new URL(value);
  const hostname = url.hostname.toLowerCase();
  if (url.protocol !== 'https:') throw new Error('source_url_must_use_https');
  if (url.username || url.password) throw new Error('source_url_credentials_not_allowed');
  if (url.port && url.port !== '443') throw new Error('source_url_port_not_allowed');
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local') || hostname === 'metadata.google.internal') {
    throw new Error('source_url_private_hostname_not_allowed');
  }
  if (isPrivateIpv4(hostname) || hostname === '::1' || hostname.startsWith('fc') || hostname.startsWith('fd')) {
    throw new Error('source_url_private_address_not_allowed');
  }
  return url;
}

export async function defaultDocumentFetcher(request: DocumentRequest, timeoutMs: number, maxBytes: number): Promise<DocumentResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(request.url, {
      method: request.method ?? 'GET',
      headers: request.headers,
      body: request.body,
      redirect: 'manual',
      signal: controller.signal,
    });
    const body = await response.text();
    const bytes = new TextEncoder().encode(body).byteLength;
    if (bytes > maxBytes) throw new Error('source_response_too_large');
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => { headers[key.toLowerCase()] = value; });
    return { status: response.status, headers, body };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchDocument(context: ConnectorContext, request: DocumentRequest): Promise<DocumentResponse> {
  assertSafeSourceUrl(request.url);
  const headers = { ...(request.headers ?? {}) };
  if (context.previous?.etag) headers['If-None-Match'] = context.previous.etag;
  if (context.previous?.lastModified) headers['If-Modified-Since'] = context.previous.lastModified;
  const fetcher = context.fetcher ?? defaultDocumentFetcher;
  const response = await fetcher(
    { ...request, headers: { Accept: 'application/json, application/xml, text/xml, text/html;q=0.9', ...headers } },
    context.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    context.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES,
  );
  if (response.status >= 300 && response.status < 400) throw new Error('source_redirect_not_allowed');
  if (response.status !== 304 && (response.status < 200 || response.status >= 300)) {
    throw new Error(`source_http_${response.status}`);
  }
  return response;
}

export function responseMetadata(response: DocumentResponse): Record<string, string> {
  const metadata: Record<string, string> = {};
  for (const key of ['content-type', 'etag', 'last-modified', 'cache-control']) {
    if (response.headers[key]) metadata[key] = response.headers[key];
  }
  return metadata;
}
