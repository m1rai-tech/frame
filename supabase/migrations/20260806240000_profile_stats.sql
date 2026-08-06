create or replace function public.get_profile_stats(p_user_id uuid default null)
returns table (
  user_id uuid,
  total_watch_seconds bigint,
  watched_titles bigint,
  completed_movies bigint,
  completed_series_episodes bigint,
  completed_anime_episodes bigint,
  ratings_count bigint,
  active_days bigint,
  current_streak integer,
  longest_streak integer,
  achievements_unlocked bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_target uuid := coalesce(p_user_id, auth.uid());
begin
  if v_target is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if not public.can_view_profile_stats(v_target) then
    raise exception 'Profile statistics are private' using errcode = '42501';
  end if;

  return query
  select
    v_target,
    coalesce((select sum(ws.watched_seconds) from public.watch_sessions ws where ws.user_id = v_target), 0)::bigint,
    (select count(distinct wp.title_id) from public.watch_progress wp where wp.user_id = v_target and (wp.position_seconds > 0 or wp.completed))::bigint,
    (select count(distinct wp.title_id)
      from public.watch_progress wp join public.titles t on t.id = wp.title_id
      where wp.user_id = v_target and wp.completed and t.type = 'movie')::bigint,
    (select count(*)
      from public.watch_progress wp join public.titles t on t.id = wp.title_id
      where wp.user_id = v_target and wp.completed and wp.episode_id is not null and t.type = 'series')::bigint,
    (select count(*)
      from public.watch_progress wp join public.titles t on t.id = wp.title_id
      where wp.user_id = v_target and wp.completed and wp.episode_id is not null and t.type = 'anime')::bigint,
    (select count(*) from public.ratings r where r.user_id = v_target)::bigint,
    (select count(*) from public.daily_activity da where da.user_id = v_target)::bigint,
    coalesce((select s.current_streak from public.streaks s where s.user_id = v_target), 0),
    coalesce((select s.longest_streak from public.streaks s where s.user_id = v_target), 0),
    (select count(*) from public.profile_achievements pa where pa.user_id = v_target)::bigint;
end;
$$;

revoke all on function public.get_profile_stats(uuid) from public;
grant execute on function public.get_profile_stats(uuid) to anon, authenticated;

create or replace function public.set_featured_achievement(p_achievement_id uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_achievement_id is not null and not exists (
    select 1 from public.profile_achievements pa
    where pa.user_id = v_user_id and pa.achievement_id = p_achievement_id
  ) then
    raise exception 'Achievement is not unlocked' using errcode = '42501';
  end if;
  update public.profiles
  set featured_badge_id = p_achievement_id
  where id = v_user_id;
end;
$$;

revoke all on function public.set_featured_achievement(uuid) from public;
grant execute on function public.set_featured_achievement(uuid) to authenticated;

comment on function public.get_profile_stats(uuid) is
  'Returns privacy-aware aggregate watch and activity statistics without duplicating watch-session rows.';
comment on function public.set_featured_achievement(uuid) is
  'Sets or clears an achievement badge only when it belongs to the authenticated user.';
