import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit3, Plus, Save, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { z } from 'zod';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { catalogAdminService, type SeasonRow } from '@/features/admin/catalog-admin.service';

const seasonSchema = z.object({
  seasonNumber: z.number().int().min(0),
  name: z.string().trim().min(2),
  synopsis: z.string().trim(),
  posterPath: z.union([z.literal(''), z.url()]),
  airDate: z.string(),
});
const episodeSchema = z.object({
  episodeNumber: z.number().int().positive(),
  title: z.string().trim().min(2),
});
type SeasonValues = z.infer<typeof seasonSchema>;
type EpisodeValues = z.infer<typeof episodeSchema>;
const statusLabels = {
  draft: 'Чернетка',
  scheduled: 'Заплановано',
  published: 'Опубліковано',
  archived: 'В архіві',
} as const;

export function AdminSeasonEditRoute() {
  const { id } = useParams();
  const season = useQuery({
    enabled: Boolean(id),
    queryKey: ['admin', 'season', id],
    queryFn: () => catalogAdminService.getSeason(id ?? ''),
  });
  if (!id) return <Navigate replace to="/admin/titles" />;
  if (season.isPending)
    return (
      <AppShell>
        <div className="mx-auto max-w-5xl px-4 py-10 text-muted">Завантаження сезону…</div>
      </AppShell>
    );
  if (!season.data) return <Navigate replace to="/admin/titles" />;
  return <SeasonEditor key={season.data.updated_at} season={season.data} />;
}

