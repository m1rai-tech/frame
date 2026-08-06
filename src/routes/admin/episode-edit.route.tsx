import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { z } from 'zod';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { catalogAdminService, type EpisodeRow } from '@/features/admin/catalog-admin.service';
import { EpisodeVideoAssetManager } from '@/features/admin/EpisodeVideoAssetManager';

const optionalSeconds = z.number().int().min(0).optional();
const schema = z.object({
  episodeNumber: z.number().int().positive(),
  title: z.string().trim().min(2),
  synopsis: z.string().trim(),
  runtimeSeconds: z.number().int().positive().optional(),
  airDate: z.string(),
  thumbnailPath: z.union([z.literal(''), z.url()]),
  introStart: optionalSeconds,
  introEnd: optionalSeconds,
  recapStart: optionalSeconds,
  recapEnd: optionalSeconds,
  outroStart: optionalSeconds,
});
type Values = z.infer<typeof schema>;
const statusLabels = {
  draft: 'Чернетка',
  scheduled: 'Заплановано',
  published: 'Опубліковано',
  archived: 'В архіві',
} as const;
const optionalNumber = {
  setValueAs: (value: string) => (value === '' ? undefined : Number(value)),
};

export function AdminEpisodeEditRoute() {
  const { id } = useParams();
  const episode = useQuery({
    enabled: Boolean(id),
    queryKey: ['admin', 'episode', id],
    queryFn: () => catalogAdminService.getEpisode(id ?? ''),
  });
  if (!id) return <Navigate replace to="/admin/titles" />;
  if (episode.isPending)
    return (
      <AppShell>
        <div className="mx-auto max-w-5xl px-4 py-10 text-muted">Завантаження епізоду…</div>
      </AppShell>
    );
  if (!episode.data) return <Navigate replace to="/admin/titles" />;
  return <EpisodeEditor episode={episode.data} key={episode.data.updated_at} />;
}

