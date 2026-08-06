import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { useAuth } from '@/features/auth/AuthProvider';
import { observabilityService } from '@/features/observability/observability.service';

export function OperationalMonitoring() {
  const location = useLocation();
  const { user } = useAuth();
  const consent = useQuery({
    queryKey: ['analytics-consent', user?.id],
    queryFn: () => observabilityService.isAnalyticsEnabled(user!.id),
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000,
  });
  const enabled = consent.data === true && navigator.doNotTrack !== '1';

  useEffect(() => {
    if (!enabled) return;
    void observabilityService.track('page_view').catch(() => undefined);
  }, [enabled, location.pathname]);

  useEffect(() => {
    if (!enabled) return;
    const navigation = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (navigation) {
      void observabilityService
        .track('page_load', {
          domContentLoadedMs: Math.round(navigation.domContentLoadedEventEnd),
          loadMs: Math.round(navigation.loadEventEnd || performance.now()),
        })
        .catch(() => undefined);
    }

    const onError = (event: ErrorEvent) =>
      observabilityService.captureError(event.error ?? event.message, 'window.error');
    const onRejection = (event: PromiseRejectionEvent) =>
      observabilityService.captureError(event.reason, 'unhandledrejection');
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, [enabled]);

  return null;
}
