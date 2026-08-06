import { getSupabaseClient } from '@/services/supabase/client';

export type HistoryStatusFilter = 'all' | 'in-progress' | 'completed';
export type HistoryTypeFilter = 'all' | 'movie' | 'series' | 'anime';

export type HistoryItem = {
  progressId: string;
  titleId: string;
  title: string;
  titleSlug: string;
  type: 'movie' | 'series' | 'anime';
  posterPath?: string;
  episodeId?: string;
  episodeTitle?: string;
  episodeNumber?: number;
  seasonName?: string;
  positionSeconds: number;
  durationSeconds?: number;
  completed: boolean;
  lastWatchedAt: string;
};

export type HistoryFilters = {
  query: string;
  status: HistoryStatusFilter;
  type: HistoryTypeFilter;
};

export const filterHistoryItems = (items: HistoryItem[], filters: HistoryFilters) => {
  const query = filters.query.trim().toLocaleLowerCase('uk');
  return items.filter(
    (item) =>
      (filters.status === 'all' ||
        (filters.status === 'completed' ? item.completed : !item.completed)) &&
      (filters.type === 'all' || item.type === filters.type) &&
      (!query ||
        `${item.title} ${item.episodeTitle ?? ''}`.toLocaleLowerCase('uk').includes(query)),
  );
};

const getUserId = async () => {
  const {
    data: { user },
    error,
  } = await getSupabaseClient().auth.getUser();
  if (error) throw error;
  if (!user) throw new Error('Authentication required');
  return user.id;
};

export const historyService = {
  async list(limit = 200): Promise<HistoryItem[]> {
    const client = getSupabaseClient();
    const { data: progress, error } = await client
      .from('watch_progress')
      .select(
        'id, title_id, episode_id, position_seconds, duration_seconds, completed, last_watched_at',
      )
      .order('last_watched_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    if (progress.length === 0) return [];

    const titleIds = [...new Set(progress.map((item) => item.title_id))];
    const episodeIds = [
      ...new Set(progress.flatMap((item) => (item.episode_id ? [item.episode_id] : []))),
    ];
    const [{ data: titles, error: titlesError }, episodeResponse] = await Promise.all([
      client
        .from('titles')
        .select('id, title, slug, type, poster_path')
        .in('id', titleIds),
      episodeIds.length
        ? client
            .from('episodes')
            .select('id, season_id, episode_number, title')
            .in('id', episodeIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (titlesError) throw titlesError;
    if (episodeResponse.error) throw episodeResponse.error;
    const episodes = episodeResponse.data;
    const seasonIds = [...new Set(episodes.map((episode) => episode.season_id))];
    const { data: seasons, error: seasonsError } = seasonIds.length
      ? await client.from('seasons').select('id, name').in('id', seasonIds)
      : { data: [], error: null };
    if (seasonsError) throw seasonsError;

    const titleMap = new Map(titles.map((title) => [title.id, title]));
    const episodeMap = new Map(episodes.map((episode) => [episode.id, episode]));
    const seasonMap = new Map(seasons.map((season) => [season.id, season.name]));
    return progress.flatMap((item) => {
      const title = titleMap.get(item.title_id);
      const episode = item.episode_id ? episodeMap.get(item.episode_id) : undefined;
      if (!title) return [];
      return [{
        progressId: item.id,
        titleId: item.title_id,
        title: title.title,
        titleSlug: title.slug,
        type: title.type,
        posterPath: title.poster_path ?? undefined,
        episodeId: episode?.id,
        episodeTitle: episode?.title,
        episodeNumber: episode?.episode_number,
        seasonName: episode ? seasonMap.get(episode.season_id) : undefined,
        positionSeconds: item.position_seconds,
        durationSeconds: item.duration_seconds ?? undefined,
        completed: item.completed,
        lastWatchedAt: item.last_watched_at,
      }];
    });
  },

  async remove(progressId: string) {
    const { error } = await getSupabaseClient()
      .from('watch_progress')
      .delete()
      .eq('id', progressId);
    if (error) throw error;
  },

  async clear() {
    const userId = await getUserId();
    const { error } = await getSupabaseClient()
      .from('watch_progress')
      .delete()
      .eq('user_id', userId);
    if (error) throw error;
  },
};
