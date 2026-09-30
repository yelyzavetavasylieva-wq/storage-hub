# Storage Hub — architecture

Storage Hub is a **standalone, self-contained prototype** living in `storage-hub/` inside the
`myworkdrive-admin` repo. It is a storage-provider catalog plus a per-provider connections manager —
a **different surface** from the admin app (no admin sidebar) and sharing **no code** with the admin
app's `src/`.

It runs on the **real `myWorkDrive-React` stack** — Tailwind CSS v4 + React Aria Components — with that
app's design system vendored in. This document describes the current architecture; it is not a change log.

> **What this is — and the one rule.** This is a **visual/UX reference prototype**, not production code:
> it won't be reused as-is, and its internal architecture, folder structure, and code patterns aren't
> the point. The one thing that matters is that it **looks and feels like myWorkDrive**. Everything
> below documents how it happens to be built to get that match with the least friction — most of it
> (folder layout, state shape, where TypeScript is used in screens) is a judgement call, not a rule.
> **The single binding rule:** every value on screen must already exist as one of the design system's
> token classes — `bg-primary`, `text-secondary`, `text-text-sm`, `rounded-lg`, … — **never a raw hex,
> never an off-scale pixel value, never `bg-[var(--…)]`.** That is what keeps it looking like myWorkDrive.

## Stack

| Concern | Choice |
|---|---|
| Framework / build | React 19 + Vite 8 + **React Compiler** (its own config, `storage-hub/vite.config.js`) |
| Routing | React Router 7 (`BrowserRouter`) |
| State | In-memory React Context (`StorageContext`), mirrors the admin `SharesContext` — resets on reload |
| Styling | **Tailwind CSS v4** — CSS-first `@theme` tokens, no `tailwind.config`, applied via `@tailwindcss/vite` |
| Components | **React Aria Components** (RAC) — the accessible foundation the vendored `components/ui` library is built on |
| Toasts | `sonner` (mounted once in `App.jsx`), surfaced through the vendored `toast` component's `notify` |
| Class composition | `clsx` + `tailwind-merge` via the vendored `lib/cn.ts` |

There is no backend; all data is deterministic sample data in `storage-hub/data.js`.

## The vendored design system (`storage-hub/vendor/`)

The whole point of the stack is *reuse, not reinvention*: the real `myWorkDrive-React` design system is
copied **verbatim** into `storage-hub/vendor/` and is the single source of styling. The `@` path alias
resolves to `storage-hub/vendor`, so the vendored components' own `@/…` imports (e.g. `@/lib/cn`,
`@/assets/icons/check.svg?react`) work unchanged.

```
storage-hub/vendor/
├── styles/globals.css        # Tailwind @theme token file (the design system's Layer 1/2)
├── lib/cn.ts                 # clsx + tailwind-merge composer (font-size + shadow merge groups)
├── lib/pointerType.ts        # touch-vs-mouse helper used by menu
├── assets/icons/*.svg        # design-system SVGs the components import via ?react (svgr)
├── fluent/*.jsx              # 17 Fluent glyphs the screens use (Search, Add, Eye, …)
├── icons.jsx                 # monochrome glyph set (IconEdit / IconDismiss / IconSortDown / …)
├── logos.jsx                 # BrandLogo + the 8 storage-provider logos
├── Flags.jsx                 # national flags (FlagGB)
└── components/ui/            # the React Aria component library (see below)
```

### `globals.css` — the token layer

`@import "tailwindcss"` plus an `@theme` block defining the Untitled-UI-derived system:
the type scale as `--text-text-*` / `--text-display-*` with paired `--…--line-height`
(so `text-text-sm` = 14/20, `text-display-xs` = 24/32); primitive color ramps
(`--color-brand-*`, `--color-gray-*`, error/warning/success); shadows including `--shadow-row-divider`
and the `--shadow-ring-brand` focus halo (via `color-mix`). A `:root` block aliases those primitives to
semantic tokens, and an `@utility` layer exposes them as classes — `bg-primary`, `text-secondary`,
`fg-quaternary`, `border-secondary`, `ring-brand`, `bg-overlay`, etc. Screens and components reference
these class names, never raw hex/px.

