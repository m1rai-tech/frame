import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { PropsWithChildren, ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

export function Dialog({
  children,
  description,
  title,
  trigger,
}: PropsWithChildren<{ title: string; description?: string; trigger: ReactNode }>) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-[var(--overlay)]" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface-1 p-6 shadow-card">
          <DialogPrimitive.Title className="text-xl font-semibold">{title}</DialogPrimitive.Title>
          {description && (
            <DialogPrimitive.Description className="mt-2 text-sm text-muted">
              {description}
            </DialogPrimitive.Description>
          )}
          <div className="mt-5">{children}</div>
          <DialogPrimitive.Close asChild>
            <Button
              aria-label="Закрити"
              className="absolute right-3 top-3"
              size="icon"
              variant="ghost"
            >
              <X className="size-5" />
            </Button>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
