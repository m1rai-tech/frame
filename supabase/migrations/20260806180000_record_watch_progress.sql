alter table public.watch_sessions
  add column if not exists last_heartbeat_at timestamptz not null default now();

create or replace function public.record_watch_progress(
  p_title_id uuid,
  p_episode_id uuid,
  p_position_seconds integer,
  p_duration_seconds integer,
  p_client_session_id uuid,
  p_watched_delta_seconds integer default 0,
  p_completed boolean default false,
  p_final boolean default false
)
returns table (
  progress_id uuid,
  position_seconds integer,
  completed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_progress_id uuid;
  v_position integer;
  v_duration integer;
  v_completed boolean;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_title_id is null or p_client_session_id is null then
    raise exception 'title_id and client_session_id are required' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.titles t
    where t.id = p_title_id and t.publication_status = 'published'
  ) then
    raise exception 'Published title not found' using errcode = 'P0002';
  end if;

  if p_episode_id is not null and not exists (
    select 1
    from public.episodes e
    join public.seasons s on s.id = e.season_id
    where e.id = p_episode_id
      and s.title_id = p_title_id
      and e.publication_status = 'published'
      and s.publication_status = 'published'
  ) then
    raise exception 'Published episode does not belong to title' using errcode = '22023';
  end if;

  v_duration := case
    when p_duration_seconds is null or p_duration_seconds <= 0 then null
    else p_duration_seconds
  end;
  v_position := greatest(0, p_position_seconds);
  if v_duration is not null then
    v_position := least(v_position, v_duration + 30);
  end if;
  v_completed := coalesce(p_completed, false) or (
    v_duration is not null and v_duration >= 30 and v_position >= floor(v_duration * 0.9)
  );

  if p_episode_id is null then
    insert into public.watch_progress (
      user_id, title_id, episode_id, position_seconds, duration_seconds,
      completed, completed_at, last_watched_at, hidden_at
    ) values (
      v_user_id, p_title_id, null, v_position, v_duration,
      v_completed, case when v_completed then now() else null end, now(), null
    )
    on conflict (user_id, title_id) where episode_id is null
    do update set
      position_seconds = excluded.position_seconds,
      duration_seconds = coalesce(excluded.duration_seconds, public.watch_progress.duration_seconds),
      completed = public.watch_progress.completed or excluded.completed,
      completed_at = case
        when public.watch_progress.completed then public.watch_progress.completed_at
        when excluded.completed then now()
        else null
      end,
      last_watched_at = now(),
      hidden_at = null
    returning id into v_progress_id;
  else
    insert into public.watch_progress (
      user_id, title_id, episode_id, position_seconds, duration_seconds,
      completed, completed_at, last_watched_at, hidden_at
    ) values (
      v_user_id, p_title_id, p_episode_id, v_position, v_duration,
      v_completed, case when v_completed then now() else null end, now(), null
    )
    on conflict (user_id, episode_id) where episode_id is not null
    do update set
      title_id = excluded.title_id,
      position_seconds = excluded.position_seconds,
      duration_seconds = coalesce(excluded.duration_seconds, public.watch_progress.duration_seconds),
      completed = public.watch_progress.completed or excluded.completed,
      completed_at = case
        when public.watch_progress.completed then public.watch_progress.completed_at
        when excluded.completed then now()
        else null
      end,
      last_watched_at = now(),
      hidden_at = null
    returning id into v_progress_id;
  end if;

  insert into public.watch_sessions (
    user_id, progress_id, client_session_id, watched_seconds,
    ended_at, last_heartbeat_at
  ) values (
    v_user_id, v_progress_id, p_client_session_id, 0,
    case when p_final then now() else null end, now()
  )
  on conflict (user_id, client_session_id)
  do update set
    progress_id = excluded.progress_id,
    watched_seconds = public.watch_sessions.watched_seconds + least(
      greatest(coalesce(p_watched_delta_seconds, 0), 0),
      greatest(
        floor(extract(epoch from (now() - public.watch_sessions.last_heartbeat_at)))::integer + 2,
        0
      ),
      30
    ),
    last_heartbeat_at = now(),
    ended_at = case when p_final then now() else null end;

  return query
  select wp.id, wp.position_seconds, wp.completed
  from public.watch_progress wp
  where wp.id = v_progress_id;
end;
$$;

revoke all on function public.record_watch_progress(
  uuid, uuid, integer, integer, uuid, integer, boolean, boolean
) from public;
grant execute on function public.record_watch_progress(
  uuid, uuid, integer, integer, uuid, integer, boolean, boolean
) to authenticated;
