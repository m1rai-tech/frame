# Фаза 12 — Backup, restore rehearsal і staging

## Що підготовлено

- `.github/workflows/database-backup.yml` щонеділі або вручну створює окремі дампи ролей, схеми та даних.
- Backup не комітиться у Git і зберігається як приватний GitHub Actions artifact 7 днів.
- Для кожного SQL-файлу створюється SHA-256 checksum.
- `.github/workflows/staging-refresh.yml` вручну перебудовує лише staging з міграцій і синтетичного `supabase/seed.sql`.
- Захисний скрипт зупиняє reset, якщо production та staging вказують на одну базу або не введено `RESET_STAGING`.
- `.env.staging.example` відокремлює публічні frontend-налаштування staging.

## Налаштування GitHub

У Settings → Secrets and variables → Actions додати:

- `SUPABASE_PRODUCTION_DB_URL` — session pooler connection string production;
- `SUPABASE_STAGING_DB_URL` — connection string окремого staging-проєкту.

Обидва значення мають бути percent-encoded і не повинні потрапляти у `.env`, коміти чи логи.

Створити GitHub Environment `staging` і бажано ввімкнути required reviewer для ручного reset.

## Перша перевірка

1. Запустити workflow `Database backup` вручну.
2. Завантажити artifact і перевірити `sha256sum --check SHA256SUMS`.
3. Запустити `Refresh staging database`, ввівши `RESET_STAGING`.
4. Підключити frontend до `.env.staging.local` і перевірити login, catalog, profile, admin import та `/health`.
5. Зафіксувати дату, тривалість, розмір backup та всі помилки у release notes.

## Важливі обмеження

- Database backup містить метадані Storage, але не самі файли Storage. Для аватарів та інших власних файлів потрібне окреме копіювання bucket objects.
- Відновлення production виконується лише під час інциденту через Supabase Dashboard або за офіційною процедурою. Workflow staging навмисно не має доступу до production reset.
- До створення окремого staging-проєкту live restore rehearsal вважається незавершеним.
