import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Play, X } from 'lucide-react';
import { Link } from 'react-router';
import { Poster } from '@/components/media/Poster';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { continueWatchingService } from './continue-watching.service';

const formatPosition = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes} хв`;
};

export function ContinueWatchingRow() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const query = useQuery({
    queryKey: ['continue-watching'],
    queryFn: () => continueWatchingService.list(),
  });
  const hide = useMutation({
    mutationFn: (progressId: string) => continueWatchingService.hide(progressId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['continue-watching'] });
      showToast({ title: 'Приховано з продовження перегляду' });
    },
  });

  if (query.isPending)
    return (
      <section aria-label="Завантаження продовження перегляду" className="grid gap-4">
        <Skeleton className="h-7 w-56" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton className="aspect-[2/3] rounded-lg" key={index} />
          ))}
        </div>
      </section>
    );
  if (query.isError)
    return (
      <section className="rounded-xl border border-border bg-surface-1 p-6">
        <h2 className="text-xl font-semibold">Продовжити перегляд</h2>
        <p className="mt-2 text-sm text-muted">
          Прогрес поки недоступний. Перевірте, чи застосована міграція фази 9.
        </p>
        <Button className="mt-4" onClick={() => void query.refetch()} variant="secondary">
          Спробувати ще раз
        </Button>
      </section>
    );
  if (query.data.length === 0) return null;

  return (
    <section aria-labelledby="continue-watching-title">
      <h2 className="mb-4 text-xl font-semibold" id="continue-watching-title">
        Продовжити перегляд
      </h2>
      <div className="scrollbar-none grid auto-cols-[42%] grid-flow-col gap-4 overflow-x-auto pb-2 sm:auto-cols-[28%] lg:auto-cols-[18%]">
        {query.data.map((item) => (
          <article className="group min-w-0" key={item.progressId}>
            <div className="relative">
              <Link
                aria-label={`Продовжити ${item.title}`}
                to={item.episodeId ? `/watch/${item.episodeId}` : `/title/${item.titleSlug}`}
              >
                <Poster alt={item.title} src={item.posterPath} />
                <span className="absolute inset-0 grid place-items-center bg-black/0 transition-colors group-hover:bg-black/25">
                  <span className="grid size-12 place-items-center rounded-full bg-background/90 text-foreground opacity-0 shadow-card transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    <Play className="size-5 fill-current" />
                  </span>
                </span>
              </Link>
              <Button
                aria-label={`Приховати ${item.title}`}
                className="absolute right-2 top-2 bg-background/90 opacity-100 backdrop-blur-sm md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                disabled={hide.isPending}
                onClick={() => hide.mutate(item.progressId)}
                size="icon"
                variant="ghost"
              >
                <X className="size-4" />
              </Button>
              <div className="absolute inset-x-2 bottom-2 rounded bg-background/80 p-2 backdrop-blur-sm">
                <ProgressBar value={item.progressPercent} />
              </div>
            </div>
            <Link
              className="mt-3 block truncate font-medium hover:text-accent"
              to={`/title/${item.titleSlug}`}
            >
              {item.title}
            </Link>
            <p className="mt-1 truncate text-sm text-muted">
              {item.seasonName && item.episodeNumber
                ? `${item.seasonName} · Серія ${item.episodeNumber}`
                : 'Фільм'}{' '}
              · {formatPosition(item.positionSeconds)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
