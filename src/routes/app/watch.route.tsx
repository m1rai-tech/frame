import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, Info, ListVideo } from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { usePageMeta } from '@/app/use-page-meta';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { playbackService } from '@/features/player/playback.service';
import {
  useWatchProgress,
  watchProgressService,
} from '@/features/player/watch-progress.service';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  watchContextService,
  type WatchContext,
  type WatchEpisode,
} from '@/features/player/watch-context.service';

const HlsVideo = lazy(() =>
  import('@/features/player/HlsVideo').then((module) => ({ default: module.HlsVideo })),
);
const ExternalEmbedPlayer = lazy(() =>
  import('@/features/player/ExternalEmbedPlayer').then((module) => ({
    default: module.ExternalEmbedPlayer,
  })),
);

const demoEpisodes: WatchEpisode[] = [
  { id: 'demo-1', episodeNumber: 1, title: 'Open movie demo' },
  { id: 'demo-2', episodeNumber: 2, title: 'Перевірка наступного епізоду' },
  { id: 'demo-3', episodeNumber: 3, title: 'Перевірка drawer' },
];

function EpisodesList({
  currentId,
  episodes,
  isDemo,
}: {
  currentId: string;
  episodes: WatchEpisode[];
  isDemo: boolean;
}) {
  return (
    <div className="grid gap-2">
      {episodes.map((episode, index) => (
        <a
          aria-current={episode.id === currentId ? 'page' : undefined}
          className={`grid grid-cols-[2.5rem_1fr] gap-3 rounded-lg border p-3 text-left transition-colors ${
            episode.id === currentId
              ? 'border-accent bg-accent/10'
              : 'border-border hover:bg-surface-2'
          }`}
          href={isDemo ? `/watch/demo?part=${index + 1}` : `/watch/${episode.id}`}
          key={episode.id}
        >
          <span className="text-center text-muted">{episode.episodeNumber}</span>
          <span>
            <span className="font-medium">{episode.title}</span>
            {episode.synopsis && (
              <span className="mt-1 line-clamp-2 block text-sm text-muted">{episode.synopsis}</span>
            )}
          </span>
        </a>
      ))}
    </div>
  );
}

function EpisodesDrawer({ context, isDemo }: { context: WatchContext; isDemo: boolean }) {
  return (
    <Drawer
      title={`${context.seasonName} · Епізоди`}
      trigger={
        <Button
          className="border-white/15 bg-white/5 text-white hover:bg-white/10"
          variant="secondary"
        >
          <ListVideo className="size-4" /> Епізоди
        </Button>
      }
    >
      <div className="text-foreground">
        <EpisodesList currentId={context.current.id} episodes={context.episodes} isDemo={isDemo} />
      </div>
    </Drawer>
  );
}

