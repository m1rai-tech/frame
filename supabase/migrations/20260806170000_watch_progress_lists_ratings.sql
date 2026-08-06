do $$ begin
  create type public.user_list_kind as enum ('custom', 'watchlist', 'favorites');
exception when duplicate_object then null;
end $$;

create table if not exists public.watch_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title_id uuid not null references public.titles (id) on delete cascade,
  episode_id uuid references public.episodes (id) on delete cascade,
  position_seconds integer not null default 0,
  duration_seconds integer,
  completed boolean not null default false,
  completed_at timestamptz,
  last_watched_at timestamptz not null default now(),
  hidden_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint watch_progress_position_nonnegative check (position_seconds >= 0),
  constraint watch_progress_duration_positive check (duration_seconds is null or duration_seconds > 0),
  constraint watch_progress_position_sane check (
    duration_seconds is null or position_seconds <= duration_seconds + 30
  ),
  constraint watch_progress_completed_at check (
    (completed and completed_at is not null) or (not completed and completed_at is null)
  )
);

create unique index if not exists watch_progress_movie_unique
  on public.watch_progress (user_id, title_id)
  where episode_id is null;
create unique index if not exists watch_progress_episode_unique
  on public.watch_progress (user_id, episode_id)
  where episode_id is not null;
create index if not exists watch_progress_continue_idx
  on public.watch_progress (user_id, last_watched_at desc)
  where completed = false and hidden_at is null;
create index if not exists watch_progress_history_idx
  on public.watch_progress (user_id, last_watched_at desc);

create table if not exists public.watch_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  progress_id uuid not null references public.watch_progress (id) on delete cascade,
  client_session_id uuid not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  watched_seconds integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, client_session_id),
  constraint watch_sessions_seconds_nonnegative check (watched_seconds >= 0),
  constraint watch_sessions_time_order check (ended_at is null or ended_at >= started_at)
);

create index if not exists watch_sessions_user_started_idx
  on public.watch_sessions (user_id, started_at desc);
create index if not exists watch_sessions_progress_idx
  on public.watch_sessions (progress_id);

create table if not exists public.ratings (
  user_id uuid not null references auth.users (id) on delete cascade,
  title_id uuid not null references public.titles (id) on delete cascade,
  score smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, title_id),
  constraint ratings_score_range check (score between 1 and 10)
);

create index if not exists ratings_title_idx on public.ratings (title_id);

create table if not exists public.user_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  slug text not null,
  kind public.user_list_kind not null default 'custom',
  description text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug),
  constraint user_lists_name_length check (char_length(trim(name)) between 1 and 80),
  constraint user_lists_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint user_lists_description_length check (
    description is null or char_length(description) <= 500
  )
);

create unique index if not exists user_lists_system_kind_unique
  on public.user_lists (user_id, kind)
  where kind <> 'custom';
create index if not exists user_lists_public_idx
  on public.user_lists (user_id, created_at desc)
  where is_public = true;

create table if not exists public.user_list_items (
  list_id uuid not null references public.user_lists (id) on delete cascade,
  title_id uuid not null references public.titles (id) on delete cascade,
  note text,
  sort_order integer not null default 0,
  added_at timestamptz not null default now(),
  primary key (list_id, title_id),
  constraint user_list_items_note_length check (note is null or char_length(note) <= 500)
);

create index if not exists user_list_items_list_order_idx
  on public.user_list_items (list_id, sort_order, added_at desc);
create index if not exists user_list_items_title_idx
  on public.user_list_items (title_id);

drop trigger if exists watch_progress_set_updated_at on public.watch_progress;
create trigger watch_progress_set_updated_at before update on public.watch_progress
  for each row execute function public.set_updated_at();
drop trigger if exists ratings_set_updated_at on public.ratings;
create trigger ratings_set_updated_at before update on public.ratings
  for each row execute function public.set_updated_at();
drop trigger if exists user_lists_set_updated_at on public.user_lists;
create trigger user_lists_set_updated_at before update on public.user_lists
  for each row execute function public.set_updated_at();

alter table public.watch_progress enable row level security;
alter table public.watch_sessions enable row level security;
alter table public.ratings enable row level security;
alter table public.user_lists enable row level security;
alter table public.user_list_items enable row level security;

drop policy if exists "Users read own watch progress" on public.watch_progress;
create policy "Users read own watch progress" on public.watch_progress for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "Users create own watch progress" on public.watch_progress;
create policy "Users create own watch progress" on public.watch_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "Users update own watch progress" on public.watch_progress;
create policy "Users update own watch progress" on public.watch_progress for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users delete own watch progress" on public.watch_progress;
create policy "Users delete own watch progress" on public.watch_progress for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users read own watch sessions" on public.watch_sessions;
create policy "Users read own watch sessions" on public.watch_sessions for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users read own ratings" on public.ratings;
create policy "Users read own ratings" on public.ratings for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "Users create own ratings" on public.ratings;
create policy "Users create own ratings" on public.ratings for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "Users update own ratings" on public.ratings;
create policy "Users update own ratings" on public.ratings for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users delete own ratings" on public.ratings;
create policy "Users delete own ratings" on public.ratings for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Lists are readable by owner or public" on public.user_lists;
create policy "Lists are readable by owner or public" on public.user_lists for select to anon, authenticated
  using (is_public or (select auth.uid()) = user_id);
drop policy if exists "Users create own lists" on public.user_lists;
create policy "Users create own lists" on public.user_lists for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "Users update own lists" on public.user_lists;
create policy "Users update own lists" on public.user_lists for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users delete own lists" on public.user_lists;
create policy "Users delete own lists" on public.user_lists for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "List items are readable with their list" on public.user_list_items;
create policy "List items are readable with their list" on public.user_list_items for select to anon, authenticated
  using (exists (
    select 1 from public.user_lists l
    where l.id = list_id and (l.is_public or l.user_id = (select auth.uid()))
  ));
drop policy if exists "Owners create list items" on public.user_list_items;
create policy "Owners create list items" on public.user_list_items for insert to authenticated
  with check (exists (
    select 1 from public.user_lists l
    where l.id = list_id and l.user_id = (select auth.uid())
  ));
drop policy if exists "Owners update list items" on public.user_list_items;
create policy "Owners update list items" on public.user_list_items for update to authenticated
  using (exists (
    select 1 from public.user_lists l
    where l.id = list_id and l.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.user_lists l
    where l.id = list_id and l.user_id = (select auth.uid())
  ));
drop policy if exists "Owners delete list items" on public.user_list_items;
create policy "Owners delete list items" on public.user_list_items for delete to authenticated
  using (exists (
    select 1 from public.user_lists l
    where l.id = list_id and l.user_id = (select auth.uid())
  ));

grant select, insert, update, delete on public.watch_progress to authenticated;
grant select on public.watch_sessions to authenticated;
grant select, insert, update, delete on public.ratings to authenticated;
grant select on public.user_lists, public.user_list_items to anon;
grant select, insert, update, delete on public.user_lists, public.user_list_items to authenticated;
