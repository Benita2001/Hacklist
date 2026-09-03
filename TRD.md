# HackList WebMCP Challenge TRD

## Current Stack

- Framework: Next.js 16.2.6 App Router.
- Language: TypeScript.
- Package manager: npm.
- UI: React 19.2.4, Tailwind CSS v4, CSS custom properties.
- Database: Supabase via `@supabase/supabase-js`.
- Search: Fuse.js for existing hackathon UI search.
- Hosting assumption: Vercel / `hacklist.io`.
- Auth: none for P0.

## Existing Data Reality

Live Supabase `hackathons` columns:
- `id`
- `name`
- `organizer`
- `description`
- `prize_pool`
- `deadline`
- `deadline_text`
- `category`
- `format`
- `free_to_enter`
- `apply_url`
- `spotlight`
- `verified`
- `created_at`

As of 2026-09-02, live Supabase had 196 hackathons and 55 active hackathons.

Legacy `data/hackathons.json` has richer fields, but it contains only 6 records and zero IDs matched the current active Supabase hackathons during inspection. Do not treat it as current source of truth.

## Storage Decision

Keep Supabase for P0 because it already backs the production product and is readable from the existing app. Do not migrate to Neon, Upstash, Vercel Blob, or another store during P0.

Add a small code-side intelligence sidecar keyed by live Supabase hackathon IDs for the challenge deadline. This is safer than redesigning all Supabase tables before submission, but it is not the preferred permanent architecture.

Implemented file:
- `src/lib/webmcp/intelligence.ts`

The sidecar contains only verified facts needed for matching, comparison, and readiness, keyed by current Supabase hackathon IDs.

Long-term architecture recommendation:
- Preserve the existing `hackathons` listing table and submit/listing flows.
- Add a separate Supabase intelligence table keyed by `hackathon_id`, with structured eligibility rules, normalized country codes, source references, verification timestamps, and unknown fields.
- Keep raw listings and verified intelligence separate so new opportunities can be listed immediately, then enriched progressively.
- Do not add intelligence columns directly onto the public listing workflow unless moderation and verification ownership are explicit.

## Intelligence Sidecar Schema

```ts
type EligibilityRuleType =
  | "WORLDWIDE"
  | "INCLUDED_COUNTRIES"
  | "EXCLUDED_COUNTRIES"
  | "SUPPORTED_COUNTRY_SET"
  | "REGION_ONLY"
  | "IN_PERSON_LOCATION_REQUIRED"
  | "UNKNOWN";

interface EligibilityRule {
  type: EligibilityRuleType;
  includedCountryCodes?: string[];
  excludedCountryCodes?: string[];
  supportedCountrySet?: string;
  region?: string;
  notes: string;
}

interface HackathonIntelligence {
  hackathonId: string;
  sourceUrls: string[];
  verifiedAt: string;
  technologies: Fact<string[]>;
  relevantSkills: Fact<string[]>;
  themes: Fact<string[]>;
  geographicEligibility: Fact<EligibilityRule>;
  teamRules: Fact<{ min: number; max: number; soloAllowed: boolean; notes: string }>;
  existingProjectPolicy: Fact<"allowed" | "new_only" | "restricted">;
  hardwareRequirement: Fact<"none" | "mobile_device" | "cloud_or_account" | "specific_hardware">;
  submissionRequirements: Fact<string[]>;
  technicalRequirements: Fact<string[]>;
  prizeValue: Fact<string>;
  deadline: Fact<string>;
  importantUnknowns: string[];
}
```

Eligibility is structured as reusable rules, not prose-only country notes. Current implementation normalizes common country names/formal names/alpha-2 codes through `src/lib/webmcp/countries.ts`, including Ghana/GH, Tanzania/TZ, Mozambique/MZ, Nigeria/NG, Kenya/KE, India/IN, Canada/CA, Germany/DE, and the verified exclusion jurisdictions represented in the sidecar.

