import { useQuery } from '@tanstack/react-query';
import { Navigate, Outlet } from 'react-router';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth/AuthProvider';
import { getSupabaseClient, isSupabaseConfigured } from '@/services/supabase/client';

export function RequireEditor() {
  const { user } = useAuth();
  const roles = useQuery({
    enabled: Boolean(user && isSupabaseConfigured()),
    queryKey: ['roles', user?.id],
    queryFn: async () => {
      const { data, error } = await getSupabaseClient()
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id ?? '');
      if (error) throw error;
      return data.map(({ role }) => role);
    },
  });
  if (!isSupabaseConfigured()) return <Navigate replace to="/browse" />;
  if (roles.isPending)
    return (
      <main className="mx-auto grid min-h-dvh max-w-5xl content-center gap-3 px-6">
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-5 w-80" />
      </main>
    );
  if (!roles.data?.some((role) => role === 'editor' || role === 'admin'))
    return <Navigate replace to="/browse" />;
  return <Outlet />;
}
