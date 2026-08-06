import { useEffect } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { observabilityService } from '@/features/observability/observability.service';

export function RouteErrorBoundary() {
  const error = useRouteError();
  useEffect(() => {
    observabilityService.captureError(error, 'route_error_boundary');
  }, [error]);
  const message = isRouteErrorResponse(error)
    ? `${error.status}: ${error.statusText}`
    : 'Сталася непередбачена помилка.';

  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="text-sm text-muted">Frame</p>
        <h1 className="mt-2 text-2xl font-semibold">Не вдалося відкрити сторінку</h1>
        <p className="mt-3 text-muted">{message}</p>
        <a className="mt-6 inline-flex text-accent underline-offset-4 hover:underline" href="/">
          Повернутися на головну
        </a>
      </div>
    </main>
  );
}
