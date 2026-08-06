import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Play } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { usePageMeta } from '@/app/use-page-meta';
import { ErrorState } from '@/components/feedback/ErrorState';
import { AppShell } from '@/components/layout/AppShell';
import { Poster } from '@/components/media/Poster';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { catalogService } from '@/features/catalog/catalog.service';
import { AddToListDialog } from '@/features/watch-progress/AddToListDialog';
import { TitleRating } from '@/features/ratings/TitleRating';
import { WatchStatusControls } from '@/features/watch-progress/WatchStatusControls';

export function TitleRoute() {
  const { slug = '' } = useParams();
  const [expandedCreditsFor, setExpandedCreditsFor] = useState<string>();
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>();
  const result = useQuery({
    queryKey: ['title', slug],
    queryFn: () => catalogService.getBySlug(slug),
  });
  const metaTitle = result.data?.title ?? 'Тайтл';
  usePageMeta({
    title: metaTitle,
    description: result.data?.shortSynopsis ?? 'Інформація про тайтл у каталозі Frame.',
    path: `/title/${slug}`,
    image: result.data?.backdropPath ?? result.data?.posterPath,
    type: result.data?.type === 'movie' ? 'video.movie' : 'video.tv_show',
  });
  if (result.isPending)
    return (
      <AppShell>
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[15rem_1fr]">
          <Skeleton className="aspect-[2/3]" />
          <div className="grid content-start gap-4">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-28" />
          </div>
        </div>
      </AppShell>
    );
  if (result.isError)
    return (
      <AppShell>
        <div className="mx-auto max-w-4xl px-4 py-16">
          <ErrorState
            description="Не вдалося завантажити інформацію про тайтл."
            onRetry={() => void result.refetch()}
          />
        </div>
      </AppShell>
    );
  const title = result.data;
  if (!title)
    return (
      <AppShell>
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <p className="text-accent">404</p>
          <h1 className="mt-2 text-3xl font-semibold">Тайтл не знайдено</h1>
          <Button asChild className="mt-6" variant="secondary">
            <Link to="/browse">До каталогу</Link>
          </Button>
        </div>
      </AppShell>
    );
  const year = title.releaseDate?.slice(0, 4);
  const defaultSeason =
    title.seasons.find((season) => season.seasonNumber === 1) ?? title.seasons[0];
  const selectedSeason =
    title.seasons.find((season) => season.id === selectedSeasonId) ?? defaultSeason;
  const firstEpisode = selectedSeason?.episodes[0];
  const mainCast = title.credits.filter((credit) => credit.department === 'Acting').slice(0, 8);
  const mainCrew = title.credits
    .filter(
      (credit) =>
        credit.department !== 'Acting' &&
        ['Director', 'Creator', 'Writer', 'Screenplay'].includes(credit.role),
    )
    .slice(0, 4);
  const mainCredits = [...mainCast, ...mainCrew].filter(
    (credit, index, credits) => credits.findIndex((item) => item.id === credit.id) === index,
  );
  const creditsExpanded = expandedCreditsFor === title.id;
  const visibleCredits = creditsExpanded ? title.credits : mainCredits;
  return (
    <AppShell>
      <article>
        <header className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,color-mix(in_srgb,var(--accent)_18%,transparent),transparent_40%),linear-gradient(to_bottom,var(--surface-2),var(--background))]" />
          <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[15rem_1fr] md:py-20">
            <Poster alt={title.title} src={title.posterPath} />
            <div className="self-end">
              <p className="text-sm uppercase tracking-[0.18em] text-accent">
                {title.type === 'movie' ? 'Фільм' : title.type === 'series' ? 'Серіал' : 'Аніме'}
              </p>
              <h1 className="mt-3 text-4xl font-semibold sm:text-6xl">{title.title}</h1>
              {title.originalTitle && <p className="mt-2 text-muted">{title.originalTitle}</p>}
              <div className="mt-5 flex flex-wrap gap-3 text-sm text-muted">
                <span>{year}</span>
                {title.runtimeMinutes && <span>{title.runtimeMinutes} хв</span>}
                {title.ageRating && <span>{title.ageRating}</span>}
                {title.genres.map((genre) => (
                  <span key={genre}>{genre}</span>
                ))}
              </div>
              {title.studios.length > 0 && (
                <p className="mt-3 text-sm text-muted">Студії: {title.studios.join(', ')}</p>
              )}
              <p className="mt-6 max-w-3xl text-lg leading-8 text-muted">{title.synopsis}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                {firstEpisode ? (
                  <Button asChild>
                    <Link to={`/watch/${firstEpisode.id}`}>
                      <Play className="size-4" />
                      Дивитися · S{selectedSeason.seasonNumber} E{firstEpisode.episodeNumber}
                    </Link>
                  </Button>
                ) : (
                  <Button disabled>
                    <Play className="size-4" /> Серії ще не опубліковані
                  </Button>
                )}
                <AddToListDialog titleId={title.id} />
                <WatchStatusControls
                  scope="title"
                  seasons={title.seasons}
                  titleId={title.id}
                />
              </div>
              <TitleRating titleId={title.id} />
            </div>
          </div>
        </header>
        {title.credits.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-12">
            <h2 className="text-2xl font-semibold">Актори та команда</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {visibleCredits.map((credit) => (
                <article
                  className="flex gap-3 rounded-lg border border-border bg-surface-1 p-3"
                  key={credit.id}
                >
                  {credit.photoPath ? (
                    <img
                      alt=""
                      className="size-14 shrink-0 rounded-full object-cover"
                      loading="lazy"
                      src={credit.photoPath}
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="grid size-14 shrink-0 place-items-center rounded-full bg-surface-2 text-lg font-semibold text-muted"
                    >
                      {credit.name.slice(0, 1)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="truncate font-medium">{credit.name}</h3>
                    <p className="mt-1 text-sm text-muted">{credit.characterName ?? credit.role}</p>
                    {credit.characterName && <p className="text-xs text-muted">{credit.role}</p>}
                  </div>
                </article>
              ))}
            </div>
            {title.credits.length > mainCredits.length && (
              <div className="mt-7 flex justify-center">
                <Button
                  aria-expanded={creditsExpanded}
                  onClick={() => setExpandedCreditsFor(creditsExpanded ? undefined : title.id)}
                  variant="secondary"
                >
                  {creditsExpanded ? (
                    <>
                      <ChevronUp className="size-4" /> Згорнути
                    </>
                  ) : (
                    <>
                      <ChevronDown className="size-4" /> Показати всіх ({title.credits.length})
                    </>
                  )}
                </Button>
              </div>
            )}
          </section>
        )}
        {title.seasons.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-accent">Сезони та серії</p>
                <h2 className="mt-2 text-2xl font-semibold">Епізоди</h2>
              </div>
              <label className="grid min-w-56 gap-2 text-sm">
                <span className="font-medium">Вибрати сезон</span>
                <select
                  className="h-11 rounded-md border border-border bg-surface-1 px-3"
                  onChange={(event) => setSelectedSeasonId(event.target.value)}
                  value={selectedSeason?.id ?? ''}
                >
                  {title.seasons.map((season) => (
                    <option key={season.id} value={season.id}>
                      {season.seasonNumber === 0 ? 'Спецвипуски' : `Сезон ${season.seasonNumber}`} ·{' '}
                      {season.episodes.length} серій
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {selectedSeason && (
              <div className="mt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">{selectedSeason.name}</h3>
                  <WatchStatusControls
                    scope="season"
                    scopeId={selectedSeason.id}
                    seasons={title.seasons}
                    titleId={title.id}
                  />
                </div>
                {selectedSeason.episodes.length === 0 ? (
                  <p className="mt-4 rounded-lg border border-border bg-surface-1 p-6 text-muted">
                    У цьому сезоні ще немає опублікованих серій.
                  </p>
                ) : (
                  <div className="mt-4 grid gap-3">
                    {selectedSeason.episodes.map((episode) => (
                      <article
                        className="grid overflow-hidden rounded-lg border border-border bg-surface-1 sm:grid-cols-[10rem_1fr_auto] sm:items-center"
                        key={episode.id}
                      >
                        {episode.thumbnailPath ? (
                          <img
                            alt=""
                            className="aspect-video size-full object-cover"
                            loading="lazy"
                            src={episode.thumbnailPath}
                          />
                        ) : (
                          <div className="grid aspect-video place-items-center bg-surface-2 text-muted">
                            E{episode.episodeNumber}
                          </div>
                        )}
                        <div className="min-w-0 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-accent">
                            Серія {episode.episodeNumber}
                          </p>
                          <h4 className="mt-1 font-semibold">{episode.title}</h4>
                          {episode.synopsis && (
                            <p className="mt-2 line-clamp-2 text-sm text-muted">
                              {episode.synopsis}
                            </p>
                          )}
                          {episode.runtimeSeconds && (
                            <p className="mt-2 text-xs text-muted">
                              {Math.round(episode.runtimeSeconds / 60)} хв
                            </p>
                          )}
                        </div>
                        <div className="m-4 grid gap-2 sm:ml-0">
                          <Button asChild variant="secondary">
                            <Link to={`/watch/${episode.id}`}>
                              <Play className="size-4" /> Дивитися
                            </Link>
                          </Button>
                          <WatchStatusControls
                            scope="episode"
                            scopeId={episode.id}
                            seasons={title.seasons}
                            titleId={title.id}
                            variant="compact"
                          />
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </article>
    </AppShell>
  );
}
