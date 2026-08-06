begin;

create extension if not exists pgtap with schema extensions;
select plan(20);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'profile_preferences', 'profile_preferences table exists');
select has_table('public', 'user_roles', 'user_roles table exists');
select col_is_pk('public', 'profiles', 'id', 'profiles.id is the primary key');
select col_is_pk('public', 'profile_preferences', 'profile_id', 'preferences.profile_id is the primary key');
select has_function('public', 'handle_new_user', array[]::text[], 'signup trigger function exists');
select has_function('public', 'has_role', array['app_role'], 'role helper exists');
select is_definer('public', 'handle_new_user', array[]::text[], 'signup trigger is security definer');
select is_definer('public', 'has_role', array['app_role'], 'role helper is security definer');

select policies_are(
  'public',
  'profiles',
  array['Public profiles are readable', 'Users update their own profile'],
  'profiles has only expected policies'
);

select policies_are(
  'public',
  'profile_preferences',
  array['Users read their own preferences', 'Users update their own preferences'],
  'preferences has only expected policies'
);

select policies_are(
  'public',
  'user_roles',
  array['Admins read all roles', 'Users read their own roles'],
  'roles has only expected policies'
);

select policy_cmd_is('public', 'profiles', 'Users update their own profile', 'UPDATE', 'profile owner policy only updates');
select policy_roles_are('public', 'profiles', 'Users update their own profile', array['authenticated'], 'only authenticated users update profiles');
select policy_cmd_is('public', 'user_roles', 'Users read their own roles', 'SELECT', 'roles are read-only for users');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  'RLS enabled on profiles'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.profile_preferences'::regclass),
  'RLS enabled on preferences'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.user_roles'::regclass),
  'RLS enabled on roles'
);

select results_eq(
  $$select count(*)::bigint from storage.buckets where id in ('avatars', 'profile-banners')$$,
  array[2::bigint],
  'profile image buckets exist'
);

select results_eq(
  $$select count(*)::bigint from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'Users % their own profile images'$$,
  array[3::bigint],
  'storage has insert, update and delete owner policies'
);

select * from finish();
rollback;
