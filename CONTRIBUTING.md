# Contributing to onboarding-tools

Thanks for your interest in improving onboarding-tools. This document explains
how to set up the project, the conventions we follow, and how to send a change
upstream.

## Code of Conduct

By participating in this project you agree to abide by the
[Code of Conduct](./CODE_OF_CONDUCT.md). Report unacceptable behaviour to the
maintainers at the email listed in `package.json`.

## Project layout

```
src/
  core/        Pure-TS unlock state machine, criteria DSL, flow derivation,
               catalog serialization, effects helpers. Zero React imports.
  react/       React bindings: providers, hooks, the <Unlockable> component,
               the overlay, and the tutorial engine.
  testing/     In-memory storage adapter for unit tests.
  styles.css   Default visual tokens and animations.
tests/         Vitest test suites mirroring src/.
dist/          Build output (generated, not committed).
```

The package exposes three subpaths: `onboarding-tools` (re-exports core),
`onboarding-tools/core`, `onboarding-tools/react`, `onboarding-tools/testing`.

## Local setup

```bash
git clone https://github.com/<owner>/onboarding-tools.git
cd onboarding-tools
npm install
```

Common scripts:

| Script              | What it does                                             |
| ------------------- | -------------------------------------------------------- |
| `npm run typecheck` | Strict TypeScript check across `src/` and `tests/`.      |
| `npm test`          | Run the Vitest suite headlessly (`jsdom`).               |
| `npm run build`     | Produce ESM bundle, `.d.ts` files, and copy `styles.css` |

All three must pass before we merge a change.

## Conventions

- **Zero runtime dependencies.** Anything new must keep `dependencies` empty
  in `package.json`. React is the only peer dependency, and it must remain
  optional. If you need browser APIs, guard them (`typeof window !== 'undefined'`).
- **No framework lock-in.** Do not import from `react-router`, `next/*`,
  Vite-only globals (`import.meta.env`), etc. Use the existing adapter
  pattern (see `OnboardingRouterAdapter`, `UnlockableStorageAdapter`).
- **Strict TS.** No `any`. Public types belong in `src/core/types.ts`.
- **Tests next to behaviour.** New code ships with Vitest coverage. UI changes
  go through `@testing-library/react`.
- **CSS tokens.** Style tweaks override existing `--ot-*` custom properties
  in `src/styles.css`. Do not add hard-coded colours or sizes in TSX.

## Pull request checklist

1. Create a feature branch from `main`.
2. Run `npm run typecheck && npm test` locally.
3. Add or update tests for any user-visible change.
4. Update `CHANGELOG.md` under the `## [Unreleased]` heading using the
   [Keep a Changelog](https://keepachangelog.com/) format.
5. Open a PR with a clear description: what changed, why, and any
   migration notes for consumers.

## Reporting bugs

Please include:

- The version of `onboarding-tools` you are using.
- React version and host framework (Vite, Next.js, etc.).
- A minimal reproduction (CodeSandbox / StackBlitz / repo).
- Expected vs. actual behaviour.

## Releasing (maintainers only)

1. Make sure `main` is green.
2. Bump version in `package.json` (semver).
3. Move `## [Unreleased]` entries to a new dated section in `CHANGELOG.md`.
4. `npm run build` to verify the bundle.
5. `npm publish --access public` (requires npm 2FA).
6. Tag the release: `git tag v<version> && git push --tags`.
