# HackList WebMCP Challenge Tasks

## Status Legend

- TODO
- IN_PROGRESS
- DONE
- BLOCKED

## Tasks

| ID | Priority | Status | Phase | Goal | Dependencies | Acceptance Check |
| --- | --- | --- | --- | --- | --- | --- |
| HAK-WEBMCP-001 | P0 | DONE | Spike | Add license and canonical Sprint planning docs | Phase 0 accepted | `LICENSE`, `PROJECT_PLAN.md`, `prd.md`, `TRD.md`, `TASKS.md`, `MEMORY.md` exist |
| HAK-WEBMCP-002 | P0 | DONE | Spike | Register real read-only HackList WebMCP tools | Existing Next app | Client registers through `document.modelContext.registerTool` when available |
| HAK-WEBMCP-003 | P0 | DONE | Spike | Add real Supabase-backed opportunity search endpoint | Supabase anon read access | API returns active opportunities from live HackList tables |
| HAK-WEBMCP-004 | P0 | DONE | Gate 1 | Verify WebMCP discovery/invocation | HAK-WEBMCP-002, HAK-WEBMCP-003 | Chrome 152 + `chrome-devtools-mcp@1.8.0` with `--categoryExperimentalWebmcp` lists and executes page WebMCP tools; conversational ChatGPT/browser-agent natural-language discovery remains a manual pre-submission check |
| HAK-WEBMCP-005 | P0 | DONE | Data | Create verified intelligence sidecar for 8 to 12 current hackathons | Live Supabase IDs | Sidecar IDs join to current Supabase hackathons and include source URLs |
| HAK-WEBMCP-006 | P0 | DONE | Engine | Implement deterministic matching logic | HAK-WEBMCP-005 | Critical demo profile returns inspectable fits with UNKNOWN preserved |
| HAK-WEBMCP-007 | P0 | DONE | Tools | Implement unified `get_opportunity`, `match_opportunities`, `compare_opportunities`, `get_opportunity_readiness` | HAK-WEBMCP-005, HAK-WEBMCP-006 | All tools are discoverable and read-only |
| HAK-WEBMCP-012 | P0 | DONE | Scope Correction | Generalize WebMCP from hackathons to all HackList opportunity types | HAK-WEBMCP-007 | Hackathons, jobs, grants, bounties, and programs are searchable, gettable, matchable, comparable, and readiness-checkable through unified tools |
| HAK-WEBMCP-008 | P0 | TODO | Verification | Verify critical demo path end to end | HAK-WEBMCP-007 | Agent answers all three demo questions from tool calls |
| HAK-WEBMCP-009 | P0 | DONE | Compliance | Document existing project versus WebMCP extension in README/submission notes | HAK-WEBMCP-007 | README names the real `document.modelContext.registerTool` implementation, lists the five read-only opportunity tools, and commit evidence will preserve challenge-period work |
| HAK-WEBMCP-010 | P0 | TODO | Deployment | Verify hosted app and production WebMCP behavior | HAK-WEBMCP-008 | Hosted URL works in supported WebMCP browser |
| HAK-WEBMCP-011 | P0 | TODO | Demo | Prepare and record demo video under 3 minutes | HAK-WEBMCP-010 | Video shows functioning WebMCP tools and critical path |

## Gate 1 Validation State

- PASS: Chrome 152 exposes canonical `document.modelContext.registerTool` when launched with `--enable-features=WebMCP`.
- PASS: `chrome-devtools-mcp@1.8.0` exposes `list_webmcp_tools` and `execute_webmcp_tool` when started with `--categoryExperimentalWebmcp`.
- PASS: `search_opportunities` is discoverable through the WebMCP inspection path with its description, JSON input schema, and read-only/untrusted annotations.
- PASS: `execute_webmcp_tool` invokes `search_opportunities` and the request reaches `/api/webmcp/opportunities/search`.
- PASS: The API returns real Supabase data for `The WebMCP Challenge`.
- PASS: No-result searches return `ok: true`, `count: 0`, and an empty `opportunities` array.
- PASS: Invalid JSON passed to `execute_webmcp_tool` fails before app execution with a parse error.
- PASS: Reload/remount leaves one unified opportunity tool set visible.
- PASS: Navigating away to `about:blank` removes WebMCP tools from the page.
- PASS: Chrome without `--enable-features=WebMCP` has no `document.modelContext`, no registered tools, and no console errors.
- UNKNOWN: A conversational WebMCP-capable browser agent discovering the tool from natural language still needs direct proof.

