import { ExternalLink } from 'lucide-react';
import { usePageMeta } from '@/app/use-page-meta';
import { AppShell } from '@/components/layout/AppShell';

const tmdbLogo =
  'https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg';

export function CreditsRoute() {
  usePageMeta({
    title: 'Джерела та атрибуція',
    description:
      'Джерела метаданих каталогу Frame, атрибуція TMDB та правила використання відеоконтенту.',
    path: '/credits',
  });
  return (
    <AppShell>
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <p className="text-sm uppercase tracking-[0.2em] text-accent">Про проєкт</p>
        <h1 className="mt-2 text-4xl font-semibold">Джерела та атрибуція</h1>
        <p className="mt-4 max-w-2xl leading-7 text-muted">
          Тут зазначені зовнішні джерела метаданих і зображень. Наявність сторінки тайтлу не означає
          наявність прав на його трансляцію.
        </p>

        <section className="mt-10 rounded-xl border border-border bg-surface-1 p-6 sm:p-8">
          <a
            aria-label="Відкрити The Movie Database"
            className="inline-block"
            href="https://www.themoviedb.org"
            rel="noreferrer"
            target="_blank"
          >
            <img alt="The Movie Database (TMDB)" className="h-24 w-auto" src={tmdbLogo} />
          </a>
          <h2 className="mt-6 text-2xl font-semibold">The Movie Database (TMDB)</h2>
          <p className="mt-4 leading-7">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
          <p className="mt-3 leading-7 text-muted">
            Частина назв, описів, дат, жанрів і промозображень може надходити через TMDB API. TMDB
            надає метадані та зображення, але не надає відеофайли або права на їх трансляцію.
          </p>
          <a
            className="mt-5 inline-flex items-center gap-2 text-accent underline underline-offset-4"
            href="https://www.themoviedb.org"
            rel="noreferrer"
            target="_blank"
          >
            Відкрити TMDB <ExternalLink className="size-4" />
          </a>
        </section>

        <section className="mt-6 rounded-xl border border-border bg-surface-1 p-6 sm:p-8">
          <h2 className="text-2xl font-semibold">Відеоконтент</h2>
          <p className="mt-4 leading-7 text-muted">
            Платформа має використовувати лише власні, ліцензовані або відкриті відеоматеріали з
            дозволом на показ. TMDB не є джерелом відеопотоків.
          </p>
        </section>
      </main>
    </AppShell>
  );
}
