import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Star, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/AuthProvider';
import { cn } from '@/lib/cn';
import { ratingService } from './rating.service';

export function TitleRating({ titleId }: { titleId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const queryKey = ['rating', titleId, user?.id] as const;
  const rating = useQuery({
    queryKey,
    queryFn: () => ratingService.get(titleId, user!.id),
    enabled: Boolean(user),
  });
  const mutation = useMutation({
    mutationFn: (score: number | null) =>
      score === null
        ? ratingService.remove(titleId, user!.id)
        : ratingService.set(titleId, user!.id, score),
    onMutate: async (score) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<number | null>(queryKey);
      queryClient.setQueryData(queryKey, score);
      return { previous };
    },
    onError: (_error, _score, context) => {
      queryClient.setQueryData(queryKey, context?.previous ?? null);
      showToast({ title: 'Не вдалося зберегти оцінку', description: 'Попередню оцінку відновлено.' });
    },
    onSuccess: (_data, score) => {
      showToast({ title: score === null ? 'Оцінку видалено' : `Ваша оцінка: ${score}/10` });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  if (!user) return null;
  return (
    <section aria-labelledby={`rating-${titleId}`} className="mt-7 max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold" id={`rating-${titleId}`}>
          <Star className="size-4 text-accent" /> Ваша оцінка
          {rating.data !== null && rating.data !== undefined && (
            <span className="text-accent">{rating.data}/10</span>
          )}
        </h2>
        {rating.data !== null && rating.data !== undefined && (
          <Button
            aria-label="Видалити оцінку"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(null)}
            size="sm"
            variant="ghost"
          >
            <X className="size-3" /> Очистити
          </Button>
        )}
      </div>
      {rating.isPending ? (
        <Skeleton className="mt-3 h-10" />
      ) : rating.isError ? (
        <div className="mt-3 flex items-center gap-3 text-sm text-danger">
          Оцінка недоступна.
          <button className="underline" onClick={() => void rating.refetch()} type="button">
            Повторити
          </button>
        </div>
      ) : (
        <div aria-label="Оцінка від 1 до 10" className="mt-3 grid grid-cols-10 gap-1.5" role="radiogroup">
          {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => {
            const selected = rating.data === score;
            return (
              <button
                aria-checked={selected}
                aria-label={`${score} з 10`}
                className={cn(
                  'grid h-10 place-items-center rounded-md border text-sm font-semibold transition-colors',
                  selected
                    ? 'border-accent bg-accent text-accent-contrast'
                    : 'border-border bg-surface-1 hover:border-accent hover:bg-surface-2',
                )}
                disabled={mutation.isPending}
                key={score}
                onClick={() => mutation.mutate(score)}
                role="radio"
                type="button"
              >
                {score}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
