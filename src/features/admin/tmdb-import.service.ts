import type { ContentType } from '@/features/catalog/catalog.types';
import { getSupabaseClient } from '@/services/supabase/client';

export type TmdbKind = 'movie' | 'tv';
export type TmdbSearchResult = {
  id: number;
  kind: TmdbKind;
  title: string;
  originalTitle: string;
  overview: string;
  releaseDate: string;
  posterUrl: string | null;
};
export type TmdbPreview = {
  tmdbId: number;
  kind: TmdbKind;
  title: string;
  originalTitle: string;
  synopsis: string;
  releaseDate: string;
  endDate: string;
  runtimeMinutes: number | null;
  status: 'announced' | 'ongoing' | 'completed' | 'cancelled';
  originalLanguage: string;
  countryCodes: string[];
  posterUrl: string | null;
  backdropUrl: string | null;
  trailerUrl: string | null;
  genres: Array<{ tmdbId: number; name: string }>;
  studios: Array<{ tmdbId: number; name: string }>;
  credits: Array<{
    tmdbId: number;
    name: string;
    photoUrl: string | null;
    department: string;
    role: string;
    characterName: string;
    sortOrder: number;
  }>;
  ageRating: string;
  suggestedType: ContentType;
  seasons: TmdbSeasonSummary[];
};
export type TmdbSeasonSummary = {
  tmdbId: number;
  seasonNumber: number;
  name: string;
  episodeCount: number;
};
export type TmdbSeason = {
  tmdbId: number;
  seasonNumber: number;
  name: string;
  synopsis: string;
  airDate: string;
  posterUrl: string | null;
  episodes: Array<{
    tmdbId: number;
    episodeNumber: number;
    title: string;
    synopsis: string;
    airDate: string;
    runtimeSeconds: number | null;
    thumbnailUrl: string | null;
  }>;
};

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  const client = getSupabaseClient();
  const {
    data: { session },
  } = await client.auth.getSession();
  if (!session) throw new Error('Сесія завершилась. Увійдіть в акаунт ще раз.');
  const response = (await client.functions.invoke('import-catalog', {
    body,
    headers: { Authorization: `Bearer ${session.access_token}` },
  })) as {
    data: unknown;
    error: { message: string; context?: unknown } | null;
  };
  if (response.error) {
    let message = response.error.message;
    if (response.error.context instanceof Response) {
      try {
        const details = (await response.error.context.json()) as {
          error?: string;
          message?: string;
        };
        message = details.error || details.message || message;
      } catch {
        // Keep the SDK error when the response has no JSON body.
      }
    }
    throw new Error(message);
  }
  return response.data as T;
}

