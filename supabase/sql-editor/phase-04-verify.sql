-- Run this read-only query in Supabase SQL Editor after applying:
-- supabase/migrations/20260806130000_profiles_preferences_roles.sql

with expected_tables(table_name) as (
  values ('profiles'), ('profile_preferences'), ('user_roles')
),
expected_policies(policy_name) as (
  values
    ('Public profiles are readable'),
    ('Users update their own profile'),
    ('Users read their own preferences'),
    ('Users update their own preferences'),
    ('Users read their own roles'),
    ('Admins read all roles'),
    ('Users upload their own profile images'),
    ('Users update their own profile images'),
    ('Users delete their own profile images')
),
checks as (
  select
    'tables' as check_name,
    count(*) = 3 as passed,
    count(*)::text || '/3 found' as details
  from information_schema.tables
  where table_schema = 'public'
    and table_name in (select table_name from expected_tables)

  union all

  select
    'RLS enabled',
    count(*) = 3,
    count(*)::text || '/3 enabled'
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in (select table_name from expected_tables)
    and c.relrowsecurity = true

  union all

  select
    'policies',
    count(*) = 9,
    count(*)::text || '/9 found'
  from pg_policies
  where policyname in (select policy_name from expected_policies)

  union all

  select
    'storage buckets',
    count(*) = 2,
    count(*)::text || '/2 found'
  from storage.buckets
  where id in ('avatars', 'profile-banners')

  union all

  select
    'signup trigger',
    count(*) = 1,
    count(*)::text || '/1 found'
  from information_schema.triggers
  where trigger_schema = 'auth'
    and event_object_table = 'users'
    and trigger_name = 'on_auth_user_created'
)
select check_name, passed, details
from checks
order by check_name;

-- Every row must return passed = true.
