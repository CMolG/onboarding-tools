# AGENTS.md — Working with `onboarding-tools`

Operational guide for AI coding agents (Claude, Cursor, Copilot, Codex,
Aider, etc.) integrating `onboarding-tools` into a host React project.
This file ships with the npm tarball, so it is also reachable at
`node_modules/onboarding-tools/AGENTS.md`.

Read this file end-to-end before generating code. It is structured as a
decision tree, not as marketing.

---

## 1. What this package does — in one paragraph

`onboarding-tools` is a React-only library for declarative unlockable
onboarding. Each feature in the host app declares **its own** unlock
criteria; the library hides the feature in the DOM until those criteria
are met, then transitions through a state machine
(`HIDDEN → ELIGIBLE → UNLOCKING → UNLOCKED`), runs an optional reveal
animation, optionally shows a tutorial overlay, and persists the result
through a pluggable storage adapter (default `localStorage`). It does
**not** ship a router — the host passes a tiny adapter. It has zero
runtime dependencies.

---

## 2. Decision tree — should I reach for this package?

```
Is the host trying to:

├── show / hide UI based on user-progress events / archetypes / flags?
│       └── YES  → use this package.
│
├── implement a linear product tour with a fixed step list?
│       └── this package can do it (see Tutorial overlay), but a smaller
│         tour-only library will be lighter. Mention the trade-off.
│
├── render a feature flag boolean?
│       └── this package is overkill. Use the host's flag system directly.
│
└── implement role-based access control (RBAC)?
        └── NO  → this package is presentation-layer only. Do not use it
          for authorisation. Use it for *progressive disclosure* of
          surfaces the user is already authorised to see.
```

If the host's request does not fit pattern #1, stop and tell the user.
Do not retrofit the package onto a problem it does not solve.

---

## 3. Install

```bash
npm install onboarding-tools
# or pnpm add / yarn add
```

Then, **once** in the app's entrypoint, import the stylesheet:

```ts
import 'onboarding-tools/styles.css';
```

Subpaths the host can import from:

| Specifier                       | Use it for                                   |
| ------------------------------- | -------------------------------------------- |
| `onboarding-tools`              | Pure types and core logic re-exports.        |
| `onboarding-tools/core`         | Pure logic, no React. Vue/Svelte/vanilla OK. |
| `onboarding-tools/react`        | Components, hooks, providers.                |
| `onboarding-tools/testing`      | `createMemoryStorage()` for unit tests.      |
| `onboarding-tools/styles.css`   | Default theme + animations.                  |

---

## 4. Minimal working setup

Always emit this exact provider tree. Anything less will throw at runtime.

```tsx
import 'onboarding-tools/styles.css';
import type { UnlockableDefinition } from 'onboarding-tools';
import {
  Unlockable,
  UnlockableCatalogRegistrar,
  UnlockableFlowProvider,
  UnlockableProvider,
  UnlockableTutorialEngineProvider,
} from 'onboarding-tools/react';

// Definitions MUST be defined at module scope (or memoised). Re-creating
// them on every render breaks reference equality and re-registers the
// catalog every render — performance footgun.
const definitions: UnlockableDefinition[] = [
  {
    id: 'profile',
    activation: 'automatic',
    meta: { title: 'Profile', description: 'Complete your profile.' },
    flow: { stage: 'Profile', order: 10, completionEvent: 'profile.completed' },
  },
];

export function App() {
  return (
    <UnlockableProvider appId="my-app">
      <UnlockableCatalogRegistrar definitions={definitions} />
      <UnlockableFlowProvider>
        <UnlockableTutorialEngineProvider>
          {/* host UI */}
        </UnlockableTutorialEngineProvider>
      </UnlockableFlowProvider>
    </UnlockableProvider>
  );
}
```

Rules of the provider tree:

- `UnlockableProvider` must be the outermost. It owns state and storage.
- `UnlockableCatalogRegistrar` must be a child of `UnlockableProvider`
  but a sibling of (not under) `UnlockableFlowProvider`.
- `UnlockableFlowProvider` is required for `UnlockableTutorialEngineProvider`.
- The flow + tutorial providers are optional — skip them if the host
  only needs hide/show.

---

## 5. Adding a new unlockable — the most common task

