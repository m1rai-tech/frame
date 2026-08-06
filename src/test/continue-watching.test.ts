import { describe, expect, it } from 'vitest';
import { toProgressPercent } from '@/features/watch-progress/continue-watching.service';

describe('continue watching progress', () => {
  it('calculates and rounds a percentage', () => {
    expect(toProgressPercent(45, 100)).toBe(45);
    expect(toProgressPercent(1, 3)).toBe(33);
  });

  it('keeps the percentage within the progress bar range', () => {
    expect(toProgressPercent(120, 100)).toBe(100);
    expect(toProgressPercent(-10, 100)).toBe(0);
    expect(toProgressPercent(10, null)).toBe(0);
  });
});
