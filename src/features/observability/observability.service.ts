import type { Json } from '@/services/supabase/database.types';
import { getSupabaseClient, isSupabaseConfigured } from '@/services/supabase/client';

export type AppEventName =
  | 'page_view'
  | 'client_error'
  | 'page_load'
  | 'playback_started'
  | 'playback_completed';

export const normalizeEventPath = (pathname: string) => pathname.slice(0, 300) || '/';
export const safeErrorMessage = (value: unknown) => {
  if (value instanceof Error) return `${value.name}: ${value.message}`.slice(0, 180);
  if (typeof value === 'string') return value.slice(0, 180);
  return 'Unknown client error';
};

export const observabilityService = {
  async isAnalyticsEnabled(userId: string) {
    if (!isSupabaseConfigured()) return false;
    const { data, error } = await getSupabaseClient()
      .from('profile_preferences')
      .select('analytics_enabled')
      .eq('profile_id', userId)
      .single();
    if (error) throw error;
    return data.analytics_enabled;
  },

  async track(eventName: AppEventName, properties: Record<string, Json> = {}) {
    if (!isSupabaseConfigured()) return false;
    const { data, error } = await getSupabaseClient().rpc('record_app_event', {
      p_event_name: eventName,
      p_path: normalizeEventPath(window.location.pathname),
      p_properties: properties,
    });
    if (error) throw error;
    return data;
  },

  captureError(error: unknown, source: string) {
    void this.track('client_error', {
      message: safeErrorMessage(error),
      source: source.slice(0, 60),
    }).catch(() => undefined);
  },

  async health() {
    if (!isSupabaseConfigured()) {
      return { status: 'degraded' as const, database: 'not_configured' as const };
    }
    const startedAt = performance.now();
    const { data, error } = await getSupabaseClient().rpc('get_app_health');
    if (error) throw error;
    return {
      status: 'ok' as const,
      database: 'ok' as const,
      latencyMs: Math.round(performance.now() - startedAt),
      details: data,
    };
  },
};
