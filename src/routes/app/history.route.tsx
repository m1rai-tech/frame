import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { History, Play, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { Poster } from '@/components/media/Poster';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import {
  filterHistoryItems,
  historyService,
  type HistoryStatusFilter,
  type HistoryTypeFilter,
} from '@/features/watch-progress/history.service';

const typeName = { movie: 'Фільм', series: 'Серіал', anime: 'Аніме' } as const;
const formatDate = (date: string) =>
  new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(date),
  );

export function HistoryRoute() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<HistoryStatusFilter>('all');
  const [type, setType] = useState<HistoryTypeFilter>('all');
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const history = useQuery({ queryKey: ['watch-history'], queryFn: () => historyService.list() });
  const filtered = useMemo(
    () => filterHistoryItems(history.data ?? [], { query, status, type }),
    [history.data, query, status, type],
  );
  const remove = useMutation({
    mutationFn: (id: string) => historyService.remove(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['watch-history'] }),
        queryClient.invalidateQueries({ queryKey: ['continue-watching'] }),
        queryClient.invalidateQueries({ queryKey: ['manual-watch-status'] }),
      ]);
      showToast({ title: 'Запис видалено з історії' });
    },
  });
  const clear = useMutation({
    mutationFn: () => historyService.clear(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['watch-history'] }),
        queryClient.invalidateQueries({ queryKey: ['continue-watching'] }),
        queryClient.invalidateQueries({ queryKey: ['manual-watch-status'] }),
      ]);
      showToast({ title: 'Історію переглядів очищено' });
    },
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-accent">
              <History className="size-4" /> Активність
            </p>
            <h1 className="mt-2 text-4xl font-semibold">Історія переглядів</h1>
          </div>
          <Button
            disabled={!history.data?.length || clear.isPending}
            onClick={() => {
              if (window.confirm('Очистити всю історію переглядів? Цю дію не можна скасувати.'))
                clear.mutate();
            }}
            variant="danger"
          >
            <Trash2 className="size-4" /> Очистити історію
          </Button>
        </div>

        <div className="mt-8 grid gap-4 rounded-xl border border-border bg-surface-1 p-4 md:grid-cols-[1fr_13rem_13rem]">
          <Input
            label="Пошук в історії"
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Назва фільму або серії"
            value={query}
          />
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Стан</span>
            <select
              className="h-11 rounded-md border border-border bg-surface-1 px-3"
              onChange={(event) => setStatus(event.currentTarget.value as HistoryStatusFilter)}
              value={status}
            >
              <option value="all">Усі</option>
              <option value="in-progress">Не завершені</option>
              <option value="completed">Переглянуті</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Категорія</span>
            <select
              className="h-11 rounded-md border border-border bg-surface-1 px-3"
              onChange={(event) => setType(event.currentTarget.value as HistoryTypeFilter)}
              value={type}
            >
              <option value="all">Усі</option>
              <option value="movie">Фільми</option>
              <option value="series">Серіали</option>
              <option value="anime">Аніме</option>
            </select>
          </label>
        </div>

        {history.isPending ? (
          <div className="mt-8 grid gap-3">
            {Array.from({ length: 5 }, (_, index) => <Skeleton className="h-36" key={index} />)}
          </div>
        ) : history.isError ? (
          <section className="mt-8 rounded-xl border border-border bg-surface-1 p-8 text-center">
            <p className="font-semibold">Не вдалося завантажити історію.</p>
            <Button className="mt-4" onClick={() => void history.refetch()} variant="secondary">
              Спробувати ще раз
            </Button>
          </section>
        ) : filtered.length === 0 ? (
          <section className="mt-8 rounded-xl border border-dashed border-border p-10 text-center">
            <Search className="mx-auto size-7 text-muted" />
            <h2 className="mt-3 text-xl font-semibold">Записів не знайдено</h2>
            <p className="mt-2 text-muted">Перегляньте відео або змініть активні фільтри.</p>
          </section>
        ) : (
          <div className="mt-8 grid gap-3">
            {filtered.map((item) => {
              const percent = item.durationSeconds
                ? Math.min(100, Math.round((item.positionSeconds / item.durationSeconds) * 100))
                : item.completed ? 100 : 0;
              return (
                <article
                  className="grid gap-4 rounded-xl border border-border bg-surface-1 p-4 sm:grid-cols-[5rem_1fr_auto] sm:items-center"
                  key={item.progressId}
                >
                  <Link to={`/title/${item.titleSlug}`}>
                    <Poster alt={item.title} className="w-20" src={item.posterPath} />
                  </Link>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.15em] text-accent">
                      {typeName[item.type]} · {item.completed ? 'Переглянуто' : 'Не завершено'}
                    </p>
                    <Link className="mt-1 block truncate text-lg font-semibold hover:text-accent" to={`/title/${item.titleSlug}`}>
                      {item.title}
                    </Link>
                    {item.episodeId && (
                      <p className="mt-1 truncate text-sm text-muted">
                        {item.seasonName} · Серія {item.episodeNumber} · {item.episodeTitle}
                      </p>
                    )}
                    <div className="mt-3 max-w-xl"><ProgressBar value={percent} /></div>
                    <p className="mt-2 text-xs text-muted">{formatDate(item.lastWatchedAt)}</p>
                  </div>
                  <div className="flex gap-2 sm:grid">
                    {item.episodeId && !item.completed && (
                      <Button asChild size="sm">
                        <Link to={`/watch/${item.episodeId}`}><Play className="size-4" /> Продовжити</Link>
                      </Button>
                    )}
                    <Button
                      aria-label={`Видалити ${item.title} з історії`}
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(item.progressId)}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 className="size-4" /> Видалити
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
