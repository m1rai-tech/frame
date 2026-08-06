-- Run after catalog migration and optional seed.sql.
with expected_tables(name) as (
  values ('titles'), ('genres'), ('title_genres'), ('people'), ('title_credits'),
         ('studios'), ('title_studios'), ('seasons'), ('episodes'), ('video_assets'),
         ('subtitle_tracks'), ('collections'), ('collection_items')
), checks as (
  select 'catalog tables' as check_name, count(*) = 13 as passed, count(*)::text || '/13 found' as details
  from information_schema.tables where table_schema = 'public' and table_name in (select name from expected_tables)
  union all
  select 'RLS enabled', count(*) = 13, count(*)::text || '/13 enabled'
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname in (select name from expected_tables) and c.relrowsecurity
  union all
  select 'catalog policies', count(*) >= 26, count(*)::text || ' found'
  from pg_policies where schemaname = 'public' and tablename in (select name from expected_tables)
  union all
  select 'catalog storage buckets', count(*) = 2, count(*)::text || '/2 found'
  from storage.buckets where id in ('catalog-images', 'subtitles')
  union all
  select 'search function', count(*) = 1, count(*)::text || '/1 found'
  from information_schema.routines where routine_schema = 'public' and routine_name = 'search_catalog'
)
select * from checks order by check_name;
