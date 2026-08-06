import { getSupabaseClient } from '@/services/supabase/client';

export type ProfileStatsSummary = {
  totalWatchSeconds: number;
  watchedTitles: number;
  completedMovies: number;
  completedSeriesEpisodes: number;
  completedAnimeEpisodes: number;
  ratingsCount: number;
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
  achievementsUnlocked: number;
};

export type ActivityDay = { date: string; visits: number };
export type AchievementItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  thresholdDays: number;
  unlocked: boolean;
  unlockedAt: string | null;
};
export type ProfileStatsDashboard = {
  summary: ProfileStatsSummary;
  activity: ActivityDay[];
  achievements: AchievementItem[];
  featuredAchievementId: string | null;
};

const toNumber = (value: number | null | undefined) => Number(value ?? 0);

export const profileStatsService = {
  async getSummary(userId?: string): Promise<ProfileStatsSummary> {
    const client = getSupabaseClient();
    const { data, error } = await client.rpc('get_profile_stats', { p_user_id: userId ?? null });
    if (error) throw error;
    const row = data[0];
    if (!row) throw new Error('Profile statistics are unavailable');
    return {
      totalWatchSeconds: toNumber(row.total_watch_seconds),
      watchedTitles: toNumber(row.watched_titles),
      completedMovies: toNumber(row.completed_movies),
      completedSeriesEpisodes: toNumber(row.completed_series_episodes),
      completedAnimeEpisodes: toNumber(row.completed_anime_episodes),
      ratingsCount: toNumber(row.ratings_count),
      activeDays: toNumber(row.active_days),
      currentStreak: toNumber(row.current_streak),
      longestStreak: toNumber(row.longest_streak),
      achievementsUnlocked: toNumber(row.achievements_unlocked),
    };
  },

  async getDashboard(userId: string): Promise<ProfileStatsDashboard> {
    const client = getSupabaseClient();
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - 364);
    const [summary, activityResult, achievementsResult, unlockedResult, profileResult] =
      await Promise.all([
        this.getSummary(userId),
        client.from('daily_activity').select('activity_date, visit_count').eq('user_id', userId).gte('activity_date', start.toISOString().slice(0, 10)).order('activity_date'),
        client.from('achievements').select('*').order('sort_order'),
        client.from('profile_achievements').select('achievement_id, unlocked_at').eq('user_id', userId),
        client.from('profiles').select('featured_badge_id').eq('id', userId).single(),
      ]);
    if (activityResult.error) throw activityResult.error;
    if (achievementsResult.error) throw achievementsResult.error;
    if (unlockedResult.error) throw unlockedResult.error;
    if (profileResult.error) throw profileResult.error;
    const unlocked = new Map(unlockedResult.data.map((item) => [item.achievement_id, item.unlocked_at]));
    return {
      summary,
      activity: activityResult.data.map((item) => ({ date: item.activity_date, visits: item.visit_count })),
      achievements: achievementsResult.data.map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        description: item.description,
        icon: item.icon,
        thresholdDays: item.threshold_days,
        unlocked: unlocked.has(item.id),
        unlockedAt: unlocked.get(item.id) ?? null,
      })),
      featuredAchievementId: profileResult.data.featured_badge_id,
    };
  },

  async setFeatured(achievementId: string | null) {
    const client = getSupabaseClient();
    const { error } = await client.rpc('set_featured_achievement', { p_achievement_id: achievementId });
    if (error) throw error;
  },
};
