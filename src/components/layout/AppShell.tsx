import { Bookmark, History, Search, UserRound } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { Link, NavLink } from 'react-router';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { NotificationBell } from '@/features/notifications/NotificationBell';
import { cn } from '@/lib/cn';

const nav = [
  { to: '/browse', label: 'Каталог', icon: Search },
  { to: '/my-list', label: 'Мій список', icon: Bookmark },
  { to: '/history', label: 'Історія', icon: History },
  { to: '/profile', label: 'Профіль', icon: UserRound },
];
export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-dvh pb-[var(--mobile-nav-height)] md:pb-0">
      <a
        className="fixed left-4 top-2 z-[100] -translate-y-16 rounded-md bg-accent px-4 py-2 text-accent-contrast focus:translate-y-0"
        href="#main-content"
      >
        До основного вмісту
      </a>
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[var(--header-height)] max-w-7xl items-center gap-6 px-4 sm:px-6">
          <Link className="text-xl font-bold tracking-tight text-accent" to="/">
            FRAME
          </Link>
          <nav aria-label="Основна навігація" className="hidden items-center gap-1 md:flex">
            {nav.slice(0, 3).map(({ label, to }) => (
              <NavLink
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-foreground',
                    isActive && 'bg-surface-2 text-foreground',
                  )
                }
                key={to}
                to={to}
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <Button aria-label="Пошук" className="md:hidden" size="icon" variant="ghost">
              <Search className="size-5" />
            </Button>
            <ThemeToggle />
            <NotificationBell />
            <Button aria-label="Профіль" asChild size="icon" variant="ghost">
              <Link to="/profile"><UserRound className="size-5" /></Link>
            </Button>
          </div>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>{children}</main>
      <footer className="mt-20 hidden border-t border-border md:block">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-6 px-6 py-10 text-sm text-muted">
          <p>© 2026 Frame. Beta.</p>
          <div className="flex gap-5">
            <Link to="/legal/privacy">Приватність</Link>
            <Link to="/legal/terms">Умови</Link>
            <Link to="/credits">Джерела</Link>
            <Link to="/health">Стан системи</Link>
          </div>
        </div>
      </footer>
      <nav
        aria-label="Мобільна навігація"
        className="fixed inset-x-0 bottom-0 z-30 grid h-[var(--mobile-nav-height)] grid-cols-4 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        {nav.map(({ icon: Icon, label, to }) => (
          <NavLink
            className={({ isActive }) =>
              cn(
                'grid place-items-center content-center gap-1 text-[0.7rem] text-muted',
                isActive && 'text-accent',
              )
            }
            key={to}
            to={to}
          >
            <Icon className="size-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
