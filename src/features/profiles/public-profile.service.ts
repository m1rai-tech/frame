import { getSupabaseClient } from '@/services/supabase/client';

export type ProfileSectionVisibility = {
  profileIsPublic: boolean;
  statsIsPublic: boolean;
  historyIsPublic: boolean;
  listsIsPublic: boolean;
};

export type PublicHistoryItem = {
  id: string;
  title: string;
  slug: string;
  type: 'movie' | 'series' | 'anime';
  posterPath?: string;
  completed: boolean;
  lastWatchedAt: string;
};

export type PublicList = {
  id: string;
  name: string;
  description?: string;
  titles: Array<{ id: string; title: string; slug: string; posterPath?: string }>;
};

export const publicProfileService = {
  async visibility(userId: string): Promise<ProfileSectionVisibility> {
    const { data, error } = await getSupabaseClient().rpc('get_profile_section_visibility', {
      p_user_id: userId,
    });
    if (error) throw error;
    const row = data[0];
    if (!row) throw new Error('Profile visibility is unavailable');
    return {
      profileIsPublic: row.profile_is_public,
      statsIsPublic: row.stats_is_public,
      historyIsPublic: row.history_is_public,
      listsIsPublic: row.lists_is_public,
    };
  },

  async history(userId: string, limit = 6): Promise<PublicHistoryItem[]> {
    const client = getSupabaseClient();
    const { data: progress, error } = await client
      .from('watch_progress')
      .select('id, title_id, completed, last_watched_at')
      .eq('user_id', userId)
      .order('last_watched_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    if (!progress.length) return [];
    const { data: titles, error: titlesError } = await client
      .from('titles')
      .select('id, title, slug, type, poster_path')
      .in('id', [...new Set(progress.map((item) => item.title_id))]);
    if (titlesError) throw titlesError;
    const titleMap = new Map(titles.map((title) => [title.id, title]));
    return progress.flatMap((item) => {
      const title = titleMap.get(item.title_id);
      return title ? [{
        id: item.id,
        title: title.title,
        slug: title.slug,
        type: title.type,
        posterPath: title.poster_path ?? undefined,
        completed: item.completed,
        lastWatchedAt: item.last_watched_at,
      }] : [];
    });
  },

  async lists(userId: string): Promise<PublicList[]> {
    const client = getSupabaseClient();
    const { data: lists, error } = await client
      .from('user_lists')
      .select('id, name, description')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    if (!lists.length) return [];
    const { data: links, error: linksError } = await client
      .from('user_list_items')
      .select('list_id, title_id, added_at')
      .in('list_id', lists.map((list) => list.id))
      .order('added_at', { ascending: false });
    if (linksError) throw linksError;
    const titleIds = [...new Set(links.map((link) => link.title_id))];
    const { data: titles, error: titlesError } = titleIds.length
      ? await client.from('titles').select('id, title, slug, poster_path').in('id', titleIds)
      : { data: [], error: null };
    if (titlesError) throw titlesError;
    const titleMap = new Map(titles.map((title) => [title.id, title]));
    return lists.map((list) => ({
      id: list.id,
      name: list.name,
      description: list.description ?? undefined,
      titles: links.flatMap((link) => {
        if (link.list_id !== list.id) return [];
        const title = titleMap.get(link.title_id);
        return title ? [{ id: title.id, title: title.title, slug: title.slug, posterPath: title.poster_path ?? undefined }] : [];
      }),
    }));
  },
};
