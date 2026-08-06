import { useQueries } from '@tanstack/react-query';
import {
  ArrowRight,
  BarChart3,
  Bookmark,
  CalendarDays,
  Captions,
  Check,
  Clock3,
  MonitorSmartphone,
  Play,
  Smartphone,
  Sparkles,
  Tv,
} from 'lucide-react';
import { Link } from 'react-router';
import { env } from '@/app/env';
import { usePageMeta } from '@/app/use-page-meta';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Poster } from '@/components/media/Poster';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs } from '@/components/ui/Tabs';
import { catalogService } from '@/features/catalog/catalog.service';
import type { CatalogTitle, ContentType } from '@/features/catalog/catalog.types';

const categories: Array<{ type: ContentType; label: string }> = [
  { type: 'movie', label: 'Фільми' },
  { type: 'series', label: 'Серіали' },
  { type: 'anime', label: 'Аніме' },
];

const features = [
  {
    icon: Clock3,
    title: 'Продовжуй з потрібного моменту',
    text: 'Прогрес синхронізується між серіями та пристроями.',
  },
  {
    icon: Bookmark,
    title: 'Збирай власні списки',
    text: 'Зберігай заплановане, улюблене й те, що дивишся зараз.',
  },
  {
    icon: BarChart3,
    title: 'Бач свій ритм перегляду',
    text: 'Фільми, епізоди, час перегляду, стріки та нагороди в одному профілі.',
  },
  {
    icon: Captions,
    title: 'Обирай зручну версію',
    text: 'Підтримка доріжок озвучення та субтитрів закладена в плеєр.',
  },
];

const faqs = [
  {
    question: 'Що можна знайти у Frame?',
    answer:
      'Каталог поєднує фільми, серіали та аніме. Доступний контент залежатиме від доданих правовласником відеоматеріалів.',
  },
  {
    question: 'Чи потрібен акаунт для каталогу?',
    answer:
      'Ні. Публічний каталог і сторінки тайтлів доступні без реєстрації. Акаунт потрібен для прогресу, списків і профілю.',
  },
  {
    question: 'На яких пристроях працює сайт?',
    answer: 'Інтерфейс адаптований для телефона, планшета, ноутбука та великого екрана.',
  },
  {
    question: 'Чи будуть субтитри та різні озвучення?',
    answer:
      'Так. Модель каталогу вже підтримує окремі аудіодоріжки й субтитри; їх вибір буде доступний у відеоплеєрі.',
  },
  {
    question: 'Що відбувається з моєю активністю?',
    answer:
      'Історія та прогрес належать користувачу. Налаштування приватності профілю й списків будуть доступні в акаунті.',
  },
];

function CatalogPreview({ items }: { items: CatalogTitle[] }) {
  if (items.length === 0)
    return (
      <p className="rounded-lg border border-border p-8 text-center text-muted">Поки порожньо.</p>
    );
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {items.slice(0, 6).map((item) => (
        <article className="group min-w-0" key={item.id}>
          <Link to={`/title/${item.slug}`}>
            <Poster alt={item.title} src={item.posterPath} />
          </Link>
          <Link
            className="mt-3 block truncate font-medium transition-colors group-hover:text-accent"
            to={`/title/${item.slug}`}
          >
            {item.title}
          </Link>
          <p className="mt-1 truncate text-sm text-muted">
            {item.releaseDate?.slice(0, 4) ?? 'Скоро'}
            {item.genres[0] ? ` · ${item.genres[0]}` : ''}
          </p>
        </article>
      ))}
    </div>
  );
}

