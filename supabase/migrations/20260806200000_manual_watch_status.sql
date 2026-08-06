create or replace function public.set_manual_watch_status(
  p_title_id uuid,
  p_scope text,
  p_scope_id uuid default null,
  p_watched boolean default true
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_runtime_seconds integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_scope not in ('title', 'season', 'episode') then
    raise exception 'Invalid watch status scope' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.titles t
    where t.id = p_title_id and t.publication_status = 'published'
  ) then
    raise exception 'Published title not found' using errcode = 'P0002';
  end if;
  if p_scope = 'season' and not exists (
    select 1 from public.seasons s
    where s.id = p_scope_id and s.title_id = p_title_id
      and s.publication_status = 'published'
  ) then
    raise exception 'Published season not found' using errcode = 'P0002';
  end if;
  if p_scope = 'episode' and not exists (
    select 1
    from public.episodes e
    join public.seasons s on s.id = e.season_id
    where e.id = p_scope_id and s.title_id = p_title_id
      and e.publication_status = 'published'
      and s.publication_status = 'published'
  ) then
    raise exception 'Published episode not found' using errcode = 'P0002';
  end if;

  if not p_watched then
    update public.watch_progress wp
    set position_seconds = 0,
        completed = false,
        completed_at = null,
        hidden_at = null
    where wp.user_id = v_user_id
      and wp.title_id = p_title_id
      and (
        p_scope = 'title'
        or (p_scope = 'episode' and wp.episode_id = p_scope_id)
        or (p_scope = 'season' and wp.episode_id in (
          select e.id from public.episodes e where e.season_id = p_scope_id
        ))
      );
    return;
  end if;

  if p_scope = 'episode' then
    insert into public.watch_progress (
      user_id, title_id, episode_id, position_seconds, duration_seconds,
      completed, completed_at, last_watched_at, hidden_at
    )
    select
      v_user_id, p_title_id, e.id, coalesce(e.runtime_seconds, 0), e.runtime_seconds,
      true, now(), now(), null
    from public.episodes e
    where e.id = p_scope_id
    on conflict (user_id, episode_id) where episode_id is not null
    do update set
      position_seconds = coalesce(excluded.duration_seconds, public.watch_progress.position_seconds),
      duration_seconds = coalesce(excluded.duration_seconds, public.watch_progress.duration_seconds),
      completed = true,
      completed_at = coalesce(public.watch_progress.completed_at, now()),
      last_watched_at = now(),
      hidden_at = null;
    return;
  end if;

  insert into public.watch_progress (
    user_id, title_id, episode_id, position_seconds, duration_seconds,
    completed, completed_at, last_watched_at, hidden_at
  )
  select
    v_user_id, p_title_id, e.id, coalesce(e.runtime_seconds, 0), e.runtime_seconds,
    true, now(), now(), null
  from public.episodes e
  join public.seasons s on s.id = e.season_id
  where s.title_id = p_title_id
    and s.publication_status = 'published'
    and e.publication_status = 'published'
    and (p_scope = 'title' or s.id = p_scope_id)
  on conflict (user_id, episode_id) where episode_id is not null
  do update set
    position_seconds = coalesce(excluded.duration_seconds, public.watch_progress.position_seconds),
    duration_seconds = coalesce(excluded.duration_seconds, public.watch_progress.duration_seconds),
    completed = true,
    completed_at = coalesce(public.watch_progress.completed_at, now()),
    last_watched_at = now(),
    hidden_at = null;

  if p_scope = 'title' and not exists (
    select 1
    from public.episodes e
    join public.seasons s on s.id = e.season_id
    where s.title_id = p_title_id
      and s.publication_status = 'published'
      and e.publication_status = 'published'
  ) then
    select t.runtime_minutes * 60 into v_runtime_seconds
    from public.titles t where t.id = p_title_id;
    insert into public.watch_progress (
      user_id, title_id, episode_id, position_seconds, duration_seconds,
      completed, completed_at, last_watched_at, hidden_at
    ) values (
      v_user_id, p_title_id, null, coalesce(v_runtime_seconds, 0), v_runtime_seconds,
      true, now(), now(), null
    )
    on conflict (user_id, title_id) where episode_id is null
    do update set
      position_seconds = coalesce(excluded.duration_seconds, public.watch_progress.position_seconds),
      duration_seconds = coalesce(excluded.duration_seconds, public.watch_progress.duration_seconds),
      completed = true,
      completed_at = coalesce(public.watch_progress.completed_at, now()),
      last_watched_at = now(),
      hidden_at = null;
  end if;
end;
$$;

revoke all on function public.set_manual_watch_status(uuid, text, uuid, boolean) from public;
grant execute on function public.set_manual_watch_status(uuid, text, uuid, boolean) to authenticated;

comment on function public.set_manual_watch_status(uuid, text, uuid, boolean) is
  'Marks a published title, season or episode watched/unwatched without adding watch-session time.';
