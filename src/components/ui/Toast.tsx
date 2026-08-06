import * as ToastPrimitive from '@radix-ui/react-toast';
import { X } from 'lucide-react';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

type ToastItem = { id: number; title: string; description?: string };
const ToastContext = createContext<{ showToast: (toast: Omit<ToastItem, 'id'>) => void } | null>(
  null,
);

export function ToastProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const showToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) =>
      setItems((current) => [...current, { ...toast, id: Date.now() }]),
    [],
  );
  const value = useMemo(() => ({ showToast }), [showToast]);
  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {items.map((item) => (
          <ToastPrimitive.Root
            className="grid grid-cols-[1fr_auto] gap-x-4 rounded-lg border border-border bg-surface-1 p-4 shadow-card"
            key={item.id}
            onOpenChange={(open) =>
              !open && setItems((current) => current.filter(({ id }) => id !== item.id))
            }
          >
            <ToastPrimitive.Title className="font-semibold">{item.title}</ToastPrimitive.Title>
            {item.description && (
              <ToastPrimitive.Description className="mt-1 text-sm text-muted">
                {item.description}
              </ToastPrimitive.Description>
            )}
            <ToastPrimitive.Close aria-label="Закрити" className="row-span-2">
              <X className="size-4" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-24 right-4 z-50 grid w-[min(24rem,calc(100vw-2rem))] gap-2 md:bottom-4" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside ToastProvider.');
  return value;
}
