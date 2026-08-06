import type { Database } from '@/services/supabase/database.types';
import { getSupabaseClient } from '@/services/supabase/client';

type TitleRow = Database['public']['Tables']['titles']['Row'];
type TitleUpdate = Database['public']['Tables']['titles']['Update'];
export type SeasonRow = Database['public']['Tables']['seasons']['Row'];
export type EpisodeRow = Database['public']['Tables']['episodes']['Row'];
export type VideoAssetRow = Database['public']['Tables']['video_assets']['Row'];
export type GenreRow = Database['public']['Tables']['genres']['Row'];
export type CollectionRow = Database['public']['Tables']['collections']['Row'];

export type AdminTitleDetails = TitleRow & { genreIds: string[] };

export type SaveAdminTitle = Pick<
  TitleUpdate,
  | 'age_rating'
  | 'backdrop_path'
  | 'country_codes'
  | 'end_date'
  | 'original_language'
  | 'original_title'
  | 'poster_path'
  | 'release_date'
  | 'runtime_minutes'
  | 'short_synopsis'
  | 'slug'
  | 'status'
  | 'synopsis'
  | 'title'
  | 'trailer_url'
  | 'type'
> & { genreIds: string[] };

export const catalogAdminService = {
  async listTitles() {
    const { data, error } = await getSupabaseClient()
      .from('titles')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createTitle(values: { title: string; slug: string; type: TitleRow['type'] }) {
    const { data, error } = await getSupabaseClient()
      .from('titles')
      .insert({ ...values, synopsis: '', publication_status: 'draft' })
      .select('id')
      .single();
    if (error) throw error;
    return data;
  },

  async getTitle(id: string): Promise<AdminTitleDetails | undefined> {
    const [{ data: title, error }, { data: links, error: linksError }] = await Promise.all([
      getSupabaseClient().from('titles').select('*').eq('id', id).maybeSingle(),
      getSupabaseClient().from('title_genres').select('genre_id').eq('title_id', id),
    ]);
    if (error) throw error;
    if (linksError) throw linksError;
    return title ? { ...title, genreIds: links.map((link) => link.genre_id) } : undefined;
  },

  async listGenres() {
    const { data, error } = await getSupabaseClient().from('genres').select('*').order('name');
    if (error) throw error;
    return data;
  },

  async saveTitle(id: string, { genreIds, ...values }: SaveAdminTitle) {
    const { error } = await getSupabaseClient().from('titles').update(values).eq('id', id);
    if (error) throw error;

    const { error: deleteError } = await getSupabaseClient()
      .from('title_genres')
      .delete()
      .eq('title_id', id);
    if (deleteError) throw deleteError;
    if (genreIds.length > 0) {
      const { error: insertError } = await getSupabaseClient()
        .from('title_genres')
        .insert(genreIds.map((genreId) => ({ title_id: id, genre_id: genreId })));
      if (insertError) throw insertError;
    }
  },

  async setPublicationStatus(id: string, publicationStatus: TitleRow['publication_status']) {
    const { error } = await getSupabaseClient()
      .from('titles')
      .update({
        publication_status: publicationStatus,
        published_at: publicationStatus === 'published' ? new Date().toISOString() : null,
      })
      .eq('id', id);
    if (error) throw error;
  },

  async publishTitleStructure(titleId: string) {
    const client = getSupabaseClient();
    const { data: seasons, error: seasonsError } = await client
      .from('seasons')
      .select('id')
      .eq('title_id', titleId);
    if (seasonsError) throw seasonsError;
    const seasonIds = seasons.map((season) => season.id);
    if (seasonIds.length > 0) {
      const { error: episodesError } = await client
        .from('episodes')
        .update({ publication_status: 'published' })
        .in('season_id', seasonIds);
      if (episodesError) throw episodesError;
      const { error: publishSeasonsError } = await client
        .from('seasons')
        .update({ publication_status: 'published' })
        .eq('title_id', titleId);
      if (publishSeasonsError) throw publishSeasonsError;
    }
    await this.setPublicationStatus(titleId, 'published');
    return { episodesPublished: seasonIds.length > 0, seasonsPublished: seasonIds.length };
  },

  async deleteTitle(id: string) {
    const { error } = await getSupabaseClient().from('titles').delete().eq('id', id);
    if (error) throw error;
  },

  async listSeasons(titleId: string) {
    const { data, error } = await getSupabaseClient()
      .from('seasons')
      .select('*')
      .eq('title_id', titleId)
      .order('season_number');
    if (error) throw error;
    return data;
  },

  async createSeason(titleId: string, seasonNumber: number, name: string) {
    const { data, error } = await getSupabaseClient()
      .from('seasons')
      .insert({ title_id: titleId, season_number: seasonNumber, name, publication_status: 'draft' })
      .select('id')
      .single();
    if (error) throw error;
    return data;
  },

  async getSeason(id: string) {
    const { data, error } = await getSupabaseClient()
      .from('seasons')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ?? undefined;
  },

  async saveSeason(id: string, values: Database['public']['Tables']['seasons']['Update']) {
    const { error } = await getSupabaseClient().from('seasons').update(values).eq('id', id);
    if (error) throw error;
  },

  async setSeasonPublicationStatus(id: string, status: SeasonRow['publication_status']) {
    return this.saveSeason(id, { publication_status: status });
  },

  async deleteSeason(id: string) {
    const { error } = await getSupabaseClient().from('seasons').delete().eq('id', id);
    if (error) throw error;
  },

  async listEpisodes(seasonId: string) {
    const { data, error } = await getSupabaseClient()
      .from('episodes')
      .select('*')
      .eq('season_id', seasonId)
      .order('episode_number');
    if (error) throw error;
    return data;
  },

  async createEpisode(seasonId: string, episodeNumber: number, title: string) {
    const { data, error } = await getSupabaseClient()
      .from('episodes')
      .insert({
        season_id: seasonId,
        episode_number: episodeNumber,
        title,
        publication_status: 'draft',
      })
      .select('id')
      .single();
    if (error) throw error;
    return data;
  },

  async getEpisode(id: string) {
    const { data, error } = await getSupabaseClient()
      .from('episodes')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ?? undefined;
  },

  async saveEpisode(id: string, values: Database['public']['Tables']['episodes']['Update']) {
    const { error } = await getSupabaseClient().from('episodes').update(values).eq('id', id);
    if (error) throw error;
  },

  async setEpisodePublicationStatus(id: string, status: EpisodeRow['publication_status']) {
    return this.saveEpisode(id, { publication_status: status });
  },

  async deleteEpisode(id: string) {
    const { error } = await getSupabaseClient().from('episodes').delete().eq('id', id);
    if (error) throw error;
  },

  async listEpisodeVideoAssets(episodeId: string) {
    const { data, error } = await getSupabaseClient()
      .from('video_assets')
      .select('*')
      .eq('episode_id', episodeId)
      .order('audio_language')
      .order('created_at');
    if (error) throw error;
    return data;
  },

  async saveEpisodeVideoAsset(
    episodeId: string,
    assetId: string | undefined,
    values: {
      provider: 'direct_hls' | 'official_embed';
      sourceUrl: string;
      audioLanguage: string;
      versionLabel: string;
      requiresEntitlement: boolean;
    },
  ) {
    const payload = {
      episode_id: episodeId,
      title_id: null,
      provider: values.provider,
      provider_asset_id: values.sourceUrl,
      audio_language: values.audioLanguage,
      version_label: values.versionLabel || null,
      status: 'ready' as const,
      requires_entitlement: values.requiresEntitlement,
    };
    const query = assetId
      ? getSupabaseClient().from('video_assets').update(payload).eq('id', assetId)
      : getSupabaseClient().from('video_assets').insert(payload);
    const { error } = await query;
    if (error) throw error;
  },

  async deleteVideoAsset(id: string) {
    const { error } = await getSupabaseClient().from('video_assets').delete().eq('id', id);
    if (error) throw error;
  },

  async createGenre(name: string, slug: string) {
    const { error } = await getSupabaseClient().from('genres').insert({ name, slug });
    if (error) throw error;
  },

  async saveGenre(id: string, values: { name: string; slug: string }) {
    const { error } = await getSupabaseClient().from('genres').update(values).eq('id', id);
    if (error) throw error;
  },

  async deleteGenre(id: string) {
    const { error } = await getSupabaseClient().from('genres').delete().eq('id', id);
    if (error) throw error;
  },

  async listCollections() {
    const { data, error } = await getSupabaseClient()
      .from('collections')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createCollection(name: string, slug: string) {
    const { data, error } = await getSupabaseClient()
      .from('collections')
      .insert({ name, slug, publication_status: 'draft' })
      .select('id')
      .single();
    if (error) throw error;
    return data;
  },

  async getCollection(id: string) {
    const { data, error } = await getSupabaseClient()
      .from('collections')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ?? undefined;
  },

  async saveCollection(id: string, values: Database['public']['Tables']['collections']['Update']) {
    const { error } = await getSupabaseClient().from('collections').update(values).eq('id', id);
    if (error) throw error;
  },

  async deleteCollection(id: string) {
    const { error } = await getSupabaseClient().from('collections').delete().eq('id', id);
    if (error) throw error;
  },

  async listCollectionItems(collectionId: string) {
    const { data: links, error } = await getSupabaseClient()
      .from('collection_items')
      .select('*')
      .eq('collection_id', collectionId)
      .order('sort_order');
    if (error) throw error;
    const titleIds = links.map((link) => link.title_id);
    if (titleIds.length === 0) return [];
    const { data: titles, error: titlesError } = await getSupabaseClient()
      .from('titles')
      .select('id, title, type')
      .in('id', titleIds);
    if (titlesError) throw titlesError;
    const byId = new Map(titles.map((title) => [title.id, title]));
    return links.flatMap((link) => {
      const title = byId.get(link.title_id);
      return title ? [{ ...link, title }] : [];
    });
  },

  async addCollectionItem(collectionId: string, titleId: string, sortOrder: number) {
    const { error } = await getSupabaseClient()
      .from('collection_items')
      .insert({ collection_id: collectionId, title_id: titleId, sort_order: sortOrder });
    if (error) throw error;
  },

  async removeCollectionItem(collectionId: string, titleId: string) {
    const { error } = await getSupabaseClient()
      .from('collection_items')
      .delete()
      .eq('collection_id', collectionId)
      .eq('title_id', titleId);
    if (error) throw error;
  },

  async listPeople() {
    const { data, error } = await getSupabaseClient().from('people').select('*').order('name');
    if (error) throw error;
    return data;
  },

  async createPerson(name: string, slug: string) {
    const { data, error } = await getSupabaseClient()
      .from('people')
      .insert({ name, slug })
      .select('id')
      .single();
    if (error) throw error;
    return data;
  },

  async listTitleCredits(titleId: string) {
    const { data: credits, error } = await getSupabaseClient()
      .from('title_credits')
      .select('*')
      .eq('title_id', titleId)
      .order('sort_order');
    if (error) throw error;
    const personIds = credits.map((credit) => credit.person_id);
    if (personIds.length === 0) return [];
    const { data: people, error: peopleError } = await getSupabaseClient()
      .from('people')
      .select('*')
      .in('id', personIds);
    if (peopleError) throw peopleError;
    const peopleById = new Map(people.map((person) => [person.id, person]));
    return credits.flatMap((credit) => {
      const person = peopleById.get(credit.person_id);
      return person ? [{ ...credit, person }] : [];
    });
  },

  async addTitleCredit(values: Database['public']['Tables']['title_credits']['Insert']) {
    const { error } = await getSupabaseClient().from('title_credits').insert(values);
    if (error) throw error;
  },

  async removeTitleCredit(id: string) {
    const { error } = await getSupabaseClient().from('title_credits').delete().eq('id', id);
    if (error) throw error;
  },

  async listStudios() {
    const { data, error } = await getSupabaseClient().from('studios').select('*').order('name');
    if (error) throw error;
    return data;
  },

  async createStudio(name: string, slug: string) {
    const { data, error } = await getSupabaseClient()
      .from('studios')
      .insert({ name, slug })
      .select('id')
      .single();
    if (error) throw error;
    return data;
  },

  async listTitleStudios(titleId: string) {
    const { data: links, error } = await getSupabaseClient()
      .from('title_studios')
      .select('studio_id')
      .eq('title_id', titleId);
    if (error) throw error;
    const studioIds = links.map((link) => link.studio_id);
    if (studioIds.length === 0) return [];
    const { data, error: studiosError } = await getSupabaseClient()
      .from('studios')
      .select('*')
      .in('id', studioIds)
      .order('name');
    if (studiosError) throw studiosError;
    return data;
  },

  async addTitleStudio(titleId: string, studioId: string) {
    const { error } = await getSupabaseClient()
      .from('title_studios')
      .insert({ title_id: titleId, studio_id: studioId });
    if (error) throw error;
  },

  async removeTitleStudio(titleId: string, studioId: string) {
    const { error } = await getSupabaseClient()
      .from('title_studios')
      .delete()
      .eq('title_id', titleId)
      .eq('studio_id', studioId);
    if (error) throw error;
  },
};
