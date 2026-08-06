import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';

export type SelectOption = { value: string; label: string };
export function Select({
  ariaLabel,
  onValueChange,
  options,
  placeholder,
  value,
}: {
  ariaLabel: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  value?: string;
}) {
  return (
    <SelectPrimitive.Root onValueChange={onValueChange} value={value}>
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        className="flex h-11 min-w-44 items-center justify-between gap-3 rounded-md border border-border bg-surface-1 px-3 text-sm"
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="size-4" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="z-50 overflow-hidden rounded-md border border-border bg-surface-1 p-1 shadow-card">
          <SelectPrimitive.Viewport>
            {options.map((option) => (
              <SelectPrimitive.Item
                className="relative flex cursor-default select-none items-center rounded-sm py-2 pl-8 pr-3 text-sm outline-none data-[highlighted]:bg-surface-2"
                key={option.value}
                value={option.value}
              >
                <SelectPrimitive.ItemIndicator className="absolute left-2">
                  <Check className="size-4" />
                </SelectPrimitive.ItemIndicator>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
