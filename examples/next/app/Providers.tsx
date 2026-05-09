'use client';

import { type ReactNode } from 'react';
import {
  UnlockableCatalogRegistrar,
  UnlockableFlowProvider,
  UnlockableProvider,
  UnlockableTutorialEngineProvider,
} from 'onboarding-tools/react';

import { definitions } from './unlockables';
import { useOnboardingRouter } from './routerAdapter';

export function Providers({ children }: { readonly children: ReactNode }) {
  return (
    <UnlockableProvider appId="onboarding-tools-next-example">
      <UnlockableCatalogRegistrar definitions={definitions} />
      <RoutedProviders>{children}</RoutedProviders>
    </UnlockableProvider>
  );
}

function RoutedProviders({ children }: { readonly children: ReactNode }) {
  const router = useOnboardingRouter();
  return (
    <UnlockableFlowProvider router={router}>
      <UnlockableTutorialEngineProvider router={router}>
        {children}
      </UnlockableTutorialEngineProvider>
    </UnlockableFlowProvider>
  );
}
