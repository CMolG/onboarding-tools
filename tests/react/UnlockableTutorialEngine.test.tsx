import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useMemo, useState, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Unlockable } from '../../src/react/Unlockable';
import { UnlockableCatalogRegistrar } from '../../src/react/UnlockableCatalogRegistrar';
import { UnlockableFlowProvider } from '../../src/react/UnlockableFlowProvider';
import { UnlockableTutorialEngineProvider } from '../../src/react/UnlockableTutorialEngine';
import { UnlockableProvider, useUnlockableEvents } from '../../src/react/UnlockableProvider';
import type { OnboardingRouterAdapter } from '../../src/react/router';
import { createMemoryStorage } from '../../src/testing';
import type { UnlockableDefinition } from '../../src/core/types';

const definition: UnlockableDefinition = {
  id: 'workspace.myCvs',
  activation: 'manual',
  meta: { title: 'My CVs', description: 'Review your parsed CV.' },
  unlocksOn: { kind: 'event', event: 'cv.upload.completed' },
  tutorial: {
    kind: 'spotlight',
    title: 'My CVs is ready',
    body: 'Review your CV.',
    primaryActionLabel: 'Show My CVs',
    steps: [{
      route: '/cvs',
      target: '[data-testid="my-cvs-target"]',
      title: 'My CVs is ready',
      description: 'Review your CV.',
      position: 'right',
      action: { kind: 'confirmUnlock', label: 'Show My CVs' },
    }],
  },
  flow: {
    stage: 'My CVs',
    route: '/cvs',
    target: '[data-testid="my-cvs-target"]',
    completionEvent: 'profile.cv.reviewed',
  },
};

const cvUploadDefinition: UnlockableDefinition = {
  id: 'onboarding.cvUpload',
  activation: 'automatic',
  meta: { title: 'CV upload', description: 'Upload CV.' },
  flow: { stage: 'CV upload', completionEvent: 'cv.upload.completed', order: 0 },
};

function EventsProbe() {
  const { events } = useUnlockableEvents();
  return <output data-testid="events">{events.join(',')}</output>;
}

function TestRouterHarness({
  initialPathname = '/dashboard',
  children,
}: {
  readonly initialPathname?: string;
  readonly children: (router: OnboardingRouterAdapter, navigate: ReturnType<typeof vi.fn>) => ReactNode;
}) {
  const [pathname, setPathname] = useState(initialPathname);
  const [navigate] = useState(() => vi.fn());
  const router = useMemo<OnboardingRouterAdapter>(() => ({
    pathname,
    navigate: (path) => {
      navigate(path);
      setPathname(path);
    },
  }), [navigate, pathname]);

  return (
    <>
      <output data-testid="location">{pathname}</output>
      {children(router, navigate)}
      {pathname === '/cvs' ? <div data-testid="my-cvs-target">CV route target</div> : null}
      {pathname === '/chat' ? <div data-testid="ai-workbench-target">AI route target</div> : null}
      {pathname === '/dashboard' ? <div>Dashboard</div> : null}
    </>
  );
}

function renderTutorial(definitions: readonly UnlockableDefinition[] = [definition], initialPathname = '/dashboard') {
  const registeredDefinitions: readonly UnlockableDefinition[] = [
    cvUploadDefinition,
    ...definitions,
  ];

  return render(
    <TestRouterHarness initialPathname={initialPathname}>
      {(router) => (
        <UnlockableProvider appId="tutorial-test" storage={createMemoryStorage()} initialEvents={['cv.upload.completed']}>
          <UnlockableCatalogRegistrar definitions={registeredDefinitions} />
          <UnlockableFlowProvider router={router}>
            <UnlockableTutorialEngineProvider router={router}>
              <EventsProbe />
              <Unlockable definition={definitions[0]}>
                <div>My CVs child</div>
              </Unlockable>
            </UnlockableTutorialEngineProvider>
          </UnlockableFlowProvider>
        </UnlockableProvider>
      )}
    </TestRouterHarness>,
  );
}

function renderRouterlessTutorial() {
  return render(
    <UnlockableProvider appId="tutorial-routerless-test" storage={createMemoryStorage()} initialEvents={['cv.upload.completed']}>
      <UnlockableCatalogRegistrar definitions={[cvUploadDefinition, definition]} />
      <UnlockableFlowProvider>
        <UnlockableTutorialEngineProvider>
          <Unlockable definition={definition}>
            <div data-testid="my-cvs-target">My CVs child</div>
          </Unlockable>
        </UnlockableTutorialEngineProvider>
      </UnlockableFlowProvider>
    </UnlockableProvider>,
  );
}

