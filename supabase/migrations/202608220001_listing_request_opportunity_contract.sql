-- Stage 1 submission contract. Apply through the owner-approved Supabase
-- migration workflow before enabling the canonical submission API in a shared
-- environment. This migration is intentionally not applied by this branch.
alter table if exists public.listing_requests
  add column if not exists opportunity_type text;

alter table if exists public.listing_requests
  add column if not exists details jsonb not null default '{}'::jsonb;

do $$
begin
  -- The shared project already has this legacy table. A fresh local Supabase
  -- instance may not, so keep the disposable migration chain replayable while
  -- preserving the additive behavior for the real owner-managed schema.
  if to_regclass('public.listing_requests') is not null then
    begin
      alter table public.listing_requests
        add constraint listing_requests_opportunity_type_check
        check (opportunity_type is null or opportunity_type in ('hackathon', 'bounty', 'grant', 'program', 'job'));
    exception
      when duplicate_object then null;
    end;

    create index if not exists listing_requests_opportunity_type_idx
      on public.listing_requests (opportunity_type);
  end if;
end;
$$;