If a rule references an external source set, such as OpenAI-supported API countries, the matcher uses the local reviewed subset as evidence. Countries outside that reviewed subset return `UNKNOWN`, not `FAIL`, until the authoritative source is verified.

Current verified sidecar records:
- `cb753d89-e58a-46d1-aa05-fddf5c176fbb` — The WebMCP Challenge.
- `bc820463-91d8-4780-bdcf-b7dadae6bc15` — AI Gateway Hackathon.
- `0db54252-9af9-4db2-91f2-4fc800db8add` — Alpaca AI Trading Agents Hackathon.
- `ad10ce60-09b1-48f9-836c-92285e4ded2d` — Agentic Cinema Hackathon.
- `cc779346-4ac2-4094-815e-cc1165019603` — Pokemon TCG AI Battle Challenge: Strategy.
- `96bf4960-9744-4553-8d90-81dbe8e530bb` — Shipaton 2026.
- `7ed485fb-5061-4e67-b240-b2614f698627` — Algorand Global x402 Challenge.
- `ad098ef3-21c8-4a40-9d52-ac3c9a69c7c6` — Arbitrum Open House Dubai: Online Buildathon.
- `d49c47c9-7218-49a0-b6c3-544a975873be` — Sibyl Labs Hackathon.

## WebMCP Browser Contract

Primary technical sources selected from the WebMCP Challenge resources:
- Devpost resource hub and FAQ: deadline, testing path, submission artifacts, public repo/license requirement, no edits after deadline.
- `webmachinelearning/webmcp`: specification source, lifecycle, same-origin discovery, `getTools`, `executeTool`, permissions policy, and `AbortSignal` behavior.
- Google Chrome WebMCP overview: WebMCP is a progressive enhancement for browser agents, replacing brittle UI actuation with page-declared tools.
- Google Chrome Imperative API: canonical API shape for `document.modelContext.registerTool`, `inputSchema`, `annotations`, `AbortSignal` cleanup, tool discovery, and cross-origin gating.
- Google Chrome origin trial: production-enablement path for deployed testing.
- Google Chrome secure-tools guide: `readOnlyHint`, `untrustedContentHint`, prompt-injection boundaries, least exposure, and confirmation expectations.
- Google Chrome best practices: tool strategy, non-overlapping tools, strict code validation, bounded outputs, useful errors, and static registration by default.
- Google Chrome WebMCP evals: test whether agents choose the right tool, pass valid arguments, chain information correctly, and complete the critical user journey.
- Chrome DevTools WebMCP panel: inspect registered tools, schemas, lifecycle, and invocation history.
- Vercel storefront WebMCP PR: closest implementation precedent for adding WebMCP to an existing Next/Vercel app with one null-rendering Client Component, `AbortSignal` cleanup, bounded outputs, server-side validation, and unsupported-browser fallback.

Resources intentionally not selected for P0 implementation:
- Cloudflare Workers templates and Browser Run docs: useful if hosting moved to Cloudflare, but HackList is already Vercel/Supabase-oriented.
- Shopify WebMCP docs and Catalog API: ecommerce-specific and not relevant to hackathon decision tools.
- Angular WebMCP docs: framework mismatch.
- Render/Netlify starter templates: deployment alternatives only.
- ChatGPT Sites: not needed because HackList already exists as a Next.js product.

Use the imperative WebMCP API with feature detection:

- Entry point: `document.modelContext`.
- Gate 1 counts only the canonical browser path: `document.modelContext`; the runtime registrar must not fall back to `navigator.modelContext`.
- Register tools from a Client Component mounted on the existing app.
- Use `AbortController` signal for lifecycle cleanup.
- Mark all P0 tools with `annotations.readOnlyHint = true`.
- Mark tools returning descriptions/source-derived text with `annotations.untrustedContentHint = true`.
- Keep registration same-origin and top-level for P0. Do not use `exposedTo` unless a trusted cross-origin iframe agent becomes a verified requirement.
- Keep unsupported browsers on the normal HackList experience with no visible breakage.
- Return plain structured JSON values optimized for agent reasoning.
- Keep result payloads bounded so the agent receives decision-grade facts, not full database dumps.

