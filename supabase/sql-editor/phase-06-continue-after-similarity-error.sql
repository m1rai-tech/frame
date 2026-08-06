-- Use only when the catalog tables already exist after the earlier similarity() error.
-- Do not rerun the full phase-06 migration before this continuation.
begin;

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

-- A previous failed run may already have created some policies. Recreate them
-- explicitly so this continuation script is safe to run more than once.
drop policy if exists "Published titles are readable" on public.titles;
drop policy if exists "Editors manage titles" on public.titles;
drop policy if exists "Genres are readable" on public.genres;
drop policy if exists "Editors manage genres" on public.genres;
drop policy if exists "Published title genres are readable" on public.title_genres;
drop policy if exists "Editors manage title genres" on public.title_genres;
drop policy if exists "People are readable" on public.people;
drop policy if exists "Editors manage people" on public.people;
drop policy if exists "Published credits are readable" on public.title_credits;
drop policy if exists "Editors manage credits" on public.title_credits;
drop policy if exists "Studios are readable" on public.studios;
drop policy if exists "Editors manage studios" on public.studios;
drop policy if exists "Published title studios are readable" on public.title_studios;
drop policy if exists "Editors manage title studios" on public.title_studios;
drop policy if exists "Published seasons are readable" on public.seasons;
drop policy if exists "Editors manage seasons" on public.seasons;
drop policy if exists "Published episodes are readable" on public.episodes;
drop policy if exists "Editors manage episodes" on public.episodes;
drop policy if exists "Editors read video assets" on public.video_assets;
drop policy if exists "Editors manage video assets" on public.video_assets;
drop policy if exists "Editors read subtitle tracks" on public.subtitle_tracks;
drop policy if exists "Editors manage subtitle tracks" on public.subtitle_tracks;
drop policy if exists "Published collections are readable" on public.collections;
drop policy if exists "Editors manage collections" on public.collections;
drop policy if exists "Published collection items are readable" on public.collection_items;
drop policy if exists "Editors manage collection items" on public.collection_items;

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

drop policy if exists "Editors upload catalog files" on storage.objects;
drop policy if exists "Editors update catalog files" on storage.objects;
drop policy if exists "Editors delete catalog files" on storage.objects;

create policy "Editors upload catalog files" on storage.objects for insert to authenticated with check (bucket_id in ('catalog-images', 'subtitles') and (select public.is_catalog_editor()));
create policy "Editors update catalog files" on storage.objects for update to authenticated using (bucket_id in ('catalog-images', 'subtitles') and (select public.is_catalog_editor())) with check (bucket_id in ('catalog-images', 'subtitles') and (select public.is_catalog_editor()));
create policy "Editors delete catalog files" on storage.objects for delete to authenticated using (bucket_id in ('catalog-images', 'subtitles') and (select public.is_catalog_editor()));

commit;
