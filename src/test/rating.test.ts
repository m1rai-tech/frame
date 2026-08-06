import { describe, expect, it } from 'vitest';
import { normalizeRating } from '@/features/ratings/rating.service';

describe('ratings', () => {
  it('accepts integer scores from 1 to 10', () => {
    expect(normalizeRating(1)).toBe(1);
    expect(normalizeRating(10)).toBe(10);
  });

  it('rejects scores outside the range and fractions', () => {
    expect(() => normalizeRating(0)).toThrow();
    expect(() => normalizeRating(11)).toThrow();
    expect(() => normalizeRating(7.5)).toThrow();
  });
});
