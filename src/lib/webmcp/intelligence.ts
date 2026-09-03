import type { Hackathon } from '@/lib/types';

export type FactStatus = 'KNOWN' | 'UNKNOWN';
export type EligibilityStatus = 'PASS' | 'FAIL' | 'UNKNOWN';
export type FitStatus = 'STRONG' | 'OK' | 'WEAK' | 'RISKY' | 'UNKNOWN';
export type FitClassification = 'STRONG_FIT' | 'POSSIBLE_FIT' | 'WEAK_FIT' | 'INSUFFICIENT_DATA';
export type DataConfidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type EligibilityRuleType = 'WORLDWIDE' | 'INCLUDED_COUNTRIES' | 'EXCLUDED_COUNTRIES' | 'SUPPORTED_COUNTRY_SET' | 'REGION_ONLY' | 'IN_PERSON_LOCATION_REQUIRED' | 'UNKNOWN';

export type SourceRef = {
  url: string;
  label: string;
  accessedAt: string;
  evidence: string;
};

export type KnownFact<T> = {
  status: 'KNOWN';
  value: T;
  sources: SourceRef[];
  note?: string;
};

export type UnknownFact = {
  status: 'UNKNOWN';
  sources: SourceRef[];
  note: string;
};

export type Fact<T> = KnownFact<T> | UnknownFact;

export type EligibilityRule = {
  type: EligibilityRuleType;
  includedCountryCodes?: string[];
  excludedCountryCodes?: string[];
  supportedCountrySet?: 'openai_api_supported_reviewed_subset';
  region?: string;
  notes: string;
};

export type HackathonIntelligence = {
  hackathonId: string;
  verifiedAt: string;
  sourceUrls: string[];
  technologies: Fact<string[]>;
  relevantSkills: Fact<string[]>;
  themes: Fact<string[]>;
  geographicEligibility: Fact<EligibilityRule>;
  teamRules: Fact<{
    min: number;
    max: number;
    soloAllowed: boolean;
    notes: string;
  }>;
  existingProjectPolicy: Fact<'allowed' | 'new_only' | 'restricted'>;
  hardwareRequirement: Fact<'none' | 'mobile_device' | 'cloud_or_account' | 'specific_hardware'>;
  submissionRequirements: Fact<string[]>;
  technicalRequirements: Fact<string[]>;
  prizeValue: Fact<string>;
  deadline: Fact<string>;
  importantUnknowns: string[];
};

const verifiedAt = '2026-09-03T00:00:00.000Z';

function source(url: string, label: string, evidence: string): SourceRef {
  return {
    url,
    label,
    evidence,
    accessedAt: verifiedAt,
  };
}

function known<T>(value: T, sources: SourceRef[], note?: string): KnownFact<T> {
  return { status: 'KNOWN', value, sources, note };
}

function unknown<T = never>(note: string, sources: SourceRef[] = []): Fact<T> {
  return { status: 'UNKNOWN', note, sources };
}

const webmcpRules = source(
  'https://webmcp.devpost.com/rules',
  'OpenAI WebMCP Challenge official rules',
  'Rules require a live URL accessible in ChatGPT in-app browser or Chrome with WebMCP enabled, a public code repository with license, and document.modelContext.registerTool usage.',
);

const webmcpResources = source(
  'https://webmcp.devpost.com/resources',
  'OpenAI WebMCP Challenge resource hub',
  'Resource hub links the WebMCP spec, Chrome WebMCP docs, DevTools panel, examples, and partner implementation resources.',
);

const openaiCountries = source(
  'https://platform.openai.com/docs/supported-countries',
  'OpenAI API supported countries',
  'WebMCP Challenge eligibility references OpenAI API supported countries and territories.',
);

const aiGateway = source(
  'https://vercel.com/i/ai-gateway-hackathon',
  'Vercel AI Gateway Hackathon page',
  'Page states the challenge is to build the best AI agent, run through Vercel plus AI Gateway, and submit with a repo and demo or working agent link.',
);

const alpaca = source(
  'https://lablab.ai/ai-hackathons/alpaca-ai-trading-agents-hackathon',
  'Alpaca AI Trading Agents Hackathon page',
  'Page states online dates Aug 28 to Sep 4, 2026, $6,000 prize pool, build AI trading agents using Alpaca Trading API, MCP server and CLI, and join from anywhere.',
);

const agenticCinemaRules = source(
  'https://agentic-cinema.devpost.com/rules',
  'Agentic Cinema official rules',
  'Rules require a production-ready AI agent or multi-agent network powered by Gemini and Google Cloud Agent Builder, with partner-track requirements and no non-Google AI APIs.',
);

