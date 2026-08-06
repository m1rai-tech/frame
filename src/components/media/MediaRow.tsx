import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useId, useRef } from 'react';
import { MediaCard, type MediaItem } from '@/components/media/MediaCard';
import { Button } from '@/components/ui/Button';

export function MediaRow({ items, title }: { items: MediaItem[]; title: string }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const scroll = (direction: number) =>
    rowRef.current?.scrollBy({
      left: direction * rowRef.current.clientWidth * 0.8,
      behavior: 'smooth',
    });
  return (
    <section aria-labelledby={headingId}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold" id={headingId}>
          {title}
        </h2>
        <div className="hidden gap-2 sm:flex">
          <Button
            aria-label="Прокрутити ліворуч"
            onClick={() => scroll(-1)}
            size="icon"
            variant="secondary"
          >
            <ChevronLeft className="size-5" />
          </Button>
          <Button
            aria-label="Прокрутити праворуч"
            onClick={() => scroll(1)}
            size="icon"
            variant="secondary"
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
      </div>
      <div
        aria-label={`Горизонтальний список: ${title}`}
        className="scrollbar-none grid auto-cols-[42%] grid-flow-col gap-4 overflow-x-auto overscroll-x-contain pb-2 sm:auto-cols-[28%] lg:auto-cols-[18%]"
        ref={rowRef}
        tabIndex={0}
      >
        {items.map((item) => (
          <MediaCard item={item} key={item.id} />
        ))}
      </div>
    </section>
  );
}
