import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/AuthProvider';
import { dailyActivityService } from './daily-activity.service';

export function DailyActivityRegistrar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const activity = useQuery({
    queryKey: ['daily-activity-registration', user?.id],
    queryFn: () => dailyActivityService.register(),
    enabled: Boolean(user),
    staleTime: Number.POSITIVE_INFINITY,
    retry: 1,
  });

  useEffect(() => {
    if (!activity.data) return;
    activity.data.newAchievements.forEach((achievement) => {
      const key = `frame-reward-${activity.data.activityDate}-${achievement.slug}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, 'shown');
      showToast({
        title: `Нова нагорода: ${achievement.name}`,
        description: `Поточний стрік — ${activity.data.currentStreak} днів.`,
      });
    });
  }, [activity.data, showToast]);

  useEffect(() => {
    if (!activity.data || !user) return;
    const delay = Math.max(1000, new Date(activity.data.nextResetAt).getTime() - Date.now() + 1000);
    const timer = window.setTimeout(
      () => void queryClient.invalidateQueries({ queryKey: ['daily-activity-registration', user.id] }),
      delay,
    );
    return () => window.clearTimeout(timer);
  }, [activity.data, queryClient, user]);

  return null;
}
