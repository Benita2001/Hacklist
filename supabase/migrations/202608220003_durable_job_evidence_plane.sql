-- Stage 3 durable job and evidence foundation.
--
-- This migration implements the no-new-infrastructure fallback from PLAN.md:
-- Postgres-backed queues with transactional leasing, bounded retries, an
-- inspectable dead-letter path, immutable snapshot metadata, and a
-- notification outbox. AWS EventBridge/SQS/Lambda/S3 remains a separate
-- owner-approved deployment decision.

alter table public.jobs
  add column if not exists queue_name text not null default 'default',
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists max_attempts integer not null default 3,
  add column if not exists visibility_timeout_seconds integer not null default 300,
  add column if not exists lease_token uuid,
  add column if not exists dead_lettered_at timestamptz,
  add column if not exists last_error_message text;

alter table public.jobs
  add constraint jobs_max_attempts_check check (max_attempts between 1 and 20),
  add constraint jobs_visibility_timeout_check check (visibility_timeout_seconds between 30 and 86400),
  add constraint jobs_payload_object_check check (jsonb_typeof(payload) = 'object');

create index if not exists jobs_claim_idx
  on public.jobs (queue_name, status, next_attempt_at, created_at)
  where status = 'queued';

create table if not exists public.job_dead_letters (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references public.jobs(id) on delete restrict,
  queue_name text not null,
  idempotency_key text not null,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  attempt_count integer not null check (attempt_count > 0),
  reason text not null,
  dead_lettered_at timestamptz not null default timezone('utc', now()),
  replayed_at timestamptz,
  replayed_by uuid references auth.users(id) on delete set null
);

