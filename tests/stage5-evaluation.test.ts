import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyObservation } from '../src/domain/evaluation/classify.ts';
import { findDuplicateGroups, applyDuplicateRisk } from '../src/domain/evaluation/dedup.ts';
import { evaluateObservation, toReviewCase } from '../src/domain/evaluation/evaluate.ts';
import { buildShadowMetrics, evaluateShadowGates } from '../src/domain/evaluation/shadow.ts';
import type { NormalizedObservation } from '../src/domain/connectors/types.ts';

function observation(overrides: Partial<NormalizedObservation> = {}): NormalizedObservation {
  return {
    sourceId: 'official-source',
    sourceItemId: 'item-1',
    canonicalSourceUrl: 'https://official.example/opportunities/1',
    observedAt: '2026-08-21T12:00:00.000Z',
    contentHash: 'hash-1',
    parserVersion: 'stage4-v1',
    opportunityType: 'unknown',
    normalizedPayload: {
      title: 'Open Builder Hackathon',
      organizer: 'Official Organizer',
      applicationUrl: 'https://official.example/opportunities/1',
      deadline: '2026-10-01',
      description: 'Build and ship with the official community.',
    },
    evidence: [
      { fieldPath: 'title', observedValue: 'Open Builder Hackathon', sourcePath: 'jsonld.name', extractionMethod: 'structured_data' },
      { fieldPath: 'organizer', observedValue: 'Official Organizer', sourcePath: 'jsonld.organizer.name', extractionMethod: 'structured_data' },
      { fieldPath: 'applicationUrl', observedValue: 'https://official.example/opportunities/1', sourcePath: 'jsonld.url', extractionMethod: 'structured_data' },
      { fieldPath: 'deadline', observedValue: '2026-10-01', sourcePath: 'jsonld.endDate', extractionMethod: 'structured_data' },
      { fieldPath: 'description', observedValue: 'Build and ship with the official community.', sourcePath: 'jsonld.description', extractionMethod: 'structured_data' },
    ],
    httpMetadata: { 'content-type': 'text/html' },
    ...overrides,
  };
}

test('classification stays deterministic and routes ambiguity to unknown', () => {
  assert.equal(classifyObservation(observation()).type, 'hackathon');
  assert.equal(classifyObservation(observation({ normalizedPayload: { title: 'Engineer bounty job', description: '' } })).type, 'unknown');
});

test('evaluation requires evidence and never publishes an unresolved organizer', () => {
  const result = evaluateObservation(observation(), { sourceTrust: 'official', verifiedOrganizerDomains: ['official.example'], now: '2026-08-22T12:00:00.000Z' });
  assert.equal(result.proposedPublicationState, 'provisional');
  assert.equal(result.evidenceCompleteness, 1);
  assert.equal(result.reviewRequired, false);

  const missing = evaluateObservation(observation({ normalizedPayload: { title: 'Open Builder Hackathon' }, evidence: [] }), { sourceTrust: 'official', now: '2026-08-22T12:00:00.000Z' });
  assert.equal(missing.proposedPublicationState, 'review');
  assert.equal(missing.reviewRequired, true);
  assert.ok(toReviewCase(missing));
});

test('deduplication is exact first and conservative fuzzy second', () => {
  const first = observation();
  const exact = observation({ sourceItemId: 'item-2' });
  const fuzzy = observation({ sourceItemId: 'item-3', canonicalSourceUrl: 'https://partner.example/other', normalizedPayload: { ...first.normalizedPayload, applicationUrl: 'https://partner.example/other' } });
  const exactGroups = findDuplicateGroups([first, exact]);
  assert.ok(exactGroups.some((group) => group.reason === 'exact_url'));
  const fuzzyGroups = findDuplicateGroups([first, fuzzy]);
  assert.ok(fuzzyGroups.some((group) => group.reason === 'conservative_fuzzy'));
  const results = applyDuplicateRisk([evaluateObservation(first, { sourceTrust: 'official' }), evaluateObservation(exact, { sourceTrust: 'official' })], exactGroups);
  assert.equal(results[0].reviewRequired, true);
  assert.equal(results[0].proposedPublicationState, 'review');
});

test('shadow metrics use manually reviewed benchmarks and enforce launch gates', () => {
  const observations = [observation(), observation({ sourceItemId: 'false-positive', normalizedPayload: { title: 'Unreviewed item' }, evidence: [] })];
  const metrics = buildShadowMetrics(observations, [
    { id: 'benchmark-1', sourceId: 'official-source', category: 'hackathon', expectedItemId: 'item-1', expectedDetected: true, manuallyReviewed: true },
    { id: 'benchmark-2', sourceId: 'official-source', category: 'grant', expectedItemId: 'missing', expectedDetected: true, manuallyReviewed: true },
  ]);
  assert.equal(metrics.truePositives, 1);
  assert.equal(metrics.falsePositives, 1);
  assert.equal(evaluateShadowGates(metrics).passed, false);
  assert.ok(evaluateShadowGates(metrics).failures.includes('detection_coverage_below_80_percent'));
});
