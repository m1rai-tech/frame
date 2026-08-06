import { getSupabaseClient } from '@/services/supabase/client';

export type CatalogImageKind = 'poster' | 'backdrop';
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const maxFileSize = 10 * 1024 * 1024;

export function validateCatalogImage(file: Pick<File, 'size' | 'type'>) {
  if (!allowedTypes.has(file.type)) return 'Підтримуються JPEG, PNG, WebP та AVIF.';
  if (file.size > maxFileSize) return 'Максимальний розмір файлу — 10 МБ.';
  if (file.size === 0) return 'Файл порожній.';
  return undefined;
}

export const catalogImageService = {
  async upload(titleId: string, kind: CatalogImageKind, file: File) {
    const validationError = validateCatalogImage(file);
    if (validationError) throw new Error(validationError);

    const path = `titles/${titleId}/${kind}`;
    const { error } = await getSupabaseClient().storage.from('catalog-images').upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: true,
    });
    if (error) throw error;

    const { data } = getSupabaseClient().storage.from('catalog-images').getPublicUrl(path);
    return `${data.publicUrl}?v=${Date.now()}`;
  },
};
