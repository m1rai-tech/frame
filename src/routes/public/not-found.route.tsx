import { Link } from 'react-router';

export function NotFoundRoute() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="text-sm font-medium text-accent">404</p>
        <h1 className="mt-2 text-3xl font-semibold">Такої сторінки ще немає</h1>
        <Link className="mt-6 inline-flex text-accent underline-offset-4 hover:underline" to="/">
          На головну
        </Link>
      </div>
    </main>
  );
}
