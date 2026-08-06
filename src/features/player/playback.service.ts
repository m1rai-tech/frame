import { getSupabaseClient } from '@/services/supabase/client';

export type PlaybackSession = {
  assetId: string;
  playbackKind: 'hls' | 'embed';
  source: string;
  token: string;
  expiresAt: string;
  variants: PlaybackVariant[];
};
export type PlaybackVariant = {
  assetId: string;
  audioLanguage: string;
  versionLabel: string | null;
};

const isPlaybackVariant = (value: unknown): value is PlaybackVariant =>
  typeof value === 'object' &&
  value !== null &&
  'assetId' in value &&
  typeof value.assetId === 'string' &&
  'audioLanguage' in value &&
  typeof value.audioLanguage === 'string' &&
  'versionLabel' in value &&
  (typeof value.versionLabel === 'string' || value.versionLabel === null);

const isPlaybackSession = (value: unknown): value is PlaybackSession =>
  typeof value === 'object' &&
  value !== null &&
  'assetId' in value &&
  typeof value.assetId === 'string' &&
  'playbackKind' in value &&
  (value.playbackKind === 'hls' || value.playbackKind === 'embed') &&
  'source' in value &&
  typeof value.source === 'string' &&
  'token' in value &&
  typeof value.token === 'string' &&
  'expiresAt' in value &&
  typeof value.expiresAt === 'string' &&
  'variants' in value &&
  Array.isArray(value.variants) &&
  value.variants.every(isPlaybackVariant);

async function invoke(body: Record<string, unknown>): Promise<PlaybackSession> {
  const response = (await getSupabaseClient().functions.invoke('issue-playback-token', {
    body,
  })) as { data: unknown; error: { message: string } | null };
  if (response.error) throw new Error(response.error.message);
  if (!isPlaybackSession(response.data)) throw new Error('Invalid playback response.');
  return response.data;
}

export const playbackService = {
  async issueDemoSession(): Promise<PlaybackSession> {
    return invoke({ demo: true });
  },

  async issueEpisodeSession(episodeId: string, assetId?: string): Promise<PlaybackSession> {
    return invoke({ episodeId, assetId });
  },
};
