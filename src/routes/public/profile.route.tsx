import { useQuery } from '@tanstack/react-query';
import { Award, BarChart3, CalendarDays, Clock3, Eye, Flame, History, Lock, Pencil, Settings, ShieldCheck, Star } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { Poster } from '@/components/media/Poster';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth/AuthProvider';
import { profileImageUrl, profileService } from '@/features/profiles/profile.service';
import { publicProfileService } from '@/features/profiles/public-profile.service';
import { ActivityHeatmap } from '@/features/stats/ActivityHeatmap';
import { profileStatsService, type ProfileStatsDashboard } from '@/features/stats/profile-stats.service';
import { formatWatchDuration } from '@/features/stats/stats-format';

const memberSince = (date: string) =>
  new Intl.DateTimeFormat('uk-UA', { month: 'long', year: 'numeric' }).format(new Date(date));
const typeName = { movie: 'Фільм', series: 'Серіал', anime: 'Аніме' } as const;

function ProfileStatistics({ dashboard }: { dashboard: ProfileStatsDashboard }) {
  const { summary } = dashboard;
  const cards = [
    ['Час перегляду', formatWatchDuration(summary.totalWatchSeconds), Clock3],
    ['Переглянуто тайтлів', summary.watchedTitles, BarChart3],
    ['Завершено фільмів', summary.completedMovies, Star],
    ['Серій серіалів', summary.completedSeriesEpisodes, BarChart3],
    ['Серій аніме', summary.completedAnimeEpisodes, BarChart3],
    ['Поставлено оцінок', summary.ratingsCount, Star],
    ['Активних днів', summary.activeDays, CalendarDays],
    ['Поточний стрік', `${summary.currentStreak} дн.`, Flame],
  ] as const;
  const unlocked = dashboard.achievements.filter((achievement) => achievement.unlocked);
  return (
    <>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value, Icon]) => (
          <div className="rounded-xl border border-border bg-surface-1 p-5" key={label}>
            <Icon className="size-5 text-accent" />
            <p className="mt-4 text-2xl font-semibold">{value}</p>
            <p className="mt-1 text-sm text-muted">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-border bg-surface-1 p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div><h3 className="font-semibold">Активність за 365 днів</h3><p className="mt-1 text-sm text-muted">Один квадрат — один день.</p></div>
          <p className="text-sm text-muted">Найдовший стрік: <strong className="text-foreground">{summary.longestStreak} дн.</strong></p>
        </div>
        <ActivityHeatmap activity={dashboard.activity} />
      </div>
      <div className="mt-5">
        <h3 className="flex items-center gap-2 font-semibold"><Award className="size-5 text-accent" /> Нагороди · {unlocked.length}/{dashboard.achievements.length}</h3>
        {unlocked.length ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {unlocked.map((achievement) => (
              <article className="rounded-xl border border-accent/40 bg-surface-1 p-4" key={achievement.id}>
                <div className="flex items-center gap-3"><span className="text-2xl" aria-hidden>{achievement.icon}</span><div><p className="font-semibold">{achievement.name}</p><p className="text-xs text-muted">{achievement.thresholdDays} днів поспіль</p></div></div>
                <p className="mt-3 text-sm text-muted">{achievement.description}</p>
              </article>
            ))}
          </div>
        ) : <p className="mt-3 rounded-xl border border-dashed border-border p-5 text-sm text-muted">Перша нагорода з’явиться після трьох днів поспіль.</p>}
      </div>
    </>
  );
}

