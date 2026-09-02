-- Stage 8B notification worker boundary.
-- This migration adds service-role-only leasing and lease-token completion for
-- the existing notification outbox. It does not call a provider or enable
-- delivery by itself.

create index if not exists notification_outbox_worker_claim_idx
  on public.notification_outbox (status, next_attempt_at, created_at)
  where status in ('queued', 'failed', 'leased');

create or replace function public.claim_next_notification(
  p_worker_id text,
  p_lease_seconds integer default 300
)
returns table (
  id uuid,
  delivery_id uuid,
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
  claimed public.notification_outbox%rowtype;
begin
  if p_worker_id is null or length(trim(p_worker_id)) = 0 or length(p_worker_id) > 200 then
    raise exception 'invalid_worker_id';
  end if;
  if p_lease_seconds not between 30 and 86400 then
    raise exception 'invalid_lease_seconds';
  end if;

  with candidate as (
    select n.id
    from public.notification_outbox n
    where (
      n.status in ('queued', 'failed')
      and (n.next_attempt_at is null or n.next_attempt_at <= timezone('utc', now()))
    )
    or (
      n.status = 'leased'
      and n.lease_expires_at < timezone('utc', now())
    )
    order by n.next_attempt_at nulls first, n.created_at
    for update skip locked
    limit 1
  )
  update public.notification_outbox n
  set status = 'leased',
      lease_owner = p_worker_id,
      lease_token = gen_random_uuid(),
      lease_expires_at = timezone('utc', now()) + make_interval(secs => p_lease_seconds),
      attempt_count = n.attempt_count + 1,
      updated_at = timezone('utc', now())
  from candidate
  where n.id = candidate.id
  returning n.* into claimed;

  if claimed.id is null then return; end if;

  return query select claimed.id, claimed.delivery_id, claimed.idempotency_key,
    claimed.payload, claimed.attempt_count, claimed.lease_token, claimed.lease_expires_at;
end;
$$;

create or replace function public.finish_notification(
  p_outbox_id uuid,
  p_lease_token uuid,
  p_outcome text,
  p_provider_message_id text default null,
  p_error_category text default null,
  p_next_attempt_at timestamptz default null
)
returns table (outbox_id uuid, final_status text, delivery_status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_outbox public.notification_outbox%rowtype;
  next_status text;
  next_delivery_status text;
begin
  if p_outcome not in ('sent', 'retry', 'dead_letter', 'manual_reconciliation') then
    raise exception 'invalid_notification_outcome';
  end if;
  if p_outcome = 'sent' and (p_provider_message_id is null or length(trim(p_provider_message_id)) = 0) then
    raise exception 'provider_message_id_required';
  end if;

  select * into current_outbox
  from public.notification_outbox
  where public.notification_outbox.id = p_outbox_id
    and public.notification_outbox.lease_token = p_lease_token
  for update;
  if current_outbox.id is null then raise exception 'notification_lease_invalid'; end if;

  if p_outcome = 'sent' then
    next_status := 'sent';
    next_delivery_status := 'sent';
  elsif p_outcome = 'retry' then
    next_status := 'failed';
    next_delivery_status := 'failed';
  else
    next_status := case when p_outcome = 'dead_letter' then 'dead_letter' else 'failed' end;
    next_delivery_status := 'failed';
  end if;

  update public.notification_outbox
  set status = next_status,
      lease_owner = null,
      lease_token = null,
      lease_expires_at = null,
      next_attempt_at = case when p_outcome = 'retry' then coalesce(p_next_attempt_at, timezone('utc', now())) else null end,
      last_error_category = case when p_outcome = 'sent' then null else nullif(left(coalesce(p_error_category, ''), 100), '') end,
      updated_at = timezone('utc', now())
  where id = current_outbox.id;

  if current_outbox.delivery_id is not null then
    update public.notification_deliveries
    set status = next_delivery_status,
        provider_message_id = case when p_outcome = 'sent' then nullif(left(trim(p_provider_message_id), 500), '') else provider_message_id end,
        sent_at = case when p_outcome = 'sent' then timezone('utc', now()) else sent_at end,
        last_error_category = case when p_outcome = 'sent' then null else nullif(left(coalesce(p_error_category, ''), 100), '') end
    where id = current_outbox.delivery_id;
  end if;

  return query select current_outbox.id, next_status, next_delivery_status;
end;
$$;

revoke all on function public.claim_next_notification(text, integer) from public, anon, authenticated;
revoke all on function public.finish_notification(uuid, uuid, text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.claim_next_notification(text, integer) to service_role;
grant execute on function public.finish_notification(uuid, uuid, text, text, text, timestamptz) to service_role;

comment on function public.claim_next_notification(text, integer) is 'Leases one notification outbox row for the service-role worker. Provider calls remain outside the database.';
comment on function public.finish_notification(uuid, uuid, text, text, text, timestamptz) is 'Completes one notification lease by token and records sent, retry, dead-letter, or manual-reconciliation state.';
