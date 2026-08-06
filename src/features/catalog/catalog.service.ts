import { env } from '@/app/env';
import type {
  CatalogPage,
  CatalogSort,
  CatalogTitle,
  ContentType,
  TitleDetails,
} from '@/features/catalog/catalog.types';
import { demoTitles, getDemoDetails } from '@/features/catalog/demo-catalog';
import { getSupabaseClient, isSupabaseConfigured } from '@/services/supabase/client';

export type CatalogFilters = {
  type?: ContentType;
  query?: string;
  genre?: string;
  year?: number;
  status?: CatalogTitle['status'];
  ageRating?: string;
  language?: string;
  country?: string;
  sort?: CatalogSort;
  page?: number;
  pageSize?: number;
};
const shouldUseDemoCatalog = () =>
  import.meta.env.MODE === 'test' ||
  env.VITE_USE_DEMO_CATALOG === 'true' ||
  !isSupabaseConfigured();
const normalizeTitle = (
  row: Awaited<ReturnType<typeof fetchTitleRow>>,
): CatalogTitle | undefined =>
  row
    ? {
        id: row.id,
        slug: row.slug,
        type: row.type,
        title: row.title,
        originalTitle: row.original_title ?? undefined,
        synopsis: row.synopsis,
        shortSynopsis: row.short_synopsis ?? row.synopsis,
        releaseDate: row.release_date ?? undefined,
        runtimeMinutes: row.runtime_minutes ?? undefined,
        ageRating: row.age_rating ?? undefined,
        originalLanguage: row.original_language ?? undefined,
        countryCodes: row.country_codes,
        posterPath: row.poster_path ?? undefined,
        backdropPath: row.backdrop_path ?? undefined,
        status: row.status,
        genres: [],
      }
    : undefined;
