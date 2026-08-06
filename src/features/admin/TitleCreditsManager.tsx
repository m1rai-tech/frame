import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { catalogAdminService } from '@/features/admin/catalog-admin.service';

const valueOf = (data: FormData, key: string) => {
  const value = data.get(key);
  return typeof value === 'string' ? value.trim() : '';
};

export function TitleCreditsManager({ titleId }: { titleId: string }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const people = useQuery({
    queryKey: ['admin', 'people'],
    queryFn: () => catalogAdminService.listPeople(),
  });
  const credits = useQuery({
    queryKey: ['admin', 'credits', titleId],
    queryFn: () => catalogAdminService.listTitleCredits(titleId),
  });
  const studios = useQuery({
    queryKey: ['admin', 'studios'],
    queryFn: () => catalogAdminService.listStudios(),
  });
  const titleStudios = useQuery({
    queryKey: ['admin', 'title-studios', titleId],
    queryFn: () => catalogAdminService.listTitleStudios(titleId),
  });
  const refreshCatalog = () => queryClient.invalidateQueries({ queryKey: ['catalog'] });
  const createPerson = useMutation({
    mutationFn: ({ name, slug }: { name: string; slug: string }) =>
      catalogAdminService.createPerson(name, slug),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'people'] });
      showToast({ title: 'Людину додано до довідника' });
    },
  });
  const addCredit = useMutation({
    mutationFn: (values: {
      personId: string;
      department: string;
      role: string;
      characterName: string;
      sortOrder: number;
    }) =>
      catalogAdminService.addTitleCredit({
        title_id: titleId,
        person_id: values.personId,
        department: values.department,
        role: values.role,
        character_name: values.characterName || null,
        sort_order: values.sortOrder,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'credits', titleId] }),
        refreshCatalog(),
      ]);
      showToast({ title: 'Credit додано' });
    },
  });
  const removeCredit = useMutation({
    mutationFn: (id: string) => catalogAdminService.removeTitleCredit(id),
    onSuccess: async () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'credits', titleId] }),
        refreshCatalog(),
      ]),
  });
  const createStudio = useMutation({
    mutationFn: ({ name, slug }: { name: string; slug: string }) =>
      catalogAdminService.createStudio(name, slug),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'studios'] });
      showToast({ title: 'Студію створено' });
    },
  });
  const addStudio = useMutation({
    mutationFn: (studioId: string) => catalogAdminService.addTitleStudio(titleId, studioId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'title-studios', titleId] }),
        refreshCatalog(),
      ]);
      showToast({ title: 'Студію прив’язано' });
    },
  });
  const removeStudio = useMutation({
    mutationFn: (studioId: string) => catalogAdminService.removeTitleStudio(titleId, studioId),
    onSuccess: async () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'title-studios', titleId] }),
        refreshCatalog(),
      ]),
  });

  return (
    <section className="grid gap-8 rounded-lg border border-border bg-surface-1 p-5">
      <div>
        <h2 className="text-xl font-semibold">Актори та команда</h2>
        <form
          className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_1fr]"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const name = valueOf(data, 'name');
            const slug = valueOf(data, 'slug');
            if (name && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
              createPerson.mutate({ name, slug });
          }}
        >
          <Input label="Нова людина" name="name" placeholder="Ім’я та прізвище" required />
          <Input label="Slug" name="slug" placeholder="name-surname" required />
          <Button
            className="self-end"
            disabled={createPerson.isPending}
            type="submit"
            variant="secondary"
          >
            <UserPlus className="size-4" /> Створити
          </Button>
        </form>
        <form
          className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const personId = valueOf(data, 'personId');
            const department = valueOf(data, 'department');
            const role = valueOf(data, 'role');
            if (personId && department && role)
              addCredit.mutate({
                personId,
                department,
                role,
                characterName: valueOf(data, 'characterName'),
                sortOrder: Number(valueOf(data, 'sortOrder')) || 0,
              });
          }}
        >
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Людина</span>
            <select
              className="h-11 rounded-md border border-border bg-surface-1 px-3"
              name="personId"
              required
            >
              <option value="">Оберіть</option>
              {people.data?.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </label>
          <Input label="Відділ" name="department" placeholder="Acting / Directing" required />
          <Input label="Роль" name="role" placeholder="Actor / Director" required />
          <Input label="Персонаж" name="characterName" placeholder="Необов’язково" />
          <Input defaultValue="0" label="Порядок" min="0" name="sortOrder" type="number" />
          <Button className="self-end" disabled={addCredit.isPending} type="submit">
            <Plus className="size-4" /> Додати credit
          </Button>
        </form>
        <div className="mt-5 grid gap-2">
          {credits.data?.map((credit) => (
            <div
              className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
              key={credit.id}
            >
              <div>
                <p className="font-medium">{credit.person.name}</p>
                <p className="text-sm text-muted">
                  {credit.role}
                  {credit.character_name ? ` · ${credit.character_name}` : ''} · {credit.department}
                </p>
              </div>
              <Button
                aria-label="Видалити credit"
                onClick={() => removeCredit.mutate(credit.id)}
                size="icon"
                variant="ghost"
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-7">
        <h2 className="text-xl font-semibold">Студії</h2>
        <form
          className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const name = valueOf(data, 'name');
            const slug = valueOf(data, 'slug');
            if (name && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
              createStudio.mutate({ name, slug });
          }}
        >
          <Input label="Нова студія" name="name" required />
          <Input label="Slug" name="slug" required />
          <Button disabled={createStudio.isPending} type="submit" variant="secondary">
            <Plus className="size-4" /> Створити
          </Button>
        </form>
        <form
          className="mt-4 flex flex-wrap gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const studioId = valueOf(new FormData(event.currentTarget), 'studioId');
            if (studioId) addStudio.mutate(studioId);
          }}
        >
          <select
            className="h-11 min-w-64 rounded-md border border-border bg-surface-1 px-3"
            name="studioId"
            required
          >
            <option value="">Оберіть студію</option>
            {studios.data?.map((studio) => (
              <option key={studio.id} value={studio.id}>
                {studio.name}
              </option>
            ))}
          </select>
          <Button disabled={addStudio.isPending} type="submit">
            Прив’язати
          </Button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {titleStudios.data?.map((studio) => (
            <span
              className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm"
              key={studio.id}
            >
              {studio.name}
              <button
                aria-label={`Відв’язати ${studio.name}`}
                onClick={() => removeStudio.mutate(studio.id)}
                type="button"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
