import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Save, Trash2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { z } from 'zod';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { catalogAdminService, type CollectionRow } from '@/features/admin/catalog-admin.service';

const schema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim(),
  coverPath: z.union([z.literal(''), z.url()]),
  isFeatured: z.boolean(),
});
type Values = z.infer<typeof schema>;
const statusLabels = {
  draft: 'Чернетка',
  scheduled: 'Заплановано',
  published: 'Опубліковано',
  archived: 'В архіві',
} as const;

export function AdminCollectionEditRoute() {
  const { id } = useParams();
  const collection = useQuery({
    enabled: Boolean(id),
    queryKey: ['admin', 'collection', id],
    queryFn: () => catalogAdminService.getCollection(id ?? ''),
  });
  if (!id) return <Navigate replace to="/admin/collections" />;
  if (collection.isPending)
    return (
      <AppShell>
        <div className="mx-auto max-w-5xl px-4 py-10 text-muted">Завантаження колекції…</div>
      </AppShell>
    );
  if (!collection.data) return <Navigate replace to="/admin/collections" />;
  return <CollectionEditor collection={collection.data} key={collection.data.updated_at} />;
}

function CollectionEditor({ collection }: { collection: CollectionRow }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const items = useQuery({
    queryKey: ['admin', 'collection-items', collection.id],
    queryFn: () => catalogAdminService.listCollectionItems(collection.id),
  });
  const titles = useQuery({
    queryKey: ['admin', 'titles'],
    queryFn: () => catalogAdminService.listTitles(),
  });
  const {
    register,
    handleSubmit,
    formState: { isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: collection.name,
      slug: collection.slug,
      description: collection.description ?? '',
      coverPath: collection.cover_path ?? '',
      isFeatured: collection.is_featured,
    },
  });
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'collection', collection.id] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'collections'] }),
      queryClient.invalidateQueries({ queryKey: ['catalog'] }),
    ]);
  };
  const save = useMutation({
    mutationFn: (values: Values) =>
      catalogAdminService.saveCollection(collection.id, {
        name: values.name,
        slug: values.slug,
        description: values.description || null,
        cover_path: values.coverPath || null,
        is_featured: values.isFeatured,
      }),
    onSuccess: async () => {
      showToast({ title: 'Колекцію збережено' });
      await refresh();
    },
  });
  const changeStatus = useMutation({
    mutationFn: (status: CollectionRow['publication_status']) =>
      catalogAdminService.saveCollection(collection.id, { publication_status: status }),
    onSuccess: async (_, status) => {
      showToast({ title: statusLabels[status] });
      await refresh();
    },
  });
  const addItem = useMutation({
    mutationFn: ({ titleId, sortOrder }: { titleId: string; sortOrder: number }) =>
      catalogAdminService.addCollectionItem(collection.id, titleId, sortOrder),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['admin', 'collection-items', collection.id],
      });
      showToast({ title: 'Тайтл додано до колекції' });
    },
  });
  const removeItem = useMutation({
    mutationFn: (titleId: string) =>
      catalogAdminService.removeCollectionItem(collection.id, titleId),
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'collection-items', collection.id] }),
  });
  const remove = useMutation({
    mutationFn: () => catalogAdminService.deleteCollection(collection.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'collections'] });
      showToast({ title: 'Колекцію видалено' });
      void navigate('/admin/collections', { replace: true });
    },
  });
  const busy = save.isPending || changeStatus.isPending || remove.isPending;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Button asChild size="sm" variant="ghost">
          <Link to="/admin/collections">
            <ArrowLeft className="size-4" /> До колекцій
          </Link>
        </Button>
        <header className="mt-6">
          <p className="text-sm uppercase tracking-[0.2em] text-accent">Editor · Collection</p>
          <h1 className="mt-2 text-3xl font-semibold">{collection.name}</h1>
          <p className="mt-2 text-sm text-muted">{statusLabels[collection.publication_status]}</p>
        </header>
        <form
          className="mt-8 grid gap-5 rounded-lg border border-border bg-surface-1 p-5 sm:grid-cols-2"
          onSubmit={(event) => void handleSubmit((values) => save.mutateAsync(values))(event)}
        >
          <Input label="Назва" {...register('name')} />
          <Input label="Slug" {...register('slug')} />
          <Input label="URL обкладинки" {...register('coverPath')} />
          <label className="flex items-center gap-3 self-end pb-3 text-sm">
            <input type="checkbox" {...register('isFeatured')} /> Показувати як featured
          </label>
          <label className="grid gap-2 text-sm sm:col-span-2">
            <span className="font-medium">Опис</span>
            <textarea
              className="min-h-28 rounded-md border border-border bg-surface-1 p-3"
              {...register('description')}
            />
          </label>
          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <Button disabled={busy || !isDirty} type="submit">
              <Save className="size-4" /> Зберегти
            </Button>
            <Button
              disabled={busy || isDirty}
              onClick={() =>
                changeStatus.mutate(
                  collection.publication_status === 'published' ? 'draft' : 'published',
                )
              }
              variant="secondary"
            >
              {collection.publication_status === 'published' ? 'У чернетки' : 'Опублікувати'}
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
                description="Зв’язки з тайтлами буде видалено."
                title="Видалити колекцію?"
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
                  Так, видалити
                </Button>
              </Dialog>
            </div>
          </div>
        </form>

        <section className="mt-8 rounded-lg border border-border bg-surface-1 p-5">
          <h2 className="text-xl font-semibold">Тайтли колекції</h2>
          <form
            className="mt-5 grid gap-4 sm:grid-cols-[1fr_8rem_auto] sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const titleId = data.get('titleId');
              const sortOrder = Number(data.get('sortOrder'));
              if (typeof titleId === 'string' && titleId) addItem.mutate({ titleId, sortOrder });
            }}
          >
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Тайтл</span>
              <select
                className="h-11 rounded-md border border-border bg-surface-1 px-3"
                name="titleId"
                required
              >
                <option value="">Оберіть тайтл</option>
                {titles.data?.map((title) => (
                  <option key={title.id} value={title.id}>
                    {title.title}
                  </option>
                ))}
              </select>
            </label>
            <Input
              defaultValue={items.data?.length ?? 0}
              label="Порядок"
              min="0"
              name="sortOrder"
              type="number"
            />
            <Button disabled={addItem.isPending} type="submit">
              <Plus className="size-4" /> Додати
            </Button>
          </form>
          {addItem.isError && <p className="mt-3 text-sm text-danger">Тайтл уже є в колекції.</p>}
          <div className="mt-6 grid gap-2">
            {items.data?.map((item) => (
              <div
                className="flex items-center justify-between rounded-md border border-border p-3"
                key={item.title_id}
              >
                <span>
                  {item.sort_order}. {item.title.title}
                </span>
                <Button
                  aria-label="Прибрати з колекції"
                  onClick={() => removeItem.mutate(item.title_id)}
                  size="icon"
                  variant="ghost"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