## Gates 2-4 Validation State

- PASS: Verified intelligence sidecar implemented in `src/lib/webmcp/intelligence.ts` for 9 live Supabase hackathon IDs.
- PASS: Sidecar entries preserve source URLs, `KNOWN`/`UNKNOWN` fact status, eligibility exclusions, submission requirements, technical requirements, deadlines, and important unknowns.
- PASS: Deterministic engine implemented in `src/lib/webmcp/matching.ts` with `STRONG_FIT`, `POSSIBLE_FIT`, `WEAK_FIT`, `INSUFFICIENT_DATA`, `PASS`, `FAIL`, and `UNKNOWN`; no percentage precision.
- PASS: Architecture correction removed demo-shaped public inputs and changed eligibility to generic normalized country/rule evaluation.
- PASS: `match_opportunities` keeps base live records discoverable and uses lower-confidence/UNKNOWN output when deep intelligence is not present.
- PASS: Unified API routes exist for `search`, `get`, `match`, `compare`, and `readiness`.
- PASS: Chrome 152 + `chrome-devtools-mcp@1.8.0` listed all five unified page-exposed tools on `http://localhost:3000`.
- PASS: Browser `execute_webmcp_tool` successfully executed all five unified tools with the generic opportunity profile contract.
- PASS: `./node_modules/.bin/tsc --noEmit` passed.
- PASS: `npm run test:webmcp` passed 21/21 deterministic matching tests, including red-team profiles A-L and all-five-category opportunity coverage.
- PASS: `npm run build` passed when rerun with network access for Google Fonts.
- PASS: Public match/compare profile contracts are simplified to opportunity type(s), country, skills, technologies, interests, available days, formats, avoid terms, team size, solo, minimum value, existing-project status, and limit.
- PASS: Minimal visible WebMCP agent activity state was added; it appears only after browser tool execution and does not introduce a chatbot or redesign.
- PASS: Browser chain verification covered `search_opportunities -> get_opportunity`, `match_opportunities -> compare_opportunities -> get_opportunity_readiness`, stale typed refs, all-five-category search, and all-five-category mixed matching.
- PASS: `npm run lint` passed after narrow React hook lint fixes and unused-component cleanup.
- PASS: `npm run build` passed after rerun with network access for Google Fonts.

## Opportunity Scope Correction State

- PASS: Actual live table schemas were read for `hackathons`, `jobs`, `grants`, `bounties`, and `programs`; no table redesign or migration was performed.
- PASS: `src/lib/webmcp/opportunities.ts` maps current table rows into a small normalized Opportunity model with typed `ref`, common fields, typed `value`, original row, and category-specific metadata.
- PASS: Public WebMCP tools are now exactly `search_opportunities`, `get_opportunity`, `match_opportunities`, `compare_opportunities`, and `get_opportunity_readiness`.
- PASS: Old hackathon-specific API route handlers were removed from `src/app/api/webmcp/hackathons/*`; hackathon intelligence/matching internals remain only as support code.
- PASS: Live route probe returned all five opportunity types in all-catalog search and mixed-type matching, successfully got one real record from each category, returned readiness for each category, compared bounty vs hackathon with non-equivalent values labeled, and returned typed stale refs on 404.

## Supabase Impact State

- PASS: WebMCP work reads existing Supabase `hackathons`, `jobs`, `grants`, `bounties`, and `programs` records and does not alter tables, columns, migrations, RLS, or existing listing submission flows.
- PASS: Deeper intelligence currently exists only for selected hackathons; other categories use base listing data with UNKNOWNs for deeper eligibility/application details.
- NEXT ARCHITECTURE STEP: Move verified intelligence into a separate Supabase table keyed by `hackathon_id` after the challenge deadline path is stable.

## Scope Change Protocol

New work is deferred unless it strengthens P0, WebMCP proof, compliance, or the critical demo path.

Do not spend P0 time on auth, embeddings, scraping infrastructure, automatic applications, broad redesign, database migrations, or unrelated infrastructure fixes.
