import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth/AuthProvider';
import { profileService } from '@/features/profiles/profile.service';

export function MyProfileRoute() {
  const { user } = useAuth();
  const profile = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => profileService.get(user!.id),
    enabled: Boolean(user),
  });
  if (profile.data) return <Navigate replace to={`/profile/${profile.data.username}`} />;
  return <AppShell><div className="mx-auto max-w-5xl px-4 py-12 sm:px-6"><Skeleton className="aspect-[3/1]" /><Skeleton className="mt-6 h-52" /></div></AppShell>;
}
