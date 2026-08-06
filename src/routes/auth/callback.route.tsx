import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth/AuthProvider';

export function AuthCallbackRoute() {
  const { status } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (status === 'authenticated') void navigate('/onboarding', { replace: true });
    if (status === 'unauthenticated') void navigate('/login', { replace: true });
  }, [navigate, status]);
  return (
    <main className="mx-auto grid min-h-dvh max-w-lg content-center gap-4 px-6">
      <Skeleton className="h-8 w-56" />
      <p className="text-muted">Підтверджуємо безпечний вхід…</p>
    </main>
  );
}
