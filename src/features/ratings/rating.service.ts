import { getSupabaseClient } from '@/services/supabase/client';

export const normalizeRating = (score: number) => {
  if (!Number.isInteger(score) || score < 1 || score > 10)
    throw new Error('Rating must be an integer from 1 to 10');
  return score;
};

export const ratingService = {
  async get(titleId: string, userId: string): Promise<number | null> {
    const { data, error } = await getSupabaseClient()
      .from('ratings')
      .select('score')
      .eq('title_id', titleId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data?.score ?? null;
  },

  async set(titleId: string, userId: string, score: number) {
    const { error } = await getSupabaseClient().from('ratings').upsert(
      { title_id: titleId, user_id: userId, score: normalizeRating(score) },
      { onConflict: 'user_id,title_id' },
    );
    if (error) throw error;
  },

  async remove(titleId: string, userId: string) {
    const { error } = await getSupabaseClient()
      .from('ratings')
      .delete()
      .eq('title_id', titleId)
      .eq('user_id', userId);
    if (error) throw error;
  },
};
