import { useMutation } from '@tanstack/react-query';
import { ImagePlus, LoaderCircle } from 'lucide-react';
import { useId, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { catalogImageService, type CatalogImageKind } from '@/features/admin/catalog-image.service';

export function CatalogImageUpload({
  currentUrl,
  kind,
  onUploaded,
  titleId,
}: {
  currentUrl?: string;
  kind: CatalogImageKind;
  onUploaded: (url: string) => void;
  titleId: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const label = kind === 'poster' ? 'постер' : 'обкладинку';
  const upload = useMutation({
    mutationFn: (file: File) => catalogImageService.upload(titleId, kind, file),
    onSuccess: (url) => {
      onUploaded(url);
      showToast({
        title: kind === 'poster' ? 'Постер завантажено' : 'Обкладинку завантажено',
        description: 'Натисніть «Зберегти», щоб записати URL у тайтл.',
      });
      if (inputRef.current) inputRef.current.value = '';
    },
  });

  return (
    <div className="grid gap-3">
      <div
        className={
          kind === 'poster'
            ? 'aspect-[2/3] max-w-52 overflow-hidden rounded-md bg-surface-2'
            : 'aspect-video w-full overflow-hidden rounded-md bg-surface-2'
        }
      >
        {currentUrl ? (
          <img
            alt={kind === 'poster' ? 'Поточний постер' : 'Поточна обкладинка'}
            className="size-full object-cover"
            src={currentUrl}
          />
        ) : (
          <div className="grid size-full place-items-center text-muted">
            <ImagePlus className="size-8" />
          </div>
        )}
      </div>
      <input
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        id={inputId}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) upload.mutate(file);
        }}
        ref={inputRef}
        type="file"
      />
      <Button
        disabled={upload.isPending}
        onClick={() => inputRef.current?.click()}
        size="sm"
        variant="secondary"
      >
        {upload.isPending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <ImagePlus className="size-4" />
        )}
        Завантажити {label}
      </Button>
      <p className="text-xs text-muted">JPEG, PNG, WebP або AVIF · до 10 МБ</p>
      {upload.isError && (
        <p className="text-sm text-danger">
          {upload.error instanceof Error ? upload.error.message : 'Не вдалося завантажити файл.'}
        </p>
      )}
    </div>
  );
}