const pokemonRules = source(
  'https://www.kaggle.com/competitions/pokemon-tcg-ai-battle-challenge-strategy/rules',
  'Pokemon TCG AI Battle Challenge Strategy Kaggle rules',
  'Rules list $240,000 total prizes, maximum team size five, one hackathon submission per team, and eligibility requiring the same team in the Simulation division.',
);

const shipatonRules = source(
  'https://revenuecat-shipaton-2026.devpost.com/rules',
  'RevenueCat Shipaton official rules',
  'Rules require apps for iOS, iPadOS, macOS, or Android using RevenueCat SDK or RevenueCat Ads, fully published to an eligible app store by Sep 30, 2026.',
);

const algorand = source(
  'https://algorand.co/global-x402-challenge',
  'Algorand Global x402 Challenge page',
  'Page requires shipping a paid x402 endpoint on Algorand Mainnet, GoPlausible facilitator, Bazaar discovery, challenge tag, and at least one real MainNet payment.',
);

const arbitrum = source(
  'https://www.hackquest.io/hackathons/Arbitrum-Open-House-Dubai-Online-Buildathon',
  'Arbitrum Open House Dubai Online Buildathon page',
  'Page says online buildathon, build with Stylus or Solidity, deploy on Arbitrum One or Orbit, bring an existing product or start from scratch, and submit by Dec 6, 2026.',
);

const sibyl = source(
  'https://hack.sibyllabs.org/',
  'Sibyl Labs Hackathon page',
  'Page requires load-bearing Sibyl Memory, Sep 1 to 10 build window, public repo with MIT or Apache-2.0, README, 2 to 5 minute demo, and build-in-public posts.',
);

