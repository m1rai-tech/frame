import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Archive, Eye, ListChecks, Save, Send, Trash2 } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { z } from 'zod';
import { ErrorState } from '@/components/feedback/ErrorState';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { CatalogImageUpload } from '@/features/admin/CatalogImageUpload';
import { TitleSeasonsManager } from '@/features/admin/TitleSeasonsManager';
import { TitleCreditsManager } from '@/features/admin/TitleCreditsManager';
import {
  catalogAdminService,
  type AdminTitleDetails,
} from '@/features/admin/catalog-admin.service';
import type { Database } from '@/services/supabase/database.types';

const optionalUrl = z.union([z.literal(''), z.url('Вкажіть повну URL-адресу')]);
const schema = z.object({
  title: z.string().trim().min(2, 'Мінімум 2 символи'),
  originalTitle: z.string().trim(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Латиниця, цифри та дефіси'),
  type: z.enum(['movie', 'series', 'anime']),
  synopsis: z.string().trim().min(20, 'Додайте опис від 20 символів'),
  shortSynopsis: z.string().trim().max(240, 'Максимум 240 символів'),
  releaseDate: z.string(),
  endDate: z.string(),
  status: z.enum(['announced', 'ongoing', 'completed', 'cancelled']),
  runtimeMinutes: z.number().int().positive('Тривалість має бути більшою за нуль').optional(),
  ageRating: z.string().trim(),
  posterPath: optionalUrl,
  backdropPath: optionalUrl,
  trailerUrl: optionalUrl,
  originalLanguage: z.string().trim().max(10),
  countryCodes: z.string().trim(),
  genreIds: z.array(z.string()),
});
type Values = z.infer<typeof schema>;
type PublicationStatus = Database['public']['Enums']['publication_status'];

const publicationLabels: Record<PublicationStatus, string> = {
  draft: 'Чернетка',
  scheduled: 'Заплановано',
  published: 'Опубліковано',
  archived: 'В архіві',
};

export function AdminTitleEditRoute() {
  const { id } = useParams();
  const title = useQuery({
    enabled: Boolean(id),
    queryKey: ['admin', 'title', id],
    queryFn: () => catalogAdminService.getTitle(id ?? ''),
  });
  const genres = useQuery({
    queryKey: ['admin', 'genres'],
    queryFn: () => catalogAdminService.listGenres(),
  });

  if (!id) return <Navigate replace to="/admin/titles" />;
  if (title.isError)
    return (
      <AppShell>
        <ErrorState
          description="Не вдалося завантажити тайтл."
          onRetry={() => void title.refetch()}
        />
      </AppShell>
    );
  if (title.isPending || genres.isPending)
    return (
      <AppShell>
        <div className="mx-auto max-w-6xl px-4 py-10 text-muted">Завантаження редактора…</div>
      </AppShell>
    );
  if (!title.data) return <Navigate replace to="/admin/titles" />;
  return <TitleEditor genres={genres.data ?? []} key={title.data.updated_at} title={title.data} />;
}

function TitleEditor({
  genres,
  title,
}: {
  genres: Array<{ id: string; name: string }>;
  title: AdminTitleDetails;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: title.title,
      originalTitle: title.original_title ?? '',
      slug: title.slug,
      type: title.type,
      synopsis: title.synopsis,
      shortSynopsis: title.short_synopsis ?? '',
      releaseDate: title.release_date ?? '',
      endDate: title.end_date ?? '',
      status: title.status,
      runtimeMinutes: title.runtime_minutes ?? undefined,
      ageRating: title.age_rating ?? '',
      posterPath: title.poster_path ?? '',
      backdropPath: title.backdrop_path ?? '',
      trailerUrl: title.trailer_url ?? '',
      originalLanguage: title.original_language ?? '',
      countryCodes: title.country_codes.join(', '),
      genreIds: title.genreIds,
    },
  });
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'title', title.id] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'titles'] }),
      queryClient.invalidateQueries({ queryKey: ['catalog'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'seasons', title.id] }),
    ]);
  };
  const save = useMutation({
    mutationFn: (values: Values) =>
      catalogAdminService.saveTitle(title.id, {
        title: values.title,
        original_title: values.originalTitle || null,
        slug: values.slug,
        type: values.type,
        synopsis: values.synopsis,
        short_synopsis: values.shortSynopsis || null,
        release_date: values.releaseDate || null,
        end_date: values.endDate || null,
        status: values.status,
        runtime_minutes: values.runtimeMinutes ?? null,
        age_rating: values.ageRating || null,
        poster_path: values.posterPath || null,
        backdrop_path: values.backdropPath || null,
        trailer_url: values.trailerUrl || null,
        original_language: values.originalLanguage || null,
        country_codes: values.countryCodes
          .split(',')
          .map((code) => code.trim().toUpperCase())
          .filter(Boolean),
        genreIds: values.genreIds,
      }),
    onSuccess: async () => {
      showToast({ title: 'Зміни збережено' });
      await refresh();
    },
  });
  const changePublication = useMutation({
    mutationFn: (status: PublicationStatus) =>
      catalogAdminService.setPublicationStatus(title.id, status),
    onSuccess: async (_, status) => {
      showToast({ title: publicationLabels[status] });
      await refresh();
    },
  });
  const publishStructure = useMutation({
    mutationFn: () => catalogAdminService.publishTitleStructure(title.id),
    onSuccess: async () => {
      showToast({ title: 'Усі сезони та серії опубліковано' });
      await refresh();
    },
  });
  const remove = useMutation({
    mutationFn: () => catalogAdminService.deleteTitle(title.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'titles'] });
      showToast({ title: 'Тайтл видалено' });
      void navigate('/admin/titles', { replace: true });
    },
  });
  const busy =
    save.isPending || changePublication.isPending || publishStructure.isPending || remove.isPending;
  const canPublish = title.synopsis.trim().length >= 20 && Boolean(title.release_date);
  const posterPath = useWatch({ control, name: 'posterPath' });
  const backdropPath = useWatch({ control, name: 'backdropPath' });

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Button asChild size="sm" variant="ghost">
              <Link to="/admin/titles">
                <ArrowLeft className="size-4" /> До каталогу
              </Link>
            </Button>
            <p className="mt-5 text-sm uppercase tracking-[0.2em] text-accent">Editor</p>
            <h1 className="mt-2 text-3xl font-semibold">{title.title}</h1>
            <p className="mt-2 text-sm text-muted">
              Статус: {publicationLabels[title.publication_status]}
            </p>
          </div>
          {title.publication_status === 'published' && (
            <Button asChild variant="secondary">
              <Link target="_blank" to={`/title/${title.slug}`}>
                <Eye className="size-4" /> Відкрити сторінку
              </Link>
            </Button>
          )}
        </header>

        <form
          className="mt-8 grid gap-6"
          onSubmit={(event) => void handleSubmit((values) => save.mutateAsync(values))(event)}
        >
          <section className="grid gap-5 rounded-lg border border-border bg-surface-1 p-5 md:grid-cols-2">
            <h2 className="md:col-span-2 text-xl font-semibold">Основна інформація</h2>
            <Input error={errors.title?.message} label="Назва" {...register('title')} />
            <Input label="Оригінальна назва" {...register('originalTitle')} />
            <Input error={errors.slug?.message} label="Slug" {...register('slug')} />
            <SelectField label="Тип" register={register('type')}>
              <option value="movie">Фільм</option>
              <option value="series">Серіал</option>
              <option value="anime">Аніме</option>
            </SelectField>
            <TextArea
              className="md:col-span-2"
              error={errors.shortSynopsis?.message}
              label="Короткий опис"
              rows={3}
              {...register('shortSynopsis')}
            />
            <TextArea
              className="md:col-span-2"
              error={errors.synopsis?.message}
              label="Повний опис"
              rows={7}
              {...register('synopsis')}
            />
          </section>

          <section className="grid gap-5 rounded-lg border border-border bg-surface-1 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <h2 className="sm:col-span-2 lg:col-span-4 text-xl font-semibold">Випуск</h2>
            <Input label="Дата виходу" type="date" {...register('releaseDate')} />
            <Input label="Дата завершення" type="date" {...register('endDate')} />
            <SelectField label="Статус контенту" register={register('status')}>
              <option value="announced">Анонсовано</option>
              <option value="ongoing">Виходить</option>
              <option value="completed">Завершено</option>
              <option value="cancelled">Скасовано</option>
            </SelectField>
            <Input
              error={errors.runtimeMinutes?.message}
              label="Тривалість, хв"
              min="1"
              type="number"
              {...register('runtimeMinutes', {
                setValueAs: (value: string) => (value === '' ? undefined : Number(value)),
              })}
            />
            <Input label="Віковий рейтинг" placeholder="16+" {...register('ageRating')} />
            <Input label="Мова оригіналу" placeholder="uk" {...register('originalLanguage')} />
            <Input
              className="sm:col-span-2"
              hint="ISO-коди через кому, наприклад UA, JP"
              label="Країни"
              {...register('countryCodes')}
            />
          </section>

          <section className="rounded-lg border border-border bg-surface-1 p-5">
            <h2 className="text-xl font-semibold">Жанри</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {genres.map((genre) => (
                <label
                  className="flex cursor-pointer items-center gap-2 rounded-full border border-border px-3 py-2 text-sm has-[:checked]:border-accent has-[:checked]:bg-surface-2"
                  key={genre.id}
                >
                  <input
                    className="accent-[var(--accent)]"
                    type="checkbox"
                    value={genre.id}
                    {...register('genreIds')}
                  />
                  {genre.name}
                </label>
              ))}
            </div>
          </section>

          <section className="grid gap-5 rounded-lg border border-border bg-surface-1 p-5 md:grid-cols-2">
            <h2 className="md:col-span-2 text-xl font-semibold">Медіа</h2>
            <CatalogImageUpload
              currentUrl={posterPath}
              kind="poster"
              onUploaded={(url) => setValue('posterPath', url, { shouldDirty: true })}
              titleId={title.id}
            />
            <CatalogImageUpload
              currentUrl={backdropPath}
              kind="backdrop"
              onUploaded={(url) => setValue('backdropPath', url, { shouldDirty: true })}
              titleId={title.id}
            />
            <Input
              error={errors.posterPath?.message}
              hint="Можна також вставити зовнішній HTTPS URL."
              label="URL постера"
              {...register('posterPath')}
            />
            <Input
              error={errors.backdropPath?.message}
              hint="Після upload URL підставляється автоматично."
              label="URL обкладинки"
              {...register('backdropPath')}
            />
            <Input
              className="md:col-span-2"
              error={errors.trailerUrl?.message}
              label="URL трейлера"
              {...register('trailerUrl')}
            />
          </section>

          {title.type !== 'movie' && <TitleSeasonsManager titleId={title.id} />}

          <TitleCreditsManager titleId={title.id} />

          {(save.isError ||
            changePublication.isError ||
            publishStructure.isError ||
            remove.isError) && (
            <p className="rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
              Не вдалося виконати дію. Перевірте дані та права editor/admin.
            </p>
          )}
          <div className="sticky bottom-20 z-10 flex flex-wrap gap-3 rounded-lg border border-border bg-surface-1/95 p-4 shadow-card backdrop-blur md:bottom-4">
            <Button disabled={busy || !isDirty} type="submit">
              <Save className="size-4" /> Зберегти
            </Button>
            {title.publication_status !== 'published' ? (
              <Button
                disabled={busy || isDirty || !canPublish}
                onClick={() => changePublication.mutate('published')}
                variant="secondary"
              >
                <Send className="size-4" /> Опублікувати
              </Button>
            ) : (
              <Button
                disabled={busy || isDirty}
                onClick={() => changePublication.mutate('draft')}
                variant="secondary"
              >
                Повернути в чернетки
              </Button>
            )}
            <Button
              disabled={busy || isDirty}
              onClick={() => changePublication.mutate('archived')}
              variant="secondary"
            >
              <Archive className="size-4" /> В архів
            </Button>
            {title.type !== 'movie' && (
              <Button
                disabled={busy || isDirty}
                onClick={() => publishStructure.mutate()}
                variant="secondary"
              >
                <ListChecks className="size-4" /> Опублікувати всі сезони та серії
              </Button>
            )}
            <div className="ml-auto">
              <Dialog
                description="Буде видалено тайтл, його сезони, епізоди та зв’язки. Цю дію не можна скасувати."
                title="Видалити тайтл?"
                trigger={
                  <Button disabled={busy} variant="danger">
                    <Trash2 className="size-4" /> Видалити
                  </Button>
                }
              >
                <div className="flex justify-end">
                  <Button
                    disabled={remove.isPending}
                    onClick={() => remove.mutate()}
                    variant="danger"
                  >
                    Так, видалити
                  </Button>
                </div>
              </Dialog>
            </div>
          </div>
          {!canPublish && title.publication_status !== 'published' && (
            <p className="text-sm text-muted">
              Для публікації збережіть повний опис від 20 символів і дату виходу.
            </p>
          )}
        </form>
      </div>
    </AppShell>
  );
}

function SelectField({
  children,
  label,
  register,
}: {
  children: React.ReactNode;
  label: string;
  register: React.SelectHTMLAttributes<HTMLSelectElement>;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium">{label}</span>
      <select className="h-11 rounded-md border border-border bg-surface-1 px-3" {...register}>
        {children}
      </select>
    </label>
  );
}

function TextArea({
  className,
  error,
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: string;
  label: string;
}) {
  return (
    <label className={`grid gap-2 text-sm ${className ?? ''}`}>
      <span className="font-medium">{label}</span>
      <textarea
        aria-invalid={Boolean(error)}
        className="rounded-md border border-border bg-surface-1 px-3 py-2 aria-invalid:border-danger"
        {...props}
      />
      {error && <span className="text-danger">{error}</span>}
    </label>
  );
}
