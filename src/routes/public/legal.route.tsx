import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { env } from '@/app/env';
import { usePageMeta } from '@/app/use-page-meta';
import { AppShell } from '@/components/layout/AppShell';

const updatedAt = '6 серпня 2026 року';

function PrivacyContent() {
  const contact = env.VITE_LEGAL_CONTACT_EMAIL;
  const entity = env.VITE_LEGAL_ENTITY_NAME;
  return (
    <>
      {!entity || !contact ? (
        <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm">
          До публічного запуску власник має додати юридичне ім’я та контактний email у production
          environment.
        </div>
      ) : null}
      <section>
        <h2>1. Хто обробляє дані</h2>
        <p>
          Володілець сервісу: {entity ?? 'не вказано — beta-середовище'}. Контакт щодо приватності:{' '}
          {contact ? <a href={`mailto:${contact}`}>{contact}</a> : 'ще не налаштовано'}.
        </p>
      </section>
      <section>
        <h2>2. Які дані обробляються</h2>
        <p>
          Для акаунта Frame може обробляти email, ідентифікатор користувача, username, avatar,
          timezone, налаштування теми та контентні уподобання. Після запуску функцій перегляду також
          можуть зберігатися історія, прогрес, списки, оцінки, активні дні та нагороди.
        </p>
      </section>
      <section>
        <h2>3. Для чого потрібні дані</h2>
        <p>
          Дані використовуються для входу, роботи профілю, синхронізації прогресу, персоналізації,
          безпеки, запобігання зловживанням і підтримки користувача. Frame не заявляє про продаж
          персональних даних.
        </p>
      </section>
      <section>
        <h2>4. Постачальники та передача</h2>
        <p>
          Аутентифікація, база даних і файли працюють через Supabase. TMDB використовується
          редакторами лише як джерело метаданих каталогу; токен TMDB не передається у браузер.
          Production-власник має перевірити регіони обробки, договори з постачальниками та законні
          підстави міжнародної передачі.
        </p>
      </section>
      <section>
        <h2>5. Зберігання й безпека</h2>
        <p>
          Дані акаунта зберігаються, доки акаунт активний або доки це потрібно для роботи сервісу та
          виконання правових обов’язків. Доступ до приватних таблиць обмежується Supabase RLS;
          секретні ключі не повинні потрапляти у frontend.
        </p>
      </section>
      <section>
        <h2>6. Ваші права</h2>
        <p>
          Залежно від застосовного законодавства ви можете запитати доступ, виправлення, видалення,
          обмеження обробки, заперечення або отримання копії даних. Для перевірки особи сервіс може
          попросити підтвердити контроль над акаунтом.
        </p>
      </section>
      <section>
        <h2>7. Локальне зберігання</h2>
        <p>
          Браузер зберігає вибір теми й технічні дані сесії, необхідні для входу. Якщо пізніше
          будуть додані необов’язкові analytics або marketing cookies, для них потрібне окреме
          повідомлення та, де це вимагається, згода.
        </p>
      </section>
      <section id="contact">
        <h2>8. Контакт і зміни</h2>
        <p>
          Запити надсилаються на {contact ?? 'контакт, який буде вказано перед production-запуском'}
          . Суттєві зміни цієї сторінки мають супроводжуватися новою датою редакції.
        </p>
      </section>
      <p className="text-sm text-muted">
        Орієнтири:{' '}
        <a href="https://zakon.rada.gov.ua/laws/show/2297-17" rel="noreferrer" target="_blank">
          Закон України «Про захист персональних даних» <ExternalLink className="inline size-3" />
        </a>{' '}
        та{' '}
        <a href="https://eur-lex.europa.eu/eli/reg/2016/679/oj" rel="noreferrer" target="_blank">
          GDPR <ExternalLink className="inline size-3" />
        </a>
        . Це інформаційна beta-сторінка, а не юридична консультація.
      </p>
    </>
  );
}

function TermsContent() {
  return (
    <>
      <section>
        <h2>1. Статус сервісу</h2>
        <p>
          Frame перебуває у beta-розробці. Функції, доступність і структура каталогу можуть
          змінюватися. Реєстрація означає згоду користуватися сервісом добросовісно та відповідно до
          цих умов.
        </p>
      </section>
      <section>
        <h2>2. Акаунт</h2>
        <p>
          Користувач відповідає за актуальність даних, безпеку способу входу та дії у своєму
          акаунті. Заборонено обходити контроль доступу, атакувати сервіс, автоматично збирати
          приватні дані або втручатися в роботу інших користувачів.
        </p>
      </section>
      <section>
        <h2>3. Контент і права</h2>
        <p>
          Метадані каталогу не означають наявність прав на показ відео. Відео може додаватися лише
          за наявності ліцензії, дозволу або відкритої ліцензії. Права на назви, зображення та твори
          належать відповідним правовласникам.
        </p>
      </section>
      <section>
        <h2>4. Користувацькі матеріали</h2>
        <p>
          Завантажуючи avatar або обкладинку списку, користувач підтверджує право на їх використання
          та не повинен публікувати незаконні, шкідливі або чужі приватні матеріали.
        </p>
      </section>
      <section>
        <h2>5. Доступність і зміни</h2>
        <p>
          Beta-сервіс може тимчасово не працювати через оновлення, помилки або сторонніх
          постачальників. Перед комерційним запуском власник має доповнити умови правилами оплати,
          повернення, юрисдикцією та процедурою звернень, якщо такі функції з’являться.
        </p>
      </section>
      <section>
        <h2>6. Припинення доступу</h2>
        <p>
          Доступ може бути обмежено для захисту сервісу або інших людей у разі порушення умов.
          Механізм самостійного видалення акаунта та експорту даних має бути доданий до
          production-релізу.
        </p>
      </section>
      <p className="text-sm text-muted">
        Це базова beta-версія. Перед production-запуском її має перевірити відповідальний власник
        сервісу.
      </p>
    </>
  );
}

export function LegalRoute() {
  const { document = 'privacy' } = useParams();
  const isTerms = document === 'terms';
  const title = isTerms ? 'Умови користування' : 'Політика приватності';
  usePageMeta({
    title,
    description: isTerms
      ? 'Базові умови користування beta-сервісом Frame.'
      : 'Як beta-сервіс Frame обробляє дані акаунта та налаштування.',
    path: `/legal/${isTerms ? 'terms' : 'privacy'}`,
  });
  return (
    <AppShell>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold" to="/">
          <ArrowLeft className="size-4" /> На головну
        </Link>
        <p className="mt-10 text-sm uppercase tracking-[0.18em] text-accent">Legal · Beta</p>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">{title}</h1>
        <p className="mt-3 text-sm text-muted">Останнє оновлення: {updatedAt}</p>
        <div className="prose-frame mt-10 grid gap-8">
          {isTerms ? <TermsContent /> : <PrivacyContent />}
        </div>
      </article>
    </AppShell>
  );
}
