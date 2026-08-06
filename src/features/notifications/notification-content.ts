export type NewEpisodeContent = {
  title: string;
  slug: string;
  seasonNumber: number;
  episodeNumber: number;
};

const stringValue = (value: unknown) => (typeof value === 'string' ? value : '');
const numberValue = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

export function parseNewEpisodeContent(payload: Record<string, unknown>): NewEpisodeContent {
  return {
    title: stringValue(payload.title) || 'Ваш серіал',
    slug: stringValue(payload.slug),
    seasonNumber: numberValue(payload.seasonNumber),
    episodeNumber: numberValue(payload.episodeNumber),
  };
}

export function newEpisodeMessage(content: NewEpisodeContent) {
  return `Вийшла нова серія: сезон ${content.seasonNumber}, серія ${content.episodeNumber}.`;
}
