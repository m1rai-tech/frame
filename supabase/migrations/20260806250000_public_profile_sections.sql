create or replace function public.get_profile_section_visibility(p_user_id uuid)
returns table (
  profile_is_public boolean,
  stats_is_public boolean,
  history_is_public boolean,
  lists_is_public boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.is_public,
    p.is_public and pp.stats_visibility = 'public',
    p.is_public and pp.history_visibility = 'public',
    p.is_public and pp.lists_visibility = 'public'
  from public.profiles p
  join public.profile_preferences pp on pp.profile_id = p.id
  where p.id = p_user_id
    and (p.is_public or p.id = auth.uid());
$$;

create or replace function public.can_view_profile_history(target_user_id uuid)
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
      and pp.history_visibility = 'public'
  );
$$;

create or replace function public.can_view_profile_lists(target_user_id uuid)
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
      and pp.lists_visibility = 'public'
  );
$$;

revoke all on function public.get_profile_section_visibility(uuid) from public;
grant execute on function public.get_profile_section_visibility(uuid) to anon, authenticated;
revoke all on function public.can_view_profile_history(uuid) from public;
grant execute on function public.can_view_profile_history(uuid) to anon, authenticated;
revoke all on function public.can_view_profile_lists(uuid) from public;
grant execute on function public.can_view_profile_lists(uuid) to anon, authenticated;

drop policy if exists "Users read own watch progress" on public.watch_progress;
drop policy if exists "Visible watch progress is readable" on public.watch_progress;
create policy "Visible watch progress is readable" on public.watch_progress for select to anon, authenticated
  using (public.can_view_profile_history(user_id));

drop policy if exists "Lists are readable by owner or public" on public.user_lists;
drop policy if exists "Visible profile lists are readable" on public.user_lists;
create policy "Visible profile lists are readable" on public.user_lists for select to anon, authenticated
  using (public.can_view_profile_lists(user_id));

drop policy if exists "List items are readable with their list" on public.user_list_items;
create policy "List items are readable with their list" on public.user_list_items for select to anon, authenticated
  using (exists (
    select 1 from public.user_lists l
    where l.id = list_id and public.can_view_profile_lists(l.user_id)
  ));

comment on function public.get_profile_section_visibility(uuid) is
  'Returns public profile-section flags and allows the owner to preview a private profile.';
