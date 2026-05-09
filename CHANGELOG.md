# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `AGENTS.md` at the repo root and inside the npm tarball: an
  operational guide for AI coding agents covering the install,
  decision tree, criteria DSL, framework recipes, gotchas, and common
  errors.
- Runnable Next.js 16 (App Router) example under `examples/next`. Wires
  the three main onboarding patterns (automatic, event-gated,
  archetype-gated). Ships with a `vercel.json` so this repository can
  be deployed straight to Vercel by pointing at `examples/next` as the
  project root — the example's install script builds the parent
  package before `next build` runs.

### Removed

- The Vite example previously under `examples/vite`. The only
  meaningful difference from the Next.js example was the router
  adapter (~5 lines) and the `'use client'` boundary; both router
  adapter recipes remain documented in the README.

## [0.1.0] - 2026-05-09

### Added

- First public release.
- Core unlock state machine (`HIDDEN` → `ELIGIBLE` → `UNLOCKING` → `UNLOCKED`)
  with persistence, declarative criteria DSL (`event`, `archetype`, `flag`,
  `state`, `unlockable`, `resolver`, plus `all`/`any`/`not` combinators),
  flow derivation with topological ordering and cycle detection, and a
  serializable catalog suitable for AI-driven resolvers.
- React bindings: `UnlockableProvider`, `Unlockable`,
  `UnlockableCatalogRegistrar`, `UnlockableFlowProvider`,
  `UnlockableFlowRouteGate`, `UnlockableTutorialEngineProvider`,
  `UnlockableOverlay`, plus hooks `useUnlockable`, `useUnlockableCatalog`,
  `useUnlockableSignals`, `useUnlockableEvents`, `useUnlockableFlow`.
- Pluggable storage adapter (`UnlockableStorageAdapter`) with a built-in
  `localStorage` default and SSR-safe guards.
- Pluggable router adapter (`OnboardingRouterAdapter`) so consumers can use
  any routing library without forcing a peer dependency.
- Default tutorial overlay with spotlight, fallback positioning, reduced
  motion support, and CSS custom properties for theming.
- `testing` subpath with `createMemoryStorage` for unit tests.

[Unreleased]: https://github.com/CMolG/onboarding-tools/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/CMolG/onboarding-tools/releases/tag/v0.1.0