function renderSequentialTutorial() {
  const aiWorkbench: UnlockableDefinition = {
    id: 'workspace.aiWorkbench',
    activation: 'manual',
    meta: { title: 'AI Workbench', description: 'Open the AI workspace.' },
    unlocksOn: { kind: 'event', event: 'profile.cv.reviewed' },
    tutorial: {
      kind: 'spotlight',
      title: 'AI Workbench is ready',
      steps: [{
        route: '/chat',
        target: '[data-testid="ai-workbench-target"]',
        title: 'AI Workbench is ready',
        description: 'Use AI after CV review.',
        action: { kind: 'confirmUnlock', label: 'Show AI Workbench' },
      }],
    },
    flow: {
      stage: 'AI Workbench',
      route: '/chat',
      target: '[data-testid="ai-workbench-target"]',
      order: 2,
      completionEvent: 'ai.workbench.opened',
    },
  };

  return render(
    <TestRouterHarness initialPathname="/dashboard">
      {(router) => (
        <UnlockableProvider appId="tutorial-sequential-test" storage={createMemoryStorage()} initialEvents={['cv.upload.completed']}>
          <UnlockableCatalogRegistrar definitions={[cvUploadDefinition, definition, aiWorkbench]} />
          <UnlockableFlowProvider router={router}>
            <UnlockableTutorialEngineProvider router={router}>
              <Unlockable definition={definition}>
                <div>My CVs child</div>
              </Unlockable>
              <Unlockable definition={aiWorkbench}>
                <div>AI Workbench child</div>
              </Unlockable>
            </UnlockableTutorialEngineProvider>
          </UnlockableFlowProvider>
        </UnlockableProvider>
      )}
    </TestRouterHarness>,
  );
}

describe('UnlockableTutorialEngine', () => {
  it('auto-materializes manual unlockables and then explains the activated element', async () => {
    renderTutorial();

    expect(screen.queryByText(/is ready/i)).not.toBeInTheDocument();
    expect(await screen.findByTestId('location')).toHaveTextContent('/cvs');
    expect(await screen.findByText('My CVs child')).toBeInTheDocument();
    const dialog = await screen.findByTestId('unlockable-tutorial-dialog', {}, { timeout: 3_000 });
    expect(dialog).toHaveAttribute('data-unlockable-tutorial-phase', 'activated');
    expect(dialog).toHaveTextContent(/my cvs enabled/i);
    expect(screen.getByTestId('unlockable-tutorial-spotlight')).toBeInTheDocument();
  });

  it('auto-materializes eligible manual unlockables without a router adapter', async () => {
    renderRouterlessTutorial();

    await waitFor(() => expect(screen.getByTestId('my-cvs-target')).toBeInTheDocument());
    const dialog = await screen.findByTestId('unlockable-tutorial-dialog', {}, { timeout: 3_000 });
    expect(dialog).toHaveAttribute('data-unlockable-tutorial-phase', 'activated');
    expect(dialog).toHaveTextContent(/my cvs enabled/i);
  });

  it('keeps product completion gated behind the post-activation tutorial', async () => {
    renderTutorial();

    expect(await screen.findByText('My CVs child')).toBeInTheDocument();
    const dialog = await screen.findByTestId('unlockable-tutorial-dialog', {}, { timeout: 3_000 });
    expect(dialog).toHaveAttribute('data-unlockable-tutorial-phase', 'activated');
    expect(screen.getByTestId('events')).toHaveTextContent('cv.upload.completed');
    expect(screen.getByTestId('events')).not.toHaveTextContent('profile.cv.reviewed');

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    await waitFor(() => expect(screen.getByTestId('events')).toHaveTextContent('profile.cv.reviewed'));
  });

  it('shows a centered fallback when the target is missing', async () => {
    renderTutorial([{
      ...definition,
      tutorial: {
        ...definition.tutorial,
        steps: [{
          route: '/dashboard',
          target: '[data-testid="missing-target"]',
          title: 'Fallback guide',
          description: 'Missing target.',
          action: { kind: 'confirmUnlock', label: 'Continue' },
        }],
      },
      flow: {
        ...definition.flow,
        route: '/dashboard',
        target: '[data-testid="missing-target"]',
      },
    }], '/dashboard');

    const dialog = await screen.findByTestId('unlockable-tutorial-dialog', {}, { timeout: 3_000 });
    expect(dialog).toHaveAttribute('data-unlockable-tutorial-phase', 'activated');
    await waitFor(
      () => expect(screen.getByText(/target is not visible/i)).toBeInTheDocument(),
      { timeout: 3_000 },
    );
  });

  it('continues to the next active route after a completed unlocked route emits its completion event', async () => {
    renderSequentialTutorial();

    await waitFor(() => expect(screen.getByRole('dialog', { name: /my cvs enabled/i })).toBeInTheDocument(), { timeout: 3_000 });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/chat'));
    expect(await screen.findByRole('dialog', { name: /ai workbench enabled/i }, { timeout: 3_000 })).toBeInTheDocument();
  });
});
