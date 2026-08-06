create extension if not exists pg_trgm with schema extensions;

do $$ begin
  create type public.content_type as enum ('movie', 'series', 'anime');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type public.content_status as enum ('announced', 'ongoing', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type public.publication_status as enum ('draft', 'scheduled', 'published', 'archived');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type public.video_asset_status as enum ('processing', 'ready', 'failed', 'archived');
exception when duplicate_object then null;
end $$;

create table public.titles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  "type" public.content_type not null,
  title text not null,
  original_title text,
  synopsis text not null default '',
  short_synopsis text,
  release_date date,
  end_date date,
  status public.content_status not null default 'announced',
  runtime_minutes integer,
  age_rating text,
  poster_path text,
  backdrop_path text,
  trailer_url text,
  original_language text,
  country_codes text[] not null default '{}',
  tmdb_id integer unique,
  metadata_source text not null default 'manual',
  publication_status public.publication_status not null default 'draft',
  published_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_document tsvector generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(original_title, ''))
  ) stored,
  constraint titles_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint titles_runtime_positive check (runtime_minutes is null or runtime_minutes > 0),
  constraint titles_tmdb_positive check (tmdb_id is null or tmdb_id > 0)
);

create table public.genres (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  created_at timestamptz not null default now(),
  constraint genres_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.title_genres (
  title_id uuid not null references public.titles (id) on delete cascade,
  genre_id uuid not null references public.genres (id) on delete cascade,
  primary key (title_id, genre_id)
);

create table public.people (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  photo_path text,
  biography text,
  tmdb_id integer unique,
  created_at timestamptz not null default now()
);

create table public.title_credits (
  id uuid primary key default gen_random_uuid(),
  title_id uuid not null references public.titles (id) on delete cascade,
  person_id uuid not null references public.people (id) on delete cascade,
  department text not null,
  role text not null,
  character_name text,
  sort_order integer not null default 0
);

create table public.studios (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.title_studios (
  title_id uuid not null references public.titles (id) on delete cascade,
  studio_id uuid not null references public.studios (id) on delete cascade,
  primary key (title_id, studio_id)
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  title_id uuid not null references public.titles (id) on delete cascade,
  season_number integer not null,
  name text not null,
  synopsis text,
  poster_path text,
  air_date date,
  publication_status public.publication_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (title_id, season_number),
  constraint seasons_number_nonnegative check (season_number >= 0)
);

create table public.episodes (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete cascade,
  episode_number integer not null,
  title text not null,
  synopsis text,
  runtime_seconds integer,
  air_date date,
  thumbnail_path text,
  intro_start integer,
  intro_end integer,
  recap_start integer,
  recap_end integer,
  outro_start integer,
  publication_status public.publication_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season_id, episode_number),
  constraint episodes_number_positive check (episode_number > 0),
  constraint episodes_runtime_positive check (runtime_seconds is null or runtime_seconds > 0),
  constraint episodes_timestamps_nonnegative check (
    coalesce(intro_start, 0) >= 0 and coalesce(intro_end, 0) >= 0 and
    coalesce(recap_start, 0) >= 0 and coalesce(recap_end, 0) >= 0 and
    coalesce(outro_start, 0) >= 0
  )
);

create table public.video_assets (
  id uuid primary key default gen_random_uuid(),
  title_id uuid references public.titles (id) on delete cascade,
  episode_id uuid references public.episodes (id) on delete cascade,
  provider text not null,
  provider_asset_id text not null,
  audio_language text not null,
  version_label text,
  duration_seconds integer,
  status public.video_asset_status not null default 'processing',
  requires_entitlement boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_asset_id),
  constraint video_assets_single_parent check (num_nonnulls(title_id, episode_id) = 1),
  constraint video_assets_duration_positive check (duration_seconds is null or duration_seconds > 0)
);

