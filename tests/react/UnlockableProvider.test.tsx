import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Unlockable } from '../../src/react/Unlockable';
import {
  UnlockableProvider,
  useUnlockable,
  useUnlockableCatalog,
  useUnlockableEvents,
  useUnlockableSignals,
} from '../../src/react/UnlockableProvider';
import { createStorageKey } from '../../src/core/state';
import type { UnlockDecision, UnlockResolver, UnlockableStorageAdapter } from '../../src/core/types';

function createMemoryStorage(initial: Record<string, string> = {}): UnlockableStorageAdapter & { data: Record<string, string> } {
  return {
    data: { ...initial },
    getItem(key) {
      return this.data[key] ?? null;
    },
    setItem(key, value) {
      this.data[key] = value;
    },
    removeItem(key) {
      delete this.data[key];
    },
  };
}

function createResolverDecision(unlockableId: string, unlock: boolean): UnlockDecision {
  return {
    unlockableId,
    unlock,
    resolverId: 'remote',
    reason: unlock ? 'Allowed by remote resolver.' : 'Denied by remote resolver.',
    matchedSignals: unlock ? ['remote'] : [],
  };
}

function ResolverRefreshButton() {
  const { addSignal } = useUnlockableSignals();
  return (
    <button type="button" onClick={() => addSignal('resolver.refresh')}>
      refresh resolver
    </button>
  );
}

function defineMatchMedia(reducedMotion = true) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: reducedMotion && query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

