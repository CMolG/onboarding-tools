export function ChipField({
  label,
  value,
  options,
  onChange,
}: {
  readonly label: string;
  readonly value: string;
  readonly options: readonly string[];
  readonly onChange: (value: string) => void;
}) {
  return (
    <div>
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-docs-text-muted">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
            className={value === option
              ? 'md3-chip md3-chip-selected'
              : 'md3-chip transition hover:border-docs-accent hover:text-docs-accent'}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
