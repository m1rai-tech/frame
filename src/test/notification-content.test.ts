import { newEpisodeMessage, parseNewEpisodeContent } from '@/features/notifications/notification-content';

describe('new episode notification content', () => {
  it('parses safe fields and does not include a synopsis or episode title in the message', () => {
    const content = parseNewEpisodeContent({ title: 'Менталіст', slug: 'mentalist', seasonNumber: 2, episodeNumber: 4, episodeTitle: 'Secret', synopsis: 'Spoiler' });
    const message = newEpisodeMessage(content);
    expect(content).toEqual({ title: 'Менталіст', slug: 'mentalist', seasonNumber: 2, episodeNumber: 4 });
    expect(message).toBe('Вийшла нова серія: сезон 2, серія 4.');
    expect(message).not.toContain('Secret');
    expect(message).not.toContain('Spoiler');
  });
});
