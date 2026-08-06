import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
};
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, hint, id, label, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const messageId = error || hint ? `${inputId}-message` : undefined;

    return (
      <div className="grid gap-2 text-sm">
        {label && (
          <label className="font-medium" htmlFor={inputId}>
            {label}
          </label>
        )}
        <input
          aria-describedby={messageId}
          aria-invalid={Boolean(error)}
          className={cn(
            'h-11 rounded-md border border-border bg-surface-1 px-3 placeholder:text-muted/70 disabled:opacity-50',
            error && 'border-danger',
            className,
          )}
          id={inputId}
          ref={ref}
          {...props}
        />
        {(error || hint) && (
          <span aria-live={error ? 'polite' : undefined} className={error ? 'text-danger' : 'text-muted'} id={messageId}>
            {error ?? hint}
          </span>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';
