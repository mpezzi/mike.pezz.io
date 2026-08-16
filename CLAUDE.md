# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

pnpm only (`packageManager` is pinned; lockfile is pnpm).

```sh
pnpm dev          # dev server (react-router dev)
pnpm test         # full vitest suite
pnpm exec vitest run app/shell/vfs.test.ts   # single test file
pnpm test:watch   # watch mode
pnpm lint         # eslint (type-checked rules; slow-ish)
pnpm typecheck    # react-router typegen + tsc
pnpm build        # prerender all routes + scripts/postbuild.ts (404.html, sitemap)
pnpm preview      # serve build/client (note: serves SPA fallback for nested paths;
                  # inspect build/client/<route>/index.html for real prerender output)
pnpm coverage     # enforces 90% thresholds on app/shell/** and app/themes/**
```

CI (`.github/workflows/ci.yml`) runs lint → typecheck → test → build, then deploys `build/client` to GitHub Pages on push to main. Commits follow Conventional Commits.

`.agents/skills/react-router/` holds the React Router v8 framework-mode reference docs shipped by the template — consult for router/prerender API questions.

## Architecture

The site is a terminal UI rendered three ways from **one content model**. Understanding this seam is the key to the whole codebase:

```
routes (app/routes/*) ──build──► ScreenModel (app/screen/model.ts — plain data)
    ├─► <DomScreen>  semantic JSX — the prerendered HTML, SEO, screen readers,
    │                and the visible UI in "css"/"off" effects modes
    └─► CrtEngine    character-cell grid → WebGL shader — "webgl" mode
shell commands ──► OutputBlock[] (app/shell/types.ts) ──► both renderers
                   (canvas side via app/screen/output-to-screen.ts)
```

Routes build a `ScreenModel` (helpers in `app/screen/pages.ts`), register it via `useRegisterModel()` so the canvas can render it, and return `<DomScreen>`. In webgl mode `TerminalFrame` mounts `CrtCanvas` and visually clips the DOM tree (never `display:none` — screen readers and the real prompt `<input>` must stay live; the engine mirrors the input's value/caret).

### Pure layers (no React/DOM imports — unit-test these directly)

- **`app/shell/`** — simulated shell. Every command is `(args, vfs, env) → CommandResult` returning output blocks, an env patch, and effects (`navigate`, `setTheme`, `setCrtParam`, …). `app/hooks/useShell.tsx` is the only place effects touch React/router. **The URL is the source of truth for `cwd`** — `cd` emits a navigate effect and router changes sync cwd back. `registry.ts` builds help/man from command metadata (note the lazy-registry pattern for `makeHelp`/`makeMan`). Fixtures for tests: `app/shell/test-fixtures.ts`.
- **`app/effects/params.ts`** — **single source of truth for the barrel-warp math.** `MAX_WARP` and the forward/inverse warp here must stay identical to `barrelWarp()` in `composite.frag.glsl`; mouse hit-testing (`app/engine/hit-test.ts`) uses the *forward* warp because the shader samples `scene[forwardWarp(screenUv)]`. A property test guards `inverse(forward(p)) ≈ p`.
- **`app/effects/settings-store.ts`** — CRT param resolution layers: `DEFAULT_PARAMS ← theme.effectDefaults ← preset ← user overrides` (localStorage `pezz.crt`).
- **`app/engine/`** — `ScreenBuffer` (typed-array cells + dirty-row damage) → `Layout` (ScreenNodes → cells, registers link regions) → glyph-atlas 2D canvas → WebGL2 pipeline (bright-pass → separable blur at ¼ res → composite). Frame loop: scene/bloom rerun only on damage; composite runs per-rAF in animated mode, on-demand in static mode (reduced motion). `effects-mode.ts` is the fallback ladder: webgl → css → off.

### Content pipeline

MDX files in `app/content/{blog,work}/` are the single source per post: compiled MDX renders in DomScreen; the same file's raw text (via a second `?raw` glob) feeds `cat`/`grep` and the canvas renderer (`mdx-to-screen.ts`). Frontmatter is zod-validated **at module init** — a bad file fails build and tests (`collections.test.ts` is the content gate). Slug = filename, which derives the route (`/blog/<slug>`), the VFS path (`~/blog/<slug>.md`), and the prerender list. `app/content/slugs.ts` re-derives slugs with `fs.readdir` because `react-router.config.ts`'s `prerender()` runs in Node where `import.meta.glob` doesn't exist — it also skips `draft: true` files, matching the PROD filter in `collections.ts`.

`config/mdx-plugin.ts` wraps `@mdx-js/rollup`: it must run `enforce: "pre"` (before the react-router/react plugins) but skip any id containing `?` so `*.mdx?raw` imports fall through to Vite's raw handling. Shared by `vite.config.ts` and `vitest.config.ts`.

### Theming

`app/themes/themes.ts` defines all palettes + per-theme CRT effect defaults and phosphor tint. DOM mode reads CSS custom properties applied at runtime (`css.ts`); the engine imports theme objects directly. `themeNoFlashScript()` is inlined into `<head>` in `root.tsx` so prerendered pages paint with the stored theme. Light/dark toggle switches within a theme `family`, else falls to `DEFAULT_LIGHT_THEME`/`DEFAULT_DARK_THEME`.

### Keyboard model

`TerminalFrame` has a global bubble-phase keydown: printable keys focus the prompt ("type anywhere"). Page-specific keyboard handling (e.g. `/settings` vim-style j/k/h/l over params → mode row → theme menu) registers **capture-phase** window listeners that `stopPropagation()` for handled keys and always step aside when focus is in a text input. Follow this pattern for any new page-level shortcuts or they'll fight the prompt.

## Invariants / gotchas

- Changing warp math: update `params.ts` **and** `composite.frag.glsl` together; run `app/effects/params.test.ts` and `app/engine/hit-test.test.ts`.
- Scanline frequency in the shader derives from `uRows`, not pixels (aliases at odd DPRs otherwise).
- Glyph atlas bakes after `document.fonts.ready`; fonts are self-hosted in `public/fonts/`.
- jsdom tests: `app/test/setup.ts` stubs `canvas.getContext` (→ null, so effects mode resolves to "css") and `matchMedia`; RTL cleanup is manual there. Component tests wrap in the full provider stack via `renderWithApp` (`app/test/utils.tsx`).
- `exactOptionalPropertyTypes` is on: build optional-prop objects conditionally (`...(x !== undefined ? { x } : {})`) rather than passing `undefined`.
- Drag-to-select text is intentionally unavailable in webgl mode; `effects off` is the escape hatch — don't "fix" this by removing the canvas.
- README.md contains the manual visual checklist (theme × mode matrix, mobile, reduced-motion, WebGL-disabled fallback) — run it for changes touching the engine, shaders, or themes; screenshots via headless Chrome work for the DOM tiers, but the webgl tier needs a real browser or a long-running headless session.
