import { getSupabaseClient } from '@/services/supabase/client';

export type ContinueWatchingItem = {
  progressId: string;
  titleId: string;
  title: string;
  titleSlug: string;
  posterPath?: string;
  episodeId?: string;
  episodeTitle?: string;
  episodeNumber?: number;
  seasonName?: string;
  positionSeconds: number;
  durationSeconds?: number;
  progressPercent: number;
  lastWatchedAt: string;
};

export const toProgressPercent = (position: number, duration?: number | null) =>
  duration && duration > 0 ? Math.min(100, Math.max(0, Math.round((position / duration) * 100))) : 0;

export const continueWatchingService = {
  async list(limit = 12): Promise<ContinueWatchingItem[]> {
    const client = getSupabaseClient();
    const { data: progress, error } = await client
      .from('watch_progress')
      .select(
        'id, title_id, episode_id, position_seconds, duration_seconds, last_watched_at',
      )
      .eq('completed', false)
      .is('hidden_at', null)
      .gt('position_seconds', 0)
      .order('last_watched_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    if (progress.length === 0) return [];

    const titleIds = [...new Set(progress.map((item) => item.title_id))];
    const episodeIds = [
      ...new Set(progress.flatMap((item) => (item.episode_id ? [item.episode_id] : []))),
    ];
    const [{ data: titles, error: titlesError }, episodeResult] = await Promise.all([
      client
        .from('titles')
        .select('id, title, slug, poster_path')
        .in('id', titleIds)
        .eq('publication_status', 'published'),
      episodeIds.length > 0
        ? client
            .from('episodes')
            .select('id, season_id, episode_number, title')
            .in('id', episodeIds)
            .eq('publication_status', 'published')
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (titlesError) throw titlesError;
    if (episodeResult.error) throw episodeResult.error;

    const episodes = episodeResult.data;
    const seasonIds = [...new Set(episodes.map((episode) => episode.season_id))];
    const { data: seasons, error: seasonsError } = seasonIds.length
      ? await client.from('seasons').select('id, name').in('id', seasonIds)
      : { data: [], error: null };
    if (seasonsError) throw seasonsError;

    const titleMap = new Map(titles.map((title) => [title.id, title]));
    const episodeMap = new Map(episodes.map((episode) => [episode.id, episode]));
    const seasonMap = new Map(seasons.map((season) => [season.id, season]));

    return progress.flatMap((item) => {
      const title = titleMap.get(item.title_id);
      const episode = item.episode_id ? episodeMap.get(item.episode_id) : undefined;
      if (!title || (item.episode_id && !episode)) return [];
      return [
        {
          progressId: item.id,
          titleId: title.id,
          title: title.title,
          titleSlug: title.slug,
          posterPath: title.poster_path ?? undefined,
          episodeId: episode?.id,
          episodeTitle: episode?.title,
          episodeNumber: episode?.episode_number,
          seasonName: episode ? seasonMap.get(episode.season_id)?.name : undefined,
          positionSeconds: item.position_seconds,
          durationSeconds: item.duration_seconds ?? undefined,
          progressPercent: toProgressPercent(item.position_seconds, item.duration_seconds),
          lastWatchedAt: item.last_watched_at,
        },
      ];
    });
  },

  async hide(progressId: string) {
    const { error } = await getSupabaseClient()
      .from('watch_progress')
      .update({ hidden_at: new Date().toISOString() })
      .eq('id', progressId);
    if (error) throw error;
  },
};
