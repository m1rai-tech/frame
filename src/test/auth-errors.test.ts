import { describe, expect, it } from 'vitest';
import { getAuthErrorMessage } from '@/features/auth/auth-errors';

describe('getAuthErrorMessage', () => {
  it('translates invalid credentials', () => {
    expect(getAuthErrorMessage(new Error('Invalid login credentials'))).toBe(
      'Неправильний email або пароль.',
    );
  });

  it('does not expose unknown backend errors', () => {
    expect(getAuthErrorMessage(new Error('database internal details'))).toBe(
      'Не вдалося виконати дію. Спробуйте ще раз.',
    );
  });
});
