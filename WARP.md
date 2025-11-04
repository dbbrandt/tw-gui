# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project scope
- This repo is a forked Scratch 3 GUI (React + Redux) with Webpack 5. It builds a UMD library (global `GUI`) and a playground served via webpack-dev-server.
- It is used as a subproject within the sibling TurboWarp workspace. See ../turbowarp/WARP.md and ../turbowarp/turbowarp-addon-settings.json for upstream context and editor addon defaults.

Prerequisites
- Node.js: v20 (enforced by `.nvmrc`). Activate with: `nvm use`.
- Package manager: npm (repo includes `package-lock.json`).

Common commands
- Install deps: `npm ci`
- Start dev server (playground on http://localhost:8601/): `npm start`
- Build playground (to `build/`): `npm run build`
- Build UMD library as well (to `dist/`): `BUILD_MODE=dist npm run build`
- Lint: `npm run test:lint`
- Full test suite (lint + unit + build + integration): `npm test`
- Unit tests only: `npm run test:unit`
  - Watch mode: `npm run test:unit -- --watch`
  - Single test file: `npx jest --runInBand test/unit/<path-to-file>.test.(js|jsx)`
  - Pattern or test name: `npx jest -t "name or pattern"`
- Integration tests (require a prior `npm run build`): `npm run test:integration`
  - Single integration file: `npx jest --runInBand test/integration/<file>.test.js`
  - Run headed (not headless): `USE_HEADLESS=no npx jest --runInBand test/integration/<file>.test.js`
- Static deploy of playground (GitHub Pages): `npm run deploy` (uses `gh-pages` from `build/`)

High-level architecture
- Entry points
  - Library: `src/index.js` builds `dist/scratch-gui.js` (UMD, externals: `react`, `react-dom`).
  - Playground apps: `src/playground/{index.jsx, player.jsx, blocks-only.jsx, compatibility-testing.jsx}` bundled to `build/` and served by webpack-dev-server on port 8601.
- State management
  - Redux-based store with a "project state" finite state machine orchestrating load/show/save flows; see `src/reducers/project-state.js`. Many UI and VM actions gate on this FSM.
- Scratch engine integration
  - Integrates `scratch-vm`, `scratch-render`, `scratch-paint`, `scratch-storage`, `scratch-svg-renderer`, and `scratch-blocks`.
  - Assets and block media are copied into the built app via `copy-webpack-plugin` (see `webpack.config.js`).
- Build system (see `webpack.config.js`)
  - Uses `scratch-webpack-configuration` to assemble a base config targeting browserslist.
  - Outputs UMD library (name `GUI`) and playground bundles; `dist/` is built only in production or when `BUILD_MODE=dist`.
  - Copies Scratch VM worker, blocks media (default and high-contrast), and example extension assets. `HtmlWebpackPlugin` instantiates multiple playground HTML pages.
  - Selected Node polyfills via `resolve.fallback` for browser builds.
- Internationalization
  - Babel plugin `react-intl` extracts messages to `translations/messages/` during builds.
- Testing
  - Jest (v21) + Enzyme for unit tests; headless browser (Chromedriver) for integration tests. Jest config embedded in `package.json`.

Upstream TurboWarp alignment
- Use Node v20 (matches sibling repo). The TurboWarp addon defaults live in `../turbowarp/turbowarp-addon-settings.json` and define editor behavior (enabled/disabled addons, UI tweaks). Keep GUI behavior consistent with those settings when testing UI changes.
- For broader context and desktop app workflows, see `../turbowarp/WARP.md` (Electron-focused). This GUI repo itself is a browser bundle served via webpack-dev-server.

Notes for linking with sibling Scratch repos
- When another repo (e.g., `scratch-www`) must consume a local build, produce a distributable and link it:
  - Build dist: `BUILD_MODE=dist npm run build`
  - From this repo: `npm link`
  - In the consumer repo: `npm link scratch-gui`

Key files
- `package.json`: scripts, Jest config, and dependency graph.
- `webpack.config.js`: dual build (playground and optional `dist/` library), asset pipeline, dev server.
- `src/reducers/project-state.js`: project FSM controlling load/display/save flows.
- `.eslintrc.js` / `.babelrc`: linting and transpilation settings.
