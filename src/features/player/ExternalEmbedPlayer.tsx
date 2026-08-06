import { ShieldCheck } from 'lucide-react';
import type { PlaybackVariant } from '@/features/player/playback.service';

type Props = {
  activeAssetId: string;
  onVariantChange: (assetId: string) => void;
  source: string;
  variants: PlaybackVariant[];
};

const languageName = (language: string) =>
  ({ uk: 'Українська', ru: 'Російська', en: 'Оригінал', ja: 'Японська' })[language] ??
  language.toUpperCase();

export function ExternalEmbedPlayer({
  activeAssetId,
  onVariantChange,
  source,
  variants,
}: Props) {
  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-black">
      <iframe
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
        className="aspect-video w-full border-0"
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
        src={source}
        title="Зовнішній відеоплеєр"
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#111315] px-4 py-3 text-sm">
        <p className="flex items-center gap-2 text-white/60">
          <ShieldCheck className="size-4 text-[#e0a55d]" /> Дозволений зовнішній провайдер
        </p>
        {variants.length > 1 && (
          <label className="flex items-center gap-2 text-white/70">
            Озвучення
            <select
              className="h-9 rounded-md border border-white/15 bg-black px-3 text-white"
              onChange={(event) => onVariantChange(event.currentTarget.value)}
              value={activeAssetId}
            >
              {variants.map((variant) => (
                <option key={variant.assetId} value={variant.assetId}>
                  {languageName(variant.audioLanguage)}
                  {variant.versionLabel ? ` · ${variant.versionLabel}` : ''}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </section>
  );
}
