alter table public.profile_preferences
  add column if not exists analytics_enabled boolean not null default false;

create table if not exists public.app_events (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  event_name text not null check (
    event_name in ('page_view', 'client_error', 'page_load', 'playback_started', 'playback_completed')
  ),
  path text not null check (char_length(path) between 1 and 300),
  properties jsonb not null default '{}'::jsonb check (jsonb_typeof(properties) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists app_events_created_at_idx
  on public.app_events (created_at desc);
create index if not exists app_events_profile_created_idx
  on public.app_events (profile_id, created_at desc);

alter table public.app_events enable row level security;

drop policy if exists "Catalog editors can read app events" on public.app_events;
create policy "Catalog editors can read app events"
  on public.app_events
  for select
  to authenticated
  using (public.is_catalog_editor());

revoke all on public.app_events from public, anon;
revoke insert, update, delete on public.app_events from authenticated;
grant select on public.app_events to authenticated;

create or replace function public.update_analytics_consent(p_enabled boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.profile_preferences
  set analytics_enabled = coalesce(p_enabled, false), updated_at = now()
  where profile_id = auth.uid();

  if not found then
    raise exception 'Profile preferences not found';
  end if;
end;
$$;

revoke all on function public.update_analytics_consent(boolean) from public, anon;
grant execute on function public.update_analytics_consent(boolean) to authenticated;

create or replace function public.record_app_event(
  p_event_name text,
  p_path text,
  p_properties jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  analytics_allowed boolean := false;
  safe_properties jsonb := coalesce(p_properties, '{}'::jsonb);
begin
  if auth.uid() is null then
    return false;
  end if;

  select analytics_enabled
  into analytics_allowed
  from public.profile_preferences
  where profile_id = auth.uid();

  if not coalesce(analytics_allowed, false) then
    return false;
  end if;

  if p_event_name is null or p_event_name not in (
    'page_view', 'client_error', 'page_load', 'playback_started', 'playback_completed'
  ) then
    raise exception 'Unsupported event name';
  end if;

  if p_path is null or left(p_path, 1) <> '/' or char_length(p_path) > 300 then
    raise exception 'Invalid event path';
  end if;

  if jsonb_typeof(safe_properties) <> 'object' or octet_length(safe_properties::text) > 4096 then
    raise exception 'Invalid event properties';
  end if;

  insert into public.app_events (profile_id, event_name, path, properties)
  values (auth.uid(), p_event_name, p_path, safe_properties);

  return true;
end;
$$;

revoke all on function public.record_app_event(text, text, jsonb) from public, anon;
grant execute on function public.record_app_event(text, text, jsonb) to authenticated;

create or replace function public.get_app_health()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'status', 'ok',
    'database', 'ok',
    'checked_at', now(),
    'schema_version', '20260806300000'
  );
$$;

revoke all on function public.get_app_health() from public;
grant execute on function public.get_app_health() to anon, authenticated;

comment on table public.app_events is
  'Privacy-controlled first-party product and operational events. Direct client writes are forbidden.';
comment on function public.record_app_event(text, text, jsonb) is
  'Records a small allow-listed event only when the authenticated profile opted into analytics.';
