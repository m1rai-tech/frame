import { expect, test, type Page } from '@playwright/test';

const open = (page: Page, path: string) => page.goto(path, { waitUntil: 'domcontentloaded' });

test('landing is reachable', async ({ page }) => {
  await open(page, '/');

  await expect(page).toHaveTitle(/Frame/);
  await expect(page.getByRole('heading', { name: 'Дивись. Зберігай. Продовжуй.' })).toBeVisible();
  await expect(page.getByText('Каталог доступний без реєстрації')).toBeVisible();
});

test('legal pages are reachable and clearly identify beta configuration', async ({ page }) => {
  await open(page, '/legal/privacy');
  await expect(page.getByRole('heading', { name: 'Політика приватності' })).toBeVisible();
  await expect(page).toHaveTitle(/Політика приватності/);

  await open(page, '/legal/terms');
  await expect(page.getByRole('heading', { name: 'Умови користування' })).toBeVisible();
});

test('credits include the required TMDB attribution', async ({ page }) => {
  await open(page, '/credits');
  await expect(page.getByRole('heading', { name: 'Джерела та атрибуція' })).toBeVisible();
  await expect(page.getByText('This product uses the TMDB API')).toBeVisible();
  await expect(page.getByRole('img', { name: 'The Movie Database (TMDB)' })).toBeVisible();
});

test('design system showcase is keyboard reachable', async ({ page }) => {
  await open(page, '/design-system');

  await expect(page.getByRole('heading', { name: 'Дизайн-система Frame' })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'До основного вмісту' })).toBeFocused();
});

test('auth pages are public and protected pages redirect', async ({ page }) => {
  await open(page, '/register');
  await expect(page.getByRole('heading', { name: 'Створити акаунт' })).toBeVisible();

  await open(page, '/home');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'З поверненням' })).toBeVisible();
});

test('catalog filters and opens title details', async ({ page }) => {
  await open(page, '/browse');
  await expect(page.getByRole('heading', { name: 'Знайдіть наступну історію' })).toBeVisible();
  const firstTitle = page.getByRole('link', { name: /^Відкрити / }).first();
  await expect(firstTitle).toBeVisible();
  const titleName = (await firstTitle.getAttribute('aria-label'))?.replace(/^Відкрити /, '');
  await firstTitle.click();
  await expect(page).toHaveURL(/\/title\//);
  if (titleName) await expect(page.getByRole('heading', { name: titleName })).toBeVisible();
});
