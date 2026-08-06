import { getSupabaseClient } from '@/services/supabase/client';

export type Recommendation = {
  id: string;
  slug: string;
  title: string;
  posterPath?: string;
  releaseYear?: string;
  score: number;
  reason: string;
};

export const recommendationsService = {
  async list(limit = 12): Promise<Recommendation[]> {
    const client = getSupabaseClient();
    const { data: ranked, error } = await client.rpc('get_personalized_recommendations', {
      result_limit: limit,
    });
    if (error) throw error;
    if (!ranked.length) return [];
    const { data: titles, error: titlesError } = await client
      .from('titles')
      .select('id, slug, title, poster_path, release_date')
      .in('id', ranked.map((item) => item.title_id));
    if (titlesError) throw titlesError;
    const titleMap = new Map(titles.map((title) => [title.id, title]));
    return ranked.flatMap((item) => {
      const title = titleMap.get(item.title_id);
      return title ? [{
        id: title.id,
        slug: title.slug,
        title: title.title,
        posterPath: title.poster_path ?? undefined,
        releaseYear: title.release_date?.slice(0, 4),
        score: Number(item.recommendation_score),
        reason: item.recommendation_reason,
      }] : [];
    });
  },
};
