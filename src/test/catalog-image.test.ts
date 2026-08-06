import { describe, expect, it } from 'vitest';
import { validateCatalogImage } from '@/features/admin/catalog-image.service';

describe('catalog image validation', () => {
  it('accepts a supported image under 10 MB', () => {
    expect(validateCatalogImage({ size: 2_000_000, type: 'image/webp' })).toBeUndefined();
  });

  it('rejects unsupported formats', () => {
    expect(validateCatalogImage({ size: 1_000, type: 'image/svg+xml' })).toContain('Підтримуються');
  });

  it('rejects files above the bucket limit', () => {
    expect(validateCatalogImage({ size: 10 * 1024 * 1024 + 1, type: 'image/jpeg' })).toContain(
      '10 МБ',
    );
  });
});
