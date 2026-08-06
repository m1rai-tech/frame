import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link2, Save, Trash2 } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { catalogAdminService, type VideoAssetRow } from '@/features/admin/catalog-admin.service';

const schema = z.object({
  provider: z.enum(['direct_hls', 'official_embed']),
  sourceUrl: z
    .url('Вкажіть коректний URL')
    .refine((value) => value.startsWith('https://'), 'Потрібен захищений HTTPS URL'),
  audioLanguage: z.string().trim().min(2).max(10),
  versionLabel: z.string().trim().max(60),
  requiresEntitlement: z.boolean(),
});
type Values = z.infer<typeof schema>;

export function EpisodeVideoAssetManager({ episodeId }: { episodeId: string }) {
  const assets = useQuery({
    queryKey: ['admin', 'video-asset', episodeId],
    queryFn: () => catalogAdminService.listEpisodeVideoAssets(episodeId),
  });
  if (assets.isPending) return <p className="mt-8 text-sm text-muted">Завантаження відеоджерел…</p>;
  return (
    <section className="mt-8 grid gap-4">
      <header>
        <p className="flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-accent">
          <Link2 className="size-4" /> Реальне відео
        </p>
        <h2 className="mt-2 text-xl font-semibold">Озвучки та HLS-джерела</h2>
        <p className="mt-2 text-sm text-muted">
          Додайте окремий HLS для української, російської або оригінальної озвучки. Доріжки
          субтитрів усередині HLS автоматично з’являться в меню плеєра.
        </p>
      </header>
      {assets.data?.map((asset) => (
        <AssetForm asset={asset} episodeId={episodeId} key={asset.id} />
      ))}
      <AssetForm episodeId={episodeId} key={`new-${assets.data?.length ?? 0}`} />
    </section>
  );
}

function AssetForm({ asset, episodeId }: { asset?: VideoAssetRow; episodeId: string }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      provider:
        asset?.provider === 'official_embed' ? 'official_embed' : 'direct_hls',
      sourceUrl: asset?.provider_asset_id ?? '',
      audioLanguage: asset?.audio_language ?? 'uk',
      versionLabel: asset?.version_label ?? '',
      requiresEntitlement: asset?.requires_entitlement ?? false,
    },
  });
  const provider = useWatch({ control, name: 'provider' });
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'video-asset', episodeId] });
  const save = useMutation({
    mutationFn: (values: Values) =>
      catalogAdminService.saveEpisodeVideoAsset(episodeId, asset?.id, values),
    onSuccess: async () => {
      await refresh();
      showToast({ title: asset ? 'Озвучку оновлено' : 'Нову озвучку додано' });
    },
  });
  const remove = useMutation({
    mutationFn: () => catalogAdminService.deleteVideoAsset(asset!.id),
    onSuccess: async () => {
      await refresh();
      showToast({ title: 'Озвучку видалено' });
    },
  });

  return (
    <form
      className="grid gap-5 rounded-lg border border-border bg-surface-1 p-5 sm:grid-cols-2"
      onSubmit={(event) => void handleSubmit((values) => save.mutateAsync(values))(event)}
    >
      <h3 className="font-semibold sm:col-span-2">
        {asset
          ? `${asset.audio_language.toUpperCase()}${asset.version_label ? ` · ${asset.version_label}` : ''}`
          : 'Додати ще одну озвучку'}
      </h3>
      <label className="grid gap-2 text-sm">
        <span className="font-medium">Тип джерела</span>
        <select
          className="h-11 rounded-md border border-border bg-surface-1 px-3"
          {...register('provider')}
        >
          <option value="direct_hls">Власний HLS</option>
          <option value="official_embed">Офіційний зовнішній плеєр</option>
        </select>
      </label>
      <Input
        className="sm:col-span-2"
        error={errors.sourceUrl?.message}
        label={provider === 'official_embed' ? 'Embed URL' : 'HLS URL'}
        placeholder={
          provider === 'official_embed'
            ? 'https://licensed-provider.example/embed/episode-id'
            : 'https://cdn.example.com/episode/master.m3u8'
        }
        {...register('sourceUrl')}
      />
      <label className="grid gap-2 text-sm">
        <span className="font-medium">Мова озвучки</span>
        <select
          className="h-11 rounded-md border border-border bg-surface-1 px-3"
          {...register('audioLanguage')}
        >
          <option value="uk">Українська</option>
          <option value="ru">Російська</option>
          <option value="en">Англійська / оригінал</option>
          <option value="ja">Японська</option>
        </select>
      </label>
      <Input
        label="Студія / версія"
        placeholder="Наприклад, українська озвучка"
        {...register('versionLabel')}
      />
      <label className="flex items-center gap-3 text-sm sm:col-span-2">
        <input
          className="size-4 accent-accent"
          type="checkbox"
          {...register('requiresEntitlement')}
        />
        Потребує підписки
      </label>
      {(save.isError || remove.isError) && (
        <p className="text-sm text-danger sm:col-span-2">
          Не вдалося зберегти озвучку. Перевірте URL та унікальність адреси.
        </p>
      )}
      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <Button disabled={save.isPending || (!isDirty && Boolean(asset))} type="submit">
          <Save className="size-4" /> {asset ? 'Оновити озвучку' : 'Додати озвучку'}
        </Button>
        {asset && (
          <Button disabled={remove.isPending} onClick={() => remove.mutate()} variant="danger">
            <Trash2 className="size-4" /> Видалити
          </Button>
        )}
      </div>
    </form>
  );
}