export const hackathonIntelligence: HackathonIntelligence[] = [
  {
    hackathonId: 'cb753d89-e58a-46d1-aa05-fddf5c176fbb',
    verifiedAt,
    sourceUrls: [webmcpRules.url, webmcpResources.url, openaiCountries.url],
    technologies: known(['WebMCP', 'document.modelContext', 'JavaScript', 'web app'], [webmcpRules, webmcpResources]),
    relevantSkills: known(['Next.js', 'TypeScript', 'OpenAI APIs', 'WebMCP', 'public repo', 'demo video'], [webmcpRules]),
    themes: known(['human-agent collaboration', 'open web', 'agent tools'], [webmcpRules]),
    geographicEligibility: known({
      type: 'SUPPORTED_COUNTRY_SET',
      supportedCountrySet: 'openai_api_supported_reviewed_subset',
      excludedCountryCodes: ['BR', 'CN', 'HK', 'CA-QC', 'RU', 'UA-CRIMEA', 'CU', 'IR', 'KP', 'SY', 'VE', 'UA-DONETSK', 'UA-LUHANSK'],
      notes: 'Open only where OpenAI API services are supported and not otherwise excluded.',
    }, [webmcpRules, openaiCountries]),
    teamRules: known({ min: 1, max: 99, soloAllowed: true, notes: 'Individuals, teams, and organizations may enter; exact maximum team size was not stated in reviewed rules.' }, [webmcpRules]),
    existingProjectPolicy: known('allowed', [webmcpRules], 'Pre-existing projects are eligible only for WebMCP work added during the submission period with clear documentation.'),
    hardwareRequirement: known('none', [webmcpRules], 'Runs in a web browser; judges use ChatGPT browser or Chrome with WebMCP enabled.'),
    submissionRequirements: known(['working live URL', 'public code repository', 'open source license', 'text description', 'public YouTube demo video under 3 minutes'], [webmcpRules]),
    technicalRequirements: known(['use WebMCP', 'register tools with document.modelContext.registerTool', 'project must function as depicted'], [webmcpRules, webmcpResources]),
    prizeValue: known('$3,000 cash plus non-cash prizes for each of 10 winners, plus partner prizes', [webmcpRules]),
    deadline: known('2026-09-03T13:00:00-07:00', [webmcpRules]),
    importantUnknowns: ['Exact maximum team size is not stated in reviewed WebMCP rules.'],
  },
  {
    hackathonId: 'bc820463-91d8-4780-bdcf-b7dadae6bc15',
    verifiedAt,
    sourceUrls: [aiGateway.url],
    technologies: known(['Vercel AI Gateway', 'AI agent', 'any model', 'any framework'], [aiGateway]),
    relevantSkills: known(['AI agents', 'Vercel', 'model routing', 'public repo', 'demo'], [aiGateway]),
    themes: known(['AI agents'], [aiGateway]),
    geographicEligibility: known({ type: 'WORLDWIDE', notes: 'FAQ says anyone, anywhere; individual developers and teams welcome.' }, [aiGateway]),
    teamRules: known({ min: 1, max: 99, soloAllowed: true, notes: 'FAQ welcomes individual developers and teams; exact maximum team size not stated.' }, [aiGateway]),
    existingProjectPolicy: unknown('Reviewed page does not state whether existing projects are eligible.', [aiGateway]),
    hardwareRequirement: known('cloud_or_account', [aiGateway], 'Requires Vercel plus AI Gateway usage.'),
    submissionRequirements: known(['reply to announcement thread on X', 'repo link', 'video demo or working agent link'], [aiGateway]),
    technicalRequirements: known(['project should run through Vercel plus AI Gateway'], [aiGateway]),
    prizeValue: known('$2,500 / $1,000 / $500 in AI Gateway credits', [aiGateway]),
    deadline: known('2026-09-05T00:00:00-07:00', [aiGateway]),
    importantUnknowns: ['Existing-project policy', 'maximum team size'],
  },
  {
    hackathonId: '0db54252-9af9-4db2-91f2-4fc800db8add',
    verifiedAt,
    sourceUrls: [alpaca.url],
    technologies: known(['Alpaca Trading API', 'Alpaca MCP server', 'Alpaca CLI', 'AI trading agents'], [alpaca]),
    relevantSkills: known(['AI agents', 'trading systems', 'MCP', 'CLI', 'paper trading'], [alpaca]),
    themes: known(['algorithmic trading', 'autonomous agents'], [alpaca]),
    geographicEligibility: known({ type: 'WORLDWIDE', notes: 'Page says fully online and build from anywhere in the world.' }, [alpaca]),
    teamRules: unknown('Reviewed page did not state team size rules.', [alpaca]),
    existingProjectPolicy: unknown('Reviewed page did not state whether existing projects are eligible.', [alpaca]),
    hardwareRequirement: known('cloud_or_account', [alpaca], 'Requires Alpaca trading developer access; HackList record states paper trading.'),
    submissionRequirements: unknown('Reviewed page did not expose full submission checklist.', [alpaca]),
    technicalRequirements: known(['build AI trading agents using Alpaca Trading API, MCP server, and CLI'], [alpaca]),
    prizeValue: known('$6,000 prize pool', [alpaca]),
    deadline: known('2026-09-04', [alpaca]),
    importantUnknowns: ['Team size', 'existing-project policy', 'full submission checklist'],
  },
  {
    hackathonId: 'ad10ce60-09b1-48f9-836c-92285e4ded2d',
    verifiedAt,
    sourceUrls: [agenticCinemaRules.url],
    technologies: known(['Gemini', 'Google Cloud Agent Builder', 'Google Cloud', 'partner product or MCP server'], [agenticCinemaRules]),
    relevantSkills: known(['Google Cloud', 'Gemini', 'agent orchestration', 'partner integrations', 'demo video'], [agenticCinemaRules]),
    themes: known(['agentic cinema', 'media workflows', 'multi-agent systems'], [agenticCinemaRules]),
    geographicEligibility: known({
      type: 'EXCLUDED_COUNTRIES',
      excludedCountryCodes: ['AF', 'AQ', 'CN', 'DJ', 'IQ', 'KZ', 'SO', 'VE', 'EH', 'IT', 'BR', 'CA-QC', 'CU', 'IR', 'SY', 'KP', 'SD', 'BY', 'RU', 'VN', 'UA-CRIMEA', 'UA-DONETSK', 'UA-LUHANSK'],
      notes: 'Rules list country and jurisdiction exclusions.',
    }, [agenticCinemaRules]),
    teamRules: known({ min: 1, max: 4, soloAllowed: true, notes: 'Team is limited to a maximum of four individuals.' }, [agenticCinemaRules]),
    existingProjectPolicy: known('new_only', [agenticCinemaRules], 'Projects must be newly created during the contest period.'),
    hardwareRequirement: known('cloud_or_account', [agenticCinemaRules], 'Requires Google Cloud developer tools and partner-track product usage.'),
    submissionRequirements: known(['hosted project URL', 'text description', 'public code repository', 'demo video under 3 minutes'], [agenticCinemaRules]),
    technicalRequirements: known(['Gemini and Google Cloud Agent Builder', 'one partner track', 'no non-Google AI APIs for AI tooling'], [agenticCinemaRules]),
    prizeValue: known('$5,000', [agenticCinemaRules]),
    deadline: known('2026-09-09T14:00:00-07:00', [agenticCinemaRules]),
    importantUnknowns: [],
  },
  {
    hackathonId: 'cc779346-4ac2-4094-815e-cc1165019603',
    verifiedAt,
    sourceUrls: [pokemonRules.url],
    technologies: known(['Kaggle', 'Pokemon TCG AI Battle simulation', 'strategy report'], [pokemonRules]),
    relevantSkills: known(['game AI', 'Kaggle competition', 'strategy writing', 'simulation division'], [pokemonRules]),
    themes: known(['AI game strategy', 'model performance', 'deck strategy'], [pokemonRules]),
    geographicEligibility: known({ type: 'EXCLUDED_COUNTRIES', excludedCountryCodes: ['UA-CRIMEA', 'UA-DONETSK', 'UA-LUHANSK', 'CU', 'IR', 'KP'], notes: 'Rules state worldwide except listed sanctions/export-control restrictions.' }, [pokemonRules]),
    teamRules: known({ min: 1, max: 5, soloAllowed: true, notes: 'Maximum team size is five.' }, [pokemonRules]),
    existingProjectPolicy: unknown('Reviewed rules focus on competition submissions and data use; existing-project reuse policy was not established.', [pokemonRules]),
    hardwareRequirement: known('none', [pokemonRules], 'Kaggle-hosted competition; no proprietary hardware requirement found.'),
    submissionRequirements: known(['one hackathon submission per team', 'compete with same team in Simulation division', 'strategy submission'], [pokemonRules]),
    technicalRequirements: known(['must be registered in the Simulation division with identical team composition for prize eligibility'], [pokemonRules]),
    prizeValue: known('$240,000 total; eight finalists receive $30,000 each', [pokemonRules]),
    deadline: known('2026-09-13', [pokemonRules]),
    importantUnknowns: ['Existing-project policy'],
  },
  {
    hackathonId: '96bf4960-9744-4553-8d90-81dbe8e530bb',
    verifiedAt,
    sourceUrls: [shipatonRules.url],
    technologies: known(['RevenueCat SDK', 'RevenueCat Ads', 'iOS', 'iPadOS', 'macOS', 'Android'], [shipatonRules]),
    relevantSkills: known(['mobile app development', 'app store release', 'in-app purchases', 'RevenueCat'], [shipatonRules]),
    themes: known(['mobile apps', 'monetization', 'app launch'], [shipatonRules]),
    geographicEligibility: known({ type: 'EXCLUDED_COUNTRIES', excludedCountryCodes: ['RU', 'UA-CRIMEA', 'CU', 'IR', 'KP'], notes: 'Rules list excluded jurisdictions and require submitted apps to be accessible from the United States.' }, [shipatonRules]),
    teamRules: known({ min: 1, max: 99, soloAllowed: true, notes: 'Individuals, teams, and organizations may enter; exact max team size not found in reviewed section.' }, [shipatonRules]),
    existingProjectPolicy: known('restricted', [shipatonRules], 'Project may have existed before the submission period, but first public eligible-store release must occur during the submission period; updates to previously released apps are not eligible.'),
    hardwareRequirement: known('mobile_device', [shipatonRules], 'Submitted project must run on iOS, iPadOS, macOS, or Android and show device functionality.'),
    submissionRequirements: known(['text description', 'demo video under 2 minutes', 'eligible app store URL except Next Gen', '1024x1024 app icon', '1179x2556 screenshot without device frames'], [shipatonRules]),
    technicalRequirements: known(['use RevenueCat SDK for at least one in-app or web purchase or use RevenueCat Ads', 'publish to Apple App Store, Google Play, or Samsung Galaxy Store by deadline'], [shipatonRules]),
    prizeValue: known('$700,000+ according to HackList; official rules contain category prizes and requirements', [shipatonRules]),
    deadline: known('2026-09-30T23:45:00-07:00', [shipatonRules]),
    importantUnknowns: ['Exact maximum team size'],
  },
  {
    hackathonId: '7ed485fb-5061-4e67-b240-b2614f698627',
    verifiedAt,
    sourceUrls: [algorand.url],
    technologies: known(['Algorand Mainnet', 'x402', 'GoPlausible facilitator', 'Bazaar discovery', 'USDC payments'], [algorand]),
    relevantSkills: known(['blockchain payments', 'HTTPS APIs', 'on-chain usage', 'leaderboard growth'], [algorand]),
    themes: known(['agentic commerce', 'pay-per-request APIs', 'on-chain usage'], [algorand]),
    geographicEligibility: unknown('Reviewed public page did not expose full eligibility exclusions; it links official rules separately.', [algorand]),
    teamRules: unknown('Reviewed page did not state team size.', [algorand]),
    existingProjectPolicy: unknown('Reviewed page did not state whether existing projects are eligible.', [algorand]),
    hardwareRequirement: known('cloud_or_account', [algorand], 'Requires public HTTPS endpoint, Algorand Mainnet, and payment tracking.'),
    submissionRequirements: known(['paid x402 endpoint', 'project details', 'proof of who is paying', 'leaderboard appearance'], [algorand]),
    technicalRequirements: known(['test x402 endpoint on TestNet', 'deploy to MainNet with public HTTPS endpoint', 'use GoPlausible facilitator', 'enable Bazaar discovery', 'add x402-global-challenge tag', 'complete at least one real MainNet payment'], [algorand]),
    prizeValue: known('$100K USD plus 500K ALGO prize pools', [algorand]),
    deadline: known('2026-10-01', [algorand]),
    importantUnknowns: ['Eligibility exclusions', 'team size', 'existing-project policy'],
  },
  {
    hackathonId: 'ad098ef3-21c8-4a40-9d52-ac3c9a69c7c6',
    verifiedAt,
    sourceUrls: [arbitrum.url],
    technologies: known(['Arbitrum', 'Stylus', 'Solidity', 'Arbitrum One', 'Orbit'], [arbitrum]),
    relevantSkills: known(['Solidity', 'Stylus', 'on-chain app development', 'Web3'], [arbitrum]),
    themes: known(['DeFi', 'gaming', 'social', 'tools', 'on-chain applications'], [arbitrum]),
    geographicEligibility: unknown('Reviewed page did not state country eligibility.', [arbitrum]),
    teamRules: unknown('Reviewed page did not state team size.', [arbitrum]),
    existingProjectPolicy: known('allowed', [arbitrum], 'Page says bring an existing product or start from scratch.'),
    hardwareRequirement: known('cloud_or_account', [arbitrum], 'Requires deployment on Arbitrum One or Orbit chain.'),
    submissionRequirements: unknown('Submission schedule is listed, but full final submission checklist/judging details are TBD or coming soon.', [arbitrum]),
    technicalRequirements: known(['build with Stylus or Solidity', 'deploy on Arbitrum One or your own Orbit chain'], [arbitrum]),
    prizeValue: known('30,000 USD available in prizes', [arbitrum]),
    deadline: known('2026-12-06', [arbitrum]),
    importantUnknowns: ['Country eligibility', 'team size', 'full submission checklist', 'judging criteria'],
  },
  {
    hackathonId: 'd49c47c9-7218-49a0-b6c3-544a975873be',
    verifiedAt,
    sourceUrls: [sibyl.url],
    technologies: known(['Sibyl Memory', 'Base', 'Virtuals Protocol', 'AI agents'], [sibyl]),
    relevantSkills: known(['AI agents', 'persistent memory', 'fresh-session recall', 'public repo', 'demo video'], [sibyl]),
    themes: known(['agent memory', 'persistent context', 'load-bearing recall'], [sibyl]),
    geographicEligibility: known({ type: 'UNKNOWN', notes: 'Page says anyone 18 or older outside sanctioned jurisdictions, but the exact jurisdiction list was not stated on the reviewed page.' }, [sibyl]),
    teamRules: known({ min: 1, max: 5, soloAllowed: true, notes: 'FAQ says teams are 1 to 5 people and solo entries are allowed.' }, [sibyl]),
    existingProjectPolicy: unknown('Reviewed page did not state whether existing projects are eligible.', [sibyl]),
    hardwareRequirement: known('cloud_or_account', [sibyl], 'Requires Sibyl Memory and optional Base/Virtuals stacks; prizes pay in USDC on Base.'),
    submissionRequirements: known(['public repo with MIT or Apache-2.0', 'README', '2 to 5 minute demo with fresh-session recall moment', 'two build-in-public posts'], [sibyl]),
    technicalRequirements: known(['Sibyl Memory must be load-bearing', 'fresh-session recall must change a decision/action/result'], [sibyl]),
    prizeValue: known('$10,000 USDC across top five', [sibyl]),
    deadline: known('2026-09-10', [sibyl]),
    importantUnknowns: ['Existing-project policy', 'specific excluded sanctioned jurisdictions list'],
  },
];

export function getIntelligenceById(hackathonId: string): HackathonIntelligence | null {
  return hackathonIntelligence.find((item) => item.hackathonId === hackathonId) ?? null;
}

export function mergeHackathonWithIntelligence(hackathon: Hackathon) {
  const intelligence = getIntelligenceById(hackathon.id);

  return {
    ...hackathon,
    intelligence_status: intelligence ? 'verified_sidecar' : 'not_available',
    intelligence,
  };
}
