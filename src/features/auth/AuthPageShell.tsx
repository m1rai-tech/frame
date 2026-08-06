import type { PropsWithChildren } from 'react';
import { Link } from 'react-router';

export function AuthPageShell({
  children,
  description,
  title,
}: PropsWithChildren<{ title: string; description: string }>) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <section className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <Link className="text-xl font-bold tracking-tight text-accent" to="/">
            FRAME
          </Link>
          <h1 className="mt-10 text-3xl font-semibold">{title}</h1>
          <p className="mt-3 text-muted">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
      <aside className="relative hidden overflow-hidden bg-surface-1 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,color-mix(in_srgb,var(--accent)_25%,transparent),transparent_36%),linear-gradient(145deg,var(--surface-2),var(--background))]" />
        <div className="absolute inset-x-12 bottom-12">
          <p className="max-w-xl text-4xl font-semibold leading-tight">
            Твоя історія перегляду завжди продовжується з потрібного кадру.
          </p>
        </div>
      </aside>
    </main>
  );
}
