import { describe, expect, it } from 'vitest';
import { normalizeProfileUsername } from '@/features/profiles/profile.service';

describe('public profile username', () => {
  it('normalizes a valid username', () => {
    expect(normalizeProfileUsername('  User_123 ')).toBe('user_123');
  });

  it('rejects unsafe route values', () => {
    expect(() => normalizeProfileUsername('../admin')).toThrow();
    expect(() => normalizeProfileUsername('юзер')).toThrow();
  });
});
