# Examples

A single Next.js (App Router) demo that exercises the three main
onboarding-tools patterns:

| Pattern              | What it shows                                                |
| -------------------- | ------------------------------------------------------------ |
| Automatic unlock     | A component that becomes visible as soon as it is registered |
| Manual + event-gated | A component hidden until an event is emitted, then unlocked  |
| Archetype-gated      | A component that only appears for users tagged "power-user"  |

The example installs `onboarding-tools` from the **local workspace** via
`file:../..` and runs the package's build via the `prebuild` / `predev`
hooks, so the example is always in sync with the latest source.

To switch to the published version once `onboarding-tools` is on npm,
replace `"file:../.."` with `"^0.1.0"` (or the latest version) in
`examples/next/package.json`, and remove the `prebuild` / `predev`
scripts.

## Running locally

```bash
# From the example folder:
cd examples/next
npm install
npm run dev
```

The `predev` script makes sure the parent package's `dist/` is fresh.

## Deploying to Vercel

The example ships with a `vercel.json` that builds the parent package
before the Next.js app, so this repository can be deployed straight to
Vercel without any extra configuration.

1. In Vercel, **New Project** → Import this repository.
2. Set **Root Directory** to `examples/next`.
3. Leave Framework, Build, Output, and Install commands as detected —
   `vercel.json` overrides them with the right values.

The deployed URL is publishable as a live demo.