export function WatchRoute() {
  const { episodeId = 'demo' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session: authSession } = useAuth();
  const [assetSelection, setAssetSelection] = useState<{
    episodeId: string;
    assetId: string;
  }>();
  const isDemo = episodeId === 'demo';
  const demoPart = Math.min(3, Math.max(1, Number(searchParams.get('part')) || 1));
  const demoCurrent = demoEpisodes[demoPart - 1]!;
  const demoContext: WatchContext = {
    title: 'Big Buck Bunny',
    titleSlug: '',
    seasonName: 'HLS demo',
    current: demoCurrent,
    episodes: demoEpisodes,
    next: demoEpisodes[demoPart],
  };
  const contextQuery = useQuery({
    queryKey: ['watch-context', episodeId],
    queryFn: () => watchContextService.get(episodeId),
    enabled: !isDemo,
  });
  const context = isDemo ? demoContext : contextQuery.data;
  const resumePosition = useQuery({
    queryKey: ['resume-position', episodeId],
    queryFn: () => watchProgressService.getResumePosition(episodeId),
    enabled: !isDemo,
    staleTime: 30_000,
  });
  const progress = useWatchProgress({
    accessToken: authSession?.access_token,
    episodeId: isDemo ? undefined : episodeId,
    titleId: isDemo ? undefined : context?.titleId,
  });
  const session = useQuery({
    queryKey: [
      'playback-session',
      episodeId,
      assetSelection?.episodeId === episodeId ? assetSelection.assetId : undefined,
    ],
    queryFn: () =>
      isDemo
        ? playbackService.issueDemoSession()
        : playbackService.issueEpisodeSession(
            episodeId,
            assetSelection?.episodeId === episodeId ? assetSelection.assetId : undefined,
          ),
    staleTime: 4 * 60 * 1000,
    retry: 1,
  });
  const expiresAt = session.data?.expiresAt;
  const refetchSession = session.refetch;
  useEffect(() => {
    if (!expiresAt) return;
    const refreshIn = Math.max(1000, new Date(expiresAt).getTime() - Date.now() - 30_000);
    const timer = window.setTimeout(() => void refetchSession(), refreshIn);
    return () => window.clearTimeout(timer);
  }, [expiresAt, refetchSession]);
  const goNext = context?.next
    ? () => {
        void navigate(
          isDemo
            ? `/watch/demo?part=${demoPart + 1}`
            : `/watch/${encodeURIComponent(context.next!.id)}`,
        );
      }
    : undefined;
  usePageMeta({
    title: context
      ? `${context.title} · ${context.current.title}`
      : isDemo
        ? 'Demo HLS-плеєр'
        : 'Перегляд',
    description: 'Захищена сторінка відеоплеєра Frame.',
    path: `/watch/${episodeId}`,
    robots: 'noindex,nofollow',
  });

  const player = session.isPending || (!isDemo && resumePosition.isPending) ? (
    <div className="grid aspect-video place-items-center rounded-xl bg-black text-white/65">
      Створення захищеної playback-сесії…
    </div>
  ) : session.isError ? (
    <div className="grid aspect-video place-items-center rounded-xl border border-red-400/30 bg-red-950/20 p-6 text-center">
      <div>
        <p className="font-semibold">Не вдалося отримати playback-сесію.</p>
        <button
          className="mt-4 text-[#e0a55d]"
          onClick={() => void session.refetch()}
          type="button"
        >
          Спробувати ще раз
        </button>
      </div>
    </div>
  ) : session.data?.playbackKind === 'embed' ? (
    <ExternalEmbedPlayer
      activeAssetId={session.data.assetId}
      onVariantChange={(assetId) => setAssetSelection({ episodeId, assetId })}
      source={session.data.source}
      variants={session.data.variants}
    />
  ) : session.data ? (
    <HlsVideo
      activeAssetId={session.data.assetId}
      initialPositionSeconds={resumePosition.data ?? 0}
      intro={
        isDemo
          ? { start: 5, end: 12 }
          : context?.current.introStart !== undefined && context.current.introEnd !== undefined
            ? { start: context.current.introStart, end: context.current.introEnd }
            : undefined
      }
      key={isDemo ? `demo-${demoPart}` : episodeId}
      onNext={goNext}
      onProgress={progress.onProgress}
      onVariantChange={(assetId) => setAssetSelection({ episodeId, assetId })}
      outroStart={isDemo ? 560 : context?.current.outroStart}
      poster={context?.current.thumbnailPath}
      source={session.data.source}
      variants={session.data.variants}
    />
  ) : null;

  return (
    <main className="min-h-dvh bg-[#08090a] text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <Link
          className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
          to={context?.titleSlug ? `/title/${context.titleSlug}` : '/browse'}
        >
          <ArrowLeft className="size-4" /> {context?.title ?? 'До каталогу'}
        </Link>
        {context && <EpisodesDrawer context={context} isDemo={isDemo} />}
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <Suspense
          fallback={
            <div className="grid aspect-video place-items-center rounded-xl bg-black text-white/65">
              Завантаження плеєра…
            </div>
          }
        >
          {player}
        </Suspense>
        {context && (
          <div className="mt-7 grid gap-6 md:grid-cols-[1fr_auto] md:items-start">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-[#c58331]">
                {context.seasonName} · Епізод {context.current.episodeNumber}
              </p>
              <h1 className="mt-2 text-3xl font-semibold">{context.current.title}</h1>
              <p className="mt-3 max-w-3xl leading-7 text-white/65">
                {isDemo
                  ? 'Тест adaptive HLS, перемикання епізодів та skip intro/outro. Demo-серії використовують один відкритий потік і не пов’язані з каталогом.'
                  : context.current.synopsis}
              </p>
              {context.next && (
                <Button className="mt-5" onClick={goNext} variant="secondary">
                  Наступний: {context.next.title}
                </Button>
              )}
            </div>
            {isDemo && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/65">
                <p className="flex items-center gap-2 font-medium text-white">
                  <Info className="size-4" /> Атрибуція
                </p>
                <p className="mt-2">© Blender Foundation · CC BY 3.0</p>
                <a
                  className="mt-3 inline-flex items-center gap-1 text-[#e0a55d]"
                  href="https://creativecommons.org/licenses/by/3.0/"
                  rel="noreferrer"
                  target="_blank"
                >
                  Умови ліцензії <ExternalLink className="size-3" />
                </a>
              </div>
            )}
          </div>
        )}
        {!isDemo && !contextQuery.isPending && !context && (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-8 text-center">
            <h1 className="text-2xl font-semibold">Епізод не знайдено</h1>
            <Link className="mt-6 inline-block text-[#e0a55d]" to="/watch/demo">
              Відкрити HLS demo
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
