import { Laptop, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/app/theme-provider';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const next = theme === 'system' ? 'dark' : theme === 'dark' ? 'light' : 'system';
  const Icon = theme === 'system' ? Laptop : theme === 'dark' ? Moon : Sun;
  return (
    <Tooltip content={`Тема: ${theme}`}>
      <Button
        aria-label={`Змінити тему. Поточна: ${theme}`}
        onClick={() => setTheme(next)}
        size="icon"
        variant="ghost"
      >
        <Icon className="size-5" />
      </Button>
    </Tooltip>
  );
}
