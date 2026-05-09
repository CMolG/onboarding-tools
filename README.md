<!-- markdownlint-disable MD033 MD041 -->

```
                                                                          
   ██████╗ ███╗   ██╗██████╗  ██████╗  █████╗ ██████╗ ██████╗ ██╗███╗   ██╗ ██████╗ 
  ██╔═══██╗████╗  ██║██╔══██╗██╔═══██╗██╔══██╗██╔══██╗██╔══██╗██║████╗  ██║██╔════╝ 
  ██║   ██║██╔██╗ ██║██████╔╝██║   ██║███████║██████╔╝██║  ██║██║██╔██╗ ██║██║  ███╗
  ██║   ██║██║╚██╗██║██╔══██╗██║   ██║██╔══██║██╔══██╗██║  ██║██║██║╚██╗██║██║   ██║
  ╚██████╔╝██║ ╚████║██████╔╝╚██████╔╝██║  ██║██║  ██║██████╔╝██║██║ ╚████║╚██████╔╝
   ╚═════╝ ╚═╝  ╚═══╝╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚═╝╚═╝  ╚═══╝ ╚═════╝ 

                  ████████╗ ██████╗  ██████╗ ██╗     ███████╗
                  ╚══██╔══╝██╔═══██╗██╔═══██╗██║     ██╔════╝
                     ██║   ██║   ██║██║   ██║██║     ███████╗
                     ██║   ██║   ██║██║   ██║██║     ╚════██║
                     ██║   ╚██████╔╝╚██████╔╝███████╗███████║
                     ╚═╝    ╚═════╝  ╚═════╝ ╚══════╝╚══════╝
```

<p align="center">
  <strong>Declarative unlockable onboarding, progressive disclosure, and tutorial overlays for any React app.</strong>
</p>

<p align="center">
  <em>Tag a component as <code>Unlockable</code>. Describe when it should appear.<br/>
  The state machine, persistence, animations, and tutorial overlay are handled for you.</em>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/onboarding-tools"><img alt="npm" src="https://img.shields.io/npm/v/onboarding-tools.svg?color=%230f766e&label=npm" /></a>
  <a href="./LICENSE"><img alt="license" src="https://img.shields.io/badge/license-MIT-blue.svg" /></a>
  <img alt="types" src="https://img.shields.io/badge/types-TypeScript-3178c6.svg" />
  <img alt="zero deps" src="https://img.shields.io/badge/runtime%20deps-0-brightgreen.svg" />
  <img alt="react peer" src="https://img.shields.io/badge/peer-react%20%E2%89%A518-61dafb.svg" />
  <a href="https://bundlephobia.com/package/onboarding-tools"><img alt="bundle size" src="https://img.shields.io/bundlephobia/minzip/onboarding-tools" /></a>
</p>

<p align="center">
  <a href="#-quickstart">Quickstart</a> ·
  <a href="#-examples">Examples</a> ·
  <a href="#-concepts">Concepts</a> ·
  <a href="#-theming">Theming</a> ·
  <a href="#-framework-compatibility">Frameworks</a> ·
  <a href="#-api-reference">API</a> ·
  <a href="./AGENTS.md">For AI agents</a> ·
  <a href="./CONTRIBUTING.md">Contributing</a>
</p>

---

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║    █▄░█ █▀█    ▀▄▀ █░█ █▄█    ▀█▀ █░█ █ █▀                        ║
║    █░▀█ █▄█    █░█ █▀█ ░█░    ░█░ █▀█ █ ▄█    E X I S T S         ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

Most onboarding libraries assume a **linear product tour**: step 1, step 2,
step 3, done. Real products are not linear. Features should appear when the
user is ready for them — after a personality test, after they ship their
first artifact, after an AI clusters them into an archetype, or after a
feature flag flips.

`onboarding-tools` flips the model:

