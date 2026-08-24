create extension if not exists "uuid-ossp";

alter table public.marketing_actions
  add column if not exists archived_at timestamptz;

alter table public.marketing_plan
  add column if not exists archived_at timestamptz;

alter table public.marketing_requests
  add column if not exists archived_at timestamptz;

create index if not exists marketing_actions_archived_at_idx
  on public.marketing_actions (archived_at);

create index if not exists marketing_plan_archived_at_idx
  on public.marketing_plan (archived_at);

create index if not exists marketing_requests_archived_at_idx
  on public.marketing_requests (archived_at);

create table if not exists public.archive_events (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  constraint archive_events_entity_type_check
    check (entity_type in (
      'marketing_action',
      'marketing_plan',
      'marketing_request'
    )),
  constraint archive_events_action_check
    check (action in ('archived', 'restored'))
);

create index if not exists archive_events_created_at_idx
  on public.archive_events (created_at desc);

create index if not exists archive_events_entity_idx
  on public.archive_events (entity_type, entity_id, created_at desc);

alter table public.archive_events enable row level security;

create or replace function public.log_archive_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  event_action text;
begin
  if old.archived_at is null and new.archived_at is not null then
    event_action := 'archived';
  elsif old.archived_at is not null and new.archived_at is null then
    event_action := 'restored';
  else
    return new;
  end if;

  insert into public.archive_events (
    entity_type,
    entity_id,
    action,
    snapshot
  ) values (
    tg_argv[0],
    new.id,
    event_action,
    to_jsonb(new)
  );

  return new;
end;
$$;

drop trigger if exists marketing_actions_archive_audit
  on public.marketing_actions;

create trigger marketing_actions_archive_audit
after update of archived_at on public.marketing_actions
for each row execute function public.log_archive_change(
  'marketing_action'
);

drop trigger if exists marketing_plan_archive_audit
  on public.marketing_plan;

create trigger marketing_plan_archive_audit
after update of archived_at on public.marketing_plan
for each row execute function public.log_archive_change(
  'marketing_plan'
);

drop trigger if exists marketing_requests_archive_audit
  on public.marketing_requests;

create trigger marketing_requests_archive_audit
after update of archived_at on public.marketing_requests
for each row execute function public.log_archive_change(
  'marketing_request'
);

comment on table public.archive_events is
  'Markkinointitietojen arkistointi- ja palautushistoria.';