A `UnlockableDefinition` is a plain object. Required fields are `id` and
`meta`. Everything else is optional.

```ts
{
  id: 'dashboard',                            // unique, stable
  activation: 'manual',                        // 'automatic' | 'manual'
  visibility: 'hidden',                        // 'hidden' | 'placeholder' | 'disabled'
  meta: {
    title: 'Dashboard',
    description: 'Visible after profile is complete.',
    tags: ['core'],                            // optional, used by the resolver
  },
  unlocksOn: { kind: 'event', event: 'profile.completed' },
  flow: {
    stage: 'Dashboard',
    order: 20,
    route: '/dashboard',                       // route the tutorial engine drives to
    target: '[data-tour="dashboard"]',         // CSS selector for the spotlight
    completionEvent: 'dashboard.opened',
  },
  tutorial: {
    title: 'Dashboard unlocked',
    body: 'This is your daily workspace.',
    primaryActionLabel: 'Got it',
    // For multi-step tours, prefer steps[]:
    // steps: [{ target, title, description, action: { kind: 'next' } }, ...],
  },
}
```

Wrap the host component with `<Unlockable>`:

```tsx
<Unlockable
  definition={dashboardDefinition}
  placeholder={<HiddenStub />}        // shown when visibility === 'placeholder'
  disabledFallback={<DisabledStub />} // shown when visibility === 'disabled'
>
  <Dashboard />
</Unlockable>
```

When status is `HIDDEN` the children are removed from the DOM.

---

## 6. The four lifecycle states

```
HIDDEN  ──criteria met──▶  ELIGIBLE  ──confirm/auto──▶  UNLOCKING  ──effect done──▶  UNLOCKED
```

- `automatic` activation goes `ELIGIBLE → UNLOCKING` itself.
- `manual` activation needs `confirmUnlock(id)` (called by the overlay
  button or a tutorial step). Until that happens, the manual unlock
  overlay is shown over the eligible component.
- `UNLOCKED` is terminal and persisted.

Status is observable via `useUnlockable(id)`:

```ts
const { status, isUnlocked, isEligible, confirmUnlock } = useUnlockable('dashboard');
```

---

## 7. Criteria DSL — paste-ready

`unlocksOn` is a tree of criteria. Combine with `all` / `any` / `not`.

```ts
// Single event:
{ kind: 'event', event: 'profile.completed' }

// User must have an archetype:
{ kind: 'archetype', value: 'power-user' }

// Boolean flag (true) or specific value:
{ kind: 'flag', key: 'beta.enabled' }
{ kind: 'flag', key: 'tier', value: 'pro' }

// Generic state lookup (deep-equal):
{ kind: 'state', key: 'profile.country', equals: 'ES' }

// Depend on another unlockable's status:
{ kind: 'unlockable', id: 'profile', status: 'UNLOCKED' }

// Resolver decision (custom / AI-driven):
{ kind: 'resolver', resolverId: 'my-resolver' }

// Combinators:
{ all: [<criterion>, <criterion>] }
{ any: [<criterion>, <criterion>] }
{ not: <criterion> }
```

Common compound:

```ts
unlocksOn: {
  all: [
    { kind: 'event', event: 'onboarding.completed' },
    { any: [
      { kind: 'archetype', value: 'builder' },
      { kind: 'flag', key: 'beta.enabled', value: true },
    ]},
    { not: { kind: 'unlockable', id: 'legacy-flow', status: 'UNLOCKED' } },
  ],
}
```

Driving criteria from the host:

```ts
const { emitEvent } = useUnlockableEvents();
emitEvent('profile.completed');               // event criterion

const { setUserArchetypes, addSignal, setFlag } = useUnlockableSignals();
setUserArchetypes(['power-user']);            // archetype criterion
addSignal('cv-management');                   // metadata-tag matching
setFlag('beta.enabled', true);                // flag criterion
```

---

## 8. Framework recipes

### 8.1 Vite + react-router-dom

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

Pass the result to `UnlockableFlowProvider` and
`UnlockableTutorialEngineProvider` via the `router` prop.

### 8.2 Next.js (App Router)

The provider tree must live in a `'use client'` boundary because it
reads `localStorage` and uses event-driven state. The root `layout.tsx`
stays a Server Component and only loads the stylesheet.