Do not use stale APIs such as `navigator.webmcp`, `provideContext`, `clearContext`, or a broad synthetic context dump.

Current implementation note: `src/types/webmcp.d.ts` is a local minimal type shim for the spike. Before finalizing the full tool set, prefer installing `webmcp-types` only if it materially reduces API drift risk without slowing the deadline path.

## P0 Tool Contract

The public WebMCP surface exposes HackList's opportunity domain, not one tool family per category.

### `search_opportunities`

Purpose: Search active HackList opportunities across live Supabase `hackathons`, `jobs`, `grants`, `bounties`, and `programs`.

Input:
- `query?: string`
- `type?: "hackathon" | "job" | "grant" | "bounty" | "program"`
- `category?: "AI" | "Web3" | "Both"`
- `format?: string`
- `verifiedOnly?: boolean`
- `limit?: number`

Output:
- `source`
- `generatedAt`
- `count`
- `opportunities[]` with normalized common fields, typed `ref`, typed `value`, original row metadata, and hackathon intelligence when available.

### `get_opportunity`

Purpose: Return one typed opportunity reference.

Input:
- `{ type, id }`, or
- `opportunityRef: "type:id"`

Output:
- normalized opportunity fields.
- category-specific `metadata`.
- original source row.
- verified hackathon intelligence if available.

### `match_opportunities`

Purpose: Rank active HackList opportunities against structured builder constraints using category-aware dimensions.

Input:
- `type?: "hackathon" | "job" | "grant" | "bounty" | "program"`
- `opportunityTypes?: OpportunityType[]`
- `country?: string`
- `skills?: string[]`
- `technologies?: string[]`
- `interests?: string[]`
- `availableDays?: number`
- `preferredFormats?: ("Online" | "In-Person" | "Hybrid" | "Remote" | "Any")[]`
- `avoid?: string[]`
- `teamSize?: number`
- `solo?: boolean`
- `minimumValue?: number`
- `hasExistingProject?: boolean`
- `limit?: number`

Output:
- `matches[]` with `fit`, typed opportunity refs, common dimensions, blockers, reason codes, data completeness, and normalized opportunities.

### `compare_opportunities`

Purpose: Compare 2 to 4 typed opportunities without pretending every category is economically or operationally equivalent.

Input:
- `opportunities: { type, id }[]`
- `profile?: object`

Output:
- category-aware match rows.
- `comparability` note, especially for salary vs prize vs grant vs reward vs stipend.
- recommendation only when evidence supports `STRONG_FIT`.

### `get_opportunity_readiness`

Purpose: Return a category-aware readiness checklist without claiming the user has completed anything HackList does not know.

Input:
- `{ type, id }`, or
- `opportunityRef: "type:id"`

Output:
- known listing facts.
- category-specific unknowns.
- hackathon submission/readiness details when verified sidecar intelligence exists.

## Actual Supabase Table Schemas

Read-only probe on 2026-09-03 found:
- `hackathons` count 196: `id`, `name`, `organizer`, `description`, `prize_pool`, `deadline`, `deadline_text`, `category`, `format`, `free_to_enter`, `apply_url`, `spotlight`, `verified`, `created_at`.
- `jobs` count 32: `id`, `title`, `company`, `description`, `salary`, `deadline`, `deadline_text`, `category`, `format`, `location`, `apply_url`, `spotlight`, `verified`, `created_at`, `job_type`.
- `grants` count 13: `id`, `name`, `organizer`, `description`, `amount`, `deadline`, `deadline_text`, `category`, `ecosystem`, `format`, `free_to_apply`, `apply_url`, `spotlight`, `verified`, `created_at`.
- `bounties` count 34: `id`, `name`, `organizer`, `description`, `reward`, `deadline`, `deadline_text`, `category`, `platform`, `apply_url`, `spotlight`, `verified`, `created_at`, `bounty_type`.
- `programs` count 13: `id`, `name`, `organizer`, `description`, `stipend`, `duration`, `deadline`, `deadline_text`, `category`, `format`, `type`, `apply_url`, `spotlight`, `verified`, `created_at`.

