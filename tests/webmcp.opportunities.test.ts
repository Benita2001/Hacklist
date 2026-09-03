import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildOpportunityReadiness,
  compareOpportunities,
  evaluateOpportunity,
  matchOpportunities,
  parseOpportunityRef,
  searchOpportunities,
  type Opportunity,
  type OpportunityProfile,
  type OpportunityType,
} from '../src/lib/webmcp/opportunities.ts';

const now = new Date('2026-09-02T12:00:00-07:00');

function opportunity(overrides: Partial<Opportunity> & { type: OpportunityType; id: string; title: string }): Opportunity {
  const { type, id, title, ...rest } = overrides;
  return {
    ref: `${type}:${id}`,
    id,
    type,
    title,
    organization: 'Example Org',
    description: 'AI React TypeScript opportunity',
    deadline: '2026-10-01',
    deadlineText: null,
    location: null,
    format: 'Online',
    categories: ['AI'],
    applyUrl: `https://example.com/${overrides.type}/${overrides.id}`,
    verified: true,
    value: { kind: 'unknown', label: 'Undisclosed value', raw: null },
    metadata: {},
    original: {} as Opportunity['original'],
    ...rest,
  };
}

function catalog(): Opportunity[] {
  return [
    opportunity({
      type: 'hackathon',
      id: 'hackathon-1',
      title: 'AI Agent Hackathon',
      description: 'Build AI agents with WebMCP, Next.js, TypeScript, and public demos.',
      value: { kind: 'prize', label: '$3,000 prize', raw: '$3,000' },
      intelligence: { status: 'verified_sidecar' },
    }),
    opportunity({
      type: 'job',
      id: 'job-1',
      title: 'Remote AI Engineering Job',
      organization: 'Remote AI Co',
      description: 'Python and React engineer role building AI tools.',
      location: 'Remote',
      format: 'Remote',
      value: { kind: 'salary', label: '$160,000 salary', raw: '$160,000' },
      metadata: { jobType: 'Technical' },
    }),
    opportunity({
      type: 'grant',
      id: 'grant-1',
      title: 'AI Builder Grant',
      organization: 'Startup Fund',
      description: 'Grant for early-stage AI startup builders.',
      value: { kind: 'grant', label: '$25,000 grant', raw: '$25,000' },
      metadata: { ecosystem: 'AI', freeToApply: true },
    }),
    opportunity({
      type: 'bounty',
      id: 'bounty-1',
      title: 'Weekend React Bounty',
      description: 'Small React documentation and frontend bounty suitable for a weekend.',
      value: { kind: 'reward', label: '$1,000 reward', raw: '$1,000' },
      metadata: { platform: 'Writing', bountyType: 'Writing' },
    }),
    opportunity({
      type: 'program',
      id: 'program-1',
      title: 'AI Founder Accelerator',
      description: 'Accelerator program for AI founders and technical teams.',
      value: { kind: 'stipend', label: '$10,000 stipend', raw: '$10,000' },
      metadata: { duration: '8 weeks', programType: 'Accelerator' },
    }),
    opportunity({
      type: 'job',
      id: 'job-incomplete',
      title: 'Sparse Listing',
      description: null,
      applyUrl: null,
      verified: false,
      value: { kind: 'salary', label: 'Undisclosed salary', raw: null },
    }),
  ];
}

test('search covers all opportunities and each type filter', () => {
  const rows = catalog();

  assert.equal(searchOpportunities(rows, { query: 'AI', limit: 20 }).opportunities.length, rows.length);
  assert.equal(searchOpportunities(rows, { query: 'AI', type: 'hackathon' }).opportunities[0].type, 'hackathon');
  assert.equal(searchOpportunities(rows, { query: 'remote', type: 'job' }).opportunities[0].type, 'job');
  assert.equal(searchOpportunities(rows, { query: 'AI', type: 'grant' }).opportunities[0].type, 'grant');
  assert.equal(searchOpportunities(rows, { query: 'weekend', type: 'bounty' }).opportunities[0].type, 'bounty');
  assert.equal(searchOpportunities(rows, { query: 'accelerator', type: 'program' }).opportunities[0].type, 'program');
});

test('typed references prevent cross-table ID collisions and identify stale refs', () => {
  assert.deepEqual(parseOpportunityRef({ type: 'job', id: 'shared-id' }), { type: 'job', id: 'shared-id' });
  assert.deepEqual(parseOpportunityRef({ opportunityRef: 'grant:shared-id' }), { type: 'grant', id: 'shared-id' });
  assert.equal(parseOpportunityRef({ type: 'unknown', id: 'x' }), null);
});

test('match covers all category-specific user intents and mixed opportunity discovery', () => {
  const examples: Array<{ profile: OpportunityProfile; topType: OpportunityType }> = [
    { profile: { type: 'hackathon', country: 'Ghana', skills: ['Next.js', 'TypeScript'], technologies: ['WebMCP'], interests: ['AI agents'] }, topType: 'hackathon' },
    { profile: { type: 'job', skills: ['Python', 'React'], interests: ['AI tools'], preferredFormats: ['Remote'] }, topType: 'job' },
    { profile: { type: 'grant', interests: ['early-stage AI startup'], minimumValue: 20_000 }, topType: 'grant' },
    { profile: { type: 'bounty', skills: ['React'], interests: ['weekend'], availableDays: 3 }, topType: 'bounty' },
    { profile: { type: 'program', interests: ['accelerator', 'AI founders'] }, topType: 'program' },
    { profile: { country: 'Ghana', skills: ['Python', 'React'], interests: ['AI'], availableDays: 4, preferredFormats: ['Remote'] }, topType: 'job' },
  ];

  for (const { profile, topType } of examples) {
    const result = matchOpportunities(catalog(), profile, now);
    assert.equal(result.matches[0].type, topType);
  }
});

test('incomplete data and no-strong-fit remain explicit', () => {
  const incomplete = evaluateOpportunity(catalog().find((item) => item.id === 'job-incomplete')!, {
    skills: ['Rust'],
    technologies: ['Solana'],
  }, now);
  assert.equal(incomplete.fit, 'INSUFFICIENT_DATA');
  assert.equal(incomplete.dimensions.dataCompleteness.status, 'WEAK');

  const result = matchOpportunities(catalog(), { skills: ['COBOL'], technologies: ['mainframe'], limit: 3 }, now);
  assert.equal(result.matches.some((match) => match.fit === 'STRONG_FIT'), false);
});

test('compare supports same-category and meaningful cross-category comparisons', () => {
  const rows = catalog();
  const same = compareOpportunities(rows.filter((item) => item.type === 'job'), { profile: { skills: ['Python'] } }, now);
  assert.equal(same.comparability, 'Values share the same kind and can be compared cautiously when amounts are known.');

  const cross = compareOpportunities(rows.filter((item) => item.type === 'bounty' || item.type === 'hackathon'), { profile: { skills: ['React', 'Next.js'] } }, now);
  assert.equal(cross.comparability, 'Values are different kinds and should not be treated as equivalent.');
});

test('readiness is category-aware and preserves unknowns', () => {
  for (const item of catalog().filter((opportunity) => opportunity.type !== 'hackathon')) {
    const readiness = buildOpportunityReadiness(item);
    assert.equal(readiness.type, item.type);
    assert.ok('known' in readiness);
    assert.ok('unknown' in readiness);
    assert.ok(Array.isArray(readiness.unknown) && readiness.unknown.length > 0);
  }
});
