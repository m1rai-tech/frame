import { useCallback, useEffect, useRef } from 'react';
import { env } from '@/app/env';
import { getSupabaseClient } from '@/services/supabase/client';

export type PlaybackSnapshot = {
  positionSeconds: number;
  durationSeconds: number;
  isPlaying: boolean;
  ended?: boolean;
};

type ProgressPayload = {
  titleId: string;
  episodeId?: string;
  clientSessionId: string;
  positionSeconds: number;
  durationSeconds: number;
  watchedDeltaSeconds: number;
  completed: boolean;
  final: boolean;
};

const toRpcBody = (payload: ProgressPayload) => ({
  p_title_id: payload.titleId,
  p_episode_id: payload.episodeId ?? null,
  p_position_seconds: Math.max(0, Math.floor(payload.positionSeconds)),
  p_duration_seconds: payload.durationSeconds > 0 ? Math.floor(payload.durationSeconds) : null,
  p_client_session_id: payload.clientSessionId,
  p_watched_delta_seconds: Math.max(0, Math.floor(payload.watchedDeltaSeconds)),
  p_completed: payload.completed,
  p_final: payload.final,
});

export const watchProgressService = {
  async getResumePosition(episodeId: string) {
    const { data, error } = await getSupabaseClient()
      .from('watch_progress')
      .select('position_seconds, completed')
      .eq('episode_id', episodeId)
      .is('hidden_at', null)
      .maybeSingle();
    if (error) throw error;
    return data && !data.completed ? data.position_seconds : 0;
  },
  async save(payload: ProgressPayload) {
    const { error } = await getSupabaseClient().rpc('record_watch_progress', toRpcBody(payload));
    if (error) throw error;
  },
  saveOnExit(payload: ProgressPayload, accessToken: string) {
    if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_PUBLISHABLE_KEY) return;
    void fetch(`${env.VITE_SUPABASE_URL}/rest/v1/rpc/record_watch_progress`, {
      method: 'POST',
      headers: {
        apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(toRpcBody(payload)),
      keepalive: true,
    }).catch(() => undefined);
  },
};

export function useWatchProgress({
  accessToken,
  episodeId,
  titleId,
}: {
  accessToken?: string;
  episodeId?: string;
  titleId?: string;
}) {
  const clientSessionId = useRef(crypto.randomUUID());
  const latest = useRef<PlaybackSnapshot | undefined>(undefined);
  const lastSampleAt = useRef<number | undefined>(undefined);
  const accumulatedSeconds = useRef(0);
  const lastHeartbeatAt = useRef(0);
  const saving = useRef(false);

  const buildPayload = useCallback(
    (final: boolean): ProgressPayload | undefined => {
      if (!titleId || !latest.current) return;
      const watchedDeltaSeconds = Math.floor(accumulatedSeconds.current);
      accumulatedSeconds.current -= watchedDeltaSeconds;
      return {
        titleId,
        episodeId,
        clientSessionId: clientSessionId.current,
        positionSeconds: latest.current.positionSeconds,
        durationSeconds: latest.current.durationSeconds,
        watchedDeltaSeconds,
        completed: Boolean(latest.current.ended),
        final,
      };
    },
    [episodeId, titleId],
  );

  const persist = useCallback(
    async (final: boolean) => {
      if (saving.current) return;
      const payload = buildPayload(final);
      if (!payload) return;
      saving.current = true;
      lastHeartbeatAt.current = Date.now();
      try {
        await watchProgressService.save(payload);
      } catch {
        accumulatedSeconds.current += payload.watchedDeltaSeconds;
      } finally {
        saving.current = false;
      }
    },
    [buildPayload],
  );

  const persistOnExit = useCallback(() => {
    if (!accessToken) return;
    const payload = buildPayload(true);
    if (payload) watchProgressService.saveOnExit(payload, accessToken);
  }, [accessToken, buildPayload]);

  const onProgress = useCallback(
    (snapshot: PlaybackSnapshot) => {
      const now = performance.now();
      if (latest.current?.isPlaying && lastSampleAt.current !== undefined) {
        accumulatedSeconds.current += Math.min(5, (now - lastSampleAt.current) / 1000);
      }
      latest.current = snapshot;
      lastSampleAt.current = now;
      if (snapshot.ended || !snapshot.isPlaying) void persist(true);
      else if (Date.now() - lastHeartbeatAt.current >= 15_000) void persist(false);
    },
    [persist],
  );

  useEffect(() => {
    const onPageHide = () => persistOnExit();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') persistOnExit();
    };
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('visibilitychange', onVisibility);
      persistOnExit();
    };
  }, [persistOnExit]);

  return { onProgress };
}
