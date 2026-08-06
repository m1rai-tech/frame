import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/app/env';
import type { Database } from '@/services/supabase/database.types';

let client: SupabaseClient<Database> | undefined;

export function isSupabaseConfigured() {
  return Boolean(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_PUBLISHABLE_KEY);
}

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      'Supabase is not configured. Add the public URL and publishable key to .env.local.',
    );
  }

  client ??= createClient<Database>(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return client;
}
