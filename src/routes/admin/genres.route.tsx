import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { z } from 'zod';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { catalogAdminService, type GenreRow } from '@/features/admin/catalog-admin.service';

const schema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});
type Values = z.infer<typeof schema>;

export function AdminGenresRoute() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const genres = useQuery({
    queryKey: ['admin', 'genres'],
    queryFn: () => catalogAdminService.listGenres(),
  });
  const create = useMutation({
    mutationFn: (values: Values) => catalogAdminService.createGenre(values.name, values.slug),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'genres'] });
      showToast({ title: 'Жанр створено' });
    },
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: '', slug: '' } });

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Button asChild size="sm" variant="ghost">
          <Link to="/admin/titles">
            <ArrowLeft className="size-4" /> До каталогу
          </Link>
        </Button>
        <header className="mt-6">
          <p className="text-sm uppercase tracking-[0.2em] text-accent">Editor</p>
          <h1 className="mt-2 text-3xl font-semibold">Жанри</h1>
          <p className="mt-3 text-muted">Жанри використовуються у фільтрах та зв’язках тайтлів.</p>
        </header>
        <form
          className="mt-8 grid gap-4 rounded-lg border border-border bg-surface-1 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          onSubmit={(event) =>
            void handleSubmit(async (values) => {
              await create.mutateAsync(values);
              reset();
            })(event)
          }
        >
          <Input error={errors.name?.message} label="Назва" {...register('name')} />
          <Input error={errors.slug?.message} label="Slug" {...register('slug')} />
          <Button disabled={create.isPending} type="submit">
            <Plus className="size-4" /> Додати
          </Button>
        </form>
        {create.isError && <p className="mt-3 text-sm text-danger">Жанр або slug уже існує.</p>}
        <div className="mt-8 grid gap-3">
          {genres.data?.map((genre) => (
            <GenreEditor genre={genre} key={genre.id} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function GenreEditor({ genre }: { genre: GenreRow }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: genre.name, slug: genre.slug },
  });
  const save = useMutation({
    mutationFn: (values: Values) => catalogAdminService.saveGenre(genre.id, values),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'genres'] }),
        queryClient.invalidateQueries({ queryKey: ['catalog'] }),
      ]);
      showToast({ title: 'Жанр оновлено' });
    },
  });
  const remove = useMutation({
    mutationFn: () => catalogAdminService.deleteGenre(genre.id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'genres'] }),
        queryClient.invalidateQueries({ queryKey: ['catalog'] }),
      ]);
      showToast({ title: 'Жанр видалено' });
    },
  });
  return (
    <form
      className="grid gap-3 rounded-md border border-border bg-surface-1 p-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end"
      onSubmit={(event) => void handleSubmit((values) => save.mutateAsync(values))(event)}
    >
      <Input label="Назва" {...register('name')} />
      <Input label="Slug" {...register('slug')} />
      <Button disabled={!isDirty || save.isPending} size="sm" type="submit" variant="secondary">
        <Save className="size-4" /> Зберегти
      </Button>
      <Dialog
        description="Зв’язки цього жанру з тайтлами буде видалено."
        title="Видалити жанр?"
        trigger={
          <Button variant="danger" size="sm">
            <Trash2 className="size-4" />
          </Button>
        }
      >
        <Button disabled={remove.isPending} onClick={() => remove.mutate()} variant="danger">
          Так, видалити
        </Button>
      </Dialog>
    </form>
  );
}
