# onboarding-tools · Vite example

A minimal Vite + React 18 + react-router-dom app that wires three
onboarding patterns:

| Unlockable    | Activation | Gating                             |
| ------------- | ---------- | ---------------------------------- |
| `profile`     | automatic  | none — eligible immediately        |
| `dashboard`   | manual     | event `profile.completed`          |
| `advanced`    | automatic  | archetype `power-user`             |

## Run it

```bash
# Build the package once from the repo root:
cd ../..
npm install && npm run build

# Then start the example:
cd examples/vite
npm install
npm run dev
```

Open <http://localhost:5173>.

### What to try

1. The home page shows three cards. The dashboard and advanced cards are
   replaced by a "hidden" stub because their criteria are not met.
2. Click **Emit profile.completed** in the toolbar (or open `/profile`
   and click the button there). The dashboard becomes `ELIGIBLE`, the
   manual unlock overlay appears, and the tutorial engine narrates it.
3. Click **Become power-user**. The advanced card materialises with the
   reveal animation.
4. Reload the page. State persists via `localStorage` — unlocked items
   stay unlocked.

## Files of interest

| File                            | What it shows                                       |
| ------------------------------- | --------------------------------------------------- |
| `src/unlockables.ts`            | The three definitions and their criteria.           |
| `src/routerAdapter.ts`          | `react-router-dom` → `OnboardingRouterAdapter`.     |
| `src/App.tsx`                   | Provider tree + dev toolbar with events/archetypes. |
| `src/pages/*.tsx`               | Per-route components reading the unlock status.     |
| `src/styles.css`                | Light theme override via `--ot-color-*` tokens.     |

## Switching to the published version

Replace `"onboarding-tools": "file:../.."` with `"^0.1.0"` (or the latest
version) in `package.json`, then `npm install`.
