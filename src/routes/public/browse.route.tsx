import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { usePageMeta } from '@/app/use-page-meta';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { AppShell } from '@/components/layout/AppShell';
import { MediaCard } from '@/components/media/MediaCard';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { catalogService } from '@/features/catalog/catalog.service';
import type { CatalogSort, CatalogTitle, ContentType } from '@/features/catalog/catalog.types';
import { useAuth } from '@/features/auth/AuthProvider';
import { RecommendationsRow } from '@/features/recommendations/RecommendationsRow';
import { ContinueWatchingRow } from '@/features/watch-progress/ContinueWatchingRow';
import { cn } from '@/lib/cn';

const categories: Array<{ label: string; value?: ContentType }> = [
  { label: 'Усе' },
  { label: 'Фільми', value: 'movie' },
  { label: 'Серіали', value: 'series' },
  { label: 'Аніме', value: 'anime' },
];
const statuses: Array<{ label: string; value: CatalogTitle['status'] }> = [
  { label: 'Анонсовано', value: 'announced' },
  { label: 'Виходить', value: 'ongoing' },
  { label: 'Завершено', value: 'completed' },
  { label: 'Скасовано', value: 'cancelled' },
];
const sortOptions = [
  { label: 'Спочатку нові', value: 'newest' },
  { label: 'Спочатку старі', value: 'oldest' },
  { label: 'Назва: А–Я', value: 'title-asc' },
  { label: 'Назва: Я–А', value: 'title-desc' },
];
const languageOptions = [
  { label: 'Українська', value: 'uk' },
  { label: 'Англійська', value: 'en' },
  { label: 'Японська', value: 'ja' },
];
const countryOptions = [
  { label: 'Україна', value: 'UA' },
  { label: 'Японія', value: 'JP' },
  { label: 'США', value: 'US' },
  { label: 'Велика Британія', value: 'GB' },
];
const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 40 }, (_, index) => {
  const year = String(currentYear - index);
  return { label: year, value: year };
});
const parsePage = (value: string | null) => {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
};