```diff
- A separate "tour" component that points at things                
- A scripted, ordered list of steps                                 
- Hard-coded conditions baked into your routes                      

+ Each feature declares **its own** unlock criteria                 
+ Components stay hidden until those criteria are met               
+ A state machine handles the transition, animation, and overlay    
+ AI / archetype / flag-driven personalisation is a first-class API 
```

It is the React equivalent of slapping a `@Unlockable("builder")`
annotation on a Java component and letting the runtime decide who sees it.

---

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║    █▀▀ █▀▀ ▄▀█ ▀█▀ █░█ █▀█ █▀▀ █▀                                 ║
║    █▀░ ██▄ █▀█ ░█░ █▄█ █▀▄ ██▄ ▄█                                 ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

- **Zero runtime dependencies.** Only React as an optional peer.
  No `react-router`, no `framer-motion`, no `clsx`, no Vite globals.
- **Framework-agnostic.** Vite, Next.js, Remix, CRA, Webpack — anything
  that runs React. Router and storage are pluggable adapters.
- **Type-safe by default.** Strict TypeScript. Public types live in a single
  `core/types.ts`.
- **Three install surfaces.** Use `/core` standalone (pure logic, even from
  Vue/Svelte), `/react` for the components, `/testing` for unit tests.
- **Persistent state machine.** `HIDDEN → ELIGIBLE → UNLOCKING → UNLOCKED`
  with a serializable, append-only `localStorage` log.
- **Declarative criteria DSL.** Combine `event`, `archetype`, `flag`,
  `state`, `unlockable`, `resolver` with `all` / `any` / `not`.
- **AI-ready resolver hook.** Plug in any function (local heuristic, remote
  LLM, classifier) that returns `UnlockDecision[]`.
- **Tutorial overlay.** Spotlight + coach card with reduced-motion support,
  fallback positioning, and full theming via CSS variables.
- **Flow derivation.** Topological sort with cycle detection so you know
  what stage the user is on without writing a state diagram.

---

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║    █ █▄░█ █▀ ▀█▀ ▄▀█ █░░ █░░                                      ║
║    █ █░▀█ ▄█ ░█░ █▀█ █▄▄ █▄▄                                      ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

```bash
npm install onboarding-tools
# or
pnpm add onboarding-tools
# or
yarn add onboarding-tools
```

Import the default styles **once** in your app root (e.g. `main.tsx` /
`_app.tsx` / `layout.tsx`):

```ts
import 'onboarding-tools/styles.css';
```

