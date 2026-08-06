import { useQuery } from '@tanstack/react-query';
import { Activity, CircleAlert, CircleCheck } from 'lucide-react';
import { usePageMeta } from '@/app/use-page-meta';
import { Button } from '@/components/ui/Button';
import { observabilityService } from '@/features/observability/observability.service';

export function HealthRoute() {
  const health = useQuery({
    queryKey: ['app-health'],
    queryFn: () => observabilityService.health(),
    retry: 1,
    refetchInterval: 60_000,
  });
  usePageMeta({
    title: 'Стан системи',
    description: 'Перевірка доступності Frame та з’єднання з базою даних.',
    path: '/health',
    robots: 'noindex,nofollow',
  });

  const healthy = health.data?.status === 'ok' && !health.isError;
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 text-foreground">
      <section className="w-full max-w-xl rounded-2xl border border-border bg-surface-1 p-7 shadow-xl">
        <p className="flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-accent">
          <Activity className="size-4" /> Frame status
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Стан системи</h1>
        <div aria-live="polite" className="mt-7 rounded-xl border border-border bg-surface-2 p-5">
          {health.isPending ? (
            <p className="text-muted">Перевіряємо компоненти…</p>
          ) : healthy ? (
            <div className="flex items-start gap-3">
              <CircleCheck className="mt-0.5 size-6 text-success" />
              <div><p className="font-semibold">Усі системи працюють</p><p className="mt-1 text-sm text-muted">База даних відповіла за {health.data.latencyMs} мс.</p></div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 size-6 text-danger" />
              <div><p className="font-semibold">Сервіс працює частково</p><p className="mt-1 text-sm text-muted">Не вдалося підтвердити з’єднання з базою даних.</p></div>
            </div>
          )}
        </div>
        <div className="mt-5 flex items-center justify-between gap-4 text-sm text-muted">
          <span>Автооновлення щохвилини</span>
          <Button onClick={() => void health.refetch()} size="sm" variant="secondary">Перевірити знову</Button>
        </div>
      </section>
    </main>
  );
}
