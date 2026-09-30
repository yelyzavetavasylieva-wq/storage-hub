# Storage Hub — frontend & development languages

A single reference for **every language and frontend technology used in Storage Hub**
(`storage-hub/`), and **where** each one lives.

Storage Hub is a **standalone, self-contained prototype** on the `myWorkDrive-React` stack — Tailwind
v4 + React Aria Components — with that app's design system vendored in under `storage-hub/vendor/`. It
imports nothing from the rest of the repo. (For its architecture, see
[`storage-hub-architecture.md`](./storage-hub-architecture.md).)

> **This is a visual/UX reference prototype, not production code.** The internal architecture, folder
> structure, and code patterns aren't the point — the one thing that matters is that it **looks and
> feels like myWorkDrive**. The stack and language choices below were made to get that visual match with
> the least friction. **The one binding rule:** every on-screen value must already be a design-system
> token class (`bg-primary`, `text-text-sm`, `rounded-lg`, …) — never a raw hex, never an off-scale
> pixel value, never `bg-[var(--…)]`. The rest (this file included) is reference, not law.

Everything below is organized first **by language**, then **by frontend stack**, then a quick
**file-type → language** map.

---

## 1. Languages

### JavaScript (ES modules, JSX)
The primary language. `package.json` sets `"type": "module"`, so **all `.js` is ESM**
(`import`/`export`, no `require`).

| Extension | Role | Where |
|---|---|---|
| `.jsx` | React components (JS + JSX syntax) | The screens (`StorageHubPage`, `ProviderPage`, `ConnectionDetails`, `AddConnectionWizard`), `App`, `TopBar`, `Shell`, `StorageContext`, `main`; the vendored icons/logos/flags (`vendor/fluent/*`, `vendor/icons.jsx`, `vendor/logos.jsx`, `vendor/Flags.jsx`) |
| `.js` | Plain ES modules — data + build config | `storage-hub/data.js` (sample data), `storage-hub/vite.config.js` |

- **JSX** is React's HTML-in-JS syntax; compiled to `React.createElement` by esbuild via
  `@vitejs/plugin-react`.
- **The React Compiler is enabled** (`babel-plugin-react-compiler`, via `reactCompilerPreset({ target: '19' })`) —
  screens carry **no** manual `useMemo`/`useCallback`/`memo`; the compiler auto-memoizes.

### TypeScript (TSX / TS)
Used **only inside `storage-hub/vendor/`** — the design system copied verbatim from `myWorkDrive-React`.

| Extension | Role | Where |
|---|---|---|
| `.tsx` | Typed React components (11 files) | `storage-hub/vendor/components/ui/*` — `button`, `badge`, `checkbox`, `text-field`, `select`, `menu`, `dialog`, `toast`, `drawer`, `tabs`, `switch` |
| `.ts` | Typed helpers (2 files) | `storage-hub/vendor/lib/cn.ts`, `storage-hub/vendor/lib/pointerType.ts` |

- **No `tsc` typecheck and no `tsconfig.json`.** Vite/esbuild **strips the types** at transform time, so
  the `.jsx` screens import these `.tsx` components with zero TS setup. Types aid authoring/editors; they
  are not enforced at build.

### CSS — Tailwind CSS v4
One stylesheet, **CSS-first, no `tailwind.config`**: `storage-hub/vendor/styles/globals.css`.

- `@import "tailwindcss"` + an `@theme` token block (type scale `text-text-*`/`text-display-*`, color
  ramps, shadows, the `ring-brand` focus halo) + an `@utility` semantic layer (`bg-primary`,
  `text-secondary`, `fg-quaternary`, …).
- Screens style with Tailwind utility classes; `tailwind-merge` + `clsx` (via `vendor/lib/cn.ts`)
  compose them. No plain-CSS `.sh-*` classes exist.

### HTML
- `storage-hub/index.html` — the Vite entry document: a minimal shell (`<div id="root">` + the module
  script). All markup thereafter is produced by React.

### SVG
- `storage-hub/vendor/assets/icons/*.svg` (~50 files) — vector icons the vendored components import as
  React components via `vite-plugin-svgr`'s `?react` query. (The larger Fluent icon set the screens use
  is authored as `.jsx` components in `vendor/fluent/`, not raw SVG.)

### Supporting: config, scripts, docs
| Language | Where / purpose |
|---|---|
| **JSON** | `package.json` (deps/scripts) and `.oxlintrc.json` (linter) at the repo root govern Storage Hub |
| **PowerShell** | `.claude/run-storage-hub.ps1` — dev-server launch helper (Windows) |
| **Markdown** | this file and the rest of `docs/` |

---

## 2. Frontend stack

- **React 19** + **React Router 7** + **React Compiler**
- **Tailwind CSS v4** (`@tailwindcss/vite`) for styling
- **React Aria Components** — the accessible primitive foundation the vendored `components/ui` library is
  built on
- **`sonner`** toasts; **`class-variance-authority`** + **`clsx`** + **`tailwind-merge`** for component variants/classes
- **`vite-plugin-svgr`** for `*.svg?react` imports
- In-memory state via React Context (`storage-hub/StorageContext.jsx`)

---

## 3. Build & tooling

- **Package manager:** npm. **Module system:** ESM (`"type": "module"`). **Node:** 20+ (CI uses Node 24).
- **Bundler / dev server:** **Vite 8** — `storage-hub/vite.config.js`. React/JSX/TSX transform via
  `@vitejs/plugin-react` (esbuild); React Compiler wired through its babel preset; `@` alias →
  `storage-hub/vendor`; `resolve.dedupe` for React.
- **Run:** `npm run storage-hub` → http://localhost:5200. **Build:** `npm run build-storage-hub`.
- **Linter:** **oxlint** (`npm run lint`, config `.oxlintrc.json`) — `react` rules plus a **`jsx-a11y`**
  override scoped to `storage-hub/**/*.jsx` (the vendored library is ignored). No ESLint, no Prettier.
- **Type checking:** none (TypeScript is type-stripped, not verified). **Tests:** none.

---

## 4. File-type → language → where (quick map)

| Ext | Language | Location in `storage-hub/` |
|---|---|---|
| `.jsx` | JavaScript + JSX | screens + `App`/`TopBar`/`Shell`/`StorageContext`/`main`; `vendor/fluent/`, `vendor/icons.jsx`, `vendor/logos.jsx`, `vendor/Flags.jsx` |
| `.js` | JavaScript (ESM) | `data.js`, `vite.config.js` |
| `.tsx` | TypeScript + JSX | `vendor/components/ui/*` |
| `.ts` | TypeScript | `vendor/lib/cn.ts`, `vendor/lib/pointerType.ts` |
| `.css` | CSS (Tailwind v4) | `vendor/styles/globals.css` |
| `.html` | HTML | `index.html` |
| `.svg` | SVG | `vendor/assets/icons/*` |

---

## 5. Conventions

- **JavaScript/JSX:** ESM only; function components. Screens rely on the React Compiler — **don't**
  hand-add `useMemo`/`useCallback`/`memo`.
- **TypeScript:** confined to `vendor/`. When a component genuinely doesn't exist yet, author it there as
  `.tsx` the same way the library does (React Aria + `cn` + tokens). Screens stay `.jsx`.
- **CSS:** Tailwind token utilities only (`bg-primary`, `text-text-sm`, `ring-brand`) — never a raw
  hex/px, never `bg-[var(--…)]`. Reuse a `vendor/components/ui` component before writing markup.
