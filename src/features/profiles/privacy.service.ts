import type { Database } from '@/services/supabase/database.types';
import { getSupabaseClient } from '@/services/supabase/client';

export type Visibility = Database['public']['Enums']['profile_visibility'];
export type PrivacySettings = {
  analyticsEnabled: boolean;
  profileVisibility: Visibility;
  statsVisibility: Visibility;
  historyVisibility: Visibility;
  listsVisibility: Visibility;
};

export const privacyService = {
  async get(userId: string): Promise<PrivacySettings> {
    const [{ data: profile, error: profileError }, { data: preferences, error: preferencesError }] =
      await Promise.all([
        getSupabaseClient().from('profiles').select('is_public').eq('id', userId).single(),
        getSupabaseClient()
          .from('profile_preferences')
          .select('profile_visibility, stats_visibility, history_visibility, lists_visibility, analytics_enabled')
          .eq('profile_id', userId)
          .single(),
      ]);
    if (profileError) throw profileError;
    if (preferencesError) throw preferencesError;
    return {
      analyticsEnabled: preferences.analytics_enabled,
      profileVisibility: profile.is_public ? 'public' : 'private',
      statsVisibility: preferences.stats_visibility,
      historyVisibility: preferences.history_visibility,
      listsVisibility: preferences.lists_visibility,
    };
  },

  async save(userId: string, settings: PrivacySettings) {
    if (!userId) throw new Error('Authentication required');
    const [privacyResult, analyticsResult] = await Promise.all([
      getSupabaseClient().rpc('update_profile_privacy', {
        p_profile_visibility: settings.profileVisibility,
        p_stats_visibility: settings.statsVisibility,
        p_history_visibility: settings.historyVisibility,
        p_lists_visibility: settings.listsVisibility,
      }),
      getSupabaseClient().rpc('update_analytics_consent', {
        p_enabled: settings.analyticsEnabled,
      }),
    ]);
    if (privacyResult.error) throw privacyResult.error;
    if (analyticsResult.error) throw analyticsResult.error;
  },
};
