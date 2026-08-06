import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Content-Type': 'application/json',
};
const imageUrl = (path: unknown, size: 'w500' | 'w780' | 'w1280') =>
  typeof path === 'string' ? `https://image.tmdb.org/t/p/${size}${path}` : null;
const text = (value: unknown) => (typeof value === 'string' ? value : '');
const numericId = (value: unknown) => (typeof value === 'number' ? value : 0);
const records = (value: unknown) =>
  Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> => typeof item === 'object' && item !== null,
      )
    : [];

function normalizeListItem(item: Record<string, unknown>, kind: 'movie' | 'tv') {
  return {
    id: numericId(item.id),
    kind,
    title: text(kind === 'movie' ? item.title : item.name),
    originalTitle: text(kind === 'movie' ? item.original_title : item.original_name),
    overview: text(item.overview),
    releaseDate: text(kind === 'movie' ? item.release_date : item.first_air_date),
    posterUrl: imageUrl(item.poster_path, 'w500'),
  };
}

function normalizeDetails(data: Record<string, unknown>, kind: 'movie' | 'tv') {
  const genres = records(data.genres)
    .map((genre) => ({ tmdbId: numericId(genre.id), name: text(genre.name) }))
    .filter((genre) => genre.tmdbId > 0 && genre.name);
  const productionCountries = Array.isArray(data.production_countries)
    ? data.production_countries
        .map((country) =>
          typeof country === 'object' && country && 'iso_3166_1' in country
            ? text(country.iso_3166_1)
            : '',
        )
        .filter(Boolean)
    : [];
  const originCountries = Array.isArray(data.origin_country)
    ? data.origin_country.filter((country): country is string => typeof country === 'string')
    : [];
  const episodeRuntime = Array.isArray(data.episode_run_time)
    ? data.episode_run_time.find((runtime) => typeof runtime === 'number')
    : undefined;
  const videos =
    typeof data.videos === 'object' && data.videos && 'results' in data.videos
      ? (data.videos.results as unknown)
      : [];
  const trailer = Array.isArray(videos)
    ? videos.find(
        (video) =>
          typeof video === 'object' &&
          video &&
          'site' in video &&
          video.site === 'YouTube' &&
          'type' in video &&
          video.type === 'Trailer' &&
          'key' in video &&
          typeof video.key === 'string',
      )
    : undefined;
  const remoteStatus = text(data.status).toLowerCase();
  const creditSource =
    kind === 'tv' && typeof data.aggregate_credits === 'object' && data.aggregate_credits
      ? (data.aggregate_credits as Record<string, unknown>)
      : typeof data.credits === 'object' && data.credits
        ? (data.credits as Record<string, unknown>)
        : {};
  const cast = records(creditSource.cast)
    .slice(0, 100)
    .map((person, index) => {
      const roles = records(person.roles);
      return {
        tmdbId: numericId(person.id),
        name: text(person.name),
        photoUrl: imageUrl(person.profile_path, 'w500'),
        department: 'Acting',
        role: 'Actor',
        characterName: text(person.character) || text(roles[0]?.character),
        sortOrder: typeof person.order === 'number' ? person.order : index,
      };
    });
  const crew = records(creditSource.crew)
    .flatMap((person) => {
      const jobs = records(person.jobs);
      return jobs.length > 0
        ? jobs.map((job) => ({ ...person, department: job.department, job: job.job }))
        : [person];
    })
    .filter((person) =>
      ['Director', 'Writer', 'Screenplay', 'Creator', 'Executive Producer', 'Producer'].includes(
        text(person.job),
      ),
    )
    .slice(0, 100)
    .map((person, index) => ({
      tmdbId: numericId(person.id),
      name: text(person.name),
      photoUrl: imageUrl(person.profile_path, 'w500'),
      department: text(person.department) || 'Crew',
      role: text(person.job) || 'Crew',
      characterName: '',
      sortOrder: 1000 + index,
    }));
  const studios = [...records(data.production_companies), ...records(data.networks)]
    .map((studio) => ({ tmdbId: numericId(studio.id), name: text(studio.name) }))
    .filter((studio) => studio.tmdbId > 0 && studio.name)
    .filter(
      (studio, index, all) => all.findIndex((item) => item.tmdbId === studio.tmdbId) === index,
    );
  const ratingGroups =
    kind === 'tv'
      ? records(
          typeof data.content_ratings === 'object' && data.content_ratings
            ? (data.content_ratings as Record<string, unknown>).results
            : [],
        )
      : records(
          typeof data.release_dates === 'object' && data.release_dates
            ? (data.release_dates as Record<string, unknown>).results
            : [],
        );
  const preferredRating =
    ratingGroups.find((item) => item.iso_3166_1 === 'UA') ??
    ratingGroups.find((item) => item.iso_3166_1 === 'US');
  const ageRating =
    kind === 'tv'
      ? text(preferredRating?.rating)
      : text(
          records(preferredRating?.release_dates).find((item) => text(item.certification))
            ?.certification,
        );
  const status = remoteStatus.includes('cancel')
    ? 'cancelled'
    : remoteStatus.includes('return') || remoteStatus.includes('production')
      ? 'ongoing'
      : remoteStatus.includes('release') || remoteStatus.includes('ended')
        ? 'completed'
        : 'announced';

  return {
    tmdbId: numericId(data.id),
    kind,
    title: text(kind === 'movie' ? data.title : data.name),
    originalTitle: text(kind === 'movie' ? data.original_title : data.original_name),
    synopsis: text(data.overview),
    releaseDate: text(kind === 'movie' ? data.release_date : data.first_air_date),
    endDate: kind === 'tv' ? text(data.last_air_date) : '',
    runtimeMinutes:
      typeof data.runtime === 'number'
        ? data.runtime
        : typeof episodeRuntime === 'number'
          ? episodeRuntime
          : null,
    status,
    originalLanguage: text(data.original_language),
    countryCodes: productionCountries.length > 0 ? productionCountries : originCountries,
    posterUrl: imageUrl(data.poster_path, 'w500'),
    backdropUrl: imageUrl(data.backdrop_path, 'w1280'),
    trailerUrl:
      trailer && typeof trailer === 'object' && 'key' in trailer
        ? `https://www.youtube.com/watch?v=${String(trailer.key)}`
        : null,
    genres,
    studios,
    credits: [...cast, ...crew].filter((credit) => credit.tmdbId > 0 && credit.name),
    ageRating,
    suggestedType:
      kind === 'tv' && originCountries.includes('JP') && genres.some((genre) => genre.tmdbId === 16)
        ? 'anime'
        : kind === 'tv'
          ? 'series'
          : 'movie',
    seasons:
      kind === 'tv' && Array.isArray(data.seasons)
        ? data.seasons
            .filter(
              (season): season is Record<string, unknown> =>
                typeof season === 'object' && season !== null,
            )
            .map((season) => ({
              tmdbId: numericId(season.id),
              seasonNumber: numericId(season.season_number),
              name: text(season.name),
              episodeCount: numericId(season.episode_count),
            }))
        : [],
  };
}

