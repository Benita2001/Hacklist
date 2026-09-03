import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCountry } from '../src/lib/webmcp/countries.ts';
import type { Hackathon } from '../src/lib/types.ts';
import { buildReadiness, compareHackathons, evaluateHackathon, matchHackathons, type BuilderProfile } from '../src/lib/webmcp/matching.ts';

const now = new Date('2026-09-02T12:00:00-07:00');

function hackathon(overrides: Partial<Hackathon>): Hackathon {
  return {
    id: 'cb753d89-e58a-46d1-aa05-fddf5c176fbb',
    name: 'The WebMCP Challenge',
    organizer: 'OpenAI',
    description: 'WebMCP challenge',
    prize_pool: '$3,000',
    deadline: '2026-09-03',
    deadline_text: 'Sept 3, 2026, 1:00 PM PT',
    category: 'AI',
    format: 'Online',
    free_to_enter: true,
    apply_url: 'https://webmcp.devpost.com/',
    spotlight: false,
    verified: true,
    created_at: '2026-08-28T14:43:45.762171+00:00',
    ...overrides,
  };
}

function catalogRows(): Hackathon[] {
  return [
    hackathon({}),
    hackathon({
      id: 'bc820463-91d8-4780-bdcf-b7dadae6bc15',
      name: 'AI Gateway Hackathon',
      organizer: 'Vercel',
      prize_pool: '$4,000 credits',
      deadline: '2026-09-05',
      category: 'AI',
      format: 'Online',
    }),
    hackathon({
      id: '0db54252-9af9-4db2-91f2-4fc800db8add',
      name: 'Alpaca AI Trading Agents Hackathon',
      organizer: 'Alpaca',
      prize_pool: '$6,000',
      deadline: '2026-09-04',
      category: 'AI',
      format: 'Online',
    }),
    hackathon({
      id: 'ad10ce60-09b1-48f9-836c-92285e4ded2d',
      name: 'Agentic Cinema Hackathon',
      organizer: 'Supavec / LangChain / Together AI',
      prize_pool: '$5,000',
      deadline: '2026-09-09',
      category: 'AI',
      format: 'Online',
    }),
    hackathon({
      id: 'cc779346-4ac2-4094-815e-cc1165019603',
      name: 'Pokemon TCG AI Battle Challenge: Strategy',
      organizer: 'Kaggle',
      prize_pool: '$240,000',
      deadline: '2026-09-13',
      category: 'AI',
      format: 'Online',
    }),
    hackathon({
      id: '96bf4960-9744-4553-8d90-81dbe8e530bb',
      name: 'Shipaton 2026',
      organizer: 'RevenueCat',
      prize_pool: '$700,000+',
      deadline: '2026-09-30',
      category: 'AI',
      format: 'Online',
    }),
    hackathon({
      id: '7ed485fb-5061-4e67-b240-b2614f698627',
      name: 'Algorand Global x402 Challenge',
      organizer: 'Algorand Foundation',
      prize_pool: '$100K USD + 500K ALGO',
      deadline: '2026-10-01',
      category: 'Both',
      format: 'Online',
    }),
    hackathon({
      id: 'ad098ef3-21c8-4a40-9d52-ac3c9a69c7c6',
      name: 'Arbitrum Open House Dubai: Online Buildathon',
      organizer: 'HackQuest',
      prize_pool: '$30,000',
      deadline: '2026-12-06',
      category: 'Web3',
      format: 'Online',
    }),
    hackathon({
      id: 'd49c47c9-7218-49a0-b6c3-544a975873be',
      name: 'Sibyl Labs Hackathon',
      organizer: 'Sibyl Labs',
      prize_pool: '$10,000 USDC',
      deadline: '2026-09-10',
      category: 'Both',
      format: 'Online',
    }),
    hackathon({
      id: 'unenriched-current',
      name: 'Current Unenriched Hackathon',
      organizer: 'Unknown Organizer',
      prize_pool: '$1,000',
      deadline: '2026-10-15',
      category: 'Both',
      format: 'Hybrid',
      description: 'Current active hackathon without verified sidecar intelligence',
    }),
  ];
}

