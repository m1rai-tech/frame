import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/features/auth/AuthProvider';
import { isValidIanaTimeZone } from '@/features/streaks/timezone';
import { cn } from '@/lib/cn';
import { getSupabaseClient } from '@/services/supabase/client';

const genres = [
  'драма',
  'комедія',
  'фантастика',
  'трилер',
  'детектив',
  'романтика',
  'пригоди',
  'фентезі',
  'жахи',
  'документальне',
  'сімейне',
  'аніме',
];
const schema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9][a-z0-9_]{2,29}$/, '3–30 символів: латиниця, цифри та _.')
    .transform((value) => value.toLowerCase()),
  displayName: z.string().trim().min(2, 'Мінімум 2 символи.').max(60),
  timezone: z.string().min(1).refine(isValidIanaTimeZone, 'Вкажіть дійсний IANA-пояс, наприклад Europe/Kyiv.'),
  favoriteGenres: z.array(z.string()).max(12),
});
type FormValues = z.infer<typeof schema>;

export function OnboardingRoute() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState<File>();
  const [formError, setFormError] = useState<string>();
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: (user?.user_metadata.display_name as string | undefined) ?? '',
      favoriteGenres: [],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Kyiv',
      username: `user_${user?.id.slice(0, 8) ?? ''}`,
    },
  });
  const selectedGenres = useWatch({ control, name: 'favoriteGenres' });
  const toggleGenre = (genre: string) =>
    setValue(
      'favoriteGenres',
      selectedGenres.includes(genre)
        ? selectedGenres.filter((item) => item !== genre)
        : [...selectedGenres, genre],
      { shouldDirty: true },
    );
  const onSubmit = handleSubmit(async (values) => {
    if (!user) return;
    setFormError(undefined);
    try {
      const client = getSupabaseClient();
      let avatarPath: string | undefined;
      if (avatar) {
        if (
          avatar.size > 5 * 1024 * 1024 ||
          !['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(avatar.type)
        )
          throw new Error('Аватар має бути JPG, PNG, WebP або AVIF до 5 MB.');
        const extension = avatar.name.split('.').pop()?.toLowerCase() ?? 'webp';
        avatarPath = `${user.id}/avatar.${extension}`;
        const { error: uploadError } = await client.storage
          .from('avatars')
          .upload(avatarPath, avatar, { upsert: true, contentType: avatar.type });
        if (uploadError) throw uploadError;
      }
      const { error } = await client
        .from('profiles')
        .update({
          username: values.username,
          display_name: values.displayName,
          timezone: values.timezone,
          favorite_genre_slugs: values.favoriteGenres,
          onboarding_completed_at: new Date().toISOString(),
          ...(avatarPath ? { avatar_path: avatarPath } : {}),
        })
        .eq('id', user.id);
      if (error) throw error;
      await navigate('/browse', { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setFormError(
        message.includes('profiles_username_key')
          ? 'Цей username уже зайнятий.'
          : message || 'Не вдалося зберегти профіль.',
      );
    }
  });
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <p className="text-sm uppercase tracking-[0.2em] text-accent">Крок 1 з 1</p>
        <h1 className="mt-3 text-3xl font-semibold">Налаштуйте свій профіль</h1>
        <p className="mt-3 text-muted">
          Усе можна змінити пізніше. Історія та статистика приватні за замовчуванням.
        </p>
        <form className="mt-10 grid gap-6" onSubmit={(event) => void onSubmit(event)}>
          <Input
            error={errors.displayName?.message}
            id="onboarding-name"
            label="Ім’я профілю"
            {...register('displayName')}
          />
          <Input
            error={errors.username?.message}
            id="onboarding-username"
            label="Username"
            {...register('username')}
          />
          <Input
            error={errors.timezone?.message}
            id="onboarding-timezone"
            label="Часовий пояс"
            {...register('timezone')}
          />
          <label className="grid gap-2 text-sm" htmlFor="avatar">
            <span className="font-medium">Аватар, необов’язково</span>
            <input
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="rounded-md border border-border bg-surface-1 p-3"
              id="avatar"
              onChange={(event) => setAvatar(event.target.files?.[0])}
              type="file"
            />
          </label>
          <fieldset>
            <legend className="font-medium">Улюблені жанри</legend>
            <p className="mt-1 text-sm text-muted">Допоможуть сформувати перші рекомендації.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {genres.map((genre) => (
                <button
                  aria-pressed={selectedGenres.includes(genre)}
                  className={cn(
                    'rounded-full border border-border px-4 py-2 text-sm capitalize hover:bg-surface-2',
                    selectedGenres.includes(genre) &&
                      'border-accent bg-accent text-accent-contrast',
                  )}
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  type="button"
                >
                  {genre}
                </button>
              ))}
            </div>
          </fieldset>
          {formError && (
            <p className="text-sm text-danger" role="alert">
              {formError}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button onClick={() => void navigate('/browse')} variant="ghost">
              Пропустити
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Зберігаємо…' : 'Завершити'}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
