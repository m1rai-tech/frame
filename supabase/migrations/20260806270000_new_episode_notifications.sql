create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('new_episode')),
  title_id uuid references public.titles(id) on delete cascade,
  episode_id uuid references public.episodes(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_payload_object check (jsonb_typeof(payload) = 'object'),
  unique (user_id, type, episode_id)
);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, created_at desc) where read_at is null;
create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications" on public.notifications for select to authenticated
  using (auth.uid() = user_id);
drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications" on public.notifications for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users delete own notifications" on public.notifications;
create policy "Users delete own notifications" on public.notifications for delete to authenticated
  using (auth.uid() = user_id);

revoke all on public.notifications from anon, authenticated;
grant select, update (read_at), delete on public.notifications to authenticated;

create or replace function public.notify_new_published_episode()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title_id uuid;
  v_title text;
  v_slug text;
  v_season_number integer;
begin
  if new.publication_status <> 'published'
    or old.publication_status = 'published' then
    return new;
  end if;

  select t.id, t.title, t.slug, s.season_number
    into v_title_id, v_title, v_slug, v_season_number
  from public.seasons s
  join public.titles t on t.id = s.title_id
  where s.id = new.season_id
    and t.publication_status = 'published';

  if v_title_id is null then
    return new;
  end if;

  insert into public.notifications (user_id, type, title_id, episode_id, payload)
  select
    subscribers.user_id,
    'new_episode',
    v_title_id,
    new.id,
    jsonb_build_object(
      'title', v_title,
      'slug', v_slug,
      'seasonNumber', v_season_number,
      'episodeNumber', new.episode_number,
      'episodeTitle', new.title
    )
  from (
    select wp.user_id
    from public.watch_progress wp
    where wp.title_id = v_title_id
    union
    select ul.user_id
    from public.user_lists ul
    join public.user_list_items uli on uli.list_id = ul.id
    where uli.title_id = v_title_id
  ) subscribers
  on conflict (user_id, type, episode_id) do nothing;

  return new;
end;
$$;

drop trigger if exists episodes_notify_on_publish on public.episodes;
create trigger episodes_notify_on_publish
after update of publication_status on public.episodes
for each row execute function public.notify_new_published_episode();

revoke all on function public.notify_new_published_episode() from public;

comment on table public.notifications is
  'Private in-app notifications. New-episode payloads intentionally contain no synopsis to avoid spoilers.';
comment on function public.notify_new_published_episode() is
  'Creates one deduplicated notification for users who watched or listed the title when a new episode is published.';
