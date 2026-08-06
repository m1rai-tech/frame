import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { MediaRow } from '@/components/media/MediaRow';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { recommendationsService } from './recommendations.service';

export function RecommendationsRow() {
  const recommendations = useQuery({
    queryKey: ['personalized-recommendations'],
    queryFn: () => recommendationsService.list(),
  });
  if (recommendations.isPending) return <div><div className="mb-4 flex items-center gap-2"><Sparkles className="size-5 text-accent" /><h2 className="text-xl font-semibold">Для вас</h2></div><div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">{Array.from({ length: 6 }, (_, index) => <Skeleton className="aspect-[2/3]" key={index} />)}</div></div>;
  if (recommendations.isError) return <section className="rounded-xl border border-border bg-surface-1 p-6"><h2 className="flex items-center gap-2 font-semibold"><Sparkles className="size-5 text-accent" /> Для вас</h2><p className="mt-2 text-sm text-muted">Не вдалося підібрати рекомендації. Переконайтесь, що міграцію фази 11 застосовано.</p><Button className="mt-4" onClick={() => void recommendations.refetch()} size="sm" variant="secondary">Повторити</Button></section>;
  if (!recommendations.data.length) return <section className="rounded-xl border border-dashed border-border p-6"><h2 className="flex items-center gap-2 font-semibold"><Sparkles className="size-5 text-accent" /> Для вас</h2><p className="mt-2 text-sm text-muted">Оцініть кілька тайтлів або виберіть улюблені жанри — добірка стане точнішою.</p></section>;
  return <MediaRow items={recommendations.data.map((item) => ({ id: item.slug, title: item.title, posterUrl: item.posterPath, meta: `${item.releaseYear ?? 'Скоро'} · ${item.reason}` }))} title="Для вас" />;
}
