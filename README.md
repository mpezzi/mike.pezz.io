# mike.pezz.io

Personal website of Mike Pezzi — a portfolio that behaves like a unix
terminal and looks like a CRT monitor.

Pages are directories, posts are files, and the prompt at the bottom is a
real (simulated) shell: `cd blog`, `cat contact.txt`, `theme ls`,
`crt set curvature 0.8`, tab completion, history, man pages, and a few
easter eggs.

## Stack

- **React 19** + **React Router 8** framework mode (`ssr: false` +
  `prerender`) — every route ships as static HTML, then hydrates as a SPA
- **TypeScript** strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- **MDX** content in `app/content/` with zod-validated frontmatter
- **Raw WebGL2** CRT pipeline — no three.js
- **Vitest** + React Testing Library, **ESLint** (typescript-eslint,
  react-hooks, jsx-a11y), **Prettier**
- **pnpm**, GitHub Actions → GitHub Pages

## Architecture

One renderer-agnostic content model, three rendering tiers:

```
routes ──► ScreenModel (plain data) ──► DomScreen (semantic JSX)   ← SEO, a11y, "off"/"css" modes
                                    └─► CrtEngine (cell grid)      ← "webgl" mode
shell commands ──► OutputBlock[] ──► both renderers
```

- `app/shell/` — pure TS shell: VFS, tokenizer, command registry,
  completion, history. Commands are `(args, vfs, env) → CommandResult`
  returning data + effects (`navigate`, `setTheme`, …) that React
  interprets. The URL is the source of truth for `cwd`.
- `app/engine/` — character-cell buffer → glyph-atlas 2D canvas → WebGL2
  texture → bright-pass/blur (bloom) → composite shader (barrel curvature,
  chromatic aberration, scanlines, VHS noise, vignette, flicker, phosphor
  tint). Mouse hit-testing runs the same warp math as the shader
  (`app/effects/params.ts` is the single source for both).
- `app/effects/settings-store.ts` — CRT parameters resolve as
  defaults ← theme ← preset ← user overrides; persisted in localStorage;
  driven by both the `crt` command and the `/settings` sliders.
- Accessibility: the semantic DOM stays mounted (visually clipped) in
  WebGL mode with the real prompt input focused, so screen readers,
  keyboard nav, and the mobile keyboard all work. `prefers-reduced-motion`
  silences noise/flicker. `effects off` gives plain selectable text —
  text selection by mouse is the one thing the shader mode gives up.

## Develop

```sh
pnpm install
pnpm dev        # dev server
pnpm test       # unit + component tests
pnpm lint       # eslint
pnpm typecheck  # react-router typegen + tsc
pnpm build      # static build + 404.html + sitemap
pnpm preview    # serve build/client
```

## Manual visual checklist (before release)

Things unit tests can't see — check in a real browser (`pnpm preview`):

- [ ] Each theme × each mode (webgl / css / off) renders legibly
- [ ] `crt set curvature 1` — clicks still land on links (warped hit-testing)
- [ ] Wheel scrolling in webgl mode; long posts reachable
- [ ] Mobile viewport: tap prompt summons keyboard, grid rescales
- [ ] DevTools → disable WebGL → falls back to css mode
- [ ] OS reduced-motion: noise/flicker/blink stop everywhere
- [ ] Keyboard-only pass: tab order, menus, prompt, settings sliders

## Deploy

Push to `main` → CI (lint → typecheck → test → build) → GitHub Pages with
the `mike.pezz.io` CNAME. Set Pages source to "GitHub Actions" in repo
settings and point DNS at GitHub Pages.
