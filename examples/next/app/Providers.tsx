'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  UnlockableCatalogRegistrar,
  UnlockableFlowProvider,
  UnlockableProvider,
  UnlockableTutorialEngineProvider,
  useUnlockableEvents,
} from 'onboarding-tools/react';

import { definitions, DOCS_EVENTS_KEY } from './definitions';
import { useOnboardingRouter } from './routerAdapter';

export function Providers({ children }: { readonly children: ReactNode }) {
  const [initialEvents] = useState(readStoredEvents);

  return (
    <UnlockableProvider
      appId="onboarding-tools-docs"
      initialEvents={initialEvents}
      theme={{
        tokens: {
          '--ot-color-primary': '#0b57d0',
          '--ot-color-primary-soft': '#d3e3fd',
          '--ot-color-backdrop': 'rgb(15 23 42 / 54%)',
          '--ot-radius-card': '20px',
          '--ot-radius-control': '20px',
          '--ot-shadow-card': '0 4px 14px rgb(29 27 32 / 10%)',
        },
      }}
    >
      <UnlockableCatalogRegistrar definitions={definitions} />
      <DocsEventsPersistence />
      <RoutedProviders>{children}</RoutedProviders>
    </UnlockableProvider>
  );
}

function RoutedProviders({ children }: { readonly children: ReactNode }) {
  const router = useOnboardingRouter();
  return (
    <UnlockableFlowProvider router={router}>
      <UnlockableTutorialEngineProvider
        router={router}
        completeActivationAnnouncement={false}
        autoNavigateManualActivation={false}
      >
        {children}
      </UnlockableTutorialEngineProvider>
      </UnlockableFlowProvider>
  );
}

function DocsEventsPersistence() {
  const { events } = useUnlockableEvents();

  useEffect(() => {
    window.localStorage.setItem(DOCS_EVENTS_KEY, JSON.stringify(events));
  }, [events]);

  return null;
}

function readStoredEvents(): readonly string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(DOCS_EVENTS_KEY) ?? '[]') as unknown;
    return Array.isArray(parsed) ? parsed.filter((event): event is string => typeof event === 'string') : [];
  } catch {
    return [];
  }
}
