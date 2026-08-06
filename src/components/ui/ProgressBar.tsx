export function ProgressBar({
  value,
  label = 'Прогрес перегляду',
}: {
  value: number;
  label?: string;
}) {
  const safeValue = Math.min(100, Math.max(0, value));
  return (
    <div
      aria-label={label}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={safeValue}
      aria-valuetext={`${Math.round(safeValue)}%`}
      role="progressbar"
    >
      <div className="h-1 overflow-hidden rounded-full bg-surface-3">
        <div className="h-full rounded-full bg-accent" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}
