# onboarding-tools · Next.js example

A minimal Next.js 16 (App Router) demo that wires three onboarding
patterns:

| Unlockable    | Activation | Gating                             |
| ------------- | ---------- | ---------------------------------- |
| `profile`     | automatic  | none — eligible immediately        |
| `dashboard`   | manual     | event `profile.completed`          |
| `advanced`    | automatic  | archetype `power-user`             |

## Run it locally

```bash
# From this folder:
npm install
npm run dev
```

Open <http://localhost:3000>.

The `predev` script makes sure the parent package's `dist/` is built
first, so changes to `../../src/` flow into the demo as soon as you
restart the dev server.

## Deploy this repo to Vercel

`vercel.json` in this folder takes care of building the parent
`onboarding-tools` package before `next build`, so deployment is one
click:

1. **New Project** in Vercel → Import the GitHub repository.
2. Set **Root Directory** to `examples/next`.
3. Keep the auto-detected Framework (Next.js). The `vercel.json`
   overrides the install and build commands so they reach into the
   parent and build the package first.
4. Deploy. The resulting URL is a public live demo of the package.

### What to try

1. The home page shows three cards. Two are replaced by a "hidden" stub
   because their criteria are not met yet.
2. Open `/profile` and click **Mark profile as complete** (or the same
   button in the toolbar). The dashboard becomes `ELIGIBLE`, the manual
   unlock overlay appears, and the tutorial engine narrates it.
3. Click **Become power-user**. The advanced card materialises with the
   reveal animation.
4. Reload the page. State persists via `localStorage` — unlocked items
   stay unlocked.

## Files of interest

| File                            | What it shows                                       |
| ------------------------------- | --------------------------------------------------- |
| `app/unlockables.ts`            | The three definitions and their criteria.           |
| `app/routerAdapter.ts`          | Next App Router → `OnboardingRouterAdapter`.        |
| `app/Providers.tsx`             | `'use client'` wrapper that mounts the providers.   |
| `app/Shell.tsx`                 | Navigation + dev toolbar, also `'use client'`.      |
| `app/layout.tsx`                | Server Component root that loads `styles.css`.      |
| `app/{profile,dashboard,advanced}/page.tsx` | Per-route components reading status.    |
| `vercel.json`                   | Build commands so Vercel builds the parent first.   |

## Why everything is `'use client'`

`onboarding-tools/react` ships hooks that need React state, events,
and `localStorage`. The provider tree therefore lives in client
components. `app/layout.tsx` itself is a Server Component — it just
loads the stylesheet and renders `<Providers>` (a client component) so
the rest of the tree opts in automatically.

## Switching to the published version

Once `onboarding-tools` is on npm, in `package.json`:

- Replace `"onboarding-tools": "file:../.."` with `"^0.1.0"` (or the
  latest version).
- Remove the `prebuild` / `predev` scripts.
- Remove the `installCommand` from `vercel.json` (the default
  `npm install` will work).
