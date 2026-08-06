# План розробки стримінгової платформи

> Робоча назва: **Frame** (тимчасова, змінити перед стартом дизайну).
>
> Мета: сучасний адаптивний вебсервіс для легального перегляду фільмів, серіалів та аніме з персоналізацією, прогресом перегляду, профілями, стріками, досягненнями й адміністративною панеллю.

---

## 0. Головні правила для нейромережі-розробника

1. Виконувати роботу поетапно: не переходити до наступної фази, доки поточна не запускається, не перевірена й не закомічена.
2. Перед кожною фазою читати цей файл і складати короткий список конкретних задач.
3. Після кожної фази запускати lint, typecheck, unit-тести та production build.
4. Не використовувати `any`, не вимикати TypeScript-перевірки, не залишати секрети у frontend-коді.
5. Усі зміни БД робити тільки через версійовані Supabase migrations.
6. Для кожної публічної таблиці вмикати Row Level Security (RLS) і створювати явні політики доступу.
7. Не копіювати дизайн Netflix/Crunchyroll один в один. Брати лише перевірені UX-патерни.
8. Не додавати надмірний неон, випадкові градієнти, glassmorphism на кожній картці, величезні заголовки та «AI-style» декоративний шум.
9. Усі сторінки робити mobile-first, доступними з клавіатури, з коректним focus state та контрастом WCAG AA.
10. Не використовувати піратські джерела, iframe-агрегатори чи чужі відеопотоки. Каталог і постери не дають права показувати сам фільм.
11. Публічні метадані можна імпортувати через легальне API (наприклад, TMDB з обов'язковою атрибуцією), а відео — лише власне або ліцензоване.
12. Для складної логіки (стріки, нагороди, видача доступу до відео, адмін-операції) використовувати SQL functions / Edge Functions, а не довіряти браузеру.
13. Завжди працювати відповідно до цього плану: виконувати фази по порядку, не пропускати їхні критерії готовності, відмічати завершені пункти й фіксувати причину кожного свідомого відхилення.

---

## 1. Межі продукту

### 1.1. MVP

- публічний лендінг;
- реєстрація, вхід, відновлення пароля, підтвердження email;
- один користувацький профіль на акаунт (архітектура одразу допускає кілька профілів);
- каталог із трьома головними типами: фільми, серіали, аніме;
- жанри, колекції, роки, країни, вікові рейтинги, статус виходу;
- пошук, фільтри, сортування;
- сторінка тайтлу, сезони та епізоди;
- відеоплеєр, субтитри, аудіодоріжки, якість, швидкість, fullscreen;
- збереження позиції та блок «Продовжити перегляд»;
- список «Хочу переглянути», обране, оцінки;
- історія переглядів;
- профіль, статистика, календар активності, стрік входів;
- нагороди за 10, 30, 60, 100, 180 і 365 активних днів;
- налаштування теми, мови, субтитрів, автоплею та приватності;
- базова адмін-панель для каталогу й модерації;
- SEO для публічних сторінок каталогу та тайтлів.

### 1.2. Після MVP

- кілька профілів усередині одного акаунта, дитячий профіль і PIN;
- власні списки/колекції з приватністю public/unlisted/private;
- коментарі або короткі рецензії з модерацією;
- друзі, підписки, спільна активність;
- синхронний watch party;
- підписка, платежі, плани доступу;
- PWA, push-сповіщення, офлайн-режим лише за наявності прав;
- Smart TV/мобільні клієнти через спільний API;
- персональні рекомендації на embeddings після накопичення достатньої кількості даних.

### 1.3. Не входить у першу версію

- завантаження відео звичайними користувачами;
- live-streaming;
- чат;
- складна соціальна мережа;
- автоматичний AI-дубляж;
- DRM-рівень Netflix. Якщо правовласники вимагають DRM, обрати відеопровайдера з Widevine/FairPlay/PlayReady до запуску.

---

## 2. Досліджені продуктові патерни, які варто використати

- **Netflix:** персональні ряди, «Продовжити перегляд», профільні рекомендації, вікові обмеження, керування мовою/субтитрами й автоплеєм.
- **Crunchyroll:** окремі сезони та версії озвучення, watchlist, користувацькі списки, історія, ручне «позначити переглянутим», автоперехід до наступної серії.
- **Plex:** єдина сторінка профілю з історією, списком перегляду та оцінками.
- Додати власну відмінність: спокійний кінематографічний дизайн, детальна статистика без гейміфікаційного спаму, календар активності, прозорі правила стріків і нагород.

Обов'язкові ряди на головній після входу:

1. Продовжити перегляд.
2. Нові епізоди серіалів, які користувач уже дивиться.
3. Мій список.
4. Рекомендовано на основі останніх переглядів.
5. Популярне цього тижня.
6. Новинки.
7. Окремі добірки фільмів, серіалів і аніме.
8. Жанрові та редакторські колекції.

---

## 3. Рекомендований технічний стек

### Frontend

- TypeScript у strict mode;
- React;
- Vite;
- React Router у Data Mode (`createBrowserRouter`, loaders, lazy routes, error boundaries);
- TanStack Query для server state, кешу та invalidation;
- Zustand лише для локального UI-state (плеєр, модальні вікна), не дублювати дані з Query;
- Tailwind CSS + CSS variables для дизайн-токенів;
- Radix UI primitives або shadcn/ui як доступна база, але з повністю власним оформленням;
- React Hook Form + Zod;
- Lucide Icons;
- HLS.js для кастомного HLS-плеєра там, де немає native HLS;
- Framer Motion лише для коротких функціональних анімацій;
- date-fns або Temporal polyfill для дат і часових поясів;
- i18next для української та майбутніх локалізацій.

### Backend і дані

- Supabase Postgres;
- Supabase Auth (email/password, magic link; Google/Apple пізніше);
- Supabase Storage лише для аватарів, обкладинок користувацьких списків та невеликих зображень;
- Supabase Edge Functions для секретних інтеграцій, видачі playback token, імпорту метаданих і адмін-операцій;
- Supabase Realtime тільки там, де справді потрібен realtime;
- `pg_cron` для планових задач;
- згенеровані типи БД у TypeScript.

### Відео

- Рекомендований старт: Cloudflare Stream або аналогічний спеціалізований сервіс;
- HLS/DASH з adaptive bitrate;
- signed playback tokens з коротким TTL;
- allowed origins / hotlink protection;
- окремі аудіодоріжки та WebVTT-субтитри;
- відео не зберігати як звичайні публічні файли Supabase Storage;
- зовнішній `provider_asset_id` зберігати в БД, секретні ключі — тільки на сервері.

### Якість та інфраструктура

- ESLint + Prettier;
- Vitest + React Testing Library;
- Playwright для основних end-to-end сценаріїв;
- MSW для моків API в тестах;
- GitHub Actions: lint → typecheck → test → build → e2e smoke;
- Sentry або аналог для помилок;
- PostHog або privacy-friendly analytics для подій продукту;
- деплой frontend на Vercel/Cloudflare Pages, Supabase окремо;
- `.env.example`, різні проєкти Supabase для local/staging/production.

---

## 4. Інформаційна архітектура та маршрути

### Публічні

```text
/
/browse
/movies
/series
/anime
/genres/:genreSlug
/collections/:collectionSlug
/title/:slug
/search?q=
/login
/register
/forgot-password
/reset-password
/verify-email
/about
/legal/terms
/legal/privacy
/legal/cookies
/credits
```

### Після входу

```text
/watch/:episodeId
/my-list
/lists
/lists/:listId
/history
/profile/:username
/profile/edit
/profile/stats
/profile/achievements
/settings/account
/settings/appearance
/settings/playback
/settings/language
/settings/privacy
/settings/sessions
/notifications
```

### Адмін

```text
/admin
/admin/titles
/admin/titles/new
/admin/titles/:id
/admin/seasons/:id
/admin/episodes/:id
/admin/genres
/admin/collections
/admin/imports
/admin/users
/admin/moderation
/admin/audit-log
```

Маршрути `/watch`, `/profile/edit`, `/settings/*` і `/admin/*` захистити route guards. Роль admin перевіряти на сервері/RLS, не лише у frontend.

---

## 5. UX кожної основної сторінки

### 5.1. Вхід у каталог `/`

За актуальним рішенням окремий маркетинговий лендінг і `/home` прибрані. `/` та legacy `/home` одразу переадресовують у `/browse`. Персональні ряди авторизованого користувача вбудовані у верх каталогу.

<!-- Архівний задум лендінгу, не входить у поточний UI:

1. Header: логотип, «Каталог», «Можливості», перемикач теми, «Увійти», основна CTA «Почати дивитися».
2. Hero: сильний короткий заголовок, пояснення цінності, дві CTA, одна якісна композиція з постерів без кислотного світіння.
3. Прев'ю каталогу: три вкладки «Фільми / Серіали / Аніме».
4. Блок можливостей: продовження з потрібного моменту, персональні списки, статистика, субтитри та озвучення.
5. Демонстрація профілю і календаря активності.
6. Блок «Дивись на будь-якому екрані».
7. FAQ: контент, ціна/доступ, пристрої, субтитри, приватність.
8. Footer: legal, credits/атрибуція даних, контакти, соцмережі.

Лендінг не повинен показувати фальшиві відгуки, вигадані цифри користувачів чи неіснуючі тарифи. -->

### 5.2. Персональні блоки каталогу `/browse`

- sticky header, глобальний пошук і профільне меню;
- кінематографічний hero одного рекомендованого тайтлу;
- горизонтальні ряди з keyboard controls;
- прогрес-бар прямо на картці;
- quick actions: відкрити, продовжити, додати до списку, оцінити;
- skeleton loading без стрибків layout;
- для нового користувача onboarding із вибором 5–10 улюблених тайтлів/жанрів;
- порожні стани з конкретною наступною дією.

### 5.3. Каталог

- вкладки/головні категорії: Фільми, Серіали, Аніме;
- фільтри: жанр, рік, країна, мова, віковий рейтинг, статус, тривалість, оцінка;
- для аніме: формат (TV, movie, OVA/ONA), сезон виходу, ongoing/completed, sub/dub;
- для серіалів: ongoing/completed/cancelled, кількість сезонів;
- сортування: популярність, новизна, рейтинг, дата додавання, A–Z;
- URL має зберігати фільтри для share/back navigation;
- desktop sidebar та mobile bottom sheet;
- grid/list view, пагінація або infinite scroll з доступною альтернативою.

### 5.4. Сторінка тайтлу

- backdrop, poster, назва, original title, рік, тривалість, рейтинг, age rating;
- короткий опис із expand;
- CTA «Дивитися / Продовжити», «До списку», «Оцінити»;
- жанри, країни, студії, режисери, актори/персонажі;
- сезони та епізоди, дата виходу, тривалість, thumbnail, прогрес;
- вибір озвучення й субтитрів до старту;
- трейлер;
- схожі тайтли;
- reviews/ratings після MVP;
- чіткий стан unavailable/licensing region, без битої кнопки перегляду.

### 5.5. Плеєр

- play/pause, seek, volume, mute, fullscreen, picture-in-picture;
- якість Auto/360/480/720/1080, якщо доступно;
- швидкість 0.5–2x;
- субтитри, стиль субтитрів, аудіодоріжка;
- keyboard shortcuts і список shortcut у help modal;
- 10-секундний rewind/forward;
- autoplay next episode з countdown та cancel;
- skip intro/recap/outro, якщо таймкоди задані;
- episode drawer і перемикання сезону;
- збереження позиції кожні 15–30 секунд, при pause, pagehide та завершенні;
- переглянутим вважати після 90% або явної ручної дії;
- resume з останньої позиції, але якщо залишилося менше 2 хвилин — запропонувати наступний епізод;
- «Ще дивитесь?» після кількох епізодів без взаємодії;
- помилки мережі з retry і збереженням позиції;
- токен на відео отримувати через захищену Edge Function.

### 5.6. Повна кастомізація профілю

- avatar: завантаження, crop, видалення, набір стандартних аватарів;
- cover/banner;
- display name, унікальний username, bio;
- pronouns (необов'язково), країна/часовий пояс;
- улюблені жанри, 3–5 featured titles;
- accent color із безпечної палітри;
- рамка аватара та badge з отриманих нагород;
- публічність профілю, статистики, історії, списків та активності окремими перемикачами;
- tabs: Overview, Lists, Ratings, Stats, Achievements;
- preview перед збереженням;
- username history/cooldown, зарезервовані системні імена.

### 5.7. Статистика

- переглянуті фільми;
- завершені серіали й аніме;
- переглянуті епізоди серіалів та аніме окремо;
- загальний час перегляду та час за останні 7/30/365 днів;
- улюблені жанри, декада, країна, студія;
- календар активності за рік;
- поточний і найдовший login streak;
- поточний і найдовший watch streak окремо;
- останні перегляди;
- прогрес до наступної нагороди;
- не рахувати повторні heartbeat-запити як новий перегляд.

### 5.8. Налаштування

- тема: system / dark / light;
- щільність інтерфейсу: comfortable / compact;
- reduced motion;
- мова інтерфейсу;
- бажана озвучка і запасна мова;
- бажані субтитри та їхній вигляд;
- autoplay preview, autoplay next episode, skip intro;
- streaming quality та data saver;
- email/push notifications;
- privacy controls;
- активні сесії, logout other devices;
- зміна email/пароля, MFA (після MVP);
- export data і delete account із повторним підтвердженням.

---

## 6. Візуальний напрям

### Принципи

- стиль: стриманий editorial cinema, а не gaming/neon;
- темна тема за замовчуванням: теплий графіт, не абсолютний чорний;
- світла тема: теплий off-white;
- один спокійний акцент: amber/coral або muted violet, обрати після moodboard;
- головний візуал — контентні постери й кадри, інтерфейс не конкурує з ними;
- border radius 10–16 px, без «пігулок» для кожного елемента;
- тіні м'які, градієнти тільки для читабельності тексту поверх зображень;
- великі постери з однаковими aspect ratio, стабільна сітка;
- анімації 120–240 ms, вимикаються через prefers-reduced-motion;
- на mobile — нижня навігація: Home, Search, My List, Profile.

### Токени

```text
colors: background, surface-1, surface-2, border, text, text-muted,
        accent, accent-hover, success, warning, danger
spacing: 4, 8, 12, 16, 24, 32, 48, 64
radii: 8, 12, 16, full
type: display, h1, h2, h3, body, small, caption
motion: fast 120ms, normal 180ms, slow 240ms
```

Спочатку створити moodboard і 3 ключові макети: landing desktop, home desktop, title mobile. Лише після затвердження переносити стиль на всі сторінки.

---

## 7. Структура `src`

```text
src/
├── app/
│   ├── App.tsx
│   ├── router.tsx
│   ├── providers.tsx
│   ├── query-client.ts
│   └── env.ts
├── routes/
│   ├── public/
│   │   ├── landing.route.tsx
│   │   ├── browse.route.tsx
│   │   ├── title.route.tsx
│   │   └── search.route.tsx
│   ├── auth/
│   │   ├── login.route.tsx
│   │   ├── register.route.tsx
│   │   └── reset-password.route.tsx
│   ├── app/
│   │   ├── home.route.tsx
│   │   ├── watch.route.tsx
│   │   ├── my-list.route.tsx
│   │   ├── history.route.tsx
│   │   ├── profile.route.tsx
│   │   └── settings.route.tsx
│   └── admin/
├── features/
│   ├── auth/
│   ├── catalog/
│   ├── search/
│   ├── player/
│   ├── watch-progress/
│   ├── watchlists/
│   ├── ratings/
│   ├── profiles/
│   ├── stats/
│   ├── streaks/
│   ├── achievements/
│   ├── recommendations/
│   ├── notifications/
│   └── admin/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── media/
│   ├── feedback/
│   └── forms/
├── services/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── database.types.ts
│   │   └── queries/
│   ├── analytics/
│   └── video/
├── hooks/
├── stores/
├── schemas/
├── types/
├── lib/
│   ├── dates.ts
│   ├── formatters.ts
│   ├── permissions.ts
│   └── constants.ts
├── styles/
│   ├── globals.css
│   ├── tokens.css
│   └── themes.css
├── assets/
├── test/
└── main.tsx
```

Поза `src`:

```text
supabase/
├── migrations/
├── functions/
│   ├── issue-playback-token/
│   ├── register-daily-activity/
│   ├── import-catalog/
│   └── admin-content-action/
├── seed.sql
└── config.toml
public/
tests/e2e/
.env.example
```

Правило модулів: route компонують features; feature не імпортує route; `components/ui` не знає про бізнес-логіку; Supabase-виклики не розкидати по JSX.

---

## 8. Модель даних Supabase

Усі primary key — UUID, усі дати — `timestamptz`, для slug/username — case-insensitive unique index. Додати `created_at`, `updated_at` там, де доречно.

### Користувачі

```text
profiles
- id -> auth.users.id
- username, display_name, bio
- avatar_path, banner_path, accent_color
- timezone (IANA, default Europe/Kyiv або визначений під час onboarding)
- locale, is_public
- featured_badge_id

profile_preferences
- profile_id
- theme, density, reduced_motion
- ui_language, preferred_audio_language, fallback_audio_language
- preferred_subtitle_language, subtitles_enabled
- autoplay_next, autoplay_previews, skip_intro, data_saver
- profile_visibility, stats_visibility, history_visibility, lists_visibility

user_roles
- user_id
- role: user | moderator | editor | admin

user_devices
- id, user_id, device_name, last_seen_at, ip_hash, user_agent_summary
```

Не зберігати ролі в user-editable metadata. Секретний/service ключ ніколи не відправляти в браузер.

### Каталог

```text
titles
- id, slug
- type: movie | series | anime
- title, original_title, synopsis, short_synopsis
- release_date, end_date, status
- runtime_minutes, age_rating
- poster_path, backdrop_path, trailer_url
- original_language, country_codes[]
- tmdb_id (nullable), metadata_source
- publication_status: draft | scheduled | published | archived

genres
- id, slug, name

title_genres
- title_id, genre_id

people
- id, slug, name, photo_path, biography

title_credits
- title_id, person_id, department, role, character_name, sort_order

studios
- id, slug, name

title_studios
- title_id, studio_id

seasons
- id, title_id, season_number, name, synopsis, poster_path
- air_date, publication_status

episodes
- id, season_id, episode_number, title, synopsis
- runtime_seconds, air_date, thumbnail_path
- intro_start, intro_end, recap_start, recap_end, outro_start
- publication_status

video_assets
- id, episode_id
- provider, provider_asset_id
- audio_language, version_label
- duration_seconds, status, requires_entitlement

subtitle_tracks
- id, video_asset_id, language, label, kind, file_path

collections
- id, slug, name, description, cover_path, is_featured

collection_items
- collection_id, title_id, sort_order
```

Для фільму створювати технічний season 0 / episode 1 або дозволити `video_assets.title_id`; перший варіант спрощує єдину модель прогресу, але приховувати технічний епізод в UI.

### Взаємодії

```text
watch_progress
- profile_id, episode_id
- position_seconds, duration_seconds, progress_percent
- started_at, last_watched_at, completed_at
- play_count
- unique(profile_id, episode_id)

watch_sessions
- id, profile_id, episode_id
- started_at, ended_at, watched_seconds
- completion_reason, device_type

ratings
- profile_id, title_id, score (1..10), created_at, updated_at

lists
- id, profile_id, name, description, cover_path
- visibility: private | unlisted | public
- is_system, system_key: watchlist | favorites | null

list_items
- list_id, title_id, sort_order, note, added_at

follows
- follower_profile_id, followed_profile_id, status

notifications
- id, profile_id, type, payload jsonb, read_at
```

`watch_sessions` — джерело аналітики; `watch_progress` — швидкий поточний стан. Для статистики не сумувати heartbeat напряму без дедуплікації.

### Стріки та нагороди

```text
daily_activity
- profile_id
- activity_date (date у timezone профілю)
- first_seen_at, last_seen_at
- visit_count
- watched_seconds
- episodes_completed, movies_completed
- unique(profile_id, activity_date)

streaks
- profile_id
- kind: login | watch
- current_count, longest_count
- last_qualified_date
- updated_at

achievement_definitions
- id, key, name, description, icon, category
- threshold, is_secret, is_active

profile_achievements
- profile_id, achievement_id
- unlocked_at, progress, seen_at
- unique(profile_id, achievement_id)

achievement_events
- id, profile_id, achievement_id, source_event_id, created_at
```

### Адміністрування

```text
content_import_jobs
- id, source, status, payload, result, started_at, finished_at, created_by

audit_log
- id, actor_user_id, action, entity_type, entity_id
- before jsonb, after jsonb, created_at

reports
- id, reporter_profile_id, target_type, target_id, reason, status
```

### Основні індекси

- `titles(type, publication_status, release_date desc)`;
- trigram/FTS index на назви й original title;
- `episodes(season_id, episode_number)` unique;
- `watch_progress(profile_id, last_watched_at desc)`;
- `daily_activity(profile_id, activity_date desc)`;
- `list_items(list_id, sort_order)`;
- GIN для масивів/пошуку лише після перевірки query plan.

---

## 9. Правильна логіка login streak

Не збільшувати стрік усім користувачам автоматично о 00:00. Це зарахувало б день людям, які не заходили на сайт.

### Алгоритм

1. Після успішного відкриття застосунку авторизованим користувачем викликати `register_daily_activity()` один раз за сесію.
2. Сервер бере timezone з `profiles`, сам визначає локальну дату; дату з браузера не приймати як істину.
3. `INSERT ... ON CONFLICT` створює або оновлює рівно один `daily_activity` за локальну дату.
4. У транзакції заблокувати рядок `streaks` для користувача.
5. Якщо `last_qualified_date = today`, count не збільшувати.
6. Якщо `last_qualified_date = today - 1 day`, `current_count += 1`.
7. Якщо є пропущений день, `current_count = 1`.
8. `longest_count = greatest(longest_count, current_count)`.
9. Перевірити thresholds 10/30/60/100/180/365; нагороду вставити idempotent через unique constraint.
10. Повернути актуальний стрік і нові нагороди, показати одне ненав'язливе toast/modal повідомлення.

`pg_cron` о 00:00 потрібен не для нарахування відвідувань, а для агрегатів, планових сповіщень і cleanup. Timezone користувача може змінюватися не частіше одного разу на 7 днів, щоб уникнути накрутки. Врахувати DST через IANA timezone, не через ручний UTC offset.

Окремий `watch` streak зараховує день лише після, наприклад, 10 хвилин реального перегляду або завершення одного епізоду/фільму. Login streak і watch streak не змішувати.

### Нагороди MVP

- 10 днів — «Перший ритм»;
- 30 — «Місяць у кадрі»;
- 60 — «Подвійний сезон»;
- 100 — «Сотий кадр»;
- 180 — «Пів року історій»;
- 365 — «Рік прем'єр»;
- додатково: перший фільм, 10 фільмів, 100 епізодів, 1 000 годин (довгостроково), 10 жанрів, завершений серіал.

Нагороди не повинні заохочувати шкідливий binge-watching. Не давати бонус за безперервний багатогодинний перегляд.

---

## 10. RLS та безпека

1. `profiles`: публічно читати тільки дозволені поля публічного профілю; власник оновлює лише свій рядок.
2. `profile_preferences`, `watch_progress`, `watch_sessions`, private lists, `daily_activity`, `streaks`: тільки власник.
3. `titles/genres/seasons/episodes`: anon/authenticated читають тільки `published`; editor/admin змінюють через перевірену роль.
4. `video_assets`: не віддавати provider ID і технічні поля публічно; playback token видає Edge Function після auth/entitlement check.
5. Адмін-операції — server-only secret, audit log для кожної зміни.
6. Rate limit: login/register, search, playback token, progress heartbeat, profile update, upload.
7. Валідація MIME, розміру та dimensions аватарів/банерів; random storage paths.
8. HTML/Markdown користувача санітизувати; у bio не дозволяти довільний HTML.
9. CSP, HTTPS, secure headers, захист від open redirect.
10. CAPTCHA після підозрілих auth-запитів.
11. Збирати мінімум персональних даних; IP не зберігати відкритим текстом без потреби.
12. Підготувати privacy policy, cookie consent для необов'язкової аналітики, export/delete account.

---

## 11. Рекомендації

### MVP — без складного ML

Обчислювати score з:

- збігів улюблених жанрів;
- оцінених і завершених тайтлів;
- типу контенту, який користувач дивиться частіше;
- популярності та свіжості;
- виключення вже завершених/прихованих тайтлів;
- доступності у регіоні та потрібної мови.

Пояснювати рекомендацію: «Тому що ви дивилися…» або «Схоже за жанрами…». Новому користувачу — onboarding preferences + різноманітна популярна добірка. Пізніше додати collaborative filtering/embeddings і A/B тестувати.

---

## 12. Пошук та SEO

- нормалізація українських/англійських/original назв і альтернативних назв;
- typo tolerance через Postgres FTS + `pg_trgm`;
- instant suggestions із debounce;
- пошук за назвою, актором, режисером, студією;
- recent searches локально або приватно в профілі;
- canonical URL, title/description, Open Graph, JSON-LD `Movie`/`TVSeries`;
- sitemap для опублікованих тайтлів/жанрів/колекцій;
- noindex для search, watch, settings, admin;
- SSR/prerender публічних сторінок розглянути після MVP, якщо SPA недостатньо для SEO.

---

## 13. Покроковий план реалізації

### Фаза 1 — Product foundation

- [x] Зафіксувати тимчасову назву, цільову країну, beta-модель доступу та безпечне джерело demo-відео.
- [x] Зафіксувати MVP/non-MVP і user stories.
- [x] Намалювати sitemap та 5 ключових user flows.
- [x] Підготувати moodboard і дизайн-токени.
- [x] Створити wireframes: landing, home, catalog, title, watch, profile.
- [ ] Погодити робочі рішення з власником продукту; фінальна назва/домен не блокують фазу 2.

Артефакт фази: `docs/phase-01-product-foundation.md`.

### Фаза 2 — Ініціалізація проєкту

- [x] Створити Vite + React + TypeScript strict.
- [x] Підключити React Router Data Mode, Query, Tailwind, Zod, forms.
- [x] Налаштувати aliases, ESLint, Prettier, Vitest, Playwright.
- [x] Створити `.env.example`, env validation і CI.
- [x] Побудувати папки відповідно до структури вище.
- [x] Критерій: clean install, format/lint/typecheck/test/build і Chromium smoke e2e проходять.

### Фаза 3 — Design system і shell

- [x] Реалізувати tokens/themes/global styles.
- [x] Створити Button, Input, Select, Dialog, Drawer, Tabs, Tooltip, Skeleton, Toast.
- [x] App shell: header, desktop nav, mobile bottom nav, footer.
- [x] MediaCard, MediaRow, Poster, ProgressBar, EmptyState, ErrorState.
- [x] Story/examples для всіх станів компонентів на `/design-system`.
- [x] Перевірити keyboard, focus, contrast, reduced motion у desktop/mobile smoke-тестах.

### Фаза 4 — Supabase foundation

- [ ] Запустити local Supabase і створити staging project. Конфіг готовий; локальний запуск очікує Docker, staging — акаунт власника.
- [x] Написати перші migrations: profiles, preferences, roles.
- [x] Додати trigger створення профілю після signup.
- [x] Увімкнути RLS та написати pgTAP policy tests.
- [ ] Згенерувати TypeScript DB types із запущеної БД. Тимчасовий точний schema snapshot і команда генерації додані.
- [x] Налаштувати Storage buckets для avatar/banner з policies.

Артефакти й інструкція: `docs/phase-04-supabase.md`.

### Фаза 5 — Auth та onboarding

- [x] Register, email verification redirect, login, logout, forgot/reset password.
- [x] Protected routes і відновлення сесії без flash.
- [x] Auth error mapping зрозумілою українською.
- [ ] Onboarding: username, avatar, timezone і жанри готові; вибір 5 тайтлів додається після catalog migration у фазі 6.
- [ ] Settings sessions і logout other devices — після live-підключення Supabase.
- [ ] Live E2E: signup → verify → onboarding → home → logout/login очікує ключі `.env.local`; локальні redirect/browser smoke-тести проходять.

Артефакти й інструкція: `docs/phase-05-auth.md`.

### Фаза 6 — Каталог і адмінка

- [x] Migrations для titles, genres, seasons, episodes, assets, collections.
- [x] Seed із fictional demo metadata без відео та чужих зображень.
- [x] Admin CRUD тайтлів: editor guard, list, create draft, повне редагування, жанри, publish/draft/archive і delete з підтвердженням.
- [ ] Admin CRUD сезонів/епізодів реалізований: create/edit/publish/draft/archive/delete, масова кнопка «Опублікувати всі сезони та серії», episode таймкоди та підключення реального HTTPS HLS до кожного епізоду; потрібен authenticated live smoke-test.
- [ ] Admin CRUD жанрів і колекцій реалізований: featured/publication workflow та ordered collection items; потрібен authenticated live smoke-test.
- [ ] Люди, акторський/творчий склад і студії: створення довідників, прив'язка в admin editor та показ на public title page реалізовані; потрібен authenticated live smoke-test.
- [ ] TMDB search/preview/import UI автоматично підтягує жанри, студії/мережі, акторів і ключових членів команди, віковий рейтинг, трейлер, усі сезони, specials та епізоди; на сторінці спочатку показуються 8 головних акторів і до 4 ключових членів команди з кнопкою «Показати всіх»; потрібен live smoke-test.
- [ ] Supabase Storage upload для poster/backdrop реалізований з preview, MIME/10 MB validation та public URL; потрібен authenticated live upload test.
- [x] Каталог: category tabs, URL-фільтри за жанром/роком/статусом/віком/мовою/країною, sorting і pagination готові.
- [x] Title page і episodes UI.
- [x] Search schema з FTS/trigram підключена до UI через `search_catalog`; live RPC-пошук перевірений.

Артефакти й SQL-порядок: `docs/phase-06-catalog.md`.

### Фаза 7 — Лендінг

- [x] Зібрати секції landing; catalog preview і hero підключені до реальних опублікованих даних Supabase без вигаданих відгуків, тарифів чи user counts.
- [x] Responsive hero і content previews для фільмів, серіалів та аніме.
- [ ] FAQ, footer і окремі privacy/terms pages готові; додати production legal entity/contact і пройти юридичний review.
- [ ] Route-aware title/description/canonical/OG metadata та автоматичний performance budget готові; crawler-friendly dynamic OG потребує production domain і prerender/SSR.
- [x] Публічний каталог і сторінки тайтлів не блокуються реєстрацією.

### Фаза 8 — Відеоплеєр

- [x] Захищений `/watch/demo` інтегрує Mux HLS test stream Big Buck Bunny (Blender Foundation, CC BY 3.0), native HLS/hls.js fallback, loading/error/retry та attribution.
- [x] Edge Function `issue-playback-token` remote ACTIVE: user JWT, 5-хвилинна signed session, no-store, server-only asset lookup, entitlement guard; unauthenticated 401 та authenticated playback перевірені.
- [ ] Кастомні controls, timeline, ±10s, volume, speed, adaptive quality, UK/RU/оригінальні HLS-озвучки, embedded HLS audio/subtitle tracks, shortcuts, fullscreen і PiP реалізовані; потрібен live UI smoke-test.
- [ ] Публічна сторінка більше не веде на demo: hero відкриває перший реальний опублікований епізод; додано selector сезону, картки серій із кадрами та прямі watch-кнопки. Episodes drawer, next/autoplay і skip intro/outro також реалізовані; потрібен live smoke-test.
- [ ] Retry/network states, збереження позиції під час оновлення source та автоматичний token refresh за 30 секунд до завершення сесії реалізовані; потрібен live UI smoke-test.
- [ ] Додано адаптер `official_embed` як запасне джерело: iframe працює тільки для HTTPS-доменів із server-side білого списку `EMBED_ALLOWED_HOSTS`, підтримує варіанти озвучення та не замінює основний HLS. Потрібні офіційний провайдер, його дозвіл/API, secret і live smoke-test; сторонні агрегатори та копіювання чужих потоків заборонені.
- [ ] Перевірити Chrome, Firefox, Safari, iOS Safari, Android Chrome.

### Фаза 9 — Прогрес, історія, списки й оцінки

- [x] Migration `20260806170000_watch_progress_lists_ratings.sql` для progress/sessions/ratings/lists створена з індексами, constraints, grants і RLS; таблицю `watch_progress` підтверджено у remote Supabase через HTTP 200.
- [ ] Throttled heartbeat кожні 15 секунд, server-side anti-inflation guard і final flush при pause/ended/hidden/pagehide реалізовані; очікують застосування двох migration та live smoke-test.
- [ ] «Продовжити перегляд», відновлення збереженої позиції та hide action реалізовані; потрібні застосовані міграції й authenticated live smoke-test.
- [ ] Ручне mark watched/unwatched для episode/season/title реалізовано через окрему RPC без накручування watch time; міграція `20260806200000_manual_watch_status.sql` очікує застосування та live smoke-test.
- [ ] Watchlist, favorites і custom lists реалізовані з функціональною кнопкою на title page та сторінкою `/my-list`; міграція `20260806210000_ensure_system_lists.sql` очікує застосування та authenticated live smoke-test.
- [ ] History із пошуком, фільтрами, resume, clear та delete individual item реалізована на `/history`; потрібен authenticated live smoke-test.
- [ ] Ratings 1–10 з optimistic update, видаленням і rollback у разі помилки реалізовані на title page; потрібен authenticated live smoke-test.

### Фаза 10 — Профіль, статистика, стріки

- [ ] Повний profile editor з avatar 1:1, banner 3:1, canvas crop/zoom/offset, WebP upload, bio, username, timezone, locale й accent color реалізовано на `/profile/edit`; потрібен authenticated live upload smoke-test.
- [ ] Профіль тепер спочатку відкривається як preview для інших, а редагування доступне окремою кнопкою. Privacy controls реально керують видимістю stats/history/lists через RLS; міграції `20260806220000_profile_privacy.sql` і `20260806250000_public_profile_sections.sql` очікують застосування й перевірки двома сесіями.
- [ ] `daily_activity`, `streaks`, achievements і profile achievements створені в migration `20260806230000_activity_streaks_achievements.sql`; очікує застосування та RLS smoke-test.
- [ ] Transactional `register_daily_activity()` використовує timezone профілю, advisory lock, ідемпотентність дня, reset/increment та нагороди 3/7/10/30/100/365; frontend повторює виклик о локальній півночі. Потрібен live smoke-test.
- [ ] Агрегація watch stats без подвійного рахунку реалізована через privacy-aware RPC `get_profile_stats()` на основі `watch_sessions`; міграція `20260806240000_profile_stats.sql` очікує застосування та live smoke-test.
- [ ] Повний stats dashboard перенесено безпосередньо у профіль: усі лічильники, heatmap за 365 днів і отримані нагороди; видимість для інших визначає `stats_visibility`. Окремий `/profile/stats` зберігає керування featured-нагородою; потрібен authenticated live smoke-test.
- [x] Unit-тести timezone, весняного/осіннього DST, пропущеного дня, повторного запиту та зміни timezone; форми профілю й onboarding відхиляють невалідні IANA timezone.

### Фаза 11 — Персоналізація та сповіщення

- [ ] MVP recommendation scoring реалізовано серверною RPC: улюблені жанри, високі оцінки, списки, глобальний рейтинг і новизна; блок «Для вас» перенесено безпосередньо в каталог `/browse`. Міграція `20260806260000_personalized_recommendations.sql` очікує застосування та live smoke-test.
- [ ] New episode notifications реалізовані server-side trigger для користувачів із прогресом або тайтлом у списку, з deduplication і spoiler-safe payload; міграція `20260806270000_new_episode_notifications.sql` очікує застосування та live smoke-test.
- [ ] In-app notification center реалізований: дзвіночок і unread badge, `/notifications`, mark one/all read, delete, polling та spoiler-safe direct episode links; потрібен authenticated live smoke-test.
- [ ] Налаштування email notifications реалізовані на `/settings/notifications`: opt-in, instant/daily/weekly і server-only delivery queue. Міграція `20260806280000_email_notification_preferences.sql` очікує застосування; фактичний provider worker потребує окремої production-інтеграції.
- [x] Не надсилати spoilers у тексті сповіщення: UI parser і unit-тест ігнорують episode title/synopsis, email queue зберігає лише посилання на notification.

### Фаза 12 — Hardening і реліз

- [ ] RLS/security audit розпочато: закрито прямий обхід featured badge та розсинхронізацію privacy/preferences, посилено grants приватних таблиць і додано `npm run security:check`; міграція `20260806290000_security_hardening.sql` очікує застосування та two-session remote smoke-test.
- [ ] Accessibility baseline реалізовано: route focus/live announcement, keyboard scroll regions, form/progress semantics, non-color unread state, reduced motion та автоматичні WCAG AA contrast тести (45/45 тестів проходять). Потрібен ручний NVDA/VoiceOver і keyboard smoke-test.
- [ ] Lighthouse/performance audit на mobile. Автоматичний JS budget уже проходить: 184.0 KB gzip із ліміту 200 KB; повний Lighthouse виконати після preview/deploy.
- [x] Оптимізація зображень, lazy loading, route code splitting: маршрути розділені, HLS-плеєр завантажується окремо лише на playback, постери мають фіксоване співвідношення, intrinsic size, lazy loading та async decode.
- [ ] Error monitoring, analytics, health checks реалізовано на рівні застосунку: opt-in згода, allow-list подій, client/route errors, page views/load timing та `/health`; міграція `20260806300000_observability.sql` очікує застосування й production smoke-test.
- [ ] Backup/restore rehearsal і staging підготовлено: weekly/manual private logical backup, SHA-256 checksums, manual guarded staging reset, окремий staging env та synthetic seed без реальних користувачів. Потрібні GitHub secrets, окремий Supabase staging project і перший live rehearsal.
- [ ] Legal review: ліцензії на відео, TMDB attribution, privacy/terms/cookies.
- [ ] Beta для невеликої групи, збір feedback, виправлення P0/P1.
- [ ] Production release + rollback plan.

---

## 14. Тести, які не можна пропускати

### Unit/integration

- streak на перший день, наступний день, той самий день, пропуск дня;
- DST і різні IANA timezone;
- threshold achievement видається один раз;
- progress не перевищує duration і не регресує через старий heartbeat;
- 90% completion;
- рекомендації виключають прихований/недоступний контент;
- Zod-схеми форм і env;
- RLS: користувач A не читає/не змінює приватні дані B;
- editor не може підвищити собі роль;
- anonymous не отримує playback token для protected content.

### E2E

1. Landing → register → onboarding → home.
2. Browse → filter → title → add to list.
3. Watch → save progress → reload → resume.
4. Finish episode → next episode → history/stats update.
5. Profile edit → privacy → public profile check.
6. Daily visit → streak → achievement unlock.
7. Admin draft → publish → title visible publicly.
8. Mobile navigation and player controls.

---

## 15. Performance budgets

- initial JS для landing прагнути < 200 KB gzip без контентних зображень;
- LCP < 2.5 s на типовому mobile 4G;
- CLS < 0.1;
- INP < 200 ms;
- poster/backdrop завжди мають width/height та responsive `srcset`;
- lazy-load нижніх рядів і важких route modules;
- не завантажувати player SDK до входу на `/watch`;
- кеш каталогу через Query і CDN, персональні дані не кешувати публічно;
- virtualization лише для справді великих списків.

---

## 16. Definition of Done для кожної задачі

- реалізовано всі normal/loading/empty/error/disabled states;
- TypeScript без помилок і `any`;
- доступно з клавіатури та на mobile;
- немає секретів і зайвих персональних даних у client/logs;
- RLS/permission перевірено, якщо задача працює з БД;
- є потрібні unit/integration/e2e тести;
- lint, typecheck, tests і build проходять;
- UI відповідає дизайн-токенам;
- оновлена документація та migration/seed, якщо потрібно;
- ручна перевірка основного сценарію завершена.

---

## 17. Перший конкретний спринт

1. Визначити назву, джерело контенту й модель доступу.
2. Створити React/TS/Vite-проєкт і базову структуру `src`.
3. Налаштувати маршрути та app shell.
4. Створити dark/light tokens без надмірного неону.
5. Реалізувати responsive landing із мок-даними.
6. Підняти local Supabase, migrations для profiles/preferences/roles і RLS.
7. Зробити register/login/reset та onboarding.
8. Додати CI й базові тести.

Результат спринту: користувач відкриває якісний лендінг, реєструється, проходить onboarding, потрапляє на порожню/демо головну, змінює тему й профіль; дані безпечно зберігаються в Supabase.

---

## 18. Ключові ризики до початку розробки

1. **Права на контент.** Найважливіший ризик. TMDB дає метадані, а не право транслювати відео.
2. **Вартість відеотрафіку.** До вибору провайдера порахувати storage, encoding і delivery для очікуваних годин перегляду.
3. **SEO у чистій SPA.** Для публічного каталогу може знадобитися prerender/SSR.
4. **Статистика.** Heartbeat легко подвоює час; потрібні session IDs, idempotency і серверна агрегація.
5. **Стріки.** Timezone/DST і повторні запити мають бути покриті тестами.
6. **Надмірний scope.** Social, watch party, subscriptions і ML залишити після стабільного MVP.
7. **Модерація.** Якщо додати reviews/comments, до релізу потрібні reports, blocking, rules і moderator tools.

---

## 19. Корисні офіційні джерела

- Supabase Auth: https://supabase.com/docs/guides/auth
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase scheduled functions: https://supabase.com/docs/guides/functions/schedule-functions
- React Router modes: https://reactrouter.com/start/modes
- Cloudflare Stream security: https://developers.cloudflare.com/stream/viewing-videos/securing-your-stream/
- TMDB attribution FAQ: https://developer.themoviedb.org/docs/faq
- Netflix product patterns: https://help.netflix.com/en/node/102377
- Crunchyroll website features: https://help.crunchyroll.com/hc/en-us/articles/22728708616852-Getting-started-on-Crunchyroll-website
- Plex profile/history/watchlist patterns: https://support.plex.tv/articles/profile/
