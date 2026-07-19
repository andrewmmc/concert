# AGENTS.md

## Project overview

This repository contains an interactive 3D seating-plan viewer for Hong Kong
concert venues. It uses Svelte 5, Vite, Three.js, and native JavaScript ES
modules. Keep changes focused and preserve the existing lightweight setup.

## Important paths

- `src/App.svelte` — application UI and interaction state
- `src/scene.js` — shared Three.js scene and geometry helpers
- `src/lib/router.js` — hash-based routing
- `src/venues/` — venue metadata and 3D model builders
- `test/` — unit tests using Node.js's built-in test runner
- `.github/workflows/` — GitHub Actions workflows

## Development commands

```bash
npm install       # install dependencies for local development
npm run dev       # start the Vite development server
npm test          # run all unit tests with node --test
npm run build     # create the production build
npm run preview   # serve the production build locally
```

Use `npm ci` rather than `npm install` in CI.

## Coding conventions

- Use JavaScript ES modules and preserve the repository's semicolon style.
- Follow existing Svelte 5 rune patterns in components.
- Keep reusable Three.js geometry and scene behavior in `src/scene.js`.
- Keep venue-specific dimensions, seat rules, labels, and model construction in
  the relevant module under `src/venues/`.
- Register new venues in `src/venues/index.js`.
- Preserve the route format `#/<venue>/<layout>`.
- Avoid introducing a framework, dependency, or abstraction when the native
  platform or an existing project helper is sufficient.
- Do not edit generated files under `dist/` directly.

## Testing expectations

- Add or update tests for behavior changes and bug fixes.
- Use `node:test` and `node:assert/strict`; do not add another test runner.
- Put tests in `test/` and name them `*.test.js`.
- Keep geometry and seat-plan tests deterministic; do not require WebGL, a
  browser, network access, or external venue documents.
- Mock the smallest required browser globals when testing browser-oriented
  modules such as the hash router.
- For seat-plan changes, cover relevant boundaries, wheelchair-platform rules,
  and aggregate totals where applicable.
- Do not use computer-use tools or the CUA driver for end-to-end testing unless
  the user explicitly asks for it.
- Run the unit tests after changes to ensure they are correct.

## Git workflow

- Always commit completed changes.

## Verification

Run the narrowest relevant check while iterating. Before completing changes
that affect application behavior, run:

```bash
npm test
npm run build
```

The production build currently reports a bundle-size advisory; do not treat
that existing warning as a build failure.
