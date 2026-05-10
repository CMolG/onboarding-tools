'use client';

import { useEffect } from 'react';
import { useUnlockableContext } from 'onboarding-tools/react';

import { categories, sections } from '@/app/lib/nav';
import { RailItem } from './RailItem';
import { SkipTutorialButton } from './SkipTutorialButton';
import { CloseIcon } from './Icons';

export function SideRail({
  open,
  onClose,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
}) {
  const { statusById } = useUnlockableContext();

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  return (
    <>
      <div
        className={open ? 'fixed inset-0 z-40 bg-slate-950/32 backdrop-blur-[2px] lg:hidden' : 'hidden'}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={[
          'md3-rail docs-scrollbar fixed bottom-0 left-0 top-[var(--docs-topbar-height)] z-40 w-[var(--docs-rail-width)] overflow-y-auto px-4 py-5 transition-transform lg:sticky lg:bottom-auto lg:left-auto lg:z-0 lg:block lg:h-[calc(100vh-var(--docs-topbar-height))] lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        aria-label="Primary documentation navigation"
      >
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <span className="text-sm font-bold text-docs-text">Navigation</span>
          <button
            type="button"
            onClick={onClose}
            className="md3-icon-button"
            aria-label="Close navigation"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>
        <nav aria-label="Documentation sections" className="space-y-5">
          {categories.map((category) => (
            <div key={category}>
              <h2 className="mb-2 px-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-docs-text-muted">
                {category}
              </h2>
              <div className="space-y-1">
                {sections
                  .filter((section) => section.category === category)
                  .map((section, index) => (
                    <RailItem
                      key={section.id}
                      section={section}
                      index={index}
                      status={statusById[section.id] ?? 'HIDDEN'}
                      onNavigate={onClose}
                    />
                  ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="mt-6 sm:hidden">
          <SkipTutorialButton compact />
        </div>
      </aside>
    </>
  );
}
