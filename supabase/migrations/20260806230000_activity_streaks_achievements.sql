create table if not exists public.daily_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_date date not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  visit_count integer not null default 1 check (visit_count > 0),
  created_at timestamptz not null default now(),
  unique (user_id, activity_date)
);

create table if not exists public.streaks (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= current_streak),
  last_activity_date date,
  updated_at timestamptz not null default now()
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  icon text not null,
  threshold_days integer not null unique check (threshold_days > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.profile_achievements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  source_activity_date date not null,
  primary key (user_id, achievement_id)
);

alter table public.profiles add column if not exists featured_badge_id uuid;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_featured_badge_id_fkey') then
    alter table public.profiles
      add constraint profiles_featured_badge_id_fkey
      foreign key (featured_badge_id) references public.achievements(id) on delete set null;
  end if;
end;
$$;

create index if not exists daily_activity_user_date_idx on public.daily_activity (user_id, activity_date desc);
create index if not exists profile_achievements_user_unlocked_idx on public.profile_achievements (user_id, unlocked_at desc);

insert into public.achievements (slug, name, description, icon, threshold_days, sort_order)
values
  ('streak-3', 'Перші кроки', 'Заходьте на сайт 3 дні поспіль.', '🌱', 3, 10),
  ('streak-7', 'Тиждень у кадрі', 'Заходьте на сайт 7 днів поспіль.', '🔥', 7, 20),
  ('streak-10', 'Десятий кадр', 'Заходьте на сайт 10 днів поспіль.', '🎞️', 10, 30),
  ('streak-30', 'Місяць разом', 'Заходьте на сайт 30 днів поспіль.', '🏆', 30, 40),
  ('streak-100', 'Сотня днів', 'Заходьте на сайт 100 днів поспіль.', '💎', 100, 50),
  ('streak-365', 'Рік у кадрі', 'Заходьте на сайт 365 днів поспіль.', '👑', 365, 60)
on conflict (threshold_days) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  sort_order = excluded.sort_order;

alter table public.daily_activity enable row level security;
alter table public.streaks enable row level security;
alter table public.achievements enable row level security;
alter table public.profile_achievements enable row level security;

create or replace function public.can_view_profile_stats(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_user_id = auth.uid() or exists (
    select 1
    from public.profiles p
    join public.profile_preferences pp on pp.profile_id = p.id
    where p.id = target_user_id
      and p.is_public
      and pp.stats_visibility = 'public'
  );
$$;

revoke all on function public.can_view_profile_stats(uuid) from public;
grant execute on function public.can_view_profile_stats(uuid) to anon, authenticated;

drop policy if exists "Achievements are readable" on public.achievements;
create policy "Achievements are readable" on public.achievements for select using (true);
drop policy if exists "Visible daily activity is readable" on public.daily_activity;
create policy "Visible daily activity is readable" on public.daily_activity for select
  using (auth.uid() = user_id or public.can_view_profile_stats(user_id));
drop policy if exists "Visible streaks are readable" on public.streaks;
create policy "Visible streaks are readable" on public.streaks for select
  using (auth.uid() = user_id or public.can_view_profile_stats(user_id));
drop policy if exists "Visible achievements are readable" on public.profile_achievements;
create policy "Visible achievements are readable" on public.profile_achievements for select
  using (auth.uid() = user_id or public.can_view_profile_stats(user_id));

revoke all on public.daily_activity, public.streaks, public.profile_achievements from anon, authenticated;
grant select on public.daily_activity, public.streaks, public.profile_achievements to anon, authenticated;
revoke all on public.achievements from anon, authenticated;
grant select on public.achievements to anon, authenticated;

create or replace function public.register_daily_activity()
returns table (
  activity_date date,
  next_reset_at timestamptz,
  current_streak integer,
  longest_streak integer,
  new_achievement_slugs text[]
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_timezone text;
  v_today date;
  v_current integer;
  v_longest integer;
  v_last_date date;
  v_new_slugs text[];
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select p.timezone into v_timezone from public.profiles p where p.id = v_user_id;
  if v_timezone is null or not exists (select 1 from pg_timezone_names where name = v_timezone) then
    v_timezone := 'UTC';
  end if;
  v_today := (now() at time zone v_timezone)::date;
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  insert into public.daily_activity (user_id, activity_date)
  values (v_user_id, v_today)
  on conflict (user_id, activity_date) do update set
    last_seen_at = now(),
    visit_count = public.daily_activity.visit_count + 1;

  select s.current_streak, s.longest_streak, s.last_activity_date
    into v_current, v_longest, v_last_date
  from public.streaks s where s.user_id = v_user_id for update;

  if not found then
    v_current := 1;
    v_longest := 1;
  elsif v_last_date = v_today then
    null;
  elsif v_last_date = v_today - 1 then
    v_current := v_current + 1;
    v_longest := greatest(v_longest, v_current);
  else
    v_current := 1;
    v_longest := greatest(v_longest, 1);
  end if;

  insert into public.streaks (user_id, current_streak, longest_streak, last_activity_date, updated_at)
  values (v_user_id, v_current, v_longest, v_today, now())
  on conflict (user_id) do update set
    current_streak = excluded.current_streak,
    longest_streak = excluded.longest_streak,
    last_activity_date = excluded.last_activity_date,
    updated_at = now();

  with awarded as (
    insert into public.profile_achievements (user_id, achievement_id, source_activity_date)
    select v_user_id, a.id, v_today
    from public.achievements a
    where a.threshold_days <= v_current
    on conflict (user_id, achievement_id) do nothing
    returning achievement_id
  )
  select coalesce(array_agg(a.slug order by a.threshold_days), array[]::text[])
    into v_new_slugs
  from awarded aw join public.achievements a on a.id = aw.achievement_id;

  return query select
    v_today,
    ((v_today + 1)::timestamp at time zone v_timezone),
    v_current,
    v_longest,
    coalesce(v_new_slugs, array[]::text[]);
end;
$$;

revoke all on function public.register_daily_activity() from public;
grant execute on function public.register_daily_activity() to authenticated;

comment on function public.register_daily_activity() is
  'Registers a timezone-aware daily visit, updates streaks idempotently, and grants threshold achievements.';
