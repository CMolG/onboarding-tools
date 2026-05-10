'use client';

import { useMemo, useState } from 'react';
import type { UnlockableDefinition } from 'onboarding-tools';
import {
  UnlockableCatalogRegistrar,
  UnlockableFlowProvider,
  UnlockableProvider,
  UnlockableTutorialEngineProvider,
  useUnlockableEvents,
} from 'onboarding-tools/react';
import { createMemoryStorage } from 'onboarding-tools/testing';

export function MiniTour() {
  const [resetKey, setResetKey] = useState(0);
  const { events, emitEvent } = useUnlockableEvents();
  const storage = useMemo(() => createMemoryStorage(), [resetKey]);
  const done = events.includes('tutorial.dismissed');

  return (
    <section id="mini-app" data-tour="mini-tour" className="md3-card-elevated p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="m-0 text-lg font-extrabold text-docs-text">Mini app</h2>
          <p className="mt-1 text-sm text-docs-text-muted">The sandbox below mounts a real tutorial engine with three DOM targets.</p>
        </div>
        <button
          type="button"
          onClick={() => setResetKey((current) => current + 1)}
          className="md3-button-outlined"
        >
          Reset sandbox
        </button>
      </div>
      <UnlockableProvider key={resetKey} appId={`playground:mini-tour:${resetKey}`} storage={storage}>
        <MiniTourInner onComplete={() => emitEvent('tutorial.dismissed')} />
      </UnlockableProvider>
      <p id="completion" aria-live="polite" className="mt-4 text-sm text-docs-text-muted">
        Completion event: <code>{done ? 'tutorial.dismissed' : 'waiting'}</code>
      </p>
    </section>
  );
}

function MiniTourInner({ onComplete }: { readonly onComplete: () => void }) {
  const { emitEvent } = useUnlockableEvents();
  const [started, setStarted] = useState(false);
  const definition = useMemo<UnlockableDefinition>(() => ({
    id: 'mini-tour-demo',
    activation: 'automatic',
    meta: {
      title: 'Mini tour',
      description: 'A three-step tutorial in an isolated provider.',
    },
    unlocksOn: { kind: 'event', event: 'mini-tour.started' },
    flow: {
      stage: 'Mini tour',
      order: 10,
      target: '[data-tour="mini-source"]',
      completionEvent: 'mini-tour.done',
    },
    tutorial: {
      steps: [
        {
          target: '[data-tour="mini-source"]',
          title: 'Source event emitted',
          description: 'The real button emitted mini-tour.started. The tutorial engine is now tracking live DOM targets.',
          position: 'bottom',
          action: { kind: 'next', label: 'Next' },
        },
        {
          target: '[data-tour="mini-preview"]',
          title: 'Live target',
          description: 'The spotlight tracks a real element with document.querySelector.',
          position: 'left',
          action: { kind: 'next', label: 'Next' },
        },
        {
          target: '[data-tour="mini-complete"]',
          title: 'Finish',
          description: 'The final step clicks this target and emits tutorial.dismissed globally.',
          position: 'top',
          action: { kind: 'clickTarget', label: 'Finish tour' },
        },
      ],
    },
  }), []);

  return (
    <>
      <UnlockableCatalogRegistrar definitions={[definition]} />
      <UnlockableFlowProvider>
        <UnlockableTutorialEngineProvider>
          <MiniTourTargets
            started={started}
            onStart={() => {
              setStarted(true);
              emitEvent('mini-tour.started');
            }}
            onComplete={() => {
              emitEvent('mini-tour.done');
              setStarted(false);
              onComplete();
            }}
          />
        </UnlockableTutorialEngineProvider>
      </UnlockableFlowProvider>
    </>
  );
}

function MiniTourTargets({
  started,
  onStart,
  onComplete,
}: {
  readonly started: boolean;
  readonly onStart: () => void;
  readonly onComplete: () => void;
}) {
  return (
    <div id="spotlight" className="grid gap-3 md:grid-cols-3">
      <button
        type="button"
        data-tour="mini-source"
        aria-pressed={started}
        onClick={onStart}
        className="rounded-docs-lg border border-docs-outline-variant bg-docs-surface-container-low p-4 text-left text-sm font-bold text-docs-text transition hover:border-docs-accent hover:bg-docs-accent-soft"
      >
        {started ? 'Tour running' : 'Trigger tour'}
      </button>
      <div data-tour="mini-preview" tabIndex={-1} className="rounded-docs-lg border border-docs-accent-ring bg-docs-accent-soft p-4 text-sm font-semibold text-docs-on-accent-soft">
        Spotlight target
      </div>
      <button
        type="button"
        data-tour="mini-complete"
        disabled={!started}
        onClick={onComplete}
        className="rounded-docs-lg border border-docs-outline-variant bg-docs-surface p-4 text-left text-sm font-bold text-docs-text transition hover:border-docs-accent hover:bg-docs-surface-container-low disabled:cursor-not-allowed disabled:opacity-55"
      >
        {started ? 'Complete' : 'Complete after trigger'}
      </button>
    </div>
  );
}
