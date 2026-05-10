'use client';

import { type ReactNode } from 'react';
import { Unlockable, useUnlockable } from 'onboarding-tools/react';

import { getDefinition, sectionById } from '@/app/lib/nav';
import { LockedLanding } from './LockedLanding';
import { PrevNext } from './PrevNext';
import { StatusIcon } from './Icons';

export function DocsPage({
  sectionId,
  children,
}: {
  readonly sectionId: string;
  readonly children: ReactNode;
}) {
  const unlockable = useUnlockable(sectionId);
  const definition = getDefinition(sectionId);
  const section = sectionById[sectionId];

  if (unlockable.status === 'HIDDEN' && definition.unlocksOn) {
    return <LockedLanding sectionId={sectionId} />;
  }

  return (
    <Unlockable definition={definition}>
      <article data-section-id={sectionId} className="docs-prose">
        <header className="md3-page-hero mb-8 p-5 sm:p-7">
          <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-docs-accent">{section.category}</p>
              <h1 className="m-0 text-3xl font-extrabold tracking-normal text-docs-text sm:text-4xl">{section.title}</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-docs-text-muted">{section.description}</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <span className="md3-status-pill">
                <StatusIcon status={unlockable.status} className="size-4 text-docs-accent" />
                {unlockable.status.toLowerCase()}
              </span>
              <span className="md3-status-pill">live definition</span>
            </div>
          </div>
        </header>
        {children}
        <PrevNext sectionId={sectionId} />
      </article>
    </Unlockable>
  );
}
