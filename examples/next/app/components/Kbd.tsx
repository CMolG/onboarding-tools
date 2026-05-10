import { type ReactNode } from 'react';

export function Kbd({ children }: { readonly children: ReactNode }) {
  return (
    <kbd className="inline-flex min-w-5 items-center justify-center rounded-docs-sm border border-docs-outline-variant bg-docs-surface-container-high px-1.5 py-0.5 font-docs-mono text-[11px] font-bold text-docs-text-muted shadow-docs-sm">
      {children}
    </kbd>
  );
}