## Unified Opportunity Contract

Internal normalized shape:
- `ref`: stable compound reference, e.g. `job:<id>`.
- `id`, `type`, `title`, `organization`, `description`.
- `deadline`, `deadlineText`, `location`, `format`, `categories`.
- `applyUrl`, `verified`.
- `value`: `{ kind, label, raw }` where kind is `prize`, `salary`, `grant`, `reward`, `stipend`, or `unknown`.
- `metadata`: category-specific fields such as `freeToEnter`, `jobType`, `ecosystem`, `platform`, `bountyType`, `duration`, `programType`.
- `original`: original source row for traceability.
- `intelligence`: optional, currently populated for verified hackathon sidecar entries.

## Matching Rules

No LLM-owned scoring.

Deterministic rules:
- No rule branches on user country identity, hackathon ID, hackathon name, sponsor name, or the demo sentence.
- Matching depends only on user constraints, opportunity facts, and general rules.
- Eligibility FAIL makes overall fit WEAK FIT unless the failure is unrelated to the user.
- Eligibility UNKNOWN caps overall fit at POSSIBLE FIT.
- Missing intelligence caps overall fit at INSUFFICIENT DATA unless enough known dimensions remain for POSSIBLE FIT.
- A deadline within 24 hours is HIGH deadline risk.
- A one-day user can be HIGH or MEDIUM time feasibility only when submission burden is known LOW or MEDIUM.
- Technology fit is STRONG when at least one required or recommended technology matches the user's skills and no required technology gap is known.
- Larger prize never overrides FAIL eligibility or HIGH deadline risk by itself.
- Compared opportunities produce a recommendation only when at least one item earns STRONG_FIT; otherwise the recommendation is intentionally null.
- Unenriched active listings remain eligible for search and matching output with base listing data known, deep intelligence unknown, and LOW confidence.

## Supabase Impact Audit

- Existing Supabase tables altered: NO repository evidence of table alterations.
- Columns added/removed/renamed: NO repository evidence of schema changes.
- Migrations executed: NO migration files or SQL migration artifacts are present in the repo.
- RLS policies altered: NO repository evidence of RLS or policy changes.
- Existing insert/update flows changed: NO diff in `src/app/api/submit/route.ts`, `src/app/submit/SubmitForm.tsx`, `src/lib/supabase.ts`, `src/lib/data.ts`, or `scripts/seed.ts` from this WebMCP correction pass.
- Normal HackList listing submission: unchanged repository path; `/api/submit` still inserts into `listing_requests`.
- Intelligence sidecar location: code, in `src/lib/webmcp/intelligence.ts`; no Supabase intelligence table exists yet.
- New listing without intelligence: `search_opportunities` still returns it from live Supabase; `match_opportunities` can include it as `INSUFFICIENT_DATA` or lower-confidence evidence with UNKNOWN deep facts.

## API and App Implementation

Implemented routes:
- `POST /api/webmcp/opportunities/search`
- `/api/webmcp/opportunities/get`
- `/api/webmcp/opportunities/match`
- `/api/webmcp/opportunities/compare`
- `/api/webmcp/opportunities/readiness`

Implemented modules:
- `src/components/webmcp/WebMcpRegistrar.tsx` registers all five page tools through canonical `document.modelContext`.
- `src/lib/webmcp/opportunities.ts` owns the unified opportunity adapter layer, typed refs, search, match, compare, readiness, and live Supabase loading across all five tables.
- `src/lib/webmcp/server.ts` remains as hackathon-specific support for legacy internal helpers.
- `src/lib/webmcp/matching.ts` remains as hackathon-specific verified-intelligence support.
- `src/lib/webmcp/countries.ts` owns general country normalization and reusable country sets.
- `src/lib/webmcp/intelligence.ts` owns verified sidecar facts and source provenance.
- `tests/webmcp.matching.test.ts` covers deterministic matching behavior.
- `tests/webmcp.opportunities.test.ts` covers unified opportunity behavior across all five categories.

