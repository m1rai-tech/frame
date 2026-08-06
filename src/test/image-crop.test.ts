import { describe, expect, it } from 'vitest';
import { calculateCropRect } from '@/features/profiles/image-crop';

describe('profile image crop', () => {
  it('creates a centered square from a landscape image', () => {
    expect(calculateCropRect(1200, 800, 1, 1, 0, 0)).toEqual({
      sx: 200, sy: 0, sw: 800, sh: 800,
    });
  });

  it('applies zoom and keeps offsets within the source image', () => {
    const crop = calculateCropRect(1200, 800, 3, 2, 1, -1);
    expect(crop.sx).toBeGreaterThanOrEqual(0);
    expect(crop.sy).toBeGreaterThanOrEqual(0);
    expect(crop.sx + crop.sw).toBeLessThanOrEqual(1200);
    expect(crop.sy + crop.sh).toBeLessThanOrEqual(800);
  });
});
