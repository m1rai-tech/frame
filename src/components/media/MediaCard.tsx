import { Plus } from 'lucide-react';
import { Link } from 'react-router';
import { Poster } from '@/components/media/Poster';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Tooltip } from '@/components/ui/Tooltip';

export type MediaItem = {
  id: string;
  title: string;
  meta: string;
  posterUrl?: string;
  progress?: number;
};
export function MediaCard({ item }: { item: MediaItem }) {
  return (
    <article className="group min-w-0">
      <div className="relative">
        <Link aria-label={`Відкрити ${item.title}`} to={`/title/${item.id}`}>
          <Poster alt={item.title} src={item.posterUrl} />
        </Link>
        <div className="absolute right-2 top-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <Tooltip content="До списку">
            <Button
              aria-label={`Додати ${item.title} до списку`}
              className="bg-background/85 backdrop-blur-sm"
              size="icon"
              variant="ghost"
            >
              <Plus className="size-5" />
            </Button>
          </Tooltip>
        </div>
        {item.progress !== undefined && (
          <div className="absolute inset-x-2 bottom-2">
            <ProgressBar value={item.progress} />
          </div>
        )}
      </div>
      <Link className="mt-3 block truncate font-medium hover:text-accent" to={`/title/${item.id}`}>
        {item.title}
      </Link>
      <p className="mt-1 truncate text-sm text-muted">{item.meta}</p>
    </article>
  );
}
