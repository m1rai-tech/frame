create or replace function public.update_profile_privacy(
  p_profile_visibility public.profile_visibility,
  p_stats_visibility public.profile_visibility,
  p_history_visibility public.profile_visibility,
  p_lists_visibility public.profile_visibility
)
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

  update public.profiles
  set is_public = p_profile_visibility = 'public'
  where id = v_user_id;

  update public.profile_preferences
  set profile_visibility = p_profile_visibility,
      stats_visibility = p_stats_visibility,
      history_visibility = p_history_visibility,
      lists_visibility = p_lists_visibility
  where profile_id = v_user_id;

  if not found then
    raise exception 'Profile preferences not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.update_profile_privacy(
  public.profile_visibility,
  public.profile_visibility,
  public.profile_visibility,
  public.profile_visibility
) from public;
grant execute on function public.update_profile_privacy(
  public.profile_visibility,
  public.profile_visibility,
  public.profile_visibility,
  public.profile_visibility
) to authenticated;

comment on function public.update_profile_privacy(
  public.profile_visibility,
  public.profile_visibility,
  public.profile_visibility,
  public.profile_visibility
) is 'Atomically updates the authenticated user profile and section privacy settings.';