test('country normalization accepts common names, formal names, and alpha-2 codes', () => {
  assert.equal(normalizeCountry('Ghana'), 'GH');
  assert.equal(normalizeCountry('Republic of Ghana'), 'GH');
  assert.equal(normalizeCountry('TZ'), 'TZ');
  assert.equal(normalizeCountry('United Republic of Tanzania'), 'TZ');
  assert.equal(normalizeCountry('Mozambique'), 'MZ');
});

test('red-team profile set A-L produces varied rankings without WebMCP bias', () => {
  const profiles: Array<{ label: string; profile: BuilderProfile; expectedTop: string | null }> = [
    { label: 'A', profile: { country: 'Ghana', skills: ['Next.js', 'TypeScript', 'OpenAI APIs'], technologies: ['WebMCP'], interests: ['human-agent collaboration'], preferredFormats: ['Online'], hasExistingProject: true }, expectedTop: 'cb753d89-e58a-46d1-aa05-fddf5c176fbb' },
    { label: 'B', profile: { country: 'Tanzania', skills: ['AI agents', 'MCP', 'paper trading'], technologies: ['Alpaca MCP server', 'Alpaca Trading API'], interests: ['algorithmic trading'], preferredFormats: ['Online'] }, expectedTop: '0db54252-9af9-4db2-91f2-4fc800db8add' },
    { label: 'C', profile: { country: 'India', skills: ['mobile app development', 'in-app purchases', 'RevenueCat'], technologies: ['iOS', 'RevenueCat SDK'], interests: ['mobile apps'], preferredFormats: ['Online'] }, expectedTop: '96bf4960-9744-4553-8d90-81dbe8e530bb' },
    { label: 'D', profile: { country: 'Kenya', skills: ['Google Cloud', 'Gemini', 'agent orchestration'], technologies: ['Gemini', 'Google Cloud Agent Builder'], interests: ['media workflows'], preferredFormats: ['Online'], hasExistingProject: false }, expectedTop: 'ad10ce60-09b1-48f9-836c-92285e4ded2d' },
    { label: 'E', profile: { country: 'Germany', skills: ['Solidity', 'Stylus', 'Web3'], technologies: ['Arbitrum', 'Solidity'], interests: ['DeFi'], preferredFormats: ['Online'], hasExistingProject: true }, expectedTop: 'ad098ef3-21c8-4a40-9d52-ac3c9a69c7c6' },
    { label: 'F', profile: { country: 'Mozambique', skills: ['HTTPS APIs', 'on-chain usage'], technologies: ['x402', 'Algorand Mainnet'], interests: ['agentic commerce'], preferredFormats: ['Online'] }, expectedTop: '7ed485fb-5061-4e67-b240-b2614f698627' },
    { label: 'G', profile: { country: 'Canada', skills: ['game AI', 'strategy writing', 'Kaggle competition'], technologies: ['Kaggle'], interests: ['AI game strategy'], preferredFormats: ['Online'] }, expectedTop: 'cc779346-4ac2-4094-815e-cc1165019603' },
    { label: 'H', profile: { country: 'Nigeria', skills: ['AI agents', 'persistent memory', 'demo video'], technologies: ['Sibyl Memory'], interests: ['agent memory'], preferredFormats: ['Online'] }, expectedTop: 'd49c47c9-7218-49a0-b6c3-544a975873be' },
    { label: 'I', profile: { country: 'Brazil', skills: ['Next.js', 'TypeScript'], technologies: ['WebMCP'], interests: ['open web'], preferredFormats: ['Online'] }, expectedTop: null },
    { label: 'J', profile: { country: 'United States', skills: ['AI agents', 'public repo', 'demo'], technologies: ['any model'], interests: ['AI agents'], preferredFormats: ['Online'] }, expectedTop: 'bc820463-91d8-4780-bdcf-b7dadae6bc15' },
    { label: 'K', profile: { country: 'Ghana', skills: ['Next.js', 'TypeScript'], technologies: ['WebMCP'], avoid: ['blockchain'], preferredFormats: ['Online'] }, expectedTop: 'cb753d89-e58a-46d1-aa05-fddf5c176fbb' },
    { label: 'L', profile: { country: 'Germany', preferredFormats: ['Any'], availableDays: 14 }, expectedTop: null },
  ];

  const topIds = new Set<string>();

  for (const { label, profile, expectedTop } of profiles) {
    const results = matchHackathons(catalogRows(), profile, now, 10);
    assert.equal(results.length, 10, `profile ${label} should retain the full active catalog`);
    assert.ok(results.some((result) => result.hackathonId === 'unenriched-current'), `profile ${label} should retain unenriched active rows`);
    if (expectedTop) assert.equal(results[0].hackathonId, expectedTop, `profile ${label} top match`);
    topIds.add(results[0].hackathonId);
  }

  assert.ok(topIds.size >= 8);
});

