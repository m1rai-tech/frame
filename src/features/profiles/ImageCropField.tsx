import { ImagePlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cropImage } from './image-crop';

type Props = {
  aspect: number;
  currentUrl?: string;
  label: string;
  onChange: (blob: Blob | undefined) => void;
  outputHeight: number;
  outputWidth: number;
};

export function ImageCropField({
  aspect,
  currentUrl,
  label,
  onChange,
  outputHeight,
  outputWidth,
}: Props) {
  const [file, setFile] = useState<File>();
  const [sourceUrl, setSourceUrl] = useState<string>();
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>();
  const sourceUrlRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (!file) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setProcessing(true);
      setError(undefined);
      void cropImage(file, { aspect, width: outputWidth, height: outputHeight, zoom, offsetX, offsetY })
        .then((blob) => active && onChange(blob))
        .catch((reason: unknown) => {
          if (active) setError(reason instanceof Error ? reason.message : 'Помилка обробки.');
        })
        .finally(() => active && setProcessing(false));
    }, 180);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [aspect, file, offsetX, offsetY, onChange, outputHeight, outputWidth, zoom]);

  const preview = sourceUrl ?? currentUrl;
  return (
    <fieldset className="rounded-xl border border-border bg-surface-1 p-5">
      <legend className="px-2 font-semibold">{label}</legend>
      <div
        className="relative overflow-hidden rounded-lg bg-surface-2"
        style={{ aspectRatio: String(aspect) }}
      >
        {preview ? (
          <img
            alt="Попередній перегляд кадру"
            className="size-full object-cover"
            src={preview}
            style={sourceUrl ? { transform: `scale(${zoom}) translate(${offsetX * 12}%, ${offsetY * 12}%)` } : undefined}
          />
        ) : (
          <div className="grid size-full place-items-center text-muted"><ImagePlus className="size-8" /></div>
        )}
      </div>
      <label className="mt-4 grid gap-2 text-sm">
        <span className="font-medium">Вибрати зображення</span>
        <input
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="rounded-md border border-border bg-background p-3"
          onChange={(event) => {
            const next = event.currentTarget.files?.[0];
            if (!next) return;
            if (next.size > 10 * 1024 * 1024) {
              setError('Початковий файл має бути до 10 MB.');
              return;
            }
            if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
            const url = URL.createObjectURL(next);
            sourceUrlRef.current = url;
            setSourceUrl(url);
            setFile(next);
            setProcessing(true);
            setZoom(1);
            setOffsetX(0);
            setOffsetY(0);
          }}
          type="file"
        />
      </label>
      {file && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ['Масштаб', zoom, 1, 3, setZoom],
            ['По горизонталі', offsetX, -1, 1, setOffsetX],
            ['По вертикалі', offsetY, -1, 1, setOffsetY],
          ].map(([name, value, min, max, setter]) => (
            <label className="grid gap-1 text-xs" key={String(name)}>
              <span>{String(name)}</span>
              <input
                max={Number(max)}
                min={Number(min)}
                onChange={(event) => (setter as (value: number) => void)(Number(event.currentTarget.value))}
                step="0.05"
                type="range"
                value={Number(value)}
              />
            </label>
          ))}
        </div>
      )}
      {processing && <p className="mt-3 text-xs text-muted">Готуємо WebP…</p>}
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </fieldset>
  );
}