export function ProfileRoute() {
  const { username = '' } = useParams();
  const { user } = useAuth();
  const profile = useQuery({
    queryKey: ['public-profile', username],
    queryFn: () => profileService.getByUsername(username),
    retry: false,
  });
  const visibility = useQuery({
    queryKey: ['profile-section-visibility', profile.data?.id],
    queryFn: () => publicProfileService.visibility(profile.data!.id),
    enabled: Boolean(profile.data),
  });
  const stats = useQuery({
    queryKey: ['public-profile-stats', profile.data?.id],
    queryFn: () => profileStatsService.getDashboard(profile.data!.id),
    enabled: Boolean(profile.data && visibility.data?.statsIsPublic),
  });
  const history = useQuery({
    queryKey: ['public-profile-history', profile.data?.id],
    queryFn: () => publicProfileService.history(profile.data!.id),
    enabled: Boolean(profile.data && visibility.data?.historyIsPublic),
  });
  const lists = useQuery({
    queryKey: ['public-profile-lists', profile.data?.id],
    queryFn: () => publicProfileService.lists(profile.data!.id),
    enabled: Boolean(profile.data && visibility.data?.listsIsPublic),
  });
  const isOwner = user?.id === profile.data?.id;

  return (
    <AppShell>
      {profile.isPending ? (
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6"><Skeleton className="aspect-[3/1]" /><Skeleton className="mt-6 h-52" /></div>
      ) : profile.isError || !profile.data ? (
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <Lock className="mx-auto size-10 text-muted" />
          <h1 className="mt-4 text-3xl font-semibold">Профіль недоступний</h1>
          <p className="mt-3 text-muted">Профіль приватний, не існує або його username було змінено.</p>
          <Button asChild className="mt-6" variant="secondary"><Link to="/browse">До каталогу</Link></Button>
        </div>
      ) : (
        <article className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          {isOwner && !profile.data.is_public && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-1 p-4">
              <p className="flex items-center gap-2 text-sm"><Eye className="size-4 text-accent" /> Це попередній перегляд. Інші користувачі не бачать приватний профіль.</p>
              <Button asChild size="sm" variant="secondary"><Link to="/settings/privacy"><Settings className="size-4" /> Налаштувати приватність</Link></Button>
            </div>
          )}
          <div className="relative aspect-[3/1] overflow-hidden rounded-2xl border bg-surface-2" style={{ borderColor: profile.data.accent_color }}>
            {profile.data.banner_path ? <img alt="" className="size-full object-cover" src={profileImageUrl('profile-banners', profile.data.banner_path)} /> : <div className="size-full" style={{ background: `linear-gradient(135deg, ${profile.data.accent_color}55, var(--surface-2) 70%)` }} />}
          </div>
          <div className="relative mx-4 -mt-12 rounded-2xl border border-border bg-background/95 p-6 shadow-card backdrop-blur sm:mx-10 sm:grid sm:grid-cols-[8rem_1fr_auto] sm:gap-6">
            <div className="size-28 overflow-hidden rounded-full border-4 border-background bg-surface-2 sm:size-32">
              {profile.data.avatar_path ? <img alt={`Аватар ${profile.data.display_name}`} className="size-full object-cover" src={profileImageUrl('avatars', profile.data.avatar_path)} /> : <div className="grid size-full place-items-center text-4xl font-semibold text-muted">{profile.data.display_name.slice(0, 1).toUpperCase()}</div>}
            </div>
            <div className="mt-4 min-w-0 sm:mt-2">
              <p className="flex items-center gap-1 text-xs uppercase tracking-[0.16em] text-accent"><ShieldCheck className="size-3" /> {profile.data.is_public ? 'Публічний профіль' : 'Приватний попередній перегляд'}</p>
              <h1 className="mt-2 truncate text-3xl font-semibold">{profile.data.display_name}</h1>
              <p className="mt-1 text-muted">@{profile.data.username}</p>
              {profile.data.bio && <p className="mt-4 max-w-2xl leading-7 text-muted">{profile.data.bio}</p>}
              <p className="mt-4 flex items-center gap-2 text-sm text-muted"><CalendarDays className="size-4" /> У Frame з {memberSince(profile.data.created_at)}</p>
            </div>
            {isOwner && <div className="mt-5 grid self-start gap-2 sm:mt-2"><Button asChild><Link to="/profile/edit"><Pencil className="size-4" /> Редагувати профіль</Link></Button><Button asChild variant="secondary"><Link to="/settings/privacy"><ShieldCheck className="size-4" /> Приватність</Link></Button></div>}
          </div>

          {profile.data.favorite_genre_slugs.length > 0 && <section className="mx-4 mt-10 sm:mx-10"><h2 className="text-xl font-semibold">Улюблені жанри</h2><div className="mt-4 flex flex-wrap gap-2">{profile.data.favorite_genre_slugs.map((genre) => <span className="rounded-full border border-border bg-surface-1 px-4 py-2 text-sm capitalize" key={genre}>{genre}</span>)}</div></section>}

          {visibility.isPending && <div className="mx-4 mt-10 grid gap-4 sm:mx-10"><Skeleton className="h-36" /><Skeleton className="h-48" /></div>}

          {visibility.data?.statsIsPublic && (
            <section className="mx-4 mt-10 sm:mx-10">
              <h2 className="flex items-center gap-2 text-xl font-semibold"><BarChart3 className="size-5 text-accent" /> Статистика</h2>
              {stats.isPending ? <div className="mt-4 grid gap-4"><Skeleton className="h-44" /><Skeleton className="h-44" /></div> : stats.data ? <ProfileStatistics dashboard={stats.data} /> : <p className="mt-4 text-sm text-danger">Не вдалося завантажити статистику.</p>}
            </section>
          )}

          {visibility.data?.historyIsPublic && (
            <section className="mx-4 mt-10 sm:mx-10"><h2 className="flex items-center gap-2 text-xl font-semibold"><History className="size-5 text-accent" /> Останні перегляди</h2>{history.isPending ? <Skeleton className="mt-4 h-44" /> : history.data?.length ? <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{history.data.map((item) => <Link className="group" key={item.id} to={`/title/${item.slug}`}><Poster alt={item.title} src={item.posterPath} /><p className="mt-2 line-clamp-1 text-sm font-medium group-hover:text-accent">{item.title}</p><p className="text-xs text-muted">{typeName[item.type]} · {item.completed ? 'Переглянуто' : 'У процесі'}</p></Link>)}</div> : <p className="mt-4 rounded-xl border border-dashed border-border p-6 text-sm text-muted">Історія поки порожня.</p>}</section>
          )}

          {visibility.data?.listsIsPublic && (
            <section className="mx-4 mt-10 sm:mx-10"><h2 className="text-xl font-semibold">Списки</h2>{lists.isPending ? <Skeleton className="mt-4 h-48" /> : lists.data?.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2">{lists.data.map((list) => <article className="rounded-xl border border-border bg-surface-1 p-5" key={list.id}><h3 className="font-semibold">{list.name}</h3>{list.description && <p className="mt-1 text-sm text-muted">{list.description}</p>}<div className="mt-4 flex -space-x-4">{list.titles.slice(0, 5).map((title) => <Link className="w-16 transition-transform hover:-translate-y-1" key={title.id} title={title.title} to={`/title/${title.slug}`}><Poster alt={title.title} src={title.posterPath} /></Link>)}</div><p className="mt-3 text-xs text-muted">{list.titles.length} тайтлів</p></article>)}</div> : <p className="mt-4 rounded-xl border border-dashed border-border p-6 text-sm text-muted">Списки поки порожні.</p>}</section>
          )}

          {isOwner && visibility.data && !visibility.data.statsIsPublic && !visibility.data.historyIsPublic && !visibility.data.listsIsPublic && <section className="mx-4 mt-10 rounded-xl border border-dashed border-border p-8 text-center sm:mx-10"><Lock className="mx-auto size-6 text-muted" /><h2 className="mt-3 font-semibold">Публічні розділи вимкнені</h2><p className="mt-2 text-sm text-muted">Увімкніть статистику, історію або списки в налаштуваннях приватності — тоді вони з’являться тут.</p><Button asChild className="mt-4" variant="secondary"><Link to="/settings/privacy">Налаштувати</Link></Button></section>}
        </article>
      )}
    </AppShell>
  );
}
