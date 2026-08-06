# Фаза 4 — Supabase foundation

## Підготовлено

- локальний Supabase config;
- migration для `profiles`, `profile_preferences`, `user_roles`;
- trigger, який після signup атомарно створює профіль, налаштування та роль `user`;
- RLS для всіх public-таблиць;
- server-managed ролі через `has_role()`;
- public buckets `avatars` і `profile-banners` із обмеженнями MIME/розміру;
- Storage policies: користувач змінює файли лише у власній UUID-папці;
- pgTAP structural/policy tests;
- типізований Supabase client і schema snapshot.

## Локальний запуск після встановлення Docker Desktop

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:test
npm run supabase:types
```

Після `supabase:start` скопіювати локальні URL і publishable key у `.env.local`.

## Staging

Staging не створюється автоматично без акаунта власника. Після створення окремого Supabase project:

```bash
npx supabase login
npx supabase link --project-ref YOUR_STAGING_REF
npx supabase db push --dry-run
npx supabase db push
```

Перед `db push` обов'язково переглянути diff. Production і staging не повинні використовувати один проєкт або ключі.

## Варіант без Docker: SQL Editor

1. Відкрити migration `supabase/migrations/20260806130000_profiles_preferences_roles.sql`.
2. Скопіювати весь файл у Supabase Dashboard → SQL Editor → New query.
3. Натиснути Run один раз.
4. Відкрити `supabase/sql-editor/phase-04-verify.sql`, виконати його окремо.
5. У verification result кожен рядок повинен мати `passed = true`.

Migration є idempotent лише частково. Не запускати її повторно після успішного застосування. Наступні зміни БД виконувати новими migration-файлами.
