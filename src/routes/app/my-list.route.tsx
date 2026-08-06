import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, ListPlus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { Poster } from '@/components/media/Poster';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { userListsService } from '@/features/watch-progress/user-lists.service';

const typeName = { movie: 'Фільм', series: 'Серіал', anime: 'Аніме' } as const;

export function MyListRoute() {
  const [name, setName] = useState('');
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const lists = useQuery({ queryKey: ['my-lists'], queryFn: () => userListsService.listWithItems() });
  const create = useMutation({
    mutationFn: (value: string) => userListsService.create(value),
    onSuccess: async () => {
      setName('');
      await queryClient.invalidateQueries({ queryKey: ['my-lists'] });
      showToast({ title: 'Новий список створено' });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => userListsService.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-lists'] });
      showToast({ title: 'Список видалено' });
    },
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <p className="text-sm uppercase tracking-[0.18em] text-accent">Особиста бібліотека</p>
        <h1 className="mt-2 text-4xl font-semibold">Мій список</h1>
        <form
          className="mt-8 flex max-w-xl items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (name.trim()) create.mutate(name);
          }}
        >
          <Input
            label="Новий власний список"
            maxLength={80}
            onChange={(event) => setName(event.currentTarget.value)}
            placeholder="Наприклад, На вихідні"
            value={name}
          />
          <Button disabled={!name.trim() || create.isPending} type="submit">
            <ListPlus className="size-4" /> Створити
          </Button>
        </form>
        {create.isError && <p className="mt-3 text-sm text-danger">Не вдалося створити список.</p>}

        {lists.isPending ? (
          <div className="mt-12 grid gap-10">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64" />
          </div>
        ) : lists.isError ? (
          <section className="mt-12 rounded-xl border border-border bg-surface-1 p-8">
            <h2 className="text-xl font-semibold">Списки недоступні</h2>
            <p className="mt-2 text-muted">Застосуйте міграцію списків у Supabase SQL Editor.</p>
            <Button className="mt-4" onClick={() => void lists.refetch()} variant="secondary">
              Спробувати ще раз
            </Button>
          </section>
        ) : (
          <div className="mt-12 grid gap-14">
            {lists.data.map((list) => (
              <section aria-labelledby={`list-${list.id}`} key={list.id}>
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h2 className="flex items-center gap-2 text-2xl font-semibold" id={`list-${list.id}`}>
                    {list.kind === 'favorites' && <Heart className="size-5 text-accent" />}
                    {list.name}
                    <span className="text-sm font-normal text-muted">{list.items.length}</span>
                  </h2>
                  {list.kind === 'custom' && (
                    <Button
                      aria-label={`Видалити список ${list.name}`}
                      disabled={remove.isPending}
                      onClick={() => {
                        if (window.confirm(`Видалити список «${list.name}»?`)) remove.mutate(list.id);
                      }}
                      size="icon"
                      variant="ghost"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
                {list.items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted">
                    Тут поки порожньо. Додавайте тайтли кнопкою «До списку».
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {list.items.map((item) => (
                      <article className="min-w-0" key={item.id}>
                        <Link to={`/title/${item.slug}`}>
                          <Poster alt={item.title} src={item.posterPath} />
                        </Link>
                        <Link className="mt-3 block truncate font-medium hover:text-accent" to={`/title/${item.slug}`}>
                          {item.title}
                        </Link>
                        <p className="mt-1 text-sm text-muted">
                          {typeName[item.type]} {item.releaseYear ? `· ${item.releaseYear}` : ''}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
