# HackList WebMCP Challenge PRD

## Product

HackList WebMCP helps a builder's browser agent decide which active opportunity is realistically worth pursuing, using real HackList data plus verified hackathon intelligence where available.

## Problem

Builders can discover hackathons, jobs, grants, bounties, and programs, but deciding fit still requires opening listings, reading requirements, checking deadlines, comparing value versus feasibility, and translating each opportunity into an action plan.

## Target User

An AI or Web3 builder with limited time who wants their browser agent to help choose a realistic hackathon and explain the tradeoffs.

## Desired Outcome

The user gets a small set of realistic opportunity candidates, inspectable reasons for the recommendation, a comparison against alternatives, and a readiness checklist for the selected opportunity.

## Core Insight

WebMCP lets HackList expose domain operations directly to the user's agent. The agent should not scrape the UI and guess. It should call HackList tools that return structured facts, explicit unknowns, and deterministic reasoning.

## P0 Scope

P0 focuses on the unified HackList opportunity domain: hackathons, jobs, grants, bounties, and programs.

P0 capabilities:
- Search active opportunities from real HackList data.
- Return authoritative details for one typed opportunity.
- Match opportunities against structured user constraints.
- Compare selected opportunities across meaningful dimensions without pretending different value types are equivalent.
- Return readiness information for a selected opportunity.
- Preserve PASS, FAIL, and UNKNOWN where data is incomplete.
- Document pre-existing HackList versus WebMCP Challenge extension.
- Include an open-source license.

## P1 Scope

P1 may happen only after P0 is stable:
- Deeper verified intelligence for jobs, grants, bounties, and programs.
- More than 12 hackathon intelligence records.
- Better demo UI for showing WebMCP status.
- README polish and diagrams beyond minimum submission needs.

## Non Goals

- No auth.
- No resume builder.
- No automatic applications.
- No recommendation ML.
- No embeddings or vector database.
- No scraping architecture.
- No generic chatbot embedded in HackList.
- No fake precision match scores.
- No unrelated redesign or infrastructure cleanup.

## Critical Demo Path

The user asks:

> I'm an AI developer in Nigeria. I know Next.js, TypeScript and OpenAI APIs. I have one day available. Find the strongest active hackathon I can realistically enter.

The browser agent discovers HackList WebMCP tools, calls HackList, and receives a ranked set of opportunities with inspectable reasoning.

The user then asks:

> Why are you recommending this instead of the opportunity with the larger prize?

The agent calls the comparison tool and receives concrete tradeoffs such as deadline risk, eligibility, required technologies, submission burden, and data completeness.

The user then asks:

> Okay. What exactly do I need to submit?

The agent calls the readiness tool and receives known submission artifacts, deadline, eligibility status, technical requirements, source links, and unknowns.

## Fit Language

Overall fit:
- STRONG FIT
- POSSIBLE FIT
- WEAK FIT
- INSUFFICIENT DATA

Evidence dimensions:
- Eligibility: PASS, FAIL, UNKNOWN
- Skill fit: STRONG, PARTIAL, WEAK, UNKNOWN
- Technology fit: STRONG, PARTIAL, WEAK, UNKNOWN
- Time feasibility: HIGH, MEDIUM, LOW, UNKNOWN
- Format: MATCH, MISMATCH, UNKNOWN
- Deadline risk: LOW, MEDIUM, HIGH, UNKNOWN
- Submission burden: LOW, MEDIUM, HIGH, UNKNOWN
- Confidence/data completeness: HIGH, MEDIUM, LOW

## Acceptance Criteria

- Given a WebMCP-capable browser on HackList, the agent can discover the five HackList opportunity tools.
- Given `search_opportunities`, the response comes from current Supabase hackathons, jobs, grants, bounties, and programs, not mock data.
- Given the critical demo prompt, `match_opportunities` returns candidates using deterministic reasons and no arbitrary percentage.
- Given a higher-value alternative, `compare_opportunities` explains why the recommended candidate is stronger or weaker and labels non-equivalent value kinds.
- Given a selected opportunity, `get_opportunity_readiness` returns only known facts and explicit unknowns.

## Demo Fixture

User profile:
- Country: Nigeria
- Skills: Next.js, TypeScript, OpenAI APIs
- Available time: one day
- Preference: active online or remote hackathon, realistic solo/team entry

Demo data:
- Current, real opportunities from live Supabase hackathons, jobs, grants, bounties, and programs.
- Approximately 8 to 12 current, real, verified hackathons with sidecar intelligence.
- Include at least one higher-value opportunity that loses on feasibility, deadline, eligibility, or requirements.
- Include source URLs and verified dates for intelligence facts.

## Existing Project Compliance

Pre-existing HackList:
- Existing discovery UI.
- Existing Supabase hackathon records.
- Existing five categories.
- Existing card/detail pages and filters.

WebMCP Challenge extension:
- Browser-registered WebMCP tools.
- Unified opportunity-domain WebMCP tools.
- Hackathon intelligence sidecar where verified.
- Deterministic opportunity match/compare/readiness engine.
- Documentation distinguishing new work from old work.
- License and submission-specific verification artifacts.