### `components/ui/` — the component library

| Component | Origin |
|---|---|
| `button`, `badge`, `checkbox`, `text-field`, `select`, `menu`, `dialog`, `toast` | **Copied verbatim** from the React app's `components/ui/` |
| `tabs` (segmented), `switch`, `drawer` | **Built to match** — authored here on the library's own recipe (a React Aria primitive + `cva`/`cn` + token classes), *not* copied. `Tabs`/`Switch` don't exist in the React app's library; `drawer`'s shipped file was an empty placeholder. Same visual result, authored fresh. |

Two copied components had a single narrow coupling to the React app's Zustand stores / hooks, each used
only by a feature Storage Hub doesn't exercise, so each was neutralized to a no-op rather than dragging
the store in:

- **`menu.tsx`** imported `@/store/announcerStore`, used only inside `useMenuNavigation` (an in-place
  drill-down Storage Hub never uses) → `announce` stubbed to a no-op.
- **`dialog.tsx`** imported `respondToConfirm` from `@/hooks/useConfirm`, used only by the `closeGuard`
  feature Storage Hub never passes → the import and its one effect removed.

## Build wiring (`storage-hub/vite.config.js`)

Isolated from the admin app's root Vite config, so this stack touches only Storage Hub:

- **Plugins:** `@tailwindcss/vite` (Tailwind v4), `vite-plugin-svgr` (the components' `*.svg?react`
  imports), `@vitejs/plugin-react` with the **React Compiler** (`reactCompilerPreset({ target: '19' })`,
  backed by `babel-plugin-react-compiler`) — so screens carry **no** manual `useMemo`/`useCallback`/`memo`;
  the compiler auto-memoizes.
- **Alias:** `@` → `storage-hub/vendor` (nothing else — the old `@shared` → admin `src/` alias is gone).
- **`resolve.dedupe: ['react', 'react-dom', 'react-aria-components', 'react-aria']`** — the Vite root is
  `storage-hub/` but `node_modules` is the parent's, so without dedupe the vendored components and the
  app resolve to two React copies and dev throws "Invalid hook call". (The production build bundles once
  and is unaffected — this is a dev-only fix.)
- Dev server on **port 5200** (`npm run storage-hub`); build via `npm run build-storage-hub`.

## Screens (`storage-hub/*.jsx`)

Plain `.jsx` files (Vite/esbuild compiles them alongside the vendored `.tsx` — no full TS setup needed).
Each renders a `TopBar` and composes Tailwind utilities + vendored components.

- **`StorageHubPage`** — page header (Import/Export buttons), a horizontally-scrolling "frequently used"
  row of connection cards (each with a RAC `Menu` overflow), the `All / Configured` segmented `Tabs`
  filter, a search field, and the provider grid. Status is a `Badge` (success/neutral/error).
- **`ProviderPage`** — breadcrumbs, provider header (`Badge` + Help/Add buttons), an auto-connect-all
  `Switch` card, and a Tailwind connections table (search, name sort, per-row `Switch`, per-row `Menu`).
  Opening a row's Details mounts `ConnectionDetails`; arriving after the wizard fires a `sonner` toast.
- **`ConnectionDetails`** — a right-side `Drawer` (RAC modal) with a segmented `Tabs` split: **Status**
  (metric cards) and **Logs** (search, sort, copy/export via `Menu`, mono-font rows with color-coded
  levels). Clearing logs opens a `Dialog` confirm.
- **`AddConnectionWizard`** — a 4-step flow (Drive Details → Authentication → Storage Settings →
  Review & Confirm) using `TextField`, `Select`, `Checkbox`, `Switch`, a Tailwind stepper, and review
  cards; on confirm it adds the connection and navigates back with a toast.

