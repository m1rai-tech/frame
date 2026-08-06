import { describe, expect, it } from 'vitest';
import { catalogService } from '@/features/catalog/catalog.service';

describe('demo catalog', () => {
  it('filters content by type and search query', async () => {
    const titles = await catalogService.list({ type: 'anime', query: 'паперовий' });
    expect(titles).toHaveLength(1);
    expect(titles[0]?.slug).toBe('paperovyi-misiats');
  });

  it('returns seasons for episodic content', async () => {
    const title = await catalogService.getBySlug('ostannia-platforma');
    expect(title?.seasons[0]?.episodes).toHaveLength(2);
  });

  it('paginates a filtered and sorted catalog', async () => {
    const firstPage = await catalogService.listPage({
      country: 'UA',
      sort: 'title-asc',
      page: 1,
      pageSize: 2,
    });

    expect(firstPage.total).toBe(3);
    expect(firstPage.totalPages).toBe(2);
    expect(firstPage.items).toHaveLength(2);
    expect(
      firstPage.items[0]?.title.localeCompare(firstPage.items[1]?.title ?? '', 'uk'),
    ).toBeLessThan(0);
  });

  it('filters by year, status and original language', async () => {
    const result = await catalogService.listPage({
      year: 2026,
      status: 'ongoing',
      language: 'ja',
    });

    expect(result.items.map((item) => item.slug)).toEqual(['paperovyi-misiats']);
  });
});
