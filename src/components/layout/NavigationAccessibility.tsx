import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';

export function NavigationAccessibility() {
  const location = useLocation();
  const [announcement, setAnnouncement] = useState('');
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
      const main = document.querySelector<HTMLElement>('#main-content');
      main?.focus({ preventScroll: true });
      const heading = main?.querySelector('h1')?.textContent?.trim();
      setAnnouncement(heading ? `Відкрито сторінку: ${heading}` : 'Відкрито нову сторінку');
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname]);
  return <div aria-atomic="true" aria-live="polite" className="sr-only">{announcement}</div>;
}
