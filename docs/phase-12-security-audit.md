# Фаза 12 — Security baseline

## Виправлено

- пряме оновлення `profiles.featured_badge_id` заборонене: featured-нагорода змінюється лише через RPC, яка перевіряє факт отримання;
- пряме оновлення `profiles.is_public` заборонене: публічність профілю й секцій змінюється атомарно;
- старий широкий `UPDATE` grant на `profile_preferences` прибрано; privacy та email налаштування проходять через валідовані owner-scoped RPC;
- повторно заборонені клієнтські записи у watch sessions, streak/activity/achievements та email delivery queue;
- trigger-only функції signup, episode notification та email queue не можна викликати через API;
- автоматична перевірка контролює `search_path` усіх `SECURITY DEFINER` функцій, broad grants і базові гарантії приватної черги.

Міграція: `20260806290000_security_hardening.sql`.

## Залишено до наступного кроку

- authenticated two-session RLS smoke-test у remote Supabase;
- приватизація avatar/banner buckets із переходом на signed URLs;
- перевірка Edge Functions, CORS, rate limiting і ротації секретів;
- окремий dependency/security scan перед production.
