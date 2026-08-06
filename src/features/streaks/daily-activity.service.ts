import { getSupabaseClient } from '@/services/supabase/client';

export type DailyActivityResult = {
  activityDate: string;
  nextResetAt: string;
  currentStreak: number;
  longestStreak: number;
  newAchievements: Array<{ slug: string; name: string }>;
};

export const dailyActivityService = {
  async register(): Promise<DailyActivityResult> {
    const client = getSupabaseClient();
    const { data, error } = await client.rpc('register_daily_activity');
    if (error) throw error;
    const result = data[0];
    if (!result) throw new Error('Daily activity result is missing');
    const slugs = result.new_achievement_slugs ?? [];
    const { data: achievements, error: achievementsError } = slugs.length
      ? await client.from('achievements').select('slug, name').in('slug', slugs)
      : { data: [], error: null };
    if (achievementsError) throw achievementsError;
    return {
      activityDate: result.activity_date,
      nextResetAt: result.next_reset_at,
      currentStreak: result.current_streak,
      longestStreak: result.longest_streak,
      newAchievements: achievements,
    };
  },
};
