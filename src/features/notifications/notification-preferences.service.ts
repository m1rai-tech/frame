import { getSupabaseClient } from '@/services/supabase/client';

export type DigestFrequency = 'instant' | 'daily' | 'weekly';
export type NotificationPreferences = {
  emailNewEpisodes: boolean;
  emailDigestFrequency: DigestFrequency;
};

export const notificationPreferencesService = {
  async get(userId: string): Promise<NotificationPreferences> {
    const { data, error } = await getSupabaseClient()
      .from('profile_preferences')
      .select('email_new_episodes, email_digest_frequency')
      .eq('profile_id', userId)
      .single();
    if (error) throw error;
    return {
      emailNewEpisodes: data.email_new_episodes,
      emailDigestFrequency: data.email_digest_frequency,
    };
  },

  async save(preferences: NotificationPreferences) {
    const { error } = await getSupabaseClient().rpc('update_email_notification_preferences', {
      p_email_new_episodes: preferences.emailNewEpisodes,
      p_email_digest_frequency: preferences.emailDigestFrequency,
    });
    if (error) throw error;
  },
};
