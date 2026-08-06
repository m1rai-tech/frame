import { describe, expect, it } from 'vitest';
import { createImportSlug } from '@/features/admin/tmdb-import.service';

describe('TMDB import helpers', () => {
  it('creates a URL-safe slug from a Latin title', () => {
    expect(createImportSlug('Dune: Part Two', 693134)).toBe('dune-part-two');
  });

  it('uses a stable TMDB fallback for non-Latin titles', () => {
    expect(createImportSlug('Дюна', 438631)).toBe('tmdb-438631');
  });
});
