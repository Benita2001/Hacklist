import type { NormalizedObservation } from '../connectors/types.ts';
import type { EvaluationResult, RiskLevel } from './types.ts';

export type DuplicateGroup = {
  key: string;
  observations: NormalizedObservation[];
  risk: RiskLevel;
  reason: 'exact_url' | 'source_item' | 'conservative_fuzzy';
};

function normalize(value: unknown): string {
  return typeof value === 'string' ? value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() : '';
}

function canonicalUrl(observation: NormalizedObservation): string {
  const applicationUrl = observation.normalizedPayload.applicationUrl;
  return normalize(applicationUrl || observation.canonicalSourceUrl);
}

function fuzzyKey(observation: NormalizedObservation): string {
  return [normalize(observation.normalizedPayload.title), normalize(observation.normalizedPayload.organizer), normalize(observation.normalizedPayload.deadline)].join('|');
}

export function findDuplicateGroups(observations: NormalizedObservation[]): DuplicateGroup[] {
  const groups = new Map<string, DuplicateGroup>();
  for (const observation of observations) {
    const exactKey = canonicalUrl(observation);
    const sourceKey = `${observation.sourceId}:${observation.sourceItemId}`;
    const key = exactKey || sourceKey;
    const existing = groups.get(key);
    if (existing) existing.observations.push(observation);
    else groups.set(key, { key, observations: [observation], risk: 'low', reason: exactKey ? 'exact_url' : 'source_item' });
  }
  const output = [...groups.values()].filter((group) => group.observations.length > 1);
  const fuzzy = new Map<string, NormalizedObservation[]>();
  for (const observation of observations) {
    const key = fuzzyKey(observation);
    if (!key.replace(/\|/g, '')) continue;
    const values = fuzzy.get(key) ?? [];
    values.push(observation);
    fuzzy.set(key, values);
  }
  for (const [key, values] of fuzzy) {
    if (values.length > 1 && !output.some((group) => group.observations.some((item) => values.includes(item)))) {
      output.push({ key, observations: values, risk: 'medium', reason: 'conservative_fuzzy' });
    }
  }
  return output;
}

export function applyDuplicateRisk(results: EvaluationResult[], groups: DuplicateGroup[]): EvaluationResult[] {
  const duplicateByItem = new Map<string, RiskLevel>();
  for (const group of groups) for (const observation of group.observations) duplicateByItem.set(`${observation.sourceId}:${observation.sourceItemId}`, group.risk);
  return results.map((result) => {
    const risk = duplicateByItem.get(`${result.observation.sourceId}:${result.observation.sourceItemId}`) ?? 'low';
    return {
      ...result,
      duplicateRisk: risk,
      conflictRisk: risk === 'medium' ? 'medium' : result.conflictRisk,
      reviewRequired: result.reviewRequired || risk !== 'low',
      reasons: risk === 'low' ? result.reasons : [...result.reasons, 'duplicate_review_required'],
      proposedPublicationState: risk === 'low' && !result.reviewRequired ? result.proposedPublicationState : 'review',
    };
  });
}
