import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Edit3, ExternalLink, LibraryBig, Plus, Tags } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { z } from 'zod';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { catalogAdminService } from '@/features/admin/catalog-admin.service';

const schema = z.object({
  title: z.string().trim().min(2, 'Мінімум 2 символи'),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Латиниця, цифри та дефіси'),
  type: z.enum(['movie', 'series', 'anime']),
});
type Values = z.infer<typeof schema>;

const typeLabels = { movie: 'Фільм', series: 'Серіал', anime: 'Аніме' } as const;
const publicationLabels = {
  draft: 'Чернетка',
  scheduled: 'Заплановано',
  published: 'Опубліковано',
  archived: 'В архіві',
} as const;

export function AdminTitlesRoute() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const titles = useQuery({
    queryKey: ['admin', 'titles'],
    queryFn: () => catalogAdminService.listTitles(),
  });
  const createTitle = useMutation({
    mutationFn: (values: Values) => catalogAdminService.createTitle(values),
    onSuccess: async ({ id }) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'titles'] });
      showToast({
        title: 'Чернетку створено',
        description: 'Заповніть метадані перед публікацією.',
      });
      void navigate(`/admin/titles/${id}`);
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { slug: '', title: '', type: 'movie' },
  });

  return (
    <AppShell>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-accent">Editor</p>
            <h1 className="mt-2 text-3xl font-semibold">Керування каталогом</h1>
            <p className="mt-3 max-w-2xl text-muted">
              Створюйте чернетки, заповнюйте метадані та публікуйте готові сторінки.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link to="/admin/genres">
                <Tags className="size-4" /> Жанри
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/admin/collections">
                <LibraryBig className="size-4" /> Колекції
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/admin/imports">
                <Download className="size-4" /> Імпорт із TMDB
              </Link>
            </Button>
          </div>
        </header>

        <section className="rounded-lg border border-border bg-surface-1 p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Plus className="size-5" /> Новий тайтл
          </h2>
          <form
            className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_10rem_auto] md:items-end"
            onSubmit={(event) =>
              void handleSubmit((values) => createTitle.mutateAsync(values))(event)
            }
          >
            <Input error={errors.title?.message} label="Назва" {...register('title')} />
            <Input error={errors.slug?.message} label="Slug" {...register('slug')} />
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Тип</span>
              <select
                className="h-11 rounded-md border border-border bg-surface-1 px-3"
                {...register('type')}
              >
                <option value="movie">Фільм</option>
                <option value="series">Серіал</option>
                <option value="anime">Аніме</option>
              </select>
            </label>
            <Button disabled={createTitle.isPending} type="submit">
              Створити
            </Button>
          </form>
          {createTitle.isError && (
            <p className="mt-3 text-sm text-danger">
              Не вдалося створити чернетку. Перевірте унікальність slug.
            </p>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Тайтли</h2>
            <span className="text-sm text-muted">{titles.data?.length ?? 0} записів</span>
          </div>
          {titles.isError ? (
            <div className="mt-4">
              <ErrorState
                description="Не вдалося завантажити тайтли."
                onRetry={() => void titles.refetch()}
              />
            </div>
          ) : titles.data?.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                description="Створіть першу чернетку у формі вище."
                title="Каталог поки порожній"
              />
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[48rem] text-left text-sm">
                <thead className="bg-surface-2 text-muted">
                  <tr>
                    <th className="p-3">Назва</th>
                    <th className="p-3">Тип</th>
                    <th className="p-3">Публікація</th>
                    <th className="p-3">Оновлено</th>
                    <th className="p-3 text-right">Дії</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {titles.data?.map((title) => (
                    <tr className="hover:bg-surface-2/50" key={title.id}>
                      <td className="p-3">
                        <p className="font-medium">{title.title}</p>
                        <p className="mt-1 text-xs text-muted">/{title.slug}</p>
                      </td>
                      <td className="p-3">{typeLabels[title.type]}</td>
                      <td className="p-3">
                        <span className="rounded-full border border-border px-2 py-1 text-xs">
                          {publicationLabels[title.publication_status]}
                        </span>
                      </td>
                      <td className="p-3 text-muted">
                        {new Date(title.updated_at).toLocaleDateString('uk-UA')}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          {title.publication_status === 'published' && (
                            <Button
                              asChild
                              aria-label="Відкрити публічну сторінку"
                              size="icon"
                              variant="ghost"
                            >
                              <Link target="_blank" to={`/title/${title.slug}`}>
                                <ExternalLink className="size-4" />
                              </Link>
                            </Button>
                          )}
                          <Button asChild size="sm" variant="secondary">
                            <Link to={`/admin/titles/${title.id}`}>
                              <Edit3 className="size-4" /> Редагувати
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