test('general builder constraints can strongly match a verified opportunity', () => {
  const result = evaluateHackathon(hackathon({}), {
    country: 'Republic of Ghana',
    skills: ['Next.js', 'TypeScript', 'OpenAI APIs'],
    technologies: ['WebMCP'],
    availableDays: 1,
    preferredFormats: ['Online'],
    hasExistingProject: true,
  }, now);

  assert.equal(result.fit, 'STRONG_FIT');
  assert.equal(result.dimensions.eligibility.status, 'PASS');
  assert.equal(result.dimensions.existingProjectPolicy.status, 'PASS');
  assert.equal(result.dimensions.timeFeasibility.status, 'RISKY');
});

test('hard eligibility failure marks excluded country as weak fit', () => {
  const result = evaluateHackathon(hackathon({}), {
    country: 'Brazil',
    skills: ['Next.js', 'TypeScript', 'OpenAI APIs'],
    technologies: ['WebMCP'],
    preferredFormats: ['Online'],
  }, now);

  assert.equal(result.fit, 'WEAK_FIT');
  assert.ok(result.hardFailures.includes('GEOGRAPHY_EXCLUDED'));
  assert.equal(result.dimensions.eligibility.status, 'FAIL');
});

test('unknown eligibility remains unknown instead of inferred pass for any country', () => {
  const algorand = evaluateHackathon(hackathon({
    id: '7ed485fb-5061-4e67-b240-b2614f698627',
    name: 'Algorand Global x402 Challenge',
    organizer: 'Algorand Foundation',
    category: 'Both',
    deadline: '2026-10-01',
  }), { country: 'Mozambique', skills: ['TypeScript'], technologies: ['x402'] }, now);

  assert.equal(algorand.dimensions.eligibility.status, 'UNKNOWN');
  assert.ok(algorand.reasonCodes.includes('ELIGIBILITY_UNKNOWN'));
});

test('technology mismatch is explainable', () => {
  const result = evaluateHackathon(hackathon({
    id: '96bf4960-9744-4553-8d90-81dbe8e530bb',
    name: 'Shipaton 2026',
    organizer: 'RevenueCat',
    deadline: '2026-09-30',
  }), {
    country: 'Tanzania',
    skills: ['Next.js', 'OpenAI APIs'],
    technologies: ['WebMCP'],
    preferredFormats: ['Online'],
  }, now);

  assert.equal(result.dimensions.technologyFit.status, 'WEAK');
  assert.ok(result.reasonCodes.includes('TECHNOLOGY_MISMATCH'));
});

test('new-only policy blocks existing projects', () => {
  const result = evaluateHackathon(hackathon({
    id: 'ad10ce60-09b1-48f9-836c-92285e4ded2d',
    name: 'Agentic Cinema Hackathon',
    organizer: 'Supavec / LangChain / Together AI',
    deadline: '2026-09-09',
  }), {
    country: 'Kenya',
    skills: ['OpenAI APIs'],
    technologies: ['Gemini'],
    hasExistingProject: true,
  }, now);

  assert.ok(result.hardFailures.includes('EXISTING_PROJECT_NOT_ALLOWED'));
  assert.equal(result.dimensions.existingProjectPolicy.status, 'FAIL');
});

