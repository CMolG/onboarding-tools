# Examples

Two minimal apps that demonstrate the same three onboarding patterns on
different stacks:

| Pattern              | What it shows                                                |
| -------------------- | ------------------------------------------------------------ |
| Automatic unlock     | A component that becomes visible as soon as it is registered |
| Manual + event-gated | A component hidden until an event is emitted, then unlocked  |
| Archetype-gated      | A component that only appears for users tagged "power-user"  |

| Example                | Stack                                       | Router adapter           |
| ---------------------- | ------------------------------------------- | ------------------------ |
| [`vite/`](./vite)      | Vite + React 18 + react-router-dom          | `useLocation`/`useNavigate` |
| [`next/`](./next)      | Next.js 14 (App Router) + React 18          | `usePathname`/`useRouter`   |

Each example installs `onboarding-tools` from the **local workspace** via
`file:../..`, so you can run them without publishing. To switch to the
published version, just replace `"file:../.."` with `"^0.1.0"` in the
example's `package.json`.

## Running locally

```bash
# From the repo root, build the package once:
npm install
npm run build

# Then run an example:
cd examples/vite       # or examples/next
npm install
npm run dev
```

> ⚠️ Whenever you change something in `../../src/`, re-run `npm run build`
> in the repo root so the example picks up the new `dist/`.
