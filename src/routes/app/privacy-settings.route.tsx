import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart3, Eye, EyeOff, Save, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  privacyService,
  type PrivacySettings,
  type Visibility,
} from '@/features/profiles/privacy.service';
import { profileService } from '@/features/profiles/profile.service';

const fields: Array<{
  key: Exclude<keyof PrivacySettings, 'analyticsEnabled'>;
  title: string;
  description: string;
}> = [
  {
    key: 'profileVisibility',
    title: 'Профіль',
    description: 'Ім’я, username, bio, аватар, банер та улюблені жанри.',
  },
  {
    key: 'statsVisibility',
    title: 'Статистика',
    description: 'Переглянуті фільми, серії, час перегляду, стріки та нагороди.',
  },
  {
    key: 'historyVisibility',
    title: 'Історія переглядів',
    description: 'Остання активність та переглянуті епізоди.',
  },
  {
    key: 'listsVisibility',
    title: 'Списки',
    description: 'Власні публічні добірки, улюблене та список перегляду.',
  },
];

export function PrivacySettingsRoute() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [draft, setDraft] = useState<PrivacySettings>();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const settings = useQuery({
    queryKey: ['privacy-settings', user?.id],
    queryFn: () => privacyService.get(user!.id),
    enabled: Boolean(user),
  });
  const profile = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => profileService.get(user!.id),
    enabled: Boolean(user),
  });
  const values = draft ?? settings.data;

  const save = async () => {
    if (!user || !values) return;
    setSaving(true);
    setSaveError(false);
    try {
      await privacyService.save(user.id, values);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['privacy-settings', user.id] }),
        queryClient.invalidateQueries({ queryKey: ['profile', user.id] }),
        queryClient.invalidateQueries({ queryKey: ['public-profile'] }),
        queryClient.invalidateQueries({ queryKey: ['profile-section-visibility', user.id] }),
        queryClient.invalidateQueries({ queryKey: ['analytics-consent', user.id] }),
      ]);
      setDraft(undefined);
      showToast({ title: 'Налаштування приватності збережено' });
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-accent">
          <ShieldCheck className="size-4" /> Контроль доступу
        </p>
        <h1 className="mt-2 text-4xl font-semibold">Приватність профілю</h1>
        <p className="mt-3 text-muted">
          За замовчуванням усе приватне. Публічність не відкриває email або дані входу.
        </p>

        {settings.isPending ? (
          <div className="mt-10 grid gap-3"><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
        ) : settings.isError || !values ? (
          <section className="mt-10 rounded-xl border border-border bg-surface-1 p-8">
            <p className="font-semibold">Не вдалося завантажити налаштування.</p>
            <Button className="mt-4" onClick={() => void settings.refetch()} variant="secondary">Повторити</Button>
          </section>
        ) : (
          <div className="mt-10 grid gap-3">
            {fields.map((field) => {
              const current = values[field.key];
              return (
                <section className="grid gap-4 rounded-xl border border-border bg-surface-1 p-5 sm:grid-cols-[1fr_auto] sm:items-center" key={field.key}>
                  <div>
                    <h2 className="flex items-center gap-2 font-semibold">
                      {current === 'public' ? <Eye className="size-4 text-accent" /> : <EyeOff className="size-4 text-muted" />}
                      {field.title}
                    </h2>
                    <p className="mt-1 text-sm text-muted">{field.description}</p>
                  </div>
                  <select
                    aria-label={`Видимість: ${field.title}`}
                    className="h-11 min-w-36 rounded-md border border-border bg-background px-3"
                    onChange={(event) => {
                      const nextVisibility = event.currentTarget.value as Visibility;
                      setDraft((currentValues) => ({
                        ...(currentValues ?? values),
                        [field.key]: nextVisibility,
                      }));
                    }}
                    value={current}
                  >
                    <option value="private">Приватне</option>
                    <option value="public">Публічне</option>
                  </select>
                </section>
              );
            })}
            <section className="grid gap-4 rounded-xl border border-border bg-surface-1 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <h2 className="flex items-center gap-2 font-semibold"><BarChart3 className="size-4 text-accent" /> Приватна аналітика</h2>
                <p className="mt-1 text-sm text-muted">Допомагає знаходити помилки та повільні сторінки. Вимкнено за замовчуванням; email, пошукові запити й повні адреси не записуються.</p>
              </div>
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-3">
                <input
                  checked={values.analyticsEnabled}
                  className="size-5 accent-[var(--accent)]"
                  onChange={(event) => setDraft((currentValues) => ({ ...(currentValues ?? values), analyticsEnabled: event.currentTarget.checked }))}
                  type="checkbox"
                />
                <span>{values.analyticsEnabled ? 'Увімкнено' : 'Вимкнено'}</span>
              </label>
            </section>
            {values.profileVisibility === 'private' &&
              (values.statsVisibility === 'public' || values.historyVisibility === 'public' || values.listsVisibility === 'public') && (
                <p className="rounded-lg border border-border bg-surface-2 p-4 text-sm text-muted">
                  Поки профіль приватний, інші публічні розділи також не відображаються відвідувачам.
                </p>
              )}
            {saveError && <p className="text-sm text-danger">Не вдалося зберегти налаштування.</p>}
            <div className="mt-3 flex flex-wrap justify-between gap-3">
              {profile.data && values.profileVisibility === 'public' ? (
                <Button asChild variant="ghost"><Link to={`/profile/${profile.data.username}`}>Переглянути публічний профіль</Link></Button>
              ) : <span />}
              <Button disabled={saving} onClick={() => void save()}>
                <Save className="size-4" /> {saving ? 'Зберігаємо…' : 'Зберегти приватність'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
