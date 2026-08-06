create or replace function public.get_personalized_recommendations(result_limit integer default 12)
returns table (
  title_id uuid,
  recommendation_score numeric,
  recommendation_reason text
)
language sql
stable
security definer
set search_path = ''
as $$
  with viewer as (
    select auth.uid() as user_id
  ),
  favorite_genres as (
    select g.id
    from public.profiles p
    join public.genres g on g.slug = any(p.favorite_genre_slugs)
    join viewer v on v.user_id = p.id
  ),
  learned_genres as (
    select tg.genre_id, sum(greatest(r.score - 7, 1))::numeric as weight
    from public.ratings r
    join viewer v on v.user_id = r.user_id
    join public.title_genres tg on tg.title_id = r.title_id
    where r.score >= 8
    group by tg.genre_id
  ),
  global_ratings as (
    select r.title_id, avg(r.score)::numeric as average_score, count(*)::numeric as rating_count
    from public.ratings r
    group by r.title_id
  ),
  candidates as (
    select
      t.id,
      coalesce(sum(case when fg.id is not null then 4 else 0 end), 0)::numeric
        + coalesce(sum(lg.weight), 0)::numeric
        + coalesce(max(gr.average_score) * 0.25, 0)::numeric
        + least(coalesce(max(gr.rating_count), 0), 20) * 0.05
        + case when t.release_date >= current_date - interval '3 years' then 0.5 else 0 end
        as score,
      bool_or(fg.id is not null) as matches_favorite,
      bool_or(lg.genre_id is not null) as matches_learned
    from public.titles t
    left join public.title_genres tg on tg.title_id = t.id
    left join favorite_genres fg on fg.id = tg.genre_id
    left join learned_genres lg on lg.genre_id = tg.genre_id
    left join global_ratings gr on gr.title_id = t.id
    join viewer v on v.user_id is not null
    where t.publication_status = 'published'
      and not exists (
        select 1 from public.watch_progress wp
        where wp.user_id = v.user_id and wp.title_id = t.id
      )
      and not exists (
        select 1
        from public.user_list_items uli
        join public.user_lists ul on ul.id = uli.list_id
        where ul.user_id = v.user_id and uli.title_id = t.id
      )
    group by t.id
  )
  select
    c.id,
    round(c.score, 2),
    case
      when c.matches_favorite then 'У ваших улюблених жанрах'
      when c.matches_learned then 'Схоже на високо оцінені вами тайтли'
      else 'Популярне та нове у Frame'
    end
  from candidates c
  order by c.score desc, c.id
  limit least(greatest(result_limit, 1), 30);
$$;

revoke all on function public.get_personalized_recommendations(integer) from public;
grant execute on function public.get_personalized_recommendations(integer) to authenticated;

comment on function public.get_personalized_recommendations(integer) is
  'Ranks unseen published titles from favorite genres, high ratings, list signals, global ratings, and recency.';