export function LandingRoute() {
  usePageMeta({
    title: 'Фільми, серіали й аніме',
    description:
      'Frame — каталог фільмів, серіалів та аніме зі списками, прогресом і статистикою перегляду.',
    path: '/',
  });
  const catalogQueries = useQueries({
    queries: categories.map(({ type }) => ({
      queryKey: ['landing', type],
      queryFn: () => catalogService.listPage({ type, pageSize: 6, sort: 'newest' }),
      staleTime: 60_000,
    })),
  });
  const catalogItems = categories.map((_, index) => catalogQueries[index]?.data?.items ?? []);
  const hero = catalogItems.flat()[0];
  const isCatalogLoading = catalogQueries.some((query) => query.isPending);

  return (
    <div className="min-h-dvh overflow-hidden">
      <a
        className="fixed left-4 top-2 z-[100] -translate-y-16 rounded-md bg-accent px-4 py-2 text-accent-contrast focus:translate-y-0"
        href="#main-content"
      >
        До основного вмісту
      </a>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[var(--header-height)] max-w-7xl items-center gap-6 px-4 sm:px-6">
          <Link className="text-xl font-bold tracking-tight text-accent" to="/">
            {env.VITE_APP_NAME.toUpperCase()}
          </Link>
          <nav aria-label="Головна навігація" className="hidden items-center gap-5 text-sm md:flex">
            <Link className="text-muted hover:text-foreground" to="/browse">
              Каталог
            </Link>
            <a className="text-muted hover:text-foreground" href="#features">
              Можливості
            </a>
            <a className="text-muted hover:text-foreground" href="#faq">
              FAQ
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Button asChild className="hidden sm:inline-flex" variant="ghost">
              <Link to="/login">Увійти</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/register">Почати дивитися</Link>
            </Button>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section className="relative border-b border-border">
          {hero?.backdropPath && (
            <img
              alt=""
              className="absolute inset-0 size-full object-cover opacity-15"
              fetchPriority="high"
              src={hero.backdropPath}
            />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--background)_10%,color-mix(in_srgb,var(--background)_85%,transparent)_55%,var(--background)),linear-gradient(0deg,var(--background),transparent_65%)]" />
          <div className="relative mx-auto grid min-h-[42rem] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:py-24">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-accent">
                Твій простір для історій
              </p>
              <h1 className="mt-5 max-w-3xl text-balance text-5xl font-semibold leading-[1.05] sm:text-7xl">
                Дивись. Зберігай. Продовжуй.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
                Фільми, серіали й аніме в одному спокійному інтерфейсі — зі списками, прогресом та
                історією перегляду.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/register">
                    <Play className="size-4" /> Почати дивитися
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link to="/browse">
                    Відкрити каталог <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
              <p className="mt-5 flex items-center gap-2 text-sm text-muted">
                <Check className="size-4 text-accent" /> Каталог доступний без реєстрації
              </p>
            </div>
            <div aria-label="Добірка каталогу" className="relative hidden h-[32rem] lg:block">
              {(catalogItems[0] ?? []).slice(0, 3).map((item, index) => (
                <Link
                  className="absolute w-48 overflow-hidden rounded-xl border border-border bg-surface-1 shadow-2xl transition-transform hover:-translate-y-2"
                  key={item.id}
                  style={{
                    left: `${index * 25}%`,
                    top: `${index === 1 ? 0 : index === 2 ? 110 : 190}px`,
                    rotate: `${index === 0 ? -7 : index === 2 ? 7 : 1}deg`,
                    zIndex: index === 1 ? 2 : 1,
                  }}
                  to={`/title/${item.slug}`}
                >
                  <Poster alt={item.title} src={item.posterPath} />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6" id="catalog-preview">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-accent">У каталозі</p>
              <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Обери, що дивитися далі</h2>
            </div>
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-accent"
              to="/browse"
            >
              Увесь каталог <ArrowRight className="size-4" />
            </Link>
          </div>
          {isCatalogLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton className="aspect-[2/3]" key={index} />
              ))}
            </div>
          ) : (
            <Tabs
              defaultValue="movie"
              items={categories.map((category, index) => ({
                value: category.type,
                label: category.label,
                content: <CatalogPreview items={catalogItems[index] ?? []} />,
              }))}
            />
          )}
        </section>

        <section className="border-y border-border bg-surface-1" id="features">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
            <p className="text-sm uppercase tracking-[0.18em] text-accent">Без зайвого шуму</p>
            <h2 className="mt-2 max-w-2xl text-3xl font-semibold sm:text-4xl">
              Все важливе для твоєї історії перегляду
            </h2>
            <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, text, title }) => (
                <article className="bg-surface-1 p-6" key={title}>
                  <div className="grid size-11 place-items-center rounded-lg bg-surface-2 text-accent">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 leading-7 text-muted">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-accent">Профіль і активність</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">
              Бач прогрес, не перетворюючи його на роботу
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted">
              У профілі зберігаються переглянуті фільми й епізоди, календар активності, поточний
              стрік і нагороди за важливі етапи.
            </p>
            <ul className="mt-7 grid gap-3 text-sm">
              {[
                'Стрік відвідувань за локальною датою',
                'Окрема статистика фільмів, серіалів та аніме',
                'Нагороди за 10, 30, 60 та більше активних днів',
              ].map((item) => (
                <li className="flex items-center gap-3" key={item}>
                  <Check className="size-4 text-accent" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-surface-1 p-5 shadow-2xl sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Приклад профілю</p>
                <h3 className="mt-1 text-xl font-semibold">Активність перегляду</h3>
              </div>
              <div className="grid size-11 place-items-center rounded-full bg-accent text-accent-contrast">
                <Sparkles className="size-5" />
              </div>
            </div>
            <div className="mt-7 grid grid-cols-7 gap-2" aria-label="Приклад календаря активності">
              {Array.from({ length: 35 }).map((_, index) => (
                <span
                  className={`aspect-square rounded-sm ${index % 6 === 0 || index % 7 === 2 ? 'bg-accent' : index % 3 === 0 ? 'bg-accent/40' : 'bg-surface-2'}`}
                  key={index}
                />
              ))}
            </div>
            <div className="mt-7 grid grid-cols-3 gap-3">
              {[
                ['Фільми', '—'],
                ['Епізоди', '—'],
                ['Стрік', '—'],
              ].map(([label, value]) => (
                <div className="rounded-lg bg-surface-2 p-4" key={label}>
                  <p className="text-xl font-semibold">{value}</p>
                  <p className="mt-1 text-xs text-muted">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-surface-1">
          <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
            <MonitorSmartphone className="mx-auto size-10 text-accent" />
            <h2 className="mt-5 text-3xl font-semibold sm:text-4xl">Дивись на будь-якому екрані</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-muted">
              Адаптивний інтерфейс зберігає зручну навігацію та прогрес на телефоні, ноутбуці й
              великому екрані.
            </p>
            <div className="mt-9 flex justify-center gap-8 text-muted">
              <Smartphone className="size-7" />
              <MonitorSmartphone className="size-7" />
              <Tv className="size-7" />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-24 sm:px-6" id="faq">
          <p className="text-center text-sm uppercase tracking-[0.18em] text-accent">FAQ</p>
          <h2 className="mt-2 text-center text-3xl font-semibold sm:text-4xl">
            Коротко про головне
          </h2>
          <div className="mt-10 divide-y divide-border border-y border-border">
            {faqs.map((item) => (
              <details className="group py-5" key={item.question}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-semibold">
                  {item.question}
                  <span className="text-xl text-accent transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="max-w-3xl pt-4 leading-7 text-muted">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto max-w-7xl rounded-2xl border border-border bg-surface-1 px-6 py-12 text-center sm:px-12">
            <CalendarDays className="mx-auto size-8 text-accent" />
            <h2 className="mt-5 text-3xl font-semibold">Почни власну історію перегляду</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              Створи профіль або спочатку спокійно переглянь відкритий каталог.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link to="/register">Створити профіль</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/browse">Переглянути каталог</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm sm:px-6 md:grid-cols-[1fr_auto]">
          <div>
            <Link className="text-lg font-bold text-accent" to="/">
              {env.VITE_APP_NAME.toUpperCase()}
            </Link>
            <p className="mt-2 max-w-md text-muted">
              Персональний простір для фільмів, серіалів та аніме. Beta.
            </p>
          </div>
          <nav
            aria-label="Посилання у підвалі"
            className="flex flex-wrap gap-x-6 gap-y-3 text-muted"
          >
            <Link to="/browse">Каталог</Link>
            <Link to="/credits">Джерела</Link>
            <Link to="/legal/privacy">Приватність</Link>
            <Link to="/legal/terms">Умови</Link>
            <a href="#faq">FAQ</a>
          </nav>
          <p className="text-muted md:col-span-2">
            © 2026 Frame. Усі права на контент належать відповідним правовласникам.
          </p>
        </div>
      </footer>
    </div>
  );
}
