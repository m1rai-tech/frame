import type { Database } from '@/services/supabase/database.types';
import { getSupabaseClient } from '@/services/supabase/client';
import { parseNewEpisodeContent, type NewEpisodeContent } from './notification-content';

type NotificationRow = Database['public']['Tables']['notifications']['Row'];
export type AppNotification = {
  id: string;
  type: 'new_episode';
  titleId?: string;
  episodeId?: string;
  content: NewEpisodeContent;
  readAt?: string;
  createdAt: string;
};

const normalize = (row: NotificationRow): AppNotification => ({
  id: row.id,
  type: row.type,
  titleId: row.title_id ?? undefined,
  episodeId: row.episode_id ?? undefined,
  content: parseNewEpisodeContent(row.payload),
  readAt: row.read_at ?? undefined,
  createdAt: row.created_at,
});

export const notificationsService = {
  async list(limit = 100): Promise<AppNotification[]> {
    const { data, error } = await getSupabaseClient()
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data.map(normalize);
  },

  async unreadCount() {
    const { count, error } = await getSupabaseClient()
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .is('read_at', null);
    if (error) throw error;
    return count ?? 0;
  },

  async markRead(id: string) {
    const { error } = await getSupabaseClient()
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .is('read_at', null);
    if (error) throw error;
  },

  async markAllRead() {
    const { error } = await getSupabaseClient()
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .is('read_at', null);
    if (error) throw error;
  },

  async remove(id: string) {
    const { error } = await getSupabaseClient().from('notifications').delete().eq('id', id);
    if (error) throw error;
  },
};
