# HackList

HackList is a read-only opportunity directory for builders. It aggregates
hackathons, grants, bounties, programs, and jobs, while linking applications
to the original organizer page.

## Local setup

Requirements: Node.js 20 or newer and npm.

```bash
npm ci
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

The app can build without Supabase credentials so contributors can run the
quality checks safely. The catalogue and submission route remain unavailable
until `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set.
Use a disposable development Supabase project, never production credentials,
for local testing.

## Quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run test:integration
npm run test:e2e
npm run test:stage2
npm run backfill:dry-run
npm run build
npm audit --omit=dev
git diff --check
```

`npm run test:e2e` currently checks the browser-critical route inventory. A
real browser smoke suite should be added once the preview environment and
test database are available.

## Internal operations

Operational Telegram routes require the server-only
`HACKLIST_INTERNAL_API_SECRET` header `x-hacklist-internal-secret`. Mutating
operations use `POST`; queue status is the only `GET` operational endpoint.
`HACKLIST_ANNOUNCE_ENABLED` defaults to `false` because the current queue is
process-local and is not durable across serverless restarts. Do not enable it
until the approved durable worker and queue are deployed.

The submission migration at
`supabase/migrations/202608220001_listing_request_opportunity_contract.sql`
must be applied through the owner-approved Supabase workflow before enabling
canonical five-type submissions in a shared environment. It preserves the
legacy `hackathon_name` column and stores the normalized opportunity type and
type-specific fields in `details`.

## Stage 2 data and authentication preview

The migration at
`supabase/migrations/202608220002_canonical_opportunity_schema.sql` adds the
canonical opportunity, organizer, evidence, review, job, subscription, audit,
save, and follow records beside the legacy catalogue tables. It enables RLS:
public users can only read publishable opportunities and evidence, while
verified users can read and mutate only their own saves, follows, and email
alerts. Reviewer and service access is controlled through the JWT
`app_metadata.role` claim.

Do not apply this migration to a shared or production project yet. The owner
must first provide a read-only schema snapshot, review the foreign keys and
RLS matrix, and approve the migration workflow. The adapter and
`npm run backfill:dry-run` command are read-only and do not write legacy data.

Email OTP authentication is exposed through `/api/auth/request-code`,
`/api/auth/callback`, `/api/auth/session`, and `/api/auth/signout`. Saves,
follows, and email alerts are protected under `/api/me/*`. Configure Supabase
Auth redirect URLs for local and approved preview origins before testing the
real email provider. No email is sent by local tests.

## Stage 3 durable job fallback

The migration at
`supabase/migrations/202608220003_durable_job_evidence_plane.sql` adds the
Postgres-backed fallback job plane: queue names, leases, visibility timeouts,
bounded retries, dead letters, immutable snapshot metadata, and a
notification outbox. Claim and finish functions are restricted to
`service_role`; reviewer and administrator roles control replay through the
application contract. `src/lib/durable-jobs.ts` is the server-side adapter.

This is intentionally a local and migration-only foundation. AWS
EventBridge, SQS, Lambda, S3, alarms, and budgets require a separate owner
approval with an account, region, resource names, and monthly ceiling. No AWS
resource is created by the repository or its tests.

## Stage 4 connector foundation

The P0 connector foundation lives under `src/domain/connectors/`. Direct
submissions, RSS/Atom, sitemaps, focused JSON-LD pages, Grants.gov, Greenhouse,
and Lever emit normalized observations only. They do not write public
opportunities. Requests use HTTPS-only source checks, conditional headers,
response-size limits, redirect rejection, content hashes, and deterministic
fixture replay. Run `npm run test:stage4` to exercise the offline connector
contract. Live source access remains disabled until each source passes its
owner-approved Gate G4 review.

## Stage 5 evaluation and shadow review

The deterministic evaluation foundation lives under `src/domain/evaluation/`.
It classifies observations, resolves organizer domains, checks field evidence,
flags freshness and duplicate risk, and proposes provisional or review states
without writing public records. Review cases and shadow metrics are explicit
contracts so a later worker can persist them safely.

Run `npm run test:stage5` for the offline evaluation, deduplication, review,
and shadow-gate tests. Automatic public transitions remain disabled until the
PLAN.md detection, precision, duplicate, evidence, review-queue, and cost gates
are met during the approved shadow period.

## Project documents

The workspace-root `PLAN.md` is the canonical implementation plan. UI concepts
and research artifacts live beside the repository and are reference material;
the approved landing concept is not implemented during Priority 0 correction.
