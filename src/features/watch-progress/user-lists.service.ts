import { getSupabaseClient } from '@/services/supabase/client';

export type UserListSummary = {
  id: string;
  name: string;
  slug: string;
  kind: 'custom' | 'watchlist' | 'favorites';
  description?: string;
  isPublic: boolean;
  containsTitle: boolean;
};

export type UserListTitle = {
  id: string;
  slug: string;
  title: string;
  posterPath?: string;
  releaseYear?: string;
  type: 'movie' | 'series' | 'anime';
};

export type UserListDetails = Omit<UserListSummary, 'containsTitle'> & {
  items: UserListTitle[];
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

const ensureSystemLists = async () => {
  const { error } = await getSupabaseClient().rpc('ensure_system_user_lists');
  if (error) throw error;
};

export const normalizeListName = (name: string) => {
  const trimmed = name.trim().replaceAll(/\s+/g, ' ');
  if (!trimmed || trimmed.length > 80) throw new Error('Invalid list name');
  return trimmed;
};

export const userListsService = {
  async list(titleId?: string): Promise<UserListSummary[]> {
    await ensureSystemLists();
    const client = getSupabaseClient();
    const userId = await getUserId();
    const { data: lists, error } = await client
      .from('user_lists')
      .select('id, name, slug, kind, description, is_public')
      .eq('user_id', userId)
      .order('kind')
      .order('name');
    if (error) throw error;
    const listIds = lists.map((list) => list.id);
    const { data: memberships, error: membershipError } = titleId && listIds.length
      ? await client
          .from('user_list_items')
          .select('list_id')
          .in('list_id', listIds)
          .eq('title_id', titleId)
      : { data: [], error: null };
    if (membershipError) throw membershipError;
    const containingIds = new Set(memberships.map((item) => item.list_id));
    return lists.map((list) => ({
      id: list.id,
      name: list.name,
      slug: list.slug,
      kind: list.kind,
      description: list.description ?? undefined,
      isPublic: list.is_public,
      containsTitle: containingIds.has(list.id),
    }));
  },

  async listWithItems(): Promise<UserListDetails[]> {
    const lists = await this.list();
    if (lists.length === 0) return [];
    const client = getSupabaseClient();
    const { data: links, error } = await client
      .from('user_list_items')
      .select('list_id, title_id, added_at')
      .in('list_id', lists.map((list) => list.id))
      .order('added_at', { ascending: false });
    if (error) throw error;
    const titleIds = [...new Set(links.map((link) => link.title_id))];
    const { data: titles, error: titlesError } = titleIds.length
      ? await client
          .from('titles')
          .select('id, slug, title, poster_path, release_date, type')
          .in('id', titleIds)
          .eq('publication_status', 'published')
      : { data: [], error: null };
    if (titlesError) throw titlesError;
    const titleMap = new Map(titles.map((title) => [title.id, title]));
    return lists.map((list) => ({
      id: list.id,
      name: list.name,
      slug: list.slug,
      kind: list.kind,
      description: list.description,
      isPublic: list.isPublic,
      items: links.flatMap((link) => {
        if (link.list_id !== list.id) return [];
        const title = titleMap.get(link.title_id);
        return title
          ? [{
              id: title.id,
              slug: title.slug,
              title: title.title,
              posterPath: title.poster_path ?? undefined,
              releaseYear: title.release_date?.slice(0, 4),
              type: title.type,
            }]
          : [];
      }),
    }));
  },

  async toggle(listId: string, titleId: string, containsTitle: boolean) {
    const client = getSupabaseClient();
    const query = containsTitle
      ? client.from('user_list_items').delete().eq('list_id', listId).eq('title_id', titleId)
      : client.from('user_list_items').insert({ list_id: listId, title_id: titleId });
    const { error } = await query;
    if (error) throw error;
  },

  async create(name: string) {
    const trimmed = normalizeListName(name);
    const userId = await getUserId();
    const { error } = await getSupabaseClient().from('user_lists').insert({
      user_id: userId,
      name: trimmed,
      slug: `list-${crypto.randomUUID().slice(0, 12)}`,
      kind: 'custom',
    });
    if (error) throw error;
  },

  async remove(listId: string) {
    const { error } = await getSupabaseClient()
      .from('user_lists')
      .delete()
      .eq('id', listId)
      .eq('kind', 'custom');
    if (error) throw error;
  },
};
