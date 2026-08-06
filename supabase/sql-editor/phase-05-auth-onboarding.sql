-- Apply after phase 4 migration.
alter table public.profiles
  add column onboarding_completed_at timestamptz,
  add column favorite_genre_slugs text[] not null default '{}';

alter table public.profiles
  add constraint profiles_favorite_genres_limit
  check (cardinality(favorite_genre_slugs) <= 12);

grant update (onboarding_completed_at, favorite_genre_slugs)
on public.profiles to authenticated;

comment on column public.profiles.favorite_genre_slugs is
  'Temporary onboarding preferences; normalized genre relations are introduced with catalog tables.';
