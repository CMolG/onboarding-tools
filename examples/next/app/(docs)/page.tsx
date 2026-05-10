'use client';

import { useRouter } from 'next/navigation';
import { useUnlockableContext, useUnlockableEvents } from 'onboarding-tools/react';

import { DocsPage } from '@/app/components/DocsPage';
import { PlayIcon, StatusIcon } from '@/app/components/Icons';
import { sections } from '@/app/lib/nav';

export default function WelcomePage() {
  const router = useRouter();
  const { events, emitEvent } = useUnlockableEvents();
  const { statusById } = useUnlockableContext();
  const started = events.includes('tour.started');
  const previewSections = sections.slice(0, 7);

  return (
    <DocsPage sectionId="welcome">
      <section id="lifecycle-map" data-tour="welcome-hero" className="md3-card-elevated overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="p-6 sm:p-8">
            <p className="m-0 text-xs font-extrabold uppercase tracking-[0.14em] text-docs-accent">Interactive docs powered by the package</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-normal text-docs-text sm:text-4xl">
              Learn the API by unlocking the documentation itself.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-docs-text-muted">
              Every section on this site is an <code>UnlockableDefinition</code>. Events, flags, archetypes, manual confirmations, nested providers, persistence, and skipUnlocks are all exercised by the UI you are using now.
            </p>
            <div id="start" className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="md3-button"
                onClick={() => {
                  emitEvent('tour.started');
                  router.push('/quickstart');
                }}
              >
                <span>{started ? 'Continue tour' : 'Start the tour'}</span>
                <PlayIcon className="size-4" />
              </button>
              <span className="md3-chip md3-chip-selected">Persisted in localStorage</span>
              <span className="md3-chip">Skip available from the topbar</span>
            </div>
          </div>
          <div className="border-t border-docs-outline-variant bg-docs-surface-container-low p-4 lg:border-l lg:border-t-0">
            <p className="m-0 mb-3 text-xs font-extrabold uppercase tracking-[0.14em] text-docs-text-muted">Live unlock graph</p>
            <div className="space-y-2">
              {previewSections.map((section, index) => {
                const status = statusById[section.id] ?? 'HIDDEN';
                return (
              <div
                key={section.id}
                className="relative flex items-center gap-2 overflow-hidden rounded-full bg-docs-surface px-3 py-2 text-sm font-bold text-docs-text shadow-docs-sm"
                style={{ animation: `docs-pop 360ms ease ${index * 100}ms both` }}
              >
                <span className="relative z-10 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-docs-accent-soft text-docs-accent">
                  <StatusIcon status={status} className="size-4" />
                </span>
                <span className="relative z-10 min-w-0 flex-1 truncate">{section.title}</span>
                <span className="relative z-10 font-docs-mono text-[10px] uppercase text-docs-text-muted">{status}</span>
                {status === 'ELIGIBLE' ? <span className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-docs-accent-soft/40" style={{ animation: 'docs-shimmer 1.8s ease-in-out infinite' }} /> : null}
              </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </DocsPage>
  );
}