test('matching excludes stale inactive/expired hackathons', () => {
  const rows = [
    hackathon({}),
    hackathon({ id: 'expired', name: 'Expired', deadline: '2026-08-01' }),
  ];
  const results = matchHackathons(rows, { country: 'Ghana', skills: ['Next.js'], technologies: ['WebMCP'] }, now, 10);

  assert.equal(results.some((result) => result.hackathonId === 'expired'), false);
});

test('empty candidate set returns empty matches', () => {
  assert.deepEqual(matchHackathons([], { country: 'Ghana' }, now), []);
});

test('comparison does not force a recommendation when no item is a strong fit', () => {
  const rows = [
    hackathon({}),
    hackathon({
      id: 'bc820463-91d8-4780-bdcf-b7dadae6bc15',
      name: 'AI Gateway Hackathon',
      organizer: 'Vercel',
      deadline: '2026-09-05',
    }),
  ];
  const result = compareHackathons(rows, {
    country: 'Ghana',
    skills: ['Next.js', 'TypeScript', 'OpenAI APIs'],
    technologies: ['WebMCP'],
    preferredFormats: ['Online'],
  }, now);

  assert.equal(result.items.length, 2);
  assert.equal(result.recommendation.hackathonId, null);
  assert.equal(result.recommendation.tradeoffs.length, 2);
});

test('comparison recommends only a strong deterministic fit', () => {
  const rows = [
    hackathon({}),
    hackathon({
      id: 'bc820463-91d8-4780-bdcf-b7dadae6bc15',
      name: 'AI Gateway Hackathon',
      organizer: 'Vercel',
      deadline: '2026-09-05',
    }),
  ];
  const result = compareHackathons(rows, {
    country: 'GH',
    skills: ['Next.js', 'TypeScript', 'OpenAI APIs'],
    technologies: ['WebMCP'],
    preferredFormats: ['Online'],
    availableDays: 1,
    hasExistingProject: true,
  }, now);

  assert.equal(result.recommendation.hackathonId, 'cb753d89-e58a-46d1-aa05-fddf5c176fbb');
});

test('unenriched active records are retained as insufficient data', () => {
  const result = evaluateHackathon(hackathon({
    id: 'unenriched-current',
    name: 'Current Unenriched Hackathon',
    deadline: '2026-10-01',
  }), { country: 'Germany', skills: ['Rust'], technologies: ['Solidity'], preferredFormats: ['Online'] }, now);

  assert.equal(result.fit, 'INSUFFICIENT_DATA');
  assert.equal(result.confidence, 'LOW');
  assert.equal(result.dimensions.technologyFit.status, 'UNKNOWN');
  assert.equal(result.dimensions.skillFit.status, 'UNKNOWN');
});

test('avoid terms create a generic hard constraint', () => {
  const result = evaluateHackathon(hackathon({}), {
    country: 'Canada',
    skills: ['Next.js'],
    technologies: ['WebMCP'],
    avoid: ['demo video'],
  }, now);

  assert.ok(result.hardFailures.includes('AVOIDED_CONSTRAINT'));
  assert.equal(result.fit, 'WEAK_FIT');
});

test('minimum prize acts only on known dollar-denominated prize amounts', () => {
  const result = evaluateHackathon(hackathon({ prize_pool: '$3,000' }), {
    country: 'Ghana',
    minimumPrize: 10_000,
  }, now);

  assert.ok(result.hardFailures.includes('PRIZE_BELOW_MINIMUM'));
  assert.equal(result.fit, 'WEAK_FIT');
});

test('readiness separates known requirements from unknowns', () => {
  const readiness = buildReadiness(hackathon({}));

  assert.equal(readiness.readiness_status, 'PARTIAL');
  assert.ok(readiness.known.some((item) => item.label === 'Submission requirements'));
  assert.ok(readiness.unknown.some((item) => item.includes('maximum team size')));
});