create table if not exists public.observation_snapshots (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null unique references public.source_observations(id) on delete restrict,
  storage_provider text not null default 'postgres' check (storage_provider in ('postgres', 's3')),
  storage_key text not null,
  content_hash text not null,
  byte_size bigint not null check (byte_size >= 0),
  content_type text not null,
  captured_at timestamptz not null,
  retention_until timestamptz,
  encryption_key_ref text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (storage_provider, storage_key, content_hash)
);

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid references public.notification_deliveries(id) on delete restrict,
  idempotency_key text not null unique,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  status text not null default 'queued' check (status in ('queued', 'leased', 'sent', 'failed', 'dead_letter')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  lease_owner text,
  lease_token uuid,
  lease_expires_at timestamptz,
  next_attempt_at timestamptz,
  last_error_category text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists notification_outbox_claim_idx
  on public.notification_outbox (status, next_attempt_at, created_at)
  where status = 'queued';

create or replace function public.claim_next_job(
  p_queue_name text,
  p_worker_id text,
  p_lease_seconds integer default 300
)
returns table (
  id uuid,
  queue_name text,
  idempotency_key text,
  payload jsonb,
  attempt_count integer,
  lease_token uuid,
  lease_expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed public.jobs%rowtype;
begin
  if p_queue_name is null or length(trim(p_queue_name)) = 0 or length(p_queue_name) > 100 then
    raise exception 'invalid_queue_name';
  end if;
  if p_worker_id is null or length(trim(p_worker_id)) = 0 or length(p_worker_id) > 200 then
    raise exception 'invalid_worker_id';
  end if;
  if p_lease_seconds not between 30 and 86400 then
    raise exception 'invalid_lease_seconds';
  end if;

  with candidate as (
    select j.id
    from public.jobs j
    where j.queue_name = p_queue_name
      and j.status = 'queued'
      and (j.next_attempt_at is null or j.next_attempt_at <= timezone('utc', now()))
    order by j.next_attempt_at nulls first, j.created_at
    for update skip locked
    limit 1
  )
  update public.jobs j
  set status = 'leased',
      lease_owner = p_worker_id,
      lease_token = gen_random_uuid(),
      lease_expires_at = timezone('utc', now()) + make_interval(secs => p_lease_seconds),
      attempt_count = j.attempt_count + 1,
      updated_at = timezone('utc', now())
  from candidate
  where j.id = candidate.id
  returning j.* into claimed;

  if claimed.id is null then return; end if;

  insert into public.job_attempts (job_id, attempt_number, status, worker_id)
  values (claimed.id, claimed.attempt_count, 'started', p_worker_id);

  return query select claimed.id, claimed.queue_name, claimed.idempotency_key,
    claimed.payload, claimed.attempt_count, claimed.lease_token, claimed.lease_expires_at;
end;
$$;

create or replace function public.requeue_expired_jobs(p_queue_name text default null)
returns table (id uuid, queue_name text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.jobs j
  set status = 'queued', lease_owner = null, lease_token = null,
      lease_expires_at = null, next_attempt_at = timezone('utc', now()),
      last_error_category = coalesce(j.last_error_category, 'lease_expired'),
      updated_at = timezone('utc', now())
  where j.status = 'leased'
    and j.lease_expires_at < timezone('utc', now())
    and (p_queue_name is null or j.queue_name = p_queue_name)
  returning j.id, j.queue_name;
end;
$$;

create or replace function public.finish_job(
  p_job_id uuid,
  p_lease_token uuid,
  p_success boolean,
  p_error_category text default null,
  p_error_message text default null,
  p_next_attempt_at timestamptz default null,
  p_retryable boolean default true
)
returns table (job_id uuid, final_status text, dead_lettered boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_job public.jobs%rowtype;
  next_status text;
  moved_to_dead_letter boolean := false;
begin
  select * into current_job from public.jobs
  where public.jobs.id = p_job_id and public.jobs.lease_token = p_lease_token
  for update;
  if current_job.id is null then raise exception 'job_lease_invalid'; end if;

  update public.job_attempts ja
  set status = case when p_success then 'succeeded' else 'failed' end,
      finished_at = timezone('utc', now()),
      error_category = nullif(left(coalesce(p_error_category, ''), 100), ''),
      error_message = nullif(left(coalesce(p_error_message, ''), 500), ''),
      latency_ms = greatest(0, extract(epoch from (timezone('utc', now()) - ja.started_at))::integer * 1000)
  where ja.job_id = current_job.id and ja.attempt_number = current_job.attempt_count;

  if p_success then
    next_status := 'succeeded';
  elsif not p_retryable or current_job.attempt_count >= current_job.max_attempts then
    next_status := 'dead_letter';
    moved_to_dead_letter := true;
    insert into public.job_dead_letters (job_id, queue_name, idempotency_key, payload, attempt_count, reason)
    values (current_job.id, current_job.queue_name, current_job.idempotency_key, current_job.payload,
      current_job.attempt_count, left(coalesce(p_error_category, 'retry_limit_reached'), 200))
    on conflict on constraint job_dead_letters_job_id_key do nothing;
  else
    next_status := 'queued';
  end if;

  update public.jobs
  set status = next_status,
      lease_owner = null,
      lease_token = null,
      lease_expires_at = null,
      next_attempt_at = case when next_status = 'queued' then coalesce(p_next_attempt_at, timezone('utc', now())) else null end,
      last_error_category = nullif(left(coalesce(p_error_category, ''), 100), ''),
      last_error_message = nullif(left(coalesce(p_error_message, ''), 500), ''),
      dead_lettered_at = case when moved_to_dead_letter then timezone('utc', now()) else dead_lettered_at end,
      updated_at = timezone('utc', now())
  where id = current_job.id;

  return query select current_job.id, next_status, moved_to_dead_letter;
end;
$$;

revoke all on function public.claim_next_job(text, text, integer) from public, anon, authenticated;
revoke all on function public.requeue_expired_jobs(text) from public, anon, authenticated;
revoke all on function public.finish_job(uuid, uuid, boolean, text, text, timestamptz, boolean) from public, anon, authenticated;
grant execute on function public.claim_next_job(text, text, integer) to service_role;
grant execute on function public.requeue_expired_jobs(text) to service_role;
grant execute on function public.finish_job(uuid, uuid, boolean, text, text, timestamptz, boolean) to service_role;

alter table public.job_dead_letters enable row level security;
alter table public.observation_snapshots enable row level security;
alter table public.notification_outbox enable row level security;

grant select, insert, update, delete on public.job_dead_letters,
  public.observation_snapshots, public.notification_outbox to authenticated;
grant all on public.job_dead_letters, public.observation_snapshots,
  public.notification_outbox to service_role;

create policy staff_dead_letters_all on public.job_dead_letters for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_snapshots_all on public.observation_snapshots for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_outbox_all on public.notification_outbox for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop trigger if exists notification_outbox_set_updated_at on public.notification_outbox;
create trigger notification_outbox_set_updated_at before update on public.notification_outbox for each row execute function public.set_updated_at();

comment on table public.job_dead_letters is 'Inspectable terminal job failures. Replay is explicit and audited.';
comment on table public.observation_snapshots is 'Immutable metadata for raw source evidence held in Postgres or owner-approved object storage.';
comment on table public.notification_outbox is 'Transactional handoff between approved state changes and notification workers.';
