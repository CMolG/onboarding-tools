import { CheckCircleIcon, CircleIcon } from '@/app/components/Icons';

export function ToggleField({
  label,
  checked,
  onChange,
}: {
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-12 w-full items-center justify-between rounded-docs-lg border border-docs-outline-variant bg-docs-surface px-3 py-2 text-sm font-bold text-docs-text transition hover:border-docs-accent hover:bg-docs-accent-soft"
    >
      <span>{label}</span>
      <span className={checked ? 'text-docs-accent' : 'text-docs-text-muted'} aria-hidden="true">
        {checked ? <CheckCircleIcon className="size-5" /> : <CircleIcon className="size-5" />}
      </span>
    </button>
  );
}
