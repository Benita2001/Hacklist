# HackList WebMCP Challenge Memory

## Durable Facts

- Phase 0 inspection was accepted on 2026-09-02.
- This is an existing project, not a greenfield build.
- P0 WebMCP scope is the unified HackList opportunity domain: hackathons, jobs, grants, bounties, and programs.
- Pre-hackathon baseline commit is `ba4b401` from 2026-08-24T16:05:19-07:00.
- WebMCP Challenge work must be clearly distinguishable from pre-existing HackList work.
- Do not rewrite git history.

## Opportunity Scope Correction - 2026-09-03

- Production deployment remained stopped while final product-scope correction generalized WebMCP from hackathons-only to the full HackList opportunity domain.
- Read-only live Supabase schema/count probe found: `hackathons` 196 rows with `id,name,organizer,description,prize_pool,deadline,deadline_text,category,format,free_to_enter,apply_url,spotlight,verified,created_at`; `jobs` 32 rows with `id,title,company,description,salary,deadline,deadline_text,category,format,location,apply_url,spotlight,verified,created_at,job_type`; `grants` 13 rows with `id,name,organizer,description,amount,deadline,deadline_text,category,ecosystem,format,free_to_apply,apply_url,spotlight,verified,created_at`; `bounties` 34 rows with `id,name,organizer,description,reward,deadline,deadline_text,category,platform,apply_url,spotlight,verified,created_at,bounty_type`; `programs` 13 rows with `id,name,organizer,description,stipend,duration,deadline,deadline_text,category,format,type,apply_url,spotlight,verified,created_at`.
- `src/lib/webmcp/opportunities.ts` is the unified adapter/service layer over existing tables. It creates typed refs like `job:<id>`, normalized fields, typed values (`prize`, `salary`, `grant`, `reward`, `stipend`), original rows, and category-specific metadata without changing Supabase.
- Public WebMCP tools are now exactly `search_opportunities`, `get_opportunity`, `match_opportunities`, `compare_opportunities`, and `get_opportunity_readiness`; old hackathon-specific public routes were removed.
- Live route verification returned all five opportunity types in all-catalog search and mixed matching, got one real row from each table, produced readiness for each category, labeled bounty-vs-hackathon values as different kinds, and returned typed stale refs on 404.
- Chrome 152 + `chrome-devtools-mcp@1.8.0` listed and executed the five unified tools only; old hackathon tool names were absent.
- Local gates after correction: `./node_modules/.bin/tsc --noEmit` PASS, `npm run test:webmcp` PASS 21/21, `npm run lint` PASS. `npm run build` PASS with network access for Google Fonts.

## Data Decisions

- Live Supabase `hackathons`, `jobs`, `grants`, `bounties`, and `programs` are the source of truth for P0 opportunity discovery.
- Legacy `data/hackathons.json` is not current enough for P0 intelligence reuse. It has 6 records and zero active Supabase ID matches as of 2026-09-02.
- Use a small sidecar keyed by live Supabase hackathon IDs for verified intelligence.
- The code sidecar is acceptable for challenge-speed prototyping, but long-term HackList should move structured intelligence into a separate Supabase table keyed by `hackathon_id` while preserving existing listing tables and submission flow.
- Prefer verified hackathon intelligence sidecar depth where available; for jobs, grants, bounties, and programs, use base listing facts and preserve UNKNOWN rather than fabricating enrichment.

## Matching Decisions

- LLMs/browser agents may translate natural language into structured inputs.
- HackList owns deterministic matching and comparison logic.
- Use STRONG FIT, POSSIBLE FIT, WEAK FIT, and INSUFFICIENT DATA.
- Use PASS, FAIL, and UNKNOWN for eligibility-like facts.
- Never output fake precision percentages.
- Matching must not branch on a specific country, hackathon ID, hackathon name, sponsor, or demo sentence.

## Known Risks

