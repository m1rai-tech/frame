import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CircleCheck, CircleOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/AuthProvider';
import type { CatalogSeason } from '@/features/catalog/catalog.types';
import {
  manualWatchStatusService,
  isScopeWatched,
  type ManualWatchScope,
} from './manual-watch-status.service';

type Props = {
  scope: ManualWatchScope;
  scopeId?: string;
  titleId: string;
  seasons: CatalogSeason[];
  variant?: 'compact' | 'default';
};

export function WatchStatusControls({
  scope,
  scopeId,
  titleId,
  seasons,
  variant = 'default',
}: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const status = useQuery({
    queryKey: ['manual-watch-status', titleId],
    queryFn: () => manualWatchStatusService.get(titleId),
    enabled: Boolean(user),
  });
  const allEpisodeIds = seasons.flatMap((season) => season.episodes.map((episode) => episode.id));
  const targetEpisodeIds =
    scope === 'episode'
      ? scopeId
        ? [scopeId]
        : []
      : scope === 'season'
        ? (seasons.find((season) => season.id === scopeId)?.episodes.map((episode) => episode.id) ?? [])
        : allEpisodeIds;
  const watched = isScopeWatched(
    targetEpisodeIds,
    status.data?.completedEpisodeIds ?? new Set(),
    scope === 'title' && Boolean(status.data?.movieCompleted),
  );
  const mutation = useMutation({
    mutationFn: () =>
      manualWatchStatusService.set({ scope, scopeId, titleId, watched: !watched }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['manual-watch-status', titleId] }),
        queryClient.invalidateQueries({ queryKey: ['continue-watching'] }),
        queryClient.invalidateQueries({ queryKey: ['resume-position'] }),
      ]);
      showToast({ title: watched ? 'Позначено непереглянутим' : 'Позначено переглянутим' });
    },
  });

  if (!user) return null;
  return (
    <Button
      aria-pressed={watched}
      disabled={status.isPending || mutation.isPending || (scope !== 'title' && targetEpisodeIds.length === 0)}
      onClick={() => mutation.mutate()}
      size={variant === 'compact' ? 'sm' : 'md'}
      variant="secondary"
    >
      {watched ? <CircleOff className="size-4" /> : variant === 'compact' ? <Check className="size-4" /> : <CircleCheck className="size-4" />}
      {watched
        ? variant === 'compact'
          ? 'Скасувати'
          : 'Позначити непереглянутим'
        : variant === 'compact'
          ? 'Переглянуто'
          : 'Позначити переглянутим'}
    </Button>
  );
}
