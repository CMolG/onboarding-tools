# onboarding-tools

Declarative unlockable onboarding, progressive disclosure, and tutorial overlays for React apps.

## Install

```bash
npm install onboarding-tools
```

Import the default styles once in your app:

```ts
import 'onboarding-tools/styles.css';
```

## Basic usage

```tsx
import type { UnlockableDefinition } from 'onboarding-tools';
import {
  Unlockable,
  UnlockableCatalogRegistrar,
  UnlockableFlowProvider,
  UnlockableProvider,
  UnlockableTutorialEngineProvider,
} from 'onboarding-tools/react';

const definitions: UnlockableDefinition[] = [
  {
    id: 'profile',
    activation: 'automatic',
    meta: { title: 'Profile', description: 'Complete your profile first.' },
    flow: { stage: 'Profile', order: 10, completionEvent: 'profile.completed' },
  },
  {
    id: 'dashboard',
    activation: 'manual',
    visibility: 'hidden',
    meta: { title: 'Dashboard', description: 'Unlock the dashboard after setup.' },
    unlocksOn: { kind: 'event', event: 'profile.completed' },
    flow: { stage: 'Dashboard', order: 20, completionEvent: 'dashboard.opened' },
  },
];

export function App() {
  return (
    <UnlockableProvider appId="demo">
      <UnlockableCatalogRegistrar definitions={definitions} />
      <UnlockableFlowProvider>
        <UnlockableTutorialEngineProvider>
          <Unlockable definition={definitions[1]}>
            <Dashboard />
          </Unlockable>
        </UnlockableTutorialEngineProvider>
      </UnlockableFlowProvider>
    </UnlockableProvider>
  );
}
```

Manual unlockables auto-materialize when their conditions are met; the tutorial overlay explains the element after the activation animation completes.

## Router integration

The package does not depend on a router. Pass a small adapter when a flow should navigate between stages:

```tsx
import { useLocation, useNavigate } from 'react-router-dom';
import type { OnboardingRouterAdapter } from 'onboarding-tools/react';

function useOnboardingRouter(): OnboardingRouterAdapter {
  const location = useLocation();
  const navigate = useNavigate();
  return {
    pathname: location.pathname,
    navigate: (path, options) => navigate(path, { replace: options?.replace }),
  };
}
```

Then pass the same adapter to `UnlockableFlowProvider` and `UnlockableTutorialEngineProvider`.

## Archetype-driven unlocks

Definitions can include `archetype`, `autoAssignable`, and metadata tags. After your app clusters a user, call `setUserArchetypes(['builder'])` or `addSignal('cv-management')` from `useUnlockableSignals()`. Use the built-in resolver or pass a custom `UnlockResolver` for AI-driven decisions.

## Custom storage and theming

Pass a storage adapter to persist state outside `localStorage`, and override the shipped CSS variables to change the default overlay and spotlight styling:

```css
:root {
  --ot-color-primary: #0f766e;
  --ot-radius-card: 20px;
  --ot-shadow-card: 0 30px 90px rgb(15 23 42 / 22%);
}
```

```tsx
<UnlockableProvider
  appId="demo"
  storage={{
    getItem: (key) => sessionStorage.getItem(key),
    setItem: (key, value) => sessionStorage.setItem(key, value),
    removeItem: (key) => sessionStorage.removeItem(key),
  }}
/>
```
