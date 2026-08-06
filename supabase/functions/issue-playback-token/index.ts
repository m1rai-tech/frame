import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};
const demoSource = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
const encoder = new TextEncoder();
const toBase64Url = (bytes: Uint8Array) => {
  let binary = '';
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
};
const encodeJson = (value: Record<string, unknown>) =>
  toBase64Url(encoder.encode(JSON.stringify(value)));

async function signPlaybackToken(payload: Record<string, unknown>, secret: string) {
  const header = encodeJson({ alg: 'HS256', typ: 'JWT' });
  const body = encodeJson(payload);
  const unsigned = `${header}.${body}`;
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(unsigned));
  return `${unsigned}.${toBase64Url(new Uint8Array(signature))}`;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST')
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders });

  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization)
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const publishableKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const playbackSecret = Deno.env.get('PLAYBACK_TOKEN_SECRET');
    if (!supabaseUrl || !publishableKey || !serviceRoleKey || !playbackSecret)
      throw new Error('Playback integration is not configured.');

    const userClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: authorization } },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user)
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });

    const body = (await request.json()) as {
      assetId?: string;
      demo?: boolean;
      episodeId?: string;
      titleId?: string;
    };
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 5 * 60;
    let assetId = 'demo-big-buck-bunny';
    let playbackKind: 'hls' | 'embed' = 'hls';
    let source = demoSource;
    let variants: Array<{ assetId: string; audioLanguage: string; versionLabel: string | null }> = [
      { assetId, audioLanguage: 'und', versionLabel: 'Demo' },
    ];

    if (!body.demo) {
      if (!body.episodeId && !body.titleId)
        return Response.json(
          { error: 'Missing playback target' },
          { status: 400, headers: corsHeaders },
        );
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      });
      let query = adminClient
        .from('video_assets')
        .select(
          'id, provider, provider_asset_id, requires_entitlement, audio_language, version_label',
        )
        .eq('status', 'ready');
      query = body.episodeId
        ? query.eq('episode_id', body.episodeId)
        : query.eq('title_id', body.titleId!);
      const { data: assets, error } = await query.order('created_at');
      if (error) throw error;
      const asset = body.assetId
        ? assets?.find((candidate) => candidate.id === body.assetId)
        : assets?.[0];
      if (!asset)
        return Response.json(
          { error: 'Playback asset not found' },
          { status: 404, headers: corsHeaders },
        );
      if (asset.requires_entitlement)
        return Response.json(
          { error: 'Entitlement required' },
          { status: 403, headers: corsHeaders },
        );
      if (asset.provider !== 'direct_hls' && asset.provider !== 'official_embed')
        return Response.json(
          { error: 'Playback provider adapter is not configured' },
          { status: 422, headers: corsHeaders },
        );
      const directUrl = new URL(asset.provider_asset_id);
      if (directUrl.protocol !== 'https:')
        return Response.json(
          { error: 'Invalid playback asset' },
          { status: 422, headers: corsHeaders },
        );
      if (asset.provider === 'official_embed') {
        const allowedHosts = (Deno.env.get('EMBED_ALLOWED_HOSTS') ?? '')
          .split(',')
          .map((host) => host.trim().toLowerCase())
          .filter(Boolean);
        if (!allowedHosts.includes(directUrl.hostname.toLowerCase()))
          return Response.json(
            { error: 'Embed provider is not allowed' },
            { status: 422, headers: corsHeaders },
          );
        playbackKind = 'embed';
      }
      assetId = asset.id;
      source = directUrl.toString();
      variants = (assets ?? []).map((candidate) => ({
        assetId: candidate.id,
        audioLanguage: candidate.audio_language,
        versionLabel: candidate.version_label,
      }));
    }

    const token = await signPlaybackToken(
      {
        sub: user.id,
        asset_id: assetId,
        purpose: 'playback',
        jti: crypto.randomUUID(),
        iat: now,
        exp: expiresAt,
      },
      playbackSecret,
    );
    return Response.json(
      {
        assetId,
        playbackKind,
        source,
        token,
        variants,
        expiresAt: new Date(expiresAt * 1000).toISOString(),
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders },
    );
  }
});