function EpisodeEditor({ episode }: { episode: EpisodeRow }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { isDirty, errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      episodeNumber: episode.episode_number,
      title: episode.title,
      synopsis: episode.synopsis ?? '',
      runtimeSeconds: episode.runtime_seconds ?? undefined,
      airDate: episode.air_date ?? '',
      thumbnailPath: episode.thumbnail_path ?? '',
      introStart: episode.intro_start ?? undefined,
      introEnd: episode.intro_end ?? undefined,
      recapStart: episode.recap_start ?? undefined,
      recapEnd: episode.recap_end ?? undefined,
      outroStart: episode.outro_start ?? undefined,
    },
  });
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'episode', episode.id] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'episodes', episode.season_id] }),
      queryClient.invalidateQueries({ queryKey: ['catalog'] }),
    ]);
  };
  const save = useMutation({
    mutationFn: (values: Values) =>
      catalogAdminService.saveEpisode(episode.id, {
        episode_number: values.episodeNumber,
        title: values.title,
        synopsis: values.synopsis || null,
        runtime_seconds: values.runtimeSeconds ?? null,
        air_date: values.airDate || null,
        thumbnail_path: values.thumbnailPath || null,
        intro_start: values.introStart ?? null,
        intro_end: values.introEnd ?? null,
        recap_start: values.recapStart ?? null,
        recap_end: values.recapEnd ?? null,
        outro_start: values.outroStart ?? null,
      }),
    onSuccess: async () => {
      showToast({ title: 'Епізод збережено' });
      await refresh();
    },
  });
  const changeStatus = useMutation({
    mutationFn: (status: EpisodeRow['publication_status']) =>
      catalogAdminService.setEpisodePublicationStatus(episode.id, status),
    onSuccess: async (_, status) => {
      showToast({ title: statusLabels[status] });
      await refresh();
    },
  });
  const remove = useMutation({
    mutationFn: () => catalogAdminService.deleteEpisode(episode.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'episodes', episode.season_id] });
      showToast({ title: 'Епізод видалено' });
      void navigate(`/admin/seasons/${episode.season_id}`, { replace: true });
    },
  });
  const busy = save.isPending || changeStatus.isPending || remove.isPending;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Button asChild size="sm" variant="ghost">
          <Link to={`/admin/seasons/${episode.season_id}`}>
            <ArrowLeft className="size-4" /> До сезону
          </Link>
        </Button>
        <header className="mt-6">
          <p className="text-sm uppercase tracking-[0.2em] text-accent">Editor · Episode</p>
          <h1 className="mt-2 text-3xl font-semibold">{episode.title}</h1>
          <p className="mt-2 text-sm text-muted">{statusLabels[episode.publication_status]}</p>
        </header>

        <form
          className="mt-8 grid gap-5 rounded-lg border border-border bg-surface-1 p-5 sm:grid-cols-2 lg:grid-cols-3"
          onSubmit={(event) => void handleSubmit((values) => save.mutateAsync(values))(event)}
        >
          <Input
            error={errors.episodeNumber?.message}
            label="Номер епізоду"
            min="1"
            type="number"
            {...register('episodeNumber', { valueAsNumber: true })}
          />
          <Input className="lg:col-span-2" label="Назва" {...register('title')} />
          <Input label="Дата виходу" type="date" {...register('airDate')} />
          <Input
            error={errors.runtimeSeconds?.message}
            label="Тривалість, секунд"
            min="1"
            type="number"
            {...register('runtimeSeconds', optionalNumber)}
          />
          <Input
            className="lg:col-span-3"
            error={errors.thumbnailPath?.message}
            label="URL прев’ю"
            {...register('thumbnailPath')}
          />
          <label className="grid gap-2 text-sm sm:col-span-2 lg:col-span-3">
            <span className="font-medium">Опис</span>
            <textarea
              className="min-h-32 rounded-md border border-border bg-surface-1 p-3"
              {...register('synopsis')}
            />
          </label>

          <h2 className="text-lg font-semibold sm:col-span-2 lg:col-span-3">
            Таймкоди програвача, секунд
          </h2>
          <Input
            label="Intro: початок"
            min="0"
            type="number"
            {...register('introStart', optionalNumber)}
          />
          <Input
            label="Intro: кінець"
            min="0"
            type="number"
            {...register('introEnd', optionalNumber)}
          />
          <Input
            label="Outro: початок"
            min="0"
            type="number"
            {...register('outroStart', optionalNumber)}
          />
          <Input
            label="Recap: початок"
            min="0"
            type="number"
            {...register('recapStart', optionalNumber)}
          />
          <Input
            label="Recap: кінець"
            min="0"
            type="number"
            {...register('recapEnd', optionalNumber)}
          />

          {(save.isError || changeStatus.isError || remove.isError) && (
            <p className="text-sm text-danger sm:col-span-2 lg:col-span-3">
              Не вдалося виконати дію. Перевірте номер епізоду та значення полів.
            </p>
          )}
          <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-3">
            <Button disabled={busy || !isDirty} type="submit">
              <Save className="size-4" /> Зберегти
            </Button>
            <Button
              disabled={busy || isDirty}
              onClick={() =>
                changeStatus.mutate(
                  episode.publication_status === 'published' ? 'draft' : 'published',
                )
              }
              variant="secondary"
            >
              {episode.publication_status === 'published' ? 'У чернетки' : 'Опублікувати'}
            </Button>
            <Button
              disabled={busy || isDirty}
              onClick={() => changeStatus.mutate('archived')}
              variant="secondary"
            >
              В архів
            </Button>
            <div className="ml-auto">
              <Dialog
                description="Епізод буде видалено разом із пов’язаними відео та субтитрами."
                title="Видалити епізод?"
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
                  Так, видалити епізод
                </Button>
              </Dialog>
            </div>
          </div>
        </form>
        <EpisodeVideoAssetManager episodeId={episode.id} />
      </div>
    </AppShell>
  );
}
