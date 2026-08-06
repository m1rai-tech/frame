import { ImageOff } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/cn';

export function Poster({ alt, className, src }: { alt: string; className?: string; src?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn('aspect-[2/3] overflow-hidden rounded-md bg-surface-2', className)}>
      {src && !failed ? (
        <img
          alt={alt}
          className="size-full object-cover"
          decoding="async"
          height={750}
          loading="lazy"
          onError={() => setFailed(true)}
          src={src}
          width={500}
        />
      ) : (
        <div
          aria-label={`Немає постера: ${alt}`}
          className="grid size-full place-items-center text-muted"
          role="img"
        >
          <ImageOff className="size-7" />
        </div>
      )}
    </div>
  );
}
