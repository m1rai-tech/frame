import { describe, expect, it } from 'vitest';
import {
  filterHistoryItems,
  type HistoryItem,
} from '@/features/watch-progress/history.service';

const items: HistoryItem[] = [
  {
    progressId: 'p1', titleId: 't1', title: 'Менталіст', titleSlug: 'mentalist',
    type: 'series', episodeTitle: 'Пілот', positionSeconds: 100, completed: false,
    lastWatchedAt: '2026-08-06T10:00:00Z',
  },
  {
    progressId: 'p2', titleId: 't2', title: 'Дюна', titleSlug: 'dune',
    type: 'movie', positionSeconds: 200, completed: true,
    lastWatchedAt: '2026-08-05T10:00:00Z',
  },
];

describe('history filters', () => {
  it('filters by completion status and content type', () => {
    expect(filterHistoryItems(items, { query: '', status: 'completed', type: 'movie' })).toEqual([
      items[1],
    ]);
  });

  it('searches title and episode names case-insensitively', () => {
    expect(filterHistoryItems(items, { query: 'пілот', status: 'all', type: 'all' })).toEqual([
      items[0],
    ]);
  });
});
