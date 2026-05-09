import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Unlockable } from '../../src/react/Unlockable';
import { UnlockableProvider, useUnlockable } from '../../src/react/UnlockableProvider';
import { runUnlockEffect } from '../../src/core/effects';
import type { UnlockableStorageAdapter } from '../../src/core/types';

function createMemoryStorage(): UnlockableStorageAdapter {
  const data: Record<string, string> = {};
  return {
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
    },
  };
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

describe('Unlockable', () => {
  it('manual unlock exposes an overlay and requires confirmUnlock', async () => {
    render(
      <UnlockableProvider storage={createMemoryStorage()}>
        <Unlockable
          id="manual"
          activation="manual"
          meta={{ title: 'Manual unlock', description: 'Confirm this unlock.' }}
          tutorial={{ primaryActionLabel: 'Confirm unlock' }}
        >
          <div>Manual child</div>
        </Unlockable>
      </UnlockableProvider>,
    );

    expect(screen.queryByText('Manual child')).not.toBeInTheDocument();
    expect(await screen.findByRole('dialog')).toHaveTextContent('Manual unlock is ready to unlock.');

    fireEvent.click(screen.getByRole('button', { name: 'Confirm unlock' }));

    expect(await screen.findByText('Manual child')).toBeInTheDocument();
  });

  it('useUnlockable exposes status and confirmUnlock', async () => {
    function ManualControls() {
      const unlockable = useUnlockable('controlled');
      return (
        <div>
          <output data-testid="status">{unlockable.status}</output>
          <button type="button" onClick={unlockable.confirmUnlock}>hook-confirm</button>
        </div>
      );
    }

    render(
      <UnlockableProvider storage={createMemoryStorage()}>
        <ManualControls />
        <Unlockable id="controlled" activation="manual" meta={{ title: 'Controlled', description: 'By hook.' }}>
          <div>Controlled child</div>
        </Unlockable>
      </UnlockableProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('ELIGIBLE'));
    fireEvent.click(screen.getByText('hook-confirm'));
    expect(await screen.findByText('Controlled child')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('UNLOCKED'));
  });

  it('renders placeholder and disabled shells only when configured', async () => {
    render(
      <UnlockableProvider storage={createMemoryStorage()}>
        <Unlockable
          id="placeholder"
          visibility="placeholder"
          meta={{ title: 'Placeholder', description: 'Placeholder.' }}
          unlocksOn={{ kind: 'event', event: 'never' }}
          placeholder={<span>Placeholder shell</span>}
        >
          <div>Placeholder child</div>
        </Unlockable>
        <Unlockable
          id="disabled"
          visibility="disabled"
          meta={{ title: 'Disabled', description: 'Disabled.' }}
          unlocksOn={{ kind: 'event', event: 'never' }}
        >
          <button type="button">Disabled child</button>
        </Unlockable>
      </UnlockableProvider>,
    );

    expect(await screen.findByText('Placeholder shell')).toBeInTheDocument();
    expect(screen.queryByText('Placeholder child')).not.toBeInTheDocument();
    expect(screen.getByText('Disabled child').closest('[aria-disabled="true"]')).toBeInTheDocument();
  });

  it('overlay renders configured title, body, action, dismiss behavior, and aria-live status text', async () => {
    render(
      <UnlockableProvider storage={createMemoryStorage()} overlay={{ dismissActionLabel: 'Later' }}>
        <Unlockable
          id="overlayed"
          activation="manual"
          meta={{ title: 'Default title', description: 'Default body.' }}
          tutorial={{ title: 'Configured title', body: 'Configured body.', primaryActionLabel: 'Start', dismissible: true }}
        >
          <div>Overlayed child</div>
        </Unlockable>
      </UnlockableProvider>,
    );

    expect(await screen.findByText('Configured title')).toBeInTheDocument();
    expect(screen.getByText('Configured body.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
    expect(screen.getByText('Configured title is ready to unlock.')).toHaveAttribute('aria-live', 'polite');

    fireEvent.click(screen.getByRole('button', { name: 'Later' }));

    await waitFor(() => expect(screen.queryByText('Configured title')).not.toBeInTheDocument());
  });

  it('focus moves to the unlocked element after manual unlock', async () => {
    render(
      <UnlockableProvider storage={createMemoryStorage()}>
        <Unlockable id="focusable" activation="manual" meta={{ title: 'Focusable', description: 'Focus target.' }}>
          <button type="button" data-testid="focus-child">Focusable child</button>
        </Unlockable>
      </UnlockableProvider>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Unlock' }));

    const child = await screen.findByTestId('focus-child');
    await waitFor(() => expect(child.parentElement).toHaveFocus());
  });

  it('reduced-motion effects complete quickly', async () => {
    render(
      <UnlockableProvider storage={createMemoryStorage()}>
        <Unlockable id="quick" meta={{ title: 'Quick', description: 'Reduced motion.' }}>
          <div>Quick child</div>
        </Unlockable>
      </UnlockableProvider>,
    );

    expect(await screen.findByText('Quick child')).toBeInTheDocument();
  });

  it('runUnlockEffect uses CSS classes and a timeout guard when animations do not finish', async () => {
    defineMatchMedia(false);
    vi.useFakeTimers();
    const element = document.createElement('div');

    const effect = runUnlockEffect({ className: 'custom-unlock', durationMs: 50, timeoutMs: 75 }, { element });

    expect(element).toHaveClass('custom-unlock');
    await vi.advanceTimersByTimeAsync(75);
    await expect(effect).resolves.toBeUndefined();
    expect(element).not.toHaveClass('custom-unlock');
    vi.useRealTimers();
  });

  it('skipUnlocks bypasses gates for tutorialized app flows', async () => {
    function SkipButton() {
      const { skipUnlocks } = useUnlockable('skipped');
      return <button type="button" onClick={skipUnlocks}>skip</button>;
    }

    render(
      <UnlockableProvider storage={createMemoryStorage()}>
        <SkipButton />
        <Unlockable
          id="skipped"
          meta={{ title: 'Skipped', description: 'Bypassed.' }}
          unlocksOn={{ kind: 'event', event: 'never' }}
        >
          <div>Skipped child</div>
        </Unlockable>
      </UnlockableProvider>,
    );

    expect(screen.queryByText('Skipped child')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'skip' }));
    expect(await screen.findByText('Skipped child')).toBeInTheDocument();
  });
});
