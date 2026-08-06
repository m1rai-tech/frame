import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Download, Search } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import {
  createImportSlug,
  tmdbImportService,
  type TmdbKind,
  type TmdbPreview,
} from '@/features/admin/tmdb-import.service';
import type { ContentType } from '@/features/catalog/catalog.types';

export function AdminImportsRoute() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [kind, setKind] = useState<TmdbKind>('movie');
  const [preview, setPreview] = useState<TmdbPreview>();
  const [slug, setSlug] = useState('');
  const [contentType, setContentType] = useState<ContentType>('movie');
  const search = useMutation({
    mutationFn: ({ query, searchKind }: { query: string; searchKind: TmdbKind }) =>
      tmdbImportService.search(query, searchKind),
    onSuccess: () => setPreview(undefined),
  });
  const details = useMutation({
    mutationFn: ({ id, resultKind }: { id: number; resultKind: TmdbKind }) =>
      tmdbImportService.details(id, resultKind),
    onSuccess: (data) => {
      setPreview(data);
      setSlug(createImportSlug(data.originalTitle || data.title, data.tmdbId));
      setContentType(data.suggestedType);
    },
  });
  const importDraft = useMutation({
    mutationFn: () => {
      if (!preview) throw new Error('Preview is missing');
      return tmdbImportService.createDraft(preview, slug, contentType);
    },
    onSuccess: async ({ id, importedEpisodes, importedSeasons }) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'titles'] });
      showToast({
        title: 'TMDB-метадані імпортовано',
        description:
          preview?.kind === 'tv'
            ? `Додано сезонів: ${importedSeasons}, епізодів: ${importedEpisodes}. Усе збережено як чернетки.`
            : 'Тайтл збережено як чернетку.',
      });
      void navigate(`/admin/titles/${id}`);
    },
  });
  const integrationError = search.error || details.error || importDraft.error;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Button asChild size="sm" variant="ghost">
          <Link to="/admin/titles">
            <ArrowLeft className="size-4" /> До каталогу
          </Link>
        </Button>
        <header className="mt-6">
          <p className="text-sm uppercase tracking-[0.2em] text-accent">Editor · TMDB</p>
          <h1 className="mt-2 text-3xl font-semibold">Імпорт метаданих</h1>
          <p className="mt-3 max-w-3xl text-muted">
            Знайдіть фільм або серіал, перевірте дані та створіть чернетку. Імпорт не додає відео і
            не надає прав на трансляцію.
          </p>
        </header>

        <form
          className="mt-8 grid gap-4 rounded-lg border border-border bg-surface-1 p-5 md:grid-cols-[10rem_1fr_auto] md:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            const value = new FormData(event.currentTarget).get('query');
            if (typeof value === 'string' && value.trim())
              search.mutate({ query: value.trim(), searchKind: kind });
          }}
        >
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Джерело</span>
            <select
              className="h-11 rounded-md border border-border bg-surface-1 px-3"
              onChange={(event) => setKind(event.target.value as TmdbKind)}
              value={kind}
            >
              <option value="movie">Фільми</option>
              <option value="tv">Серіали / аніме</option>
            </select>
          </label>
          <Input label="Назва" name="query" placeholder="Наприклад, Dune" required />
          <Button disabled={search.isPending} type="submit">
            <Search className="size-4" /> Знайти
          </Button>
        </form>

        {integrationError && (
          <p className="mt-5 rounded-md border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
            {integrationError instanceof Error
              ? integrationError.message
              : 'Інтеграція недоступна. Оновіть сторінку та спробуйте ще раз.'}
          </p>
        )}

        {search.data && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold">Результати</h2>
            {search.data.length === 0 ? (
              <p className="mt-4 text-muted">Нічого не знайдено.</p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {search.data.map((item) => (
                  <article
                    className="grid grid-cols-[5rem_1fr] gap-4 rounded-lg border border-border bg-surface-1 p-3"
                    key={item.id}
                  >
                    {item.posterUrl ? (
                      <img
                        alt=""
                        className="aspect-[2/3] w-20 rounded object-cover"
                        loading="lazy"
                        src={item.posterUrl}
                      />
                    ) : (
                      <div className="aspect-[2/3] w-20 rounded bg-surface-2" />
                    )}
                    <div className="min-w-0">
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="mt-1 text-sm text-muted">
                        {item.releaseDate?.slice(0, 4) || 'Рік невідомий'} · TMDB #{item.id}
                      </p>
                      <Button
                        className="mt-4"
                        disabled={details.isPending}
                        onClick={() => details.mutate({ id: item.id, resultKind: item.kind })}
                        size="sm"
                        variant="secondary"
                      >
                        Переглянути
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {preview && (
          <section className="mt-8 grid gap-6 rounded-lg border border-border bg-surface-1 p-5 lg:grid-cols-[12rem_1fr]">
            {preview.posterUrl ? (
              <img
                alt={`Постер «${preview.title}»`}
                className="aspect-[2/3] w-full rounded-md object-cover"
                src={preview.posterUrl}
              />
            ) : (
              <div className="aspect-[2/3] rounded-md bg-surface-2" />
            )}
            <div>
              <p className="text-sm text-accent">Попередній перегляд</p>
              <h2 className="mt-2 text-2xl font-semibold">{preview.title}</h2>
              <p className="mt-2 text-sm text-muted">{preview.originalTitle}</p>
              <p className="mt-4 leading-7">{preview.synopsis || 'Опис відсутній.'}</p>
              <p className="mt-4 text-sm text-muted">
                {preview.releaseDate || 'Дата невідома'} ·{' '}
                {preview.genres.map((genre) => genre.name).join(', ') || 'Без жанрів'}
              </p>
              <p className="mt-2 text-sm text-muted">
                Студії: {preview.studios.map((studio) => studio.name).join(', ') || 'не вказані'} ·
                Учасників: {preview.credits.length}
                {preview.ageRating ? ` · Рейтинг: ${preview.ageRating}` : ''}
              </p>
              {preview.kind === 'tv' && (
                <p className="mt-2 text-sm text-muted">
                  Буде імпортовано сезонів: {preview.seasons.length}, епізодів приблизно:{' '}
                  {preview.seasons.reduce((total, season) => total + season.episodeCount, 0)}.
                </p>
              )}
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Input
                  label="Slug чернетки"
                  onChange={(event) => setSlug(event.target.value)}
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  value={slug}
                />
                <label className="grid gap-2 text-sm">
                  <span className="font-medium">Категорія на сайті</span>
                  <select
                    className="h-11 rounded-md border border-border bg-surface-1 px-3"
                    onChange={(event) => setContentType(event.target.value as ContentType)}
                    value={contentType}
                  >
                    {preview.kind === 'movie' ? (
                      <option value="movie">Фільм</option>
                    ) : (
                      <>
                        <option value="series">Серіал</option>
                        <option value="anime">Аніме</option>
                      </>
                    )}
                  </select>
                </label>
              </div>
              <Button
                className="mt-5"
                disabled={importDraft.isPending || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)}
                onClick={() => importDraft.mutate()}
              >
                <Download className="size-4" />
                {preview.kind === 'tv'
                  ? 'Імпортувати серіал, сезони та епізоди'
                  : 'Імпортувати як чернетку'}
              </Button>
            </div>
          </section>
        )}

        <p className="mt-8 text-sm text-muted">
          This product uses the TMDB API but is not endorsed or certified by TMDB. Деталі — на
          сторінці{' '}
          <Link className="text-accent underline" to="/credits">
            джерел
          </Link>
          .
        </p>
      </div>
    </AppShell>
  );
}
