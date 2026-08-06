import type { Database } from '@/services/supabase/database.types';
import { getSupabaseClient } from '@/services/supabase/client';

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export const profileImageUrl = (bucket: 'avatars' | 'profile-banners', path?: string | null) => {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return getSupabaseClient().storage.from(bucket).getPublicUrl(path).data.publicUrl;
};

export const normalizeProfileUsername = (username: string) => {
  const normalized = username.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_]{2,29}$/.test(normalized))
    throw new Error('Invalid profile username');
  return normalized;
};

const uploadImage = async (
  bucket: 'avatars' | 'profile-banners',
  userId: string,
  blob: Blob,
) => {
  if (!imageTypes.includes(blob.type) || blob.size > 5 * 1024 * 1024)
    throw new Error('Зображення має бути JPG, PNG, WebP або AVIF до 5 MB.');
  const path = `${userId}/${crypto.randomUUID()}.webp`;
  const { error } = await getSupabaseClient().storage
    .from(bucket)
    .upload(path, blob, { contentType: 'image/webp', upsert: false });
  if (error) throw error;
  return path;
};

export const profileService = {
  async getByUsername(username: string) {
    const { data, error } = await getSupabaseClient()
      .from('profiles')
      .select('*')
      .eq('username', normalizeProfileUsername(username))
      .maybeSingle();
    if (error) throw error;
    return data ?? undefined;
  },

  async get(userId: string) {
    const { data, error } = await getSupabaseClient()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async save(
    userId: string,
    values: {
      username: string;
      displayName: string;
      bio: string;
      timezone: string;
      locale: string;
      accentColor: string;
    },
    current: { avatarPath?: string | null; bannerPath?: string | null },
    images: { avatar?: Blob; banner?: Blob },
  ) {
    const uploaded: Array<{ bucket: 'avatars' | 'profile-banners'; path: string }> = [];
    try {
      const avatarPath = images.avatar
        ? await uploadImage('avatars', userId, images.avatar).then((path) => {
            uploaded.push({ bucket: 'avatars', path });
            return path;
          })
        : current.avatarPath;
      const bannerPath = images.banner
        ? await uploadImage('profile-banners', userId, images.banner).then((path) => {
            uploaded.push({ bucket: 'profile-banners', path });
            return path;
          })
        : current.bannerPath;
      const { error } = await getSupabaseClient()
        .from('profiles')
        .update({
          username: values.username,
          display_name: values.displayName,
          bio: values.bio || null,
          timezone: values.timezone,
          locale: values.locale,
          accent_color: values.accentColor,
          avatar_path: avatarPath ?? null,
          banner_path: bannerPath ?? null,
        })
        .eq('id', userId);
      if (error) throw error;

      const oldFiles = [
        images.avatar && current.avatarPath
          ? { bucket: 'avatars' as const, path: current.avatarPath }
          : undefined,
        images.banner && current.bannerPath
          ? { bucket: 'profile-banners' as const, path: current.bannerPath }
          : undefined,
      ].filter((item): item is { bucket: 'avatars' | 'profile-banners'; path: string } =>
        Boolean(item && !item.path.startsWith('http')),
      );
      await Promise.all(
        oldFiles.map((file) => getSupabaseClient().storage.from(file.bucket).remove([file.path])),
      );
      return { avatarPath, bannerPath };
    } catch (error) {
      await Promise.all(
        uploaded.map((file) => getSupabaseClient().storage.from(file.bucket).remove([file.path])),
      );
      throw error;
    }
  },
};
