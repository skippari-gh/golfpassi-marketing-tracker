create extension if not exists "uuid-ossp";
create schema if not exists extensions;
create extension if not exists unaccent with schema extensions;

create table if not exists public.destinations (
  id uuid primary key default gen_random_uuid(),
  identity_key text not null unique,
  name text not null,
  country text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.normalize_destination_text(value text)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select trim(
    both ' ' from regexp_replace(
      regexp_replace(
        lower(unaccent(coalesce(value, ''))),
        '&',
        ' ja ',
        'g'
      ),
      '[^a-z0-9]+',
      ' ',
      'g'
    )
  );
$$;

create or replace function public.trip_destination_name(value text)
returns text
language plpgsql
immutable
set search_path = public, extensions
as $$
declare
  cleaned_name text;
  name_parts text[];
  first_part text;
begin
  cleaned_name := trim(
    regexp_replace(
      regexp_replace(
        coalesce(value, ''),
        '\m[0-9]+[[:space:]]*((tai|–|—|-)[[:space:]]*[0-9]+[[:space:]]*)?vrk\M',
        '',
        'gi'
      ),
      '[[:space:]]+[–—-][[:space:]]*$',
      '',
      'g'
    )
  );

  name_parts := regexp_split_to_array(
    cleaned_name,
    '[[:space:]]+[–—-][[:space:]]+'
  );

  first_part := nullif(trim(name_parts[1]), '');

  if first_part is null then
    first_part := nullif(cleaned_name, '');
  end if;

  if first_part is null then
    first_part := value;
  end if;

  if public.normalize_destination_text(first_part) = 'long stay'
    and array_length(name_parts, 1) >= 2
    and nullif(trim(name_parts[2]), '') is not null
  then
    return trim(name_parts[2]);
  end if;

  return first_part;
end;
$$;

create or replace function public.trip_destination_key(
  trip_name text,
  trip_country text
)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select concat(
    public.normalize_destination_text(trip_country),
    '|',
    public.normalize_destination_text(
      public.trip_destination_name(trip_name)
    )
  );
$$;

insert into public.destinations (
  identity_key,
  name,
  country
)
select distinct on (destination_key)
  destination_key,
  destination_name,
  country
from (
  select
    public.trip_destination_key(name, country) as destination_key,
    public.trip_destination_name(name) as destination_name,
    country,
    start_date
  from public.trips
) existing_destinations
where destination_key <> '|'
order by destination_key, start_date asc
on conflict (identity_key) do update
set
  name = excluded.name,
  country = excluded.country,
  updated_at = now();

alter table public.trips
  add column if not exists destination_id uuid;

update public.trips trip
set destination_id = destination.id
from public.destinations destination
where destination.identity_key =
  public.trip_destination_key(trip.name, trip.country)
  and trip.destination_id is distinct from destination.id;

do $$
begin
  if exists (
    select 1
    from public.trips
    where destination_id is null
  ) then
    raise exception 'Kaikille matkoille ei voitu muodostaa kohdetta.';
  end if;
end;
$$;

alter table public.trips
  alter column destination_id set not null;

alter table public.trips
  drop constraint if exists trips_destination_id_fkey;

alter table public.trips
  add constraint trips_destination_id_fkey
  foreign key (destination_id)
  references public.destinations(id)
  on delete restrict;

create index if not exists trips_destination_id_idx
  on public.trips (destination_id);

alter table public.marketing_plan
  add column if not exists destination_id uuid;

alter table public.marketing_actions
  add column if not exists destination_id uuid;

alter table public.marketing_requests
  add column if not exists destination_id uuid;

update public.marketing_plan plan
set destination_id = trip.destination_id
from public.trips trip
where plan.trip_id = trip.id
  and plan.destination_id is null;

update public.marketing_actions action
set destination_id = trip.destination_id
from public.trips trip
where action.trip_id = trip.id
  and action.destination_id is null;

update public.marketing_requests request
set destination_id = trip.destination_id
from public.trips trip
where request.trip_id = trip.id
  and request.destination_id is null;

alter table public.marketing_plan
  drop constraint if exists marketing_plan_destination_id_fkey;

alter table public.marketing_plan
  add constraint marketing_plan_destination_id_fkey
  foreign key (destination_id)
  references public.destinations(id)
  on delete restrict;

alter table public.marketing_actions
  drop constraint if exists marketing_actions_destination_id_fkey;

alter table public.marketing_actions
  add constraint marketing_actions_destination_id_fkey
  foreign key (destination_id)
  references public.destinations(id)
  on delete restrict;

alter table public.marketing_requests
  drop constraint if exists marketing_requests_destination_id_fkey;

alter table public.marketing_requests
  add constraint marketing_requests_destination_id_fkey
  foreign key (destination_id)
  references public.destinations(id)
  on delete restrict;

create index if not exists marketing_plan_destination_id_idx
  on public.marketing_plan (destination_id);

create index if not exists marketing_actions_destination_id_idx
  on public.marketing_actions (destination_id);

create index if not exists marketing_requests_destination_id_idx
  on public.marketing_requests (destination_id);

create or replace function public.assign_trip_destination()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  destination_key text;
  destination_name text;
begin
  destination_key := public.trip_destination_key(
    new.name,
    new.country
  );
  destination_name := public.trip_destination_name(new.name);

  insert into public.destinations (
    identity_key,
    name,
    country
  ) values (
    destination_key,
    destination_name,
    new.country
  )
  on conflict (identity_key) do update
  set
    name = excluded.name,
    country = excluded.country,
    updated_at = now()
  returning id into new.destination_id;

  return new;
end;
$$;

drop trigger if exists trips_assign_destination
  on public.trips;

create trigger trips_assign_destination
before insert or update of name, country
on public.trips
for each row execute function public.assign_trip_destination();

create or replace function public.assign_related_destination()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.trip_id is not null then
    select destination_id
    into new.destination_id
    from public.trips
    where id = new.trip_id;
  end if;

  return new;
end;
$$;

drop trigger if exists marketing_plan_assign_destination
  on public.marketing_plan;

create trigger marketing_plan_assign_destination
before insert or update of trip_id
on public.marketing_plan
for each row execute function public.assign_related_destination();

drop trigger if exists marketing_actions_assign_destination
  on public.marketing_actions;

create trigger marketing_actions_assign_destination
before insert or update of trip_id
on public.marketing_actions
for each row execute function public.assign_related_destination();

drop trigger if exists marketing_requests_assign_destination
  on public.marketing_requests;

create trigger marketing_requests_assign_destination
before insert or update of trip_id
on public.marketing_requests
for each row execute function public.assign_related_destination();

comment on table public.destinations is
  'Pysyvät matkakohteet, joihin yksittäiset lähdöt ja markkinointitiedot liittyvät.';
