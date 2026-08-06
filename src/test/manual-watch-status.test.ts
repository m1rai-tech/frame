import { describe, expect, it } from 'vitest';
import { isScopeWatched } from '@/features/watch-progress/manual-watch-status.service';

describe('manual watch status', () => {
  it('requires every episode in a season or title to be completed', () => {
    expect(isScopeWatched(['e1', 'e2'], new Set(['e1', 'e2']))).toBe(true);
    expect(isScopeWatched(['e1', 'e2'], new Set(['e1']))).toBe(false);
  });

  it('uses the standalone movie status when there are no episodes', () => {
    expect(isScopeWatched([], new Set(), true)).toBe(true);
    expect(isScopeWatched([], new Set(), false)).toBe(false);
  });
});