function normalizeSeason(data: Record<string, unknown>) {
  return {
    tmdbId: numericId(data.id),
    seasonNumber: numericId(data.season_number),
    name: text(data.name),
    synopsis: text(data.overview),
    airDate: text(data.air_date),
    posterUrl: imageUrl(data.poster_path, 'w500'),
    episodes: Array.isArray(data.episodes)
      ? data.episodes
          .filter(
            (episode): episode is Record<string, unknown> =>
              typeof episode === 'object' && episode !== null,
          )
          .map((episode) => ({
            tmdbId: numericId(episode.id),
            episodeNumber: numericId(episode.episode_number),
            title: text(episode.name),
            synopsis: text(episode.overview),
            airDate: text(episode.air_date),
            runtimeSeconds:
              typeof episode.runtime === 'number' ? Math.round(episode.runtime * 60) : null,
            thumbnailUrl: imageUrl(episode.still_path, 'w780'),
          }))
      : [],
  };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST')
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders });

  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization)
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const publishableKey = Deno.env.get('SUPABASE_ANON_KEY');
    const tmdbToken = Deno.env.get('TMDB_ACCESS_TOKEN');
    if (!supabaseUrl || !publishableKey || !tmdbToken)
      throw new Error('Server integration is not configured.');

    const supabase = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: authorization } },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
    if (!roles?.some(({ role }) => role === 'editor' || role === 'admin'))
      return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders });

    const body = (await request.json()) as {
      action?: 'search' | 'details' | 'season';
      kind?: 'movie' | 'tv';
      id?: number;
      query?: string;
      seasonNumber?: number;
    };
    if (body.kind !== 'movie' && body.kind !== 'tv')
      return Response.json({ error: 'Invalid kind' }, { status: 400, headers: corsHeaders });

    const action = body.action ?? 'details';
    const endpoint =
      action === 'search'
        ? `/search/${body.kind}?query=${encodeURIComponent(body.query?.trim() ?? '')}&include_adult=false&language=uk-UA&page=1`
        : action === 'season'
          ? `/tv/${body.id ?? 0}/season/${body.seasonNumber ?? -1}?language=uk-UA`
          : `/${body.kind}/${body.id ?? 0}?language=uk-UA&append_to_response=${
              body.kind === 'tv'
                ? 'videos,aggregate_credits,content_ratings'
                : 'videos,credits,release_dates'
            }`;
    if (
      (action === 'search' && !body.query?.trim()) ||
      (action === 'details' && !body.id) ||
      (action === 'season' && (!body.id || body.kind !== 'tv' || body.seasonNumber === undefined))
    )
      return Response.json({ error: 'Invalid request' }, { status: 400, headers: corsHeaders });

    const response = await fetch(`https://api.themoviedb.org/3${endpoint}`, {
      headers: { Authorization: `Bearer ${tmdbToken}`, accept: 'application/json' },
    });
    if (!response.ok)
      return Response.json({ error: 'TMDB request failed' }, { status: 502, headers: corsHeaders });
    const data = (await response.json()) as Record<string, unknown>;

    if (action === 'search') {
      const results = Array.isArray(data.results)
        ? data.results
            .filter(
              (item): item is Record<string, unknown> => typeof item === 'object' && item !== null,
            )
            .slice(0, 12)
            .map((item) => normalizeListItem(item, body.kind!))
        : [];
      return Response.json(
        { source: 'tmdb', attributionRequired: true, results },
        { headers: corsHeaders },
      );
    }
    if (action === 'season') {
      return Response.json(
        { source: 'tmdb', attributionRequired: true, season: normalizeSeason(data) },
        { headers: corsHeaders },
      );
    }
    return Response.json(
      { source: 'tmdb', attributionRequired: true, preview: normalizeDetails(data, body.kind) },
      { headers: corsHeaders },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders },
    );
  }
});
