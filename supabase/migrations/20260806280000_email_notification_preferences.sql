alter table public.profile_preferences
  add column if not exists email_new_episodes boolean not null default false,
  add column if not exists email_digest_frequency text not null default 'instant';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profile_preferences_email_digest_frequency_check') then
    alter table public.profile_preferences add constraint profile_preferences_email_digest_frequency_check
      check (email_digest_frequency in ('instant', 'daily', 'weekly'));
  end if;
end;
$$;

create table if not exists public.notification_email_queue (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null unique references public.notifications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  scheduled_for timestamptz not null default now(),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists notification_email_queue_pending_idx
  on public.notification_email_queue (scheduled_for, created_at) where status = 'pending';
alter table public.notification_email_queue enable row level security;
revoke all on public.notification_email_queue from anon, authenticated;

create or replace function public.update_email_notification_preferences(
  p_email_new_episodes boolean,
  p_email_digest_frequency text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_email_digest_frequency not in ('instant', 'daily', 'weekly') then
    raise exception 'Invalid digest frequency' using errcode = '22023';
  end if;
  update public.profile_preferences
  set email_new_episodes = p_email_new_episodes,
      email_digest_frequency = p_email_digest_frequency,
      updated_at = now()
  where profile_id = auth.uid();
  if not found then
    raise exception 'Profile preferences not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.update_email_notification_preferences(boolean, text) from public;
grant execute on function public.update_email_notification_preferences(boolean, text) to authenticated;

create or replace function public.queue_notification_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_enabled boolean;
  v_frequency text;
  v_scheduled_for timestamptz;
begin
  select pp.email_new_episodes, pp.email_digest_frequency into v_enabled, v_frequency
  from public.profile_preferences pp where pp.profile_id = new.user_id;
  if new.type <> 'new_episode' or not coalesce(v_enabled, false) then return new; end if;
  v_scheduled_for := case v_frequency
    when 'daily' then now() + interval '24 hours'
    when 'weekly' then now() + interval '7 days'
    else now()
  end;
  insert into public.notification_email_queue (notification_id, user_id, scheduled_for)
  values (new.id, new.user_id, v_scheduled_for)
  on conflict (notification_id) do nothing;
  return new;
end;
$$;

drop trigger if exists notifications_queue_email on public.notifications;
create trigger notifications_queue_email after insert on public.notifications
for each row execute function public.queue_notification_email();
revoke all on function public.queue_notification_email() from public;

comment on table public.notification_email_queue is
  'Server-only delivery queue. A provider worker resolves auth email and sends spoiler-safe templates.';