export const tmdbImportService = {
  async search(query: string, kind: TmdbKind) {
    const data = await invoke<{ results: TmdbSearchResult[] }>({ action: 'search', query, kind });
    return data.results;
  },

  async details(id: number, kind: TmdbKind) {
    const data = await invoke<{ preview: TmdbPreview }>({ action: 'details', id, kind });
    return data.preview;
  },

  async season(seriesId: number, seasonNumber: number) {
    const data = await invoke<{ season: TmdbSeason }>({
      action: 'season',
      id: seriesId,
      kind: 'tv',
      seasonNumber,
    });
    return data.season;
  },

  async createDraft(preview: TmdbPreview, slug: string, type: ContentType) {
    const client = getSupabaseClient();
    const { data: title, error } = await client
      .from('titles')
      .insert({
        title: preview.title,
        original_title: preview.originalTitle || null,
        slug,
        type,
        synopsis: preview.synopsis,
        short_synopsis: preview.synopsis.slice(0, 240) || null,
        release_date: preview.releaseDate || null,
        end_date: preview.endDate || null,
        runtime_minutes: preview.runtimeMinutes,
        status: preview.status,
        original_language: preview.originalLanguage || null,
        country_codes: preview.countryCodes,
        poster_path: preview.posterUrl,
        backdrop_path: preview.backdropUrl,
        trailer_url: preview.trailerUrl,
        age_rating: preview.ageRating || null,
        tmdb_id: preview.tmdbId,
        metadata_source: 'tmdb',
        publication_status: 'draft',
      })
      .select('id')
      .single();
    if (error) throw error;

    if (preview.genres.length > 0) {
      const { error: upsertGenresError } = await client.from('genres').upsert(
        preview.genres.map((genre) => ({
          name: genre.name,
          slug: `tmdb-genre-${genre.tmdbId}`,
        })),
        { onConflict: 'name', ignoreDuplicates: true },
      );
      if (upsertGenresError) throw upsertGenresError;
      const { data: genres, error: genresError } = await client
        .from('genres')
        .select('id')
        .in(
          'name',
          preview.genres.map((genre) => genre.name),
        );
      if (genresError) throw genresError;
      if (genres.length > 0) {
        const { error: linksError } = await client
          .from('title_genres')
          .insert(genres.map((genre) => ({ title_id: title.id, genre_id: genre.id })));
        if (linksError) throw linksError;
      }
    }
    if (preview.studios.length > 0) {
      const { error: upsertStudiosError } = await client.from('studios').upsert(
        preview.studios.map((studio) => ({
          name: studio.name,
          slug: `tmdb-studio-${studio.tmdbId}`,
        })),
        { onConflict: 'name', ignoreDuplicates: true },
      );
      if (upsertStudiosError) throw upsertStudiosError;
      const { data: studios, error: studiosError } = await client
        .from('studios')
        .select('id')
        .in(
          'name',
          preview.studios.map((studio) => studio.name),
        );
      if (studiosError) throw studiosError;
      if (studios.length > 0) {
        const { error: studioLinksError } = await client
          .from('title_studios')
          .insert(studios.map((studio) => ({ title_id: title.id, studio_id: studio.id })));
        if (studioLinksError) throw studioLinksError;
      }
    }
    if (preview.credits.length > 0) {
      const uniquePeople = preview.credits.filter(
        (person, index, all) =>
          all.findIndex((candidate) => candidate.tmdbId === person.tmdbId) === index,
      );
      const { data: people, error: peopleError } = await client
        .from('people')
        .upsert(
          uniquePeople.map((person) => ({
            tmdb_id: person.tmdbId,
            name: person.name,
            slug: `tmdb-person-${person.tmdbId}`,
            photo_path: person.photoUrl,
          })),
          { onConflict: 'tmdb_id' },
        )
        .select('id, tmdb_id');
      if (peopleError) throw peopleError;
      const peopleByTmdbId = new Map(people.map((person) => [person.tmdb_id, person.id]));
      const { error: creditsError } = await client.from('title_credits').insert(
        preview.credits.flatMap((credit) => {
          const personId = peopleByTmdbId.get(credit.tmdbId);
          return personId
            ? [
                {
                  title_id: title.id,
                  person_id: personId,
                  department: credit.department,
                  role: credit.role,
                  character_name: credit.characterName || null,
                  sort_order: credit.sortOrder,
                },
              ]
            : [];
        }),
      );
      if (creditsError) throw creditsError;
    }
    let importedSeasons = 0;
    let importedEpisodes = 0;
    if (preview.kind === 'tv') {
      for (const summary of preview.seasons) {
        const season = await this.season(preview.tmdbId, summary.seasonNumber);
        const { data: savedSeason, error: seasonError } = await client
          .from('seasons')
          .upsert(
            {
              title_id: title.id,
              season_number: season.seasonNumber,
              name: season.name || `Season ${season.seasonNumber}`,
              synopsis: season.synopsis || null,
              poster_path: season.posterUrl,
              air_date: season.airDate || null,
              tmdb_id: season.tmdbId || null,
              publication_status: 'draft',
            },
            { onConflict: 'title_id,season_number' },
          )
          .select('id')
          .single();
        if (seasonError) throw seasonError;
        importedSeasons += 1;
        if (season.episodes.length > 0) {
          const { error: episodesError } = await client.from('episodes').upsert(
            season.episodes.map((episode) => ({
              season_id: savedSeason.id,
              episode_number: episode.episodeNumber,
              title: episode.title || `Episode ${episode.episodeNumber}`,
              synopsis: episode.synopsis || null,
              runtime_seconds: episode.runtimeSeconds,
              air_date: episode.airDate || null,
              thumbnail_path: episode.thumbnailUrl,
              tmdb_id: episode.tmdbId || null,
              publication_status: 'draft' as const,
            })),
            { onConflict: 'season_id,episode_number' },
          );
          if (episodesError) throw episodesError;
          importedEpisodes += season.episodes.length;
        }
      }
    }
    return { ...title, importedSeasons, importedEpisodes };
  },
};

export function createImportSlug(title: string, tmdbId: number) {
  const slug = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70);
  return slug || `tmdb-${tmdbId}`;
}
