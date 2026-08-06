import { getSupabaseClient } from '@/services/supabase/client';

export type ManualWatchScope = 'title' | 'season' | 'episode';
export type ManualWatchStatus = {
  completedEpisodeIds: Set<string>;
  movieCompleted: boolean;
};

export const isScopeWatched = (
  targetEpisodeIds: string[],
  completedEpisodeIds: Set<string>,
  movieCompleted = false,
) =>
  targetEpisodeIds.length > 0
    ? targetEpisodeIds.every((id) => completedEpisodeIds.has(id))
    : movieCompleted;

export const manualWatchStatusService = {
  async get(titleId: string): Promise<ManualWatchStatus> {
    const { data, error } = await getSupabaseClient()
      .from('watch_progress')
      .select('episode_id, completed')
      .eq('title_id', titleId)
      .eq('completed', true);
    if (error) throw error;
    return {
      completedEpisodeIds: new Set(
        data.flatMap((item) => (item.episode_id ? [item.episode_id] : [])),
      ),
      movieCompleted: data.some((item) => item.episode_id === null && item.completed),
    };
  },

  async set({
    scope,
    scopeId,
    titleId,
    watched,
  }: {
    scope: ManualWatchScope;
    scopeId?: string;
    titleId: string;
    watched: boolean;
  }) {
    const { error } = await getSupabaseClient().rpc('set_manual_watch_status', {
      p_title_id: titleId,
      p_scope: scope,
      p_scope_id: scopeId ?? null,
      p_watched: watched,
    });
    if (error) throw error;
  },
};
