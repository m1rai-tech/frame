# Frame

Стримінгова платформа для фільмів, серіалів та аніме. Проєкт розробляється послідовно за [`plan.md`](./plan.md).

## Вимоги

- Node.js 22 або новіший;
- npm;
- Chromium для Playwright smoke-тестів.

## Локальний запуск

```bash
npm install
copy .env.example .env.local
npm run dev
```

Значення Supabase в `.env.local` можна залишити тестовими до фази 4.

## Перевірки

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e -- --project=chromium
```

## Документація

- [`plan.md`](./plan.md) — основний порядок розробки;
- [`docs/phase-01-product-foundation.md`](./docs/phase-01-product-foundation.md) — продуктова основа, flows, wireframes і дизайн-напрям.
- [`docs/phase-04-supabase.md`](./docs/phase-04-supabase.md) — локальна БД, migrations, RLS і staging workflow.
- [`docs/phase-05-auth.md`](./docs/phase-05-auth.md) — auth-маршрути, onboarding і live smoke flow.
- [`docs/phase-06-catalog.md`](./docs/phase-06-catalog.md) — catalog migration, seed, admin role та TMDB import.

Під час розробки дизайн-система доступна за адресою `/design-system`.
