# Storage Hub

A standalone React prototype: a **storage-provider catalog** and **per-provider connections manager**
for MyWorkDrive. It's a separate surface from the admin panel (no admin sidebar) and is **fully
self-contained** — it depends on nothing outside this repo.

Built on the **`myWorkDrive-React` stack** (Tailwind CSS v4 + React Aria Components), with that app's
design system vendored in under [`vendor/`](vendor/).

> **Visual/UX reference prototype, not production.** The folder structure and code patterns aren't the
> point — the goal is that it **looks and feels like myWorkDrive**. The one binding rule: every on-screen
> value is a design-system token class (`bg-primary`, `text-text-sm`, `rounded-lg`) — never a raw hex,
> off-scale px, or `bg-[var(--…)]`. Everything else is a judgement call.

## Run

```bash
npm install        # once
npm run dev        # dev server → http://localhost:5200
npm run build      # production build → dist/
npm run lint       # oxlint (incl. jsx-a11y)
```

Full docs live in [`docs/`](docs/) (architecture, component cookbook, Add-connection spec).

**Prerequisites:** Node.js 20+ and npm (CI builds on Node 24). There is no backend — all data is
in-memory sample data (`data.js`) that resets on reload.

## Stack

- **React 19** + **React Router 7** + **React Compiler** (auto-memoizes — don't hand-add
  `useMemo`/`useCallback`/`memo`)
- **Tailwind CSS v4** (`@theme` tokens, no config file) for styling
- **React Aria Components** — the accessible foundation the vendored `components/ui` library is built on
- **`sonner`** toasts; `class-variance-authority` + `clsx` + `tailwind-merge` for variants/classes
- **Vite 8** (own config, [`vite.config.js`](vite.config.js)); **oxlint** + **`jsx-a11y`** lint

## Structure

```
storage-hub/
  main.jsx              React root + globals.css import
  App.jsx               Routes + sonner <Toaster>
  Shell.jsx             App shell: skip link + <main> focus target (a11y)
  TopBar.jsx            Brand logo + language switcher
  StorageHubPage.jsx    Hub — provider catalog + frequently-used
  ProviderPage.jsx      Connections table (+ details drawer, row menus)
  ConnectionDetails.jsx Details drawer (Status / Logs tabs, clear-logs dialog)
  AddConnectionWizard.jsx  4-step add-connection wizard
  StorageContext.jsx    In-memory store
  data.js               Deterministic sample data
  vendor/               The myWorkDrive-React design system (see below)
```

Screens are `.jsx`; the `@` alias resolves to `./vendor`.

## The vendored design system (`vendor/`)

The single source of styling — copied verbatim from `myWorkDrive-React`:

- `vendor/styles/globals.css` — Tailwind `@theme` tokens + semantic `@utility` layer
- `vendor/components/ui/` — the React Aria component library (`.tsx`)
- `vendor/lib/cn.ts` — the `clsx` + `tailwind-merge` composer
- `vendor/fluent/`, `vendor/icons.jsx`, `vendor/logos.jsx`, `vendor/Flags.jsx`, `vendor/assets/icons/` — icons, logos, flags

## Conventions

- Style with Tailwind **token utilities** (`bg-primary`, `text-text-sm`, `ring-brand`) — never a raw
  hex/px, never `bg-[var(--…)]`.
- **Reuse a `vendor/components/ui` component before writing markup.** If something doesn't exist yet,
  build it the same way the existing components are built — **same folder** (`vendor/components/ui`),
  **same styling approach** (React Aria + `cn` + token classes), **same naming**. Screens stay `.jsx`.
- Keep it accessible (every screen renders through `Shell`; icon-only buttons need `aria-label`) and
  responsive to 320px (no horizontal page scroll).
- Prototype only: client-side, no real credentials or network calls.

## Docs

- [`../docs/storage-hub-architecture.md`](../docs/storage-hub-architecture.md) — architecture, vendored design system, build wiring
- [`../docs/frontend-and-languages.md`](../docs/frontend-and-languages.md) — frontend technologies & development languages
- [`../docs/storage-hub-components.md`](../docs/storage-hub-components.md) — component cookbook (props + usage)
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — conventions and how to add a screen/component