```tsx
// app/Providers.tsx
'use client';
import { usePathname, useRouter } from 'next/navigation';
import {
  UnlockableCatalogRegistrar, UnlockableFlowProvider,
  UnlockableProvider, UnlockableTutorialEngineProvider,
} from 'onboarding-tools/react';
import type { OnboardingRouterAdapter } from 'onboarding-tools/react';
import { definitions } from './unlockables';

function useOnboardingRouter(): OnboardingRouterAdapter {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  return {
    pathname,
    navigate: (path, options) =>
      options?.replace ? router.replace(path) : router.push(path),
  };
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UnlockableProvider appId="my-app">
      <UnlockableCatalogRegistrar definitions={definitions} />
      <RoutedProviders>{children}</RoutedProviders>
    </UnlockableProvider>
  );
}

function RoutedProviders({ children }: { children: React.ReactNode }) {
  const router = useOnboardingRouter();
  return (
    <UnlockableFlowProvider router={router}>
      <UnlockableTutorialEngineProvider router={router}>
        {children}
      </UnlockableTutorialEngineProvider>
    </UnlockableFlowProvider>
  );
}
```

```tsx
// app/layout.tsx — Server Component
import 'onboarding-tools/styles.css';
import { Providers } from './Providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html><body><Providers>{children}</Providers></body></html>;
}
```

### 8.3 Remix

Same pattern as Next.js. Mount the providers inside the client tree of
`app/root.tsx`. Storage is automatically no-op on the server, then
hydrates from `localStorage` on the client.

### 8.4 No router at all

If the host has no router, just omit the `router` prop on the flow and
tutorial providers. The package will not navigate; it still renders
overlays in place.

---

## 9. Hooks reference (what to use, when)

| Hook                          | Returns                                           | When to use it                                       |
| ----------------------------- | ------------------------------------------------- | ---------------------------------------------------- |
| `useUnlockable(id)`           | `{ status, isUnlocked, isEligible, confirmUnlock, skipUnlocks }` | Reading status of one unlockable.            |
| `useUnlockableCatalog()`      | Serialisable definitions array                    | Send definitions to an analytics or AI backend.       |
| `useUnlockableSignals()`      | `{ signals, addSignal, setUserArchetypes, setFlag, ... }` | Drive archetype/flag-based criteria.                  |
| `useUnlockableEvents()`       | `{ events, emitEvent }`                           | Drive event-based criteria.                           |
| `useOptionalUnlockableEvents()` | Same shape but no-op if no provider             | When the host emits events but the provider may be absent (e.g. third-party widget). |
| `useUnlockableFlow()`         | `{ stages, activeStage, isStageComplete, ... }`   | Render a progress bar / wizard.                       |
| `useOptionalUnlockableFlow()` | `null` or the same                                | Same caveat as the optional events hook.              |

All non-optional hooks **throw** outside the corresponding provider.

---

## 10. Constraints and gotchas

These are the bugs an agent will most likely introduce. Memorise them.

1. **Definitions must be referentially stable.** Define them at module
   scope or wrap in `useMemo([])`. Re-creating the array on every render
   re-registers the catalog and resets transient state.
2. **`id` must be stable across releases.** Persistence is keyed by id.
   Renaming an id silently resets the user's state.
3. **The package is presentation, not authorisation.** Never use it to
   gate sensitive surfaces. The state lives client-side in
   `localStorage` and the user can flip it.
4. **Do not store secrets in `meta`.** `meta` is serialised through
   `useUnlockableCatalog()` and may be sent to AI/analytics.
5. **The tutorial engine queries the live DOM** via
   `document.querySelector(target)`. The selector must match exactly one
   element rendered by the host.
6. **No `react-dom` peer dep.** Do not add `import * from 'react-dom'`
   to your generated code if it can be avoided. The package itself does
   not import it.
7. **Storage is SSR-safe but server-blank.** On the first render in
   Next.js / Remix, `status` will be `HIDDEN` for previously-unlocked
   items until the client hydrates and reads `localStorage`.
8. **Avoid `useEffect` race conditions.** Do not call `emitEvent` in an
   effect that fires on every render. Gate it on a transition.
