create extension if not exists "uuid-ossp";

create table if not exists trips (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  country text not null,
  region text,
  trip_type text not null default 'pelimatka',
  start_date date not null,
  end_date date not null,
  url text,
  status text not null default 'myynnissä',
  priority_note text,
  created_at timestamptz default now()
);

create table if not exists channels (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  color text default '#00aaff'
);

create table if not exists campaigns (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  start_date date,
  end_date date,
  description text
);

create table if not exists marketing_actions (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references trips(id) on delete cascade,
  channel_id uuid references channels(id),
  campaign_id uuid references campaigns(id),
  action_date date not null default current_date,
  title text,
  link text,
  note text,
  asset_used text,
  created_at timestamptz default now()
);

insert into channels (name, color) values
('Uutiskirje', '#ff8200'),
('Facebook', '#00aaff'),
('Instagram', '#03face'),
('LinkedIn', '#003c70'),
('Verkkosivu', '#999999'),
('Mainonta', '#666666')
on conflict (name) do nothing;

create or replace view trip_marketing_summary as
select
  t.*,
  max(ma.action_date) as last_marketed_at,
  coalesce(current_date - max(ma.action_date), 9999) as days_since_marketed,
  count(ma.id) as marketing_count,
  count(distinct c.name) as channel_count,
  bool_or(c.name = 'Uutiskirje') as has_newsletter,
  bool_or(c.name in ('Facebook','Instagram','LinkedIn')) as has_social,
  case
    when t.status in ('täynnä','peruttu','mennyt') then -999
    else
      case when count(ma.id) = 0 then 60 else 0 end +
      case when coalesce(current_date - max(ma.action_date), 9999) >= 30 then 50
           when coalesce(current_date - max(ma.action_date), 9999) >= 21 then 35
           when coalesce(current_date - max(ma.action_date), 9999) >= 14 then 20
           else 0 end +
      case when t.start_date - current_date <= 30 then 50
           when t.start_date - current_date <= 60 then 35
           when t.start_date - current_date <= 90 then 25
           else 0 end +
      case when not bool_or(c.name = 'Uutiskirje') or bool_or(c.name = 'Uutiskirje') is null then 25 else 0 end +
      case when not bool_or(c.name in ('Facebook','Instagram','LinkedIn')) or bool_or(c.name in ('Facebook','Instagram','LinkedIn')) is null then 20 else 0 end +
      case when coalesce(current_date - max(ma.action_date), 9999) <= 7 then -50 else 0 end
  end as priority_score
from trips t
left join marketing_actions ma on ma.trip_id = t.id
left join channels c on c.id = ma.channel_id
group by t.id;
