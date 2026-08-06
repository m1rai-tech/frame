import { buildHeatmapDays, formatWatchDuration } from '@/features/stats/stats-format';

describe('profile statistics helpers', () => {
  it('builds exactly 365 UTC calendar days and maps activity', () => {
    const days = buildHeatmapDays([{ date: '2026-08-06', visits: 2 }], new Date('2026-08-06T23:30:00Z'));
    expect(days).toHaveLength(365);
    expect(days[0]?.date).toBe('2025-08-07');
    expect(days.at(-1)).toEqual({ date: '2026-08-06', visits: 2 });
  });

  it('formats accumulated watch time', () => {
    expect(formatWatchDuration(59)).toBe('0 хв');
    expect(formatWatchDuration(5_460)).toBe('1 год 31 хв');
  });
});
