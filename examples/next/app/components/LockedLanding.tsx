'use client';

import Link from 'next/link';
import { useUnlockableFlow, useUnlockableContext } from 'onboarding-tools/react';

import { sectionById } from '@/app/lib/nav';
import { SkipTutorialButton } from './SkipTutorialButton';
import { LockIcon, StatusIcon } from './Icons';

export function LockedLanding({ sectionId }: { readonly sectionId: string }) {
  const section = sectionById[sectionId];
  const flow = useUnlockableFlow();
  const { statusById } = useUnlockableContext();
  const active = flow.activeStage ? sectionById[flow.activeStage.id] : null;
  const activeStatus = flow.activeStage ? statusById[flow.activeStage.id] ?? 'HIDDEN' : 'HIDDEN';

  return (
    <section className="md3-card-elevated p-6 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-docs-accent-soft text-docs-accent shadow-docs-sm" aria-hidden="true">
          <LockIcon className="size-7" />
        </div>
        <div className="min-w-0">
          <p className="m-0 text-xs font-extrabold uppercase tracking-[0.14em] text-docs-accent">Route gate</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-normal text-docs-text">This section is locked</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-docs-text-muted">
            <span className="font-semibold text-docs-text">{section.title}</span> {section.unlockHint.charAt(0).toLowerCase() + section.unlockHint.slice(1)}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="md3-chip md3-chip-selected">
              <StatusIcon status={activeStatus} className="size-4" />
              Current: {active?.title ?? 'None'}
            </span>
            <span className="md3-chip">{activeStatus.toLowerCase()}</span>
          </div>
        </div>
      </div>
      <div className="mt-7 flex flex-wrap gap-2">
        {active ? (
          <Link
            href={active.route}
            className="md3-button"
            onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' })}
          >
            Go to {active.title}
          </Link>
        ) : null}
        <SkipTutorialButton />
      </div>
    </section>
  );
}
