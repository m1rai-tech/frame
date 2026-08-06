import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, ShieldCheck, UserRound } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link } from 'react-router';
import { z } from 'zod';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/AuthProvider';
import { ImageCropField } from '@/features/profiles/ImageCropField';
import { profileImageUrl, profileService } from '@/features/profiles/profile.service';
import { isValidIanaTimeZone } from '@/features/streaks/timezone';

const schema = z.object({
  displayName: z.string().trim().min(1, 'Вкажіть ім’я.').max(60),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9][a-z0-9_]{2,29}$/, '3–30 символів: латиниця, цифри та _.'),
  bio: z.string().trim().max(500, 'Максимум 500 символів.'),
  timezone: z.string().trim().min(1, 'Вкажіть часовий пояс.').max(80).refine(isValidIanaTimeZone, 'Вкажіть дійсний IANA-пояс, наприклад Europe/Kyiv.'),
  locale: z.enum(['uk', 'en']),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Вкажіть HEX-колір.'),
});
type Values = z.infer<typeof schema>;

export function ProfileEditRoute() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [avatar, setAvatar] = useState<Blob>();
  const [banner, setBanner] = useState<Blob>();
  const [formError, setFormError] = useState<string>();
  const onAvatarChange = useCallback((blob: Blob | undefined) => setAvatar(blob), []);
  const onBannerChange = useCallback((blob: Blob | undefined) => setBanner(blob), []);
  const profile = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => profileService.get(user!.id),
    enabled: Boolean(user),
  });
  const {
    control,
    register,
    reset,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: '',
      username: '',
      bio: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Kyiv',
      locale: 'uk',
      accentColor: '#d69a45',
    },
  });
  const accentColor = useWatch({ control, name: 'accentColor' });
  useEffect(() => {
    if (!profile.data) return;
    reset({
      displayName: profile.data.display_name,
      username: profile.data.username,
      bio: profile.data.bio ?? '',
      timezone: profile.data.timezone,
      locale: profile.data.locale === 'en' ? 'en' : 'uk',
      accentColor: profile.data.accent_color,
    });
  }, [profile.data, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (!user || !profile.data) return;
    setFormError(undefined);
    try {
      await profileService.save(
        user.id,
        values,
        { avatarPath: profile.data.avatar_path, bannerPath: profile.data.banner_path },
        { avatar, banner },
      );
      setAvatar(undefined);
      setBanner(undefined);
      await queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      showToast({ title: 'Профіль оновлено' });
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
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <p className="flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-accent">
          <UserRound className="size-4" /> Налаштування
        </p>
        <h1 className="mt-2 text-4xl font-semibold">Редагування профілю</h1>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted">Налаштуйте вигляд, ім’я та регіональні параметри.</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link to="/settings/privacy"><ShieldCheck className="size-4" /> Приватність</Link>
            </Button>
          </div>
        </div>

        {profile.isPending ? (
          <div className="mt-10 grid gap-5"><Skeleton className="h-64" /><Skeleton className="h-80" /></div>
        ) : profile.isError ? (
          <section className="mt-10 rounded-xl border border-border bg-surface-1 p-8">
            <p className="font-semibold">Не вдалося завантажити профіль.</p>
            <Button className="mt-4" onClick={() => void profile.refetch()} variant="secondary">Повторити</Button>
          </section>
        ) : profile.data ? (
          <form className="mt-10 grid gap-8" onSubmit={(event) => void onSubmit(event)}>
            <ImageCropField
              aspect={3}
              currentUrl={profileImageUrl('profile-banners', profile.data.banner_path)}
              label="Банер профілю · 3:1"
              onChange={onBannerChange}
              outputHeight={533}
              outputWidth={1600}
            />
            <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
              <ImageCropField
                aspect={1}
                currentUrl={profileImageUrl('avatars', profile.data.avatar_path)}
                label="Аватар · 1:1"
                onChange={onAvatarChange}
                outputHeight={512}
                outputWidth={512}
              />
              <div className="grid content-start gap-5 rounded-xl border border-border bg-surface-1 p-6 sm:grid-cols-2">
                <Input error={errors.displayName?.message} label="Ім’я профілю" {...register('displayName')} />
                <Input error={errors.username?.message} label="Username" {...register('username')} />
                <label className="grid gap-2 text-sm sm:col-span-2">
                  <span className="font-medium">Про себе</span>
                  <textarea
                    className="min-h-28 rounded-md border border-border bg-background p-3"
                    maxLength={500}
                    placeholder="Кілька слів про ваші улюблені фільми"
                    {...register('bio')}
                  />
                  {errors.bio && <span className="text-danger">{errors.bio.message}</span>}
                </label>
                <Input error={errors.timezone?.message} label="Часовий пояс" {...register('timezone')} />
                <label className="grid gap-2 text-sm">
                  <span className="font-medium">Мова інтерфейсу</span>
                  <select className="h-11 rounded-md border border-border bg-background px-3" {...register('locale')}>
                    <option value="uk">Українська</option>
                    <option value="en">English</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm sm:col-span-2">
                  <span className="font-medium">Акцентний колір</span>
                  <div className="flex gap-3">
                    <input
                      className="h-11 w-16 rounded-md border border-border bg-background p-1"
                      onChange={(event) => setValue('accentColor', event.currentTarget.value, { shouldDirty: true, shouldValidate: true })}
                      type="color"
                      value={accentColor}
                    />
                    <Input
                      error={errors.accentColor?.message}
                      onChange={(event) => setValue('accentColor', event.currentTarget.value, { shouldDirty: true, shouldValidate: true })}
                      value={accentColor}
                    />
                  </div>
                </label>
              </div>
            </div>
            {formError && <p className="text-sm text-danger" role="alert">{formError}</p>}
            <div className="sticky bottom-[var(--mobile-nav-height)] z-20 flex justify-end border-t border-border bg-background/95 py-4 backdrop-blur md:bottom-0">
              <Button disabled={isSubmitting || (!isDirty && !avatar && !banner)} type="submit">
                <Save className="size-4" /> {isSubmitting ? 'Зберігаємо…' : 'Зберегти профіль'}
              </Button>
            </div>
          </form>
        ) : null}
      </div>
    </AppShell>
  );
}
