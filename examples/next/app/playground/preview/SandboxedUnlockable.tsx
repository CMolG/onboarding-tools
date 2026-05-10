'use client';

import { useMemo, type ReactNode } from 'react';
import type { UnlockableDefinition } from 'onboarding-tools';
import {
  Unlockable,
  UnlockableCatalogRegistrar,
  UnlockableProvider,
  useUnlockable,
  useUnlockableEvents,
  useUnlockableSignals,
} from 'onboarding-tools/react';
import { createMemoryStorage } from 'onboarding-tools/testing';

export function SandboxedUnlockable({
  appId,
  definition,
  resetKey,
  initialEvents = [],
  initialArchetypes = [],
  initialFlags = {},
  children,
}: {
  readonly appId: string;
  readonly definition: UnlockableDefinition;
  readonly resetKey: number;
  readonly initialEvents?: readonly string[];
  readonly initialArchetypes?: readonly string[];
  readonly initialFlags?: Readonly<Record<string, unknown>>;
  readonly children?: ReactNode;
}) {
  const storage = useMemo(() => createMemoryStorage(), [resetKey]);

  return (
    <UnlockableProvider
      key={resetKey}
      appId={`playground:${appId}:${resetKey}`}
      storage={storage}
      initialEvents={initialEvents}
      initialUserArchetypes={initialArchetypes}
      initialFlags={initialFlags}
      theme={{ tokens: { '--ot-color-primary': '#0b57d0', '--ot-color-primary-soft': '#d3e3fd', '--ot-radius-card': '24px' } }}
    >
      <UnlockableCatalogRegistrar definitions={[definition]} />
      <SandboxPreview definition={definition}>{children}</SandboxPreview>
    </UnlockableProvider>
  );
}

function SandboxPreview({
  definition,
  children,
}: {
  readonly definition: UnlockableDefinition;
  readonly children?: ReactNode;
}) {
  const { status, isUnlocked } = useUnlockable(definition.id);
  const { events, emitEvent } = useUnlockableEvents();
  const { userArchetypes, setUserArchetypes, flags, setFlag } = useUnlockableSignals();

  return (
    <div className="rounded-docs-lg border border-docs-outline-variant bg-docs-surface p-4 shadow-docs-sm">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="md3-status-pill font-docs-mono text-xs text-docs-accent">{status}</span>
        <button type="button" className="md3-chip transition hover:border-docs-accent hover:text-docs-accent" onClick={() => emitEvent('profile.completed')}>
          emit profile.completed
        </button>
        <button type="button" className="md3-chip transition hover:border-docs-accent hover:text-docs-accent" onClick={() => setUserArchetypes(userArchetypes.includes('builder') ? [] : ['builder'])}>
          builder
        </button>
        <button type="button" className="md3-chip transition hover:border-docs-accent hover:text-docs-accent" onClick={() => setFlag('beta.enabled', flags['beta.enabled'] !== true)}>
          beta {flags['beta.enabled'] === true ? 'on' : 'off'}
        </button>
      </div>
      <Unlockable definition={definition} placeholder={<Placeholder />}>
        <div className="unlockable-effect-reveal rounded-docs-lg border border-docs-accent-ring bg-docs-accent-soft p-4 text-sm text-docs-on-accent-soft">
          {children ?? (
            <>
              <strong>{definition.meta.title}</strong>
              <p className="mt-1 text-docs-on-accent-soft/80">The isolated provider unlocked this preview without writing to the docs storage key.</p>
            </>
          )}
        </div>
      </Unlockable>
      {!isUnlocked ? (
        <p className="mt-3 text-xs text-docs-text-muted">
          Events: {events.join(', ') || 'none'} · Archetypes: {userArchetypes.join(', ') || 'none'}
        </p>
      ) : null}
    </div>
  );
}

function Placeholder() {
  return (
    <div className="rounded-docs-lg border border-dashed border-docs-border bg-docs-surface-container-low p-4 text-sm text-docs-text-muted">
      Hidden until the sandbox criterion is met.
    </div>
  );
}
