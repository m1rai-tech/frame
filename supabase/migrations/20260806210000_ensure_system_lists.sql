create or replace function public.ensure_system_user_lists()
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

  insert into public.user_lists (user_id, name, slug, kind, is_public)
  values
    (v_user_id, 'Дивитись пізніше', 'watchlist', 'watchlist', false),
    (v_user_id, 'Улюблене', 'favorites', 'favorites', false)
  on conflict (user_id, kind) where kind <> 'custom' do nothing;
end;
$$;

revoke all on function public.ensure_system_user_lists() from public;
grant execute on function public.ensure_system_user_lists() to authenticated;

comment on function public.ensure_system_user_lists() is
  'Idempotently creates private watchlist and favorites lists for the authenticated user.';
