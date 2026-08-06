import { cn } from '@/lib/cn';
import type { ActivityDay } from './profile-stats.service';
import { buildHeatmapDays } from './stats-format';

const intensity = (visits: number) => {
  if (visits >= 3) return 'bg-accent';
  if (visits === 2) return 'bg-accent/70';
  if (visits === 1) return 'bg-accent/35';
  return 'bg-surface-2';
};

export function ActivityHeatmap({ activity }: { activity: ActivityDay[] }) {
  const days = buildHeatmapDays(activity);
  return (
    <div className="overflow-x-auto pb-2">
      <div aria-label="Активність за останні 365 днів" className="grid w-max grid-flow-col grid-rows-7 gap-1" role="img">
        {days.map((day) => (
          <span aria-label={`${day.date}: ${day.visits} відвідувань`} className={cn('size-3 rounded-[3px] border border-border/40', intensity(day.visits))} key={day.date} title={`${day.date}: ${day.visits} відвідувань`} />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1 text-xs text-muted">
        <span className="mr-1">Менше</span>
        {[0, 1, 2, 3].map((value) => <span className={cn('size-3 rounded-[3px]', intensity(value))} key={value} />)}
        <span className="ml-1">Більше</span>
      </div>
    </div>
  );
}
