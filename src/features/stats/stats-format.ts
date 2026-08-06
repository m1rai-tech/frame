import type { ActivityDay } from './profile-stats.service';

export type HeatmapDay = { date: string; visits: number };

export function buildHeatmapDays(activity: ActivityDay[], endDate = new Date()): HeatmapDay[] {
  const visits = new Map(activity.map((day) => [day.date, day.visits]));
  const end = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));
  return Array.from({ length: 365 }, (_, index) => {
    const date = new Date(end);
    date.setUTCDate(end.getUTCDate() - (364 - index));
    const key = date.toISOString().slice(0, 10);
    return { date: key, visits: visits.get(key) ?? 0 };
  });
}

export function formatWatchDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours === 0) return `${minutes} хв`;
  return `${hours} год ${minutes % 60} хв`;
}
