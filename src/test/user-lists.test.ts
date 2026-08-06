import { describe, expect, it } from 'vitest';
import { normalizeListName } from '@/features/watch-progress/user-lists.service';

describe('user lists', () => {
  it('normalizes whitespace in a custom list name', () => {
    expect(normalizeListName('  На   вихідні  ')).toBe('На вихідні');
  });

  it('rejects empty and oversized names', () => {
    expect(() => normalizeListName('   ')).toThrow();
    expect(() => normalizeListName('а'.repeat(81))).toThrow();
  });
});
