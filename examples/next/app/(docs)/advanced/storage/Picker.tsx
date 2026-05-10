'use client';

import { useMemo, useState } from 'react';
import type { UnlockableDefinition, UnlockableStorageAdapter } from 'onboarding-tools';
import {
  Unlockable,
  UnlockableCatalogRegistrar,
  UnlockableProvider,
  useUnlockable,
  useUnlockableEvents,
} from 'onboarding-tools/react';
import { createMemoryStorage } from 'onboarding-tools/testing';

const definition: UnlockableDefinition = {
  id: 'storage-demo',
  activation: 'automatic',
  meta: {
    title: 'Storage demo',
    description: 'Persists through the selected adapter.',
  },
  unlocksOn: { kind: 'event', event: 'storage.started' },
};

type AdapterKind = 'localStorage' | 'sessionStorage' | 'remote';

export function StorageAdapterPicker() {
  const [kind, setKind] = useState<AdapterKind>('localStorage');
  const [resetKey, setResetKey] = useState(0);
  const [remoteLog, setRemoteLog] = useState('idle');
  const { events, emitEvent } = useUnlockableEvents();

  const storage = useMemo(() => createAdapter(kind, setRemoteLog), [kind]);

  const choose = (next: AdapterKind) => {
    setKind(next);
    setResetKey((current) => current + 1);
    if (next !== 'localStorage' && !events.includes('storage.swapped')) {
      emitEvent('storage.swapped');
    }
  };

  return (
    <section id="adapters" data-tour="storage-picker" className="md3-card-elevated p-4 sm:p-5">
      <div className="md3-segmented flex-wrap" aria-label="Storage adapter">
        {(['localStorage', 'sessionStorage', 'remote'] as const).map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={kind === item}
            onClick={() => choose(item)}
            className="md3-segmented-item"
          >
            {item}
          </button>
        ))}
      </div>
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setResetKey((current) => current + 1)}
          className="md3-button-outlined"
        >
          Reset
        </button>
      </div>
      <UnlockableProvider key={`${kind}:${resetKey}`} appId={`playground:storage:${kind}`} storage={storage}>
        <UnlockableCatalogRegistrar definitions={[definition]} />
        <StoragePreview kind={kind} remoteLog={remoteLog} />
      </UnlockableProvider>
      <p id="persistence" className="mt-4 text-sm text-docs-text-muted">
        The global docs progress remains in <code>unlockable:state:onboarding-tools-docs</code>; this playground uses its own key.
      </p>
    </section>
  );
}

function StoragePreview({ kind, remoteLog }: { readonly kind: AdapterKind; readonly remoteLog: string }) {
  const { status } = useUnlockable('storage-demo');
  const { emitEvent } = useUnlockableEvents();

  return (
    <div id="remote-mock" className="mt-4 rounded-docs-lg border border-docs-outline-variant bg-docs-surface-container-low p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="md3-status-pill font-docs-mono text-xs text-docs-accent">{status}</span>
        <span className="md3-chip">{kind}</span>
        {kind === 'remote' ? <span className="md3-chip md3-chip-selected">{remoteLog}</span> : null}
      </div>
      <button
        type="button"
        onClick={() => emitEvent('storage.started')}
        className="md3-button mt-4"
      >
        Unlock sandbox item
      </button>
      <Unlockable definition={definition}>
        <div className="mt-4 rounded-docs-lg border border-docs-accent-ring bg-docs-accent-soft p-4 text-sm font-semibold text-docs-on-accent-soft">
          Stored through {kind}.
        </div>
      </Unlockable>
    </div>
  );
}

function createAdapter(kind: AdapterKind, setRemoteLog: (value: string) => void): UnlockableStorageAdapter {
  if (kind === 'localStorage') {
    return {
      getItem: (key) => window.localStorage.getItem(key),
      setItem: (key, value) => window.localStorage.setItem(key, value),
      removeItem: (key) => window.localStorage.removeItem(key),
    };
  }

  if (kind === 'sessionStorage') {
    return {
      getItem: (key) => window.sessionStorage.getItem(key),
      setItem: (key, value) => window.sessionStorage.setItem(key, value),
      removeItem: (key) => window.sessionStorage.removeItem(key),
    };
  }

  const memory = createMemoryStorage();
  return {
    getItem(key) {
      setRemoteLog('GET /state');
      return memory.getItem(key);
    },
    setItem(key, value) {
      setRemoteLog('PUT /state (800 ms mock)');
      window.setTimeout(() => setRemoteLog('remote saved'), 800);
      memory.setItem(key, value);
    },
    removeItem(key) {
      memory.removeItem?.(key);
    },
  };
}
