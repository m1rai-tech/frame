import { Film } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({
  action,
  description,
  title,
}: {
  action?: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed border-border bg-surface-1 px-6 py-12 text-center">
      <Film className="size-8 text-accent" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
