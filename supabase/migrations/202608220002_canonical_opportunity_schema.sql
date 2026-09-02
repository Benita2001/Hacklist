-- Stage 2 canonical opportunity schema.
--
-- Apply only through the owner-approved Supabase workflow after reviewing the
-- live schema snapshot. The legacy five-table catalogue remains in place so
-- this migration can be applied beside existing data without destructive work.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null,
  base_url text not null,
  trust_tier text not null default 'unreviewed' check (trust_tier in ('official', 'partner', 'curated', 'unreviewed')),
  priority smallint not null default 100 check (priority between 0 and 1000),
  organizer_id uuid,
  enabled boolean not null default false,
  shadow_only boolean not null default true,
  polling_interval_seconds integer not null default 3600 check (polling_interval_seconds >= 60),
  robots_reviewed boolean not null default false,
  terms_reviewed boolean not null default false,
  request_budget_bytes bigint not null default 1048576 check (request_budget_bytes > 0),
  response_budget_bytes bigint not null default 5242880 check (response_budget_bytes > 0),
  daily_cost_units numeric(12, 4) not null default 0 check (daily_cost_units >= 0),
  cursor text,
  etag text,
  last_modified text,
  last_success_at timestamptz,
  next_run_at timestamptz,
  consecutive_failures integer not null default 0 check (consecutive_failures >= 0),
  circuit_state text not null default 'closed' check (circuit_state in ('closed', 'open', 'half_open')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.organizers (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  status text not null default 'unverified' check (status in ('verified', 'unverified', 'review', 'suppressed')),
  verified_domains jsonb not null default '[]'::jsonb check (jsonb_typeof(verified_domains) = 'array'),
  platform_accounts jsonb not null default '[]'::jsonb check (jsonb_typeof(platform_accounts) = 'array'),
  evidence jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence) = 'array'),
  reviewer_id uuid references auth.users(id) on delete set null,
  impersonation_risk text not null default 'unknown' check (impersonation_risk in ('low', 'medium', 'high', 'unknown')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.sources
  add constraint sources_organizer_id_fkey
  foreign key (organizer_id) references public.organizers(id) on delete set null;

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('hackathon', 'bounty', 'grant', 'program', 'job')),
  slug text not null unique,
  title text not null,
  organizer_id uuid references public.organizers(id) on delete set null,
  lifecycle_state text not null default 'detected' check (lifecycle_state in ('detected', 'announced', 'registration_open', 'verified', 'updated', 'closed', 'cancelled', 'archived')),
  publication_state text not null default 'internal' check (publication_state in ('internal', 'review', 'provisional', 'public', 'suppressed', 'archived')),
  summary text,
  description text,
  announcement_at timestamptz,
  registration_open_at timestamptz,
  deadline_at timestamptz,
  start_at timestamptz,
  end_at timestamptz,
  source_timezone text,
  location text,
  is_remote boolean,
  prize_or_funding jsonb not null default '{}'::jsonb check (jsonb_typeof(prize_or_funding) = 'object'),
  eligibility text,
  application_url text,
  first_detected_at timestamptz not null default timezone('utc', now()),
  announced_at timestamptz,
  last_verified_at timestamptz,
  last_changed_at timestamptz,
  version integer not null default 1 check (version > 0),
  confidence jsonb not null default '{}'::jsonb check (jsonb_typeof(confidence) = 'object'),
  risk jsonb not null default '{}'::jsonb check (jsonb_typeof(risk) = 'object'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz,
  check (publication_state not in ('provisional', 'public') or organizer_id is not null),
  check (publication_state not in ('provisional', 'public') or application_url is not null)
);

create table if not exists public.source_observations (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete restrict,
  source_item_id text not null,
  canonical_source_url text not null,
  observed_at timestamptz not null,
  fetched_at timestamptz not null default timezone('utc', now()),
  content_hash text not null,
  http_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(http_metadata) = 'object'),
  raw_snapshot_reference text,
  normalized_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(normalized_payload) = 'object'),
  parser_version text not null,
  processing_status text not null default 'received' check (processing_status in ('received', 'normalized', 'processed', 'failed', 'dead_letter')),
  error_category text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (source_id, source_item_id, content_hash)
);

create table if not exists public.opportunity_versions (
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  version integer not null check (version > 0),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  changed_at timestamptz not null default timezone('utc', now()),
  changed_by uuid references auth.users(id) on delete set null,
  primary key (opportunity_id, version)
);

