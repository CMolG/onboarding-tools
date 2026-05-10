'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUnlockableContext } from 'onboarding-tools/react';

import { sections } from '@/app/lib/nav';
import { StatusIcon } from './Icons';

export function CommandPalette({
  open,
  onOpenChange,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const { statusById } = useUnlockableContext();

  useEffect(() => {
    if (!open) {
      return;
    }
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
      if (event.key !== 'Tab' || !panelRef.current) {
        return;
      }
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
      ).filter((element) => !element.hasAttribute('disabled'));
      if (focusable.length === 0) {
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previous?.isConnected) {
        previous.focus();
      }
    };
  }, [onOpenChange, open]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return sections;
    }
    return sections.filter((section) =>
      `${section.title} ${section.category} ${section.description}`.toLowerCase().includes(normalized),
    );
  }, [query]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-palette-title"
      className="fixed inset-0 z-[92] bg-slate-950/35 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      <div ref={panelRef} className="mx-auto mt-[8vh] w-[min(100%,44rem)] overflow-hidden rounded-docs-xl border border-docs-outline-variant bg-docs-surface shadow-docs-lg">
        <div className="border-b border-docs-outline-variant bg-docs-surface-container-low p-4">
          <h2 id="command-palette-title" className="sr-only">Command palette</h2>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search sections"
            aria-label="Search documentation sections"
            className="md3-field w-full px-4 text-base outline-none"
          />
        </div>
        <div className="docs-scrollbar max-h-[60vh] overflow-y-auto p-3">
          {filtered.map((section) => {
            const status = statusById[section.id] ?? 'HIDDEN';
            return (
              <button
                type="button"
                key={section.id}
                onClick={() => {
                  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
                  router.push(section.route);
                  onOpenChange(false);
                }}
                className="md3-list-item"
              >
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-docs-accent-soft text-docs-accent">
                  <StatusIcon status={status} className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-docs-text">{section.title}</span>
                  <span className="block truncate text-xs text-docs-text-muted">{section.description}</span>
                </span>
                <span className="md3-chip min-h-7 px-2 py-1 text-[11px]">
                  {status.toLowerCase()}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
