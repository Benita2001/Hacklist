import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import type { DocumentFetcher } from '../src/domain/connectors/types.ts';
import { createGrantsGovConnector, createGreenhouseConnector, createJsonLdConnector, createLeverConnector, createRssAtomConnector, createSitemapConnector, createSubmissionConnector } from '../src/domain/connectors/connectors.ts';
import { parseFeedXml, parseJsonLdHtml, parseSitemapXml } from '../src/domain/connectors/parsers.ts';
import { assertSafeSourceUrl } from '../src/domain/connectors/transport.ts';

const fixture = (name: string) => readFileSync(`tests/fixtures/connectors/${name}`, 'utf8');

function fetcherFor(body: string, contentType: string): DocumentFetcher {
  return async () => ({
    status: 200,
    headers: { 'content-type': contentType, etag: 'fixture-etag' },
    body,
  });
}

const context = (sourceUrl: string, fetcher: DocumentFetcher) => ({
  sourceId: 'source-fixture',
  sourceUrl,
  now: '2026-08-22T12:00:00.000Z',
  fetcher,
});

test('parsers produce deterministic feed, sitemap, and JSON-LD items', () => {
  assert.equal(parseFeedXml(fixture('feed.xml'), 'https://example.com/feed.xml').length, 1);
  assert.equal(parseFeedXml(fixture('atom.xml'), 'https://example.com/atom.xml')[0].title, 'Atom Builder Programme');
  assert.equal(parseSitemapXml(fixture('sitemap.xml'), 'https://example.com/sitemap.xml').length, 2);
  const jsonLd = parseJsonLdHtml(fixture('jsonld.html'), 'https://example.com/careers');
  assert.equal(jsonLd.length, 2);
  assert.equal(jsonLd[0].type, 'job');
  assert.equal(jsonLd[1].type, 'unknown');
});

test('all P0 connector adapters emit observations without writing public rows', async () => {
  const common = context('https://example.com/source', fetcherFor(fixture('feed.xml'), 'application/rss+xml'));
  const rss = await createRssAtomConnector().discover(common);
  assert.equal(rss.observations[0].sourceItemId, 'fixture-feed-1');
  assert.equal(rss.observations[0].opportunityType, 'unknown');

  const sitemap = await createSitemapConnector().discover(context('https://example.com/sitemap.xml', fetcherFor(fixture('sitemap.xml'), 'application/xml')));
  assert.equal(sitemap.observations.length, 2);

  const jsonLd = await createJsonLdConnector().discover(context('https://example.com/careers', fetcherFor(fixture('jsonld.html'), 'text/html')));
  assert.equal(jsonLd.observations.length, 2);
  assert.equal(jsonLd.observations[0].opportunityType, 'job');

  const grants = await createGrantsGovConnector({ keyword: 'technology' }).discover(context('https://api.grants.gov/v1/api/search2', fetcherFor(fixture('grants.json'), 'application/json')));
  assert.equal(grants.observations[0].opportunityType, 'grant');

  const greenhouse = await createGreenhouseConnector('example').discover(context('https://boards-api.greenhouse.io/v1/boards/example/jobs?content=true', fetcherFor(fixture('greenhouse.json'), 'application/json')));
  assert.equal(greenhouse.observations[0].opportunityType, 'job');

  const lever = await createLeverConnector('example').discover(context('https://api.lever.co/v0/postings/example?mode=json', fetcherFor(fixture('lever.json'), 'application/json')));
  assert.equal(lever.observations[0].opportunityType, 'job');

  const submission = createSubmissionConnector({
    sourceId: 'submissions',
    submissions: [{
      opportunityType: 'grant', opportunityName: 'Submitted grant', organizer: 'Organizer', applyUrl: 'https://example.com/apply', category: 'AI', description: 'Description', deadline: '', prizePool: '', format: 'Online', freeToEnter: 'Yes', isOrganizer: 'Yes', yourName: 'Owner', yourEmail: 'owner@example.com', telegramHandle: '', details: {},
    }],
  });
  const submitted = await submission.discover(context('https://example.com/submissions', fetcherFor('', 'application/json')));
  assert.equal(submitted.observations[0].opportunityType, 'grant');
  assert.equal(submitted.metrics.requests, 0);
  for (const result of [rss, sitemap, jsonLd, grants, greenhouse, lever, submitted]) {
    assert.ok(result.observations.every((observation) => observation.evidence.length > 0));
  }
});

test('connector replay skips an unchanged source using the source content hash', async () => {
  const source = fixture('feed.xml');
  const first = await createRssAtomConnector().discover(context('https://example.com/feed.xml', fetcherFor(source, 'application/rss+xml')));
  const replay = await createRssAtomConnector().discover({
    ...context('https://example.com/feed.xml', fetcherFor(source, 'application/rss+xml')),
    previous: { contentHash: first.sourceContentHash },
  });
  assert.equal(replay.observations.length, 0);
  assert.equal(replay.metrics.skippedUnchanged, true);
});

test('transport rejects unsafe source URLs before any fetch', () => {
  assert.throws(() => assertSafeSourceUrl('http://example.com/feed'), /https/);
  assert.throws(() => assertSafeSourceUrl('https://127.0.0.1/feed'), /private/);
  assert.throws(() => assertSafeSourceUrl('https://example.com:8443/feed'), /port/);
});
