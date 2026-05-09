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
- Two runnable example apps under `examples/`: a Vite + react-router-dom
  demo and a Next.js 14 (App Router) demo. Both wire the same three
  onboarding patterns (automatic, event-gated, archetype-gated) so the
  router adapter difference is the only contrast. README links them
  through StackBlitz and CodeSandbox so the demos are runnable in-browser.

## [0.1.0] - 2026-05-09

### Added

- First public release extracted from `job-hunter-vite`.
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