Override CSS custom properties to re-skin without forking — see
[Theming](#-theming).

---

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║    █▀█ █░█ █ █▀▀ █▄▀ █▀ ▀█▀ ▄▀█ █▀█ ▀█▀                           ║
║    ▀▀█ █▄█ █ █▄▄ █░█ ▄█ ░█░ █▀█ █▀▄ ░█░                           ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

Define your unlockable catalog:

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

That's the whole API surface for a basic setup. The `Dashboard` component
stays out of the DOM until `emitEvent('profile.completed')` fires; then the
overlay confirms the unlock, plays the reveal animation, and the tutorial
engine narrates the new capability.

---

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║    █▀▀ ▀▄▀ ▄▀█ █▀▄▀█ █▀█ █░░ █▀▀ █▀                               ║
║    ██▄ █░█ █▀█ █░▀░█ █▀▀ █▄▄ ██▄ ▄█                               ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

Two runnable demos live in [`examples/`](./examples). Each one wires the
same three patterns — automatic, event-gated, and archetype-gated — so
you can compare adapters side by side.

### [`examples/vite`](./examples/vite) · Vite + react-router-dom

Router adapter using `useLocation` / `useNavigate`.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz_1x.svg)](https://stackblitz.com/github/CMolG/onboarding-tools/tree/main/examples/vite?title=onboarding-tools+%C2%B7+Vite&file=src%2FApp.tsx)
[![Edit in CodeSandbox](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/p/github/CMolG/onboarding-tools/main?file=%2Fexamples%2Fvite%2Fsrc%2FApp.tsx)

### [`examples/next`](./examples/next) · Next.js 14 (App Router)

Router adapter using `usePathname` / `useRouter`, with a `'use client'`
provider boundary.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz_1x.svg)](https://stackblitz.com/github/CMolG/onboarding-tools/tree/main/examples/next?title=onboarding-tools+%C2%B7+Next.js&file=app%2Fpage.tsx)
[![Edit in CodeSandbox](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/p/github/CMolG/onboarding-tools/main?file=%2Fexamples%2Fnext%2Fapp%2Fpage.tsx)

Run them locally straight from the repo:

```bash
npm install && npm run build       # build the package once
cd examples/vite                   # or examples/next
npm install
npm run dev
```

Each example links the package via `file:../..`, so changes to `src/`
flow into the demo as soon as you re-run `npm run build` at the root.

---

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║    █▀▀ █▀█ █▄░█ █▀▀ █▀▀ █▀█ ▀█▀ █▀                                ║
║    █▄▄ █▄█ █░▀█ █▄▄ ██▄ █▀▀ ░█░ ▄█                                ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

### The state machine

```
  ┌──────────┐   criteria met   ┌────────────┐  user/auto   ┌────────────┐  effect done   ┌────────────┐
  │  HIDDEN  │ ───────────────▶ │  ELIGIBLE  │ ───────────▶ │ UNLOCKING  │ ─────────────▶ │  UNLOCKED  │
  └──────────┘                  └────────────┘              └────────────┘                └────────────┘
```

- `automatic` activation jumps straight from `ELIGIBLE` to `UNLOCKING`.
- `manual` activation waits for `confirmUnlock(id)` (overlay button or
  tutorial step).
- `UNLOCKED` is the terminal state. It is persisted to your storage adapter
  and survives reloads.

### Criteria DSL

Every `unlocksOn` is a tree of criteria, combined with `all` / `any` / `not`:

```ts
{
  unlocksOn: {
    all: [
      { kind: 'event', event: 'onboarding.completed' },
      { any: [
        { kind: 'archetype', value: 'builder' },
        { kind: 'flag', key: 'beta.enabled', value: true },
      ]},
      { not: { kind: 'unlockable', id: 'legacy-flow', status: 'UNLOCKED' } },
    ],
  },
}
```

Available criteria kinds: `event`, `archetype`, `flag`, `state`, `unlockable`,
`resolver`.

### Archetypes (a.k.a. hyper-personalisation)

Tag a definition with one or more archetypes and mark it `autoAssignable`:

```ts
{
  id: 'cv-coach',
  archetype: ['builder', 'storyteller'],
  autoAssignable: true,
  meta: { title: 'CV Coach', description: '…', tags: ['cv-management'] },
}
```

After your AI / personality test resolves a user, push the result into the
provider:

```ts
const { setUserArchetypes, addSignal } = useUnlockableSignals();
setUserArchetypes(['builder']);   // from clustering output
addSignal('cv-management');        // from a feature-interest signal
```

The built-in `createLocalUnlockableResolver` matches archetypes against
`meta.tags`, `meta.capability`, and `meta.audience`. Replace it with any
custom `UnlockResolver` (e.g. an LLM call) by passing `resolver` to
`UnlockableProvider`.

### Flow

When definitions declare `flow.stage` / `flow.order` / `flow.completionEvent`,
`UnlockableFlowProvider` derives a topologically-sorted onboarding graph
with cycle detection. Use `useUnlockableFlow()` to render progress UI or
gate routes with `<UnlockableFlowRouteGate />`.

### Tutorial overlay

`UnlockableTutorialEngineProvider` mounts a single coach overlay that:

- Spotlights a CSS selector (`tutorial.steps[].target`).
- Falls back to a centered card if the target is not on screen yet.
- Respects `prefers-reduced-motion`.
- Supports multi-step tutorials with `next` / `confirmUnlock` /
  `focusTarget` / `clickTarget` actions.

---

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║    █▀█ █▀█ █░█ ▀█▀ █▀▀ █▀█    ▄▀█ █▀▄ ▄▀█ █▀█ ▀█▀ █▀▀ █▀█         ║
║    █▀▄ █▄█ █▄█ ░█░ ██▄ █▀▄    █▀█ █▄▀ █▀█ █▀▀ ░█░ ██▄ █▀▄         ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

`onboarding-tools` does not bundle a router. Pass a tiny adapter to plug in
the one you already use:

```tsx
// React Router v6
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

```tsx
// Next.js App Router
'use client';
import { usePathname, useRouter } from 'next/navigation';
import type { OnboardingRouterAdapter } from 'onboarding-tools/react';

function useOnboardingRouter(): OnboardingRouterAdapter {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  return {
    pathname,
    navigate: (path, options) =>
      options?.replace ? router.replace(path) : router.push(path),
  };
}
```

Pass the adapter to `UnlockableFlowProvider` and
`UnlockableTutorialEngineProvider`.

---

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║    █▀ ▀█▀ █▀█ █▀█ ▄▀█ █▀▀ █▀▀    ▄▀█ █▀▄ ▄▀█ █▀█ ▀█▀ █▀▀ █▀█      ║
║    ▄█ ░█░ █▄█ █▀▄ █▀█ █▄█ ██▄    █▀█ █▄▀ █▀█ █▀▀ ░█░ ██▄ █▀▄      ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

The default storage uses `window.localStorage` and is SSR-safe (gracefully
no-ops when `window` is undefined). Swap it for anything that satisfies
`UnlockableStorageAdapter`:

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

For tests, import the in-memory adapter:

```ts
import { createMemoryStorage } from 'onboarding-tools/testing';

const storage = createMemoryStorage();
```

---

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║    ▀█▀ █░█ █▀▀ █▀▄▀█ █ █▄░█ █▀▀                                   ║
║    ░█░ █▀█ ██▄ █░▀░█ █ █░▀█ █▄█                                   ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

Override CSS custom properties anywhere in your stylesheet — no Sass, no
runtime theme provider:

```css
:root {
  --ot-color-primary: #0f766e;
  --ot-color-primary-soft: rgb(15 118 110 / 12%);
  --ot-color-backdrop: rgb(2 6 23 / 65%);
  --ot-radius-card: 20px;
  --ot-shadow-card: 0 30px 90px rgb(15 23 42 / 22%);
  --ot-z-overlay: 70;
  --ot-z-tutorial: 80;
}
```

Need deeper customisation? Pass a `theme` prop to `UnlockableProvider`:

```tsx
<UnlockableProvider
  theme={{
    className: 'my-app-onboarding',
    tokens: { '--ot-color-primary': '#0f766e' },
    defaultEffect: { name: 'pulse', durationMs: 700 },
    overlay: { kind: 'spotlight', primaryActionLabel: 'Show me' },
  }}
/>
```

---

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║    █▀▀ █▀█ ▄▀█ █▀▄▀█ █▀▀ █░█░█ █▀█ █▀█ █▄▀ █▀                     ║
║    █▀░ █▀▄ █▀█ █░▀░█ ██▄ ▀▄▀▄▀ █▄█ █▀▄ █░█ ▄█                     ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

| Host                     | Status  | Notes                                                              |
| ------------------------ | ------- | ------------------------------------------------------------------ |
| Vite + React             | ✅      | Reference setup. Used in `tests/` (jsdom).                         |
| Next.js (App Router)     | ✅      | Wrap providers in a `'use client'` boundary. SSR-safe storage.     |
| Next.js (Pages Router)   | ✅      | Same — providers go in `_app.tsx`.                                 |
| Remix                    | ✅      | Mount providers in `app/root.tsx` inside the client tree.          |
| Create React App         | ✅      | Works as-is.                                                       |
| Webpack / Rspack         | ✅      | ESM output; `sideEffects` declared for `styles.css`.               |
| Bun / esbuild            | ✅      | No CJS pitfalls.                                                   |
| React Native             | ⚠️      | `core/*` works. The DOM overlay needs a custom renderer.           |

---

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║    ▄▀█ █▀█ █    █▀█ █▀▀ █▀▀ █▀▀ █▀█ █▀▀ █▄░█ █▀▀ █▀▀              ║
║    █▀█ █▀▀ █    █▀▄ ██▄ █▀░ ██▄ █▀▄ ██▄ █░▀█ █▄▄ ██▄              ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

| Surface                                | Where it lives                       |
| -------------------------------------- | ------------------------------------ |
| Types (`UnlockableDefinition`, …)      | `onboarding-tools` (root)            |
| Pure logic (state, criteria, flow, …)  | `onboarding-tools/core`              |
| React bindings, hooks, components      | `onboarding-tools/react`             |
| In-memory storage for tests            | `onboarding-tools/testing`           |
| Stylesheet                             | `onboarding-tools/styles.css`        |

Key exports from `onboarding-tools/react`:

| Export                                 | Purpose                                      |
| -------------------------------------- | -------------------------------------------- |
| `<UnlockableProvider>`                 | Root provider. Owns state, storage, theme.   |
| `<UnlockableCatalogRegistrar>`         | Registers definitions on mount.              |
| `<UnlockableFlowProvider>`             | Derives the onboarding flow graph.           |
| `<UnlockableFlowRouteGate>`            | Gates a route by stage completion.           |
| `<UnlockableTutorialEngineProvider>`   | Mounts the tutorial overlay engine.          |
| `<Unlockable>`                         | Wraps a component as an unlock target.       |
| `<UnlockableOverlay>`                  | Standalone unlock confirmation overlay.      |
| `useUnlockable(id)`                    | Status + control for a single unlockable.    |
| `useUnlockableCatalog()`               | Serializable catalog (for AI / analytics).   |
| `useUnlockableSignals()`               | Archetypes, signals, flags.                  |
| `useUnlockableEvents()`                | Emit / read domain events.                   |
| `useUnlockableFlow()`                  | Stages, active stage, completion lookup.     |

Full type signatures live in `src/core/types.ts` (shipped as `.d.ts`).

---

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║    █▀█ █▀█ ▄▀█ █▀▄ █▀▄▀█ ▄▀█ █▀█                                  ║
║    █▀▄ █▄█ █▀█ █▄▀ █░▀░█ █▀█ █▀▀                                  ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

- [ ] React Native renderer for the tutorial overlay.
- [ ] Devtools panel: visualise catalog, criteria, decisions live.
- [ ] First-class adapter for TanStack Router and Wouter.
- [ ] Headless overlay primitives so users can ship their own UI.
- [ ] Built-in resolver helpers for OpenAI / Anthropic classification.
- [ ] Storybook with every state and animation pinned.

Have an idea? Open a [discussion](https://github.com/CMolG/onboarding-tools/discussions)
or read [`CONTRIBUTING.md`](./CONTRIBUTING.md).

---

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║    █▀▀ █▀█ █▄░█ ▀█▀ █▀█ █ █▄▄ █░█ ▀█▀ █ █▄░█ █▀▀                  ║
║    █▄▄ █▄█ █░▀█ ░█░ █▀▄ █ █▄█ █▄█ ░█░ █ █░▀█ █▄█                  ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

PRs welcome. Read [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the local
setup, conventions, and release process. Be kind — we follow the
[Contributor Covenant](./CODE_OF_CONDUCT.md).

Security issues: see [`SECURITY.md`](./SECURITY.md).

---

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║    █░░ █ █▀▀ █▀▀ █▄░█ █▀ █▀▀                                      ║
║    █▄▄ █ █▄▄ ██▄ █░▀█ ▄█ ██▄                                      ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

[MIT](./LICENSE) © 2026 Carlos and `onboarding-tools` contributors.

<p align="center"><sub>Built for products that grow with the user, not against them.</sub></p>
