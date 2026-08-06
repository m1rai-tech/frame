import { Outlet } from 'react-router';
import { NavigationAccessibility } from '@/components/layout/NavigationAccessibility';
import { OperationalMonitoring } from '@/features/observability/OperationalMonitoring';

export function RootLayout() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <NavigationAccessibility />
      <OperationalMonitoring />
      <Outlet />
    </div>
  );
}
