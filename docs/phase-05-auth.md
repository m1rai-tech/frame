# Фаза 5 — Auth та onboarding

## Реалізовано

- session provider без flash захищеного контенту;
- register, email confirmation redirect, login і logout;
- forgot/reset password;
- український mapping типових auth-помилок;
- protected route guard зі збереженням початкового маршруту;
- onboarding: display name, username, timezone, genres, optional avatar;
- аватар перевіряється за MIME і розміром до 5 MB;
- unconfigured state, якщо ключі Supabase ще не додані.

## SQL Editor

Після migration фази 4 виконати:

`supabase/sql-editor/phase-05-auth-onboarding.sql`

Вона додає лише `onboarding_completed_at` і тимчасові genre preferences.

## Supabase Dashboard

У Authentication → URL Configuration додати:

- Site URL: `http://localhost:5173` для локальної розробки;
- Redirect URL: `http://localhost:5173/auth/callback`;
- Redirect URL: `http://localhost:5173/reset-password`.

Перед production замінити Site URL і додати HTTPS-домен production/staging.

## Live smoke flow

1. Register.
2. Відкрити confirmation email.
3. Redirect на `/auth/callback`, потім `/onboarding`.
4. Заповнити профіль і завантажити маленький avatar.
5. Перейти в каталог `/browse`.
6. Logout → login.
7. Forgot password → reset link → новий password.
