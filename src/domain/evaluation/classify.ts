import type { ConnectorOpportunityType, NormalizedObservation } from '../connectors/types.ts';

const keywords: Record<Exclude<ConnectorOpportunityType, 'unknown'>, string[]> = {
  hackathon: ['hackathon', 'buildathon', 'hack day', 'coding competition'],
  bounty: ['bounty', 'bug bounty', 'security reward'],
  grant: ['grant', 'funding opportunity', 'research award'],
  program: ['fellowship', 'accelerator', 'incubator', 'residency', 'cohort', 'program'],
  job: ['job', 'career', 'careers', 'hiring', 'engineer', 'developer', 'position', 'role'],
};

function searchableText(observation: NormalizedObservation): string {
  const payload = observation.normalizedPayload;
  return [payload.title, payload.description, payload.structuredType, payload.team, payload.commitment]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase();
}

export function classifyObservation(observation: NormalizedObservation): { type: ConnectorOpportunityType; reasons: string[] } {
  if (observation.opportunityType !== 'unknown') return { type: observation.opportunityType, reasons: ['connector_type_hint'] };
  const text = searchableText(observation);
  const matches = (Object.entries(keywords) as [Exclude<ConnectorOpportunityType, 'unknown'>, string[]][])
    .filter(([, terms]) => terms.some((term) => text.includes(term)))
    .map(([type]) => type);
  if (matches.length === 1) return { type: matches[0], reasons: ['deterministic_keyword_classification'] };
  if (matches.length > 1) return { type: 'unknown', reasons: ['ambiguous_category'] };
  return { type: 'unknown', reasons: ['category_not_supported_by_source'] };
}
