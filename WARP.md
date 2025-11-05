# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project scope
- TurboWarp fork of the Scratch 3 GUI (React + Redux) built with Webpack 4. Produces:
  - A UMD library exposed as global `GUI` at `dist/scratch-gui.js` when `BUILD_MODE=dist` (or in production).
  - A playground served by `webpack-dev-server` for local development.

Prerequisites
- Node.js: v16 (see `.nvmrc`). Activate with: `nvm use`.
- Package manager: npm (repo includes `package-lock.json`).

Common commands
- Install deps: `npm ci`
- Start dev server (http://localhost:8601): `npm start`
  - Pages: `/editor.html`, `/index.html` (player), `/fullscreen.html`, `/embed.html`, `/addons.html`, `/credits.html`.
- Build playground (to `build/`): `npm run build`
- Build UMD library (to `dist/`): `BUILD_MODE=dist npm run build`
- Lint: `npm run test:lint`
- Tests:
  - Full suite (lint + unit + build + integration): `npm test`
  - Unit only: `npm run test:unit`
    - Watch: `npm run test:unit -- --watch`
    - Single file: `npx jest --runInBand test/unit/<path>.test.(js|jsx)`
    - Pattern/name: `npx jest -t "name or pattern"`
  - Integration (requires prior build): `npm run test:integration`
    - Single: `npx jest --runInBand test/integration/<file>.test.js`
    - Headed: `USE_HEADLESS=no npx jest --runInBand test/integration/<file>.test.js`
- Deploy playground (GitHub Pages from `build/`): `npm run deploy`

High-level architecture
- Entry points
  - Library: `src/index.js` -> `dist/scratch-gui.js` (UMD; externals: `react`, `react-dom`).
  - Playground: `src/playground/{editor.jsx, player.jsx, fullscreen.jsx, embed.jsx, addon-settings.jsx, credits/credits.jsx}` -> `build/`.
- State management
  - Redux store with project FSM at `src/reducers/project-state.js` controlling load/display/save flows.
- Engine integration
  - Uses TurboWarp forks of `scratch-vm`, `scratch-render`, `scratch-paint`, `scratch-storage`, `scratch-svg-renderer`, and `scratch-blocks`.
  - Blocks media (default and high-contrast) and static assets are copied via `copy-webpack-plugin` (see `webpack.config.js`).
- Build system (see `webpack.config.js`)
  - Webpack 4 config maintained in-repo (no `scratch-webpack-configuration`).
  - Dev server serves `build/` with history rewrites; chunk splitting enabled; cache busting via `CACHE_EPOCH`.
  - Library build (when `BUILD_MODE=dist` or production) outputs UMD to `dist/` with `libraryTarget: 'umd'` and `publicPath` derived from `STATIC_PATH`.
  - Library build copies the VM extension worker and selected library JSON for desktop usage.
  - Multiple HTML pages generated with `HtmlWebpackPlugin`.
- Internationalization
  - `react-intl` Babel plugin extracts messages to `translations/messages/`.
- Testing
  - Jest + Enzyme for unit tests; Selenium/WebDriver (Chromedriver) for integration tests. Jest config is in `package.json`.

Using tw-gui with TurboWarp
- Local development (linking options):
  1) `npm link` workflow
     - In this repo: `BUILD_MODE=dist npm run build` (or `BUILD_MODE=dist npm run watch`), then `npm link`.
     - In the sibling `turbowarp` repo: `npm link scratch-gui`, then run/rebuild TurboWarp per its docs.
  2) file: dependency
     - In the sibling `turbowarp` repo `package.json`, set "scratch-gui": "file:../tw-gui" and reinstall.
- Production release integration
  - Run `BUILD_MODE=dist npm run build` to produce `dist/` for consumption by TurboWarp/Desktop.
  - Set `STATIC_PATH` appropriately when embedding so asset URLs resolve correctly (`publicPath` is derived from it).
  - The dist build includes the VM extension worker and library JSON used by desktop packaging.

Upstream TurboWarp alignment
- Keep GUI behavior consistent with TurboWarp addon defaults and configuration; addon UI lives at `src/playground/addon-settings.jsx`.
- Refer to the sibling TurboWarp repo docs for full desktop packaging workflows.

Key files
- `package.json`: scripts, Jest config, and dependencies.
- `webpack.config.js`: dev server + library build, asset pipeline.
- `src/reducers/project-state.js`: project FSM.
- `src/lib/brand.js`: branding for page titles.
- `.eslintrc.js` / Babel config: linting and transpilation.