create table if not exists public.field_evidence (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  opportunity_version integer not null,
  field_path text not null,
  observation_id uuid not null references public.source_observations(id) on delete restrict,
  source_url text not null,
  captured_text_span text,
  structured_path text,
  observed_value jsonb not null,
  extraction_method text not null check (extraction_method in ('submitted', 'structured_data', 'parser', 'reviewer', 'derived')),
  confidence numeric(5, 4) check (confidence between 0 and 1),
  conflict_state text not null default 'clear' check (conflict_state in ('clear', 'conflicting', 'unresolved')),
  created_at timestamptz not null default timezone('utc', now()),
  foreign key (opportunity_id, opportunity_version) references public.opportunity_versions(opportunity_id, version)
);

create table if not exists public.review_cases (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  triggering_observation_id uuid references public.source_observations(id) on delete restrict,
  reason_codes text[] not null default '{}',
  priority smallint not null default 100 check (priority between 0 and 1000),
  risk jsonb not null default '{}'::jsonb check (jsonb_typeof(risk) = 'object'),
  assigned_reviewer_id uuid references auth.users(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'dismissed')),
  due_at timestamptz,
  proposed_changes jsonb not null default '{}'::jsonb check (jsonb_typeof(proposed_changes) = 'object'),
  decision text,
  rationale text,
  decided_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  source_id uuid references public.sources(id) on delete set null,
  schedule_key text,
  idempotency_key text not null unique,
  status text not null default 'queued' check (status in ('queued', 'leased', 'succeeded', 'failed', 'dead_letter', 'cancelled')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  lease_owner text,
  lease_expires_at timestamptz,
  next_attempt_at timestamptz,
  last_error_category text,
  cost_units numeric(12, 4) not null default 0 check (cost_units >= 0),
  dead_letter_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.job_attempts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  attempt_number integer not null check (attempt_number > 0),
  status text not null check (status in ('started', 'succeeded', 'failed', 'unknown')),
  worker_id text,
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  error_category text,
  error_message text,
  latency_ms integer check (latency_ms >= 0),
  unique (job_id, attempt_number)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  channel text not null check (channel in ('email', 'telegram')),
  verified_destination text,
  opportunity_types text[] not null default '{}',
  topics text[] not null default '{}',
  geography text[] not null default '{}',
  remote_preference text not null default 'any' check (remote_preference in ('any', 'remote', 'onsite')),
  normal_alerts boolean not null default true,
  provisional_alerts boolean not null default false,
  cadence text not null default 'immediate' check (cadence in ('immediate', 'daily', 'weekly')),
  quiet_hours jsonb not null default '{}'::jsonb check (jsonb_typeof(quiet_hours) = 'object'),
  verified_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, channel)
);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  channel text not null check (channel in ('email', 'telegram')),
  opportunity_id uuid not null references public.opportunities(id) on delete restrict,
  opportunity_version integer not null,
  reason text not null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'suppressed')),
  provider_message_id text,
  idempotency_key text not null unique,
  sent_at timestamptz,
  last_error_category text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, channel, opportunity_id, opportunity_version, reason)
);

create table if not exists public.opportunity_saves (
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, opportunity_id)
);

create table if not exists public.opportunity_follows (
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, opportunity_id)
);