function SeasonEditor({ season }: { season: SeasonRow }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const episodes = useQuery({
    queryKey: ['admin', 'episodes', season.id],
    queryFn: () => catalogAdminService.listEpisodes(season.id),
  });
  const seasonForm = useForm<SeasonValues>({
    resolver: zodResolver(seasonSchema),
    defaultValues: {
      seasonNumber: season.season_number,
      name: season.name,
      synopsis: season.synopsis ?? '',
      posterPath: season.poster_path ?? '',
      airDate: season.air_date ?? '',
    },
  });
  const episodeForm = useForm<EpisodeValues>({
    resolver: zodResolver(episodeSchema),
    defaultValues: {
      episodeNumber: (episodes.data?.at(-1)?.episode_number ?? 0) + 1,
      title: '',
    },
  });
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'season', season.id] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'seasons', season.title_id] }),
      queryClient.invalidateQueries({ queryKey: ['catalog'] }),
    ]);
  };
  const save = useMutation({
    mutationFn: (values: SeasonValues) =>
      catalogAdminService.saveSeason(season.id, {
        season_number: values.seasonNumber,
        name: values.name,
        synopsis: values.synopsis || null,
        poster_path: values.posterPath || null,
        air_date: values.airDate || null,
      }),
    onSuccess: async () => {
      showToast({ title: 'Сезон збережено' });
      await refresh();
    },
  });
  const changeStatus = useMutation({
    mutationFn: (status: SeasonRow['publication_status']) =>
      catalogAdminService.setSeasonPublicationStatus(season.id, status),
    onSuccess: async (_, status) => {
      showToast({ title: statusLabels[status] });
      await refresh();
    },
  });
  const createEpisode = useMutation({
    mutationFn: (values: EpisodeValues) =>
      catalogAdminService.createEpisode(season.id, values.episodeNumber, values.title),
    onSuccess: async ({ id }) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'episodes', season.id] });
      showToast({ title: 'Епізод створено як чернетку' });
      void navigate(`/admin/episodes/${id}`);
    },
  });
  const remove = useMutation({
    mutationFn: () => catalogAdminService.deleteSeason(season.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'seasons', season.title_id] });
      showToast({ title: 'Сезон видалено' });
      void navigate(`/admin/titles/${season.title_id}`, { replace: true });
    },
  });
  const busy = save.isPending || changeStatus.isPending || remove.isPending;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Button asChild size="sm" variant="ghost">
          <Link to={`/admin/titles/${season.title_id}`}>
            <ArrowLeft className="size-4" /> До тайтлу
          </Link>
        </Button>
        <header className="mt-6">
          <p className="text-sm uppercase tracking-[0.2em] text-accent">Editor · Season</p>
          <h1 className="mt-2 text-3xl font-semibold">{season.name}</h1>
          <p className="mt-2 text-sm text-muted">{statusLabels[season.publication_status]}</p>
        </header>

        <form
          className="mt-8 grid gap-5 rounded-lg border border-border bg-surface-1 p-5 sm:grid-cols-2"
          onSubmit={(event) =>
            void seasonForm.handleSubmit((values) => save.mutateAsync(values))(event)
          }
        >
          <Input
            label="Номер сезону"
            min="0"
            type="number"
            {...seasonForm.register('seasonNumber', { valueAsNumber: true })}
          />
          <Input label="Назва" {...seasonForm.register('name')} />
          <Input label="Дата виходу" type="date" {...seasonForm.register('airDate')} />
          <Input label="URL постера" {...seasonForm.register('posterPath')} />
          <label className="grid gap-2 text-sm sm:col-span-2">
            <span className="font-medium">Опис</span>
            <textarea
              className="min-h-28 rounded-md border border-border bg-surface-1 p-3"
              {...seasonForm.register('synopsis')}
            />
          </label>
          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <Button disabled={busy || !seasonForm.formState.isDirty} type="submit">
              <Save className="size-4" /> Зберегти
            </Button>
            <Button
              disabled={busy || seasonForm.formState.isDirty}
              onClick={() =>
                changeStatus.mutate(
                  season.publication_status === 'published' ? 'draft' : 'published',
                )
              }
              variant="secondary"
            >
              {season.publication_status === 'published' ? 'У чернетки' : 'Опублікувати'}
            </Button>
            <Button
              disabled={busy || seasonForm.formState.isDirty}
              onClick={() => changeStatus.mutate('archived')}
              variant="secondary"
            >
              В архів
            </Button>
            <div className="ml-auto">
              <Dialog
                description="Усі епізоди цього сезону також буде видалено."
                title="Видалити сезон?"
                trigger={
                  <Button disabled={busy} variant="danger">
                    <Trash2 className="size-4" /> Видалити
                  </Button>
                }
              >
                <Button
                  disabled={remove.isPending}
                  onClick={() => remove.mutate()}
                  variant="danger"
                >
                  Так, видалити сезон
                </Button>
              </Dialog>
            </div>
          </div>
        </form>

        <section className="mt-8 rounded-lg border border-border bg-surface-1 p-5">
          <h2 className="text-xl font-semibold">Епізоди</h2>
          <form
            className="mt-5 grid gap-4 sm:grid-cols-[9rem_1fr_auto] sm:items-end"
            onSubmit={(event) =>
              void episodeForm.handleSubmit((values) => createEpisode.mutateAsync(values))(event)
            }
          >
            <Input
              label="Номер"
              min="1"
              type="number"
              {...episodeForm.register('episodeNumber', { valueAsNumber: true })}
            />
            <Input label="Назва епізоду" {...episodeForm.register('title')} />
            <Button disabled={createEpisode.isPending} type="submit">
              <Plus className="size-4" /> Додати
            </Button>
          </form>
          {createEpisode.isError && (
            <p className="mt-3 text-sm text-danger">Не вдалося створити епізод.</p>
          )}
          <div className="mt-6 grid gap-3">
            {episodes.data?.length === 0 && (
              <p className="text-sm text-muted">Епізодів ще немає.</p>
            )}
            {episodes.data?.map((episode) => (
              <article
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-4"
                key={episode.id}
              >
                <div>
                  <p className="font-semibold">
                    {episode.episode_number}. {episode.title}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {statusLabels[episode.publication_status]}
                  </p>
                </div>
                <Button asChild size="sm" variant="secondary">
                  <Link to={`/admin/episodes/${episode.id}`}>
                    <Edit3 className="size-4" /> Редагувати
                  </Link>
                </Button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
