# Фаза 7 — Лендінг

## Реалізовано

- sticky header із навігацією, темою, login і основною CTA;
- responsive hero з backdrop та постерами з опублікованого каталогу Supabase;
- public CTA до `/browse`, яка не вимагає реєстрації;
- вкладки «Фільми / Серіали / Аніме» з актуальними catalog queries;
- блок можливостей без вигаданих тарифів, user counts і відгуків;
- демонстрація профілю, календаря активності та майбутніх streak rewards без фальшивих чисел;
- блок пристроїв, FAQ, фінальна CTA та footer;
- skeleton loading для catalog preview;
- unit test основної обіцянки продукту й public catalog CTA.
- privacy і terms routes з beta-попередженням, офіційними legal references та environment-configured owner/contact;
- route-aware title, description, canonical, Open Graph і Twitter metadata для landing, browse, title, credits і legal;
- автоматичний initial JavaScript budget на основі Vite manifest.

## Перевірено

- ESLint без warnings;
- TypeScript typecheck;
- 14 unit tests;
- production Vite build;
- landing route залишається code-split.
- initial JavaScript: 181.2 KB gzip із бюджету 200 KB.

## Залишилось у фазі 7

- production legal entity/contact та юридичний review;
- production domain, social preview asset і prerender/SSR для crawler-friendly dynamic OG;
- live responsive smoke-test.