create table public.subtitle_tracks (
  id uuid primary key default gen_random_uuid(),
  video_asset_id uuid not null references public.video_assets (id) on delete cascade,
  language text not null,
  label text not null,
  kind text not null default 'subtitles',
  file_path text not null,
  created_at timestamptz not null default now(),
  unique (video_asset_id, language, kind)
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  cover_path text,
  is_featured boolean not null default false,
  publication_status public.publication_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.collection_items (
  collection_id uuid not null references public.collections (id) on delete cascade,
  title_id uuid not null references public.titles (id) on delete cascade,
  sort_order integer not null default 0,
  primary key (collection_id, title_id)
);

create index titles_type_published_release_idx on public.titles ("type", publication_status, release_date desc);
create index titles_search_document_idx on public.titles using gin (search_document);
create index titles_title_trgm_idx on public.titles using gin (title extensions.gin_trgm_ops);
create index titles_original_title_trgm_idx on public.titles using gin (original_title extensions.gin_trgm_ops);
create index title_genres_genre_title_idx on public.title_genres (genre_id, title_id);
create index seasons_title_number_idx on public.seasons (title_id, season_number);
create index episodes_season_number_idx on public.episodes (season_id, episode_number);
create index title_credits_title_sort_idx on public.title_credits (title_id, sort_order);
create index collection_items_collection_sort_idx on public.collection_items (collection_id, sort_order);

create trigger titles_set_updated_at before update on public.titles for each row execute function public.set_updated_at();
create trigger seasons_set_updated_at before update on public.seasons for each row execute function public.set_updated_at();
create trigger episodes_set_updated_at before update on public.episodes for each row execute function public.set_updated_at();
create trigger video_assets_set_updated_at before update on public.video_assets for each row execute function public.set_updated_at();
create trigger collections_set_updated_at before update on public.collections for each row execute function public.set_updated_at();

create or replace function public.is_catalog_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.has_role('editor') or
    public.has_role('admin');
$$;

revoke all on function public.is_catalog_editor() from public;
grant execute on function public.is_catalog_editor() to anon, authenticated;

create or replace function public.search_catalog(
  search_query text,
  requested_type public.content_type default null,
  result_limit integer default 24,
  result_offset integer default 0
)
returns setof public.titles
language sql
stable
security invoker
set search_path = ''
as $$
  select t.*
  from public.titles t
  where t.publication_status = 'published'
    and (requested_type is null or t."type" = requested_type)
    and (
      t.search_document @@ websearch_to_tsquery('simple', search_query)
      or extensions.similarity(t.title, search_query) > 0.2
      or extensions.similarity(coalesce(t.original_title, ''), search_query) > 0.2
    )
  order by
    ts_rank(t.search_document, websearch_to_tsquery('simple', search_query)) desc,
    greatest(
      extensions.similarity(t.title, search_query),
      extensions.similarity(coalesce(t.original_title, ''), search_query)
    ) desc,
    t.release_date desc nulls last
  limit least(greatest(result_limit, 1), 100)
  offset greatest(result_offset, 0);
$$;

grant execute on function public.search_catalog(text, public.content_type, integer, integer) to anon, authenticated;

alter table public.titles enable row level security;
alter table public.genres enable row level security;
alter table public.title_genres enable row level security;
alter table public.people enable row level security;
alter table public.title_credits enable row level security;
alter table public.studios enable row level security;
alter table public.title_studios enable row level security;
alter table public.seasons enable row level security;
alter table public.episodes enable row level security;
alter table public.video_assets enable row level security;
alter table public.subtitle_tracks enable row level security;
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;

create policy "Published titles are readable" on public.titles for select to anon, authenticated using (publication_status = 'published' or (select public.is_catalog_editor()));
create policy "Editors manage titles" on public.titles for all to authenticated using ((select public.is_catalog_editor())) with check ((select public.is_catalog_editor()));
create policy "Genres are readable" on public.genres for select to anon, authenticated using (true);
create policy "Editors manage genres" on public.genres for all to authenticated using ((select public.is_catalog_editor())) with check ((select public.is_catalog_editor()));
create policy "Published title genres are readable" on public.title_genres for select to anon, authenticated using (exists (select 1 from public.titles t where t.id = title_id and t.publication_status = 'published'));
create policy "Editors manage title genres" on public.title_genres for all to authenticated using ((select public.is_catalog_editor())) with check ((select public.is_catalog_editor()));
create policy "People are readable" on public.people for select to anon, authenticated using (true);
create policy "Editors manage people" on public.people for all to authenticated using ((select public.is_catalog_editor())) with check ((select public.is_catalog_editor()));
create policy "Published credits are readable" on public.title_credits for select to anon, authenticated using (exists (select 1 from public.titles t where t.id = title_id and t.publication_status = 'published'));
create policy "Editors manage credits" on public.title_credits for all to authenticated using ((select public.is_catalog_editor())) with check ((select public.is_catalog_editor()));
create policy "Studios are readable" on public.studios for select to anon, authenticated using (true);
create policy "Editors manage studios" on public.studios for all to authenticated using ((select public.is_catalog_editor())) with check ((select public.is_catalog_editor()));
create policy "Published title studios are readable" on public.title_studios for select to anon, authenticated using (exists (select 1 from public.titles t where t.id = title_id and t.publication_status = 'published'));
create policy "Editors manage title studios" on public.title_studios for all to authenticated using ((select public.is_catalog_editor())) with check ((select public.is_catalog_editor()));
create policy "Published seasons are readable" on public.seasons for select to anon, authenticated using (publication_status = 'published' and exists (select 1 from public.titles t where t.id = title_id and t.publication_status = 'published') or (select public.is_catalog_editor()));
create policy "Editors manage seasons" on public.seasons for all to authenticated using ((select public.is_catalog_editor())) with check ((select public.is_catalog_editor()));
create policy "Published episodes are readable" on public.episodes for select to anon, authenticated using (publication_status = 'published' and exists (select 1 from public.seasons s join public.titles t on t.id = s.title_id where s.id = season_id and s.publication_status = 'published' and t.publication_status = 'published') or (select public.is_catalog_editor()));
create policy "Editors manage episodes" on public.episodes for all to authenticated using ((select public.is_catalog_editor())) with check ((select public.is_catalog_editor()));
create policy "Editors read video assets" on public.video_assets for select to authenticated using ((select public.is_catalog_editor()));
create policy "Editors manage video assets" on public.video_assets for all to authenticated using ((select public.is_catalog_editor())) with check ((select public.is_catalog_editor()));
create policy "Editors read subtitle tracks" on public.subtitle_tracks for select to authenticated using ((select public.is_catalog_editor()));
create policy "Editors manage subtitle tracks" on public.subtitle_tracks for all to authenticated using ((select public.is_catalog_editor())) with check ((select public.is_catalog_editor()));
create policy "Published collections are readable" on public.collections for select to anon, authenticated using (publication_status = 'published' or (select public.is_catalog_editor()));
create policy "Editors manage collections" on public.collections for all to authenticated using ((select public.is_catalog_editor())) with check ((select public.is_catalog_editor()));
create policy "Published collection items are readable" on public.collection_items for select to anon, authenticated using (exists (select 1 from public.collections c join public.titles t on t.id = title_id where c.id = collection_id and c.publication_status = 'published' and t.publication_status = 'published'));
create policy "Editors manage collection items" on public.collection_items for all to authenticated using ((select public.is_catalog_editor())) with check ((select public.is_catalog_editor()));

grant select on public.titles, public.genres, public.title_genres, public.people, public.title_credits, public.studios, public.title_studios, public.seasons, public.episodes, public.collections, public.collection_items to anon, authenticated;
grant select, insert, update, delete on public.titles, public.genres, public.title_genres, public.people, public.title_credits, public.studios, public.title_studios, public.seasons, public.episodes, public.video_assets, public.subtitle_tracks, public.collections, public.collection_items to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('catalog-images', 'catalog-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('subtitles', 'subtitles', false, 2097152, array['text/vtt', 'application/x-subrip', 'text/plain'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Editors upload catalog files" on storage.objects for insert to authenticated with check (bucket_id in ('catalog-images', 'subtitles') and (select public.is_catalog_editor()));
create policy "Editors update catalog files" on storage.objects for update to authenticated using (bucket_id in ('catalog-images', 'subtitles') and (select public.is_catalog_editor())) with check (bucket_id in ('catalog-images', 'subtitles') and (select public.is_catalog_editor()));
create policy "Editors delete catalog files" on storage.objects for delete to authenticated using (bucket_id in ('catalog-images', 'subtitles') and (select public.is_catalog_editor()));