- Existing lint errors predate WebMCP work.
- `npm run build` failed locally because `next/font` could not fetch Google Fonts.
- The existing Supabase schema lacks structured eligibility, skills, country restrictions, team rules, submission requirements, hardware requirements, and existing-project policy.
- WebMCP browser support must be validated in ChatGPT browser or Chrome 149+ testing path.

## Verification Notes

- `./node_modules/.bin/tsc --noEmit` passed during Phase 0.
- Live Supabase read checks succeeded with anon credentials during Phase 0.
- Historical superseded spike: on 2026-09-02, `search_hackathons` source and API spike compiled and returned real Supabase hackathon data through local Next dev server.
- Installed Chrome is 152.0.7977.76. Final WebMCP discovery/invocation still needs a browser session with `chrome://flags/#enable-webmcp-testing` enabled or ChatGPT's WebMCP-capable browser.
- On 2026-09-02/2026-09-03 UTC, Gate 1 was retried with Chrome 152 and `chrome-devtools-mcp@1.8.0` using `--categoryExperimentalWebmcp` and Chrome `--enable-features=WebMCP`.
- In that run, `document.modelContext` was present and `navigator.modelContext` was undefined, proving the current registration path was canonical `document.modelContext`.
- Historical superseded spike: `list_webmcp_tools` returned `search_hackathons` and `execute_webmcp_tool` invoked `POST http://localhost:3000/api/webmcp/hackathons/search [200]`.
- The WebMCP execution output returned the real Supabase row `cb753d89-e58a-46d1-aa05-fddf5c176fbb` / `The WebMCP Challenge` / organizer `OpenAI`.
- No-result execution returned `ok: true`, `count: 0`, and `hackathons: []`.
- Invalid JSON passed to `execute_webmcp_tool` failed before app execution with a JSON parse error.
- Historical superseded spike: reload/remount showed one `search_hackathons` tool, not duplicates.
- Navigation to `about:blank` showed `No WebMCP tools available`, confirming cleanup/unregister behavior through page lifecycle.
- Chrome launched without `--enable-features=WebMCP` had `document.modelContextType: "undefined"` and no WebMCP tools, with no console errors.
- Remaining Gate 1 gap: conversational natural-language discovery/use by ChatGPT or another browser agent is still UNKNOWN; Chrome DevTools MCP proves browser discovery and execution but is not the final judge-style conversational path.
- Gates 2-4 were implemented on 2026-09-02/2026-09-03 UTC.
- `src/lib/webmcp/intelligence.ts` contains verified sidecar entries for 9 current Supabase hackathon IDs: WebMCP Challenge, AI Gateway Hackathon, Alpaca AI Trading Agents Hackathon, Agentic Cinema Hackathon, Pokemon TCG AI Battle Challenge: Strategy, Shipaton 2026, Algorand Global x402 Challenge, Arbitrum Open House Dubai: Online Buildathon, and Sibyl Labs Hackathon.
- `src/lib/webmcp/matching.ts` contains deterministic matching, comparison, and readiness logic with `STRONG_FIT`, `POSSIBLE_FIT`, `WEAK_FIT`, `INSUFFICIENT_DATA`, `PASS`, `FAIL`, and `UNKNOWN` statuses.
- Architecture correction added generic country normalization in `src/lib/webmcp/countries.ts`, structured eligibility rules, generic profile fields, graceful unenriched-record handling, and no forced comparison recommendation unless an item earns `STRONG_FIT`.
- Historical superseded Build Review state: `src/components/webmcp/WebMcpRegistrar.tsx` briefly registered hackathon-specific WebMCP tools before the opportunity-domain correction replaced them.
- Current state: `src/components/webmcp/WebMcpRegistrar.tsx` registers five read-only canonical `document.modelContext` tools: `search_opportunities`, `get_opportunity`, `match_opportunities`, `compare_opportunities`, and `get_opportunity_readiness`.
- Current Chrome 152 + `chrome-devtools-mcp@1.8.0` state: all five unified tools listed and executed on `http://localhost:3000`; old hackathon-specific public tool names were absent.
- Build Review contract cleanup removed `availableHours`, `experienceLevel`, and `willingToUseHardware` from public WebMCP match/compare schemas, server normalization, and matcher profile types.
- `tests/webmcp.matching.test.ts` now red-teams profiles A-L across AI, Web3, mobile, trading, game strategy, memory agents, geography failures, avoid terms, and minimal data. It also verifies active unenriched hackathons remain in the match result set as `INSUFFICIENT_DATA`.
- `src/components/webmcp/WebMcpAgentState.tsx` adds minimal visible human-agent state after WebMCP tool calls; no chatbot or redesign was added.
- `./node_modules/.bin/tsc --noEmit` passed during Build Review.
- `npm run test:webmcp` passed 15/15 tests during Build Review.
- `npm run lint` passed during Build Review after narrow React hook lint fixes in providers/modal/header and unused-component cleanup.
- `npm run build` passed during Build Review when rerun with network access for Google Fonts.
- Browser chain verification passed for `search_opportunities -> get_opportunity`, `match_opportunities -> compare_opportunities -> get_opportunity_readiness`, stale typed refs, all-five-category search, and all-five-category mixed matching. The visible activity state appeared after a browser `match_opportunities` execution.

