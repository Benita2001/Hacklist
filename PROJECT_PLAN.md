# HackList WebMCP Challenge Project Plan

## Objective

Build HackList WebMCP: an agent-native opportunity decision layer that helps a builder move from discovery to match, compare, decide, and readiness using real HackList opportunity data.

## Deadline

Submission deadline: September 3, 2026 at 1:00 PM Pacific Time.

This plan treats the deadline as a hard constraint. The submitted version must be working, hosted, documented, licensed, demonstrated in a video under 3 minutes, and left unchanged after the deadline.

## Sprint Mode

Depth: Sprint.

Canonical files:
- `PROJECT_PLAN.md`: execution map.
- `PRD.md`: product truth.
- `TRD.md`: technical truth.
- `TASKS.md`: executable work.
- `MEMORY.md`: durable discoveries.

No `ARCHITECTURE.md` for now. The architecture is small enough to live in `TRD.md`.

## Current Phase

Phase 5: pre-production checkpoint.

Phase 0 repository inspection is accepted. The repo is an existing Next.js 16.2.6 App Router product backed by Supabase. P0 is the unified HackList opportunity domain: hackathons, jobs, grants, bounties, and programs.

## Baseline Evidence

Pre-hackathon baseline commit: `ba4b401` on 2026-08-24T16:05:19-07:00.

Submission-period pre-WebMCP commits found during inspection:
- `cbf52ec`: social share image metadata.
- `5262599`: OG image asset.
- `847561d` and `3133813`: VerifiedBadge updates.

Do not rewrite git history. WebMCP work must be committed with dated history after the Submission Period start.

## Phase Sequence

1. Compliance and WebMCP spike
   - Add open-source license.
   - Register one real read-only WebMCP tool in the browser.
   - Prove the tool returns real Supabase opportunity data.

2. Intelligence sidecar
   - Create a small verified sidecar keyed by live Supabase hackathon IDs.
   - Cover approximately 8 to 12 current real hackathons.
   - Store explicit unknowns instead of inferred certainty.

3. Deterministic decision engine
   - Implement match, compare, and readiness logic using structured data.
   - Use STRONG FIT, POSSIBLE FIT, WEAK FIT, and INSUFFICIENT DATA.
   - Use PASS, FAIL, and UNKNOWN for eligibility-like facts.

4. WebMCP tool set
   - Register the final P0 tools from the browser page.
   - Route tool calls through server endpoints that read real HackList data.
   - Keep all P0 tools read-only.

5. Verification and deployment
   - Typecheck and targeted tests.
   - Verify WebMCP discovery and invocation in ChatGPT browser or Chrome 149+ with testing enabled.
   - Verify production URL, repo license, and documentation.

6. Demo and submission
   - Record the critical demo path.
   - Confirm public repository, license, working hosted app, project description, and demo video.
   - Freeze submitted repo/live app after September 3, 2026 at 1:00 PM PT.

## Major Milestones

- M1: A browser agent can discover and invoke `search_opportunities`, returning real HackList data.
- M2: At least 8 verified current hackathons have structured intelligence coverage.
- M3: `match_opportunities`, `compare_opportunities`, and `get_opportunity_readiness` produce inspectable deterministic reasoning.
- M4: The critical demo path works end to end in a WebMCP-capable browser.
- M5: Hosted app, public repo, license, README/submission docs, and demo video are ready.

## Critical Dependencies

- Native WebMCP support in ChatGPT browser or Chrome 149+ testing path.
- Supabase anon read access for active hackathon records.
- Curated verified intelligence for the demo fixture hackathons.
- Vercel deployment or existing HackList deployment path.

## Validation Spikes

- Spike 1: Register a real WebMCP tool on the existing app and call a real Supabase-backed endpoint.
- Spike 2: Verify that sidecar intelligence can join to live Supabase hackathon IDs.
- Spike 3: Run the critical prompt against the final tools in a WebMCP-capable browser.

## Gates

- Planning Gate: PASS if these documents give executable P0 scope, contracts, risks, and task order.
- Spike Gate: PASS only if an agent can discover and invoke at least one real HackList WebMCP tool.
- Build Gate: PASS only if all P0 tools work from real data and preserve UNKNOWN.
- Quality Gate: PASS only if the critical demo path works and no P0 compliance issue remains.
- Demo Gate: PASS only if submission artifacts match the final build.

## Time Budget

- WebMCP spike and compliance: immediate.
- Intelligence sidecar and matching engine: primary engineering block.
- Verification, deployment, and bug fixes: reserved before final demo.
- Demo recording and submission: protected final block.

## Major Blockers

- WebMCP may not be available in the local browser environment.
- The existing Supabase model lacks structured match/readiness fields.
- The current build fails in this environment when `next/font` cannot fetch Google Fonts.
- Existing lint errors predate this work; fix only if they block changed code, deployment, or verification.
