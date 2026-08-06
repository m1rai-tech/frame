import { Bell, Filter, Play } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import type { MediaItem } from '@/components/media/MediaCard';
import { MediaRow } from '@/components/media/MediaRow';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Drawer } from '@/components/ui/Drawer';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';

const media: MediaItem[] = [
  { id: 'quiet-orbit', title: 'Тиха орбіта', meta: '2026 · Фантастика', progress: 64 },
  { id: 'winter-letter', title: 'Зимовий лист', meta: '2025 · Драма' },
  { id: 'last-platform', title: 'Остання платформа', meta: '2026 · Серіал', progress: 28 },
  { id: 'paper-moon', title: 'Паперовий місяць', meta: '2024 · Аніме' },
  { id: 'north-wind', title: 'Північний вітер', meta: '2025 · Трилер' },
  { id: 'after-light', title: 'Після світла', meta: '2026 · Драма' },
];

function Section({ children, title }: PropsWithChildren<{ title: string }>) {
  return (
    <section className="grid gap-5">
      <h2 className="text-2xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function DesignSystemRoute() {
  const { showToast } = useToast();
  return (
    <AppShell>
      <div className="mx-auto grid max-w-7xl gap-14 px-4 py-10 sm:px-6">
        <header>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Phase 3</p>
          <h1 className="mt-3 text-4xl font-semibold">Дизайн-система Frame</h1>
          <p className="mt-3 max-w-2xl text-muted">
            Жива сторінка для перевірки компонентів, тем, focus states і адаптивності.
          </p>
        </header>
        <Section title="Кнопки та поля">
          <div className="flex flex-wrap gap-3">
            <Button>
              <Play className="size-4" />
              Дивитися
            </Button>
            <Button variant="secondary">До списку</Button>
            <Button variant="ghost">Детальніше</Button>
            <Button disabled>Недоступно</Button>
            <Button variant="danger">Видалити</Button>
          </div>
          <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
            <Input
              id="search-demo"
              label="Пошук"
              placeholder="Назва, актор або режисер"
              hint="Почніть вводити назву"
            />
            <Input
              error="Username уже зайнятий"
              id="username-demo"
              label="Username"
              value="frame"
              readOnly
            />
            <Select
              ariaLabel="Обрати жанр"
              onValueChange={() => undefined}
              options={[
                { value: 'drama', label: 'Драма' },
                { value: 'anime', label: 'Аніме' },
              ]}
              placeholder="Оберіть жанр"
            />
          </div>
        </Section>
        <Section title="Overlay-компоненти">
          <div className="flex flex-wrap gap-3">
            <Dialog
              description="Це доступне модальне вікно з focus trap."
              title="Додати до списку"
              trigger={<Button variant="secondary">Відкрити Dialog</Button>}
            >
              <p className="text-sm text-muted">Тут з’явиться вибір користувацького списку.</p>
            </Dialog>
            <Drawer
              title="Фільтри каталогу"
              trigger={
                <Button variant="secondary">
                  <Filter className="size-4" />
                  Відкрити Drawer
                </Button>
              }
            >
              <p className="text-sm text-muted">
                Mobile-first панель для жанрів, років і сортування.
              </p>
            </Drawer>
            <Button
              onClick={() =>
                showToast({
                  title: 'Додано до списку',
                  description: 'Тайтл збережено у «Хочу переглянути».',
                })
              }
            >
              <Bell className="size-4" />
              Показати Toast
            </Button>
          </div>
        </Section>
        <Section title="Tabs">
          <Tabs
            defaultValue="overview"
            items={[
              {
                value: 'overview',
                label: 'Огляд',
                content: <p className="text-muted">Основна інформація про тайтл.</p>,
              },
              {
                value: 'episodes',
                label: 'Епізоди',
                content: <p className="text-muted">Список сезонів та епізодів.</p>,
              },
              {
                value: 'similar',
                label: 'Схожі',
                content: <p className="text-muted">Рекомендації за жанрами.</p>,
              },
            ]}
          />
        </Section>
        <MediaRow items={media} title="Продовжити перегляд" />
        <Section title="Loading, empty та error">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="aspect-[2/3]" />
              <div className="grid content-start gap-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <EmptyState
              action={<Button variant="secondary">Перейти в каталог</Button>}
              description="Додайте перший фільм, серіал або аніме."
              title="Список порожній"
            />
            <ErrorState
              description="Перевірте підключення і повторіть спробу."
              onRetry={() => undefined}
            />
          </div>
        </Section>
      </div>
    </AppShell>
  );
}
