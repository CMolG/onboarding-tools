import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UnlockableCatalogRegistrar } from '../../src/react/UnlockableCatalogRegistrar';
import { UnlockableFlowProvider, UnlockableFlowRouteGate, useUnlockableFlow } from '../../src/react/UnlockableFlowProvider';
import { Unlockable } from '../../src/react/Unlockable';
import { UnlockableProvider, useUnlockable, useUnlockableEvents } from '../../src/react/UnlockableProvider';
import { createMemoryStorage } from '../../src/testing';
import type { UnlockableDefinition } from '../../src/core/types';

const definitions: readonly UnlockableDefinition[] = [
  {
    id: 'onboarding.cognitiveProfile',
    activation: 'automatic',
    meta: { title: 'Cognitive profile', description: 'Complete cognitive profile.' },
    flow: {
      stage: 'Cognitive profile',
      route: '/cognitive',
      completionEvent: 'cognitive.profile.completed',
      order: 1,
    },
  },
  {
    id: 'onboarding.cvUpload',
    activation: 'automatic',
    meta: { title: 'CV upload', description: 'Upload CV.' },
    unlocksOn: { kind: 'event', event: 'cognitive.profile.completed' },
    flow: {
      stage: 'CV upload',
      route: '/onboarding/cv',
      completionEvent: 'cv.upload.completed',
      order: 2,
    },
  },
  {
    id: 'sidebar.myCvs',
    activation: 'manual',
    meta: { title: 'My CVs', description: 'Review CV.' },
    unlocksOn: { kind: 'event', event: 'cv.upload.completed' },
    flow: {
      stage: 'My CVs',
      route: '/cvs',
      completionEvent: 'profile.cv.reviewed',
      order: 3,
    },
  },
];

function FlowProbe() {
  const { activeStage, stages, isStageComplete } = useUnlockableFlow();
  const { emitEvent } = useUnlockableEvents();
  const myCvs = useUnlockable('sidebar.myCvs');

  return (
    <div>
      <output data-testid="active-stage">{activeStage?.id ?? 'none'}</output>
      <output data-testid="stage-count">{stages.length}</output>
      <output data-testid="my-cvs-complete">{String(isStageComplete('sidebar.myCvs'))}</output>
      <button type="button" onClick={() => emitEvent('cognitive.profile.completed')}>
        complete cognitive
      </button>
      <button type="button" onClick={() => emitEvent('cv.upload.completed')}>
        complete cv
      </button>
      <button type="button" onClick={myCvs.confirmUnlock}>
        confirm my cvs
      </button>
      <button type="button" onClick={() => emitEvent('profile.cv.reviewed')}>
        review my cvs
      </button>
    </div>
  );
}

function renderFlow(initialEvents: readonly string[] = []) {
  return render(
    <UnlockableProvider appId="flow-test" storage={createMemoryStorage()} initialEvents={initialEvents}>
      <UnlockableCatalogRegistrar definitions={definitions} />
      <UnlockableFlowProvider>
        <FlowProbe />
        <Unlockable definition={definitions[2]}>
          <div>My CVs child</div>
        </Unlockable>
      </UnlockableFlowProvider>
    </UnlockableProvider>,
  );
}

describe('UnlockableFlowProvider', () => {
  it('derives stages from registrar-only definitions', async () => {
    renderFlow();

    await waitFor(() => expect(screen.getByTestId('stage-count')).toHaveTextContent('3'));
    expect(screen.getByTestId('active-stage')).toHaveTextContent('onboarding.cognitiveProfile');
  });

  it('advances automatic stages only when their completion event is emitted', async () => {
    renderFlow();

    await waitFor(() => expect(screen.getByTestId('active-stage')).toHaveTextContent('onboarding.cognitiveProfile'));

    fireEvent.click(screen.getByRole('button', { name: /complete cognitive/i }));
    await waitFor(() => expect(screen.getByTestId('active-stage')).toHaveTextContent('onboarding.cvUpload'));

    fireEvent.click(screen.getByRole('button', { name: /complete cv/i }));
    await waitFor(() => expect(screen.getByTestId('active-stage')).toHaveTextContent('sidebar.myCvs'));
  });

  it('requires manual stages with completion events to be unlocked and completed', async () => {
    renderFlow(['cognitive.profile.completed', 'cv.upload.completed']);

    await waitFor(() => expect(screen.getByTestId('active-stage')).toHaveTextContent('sidebar.myCvs'));
    expect(screen.getByTestId('my-cvs-complete')).toHaveTextContent('false');

    fireEvent.click(screen.getByRole('button', { name: /review my cvs/i }));
    await waitFor(() => expect(screen.getByTestId('my-cvs-complete')).toHaveTextContent('false'));

    fireEvent.click(screen.getByRole('button', { name: /confirm my cvs/i }));
    await waitFor(() => expect(screen.getByTestId('my-cvs-complete')).toHaveTextContent('true'), { timeout: 3_000 });
  });

  it('asks the host router adapter to navigate gated routes to the active stage route', async () => {
    const navigate = vi.fn();

    render(
      <UnlockableProvider appId="flow-router-test" storage={createMemoryStorage()}>
        <UnlockableCatalogRegistrar definitions={definitions} />
        <UnlockableFlowProvider router={{ pathname: '/onboarding/cv', navigate }}>
          <UnlockableFlowRouteGate stageId="onboarding.cvUpload" fallback={<div>locked</div>}>
            <div>CV upload route</div>
          </UnlockableFlowRouteGate>
        </UnlockableFlowProvider>
      </UnlockableProvider>,
    );

    expect(screen.getByText('locked')).toBeInTheDocument();
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/cognitive', { replace: true }));
  });

  it('renders fallback instead of navigating when no router adapter is provided', () => {
    render(
      <UnlockableProvider appId="flow-routerless-test" storage={createMemoryStorage()}>
        <UnlockableCatalogRegistrar definitions={definitions} />
        <UnlockableFlowProvider>
          <UnlockableFlowRouteGate stageId="onboarding.cvUpload" fallback={<div>locked</div>}>
            <div>CV upload route</div>
          </UnlockableFlowRouteGate>
        </UnlockableFlowProvider>
      </UnlockableProvider>,
    );

    expect(screen.getByText('locked')).toBeInTheDocument();
  });
});
