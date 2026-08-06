import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authService } from '@/features/auth/auth-service';
import { getSupabaseClient, isSupabaseConfigured } from '@/services/supabase/client';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'unconfigured';
type AuthContextValue = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const configured = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>(configured ? 'loading' : 'unconfigured');

  useEffect(() => {
    if (!configured) return;
    const client = getSupabaseClient();
    void client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setStatus(data.session ? 'authenticated' : 'unauthenticated');
    });
    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setStatus(nextSession ? 'authenticated' : 'unauthenticated');
    });
    return () => data.subscription.unsubscribe();
  }, [configured]);

  const signOut = useCallback(async () => {
    await authService.signOut();
  }, []);
  const value = useMemo(
    () => ({ session, signOut, status, user: session?.user ?? null }),
    [session, signOut, status],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
