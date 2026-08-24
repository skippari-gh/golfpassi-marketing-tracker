create extension if not exists "uuid-ossp";

create table if not exists public.trip_sync_runs (
  id uuid primary key default uuid_generate_v4(),
  status text not null default 'running',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  found_count integer,
  added_count integer,
  updated_count integer,
  missing_count integer,
  error_message text,
  constraint trip_sync_runs_status_check
    check (status in ('running', 'success', 'failed'))
);

create index if not exists trip_sync_runs_started_at_idx
  on public.trip_sync_runs (started_at desc);

alter table public.trip_sync_runs enable row level security;

comment on table public.trip_sync_runs is
  'Golfpassin matkojen automaattisen synkronoinnin ajohistoria.';