create table if not exists public.audit_entries (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_role text not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_state jsonb,
  after_state jsonb,
  reason text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists opportunities_public_idx on public.opportunities (publication_state, lifecycle_state, updated_at desc);
create index if not exists opportunity_evidence_public_idx on public.field_evidence (opportunity_id, opportunity_version, field_path);
create index if not exists source_observations_source_idx on public.source_observations (source_id, observed_at desc);
create index if not exists review_cases_queue_idx on public.review_cases (status, priority desc, due_at);
create index if not exists jobs_queue_idx on public.jobs (status, next_attempt_at);
create index if not exists subscriptions_user_idx on public.subscriptions (user_id);

drop trigger if exists sources_set_updated_at on public.sources;
create trigger sources_set_updated_at before update on public.sources for each row execute function public.set_updated_at();
drop trigger if exists organizers_set_updated_at on public.organizers;
create trigger organizers_set_updated_at before update on public.organizers for each row execute function public.set_updated_at();
drop trigger if exists opportunities_set_updated_at on public.opportunities;
create trigger opportunities_set_updated_at before update on public.opportunities for each row execute function public.set_updated_at();
drop trigger if exists review_cases_set_updated_at on public.review_cases;
create trigger review_cases_set_updated_at before update on public.review_cases for each row execute function public.set_updated_at();
drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at before update on public.jobs for each row execute function public.set_updated_at();
drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();

alter table public.sources enable row level security;
alter table public.organizers enable row level security;
alter table public.opportunities enable row level security;
alter table public.source_observations enable row level security;
alter table public.opportunity_versions enable row level security;
alter table public.field_evidence enable row level security;
alter table public.review_cases enable row level security;
alter table public.jobs enable row level security;
alter table public.job_attempts enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.opportunity_saves enable row level security;
alter table public.opportunity_follows enable row level security;
alter table public.audit_entries enable row level security;

-- RLS policies decide which rows a role may use. Explicit grants decide which
-- operations the role may attempt. Keep both layers present for local and
-- hosted projects where new tables are not auto-exposed.
grant usage on schema public to anon, authenticated, service_role;
grant select on public.opportunities, public.organizers, public.opportunity_versions, public.field_evidence
  to anon, authenticated;
grant select, insert, delete on public.opportunity_saves, public.opportunity_follows to authenticated;
grant select, insert, update, delete on public.subscriptions to authenticated;
grant select, insert, update, delete on public.sources, public.source_observations,
  public.opportunity_versions, public.opportunities, public.organizers, public.field_evidence,
  public.review_cases, public.jobs, public.job_attempts, public.notification_deliveries,
  public.audit_entries to authenticated;
grant all on public.sources, public.organizers, public.opportunities, public.source_observations,
  public.opportunity_versions, public.field_evidence, public.review_cases, public.jobs,
  public.job_attempts, public.subscriptions, public.notification_deliveries,
  public.opportunity_saves, public.opportunity_follows, public.audit_entries to service_role;

create or replace function public.is_staff()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('reviewer', 'administrator', 'service');
$$;

create policy opportunities_public_read on public.opportunities
  for select to anon, authenticated
  using (publication_state in ('provisional', 'public'));

create policy organizers_public_read on public.organizers
  for select to anon, authenticated
  using (status = 'verified');

create policy evidence_public_read on public.field_evidence
  for select to anon, authenticated
  using (exists (
    select 1 from public.opportunities o
    where o.id = field_evidence.opportunity_id
      and o.publication_state in ('provisional', 'public')
  ));

create policy opportunity_versions_public_read on public.opportunity_versions
  for select to anon, authenticated
  using (exists (
    select 1 from public.opportunities o
    where o.id = opportunity_versions.opportunity_id
      and o.publication_state in ('provisional', 'public')
  ));

create policy saves_owner_read on public.opportunity_saves
  for select to authenticated using (auth.uid() = user_id);
create policy saves_owner_insert on public.opportunity_saves
  for insert to authenticated with check (auth.uid() = user_id);
create policy saves_owner_delete on public.opportunity_saves
  for delete to authenticated using (auth.uid() = user_id);

create policy follows_owner_read on public.opportunity_follows
  for select to authenticated using (auth.uid() = user_id);
create policy follows_owner_insert on public.opportunity_follows
  for insert to authenticated with check (auth.uid() = user_id);
create policy follows_owner_delete on public.opportunity_follows
  for delete to authenticated using (auth.uid() = user_id);

create policy subscriptions_owner_read on public.subscriptions
  for select to authenticated using (auth.uid() = user_id);
create policy subscriptions_owner_insert on public.subscriptions
  for insert to authenticated with check (auth.uid() = user_id);
create policy subscriptions_owner_update on public.subscriptions
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy subscriptions_owner_delete on public.subscriptions
  for delete to authenticated using (auth.uid() = user_id);

create policy staff_sources_all on public.sources for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_observations_all on public.source_observations for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_versions_all on public.opportunity_versions for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_opportunities_all on public.opportunities for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_organizers_all on public.organizers for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_evidence_all on public.field_evidence for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_reviews_all on public.review_cases for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_jobs_all on public.jobs for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_attempts_all on public.job_attempts for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_deliveries_all on public.notification_deliveries for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_audit_all on public.audit_entries for all to authenticated using (public.is_staff()) with check (public.is_staff());

comment on table public.opportunities is 'Canonical opportunity record. Public rows require evidence and approved publication state.';
comment on table public.field_evidence is 'Append-only source evidence for every public opportunity field.';
comment on table public.review_cases is 'Human review queue. Public state transitions require an auditable decision.';
comment on table public.opportunity_saves is 'Private verified-account intent. RLS limits rows to the owning user.';
