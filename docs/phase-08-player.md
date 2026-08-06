# Фаза 8 — Відеоплеєр

## Реалізовано

- захищений route `/watch/:episodeId` усередині auth guard;
- `/watch/demo` використовує adaptive HLS test stream Big Buck Bunny від Mux;
- native HLS для сумісних браузерів і `hls.js` fallback;
- loading, unsupported, fatal error і retry states;
- базове network/media recovery через `hls.js`;
- `playsInline`, metadata preload і native accessible controls;
- `noindex,nofollow` для watch route;
- плеєр і `hls.js` завантажуються лише в lazy watch chunk;
- видима атрибуція Blender Foundation і CC BY 3.0.
- frontend більше не містить HLS URL: він отримує runtime-validated playback session через Edge Function;
- `issue-playback-token` перевіряє user JWT і створює 5-хвилинний HS256 token з унікальним `jti`;
- відповіді playback мають `Cache-Control: no-store`;
- production `video_assets` читаються service role лише всередині функції;
- `requires_entitlement=true` повертає 403 до реалізації підписок;
- `direct_hls` приймає лише HTTPS asset URL.
- `official_embed` дозволяє підключити запасний iframe офіційного провайдера без змін схеми БД;
- embed URL перевіряється в Edge Function: HTTPS обов'язковий, hostname має бути у server-side secret `EMBED_ALLOWED_HOSTS`;
- адмінка дозволяє обрати `Власний HLS` або `Офіційний зовнішній плеєр` для кожної озвучки;
- iframe ізольований через `sandbox`, обмежений `referrerPolicy` та не отримує токени Frame;
- прогрес, skip intro/outro та наші кастомні controls недоступні всередині зовнішнього iframe.

## Джерела demo

- HLS fixture: `https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`;
- твір: Big Buck Bunny, © Blender Foundation;
- ліцензія: Creative Commons Attribution 3.0.

Demo не пов'язаний із тайтлами каталогу і не є production-відеопровайдером.

## Наступний крок

- отримати офіційний доступ і документацію обраного відеопровайдера;
- встановити `EMBED_ALLOWED_HOSTS` через Supabase Secrets, наприклад `player.licensed-provider.example`;
- передавати лише офіційні embed URL, на які власник проєкту має право;
- задеплоїти оновлену `issue-playback-token` та виконати live UI smoke-test.

`EMBED_ALLOWED_HOSTS` — список точних hostname через кому, без `https://`, шляхів і wildcard. Якщо secret порожній, усі embed-джерела відхиляються. Жодна SQL migration для адаптера не потрібна: він використовує наявні `video_assets.provider` і `provider_asset_id`.

## Episodes і skip actions

- `/watch/:episodeId` завантажує published episode, season, title і сусідні епізоди через RLS;
- drawer показує всі серії поточного сезону та виділяє активну;
- кнопка наступного епізоду доступна під плеєром і під час outro;
- завершення відео автоматично відкриває наступний епізод;
- skip intro з’являється між `intro_start` та `intro_end`;
- next episode prompt з’являється після `outro_start`;
- thumbnail епізоду використовується як poster;
- demo має три synthetic episodes через `?part=1..3`, intro 00:05–00:12 і outro prompt наприкінці потоку;
- реальні playback URL як і раніше видає тільки `issue-playback-token`.

## Remote Supabase

Стан на 2026-08-06:

- `PLAYBACK_TOKEN_SECRET` встановлено в remote secrets і не зберігається у frontend або repository;
- `issue-playback-token` version 1 має статус `ACTIVE` та `verify_jwt=true`;
- запит без user JWT повертає очікуваний HTTP 401;
- authenticated `/watch/demo` playback успішно перевірено користувачем 2026-08-06.

## Кастомні controls

- play/pause через кнопку, клік по відео, `Space` або `K`;
- seek на 10 секунд кнопками та `ArrowLeft` / `ArrowRight`;
- timeline з точною позицією й форматуванням тривалості;
- mute через кнопку або `M`, volume slider;
- швидкість `0.5×`–`2×`;
- adaptive quality: `Auto` та рівні з HLS manifest;
- audio track selector для multi-audio streams;
- subtitles off/track selector для HLS subtitles;
- fullscreen через кнопку, подвійний клік або `F`;
- Picture-in-Picture через кнопку або `P`, якщо браузер підтримує API;
- компактні mobile controls та доступні aria-labels.

## Стабільність сесії та мережі

- playback-сесія автоматично оновлюється за 30 секунд до завершення строку дії;
- після оновлення source плеєр відновлює поточну позицію перегляду;
- стани `offline`, `waiting` і `stalled` показуються без зависання інтерфейсу;
- для тимчасових помилок виконується до трьох повторів із наростаючою затримкою;
- після фатальної помилки користувач отримує явну кнопку повторної спроби.