## WebMCP Intelligence Audit - 2026-09-03

| Hackathon | Authoritative source checked | Verified coverage in sidecar | UNKNOWN retained |
| --- | --- | --- | --- |
| The WebMCP Challenge | Devpost rules/resources, OpenAI supported countries | Deadline, OpenAI-API-country eligibility with explicit exclusions, WebMCP technical requirement, public repo/license, live URL, demo video, existing-project extension policy, no special hardware | Exact maximum team size |
| AI Gateway Hackathon | Vercel AI Gateway Hackathon page | Vercel + AI Gateway runtime requirement, open-source repo, repo plus video or working-agent link, prizes in AI Gateway credits, worldwide participation language | Existing-project policy, maximum team size |
| Alpaca AI Trading Agents Hackathon | lablab.ai Alpaca hackathon page | Online dates, $6,000 prize pool, build AI trading agents using Alpaca Trading API/MCP server/CLI, worldwide online participation | Team size, existing-project policy, full submission checklist |
| Agentic Cinema Hackathon | Devpost official rules | Deadline, country/jurisdiction exclusions, max team size 4, new-project-only policy, Google Cloud/Gemini/Agent Builder and partner-track requirements, public repo, hosted URL, demo video | None currently material |
| Pokemon TCG AI Battle Challenge: Strategy | Kaggle rules and timeline pages | $240,000 total prizes, max team size 5, one hackathon submission per team, same Simulation-division team requirement, final submission deadline | Existing-project policy |
| Shipaton 2026 | RevenueCat Devpost official rules | Deadline, eligibility structure, mobile platform/store requirements, RevenueCat SDK or Ads requirement, first public store release during submission window, demo video under 2 minutes | Exact maximum team size |
| Algorand Global x402 Challenge | Algorand Global x402 Challenge page | x402 paid endpoint, Algorand Mainnet/public HTTPS, GoPlausible facilitator, Bazaar discovery, required tag, real MainNet payment, prize pools, early October timeline | Eligibility exclusions, team size, existing-project policy |
| Arbitrum Open House Dubai: Online Buildathon | HackQuest Arbitrum page | Online mode, $30,000 prizes, Stylus/Solidity, Arbitrum One/Orbit deployment, existing product or scratch allowed, submission deadline corrected to 2026-12-06 | Country eligibility, team size, full submission checklist, judging criteria |
| Sibyl Labs Hackathon | Sibyl Labs hackathon page | Build window, $10,000 USDC prize pool, teams 1-5, Sibyl Memory load-bearing requirement, public repo/license, README, demo, build-in-public posts | Existing-project policy, exact sanctioned-jurisdiction list |
