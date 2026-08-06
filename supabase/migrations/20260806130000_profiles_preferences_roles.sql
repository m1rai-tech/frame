create extension if not exists citext with schema extensions;

create type public.app_role as enum ('user', 'moderator', 'editor', 'admin');
create type public.theme_preference as enum ('system', 'dark', 'light');
create type public.interface_density as enum ('comfortable', 'compact');
create type public.profile_visibility as enum ('private', 'public');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username extensions.citext not null unique,
  display_name text not null,
  bio text,
  avatar_path text,
  banner_path text,
  accent_color text not null default '#d69a45',
  timezone text not null default 'Europe/Kyiv',
  locale text not null default 'uk',
  is_public boolean not null default false,
  featured_badge_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username::text ~ '^[a-z0-9][a-z0-9_]{2,29}$'),
  constraint profiles_display_name_length check (char_length(display_name) between 1 and 60),
  constraint profiles_bio_length check (bio is null or char_length(bio) <= 500),
  constraint profiles_accent_color_format check (accent_color ~ '^#[0-9a-fA-F]{6}$'),
  constraint profiles_locale_length check (char_length(locale) between 2 and 10)
);

create table public.profile_preferences (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  theme public.theme_preference not null default 'system',
  density public.interface_density not null default 'comfortable',
  reduced_motion boolean not null default false,
  ui_language text not null default 'uk',
  preferred_audio_language text,
  fallback_audio_language text,
  preferred_subtitle_language text,
  subtitles_enabled boolean not null default true,
  autoplay_next boolean not null default true,
  autoplay_previews boolean not null default false,
  skip_intro boolean not null default true,
  data_saver boolean not null default false,
  profile_visibility public.profile_visibility not null default 'private',
  stats_visibility public.profile_visibility not null default 'private',
  history_visibility public.profile_visibility not null default 'private',
  lists_visibility public.profile_visibility not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create index profiles_public_username_idx on public.profiles (username) where is_public = true;
create index user_roles_role_user_idx on public.user_roles (role, user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger profile_preferences_set_updated_at
before update on public.profile_preferences
for each row execute function public.set_updated_at();

create or replace function public.has_role(requested_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role = requested_role
  );
$$;

revoke all on function public.has_role(public.app_role) from public;
grant execute on function public.has_role(public.app_role) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  generated_username text := 'user_' || replace(substr(new.id::text, 1, 12), '-', '');
  safe_display_name text;
begin
  safe_display_name := left(
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(coalesce(new.email, 'Глядач'), '@', 1)),
    60
  );

  insert into public.profiles (id, username, display_name)
  values (new.id, generated_username, safe_display_name);

  insert into public.profile_preferences (profile_id)
  values (new.id);

  insert into public.user_roles (user_id, role)
  values (new.id, 'user');

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.profile_preferences enable row level security;
alter table public.user_roles enable row level security;

create policy "Public profiles are readable"
on public.profiles for select
to anon, authenticated
using (is_public = true or id = (select auth.uid()));

create policy "Users update their own profile"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "Users read their own preferences"
on public.profile_preferences for select
to authenticated
using (profile_id = (select auth.uid()));

create policy "Users update their own preferences"
on public.profile_preferences for update
to authenticated
using (profile_id = (select auth.uid()))
with check (profile_id = (select auth.uid()));

create policy "Users read their own roles"
on public.user_roles for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Admins read all roles"
on public.user_roles for select
to authenticated
using ((select public.has_role('admin')));

grant usage on schema public to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant update (username, display_name, bio, avatar_path, banner_path, accent_color, timezone, locale, is_public, featured_badge_id)
on public.profiles to authenticated;
grant select, update on public.profile_preferences to authenticated;
grant select on public.user_roles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('profile-banners', 'profile-banners', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users upload their own profile images"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('avatars', 'profile-banners')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and owner_id = (select auth.uid()::text)
);

create policy "Users update their own profile images"
on storage.objects for update
to authenticated
using (
  bucket_id in ('avatars', 'profile-banners')
  and owner_id = (select auth.uid()::text)
)
with check (
  bucket_id in ('avatars', 'profile-banners')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and owner_id = (select auth.uid()::text)
);

create policy "Users delete their own profile images"
on storage.objects for delete
to authenticated
using (
  bucket_id in ('avatars', 'profile-banners')
  and owner_id = (select auth.uid()::text)
);

comment on table public.profiles is 'Public-facing profile data linked one-to-one with auth.users.';
comment on table public.profile_preferences is 'Private appearance, playback and privacy preferences.';
comment on table public.user_roles is 'Server-managed application roles. Clients have read-only access to their own roles.';
