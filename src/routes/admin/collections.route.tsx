import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit3, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { z } from 'zod';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { catalogAdminService } from '@/features/admin/catalog-admin.service';

const schema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});
type Values = z.infer<typeof schema>;
const statusLabels = {
  draft: 'Чернетка',
  scheduled: 'Заплановано',
  published: 'Опубліковано',
  archived: 'В архіві',
} as const;

export function AdminCollectionsRoute() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const collections = useQuery({
    queryKey: ['admin', 'collections'],
    queryFn: () => catalogAdminService.listCollections(),
  });
  const create = useMutation({
    mutationFn: (values: Values) => catalogAdminService.createCollection(values.name, values.slug),
    onSuccess: async ({ id }) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'collections'] });
      showToast({ title: 'Колекцію створено як чернетку' });
      void navigate(`/admin/collections/${id}`);
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: '', slug: '' } });

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Button asChild size="sm" variant="ghost">
          <Link to="/admin/titles">
            <ArrowLeft className="size-4" /> До каталогу
          </Link>
        </Button>
        <header className="mt-6">
          <p className="text-sm uppercase tracking-[0.2em] text-accent">Editor</p>
          <h1 className="mt-2 text-3xl font-semibold">Колекції</h1>
          <p className="mt-3 text-muted">Тематичні добірки для головної та каталогу.</p>
        </header>
        <form
          className="mt-8 grid gap-4 rounded-lg border border-border bg-surface-1 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          onSubmit={(event) => void handleSubmit((values) => create.mutateAsync(values))(event)}
        >
          <Input error={errors.name?.message} label="Назва" {...register('name')} />
          <Input error={errors.slug?.message} label="Slug" {...register('slug')} />
          <Button disabled={create.isPending} type="submit">
            <Plus className="size-4" /> Створити
          </Button>
        </form>
        {create.isError && <p className="mt-3 text-sm text-danger">Назва або slug уже існує.</p>}
        <div className="mt-8 grid gap-3">
          {collections.data?.map((collection) => (
            <article
              className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-border bg-surface-1 p-4"
              key={collection.id}
            >
              <div>
                <p className="font-semibold">{collection.name}</p>
                <p className="mt-1 text-sm text-muted">
                  /{collection.slug} · {statusLabels[collection.publication_status]}
                  {collection.is_featured ? ' · Featured' : ''}
                </p>
              </div>
              <Button asChild size="sm" variant="secondary">
                <Link to={`/admin/collections/${collection.id}`}>
                  <Edit3 className="size-4" /> Редагувати
                </Link>
              </Button>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
