import { Navigate, Outlet, useLocation } from 'react-router';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth/AuthProvider';

export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading')
    return (
      <main className="mx-auto grid min-h-dvh max-w-7xl content-center gap-4 px-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </main>
    );
  if (status !== 'authenticated')
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  return <Outlet />;
}
