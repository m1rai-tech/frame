import * as TabsPrimitive from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';

export type TabItem = { value: string; label: string; content: ReactNode };
export function Tabs({ defaultValue, items }: { defaultValue: string; items: TabItem[] }) {
  return (
    <TabsPrimitive.Root defaultValue={defaultValue}>
      <TabsPrimitive.List aria-label="Розділи" className="flex gap-1 border-b border-border">
        {items.map((item) => (
          <TabsPrimitive.Trigger
            className="border-b-2 border-transparent px-4 py-3 text-sm text-muted data-[state=active]:border-accent data-[state=active]:text-foreground"
            key={item.value}
            value={item.value}
          >
            {item.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {items.map((item) => (
        <TabsPrimitive.Content className="py-5" key={item.value} value={item.value}>
          {item.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}
