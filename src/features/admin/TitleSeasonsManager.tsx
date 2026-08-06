import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { catalogAdminService } from '@/features/admin/catalog-admin.service';

const schema = z.object({
  seasonNumber: z.number().int().min(0, 'Номер не може бути від’ємним'),
  name: z.string().trim().min(2, 'Мінімум 2 символи'),
});
type Values = z.infer<typeof schema>;
const statusLabels = {
  draft: 'Чернетка',
  scheduled: 'Заплановано',
  published: 'Опубліковано',
  archived: 'В архіві',
} as const;

export function TitleSeasonsManager({ titleId }: { titleId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const seasons = useQuery({
    queryKey: ['admin', 'seasons', titleId],
    queryFn: () => catalogAdminService.listSeasons(titleId),
  });
  const createSeason = useMutation({
    mutationFn: (values: Values) =>
      catalogAdminService.createSeason(titleId, values.seasonNumber, values.name),
    onSuccess: async ({ id }) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'seasons', titleId] });
      showToast({ title: 'Сезон створено як чернетку' });
      void navigate(`/admin/seasons/${id}`);
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', seasonNumber: (seasons.data?.at(-1)?.season_number ?? 0) + 1 },
  });

  return (
    <section className="rounded-lg border border-border bg-surface-1 p-5">
      <h2 className="text-xl font-semibold">Сезони та епізоди</h2>
      <form
        className="mt-5 grid gap-4 sm:grid-cols-[9rem_1fr_auto] sm:items-end"
        onSubmit={(event) => void handleSubmit((values) => createSeason.mutateAsync(values))(event)}
      >
        <Input
          error={errors.seasonNumber?.message}
          label="Номер сезону"
          min="0"
          type="number"
          {...register('seasonNumber', { valueAsNumber: true })}
        />
        <Input error={errors.name?.message} label="Назва сезону" {...register('name')} />
        <Button disabled={createSeason.isPending} type="submit">
          <Plus className="size-4" /> Додати сезон
        </Button>
      </form>
      {createSeason.isError && (
        <p className="mt-3 text-sm text-danger">
          Не вдалося створити сезон. Перевірте унікальність номера.
        </p>
      )}

      <div className="mt-6 grid gap-3">
        {seasons.data?.length === 0 && <p className="text-sm text-muted">Сезонів ще немає.</p>}
        {seasons.data?.map((season) => (
          <article
            className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-4"
            key={season.id}
          >
            <div>
              <p className="font-semibold">
                Сезон {season.season_number}: {season.name}
              </p>
              <p className="mt-1 text-sm text-muted">{statusLabels[season.publication_status]}</p>
            </div>
            <Button asChild size="sm" variant="secondary">
              <Link to={`/admin/seasons/${season.id}`}>
                <Edit3 className="size-4" /> Редагувати
              </Link>
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}
