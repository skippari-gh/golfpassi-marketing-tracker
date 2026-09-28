alter table public.trips
  add column if not exists price_from integer;

comment on column public.trips.price_from is
  'Golfpassi-matkan alkaen-hinta euroina, synkronoidaan matkasivulta.';