## Security

- P0 tools are read-only.
- Do not expose tools to cross-origin frames unless a trusted origin is explicitly required.
- Do not include secrets in tool output.
- Limit query/input lengths.
- Treat description and source content as untrusted data.
- Preserve unknowns instead of letting the browser agent infer missing facts.
- Validate all tool arguments again in route handlers; schemas are agent guidance, not security boundaries.
- Return reduced error messages to the agent. Log operational details server-side without leaking secrets or upstream internals.
- Avoid mutating UI/application state in P0 tools unless it is only a visible read-result update.
- If any future tool mutates state, remove `readOnlyHint`, require clear user confirmation, and report ambiguous outcomes as unsafe to retry.

## Verification Path

- Typecheck with `./node_modules/.bin/tsc --noEmit`.
- Run targeted API calls locally.
- Start the dev server.
- In Chrome 149+ with `chrome://flags/#enable-webmcp-testing` or ChatGPT's WebMCP-capable browser, verify `document.modelContext` exists, tools are discoverable, and the agent invokes `search_opportunities`.
- Use Chrome DevTools Application > WebMCP to inspect available tools, schemas, lifecycle, and invocation history.
- Use `document.modelContext.getTools()` and `document.modelContext.executeTool()` for manual smoke testing where available.
- Add focused eval prompts for the critical demo path:
  - choose `search_opportunities` for discovery,
  - choose `match_opportunities` for arbitrary builder country, skill, time, format, team, and avoidance constraints,
  - choose `compare_opportunities` for cross-category tradeoffs,
  - choose `get_opportunity_readiness` for application/submission requirements.
- Verify production deployment separately from local success.
- After final deployment, verify the live URL remains free to test until judging ends on September 21, 2026 at 5:00 PM PT.

Latest local evidence:
- `./node_modules/.bin/tsc --noEmit`: PASS.
- `npm run test:webmcp`: PASS, 21/21 tests, including red-team profiles A-L and opportunity-domain coverage across all five categories.
- `npm run lint`: PASS.
- `npm run build`: PASS when rerun with network access for Google Fonts.
- Chrome 152 + `chrome-devtools-mcp@1.8.0` + `--enable-features=WebMCP`: PASS for all five unified WebMCP tool registrations and executions on `http://localhost:3000`.
- Browser chain verification: PASS for `search_opportunities -> get_opportunity`, `match_opportunities -> compare_opportunities -> get_opportunity_readiness`, stale typed refs, full active-catalog search across all five types, and mixed-type match output across all five types.
- Visible activity state: PASS. After a browser `match_opportunities` tool call, the page renders `Agent matched opportunities` while the WebMCP registrar remains mounted and registered.
- Architecture correction audit: PASS. Search found no matching branch equivalent to `if country is Nigeria`, `if hackathon is WebMCP Challenge`, or `boost WebMCP`; remaining named references are opportunity facts, URLs, IDs, and tests.

## Risks and Fallbacks

- WebMCP not available locally: use Chrome 149+ testing flag or ChatGPT browser; if still blocked, document exact blocker and keep API/tool registration code ready.
- Sidecar data too thin: reduce demo fixture to fewer hackathons with excellent verification.
- Supabase unavailable: fail tools with clear `source_unavailable` errors; do not return mock data.
- Build blocked by Google Fonts fetch: use typecheck for code validation and deploy in an environment with font fetch access, or switch to local fonts only if deployment requires it.
- API drift risk: WebMCP is experimental and subject to change. Keep all registration code isolated in `WebMcpRegistrar` and final verification anchored to current Chrome/ChatGPT behavior.