`App.jsx` owns the routes and mounts sonner's `<Toaster>`; `StorageContext` is the in-memory store.
Every routed screen renders through `Shell.jsx` (see Accessibility below) rather than its own
`<div><TopBar/><main>` wrapper.

## Accessibility & responsive

- **`Shell.jsx`** wraps every routed screen and provides the app-shell WCAG pieces: a visually-hidden
  "Skip to main content" link (2.4.1 Bypass Blocks), the `TopBar`, and the
  `<main id="main-content" tabIndex={-1}>` that both the skip link and route-change focus target — on
  each navigation (not the first landing) focus moves to `<main>` (2.4.3).
- **React Aria Components** supply the rest: focus traps + Escape + focus return for `Dialog`/`Drawer`/
  `Menu`, roving focus, `aria-*` state, and visible focus rings (`ring-brand`). Icon-only buttons carry
  `aria-label`; the clickable provider card is `role="button"` + key handler with the trailing Add
  button owning its own clicks. Status messages (toasts) are announced via sonner's polite live region.
- **Linting:** `.oxlintrc.json` enables the **`jsx-a11y`** plugin scoped to `storage-hub/**/*.jsx`
  (the vendored library is ignored); Storage Hub lints clean.
- **Responsive (WCAG 1.4.10 reflow):** verified with **no horizontal page scroll at 320px** on every
  screen. Breakpoints use Tailwind's own scale (`sm`/`xl`); the provider grid collapses 3→2→1, page
  headers stack below `sm`, the connections table scrolls **inside its own container** (never the
  viewport), the drawer is `max-w-[92vw]`, and the wizard's stepper hides its labels below `sm` (the
  current step is still named by the heading beneath it).

## Conventions

- **The one rule:** every value on screen must already exist as a design-system token class
  (`bg-primary`, `text-secondary`, `text-text-sm`, `rounded-lg`, `ring-brand`, `shadow-xs`) — **never a
  raw hex, never an off-scale pixel value, never `bg-[var(--…)]`.** This is the one thing that keeps it
  looking like myWorkDrive.
- **Reuse a `vendor/components/ui` component before writing markup.** **If something doesn't exist yet,
  build it the same way the existing components are built — same folder (`vendor/components/ui`), same
  styling approach (React Aria + `cn` + token classes), same naming.**
- **Do not import from the admin app's `src/`.** Storage Hub is self-contained under `storage-hub/`.
- Everything else — folder layout, state shape, whether a screen uses TypeScript — is a judgement call,
  since none of it will be reused as production code.
- Prototype only: everything client-side, no real credentials or network calls.

## Deliberate boundaries

- **Icons, logos, and flags are vendored artwork, not part of the token/component system.** The screens'
  UI glyphs come from `vendor/fluent/` + `vendor/icons.jsx`, provider/brand logos from `vendor/logos.jsx`,
  flags from `vendor/Flags.jsx` — all copied verbatim from the admin app (the React app's own SVG set
  lacks several of these glyphs plus the Dropbox/Google-Drive logos). The design-system SVGs the
  *components* import internally still come from `vendor/assets/icons/`.
- **The connections table is a Tailwind composition, not the React app's `table/`.** In the real app
  `table/` is not built on React Aria's `Table` primitive — it's a hand-written table on a separate
  lower-level interaction engine (`collection/`), adopted for performance on large folder listings, and
  coupled to a selection store + roving-tabindex grid semantics. That's overkill for this no-selection,
  click-through list, so the table here is built directly with Tailwind on the same tokens
  (`shadow-row-divider`, etc.) — same look, none of the coupling. Vendoring the real `table/` +
  `collection/` folders is the alternative if pixel-for-pixel table behavior is ever needed.
- **Routing and state stay local** (React Router + Context). The React app's docs are explicit that
  routing/state/data are app-specific and not part of "looking like myWorkDrive"; only the styling and
  component library were adopted.