beforeEach(() => {
  defineMatchMedia(true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('UnlockableProvider', () => {
  it('keeps a hidden unlockable child absent before criteria and automatically unlocks after an event', async () => {
    function EventButton() {
      const { events, emitEvent } = useUnlockableEvents();
      return (
        <button type="button" onClick={() => emitEvent('profile.completed')}>
          events:{events.length}
        </button>
      );
    }

    render(
      <UnlockableProvider storage={createMemoryStorage()}>
        <EventButton />
        <Unlockable
          id="profile"
          meta={{ title: 'Profile', description: 'Complete profile.' }}
          unlocksOn={{ kind: 'event', event: 'profile.completed' }}
        >
          <div>Unlocked profile</div>
        </Unlockable>
      </UnlockableProvider>,
    );

    expect(screen.queryByText('Unlocked profile')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'events:0' }));

    expect(await screen.findByText('Unlocked profile')).toBeInTheDocument();
  });

  it('useUnlockableSignals exposes signals, archetypes, flags, and mutators', async () => {
    function SignalsProbe() {
      const { signals, addSignal, removeSignal, userArchetypes, setUserArchetypes, flags, setFlag } = useUnlockableSignals();
      return (
        <div>
          <output data-testid="signals">{signals.join(',')}</output>
          <output data-testid="archetypes">{userArchetypes.join(',')}</output>
          <output data-testid="flag">{String(flags.beta)}</output>
          <button type="button" onClick={() => addSignal('automation')}>add</button>
          <button type="button" onClick={() => removeSignal('automation')}>remove</button>
          <button type="button" onClick={() => setUserArchetypes(['operator'])}>archetype</button>
          <button type="button" onClick={() => setFlag('beta', true)}>flag</button>
        </div>
      );
    }

    render(
      <UnlockableProvider storage={createMemoryStorage()}>
        <SignalsProbe />
      </UnlockableProvider>,
    );

    fireEvent.click(screen.getByText('add'));
    expect(screen.getByTestId('signals')).toHaveTextContent('automation');
    fireEvent.click(screen.getByText('remove'));
    expect(screen.getByTestId('signals')).toHaveTextContent('');
    fireEvent.click(screen.getByText('archetype'));
    expect(screen.getByTestId('archetypes')).toHaveTextContent('operator');
    fireEvent.click(screen.getByText('flag'));
    expect(screen.getByTestId('flag')).toHaveTextContent('true');
  });

  it('useUnlockableCatalog returns serializable definitions and omits non-serializable metadata with a development warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    function CatalogProbe() {
      const catalog = useUnlockableCatalog();
      return <output data-testid="catalog">{JSON.stringify(catalog)}</output>;
    }

    render(
      <UnlockableProvider storage={createMemoryStorage()}>
        <CatalogProbe />
        <Unlockable
          id="catalogued"
          meta={{ title: 'Catalogued', description: 'Serializable.', nonSerializable: () => undefined } as never}
        >
          <div>Catalogued child</div>
        </Unlockable>
      </UnlockableProvider>,
    );

    await waitFor(() => expect(JSON.parse(screen.getByTestId('catalog').textContent ?? '[]')).toHaveLength(1));
    const [definition] = JSON.parse(screen.getByTestId('catalog').textContent ?? '[]');

    expect(definition.meta).toEqual({ title: 'Catalogued', description: 'Serializable.' });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('not serializable'));
  });

  it('throws for duplicate ids in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(() =>
      render(
        <UnlockableProvider storage={createMemoryStorage()}>
          <Unlockable id="dup" meta={{ title: 'One', description: 'One.' }}>
            <div>One</div>
          </Unlockable>
          <Unlockable id="dup" meta={{ title: 'Two', description: 'Two.' }}>
            <div>Two</div>
          </Unlockable>
        </UnlockableProvider>,
      ),
    ).toThrow(/Duplicate unlockable id/);
    warn.mockRestore();
  });

  it('persists unlocked state and hydrates without replaying unlocking', async () => {
    const storage = createMemoryStorage({
      [createStorageKey('persisted-app')]: JSON.stringify({ version: 1, skipped: false, unlockedIds: ['persisted'] }),
    });
    const onStatusChange = vi.fn();

    render(
      <UnlockableProvider appId="persisted-app" storage={storage} onStatusChange={onStatusChange}>
        <Unlockable id="persisted" meta={{ title: 'Persisted', description: 'Already unlocked.' }}>
          <div>Persisted child</div>
        </Unlockable>
      </UnlockableProvider>,
    );

    expect(await screen.findByText('Persisted child')).toBeInTheDocument();
    expect(onStatusChange).not.toHaveBeenCalledWith('persisted', 'UNLOCKING', expect.anything());
    expect(storage.data[createStorageKey('persisted-app')]).toContain('persisted');
  });

  it('warns for invalid persisted storage and resets closed', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const storageKey = createStorageKey('invalid-storage');
    const storage = createMemoryStorage({
      [storageKey]: JSON.stringify({ version: 1, skipped: false, unlockedIds: [1] }),
    });

    render(
      <UnlockableProvider appId="invalid-storage" storage={storage}>
        <Unlockable
          id="blocked"
          meta={{ title: 'Blocked', description: 'Requires an event.' }}
          unlocksOn={{ kind: 'event', event: 'blocked.ready' }}
        >
          <div>Blocked child</div>
        </Unlockable>
      </UnlockableProvider>,
    );

    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid persisted unlockable state for app "invalid-storage"'),
        expect.anything(),
      ),
    );
    expect(screen.queryByText('Blocked child')).not.toBeInTheDocument();
    await waitFor(() => expect(JSON.parse(storage.data[storageKey] ?? '{}').unlockedIds).toEqual([]));
  });

  it('executes the configured resolver for resolver criteria and reports decisions', async () => {
    const decision: UnlockDecision = {
      unlockableId: 'resolved',
      unlock: true,
      resolverId: 'remote',
      reason: 'Matched remote decision.',
      matchedSignals: ['remote'],
    };
    const resolver: UnlockResolver = vi.fn(() => [decision]);
    const onDecision = vi.fn();

    render(
      <UnlockableProvider storage={createMemoryStorage()} resolver={resolver} onDecision={onDecision}>
        <Unlockable
          id="resolved"
          meta={{ title: 'Resolved', description: 'Resolver controlled.' }}
          unlocksOn={{ kind: 'resolver', resolverId: 'remote' }}
        >
          <div>Resolver child</div>
        </Unlockable>
      </UnlockableProvider>,
    );

    expect(await screen.findByText('Resolver child')).toBeInTheDocument();
    expect(resolver).toHaveBeenCalled();
    expect(onDecision).toHaveBeenCalledWith(decision);
  });

  it('reruns the resolver with updated decision context after decisions change', async () => {
    const decision = createResolverDecision('external-decision', true);
    const resolverMock = vi.fn((_, context: Parameters<UnlockResolver>[1]) => {
      if (context.statusById?.probe === undefined) {
        return [];
      }
      return [decision];
    });
    const resolver: UnlockResolver = resolverMock;

    render(
      <UnlockableProvider storage={createMemoryStorage()} resolver={resolver}>
        <Unlockable
          id="probe"
          meta={{ title: 'Probe', description: 'Keeps resolver status stable.' }}
          unlocksOn={{ kind: 'event', event: 'probe.ready' }}
        >
          <div>Probe child</div>
        </Unlockable>
      </UnlockableProvider>,
    );

    await waitFor(() =>
      expect(
        resolverMock.mock.calls.some(([, context]) =>
          context.decisions?.some((observed: UnlockDecision) => observed.unlockableId === decision.unlockableId),
        ),
      ).toBe(true),
    );
  });

  it('resolver failures fail closed for new unlocks while preserving previously unlocked state', async () => {
    const resolver: UnlockResolver = vi.fn(() => {
      throw new Error('offline');
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    render(
      <UnlockableProvider
        appId="resolver-failure"
        storage={createMemoryStorage({
          [createStorageKey('resolver-failure')]: JSON.stringify({ version: 1, skipped: false, unlockedIds: ['kept'] }),
        })}
        resolver={resolver}
      >
        <Unlockable id="kept" meta={{ title: 'Kept', description: 'Preserved.' }}>
          <div>Kept child</div>
        </Unlockable>
        <Unlockable
          id="closed"
          meta={{ title: 'Closed', description: 'Fails closed.' }}
          unlocksOn={{ kind: 'resolver', resolverId: 'remote' }}
        >
          <div>Closed child</div>
        </Unlockable>
      </UnlockableProvider>,
    );

    expect(await screen.findByText('Kept child')).toBeInTheDocument();
    await waitFor(() => expect(warn).toHaveBeenCalledWith(expect.stringContaining('resolver failed'), expect.any(Error)));
    expect(screen.queryByText('Closed child')).not.toBeInTheDocument();
  });

  it('hides resolver-gated manual unlocks when a later resolver decision denies eligibility', async () => {
    let unlock = true;
    const resolver: UnlockResolver = vi.fn(() => [createResolverDecision('manual-resolved', unlock)]);

    render(
      <UnlockableProvider storage={createMemoryStorage()} resolver={resolver}>
        <ResolverRefreshButton />
        <Unlockable
          id="manual-resolved"
          activation="manual"
          meta={{ title: 'Manual resolved', description: 'Resolver controlled manual unlock.' }}
          unlocksOn={{ kind: 'resolver', resolverId: 'remote' }}
        >
          <div>Manual resolved child</div>
        </Unlockable>
      </UnlockableProvider>,
    );

    expect(await screen.findByRole('dialog')).toHaveTextContent('Manual resolved is ready to unlock.');
    expect(screen.queryByText('Manual resolved child')).not.toBeInTheDocument();

    unlock = false;
    fireEvent.click(screen.getByRole('button', { name: 'refresh resolver' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.queryByText('Manual resolved child')).not.toBeInTheDocument();
  });

  it('warns when confirmUnlock is called for a non-eligible unlockable and keeps children closed', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const onStatusChange = vi.fn();

    function HiddenConfirmButton() {
      const { status, confirmUnlock } = useUnlockable('hidden-confirm');
      return (
        <button type="button" onClick={confirmUnlock}>
          confirm {status}
        </button>
      );
    }

    render(
      <UnlockableProvider storage={createMemoryStorage()} onStatusChange={onStatusChange}>
        <HiddenConfirmButton />
        <Unlockable
          id="hidden-confirm"
          meta={{ title: 'Hidden confirm', description: 'Not eligible.' }}
          unlocksOn={{ kind: 'event', event: 'hidden.ready' }}
        >
          <div>Hidden confirm child</div>
        </Unlockable>
      </UnlockableProvider>,
    );

    await waitFor(() => expect(onStatusChange).toHaveBeenCalledWith('hidden-confirm', 'HIDDEN', undefined));
    fireEvent.click(screen.getByRole('button', { name: 'confirm HIDDEN' }));

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('current status is "HIDDEN"'));
    expect(screen.queryByText('Hidden confirm child')).not.toBeInTheDocument();
  });

  it('hides resolver-gated manual unlocks when a later resolver throws while preserving persisted unlocked state', async () => {
    let shouldThrow = false;
    const resolver: UnlockResolver = vi.fn(() => {
      if (shouldThrow) {
        throw new Error('offline');
      }
      return [createResolverDecision('manual-throws', true)];
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    render(
      <UnlockableProvider
        appId="resolver-regression"
        storage={createMemoryStorage({
          [createStorageKey('resolver-regression')]: JSON.stringify({ version: 1, skipped: false, unlockedIds: ['kept'] }),
        })}
        resolver={resolver}
      >
        <ResolverRefreshButton />
        <Unlockable
          id="kept"
          meta={{ title: 'Kept', description: 'Persisted resolver-gated unlock.' }}
          unlocksOn={{ kind: 'resolver', resolverId: 'remote' }}
        >
          <div>Kept persisted child</div>
        </Unlockable>
        <Unlockable
          id="manual-throws"
          activation="manual"
          meta={{ title: 'Manual throws', description: 'Resolver failure closes this unlock.' }}
          unlocksOn={{ kind: 'resolver', resolverId: 'remote' }}
        >
          <div>Manual throws child</div>
        </Unlockable>
      </UnlockableProvider>,
    );

    expect(await screen.findByText('Kept persisted child')).toBeInTheDocument();
    expect(await screen.findByRole('dialog')).toHaveTextContent('Manual throws is ready to unlock.');
    expect(screen.queryByText('Manual throws child')).not.toBeInTheDocument();

    shouldThrow = true;
    fireEvent.click(screen.getByRole('button', { name: 'refresh resolver' }));

    await waitFor(() => expect(warn).toHaveBeenCalledWith(expect.stringContaining('resolver failed'), expect.any(Error)));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.queryByText('Manual throws child')).not.toBeInTheDocument();
    expect(screen.getByText('Kept persisted child')).toBeInTheDocument();
  });

  it('accepts theme, overlay, storage, and observability hooks', async () => {
    const storage = createMemoryStorage();
    const onStatusChange = vi.fn();
    const onCatalogChange = vi.fn();

    render(
      <UnlockableProvider
        storage={storage}
        theme={{ className: 'custom-provider', tokens: { accent: 'red' } }}
        overlay={{ title: 'Global title', primaryActionLabel: 'Go' }}
        onStatusChange={onStatusChange}
        onCatalogChange={onCatalogChange}
      >
        <Unlockable id="themed" activation="manual" meta={{ title: 'Themed', description: 'Theme.' }}>
          <div>Themed child</div>
        </Unlockable>
      </UnlockableProvider>,
    );

    expect(document.querySelector('.custom-provider')).toHaveStyle({ '--unlockable-accent': 'red' });
    expect(await screen.findByRole('button', { name: 'Go' })).toBeInTheDocument();
    expect(screen.getByText('Global title')).toBeInTheDocument();
    await waitFor(() => expect(onStatusChange).toHaveBeenCalledWith('themed', 'ELIGIBLE', undefined));
    expect(onCatalogChange).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: 'themed' })]));
  });

  it('warns but does not crash when storage throws', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const storage: UnlockableStorageAdapter = {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('blocked');
      },
    };

    render(
      <UnlockableProvider storage={storage}>
        <Unlockable id="safe" meta={{ title: 'Safe', description: 'Storage safe.' }}>
          <div>Safe child</div>
        </Unlockable>
      </UnlockableProvider>,
    );

    expect(await screen.findByText('Safe child')).toBeInTheDocument();
    expect(warn).toHaveBeenCalled();
  });
});