export function BrowseRoute() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();

  const type = categories.some((item) => item.value === params.get('type'))
    ? (params.get('type') as ContentType)
    : undefined;
  const genre = params.get('genre') ?? undefined;
  const query = params.get('q') ?? undefined;
  const yearValue = Number(params.get('year'));
  const year = Number.isInteger(yearValue) && yearValue > 1900 ? yearValue : undefined;
  const status = statuses.some((item) => item.value === params.get('status'))
    ? (params.get('status') as CatalogTitle['status'])
    : undefined;
  const ageRating = params.get('age') ?? undefined;
  const language = params.get('language') ?? undefined;
  const country = params.get('country') ?? undefined;
  const sort = (
    sortOptions.some((item) => item.value === params.get('sort')) ? params.get('sort') : 'newest'
  ) as CatalogSort;
  const page = parsePage(params.get('page'));
  const categoryName =
    type === 'movie'
      ? 'Фільми'
      : type === 'series'
        ? 'Серіали'
        : type === 'anime'
          ? 'Аніме'
          : 'Каталог';
  usePageMeta({
    title: query ? `Пошук: ${query}` : categoryName,
    description: `Переглядайте ${categoryName.toLowerCase()} у каталозі Frame та фільтруйте за жанром, роком і статусом.`,
    path: `/browse${params.size > 0 ? `?${params.toString()}` : ''}`,
  });

  const genres = useQuery({
    queryKey: ['catalog', 'genres'],
    queryFn: () => catalogService.listGenres(),
  });
  const result = useQuery({
    queryKey: [
      'catalog',
      { type, genre, query, year, status, ageRating, language, country, sort, page },
    ],
    queryFn: () =>
      catalogService.listPage({
        type,
        genre,
        query,
        year,
        status,
        ageRating,
        language,
        country,
        sort,
        page,
      }),
    placeholderData: (previous) => previous,
  });

  const update = (key: string, value?: string, resetPage = true) =>
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(key, value);
      else next.delete(key);
      if (resetPage && key !== 'page') next.delete('page');
      return next;
    });
  const hasFilters = [...params.keys()].some((key) => key !== 'sort');
  const clearFilters = () => {
    setParams({});
  };
  const filterContent = (
    <div className="grid gap-5">
      <FilterSelect
        label="Рік"
        onChange={(value) => update('year', value)}
        options={yearOptions}
        value={year ? String(year) : undefined}
      />
      <FilterSelect
        label="Статус"
        onChange={(value) => update('status', value)}
        options={statuses}
        value={status}
      />
      <FilterSelect
        label="Віковий рейтинг"
        onChange={(value) => update('age', value)}
        options={['0+', '6+', '12+', '16+', '18+'].map((value) => ({ label: value, value }))}
        value={ageRating}
      />
      <FilterSelect
        label="Мова оригіналу"
        onChange={(value) => update('language', value)}
        options={languageOptions}
        value={language}
      />
      <FilterSelect
        label="Країна"
        onChange={(value) => update('country', value)}
        options={countryOptions}
        value={country}
      />
      <div>
        <h2 className="mb-2 text-sm font-semibold">Жанри</h2>
        <div className="grid gap-1">
          {genres.data?.map((item) => (
            <button
              className={cn(
                'rounded-md px-3 py-2 text-left text-sm hover:bg-surface-2',
                genre === item.slug && 'bg-surface-2 text-accent',
              )}
              key={item.slug}
              onClick={() => update('genre', genre === item.slug ? undefined : item.slug)}
              type="button"
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>
      {hasFilters && (
        <Button onClick={clearFilters} variant="ghost">
          <X className="size-4" /> Очистити фільтри
        </Button>
      )}
    </div>
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {user && params.size === 0 && (
          <div className="mb-12 grid gap-12">
            <ContinueWatchingRow />
            <RecommendationsRow />
          </div>
        )}
        <header className="flex flex-col gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-accent">Каталог</p>
            <h1 className="mt-2 text-4xl font-semibold">Знайдіть наступну історію</h1>
          </div>
          <form
            className="flex max-w-2xl gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const searchValue = form.get('q');
              update(
                'q',
                typeof searchValue === 'string' ? searchValue.trim() || undefined : undefined,
              );
            }}
          >
            <div className="flex-1">
              <Input
                aria-label="Пошук каталогу"
                defaultValue={query ?? ''}
                key={query ?? ''}
                name="q"
                placeholder="Назва фільму, серіалу або аніме"
              />
            </div>
            <Button aria-label="Знайти" size="icon" type="submit">
              <Search className="size-5" />
            </Button>
          </form>
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((item) => (
              <button
                aria-pressed={type === item.value}
                className={cn(
                  'rounded-full border border-border px-4 py-2 text-sm',
                  type === item.value && 'border-accent bg-accent text-accent-contrast',
                )}
                key={item.label}
                onClick={() => update('type', item.value)}
                type="button"
              >
                {item.label}
              </button>
            ))}
            <div className="ml-auto md:hidden">
              <Drawer
                title="Фільтри каталогу"
                trigger={
                  <Button variant="secondary">
                    <SlidersHorizontal className="size-4" /> Фільтри
                  </Button>
                }
              >
                {filterContent}
              </Drawer>
            </div>
          </div>
        </header>
        <div className="mt-10 grid gap-8 md:grid-cols-[14rem_1fr]">
          <aside className="hidden md:block">{filterContent}</aside>
          <section aria-live="polite">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">
                {result.data ? `Знайдено: ${result.data.total}` : 'Завантаження…'}
              </p>
              <Select
                ariaLabel="Сортування каталогу"
                onValueChange={(value) => update('sort', value === 'newest' ? undefined : value)}
                options={sortOptions}
                placeholder="Сортування"
                value={sort}
              />
            </div>
            {result.isPending ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }, (_, index) => (
                  <div className="aspect-[2/3] animate-pulse rounded-md bg-surface-2" key={index} />
                ))}
              </div>
            ) : result.isError ? (
              <ErrorState
                description="Не вдалося отримати каталог."
                onRetry={() => void result.refetch()}
              />
            ) : result.data.items.length === 0 ? (
              <EmptyState
                action={
                  <Button onClick={clearFilters} variant="secondary">
                    Очистити фільтри
                  </Button>
                }
                description="Спробуйте іншу назву або приберіть частину фільтрів."
                title="Нічого не знайдено"
              />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
                  {result.data.items.map((item) => (
                    <MediaCard
                      item={{
                        id: item.slug,
                        title: item.title,
                        meta: `${item.releaseDate?.slice(0, 4) ?? 'Невідомо'} · ${item.genres[0] ?? (item.type === 'movie' ? 'Фільм' : item.type === 'series' ? 'Серіал' : 'Аніме')}`,
                        posterUrl: item.posterPath,
                      }}
                      key={item.id}
                    />
                  ))}
                </div>
                {result.data.totalPages > 1 && (
                  <nav
                    aria-label="Сторінки каталогу"
                    className="mt-10 flex items-center justify-center gap-3"
                  >
                    <Button
                      aria-label="Попередня сторінка"
                      disabled={page <= 1 || result.isFetching}
                      onClick={() => update('page', String(page - 1), false)}
                      size="icon"
                      variant="secondary"
                    >
                      <ChevronLeft className="size-5" />
                    </Button>
                    <span className="min-w-28 text-center text-sm">
                      {page} із {result.data.totalPages}
                    </span>
                    <Button
                      aria-label="Наступна сторінка"
                      disabled={page >= result.data.totalPages || result.isFetching}
                      onClick={() => update('page', String(page + 1), false)}
                      size="icon"
                      variant="secondary"
                    >
                      <ChevronRight className="size-5" />
                    </Button>
                  </nav>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function FilterSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value?: string) => void;
  options: Array<{ label: string; value: string }>;
  value?: string;
}) {
  return (
    <div className="grid gap-2">
      <span className="text-sm font-semibold">{label}</span>
      <Select
        ariaLabel={label}
        onValueChange={(next) => onChange(next === 'all' ? undefined : next)}
        options={[{ label: 'Усі', value: 'all' }, ...options]}
        placeholder="Усі"
        value={value ?? 'all'}
      />
    </div>
  );
}
