import { CircleAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function ErrorState({
  description,
  onRetry,
  title = 'Не вдалося завантажити',
}: {
  description: string;
  onRetry?: () => void;
  title?: string;
}) {
  return (
    <div
      className="grid place-items-center rounded-lg border border-danger/40 bg-surface-1 px-6 py-12 text-center"
      role="alert"
    >
      <CircleAlert className="size-8 text-danger" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted">{description}</p>
      {onRetry && (
        <Button className="mt-5" onClick={onRetry} variant="secondary">
          Спробувати ще раз
        </Button>
      )}
    </div>
  );
}
