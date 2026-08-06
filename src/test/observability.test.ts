import {
  normalizeEventPath,
  safeErrorMessage,
} from '@/features/observability/observability.service';

describe('observability privacy guards', () => {
  it('keeps only the provided route path and limits its length', () => {
    expect(normalizeEventPath('/browse')).toBe('/browse');
    expect(normalizeEventPath(`/${'a'.repeat(500)}`)).toHaveLength(300);
    expect(normalizeEventPath('')).toBe('/');
  });

  it('limits error details and does not include a stack trace', () => {
    const error = new Error('x'.repeat(300));
    const message = safeErrorMessage(error);
    expect(message).toHaveLength(180);
    expect(message).not.toContain('observability.test');
  });

  it('uses a generic label for non-text errors', () => {
    expect(safeErrorMessage({ secret: 'value' })).toBe('Unknown client error');
  });
});
