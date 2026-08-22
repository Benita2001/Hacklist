import type { NormalizedObservation } from '../connectors/types.ts';
import type { BenchmarkCase, ShadowGateResult, ShadowMetrics } from './types.ts';

type SmallMetrics = Omit<ShadowMetrics, 'bySource' | 'byCategory'>;

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 1 : numerator / denominator;
}

function summarize(observations: NormalizedObservation[], benchmark: BenchmarkCase[]): SmallMetrics {
  const expected = benchmark.filter((item) => item.expectedDetected && item.manuallyReviewed).length;
  const detectedIds = new Set(observations.map((item) => item.sourceItemId));
  const truePositives = benchmark.filter((item) => item.manuallyReviewed && item.expectedDetected && detectedIds.has(item.expectedItemId)).length;
  const falsePositives = observations.filter((item) => !benchmark.some((expectedItem) => expectedItem.manuallyReviewed && expectedItem.expectedItemId === item.sourceItemId)).length;
  const duplicateCount = observations.length - detectedIds.size;
  const evidenceCompleteCount = observations.filter((item) => item.evidence.length > 0).length;
  return {
    detected: observations.length,
    expected,
    truePositives,
    falsePositives,
    duplicateCount,
    evidenceCompleteCount,
    detectionCoverage: ratio(truePositives, expected),
    publicationPrecision: ratio(truePositives, truePositives + falsePositives),
    duplicateRate: ratio(duplicateCount, observations.length),
    evidenceCoverage: ratio(evidenceCompleteCount, observations.length),
  };
}

export function buildShadowMetrics(observations: NormalizedObservation[], benchmark: BenchmarkCase[]): ShadowMetrics {
  const base = summarize(observations, benchmark);
  const bySource: Record<string, SmallMetrics> = {};
  const byCategory: Record<string, SmallMetrics> = {};
  const sources = new Set([...observations.map((item) => item.sourceId), ...benchmark.map((item) => item.sourceId)]);
  for (const sourceId of sources) bySource[sourceId] = summarize(observations.filter((item) => item.sourceId === sourceId), benchmark.filter((item) => item.sourceId === sourceId));
  const categories = new Set([...observations.map((item) => item.opportunityType), ...benchmark.map((item) => item.category)]);
  for (const category of categories) byCategory[category] = summarize(observations.filter((item) => item.opportunityType === category), benchmark.filter((item) => item.category === category));
  return { ...base, bySource, byCategory };
}

export function evaluateShadowGates(metrics: ShadowMetrics): ShadowGateResult {
  const failures: string[] = [];
  if (metrics.detectionCoverage < 0.8) failures.push('detection_coverage_below_80_percent');
  if (metrics.publicationPrecision < 0.98) failures.push('publication_precision_below_98_percent');
  if (metrics.duplicateRate >= 0.01) failures.push('duplicate_rate_at_or_above_1_percent');
  if (metrics.evidenceCoverage < 1) failures.push('evidence_coverage_below_100_percent');
  return { passed: failures.length === 0, failures, metrics };
}
