import { getSupabaseClient } from '@/services/supabase/client';

export const authService = {
  signIn: (email: string, password: string) =>
    getSupabaseClient().auth.signInWithPassword({ email, password }),
  signUp: (email: string, password: string, displayName: string) =>
    getSupabaseClient().auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    }),
  signOut: () => getSupabaseClient().auth.signOut(),
  sendPasswordReset: (email: string) =>
    getSupabaseClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    }),
  updatePassword: (password: string) => getSupabaseClient().auth.updateUser({ password }),
};
