import { describe, expect, it } from 'vitest';
import { calculateNextStreak } from '@/features/streaks/streak-math';
import { isValidIanaTimeZone, localDateInTimeZone } from '@/features/streaks/timezone';

describe('daily activity streak', () => {
  it('starts at one and does not increment twice on the same day', () => {
    expect(calculateNextStreak(null, '2026-08-06', 0, 0)).toEqual({
      currentStreak: 1,
      longestStreak: 1,
    });
    expect(calculateNextStreak('2026-08-06', '2026-08-06', 5, 8)).toEqual({
      currentStreak: 5,
      longestStreak: 8,
    });
  });

  it('increments on the next local date and resets after a missed date', () => {
    expect(calculateNextStreak('2026-08-06', '2026-08-07', 5, 8)).toEqual({
      currentStreak: 6,
      longestStreak: 8,
    });
    expect(calculateNextStreak('2026-08-06', '2026-08-08', 5, 8)).toEqual({
      currentStreak: 1,
      longestStreak: 8,
    });
  });

  it('uses calendar dates correctly across the Kyiv spring DST transition', () => {
    expect(localDateInTimeZone('2026-03-28T21:30:00Z', 'Europe/Kyiv')).toBe('2026-03-28');
    expect(localDateInTimeZone('2026-03-28T22:30:00Z', 'Europe/Kyiv')).toBe('2026-03-29');
    expect(localDateInTimeZone('2026-03-29T21:30:00Z', 'Europe/Kyiv')).toBe('2026-03-30');
  });

  it('does not create a second day during the New York autumn DST fallback', () => {
    expect(localDateInTimeZone('2026-11-01T05:30:00Z', 'America/New_York')).toBe('2026-11-01');
    expect(localDateInTimeZone('2026-11-01T06:30:00Z', 'America/New_York')).toBe('2026-11-01');
  });

  it('recalculates the calendar date when the profile timezone changes', () => {
    const instant = '2026-08-06T12:00:00Z';
    expect(localDateInTimeZone(instant, 'Pacific/Kiritimati')).toBe('2026-08-07');
    expect(localDateInTimeZone(instant, 'Pacific/Honolulu')).toBe('2026-08-06');
  });

  it('rejects invalid IANA timezone names', () => {
    expect(isValidIanaTimeZone('Europe/Kyiv')).toBe(true);
    expect(isValidIanaTimeZone('UTC+3')).toBe(false);
  });
});
