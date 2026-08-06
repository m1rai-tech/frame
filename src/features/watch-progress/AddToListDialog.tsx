import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookmarkPlus, Check, Heart, ListPlus } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/AuthProvider';
import { userListsService, type UserListSummary } from './user-lists.service';

const ListIcon = ({ kind }: { kind: UserListSummary['kind'] }) =>
  kind === 'favorites' ? <Heart className="size-4" /> : kind === 'custom' ? <ListPlus className="size-4" /> : <BookmarkPlus className="size-4" />;

export function AddToListDialog({ titleId }: { titleId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const lists = useQuery({
    queryKey: ['user-lists', titleId],
    queryFn: () => userListsService.list(titleId),
    enabled: Boolean(user),
  });
  const toggle = useMutation({
    mutationFn: (list: UserListSummary) =>
      userListsService.toggle(list.id, titleId, list.containsTitle),
    onSuccess: async (_data, list) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['user-lists'] }),
        queryClient.invalidateQueries({ queryKey: ['my-lists'] }),
      ]);
      showToast({
        title: list.containsTitle ? `Видалено зі списку «${list.name}»` : `Додано до «${list.name}»`,
      });
    },
  });

  if (!user)
    return (
      <Button asChild variant="secondary">
        <Link to="/login">
          <BookmarkPlus className="size-4" /> До списку
        </Link>
      </Button>
    );

  return (
    <Dialog
      description="Оберіть один або декілька власних списків."
      title="Додати до списку"
      trigger={
        <Button variant="secondary">
          <BookmarkPlus className="size-4" /> До списку
        </Button>
      }
    >
      {lists.isPending ? (
        <div className="grid gap-2">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : lists.isError ? (
        <div>
          <p className="text-sm text-danger">Не вдалося завантажити списки.</p>
          <Button className="mt-3" onClick={() => void lists.refetch()} variant="secondary">
            Спробувати ще раз
          </Button>
        </div>
      ) : (
        <div className="grid gap-2">
          {lists.data.map((list) => (
            <button
              aria-pressed={list.containsTitle}
              className="flex min-h-12 items-center gap-3 rounded-md border border-border px-4 text-left hover:bg-surface-2"
              disabled={toggle.isPending}
              key={list.id}
              onClick={() => toggle.mutate(list)}
              type="button"
            >
              <ListIcon kind={list.kind} />
              <span className="flex-1 font-medium">{list.name}</span>
              {list.containsTitle && <Check className="size-4 text-accent" />}
            </button>
          ))}
          <Button asChild className="mt-2" variant="ghost">
            <Link to="/my-list">
              <ListPlus className="size-4" /> Керувати списками
            </Link>
          </Button>
        </div>
      )}
    </Dialog>
  );
}
