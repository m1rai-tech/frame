import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Play, Settings, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth/AuthProvider';
import { newEpisodeMessage } from '@/features/notifications/notification-content';
import { notificationsService } from '@/features/notifications/notifications.service';
import { cn } from '@/lib/cn';

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));

export function NotificationsRoute() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const notifications = useQuery({
    queryKey: ['notifications', 'list', user?.id],
    queryFn: () => notificationsService.list(),
    enabled: Boolean(user),
    refetchInterval: 30_000,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['notifications'] });
  const markRead = useMutation({ mutationFn: (id: string) => notificationsService.markRead(id), onSuccess: refresh });
  const markAll = useMutation({ mutationFn: () => notificationsService.markAllRead(), onSuccess: refresh });
  const remove = useMutation({ mutationFn: (id: string) => notificationsService.remove(id), onSuccess: refresh });
  const unreadCount = notifications.data?.filter((item) => !item.readAt).length ?? 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-accent"><Bell className="size-4" /> Активність</p><h1 className="mt-2 text-4xl font-semibold">Сповіщення</h1><p className="mt-3 text-muted">Нові серії без спойлерів у тексті повідомлення.</p></div>
          <div className="flex flex-wrap gap-2"><Button asChild variant="ghost"><Link to="/settings/notifications"><Settings className="size-4" /> Налаштування</Link></Button><Button disabled={!unreadCount || markAll.isPending} onClick={() => markAll.mutate()} variant="secondary"><CheckCheck className="size-4" /> Прочитати всі</Button></div>
        </div>
        {notifications.isPending ? <div className="mt-8 grid gap-3">{Array.from({ length: 4 }, (_, index) => <Skeleton className="h-28" key={index} />)}</div> : notifications.isError ? <section className="mt-8 rounded-xl border border-border bg-surface-1 p-8 text-center"><p className="font-semibold">Не вдалося завантажити сповіщення.</p><Button className="mt-4" onClick={() => void notifications.refetch()} variant="secondary">Повторити</Button></section> : notifications.data?.length ? <div className="mt-8 grid gap-3">{notifications.data.map((item) => {
          const target = item.episodeId ? `/watch/${item.episodeId}` : item.content.slug ? `/title/${item.content.slug}` : '/browse';
          return <article className={cn('grid gap-4 rounded-xl border p-5 sm:grid-cols-[1fr_auto] sm:items-center', item.readAt ? 'border-border bg-surface-1' : 'border-accent/50 bg-accent/5')} key={item.id}><div><div className="flex items-center gap-2"><span aria-hidden className={cn('size-2 rounded-full', item.readAt ? 'bg-border' : 'bg-accent')} /><h2 className="font-semibold">Нова серія · {item.content.title}</h2>{!item.readAt && <span className="sr-only">Непрочитане</span>}</div><p className="mt-2 text-sm text-muted">{newEpisodeMessage(item.content)}</p><p className="mt-2 text-xs text-muted">{formatDate(item.createdAt)}</p></div><div className="flex flex-wrap gap-2"><Button asChild onClick={() => { if (!item.readAt) markRead.mutate(item.id); }} size="sm"><Link to={target}><Play className="size-4" /> Відкрити</Link></Button>{!item.readAt && <Button disabled={markRead.isPending} onClick={() => markRead.mutate(item.id)} size="sm" variant="ghost"><CheckCheck className="size-4" /> Прочитано</Button>}<Button aria-label="Видалити сповіщення" disabled={remove.isPending} onClick={() => remove.mutate(item.id)} size="icon" variant="ghost"><Trash2 className="size-4" /></Button></div></article>;
        })}</div> : <section className="mt-8 rounded-xl border border-dashed border-border p-10 text-center"><Bell className="mx-auto size-8 text-muted" /><h2 className="mt-3 text-xl font-semibold">Поки тихо</h2><p className="mt-2 text-muted">Додайте серіали й аніме до списку — тут з’являтимуться нові епізоди.</p></section>}
      </div>
    </AppShell>
  );
}
