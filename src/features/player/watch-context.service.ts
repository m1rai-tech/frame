import { getSupabaseClient } from '@/services/supabase/client';

export type WatchEpisode = {
  id: string;
  episodeNumber: number;
  title: string;
  synopsis?: string;
  thumbnailPath?: string;
  introStart?: number;
  introEnd?: number;
  outroStart?: number;
};

export type WatchContext = {
  title: string;
  titleId?: string;
  titleSlug: string;
  seasonName: string;
  current: WatchEpisode;
  episodes: WatchEpisode[];
  next?: WatchEpisode;
};

const mapEpisode = (episode: {
  id: string;
  episode_number: number;
  title: string;
  synopsis: string | null;
  thumbnail_path: string | null;
  intro_start: number | null;
  intro_end: number | null;
  outro_start: number | null;
}): WatchEpisode => ({
  id: episode.id,
  episodeNumber: episode.episode_number,
  title: episode.title,
  synopsis: episode.synopsis ?? undefined,
  thumbnailPath: episode.thumbnail_path ?? undefined,
  introStart: episode.intro_start ?? undefined,
  introEnd: episode.intro_end ?? undefined,
  outroStart: episode.outro_start ?? undefined,
});

export const watchContextService = {
  async get(episodeId: string): Promise<WatchContext | undefined> {
    const client = getSupabaseClient();
    const { data: episode, error } = await client
      .from('episodes')
      .select(
        'id, season_id, episode_number, title, synopsis, thumbnail_path, intro_start, intro_end, outro_start',
      )
      .eq('id', episodeId)
      .eq('publication_status', 'published')
      .maybeSingle();
    if (error) throw error;
    if (!episode) return undefined;
    const { data: season, error: seasonError } = await client
      .from('seasons')
      .select('id, title_id, name')
      .eq('id', episode.season_id)
      .eq('publication_status', 'published')
      .maybeSingle();
    if (seasonError) throw seasonError;
    if (!season) return undefined;
    const [{ data: title, error: titleError }, { data: episodes, error: episodesError }] =
      await Promise.all([
        client
          .from('titles')
          .select('id, title, slug')
          .eq('id', season.title_id)
          .eq('publication_status', 'published')
          .maybeSingle(),
        client
          .from('episodes')
          .select(
            'id, episode_number, title, synopsis, thumbnail_path, intro_start, intro_end, outro_start',
          )
          .eq('season_id', season.id)
          .eq('publication_status', 'published')
          .order('episode_number'),
      ]);
    if (titleError) throw titleError;
    if (episodesError) throw episodesError;
    if (!title) return undefined;
    const mappedEpisodes = episodes.map(mapEpisode);
    const currentIndex = mappedEpisodes.findIndex((item) => item.id === episodeId);
    if (currentIndex < 0) return undefined;
    return {
      title: title.title,
      titleId: title.id,
      titleSlug: title.slug,
      seasonName: season.name,
      current: mappedEpisodes[currentIndex]!,
      episodes: mappedEpisodes,
      next: mappedEpisodes[currentIndex + 1],
    };
  },
};
