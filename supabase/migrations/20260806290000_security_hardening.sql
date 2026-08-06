-- Sensitive profile state must only change through validated security-definer RPCs.
revoke update (is_public, featured_badge_id) on public.profiles from authenticated;

-- Preferences currently have dedicated owner-scoped RPCs. Remove the older broad table update grant.
revoke update on public.profile_preferences from authenticated;

-- Reassert least privilege for private activity and delivery tables.
revoke all on public.watch_sessions from anon;
revoke insert, update, delete on public.watch_sessions from authenticated;
revoke insert, update, delete on public.daily_activity, public.streaks, public.profile_achievements from anon, authenticated;
revoke all on public.notification_email_queue from anon, authenticated;

-- Trigger-only functions must never be callable as API endpoints.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.notify_new_published_episode() from public, anon, authenticated;
revoke all on function public.queue_notification_email() from public, anon, authenticated;

comment on table public.profile_preferences is
  'Owner-readable preferences. Sensitive writes use validated RPCs rather than broad client table updates.';
