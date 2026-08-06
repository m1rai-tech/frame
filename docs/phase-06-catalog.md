# Фаза 6 — Каталог і адмінка

## SQL Editor — порядок виконання

Після migrations фаз 4 і 5:

1. Виконати `supabase/migrations/20260806150000_catalog.sql`.
2. За бажанням виконати `supabase/seed.sql` — він додає лише fictional demo metadata без відео й чужих зображень.
3. Виконати `supabase/sql-editor/phase-06-verify.sql`.
4. У кожному verification row `passed` має бути `true`.

## Надання ролі editor/admin

Ролі не можна змінити з frontend. У SQL Editor замінити email на свій:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where email = 'YOUR_EMAIL'
on conflict (user_id, role) do nothing;
```

Не створювати admin-роль із `raw_user_meta_data`.

## Реалізовано

- 13 catalog tables;
- FTS + trigram indexes;
- draft/scheduled/published/archived workflow;
- RLS для public catalog та editor/admin operations;
- provider asset IDs і subtitles закриті від public API;
- public catalog images і private subtitles buckets;
- fictional seed;
- `/browse`, `/movies`, `/series`, `/anime`, `/title/:slug`;
- demo fallback для local/e2e;
- admin guard, title list, create draft і повний редактор метаданих та жанрів;
- people/credits/studios manager у редакторі тайтлу та public credits/studios на `/title/:slug`;
- publish/draft/archive actions, preview і підтверджене cascade-видалення тайтлу;
- `import-catalog` Edge Function повертає TMDB preview лише editor/admin.

## TMDB

Для Edge Function додати server secret `TMDB_ACCESS_TOKEN`. Його не можна додавати до `VITE_*` або frontend. Перед production у `/credits` обов'язково додати TMDB logo й офіційний attribution notice.

Реалізовано:

- `/admin/imports`: пошук фільмів і серіалів, preview та імпорт у draft;
- нормалізація назв, опису, дат, runtime, статусу, країн, мови, постера, backdrop і трейлера;
- для TV editor обирає категорію `series` або `anime`;
- `/credits`: офіційний TMDB logo та обов'язковий attribution notice;
- TMDB token використовується лише в Edge Function.

### Remote deploy без Docker

1. Виконати `npx supabase login` і завершити авторизацію у браузері.
2. Виконати `npx supabase link --project-ref YOUR_PROJECT_REF`.
3. У Supabase Dashboard відкрити **Edge Functions → Secrets** і додати `TMDB_ACCESS_TOKEN`. Не додавати цей token у `.env.local` або будь-яку змінну `VITE_*`.
4. Виконати `npx supabase functions deploy import-catalog`.
5. Увійти на сайт під editor/admin і перевірити `/admin/imports`.

Стан на 2026-08-06: CLI `2.111.0` авторизований, проєкт linked, `import-catalog` version 1 має статус ACTIVE, а `TMDB_ACCESS_TOKEN` присутній у remote secrets. Безтокеновий smoke-test повертає очікуваний HTTP 401; authenticated editor search/preview/import успішно перевірено на live Supabase.

## Ще в роботі у фазі 6

- season/episode create/edit/publish/draft/archive/delete форми та episode intro/recap/outro таймкоди реалізовані; очікують live smoke-test;
- genre CRUD і collection CRUD з featured/publication workflow та ordered title items реалізовані; очікують live smoke-test;
- people, credits і studios linking та їх public display реалізовані; очікують authenticated live smoke-test;
- розширені фільтри та pagination реалізовані: стан зберігається в URL, live Supabase-запити повертають count і жанри;
- public search використовує `search_catalog` FTS/trigram RPC; live query успішно знаходить опублікований тайтл;
- завантаження catalog images реалізовано для poster/backdrop; очікує live upload test;
- deploy і authenticated live test Edge Function виконані;
- повний live Supabase catalog E2E.

# Повний імпорт серіалів

- TMDB preview показує кількість сезонів та орієнтовну кількість епізодів;
- імпорт серіалу послідовно завантажує кожен сезон, включно із сезоном `0` (specials);
- для сезонів зберігаються TMDB ID, номер, назва, опис, дата та постер;
- для епізодів зберігаються TMDB ID, номер, назва, опис, дата, тривалість і кадр;
- усі імпортовані сезони й епізоди створюються як чернетки для перевірки редактором;
- повторний імпорт оновлює структуру за парою `title_id + season_number` та `season_id + episode_number`.

# Реальні відео епізодів

- у редакторі епізоду є блок «HLS-джерело епізоду»;
- підтримується захищений HTTPS HLS URL від власного CDN або відеопровайдера;
- джерело зберігається у приватній для глядачів таблиці `video_assets`;
- плеєр отримує URL лише через захищену `issue-playback-token` Edge Function;
- TMDB використовується тільки для метаданих та зображень і не надає повні відео чи права на показ.
