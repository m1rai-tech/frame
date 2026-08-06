import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/AuthProvider';
import { notificationsService } from './notifications.service';

export function NotificationBell() {
  const { user } = useAuth();
  const unread = useQuery({
    queryKey: ['notifications', 'unread-count', user?.id],
    queryFn: () => notificationsService.unreadCount(),
    enabled: Boolean(user),
    refetchInterval: 30_000,
  });
  if (!user) return null;
  const count = unread.data ?? 0;
  return (
    <Button aria-label={count ? `Сповіщення: ${count} непрочитаних` : 'Сповіщення'} asChild className="relative" size="icon" variant="ghost">
      <Link to="/notifications">
        <Bell className="size-5" />
        {count > 0 && <span className="absolute right-0 top-0 grid min-h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[0.6rem] font-bold leading-none text-accent-contrast">{count > 99 ? '99+' : count}</span>}
      </Link>
    </Button>
  );
}
