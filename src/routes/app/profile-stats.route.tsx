import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Award, BarChart3, Clock3, Flame, Star } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/AuthProvider';
import { ActivityHeatmap } from '@/features/stats/ActivityHeatmap';
import { profileStatsService } from '@/features/stats/profile-stats.service';
import { formatWatchDuration } from '@/features/stats/stats-format';
import { cn } from '@/lib/cn';

export function ProfileStatsRoute() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const dashboard = useQuery({
    queryKey: ['profile-stats', user?.id],
    queryFn: () => profileStatsService.getDashboard(user!.id),
    enabled: Boolean(user),
  });
  const feature = useMutation({
    mutationFn: (id: string | null) => profileStatsService.setFeatured(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile-stats', user?.id] });
      showToast({ title: 'Нагороду в профілі оновлено' });
    },
    onError: () => showToast({ title: 'Не вдалося змінити нагороду' }),
  });
  const stats = dashboard.data?.summary;
  const cards = stats
    ? [
        ['Час перегляду', formatWatchDuration(stats.totalWatchSeconds), Clock3],
        ['Переглянуто тайтлів', stats.watchedTitles, BarChart3],
        ['Завершено фільмів', stats.completedMovies, Star],
        ['Серій серіалів', stats.completedSeriesEpisodes, BarChart3],
        ['Серій аніме', stats.completedAnimeEpisodes, BarChart3],
        ['Поставлено оцінок', stats.ratingsCount, Star],
        ['Активних днів', stats.activeDays, Flame],
        ['Поточний стрік', `${stats.currentStreak} дн.`, Flame],
      ] as const
    : [];

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-accent"><BarChart3 className="size-4" /> Профіль</p>
        <h1 className="mt-2 text-4xl font-semibold">Статистика та нагороди</h1>
        <p className="mt-3 text-muted">Ваші перегляди, активність і досягнення за весь час.</p>

        {dashboard.isPending ? (
          <div className="mt-8 grid gap-5"><Skeleton className="h-48" /><Skeleton className="h-56" /><Skeleton className="h-64" /></div>
        ) : dashboard.isError ? (
          <section className="mt-8 rounded-xl border border-border bg-surface-1 p-8 text-center">
            <p className="font-semibold">Не вдалося завантажити статистику.</p>
            <p className="mt-2 text-sm text-muted">Переконайтесь, що останню SQL-міграцію застосовано в Supabase.</p>
            <Button className="mt-4" onClick={() => void dashboard.refetch()} variant="secondary">Повторити</Button>
          </section>
        ) : dashboard.data && stats ? (
          <>
            <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map(([label, value, Icon]) => (
                <article className="rounded-xl border border-border bg-surface-1 p-5" key={label}>
                  <Icon className="size-5 text-accent" /><p className="mt-5 text-2xl font-semibold">{value}</p><p className="mt-1 text-sm text-muted">{label}</p>
                </article>
              ))}
            </section>
            <section className="mt-6 rounded-xl border border-border bg-surface-1 p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div><h2 className="text-xl font-semibold">Активність за рік</h2><p className="mt-1 text-sm text-muted">Один квадрат — один календарний день.</p></div>
                <p className="text-sm text-muted">Найдовший стрік: <strong className="text-foreground">{stats.longestStreak} дн.</strong></p>
              </div>
              <ActivityHeatmap activity={dashboard.data.activity} />
            </section>
            <section className="mt-6">
              <div className="flex items-center gap-3"><Award className="size-5 text-accent" /><h2 className="text-2xl font-semibold">Нагороди</h2></div>
              <p className="mt-2 text-sm text-muted">Відкрито {stats.achievementsUnlocked} з {dashboard.data.achievements.length}. Отриману нагороду можна показати у профілі.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {dashboard.data.achievements.map((achievement) => {
                  const featured = dashboard.data.featuredAchievementId === achievement.id;
                  return (
                    <article className={cn('rounded-xl border bg-surface-1 p-5', achievement.unlocked ? 'border-accent/50' : 'border-border opacity-60')} key={achievement.id}>
                      <div className="flex items-start justify-between gap-3"><span aria-hidden className="text-3xl">{achievement.icon}</span><span className="rounded-full bg-surface-2 px-3 py-1 text-xs">{achievement.thresholdDays} днів</span></div>
                      <h3 className="mt-4 text-lg font-semibold">{achievement.name}</h3>
                      <p className="mt-2 min-h-10 text-sm text-muted">{achievement.description}</p>
                      {achievement.unlocked ? (
                        <><p className="mt-3 text-xs text-muted">Отримано {achievement.unlockedAt ? new Intl.DateTimeFormat('uk-UA').format(new Date(achievement.unlockedAt)) : ''}</p><Button className="mt-4 w-full" disabled={feature.isPending} onClick={() => feature.mutate(featured ? null : achievement.id)} size="sm" variant={featured ? 'secondary' : 'primary'}>{featured ? 'Прибрати з профілю' : 'Показати в профілі'}</Button></>
                      ) : <p className="mt-4 text-sm font-medium">Ще не відкрито</p>}
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
