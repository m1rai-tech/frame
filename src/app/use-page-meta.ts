import { useEffect } from 'react';
import { env } from '@/app/env';

type PageMeta = {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'video.movie' | 'video.tv_show';
  robots?: 'index,follow' | 'noindex,nofollow';
};

const setMeta = (
  selector: string,
  attribute: 'name' | 'property',
  value: string,
  content: string,
) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, value);
    document.head.append(element);
  }
  element.content = content;
};

export function usePageMeta({
  description,
  image,
  path,
  robots = 'index,follow',
  title,
  type = 'website',
}: PageMeta) {
  useEffect(() => {
    const pageTitle = `${title} — ${env.VITE_APP_NAME}`;
    const canonical = new URL(path, env.VITE_APP_URL).toString();
    document.title = pageTitle;
    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', pageTitle);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:type"]', 'property', 'og:type', type);
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
    setMeta('meta[property="og:locale"]', 'property', 'og:locale', 'uk_UA');
    setMeta(
      'meta[name="twitter:card"]',
      'name',
      'twitter:card',
      image ? 'summary_large_image' : 'summary',
    );
    setMeta('meta[name="robots"]', 'name', 'robots', robots);
    if (image) {
      const absoluteImage = new URL(image, env.VITE_APP_URL).toString();
      setMeta('meta[property="og:image"]', 'property', 'og:image', absoluteImage);
      setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', absoluteImage);
    } else {
      document.head.querySelector('meta[property="og:image"]')?.remove();
      document.head.querySelector('meta[name="twitter:image"]')?.remove();
    }
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.append(link);
    }
    link.href = canonical;
  }, [description, image, path, robots, title, type]);
}