async function fetchTitleRow(slug: string) {
  const { data, error } = await getSupabaseClient()
    .from('titles')
    .select('*')
    .eq('slug', slug)
    .eq('publication_status', 'published')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export const catalogService = {
  async listPage(filters: CatalogFilters = {}): Promise<CatalogPage> {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(48, Math.max(1, filters.pageSize ?? 12));
    if (shouldUseDemoCatalog()) {
      const filtered = demoTitles
        .filter(
          (item) =>
            (!filters.type || item.type === filters.type) &&
            (!filters.query ||
              `${item.title} ${item.originalTitle ?? ''} ${item.synopsis}`
                .toLowerCase()
                .includes(filters.query.toLowerCase())) &&
            (!filters.genre || item.genres.includes(filters.genre)) &&
            (!filters.year || item.releaseDate?.startsWith(String(filters.year))) &&
            (!filters.status || item.status === filters.status) &&
            (!filters.ageRating || item.ageRating === filters.ageRating) &&
            (!filters.language || item.originalLanguage === filters.language) &&
            (!filters.country || item.countryCodes.includes(filters.country)),
        )
        .sort((a, b) => {
          if (filters.sort === 'oldest')
            return (a.releaseDate ?? '').localeCompare(b.releaseDate ?? '');
          if (filters.sort === 'title-asc') return a.title.localeCompare(b.title, 'uk');
          if (filters.sort === 'title-desc') return b.title.localeCompare(a.title, 'uk');
          return (b.releaseDate ?? '').localeCompare(a.releaseDate ?? '');
        });
      const start = (page - 1) * pageSize;
      return {
        items: filtered.slice(start, start + pageSize),
        page,
        pageSize,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
      };
    }

    let titleIdsForGenre: string[] | undefined;
    if (filters.genre) {
      const { data: genre } = await getSupabaseClient()
        .from('genres')
        .select('id')
        .eq('slug', filters.genre)
        .maybeSingle();
      if (!genre) return { items: [], page, pageSize, total: 0, totalPages: 1 };
      const { data: links, error: linksError } = await getSupabaseClient()
        .from('title_genres')
        .select('title_id')
        .eq('genre_id', genre.id);
      if (linksError) throw linksError;
      titleIdsForGenre = links.map((link) => link.title_id);
      if (titleIdsForGenre.length === 0)
        return { items: [], page, pageSize, total: 0, totalPages: 1 };
    }

    let titleIdsForSearch: string[] | undefined;
    if (filters.query) {
      const safeQuery = filters.query.replaceAll(/[%_,()]/g, '').trim();
      if (safeQuery) {
        const { data: matches, error: searchError } = await getSupabaseClient().rpc(
          'search_catalog',
          {
            search_query: safeQuery,
            requested_type: filters.type ?? null,
            result_limit: 100,
            result_offset: 0,
          },
        );
        if (searchError) throw searchError;
        titleIdsForSearch = matches.map((match) => match.id);
        if (titleIdsForSearch.length === 0)
          return { items: [], page, pageSize, total: 0, totalPages: 1 };
      }
    }

    let query = getSupabaseClient()
      .from('titles')
      .select('*', { count: 'exact' })
      .eq('publication_status', 'published');
    if (filters.type) query = query.eq('type', filters.type);
    if (titleIdsForSearch) query = query.in('id', titleIdsForSearch);
    if (titleIdsForGenre) query = query.in('id', titleIdsForGenre);
    if (filters.year)
      query = query
        .gte('release_date', `${filters.year}-01-01`)
        .lte('release_date', `${filters.year}-12-31`);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.ageRating) query = query.eq('age_rating', filters.ageRating);
    if (filters.language) query = query.eq('original_language', filters.language);
    if (filters.country) query = query.contains('country_codes', [filters.country]);
    const ascending = filters.sort === 'oldest' || filters.sort === 'title-asc';
    const sortColumn = filters.sort?.startsWith('title') ? 'title' : 'release_date';
    query = query
      .order(sortColumn, { ascending, nullsFirst: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    const { data, error, count } = await query;
    if (error) throw error;
    const items = data
      .map((row) => normalizeTitle(row))
      .filter((item): item is CatalogTitle => Boolean(item));
    const titleIds = items.map((item) => item.id);
    if (titleIds.length > 0) {
      const { data: links, error: linksError } = await getSupabaseClient()
        .from('title_genres')
        .select('title_id, genre_id')
        .in('title_id', titleIds);
      if (linksError) throw linksError;
      const genreIds = [...new Set(links.map((link) => link.genre_id))];
      if (genreIds.length > 0) {
        const { data: genres, error: genresError } = await getSupabaseClient()
          .from('genres')
          .select('id, name')
          .in('id', genreIds);
        if (genresError) throw genresError;
        const genreNames = new Map(genres.map((genre) => [genre.id, genre.name]));
        const genresByTitle = new Map<string, string[]>();
        links.forEach((link) => {
          const name = genreNames.get(link.genre_id);
          if (name)
            genresByTitle.set(link.title_id, [...(genresByTitle.get(link.title_id) ?? []), name]);
        });
        items.forEach((item) => {
          item.genres = genresByTitle.get(item.id) ?? [];
        });
      }
    }
    const total = count ?? items.length;
    return { items, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  },
  async list(filters: CatalogFilters = {}): Promise<CatalogTitle[]> {
    return (await this.listPage({ ...filters, page: 1, pageSize: 48 })).items;
  },
  async listGenres(): Promise<Array<{ name: string; slug: string }>> {
    if (shouldUseDemoCatalog()) {
      const names = [...new Set(demoTitles.flatMap((item) => item.genres))];
      return names.sort((a, b) => a.localeCompare(b, 'uk')).map((name) => ({ name, slug: name }));
    }
    const { data, error } = await getSupabaseClient()
      .from('genres')
      .select('name, slug')
      .order('name');
    if (error) throw error;
    return data;
  },
  async getBySlug(slug: string): Promise<TitleDetails | undefined> {
    if (shouldUseDemoCatalog()) return getDemoDetails(slug);
    const row = await fetchTitleRow(slug);
    const title = normalizeTitle(row);
    if (!title) return undefined;
    const [seasonsResponse, creditsResponse, studioLinksResponse] = await Promise.all([
      getSupabaseClient()
        .from('seasons')
        .select('*')
        .eq('title_id', title.id)
        .eq('publication_status', 'published')
        .order('season_number'),
      getSupabaseClient()
        .from('title_credits')
        .select('*')
        .eq('title_id', title.id)
        .order('sort_order'),
      getSupabaseClient().from('title_studios').select('studio_id').eq('title_id', title.id),
    ]);
    if (seasonsResponse.error) throw seasonsResponse.error;
    if (creditsResponse.error) throw creditsResponse.error;
    if (studioLinksResponse.error) throw studioLinksResponse.error;
    const seasons = seasonsResponse.data;
    const result = await Promise.all(
      seasons.map(async (season) => {
        const { data: episodes, error } = await getSupabaseClient()
          .from('episodes')
          .select('*')
          .eq('season_id', season.id)
          .eq('publication_status', 'published')
          .order('episode_number');
        if (error) throw error;
        return {
          id: season.id,
          seasonNumber: season.season_number,
          name: season.name,
          episodes: episodes.map((episode) => ({
            id: episode.id,
            episodeNumber: episode.episode_number,
            title: episode.title,
            synopsis: episode.synopsis ?? undefined,
            runtimeSeconds: episode.runtime_seconds ?? undefined,
            thumbnailPath: episode.thumbnail_path ?? undefined,
          })),
        };
      }),
    );
    const personIds = [...new Set(creditsResponse.data.map((credit) => credit.person_id))];
    const studioIds = [...new Set(studioLinksResponse.data.map((link) => link.studio_id))];
    const [peopleResponse, studiosResponse] = await Promise.all([
      personIds.length > 0
        ? getSupabaseClient().from('people').select('id, name, photo_path').in('id', personIds)
        : Promise.resolve({ data: [], error: null }),
      studioIds.length > 0
        ? getSupabaseClient().from('studios').select('id, name').in('id', studioIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (peopleResponse.error) throw peopleResponse.error;
    if (studiosResponse.error) throw studiosResponse.error;
    const peopleById = new Map(peopleResponse.data.map((person) => [person.id, person]));
    const studiosById = new Map(studiosResponse.data.map((studio) => [studio.id, studio.name]));
    const credits = creditsResponse.data.flatMap((credit) => {
      const person = peopleById.get(credit.person_id);
      return person
        ? [
            {
              id: credit.id,
              name: person.name,
              photoPath: person.photo_path ?? undefined,
              department: credit.department,
              role: credit.role,
              characterName: credit.character_name ?? undefined,
            },
          ]
        : [];
    });
    const studios = studioLinksResponse.data.flatMap((link) => {
      const name = studiosById.get(link.studio_id);
      return name ? [name] : [];
    });
    return { ...title, seasons: result, credits, studios };
  },
};
