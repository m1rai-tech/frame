import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { PropsWithChildren, ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

export function Drawer({
  children,
  title,
  trigger,
}: PropsWithChildren<{ title: string; trigger: ReactNode }>) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-[var(--overlay)]" />
        <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] rounded-t-lg border border-border bg-surface-1 p-6 shadow-card">
          <DialogPrimitive.Title className="text-lg font-semibold">{title}</DialogPrimitive.Title>
          <div className="mt-5 overflow-y-auto">{children}</div>
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