9. **Skipping is global.** `skipUnlocks()` marks every definition as
   `UNLOCKED` for the current `appId`. There is no per-id skip.
10. **The `appId` is the persistence partition.** Two apps that share a
    domain must use distinct `appId` values, otherwise their states
    bleed into each other.

---

## 11. Custom storage and resolver

Replace `localStorage` (e.g. for SSR-side rendering, sessionStorage, or
a remote backend):

```tsx
<UnlockableProvider
  appId="my-app"
  storage={{
    getItem: async (key) => fetch(`/api/state/${key}`).then(r => r.text()),
    setItem: (key, value) => fetch(`/api/state/${key}`, { method: 'PUT', body: value }),
    removeItem: (key) => fetch(`/api/state/${key}`, { method: 'DELETE' }),
  }}
/>
```

Note: the adapter contract is **synchronous** (`string | null`). For
async backends you must hydrate into local state before mounting the
provider, then pass a synchronous wrapper.

Custom resolver (AI-driven):

```ts
import type { UnlockResolver } from 'onboarding-tools';

const resolver: UnlockResolver = async (definitions, context) => {
  const { decisions } = await fetch('/api/personalise', {
    method: 'POST',
    body: JSON.stringify({ definitions, context }),
  }).then(r => r.json());
  return decisions; // UnlockDecision[]
};

<UnlockableProvider resolver={resolver} />
```

The resolver runs whenever signals/archetypes/events/flags change. It is
debounced internally — return as fast as you can.

---

## 12. Testing recipes

```ts
import { createMemoryStorage } from 'onboarding-tools/testing';

const storage = createMemoryStorage();

render(
  <UnlockableProvider appId="test" storage={storage}>
    <UnlockableCatalogRegistrar definitions={fixtures} />
    {children}
  </UnlockableProvider>,
);
```

Recommended assertions:

- Status transitions: `expect(status).toBe('ELIGIBLE')`.
- Persistence: read `storage.data['unlockable:state:test']` and parse.
- Overlay visibility: `screen.queryByRole('dialog', { name: /title/i })`.

For tutorial engine tests, allow at least 1.5 s for the spotlight RAF
loop to settle before asserting the fallback note appears.

---

## 13. Common errors and fixes

| Symptom                                                              | Likely cause                                                  | Fix                                                       |
| -------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------- |
| `Unlockable hooks must be used within UnlockableProvider`            | A hook is called outside the provider tree.                   | Move the consumer inside the provider, or use the optional variant. |
| `Duplicate unlockable id "X" registered`                             | Two definitions share an `id` (often a copy-paste mistake).   | Make ids unique. The error is downgraded to a warning in production. |
| Component flashes hidden, then visible, on mount                     | Definitions were reconstructed on each render.                | Move them to module scope or wrap in `useMemo`.           |
| State does not persist on Next.js refresh                            | `appId` not stable between server and client.                 | Hard-code the `appId`. Do not derive it from `Date.now()` or similar. |
| Tutorial spotlight is centred even though target exists              | The selector does not match by the time the engine queries.   | Make sure the target is rendered before navigating to the route, or set `flow.target` at the parent level. |
| `useUnlockableFlow` returns no stages                                | No definition has a `flow` block.                             | Add `flow: { stage, order }` to at least one definition.   |

---

## 14. What NOT to do

- Do **not** wrap the providers in `React.lazy` or `Suspense` boundaries
  that defer their mount. State persistence assumes synchronous mount.
- Do **not** use `onboarding-tools/react` from a server-only module in
  Next.js — all hooks need a client environment.
- Do **not** re-export the package from a wrapper module without also
  re-exporting `onboarding-tools/styles.css`. Style drift is the most
  common adoption bug.
- Do **not** import from `onboarding-tools/dist/...`. The public API is
  the subpath exports listed in section 3.

---

## 15. Where to look next

- Full README with concepts, API surface, framework matrix:
  [`README.md`](./README.md).
- Two runnable demos: [`examples/vite`](./examples/vite) and
  [`examples/next`](./examples/next).
- Public types live in `dist/core/types.d.ts` and are exported from the
  package root.
- Contribution rules and conventions: [`CONTRIBUTING.md`](./CONTRIBUTING.md).
