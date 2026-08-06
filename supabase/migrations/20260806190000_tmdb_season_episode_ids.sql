alter table public.seasons add column if not exists tmdb_id integer;
alter table public.episodes add column if not exists tmdb_id integer;

create unique index if not exists seasons_tmdb_id_unique
  on public.seasons (tmdb_id) where tmdb_id is not null;
create unique index if not exists episodes_tmdb_id_unique
  on public.episodes (tmdb_id) where tmdb_id is not null;

alter table public.seasons drop constraint if exists seasons_tmdb_positive;
alter table public.seasons add constraint seasons_tmdb_positive
  check (tmdb_id is null or tmdb_id > 0);
alter table public.episodes drop constraint if exists episodes_tmdb_positive;
alter table public.episodes add constraint episodes_tmdb_positive
  check (tmdb_id is null or tmdb_id > 0);
