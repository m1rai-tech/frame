import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Mail, Save } from 'lucide-react';
import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/AuthProvider';
import { notificationPreferencesService, type DigestFrequency, type NotificationPreferences } from '@/features/notifications/notification-preferences.service';

export function NotificationSettingsRoute() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<NotificationPreferences>();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const settings = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: () => notificationPreferencesService.get(user!.id),
    enabled: Boolean(user),
  });
  const values = draft ?? settings.data;
  const save = async () => {
    if (!values) return;
    setSaving(true);
    setSaveError(false);
    try {
      await notificationPreferencesService.save(values);
      await queryClient.invalidateQueries({ queryKey: ['notification-preferences', user?.id] });
      setDraft(undefined);
      showToast({ title: 'Налаштування сповіщень збережено' });
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-accent"><Bell className="size-4" /> Налаштування</p>
        <h1 className="mt-2 text-4xl font-semibold">Сповіщення</h1>
        <p className="mt-3 text-muted">In-app повідомлення доступні у дзвіночку. Email вмикається лише за вашою згодою.</p>
        {settings.isPending ? <div className="mt-10 grid gap-4"><Skeleton className="h-36" /><Skeleton className="h-36" /></div> : settings.isError || !values ? <section className="mt-10 rounded-xl border border-border bg-surface-1 p-8"><p className="font-semibold">Не вдалося завантажити налаштування.</p><p className="mt-2 text-sm text-muted">Спочатку застосуйте SQL-міграцію email-сповіщень.</p><Button className="mt-4" onClick={() => void settings.refetch()} variant="secondary">Повторити</Button></section> : <div className="mt-10 grid gap-4">
          <section className="rounded-xl border border-border bg-surface-1 p-5"><label className="flex cursor-pointer items-start gap-4"><input checked={values.emailNewEpisodes} className="mt-1 size-5 accent-[var(--accent)]" onChange={(event) => setDraft({ ...values, emailNewEpisodes: event.currentTarget.checked })} type="checkbox" /><span><strong className="flex items-center gap-2"><Mail className="size-4 text-accent" /> Нові серії на email</strong><span className="mt-1 block text-sm text-muted">Повідомляти про серії тайтлів із вашої історії або списків.</span></span></label></section>
          <section className="rounded-xl border border-border bg-surface-1 p-5"><label className="grid gap-2 text-sm"><span className="font-semibold">Частота email</span><select className="h-11 rounded-md border border-border bg-background px-3 disabled:opacity-50" disabled={!values.emailNewEpisodes} onChange={(event) => setDraft({ ...values, emailDigestFrequency: event.currentTarget.value as DigestFrequency })} value={values.emailDigestFrequency}><option value="instant">Одразу</option><option value="daily">Щоденний дайджест</option><option value="weekly">Щотижневий дайджест</option></select></label><p className="mt-3 text-xs text-muted">Листи не міститимуть synopsis або сюжетних деталей.</p></section>
          <p className="rounded-lg border border-border bg-surface-2 p-4 text-sm text-muted">Налаштування формують захищену чергу. Для фактичної відправки перед релізом треба підключити email-провайдера та підтверджений домен.</p>
          {saveError && <p className="text-sm text-danger">Не вдалося зберегти налаштування.</p>}
          <div className="flex justify-end"><Button disabled={saving || !draft} onClick={() => void save()}><Save className="size-4" /> {saving ? 'Зберігаємо…' : 'Зберегти'}</Button></div>
        </div>}
      </div>
    </AppShell>
  );
}
