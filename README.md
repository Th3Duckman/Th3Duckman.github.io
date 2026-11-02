# Achilleas Botsidis — Portfolio

A red-and-black, backend-focused portfolio built with HTML, CSS, and JavaScript. No framework, package installation, API keys, or runtime CDN requests are required. Fonts are bundled locally with their licenses.

## Develop

Use Node.js 22 or newer, then run from this checkout:

```sh
npm run dev
```

The development server listens on port 3000. Override with `npm run dev -- --port 4000`. Use the existing isolated checkout; a separate worktree is not needed.

```sh
npm test
npm run build
```

`dist/` contains the complete static production site. The repository root can also be served directly by GitHub Pages, with `.nojekyll` included. No deployment or Pages setting changes are performed by these commands.

## Features

- Responsive layouts, mobile navigation, section tracking, and scroll progress.
- Locally rendered, draggable particle sphere/cube with pause and reduced-motion support. Rendering pauses when offscreen or the tab is hidden.
- Searchable command menu (`Ctrl+K` / `⌘K`) with arrow-key navigation.
- Portfolio terminal with command history; type `help` to explore. This is not a real shell.
- Guardian project details and a clearly labelled five-second browser simulation. Interval validation mirrors a positive C# `int`; completed **demo** rounds are saved locally when storage is available. This does not run C#, send notifications, or represent actual Guardian progress.
- Email copy with graceful fallback; real GitHub and LinkedIn links; downloadable public CV.
- Native modal focus management, Escape to close, skip link, accessible controls, and keyboard navigation.

## Content

The bio, education, experience, and Guardian description are based on the supplied CV. Java/backend prominence follows the owner's requested positioning. No employment dates or proficiency scores are invented. Basic Converter was confirmed in the public GitHub README.

The public PDF is a portfolio edition of the CV, with the phone number omitted. Update `assets/Achilleas_Botsidis_CV.pdf` to change it. Contact information appears in `index.html` and `logic.js`.

## Research and design references

Research informed common interaction patterns; the layout, styling, geometry renderer, menu, and terminal are original implementations. No source code or visual assets from the reference projects are used.

- [Brittany Chiang v4](https://github.com/bchiang7/v4): project-led information architecture, numbered navigation, and respecting reduced-motion preferences. Reviewed README and navigation implementation.
- [cmdk](https://github.com/pacocoursey/cmdk): searchable command menus, keyboard shortcuts, empty results, and arrow-key selection. Reviewed component documentation; this site uses its own dependency-free implementation.
- [Guardian](https://github.com/Th3Duckman/AFK-Guardian) and [Basic Converter](https://github.com/Th3Duckman/Basic-Converter): verified public project identities and README descriptions.

## Browser verification

`tests/browser_test.py` uses Python Playwright and an installed Chromium for functional checks and desktop/mobile screenshots. These are test-only environment tools, not website dependencies.

```sh
python3 tests/browser_test.py
```

Run the development server first. Screenshots are saved outside the checkout in `/tmp/portfolio-checks/`.

For a focused audit of every terminal command, error handling, history, keyboard focus, and the Guardian transition:

```sh
python3 tests/terminal_test.py
```

Set `PORTFOLIO_URL` to audit a published version instead of the local server.

## GitHub Pages

The production files are ready to publish from the `main` branch, folder `/ (root)`. In the repository's **Settings → Pages**, use **Deploy from a branch**, select `main` and `/ (root)`, and save. The user-site address is `https://th3duckman.github.io/`. Publishing can take several minutes. `.nojekyll` keeps this plain static site out of the Jekyll build process.
