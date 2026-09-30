# Add New Connection

> Specification extracted from the current frontend implementation of the **Storage Hub** prototype (`storage-hub/`, a second Vite app in the `myworkdrive-admin` repo that reuses the MyWorkDrive design system). It documents behavior as implemented in code. The flow is **frontend-only with an in-memory store — there is no backend/API integration.** Items that cannot be determined from the code are marked **"Not determined from the current implementation."**
>
> **Design source:** Figma "MyWorkDrive", node `3946-92388` ("Add connection", S3 example). The Storage-settings step is designed **for S3 only**; the implementation shows the S3 field set for every provider (see §15).

---

## 1. Overview

### Purpose
The Add New Connection flow lets an admin create a new storage connection for a given provider (e.g. S3) by naming the drive and assigning a drive letter, providing authentication credentials, configuring provider/storage settings, and reviewing everything before creation. On confirmation the new connection is appended to that provider's in-memory connections list and the user is returned to the provider page with a success toast.

### Entry Points
- Route `/provider/:id/new-connection`, rendered by `AddConnectionWizard` (registered in `storage-hub/App.jsx`).
- Reached from **two** places, both of which `navigate` to the route:
  1. **Provider page** (`ProviderPage`) — the **"Add connection"** primary button in the header (`navigate('/provider/${id}/new-connection')`).
  2. **Storage hub** (`StorageHubPage`) — the trailing **"+"** button on a provider card (`onAdd` → same route). Clicking the "+" stops propagation so it does not also open the provider page.
- `:id` is the provider id (e.g. `s3`, `dropbox`). If it does not resolve to a known provider, the wizard redirects to `/` (see §5).

### User Goal
Create and configure a new connection under a provider and have it appear in that provider's connections table.

### High-Level Flow
1. User clicks **Add connection** (provider page) or **+** (hub card) → wizard opens at Step 1 (`Drive Details`).
2. User enters a **Drive name** and selects a **Drive letter**.
3. User provides **Authentication** (AWS profile / EC2 role credentials / access + secret keys; auto-connect toggle).
4. User configures **Storage Settings** (provider, region, URL, namespace, bucket, account id; optional Test connection).
5. User reviews all three sections (`Review & Confirm`) and clicks **Confirm & add**.
6. `addConnection(id, { name, autoConnect })` appends the connection to the provider; the app navigates back to `/provider/:id` and shows a success toast.

---

## 2. Screen / Layout

The wizard is a single component (`AddConnectionWizard`) with a fixed frame; the step body is swapped in by an internal `step` index (0–3). It renders inside the shared Storage-hub shell (`.sh-app` → `TopBar` → `.sh-main`) so the top bar (MyWorkDrive logo + language button) is present.

| Order | Section | Purpose | Components / controls | Visibility |
|---|---|---|---|---|
| 1 | **Top bar** (`TopBar`) | App chrome | Brand logo, language button | Always |
| 2 | **Breadcrumbs** | Context + back to provider | `{provider.name}` link (`Link to="/provider/:id"`), separator `›`, current crumb "Add connection" | Always |
| 3 | **Page title** | Identifies the flow | `<h1>` "Add connection" | Always |
| 4 | **Stepper** (`WizardStepper`) | Shows the 4 steps and allows jumping back to completed steps | 4 nodes with labels: `Drive Details`, `Authentication`, `Storage Settings`, `Review & Confirm` | Always |
| 5 | **Step body** (`wizard__body`) | Renders the current step | One of the four step bodies (see §4) | Always (content conditional on `step`) |
| 6 | **Footer** (`wizard__footer`) | Navigation | **Back** (or **Cancel** on step 0); **Next** (steps 0–2) or **Confirm & add** (step 3) | Always |

Each step body has a common head (`wz-step__head`): an `<h2>` title and a subtitle.

There are **no overlay layers** in this flow (no modals; no leave-wizard guard — see §15).

---

## 3. Components and Controls

| Component / Control | Type | Purpose | Required? | Default | Options / Values | Conditional behavior |
|---|---|---|---|---|---|---|
| Stepper node | Static node / button | Jump to a step | — | Step 0 current | 4 steps | Clickable only for completed steps (`i < current`); current/upcoming are non-clickable |
| Drive name | Text input (`.text-input`) | Name the drive | Yes (to advance) | `"{provider.name} Drive"` | free text | — |
| Drive letter | `InputDropdown` | Assigned drive letter | Yes (to advance) | `M:` | `M:, N:, O:, P:, Z:, Y:, X:, W:` | Static (fixed) width |
| Use AWS profile | `Checkbox` | Toggle AWS-profile auth | No | **on** | on/off | Decorative — does not hide/show other fields |
| AWS Profile Directory | Text input + fused **Browse** button | Path to AWS profile dir | No | `~/aws` | free text | Browse button is non-functional (no handler) |
| Use EC2 role credentials | `Checkbox` | Toggle EC2-role auth | No | **off** | on/off | Decorative |
| Access key | Password input + show/hide eye | AWS access key | No | prefilled sample | free text | Eye toggles `type` text/password |
| Secret key | Password input + show/hide eye | AWS secret key | No | prefilled sample | free text | Eye toggles `type` text/password |
| Connect automatically on startup | `Toggle` | Auto-connect on MyWorkDrive start | No | **on** | on/off | Value carried into `addConnection` |
| Provider | `InputDropdown` | Storage provider | Yes (to advance) | `Amazon S3` | `Amazon S3, Backblaze B2, Cloudflare R2, DigitalOcean Spaces, Wasabi, MinIO, Any S3 Compatible Service` | — |
| Region | `InputDropdown` | Region | Yes (to advance) | `US East (N. Virginia)` | `US East (N. Virginia), US West (Oregon), EU (Ireland), Asia Pacific (Sydney)` | — |
| URL | Text input | Endpoint URL | Yes (to advance) | `https://s3.amazonaws.com` | free text | — |
| Signature version | Text input | Signature version | No | `4` | free text | Static (fixed) width |
| Namespace | Text input | Namespace | Yes (to advance) | `my-namespace` | free text | — |
| Bucket name | `InputDropdown` | Target bucket | Yes (to advance) | `mybucket-name` | `mybucket-name, archive-bucket, backups-2026, media-assets` | — |
| Test connection | Link button (`.btn--link-brand`) | Validate access | — | — | — | On click: `idle → testing → valid`; on `valid` the link is replaced by a green **"Access is valid"** row |
| Account ID | Text input | Account id | Yes (to advance) | `001D000000IRt53` | free text | — |
| Section Edit (Review) | Button (`.btn--secondary .btn--sm`) + pencil icon | Jump back to a step | — | — | — | `onEdit` sets `step` to that section's index |
| Secret value (Review) | Masked text + reveal eye | Show/hide a secret in the summary | — | — | — | Access key / Secret key rows only |
| Info banner (Review) | Static banner (`.info-banner`) + info-circle icon | Note about scope | — | — | — | Step 3 only |
| Cancel | Button (secondary) | Leave the wizard | — | — | — | Step 0 only; navigates to `/provider/:id` |
| Back | Button (secondary) | Previous step | — | — | — | Steps 1–3 |
| Next | Button (primary) | Next step | — | — | — | **Disabled unless the step's `canNext` is satisfied** |
| Confirm & add | Button (primary) | Create the connection | — | — | — | Shown only on step 3; always enabled |

Dropdowns use the shared **`InputDropdown`** component (menu width matches the field), never a native `<select>` — an established project rule.

---

## 4. User Flow

### Step 0 — Drive Details
**User action:** Types a **Drive name** and picks a **Drive letter**. Subtitle: "Name your drive and, if supported, assign a drive letter that users will see when accessing it."
**UI response:** Fields reflect `driveName` / `driveLetter`; the drive-letter menu matches the field width.
**System behavior:** `driveName`, `driveLetter` updated in the wizard's `f` state.
**Next state:** **Next** enabled when `driveName.trim() && driveLetter`. → Step 1.

### Step 1 — Authentication
**User action:** Toggles **Use AWS profile** / **Use EC2 role credentials**, edits **AWS Profile Directory** (with a **Browse** button), reveals/edits **Access key** and **Secret key**, toggles **Connect automatically on startup**. Subtitle: "Provide the credentials required to establish a secure connection to your storage."
**UI response:** Checkboxes/toggle reflect their booleans; password eyes flip visibility; the Browse button is fused to the directory input.
**System behavior:** Respective keys in `f` updated. Auth fields are **not gating** — none are required to advance.
**Next state:** **Next** always enabled. → Step 2.

### Step 2 — Storage Settings ("Configure storage settings")
**User action:** Sets **Provider**, **Region**, **URL**, **Signature version**, **Namespace**, **Bucket name**, **Account ID**; optionally clicks **Test connection**. Subtitle: "Enter the details required to access and configure your selected storage."
**UI response:** Dropdowns open menus matching field width; text fields update; the two numeric-ish fields (Signature version) are fixed-width.
**System behavior:** Respective keys in `f` updated.
**Next state:** **Next** enabled when `storageProvider && region && url.trim() && namespace.trim() && bucketName && accountId.trim()`. → Step 3.

#### Branch — Test connection
**User action:** Clicks **Test connection**.
**UI response / system behavior:** `testState` goes `idle → testing` (link reads "Testing connection…", disabled) → after ~900 ms → `valid`, which replaces the link with a green check + **"Access is valid"**.
**Note:** The test is a **simulated timer** — it always resolves to valid and does not gate **Next** (see §15).

### Step 3 — Review & Confirm
**User action:** Reviews the three sections; may click a section **Edit** (pencil) to return to that step; clicks **Confirm & add**. Subtitle: "Review the settings for this connection. To change something, click Edit in the corresponding section — you'll be brought back there before creating the connection."
**UI response:** Read-only summary in three cards (Drive Details, Authentication, Storage Settings), each a `Field/Value` table. Access key / Secret key render masked (`•` × 28) with a reveal eye; booleans render **Enabled/Disabled**. An info banner notes the wizard covers only required settings.
**System behavior:** `confirm()` → `addConnection(id, { name: driveName, autoConnect: connectAuto })` appends the connection, then `navigate('/provider/${id}', { state: { toast: '"{driveName}" connection added' } })`.
**Next state:** Provider page, new connection in the table, success toast shown for ~3.5 s.

---

## 5. Conditional Logic

### Condition: Unknown provider id
**IF** `getProvider(id)` returns nothing **THEN** render `<Navigate to="/" replace />` (redirect to the hub). **ELSE** render the wizard.

### Condition: Step advancement (`canNext`)
**IF** step 0 → require `driveName.trim()` and `driveLetter`. **IF** step 1 → always allowed. **IF** step 2 → require `storageProvider`, `region`, `url` (trimmed), `namespace` (trimmed), `bucketName`, `accountId` (trimmed). **ELSE** (step 3) → allowed. When not satisfied, **Next** is disabled.

### Condition: Stepper back-navigation
**IF** a step index `i < current` **THEN** its node is a clickable button (`Go to {label}`) that sets `step = i`. **ELSE** the node is non-interactive.

### Condition: Footer buttons
**IF** `step > 0` **THEN** render **Back** (`setStep(step - 1)`). **ELSE** render **Cancel** (`navigate('/provider/:id')`).
**IF** `step < 3` **THEN** render **Next** (`disabled = !canNext`). **ELSE** render **Confirm & add** (always enabled).

### Condition: Test-connection state
**IF** `testState === 'valid'` **THEN** show the green "Access is valid" row. **ELSE** show the **Test connection** link (label "Testing connection…" and disabled while `testState === 'testing'`).

### Condition: Password / secret visibility
**IF** a field's local `show` is true **THEN** input `type="text"` and the eye shows "hide". **ELSE** `type="password"` and the eye shows "show". Applies independently to Access key, Secret key (step 1) and to each masked value in the Review summary.

### Condition: Review value formatting
**IF** a review row value is a `{ secret }` object **THEN** render the masked `SecretValue` (dots + reveal eye). **ELSE** render the value text (booleans pre-mapped to `Enabled`/`Disabled`).

---

## 6. Fields and Validation

> Validation is **gating-based** (the **Next** button is disabled until the step's `canNext` is met). There are **no inline, per-field error messages** anywhere in this flow. All fields are pre-filled with the design's example values, so **Next** is satisfied on entry to each step and the user can proceed without edits.

### Drive name (Step 0)
- **Type:** Text input — **Required:** Yes (to advance) — **Default:** `"{provider.name} Drive"` — **Rule:** `driveName.trim()` non-empty — **Message:** none.

### Drive letter (Step 0)
- **Type:** `InputDropdown` — **Required:** Yes (to advance) — **Default:** `M:` — **Allowed:** `M:, N:, O:, P:, Z:, Y:, X:, W:` — **Message:** none.

### Authentication fields (Step 1)
- **Use AWS profile** — Checkbox — default **on**. **Use EC2 role credentials** — Checkbox — default **off**. **AWS Profile Directory** — text, default `~/aws`. **Access key** / **Secret key** — password, prefilled samples. **Connect automatically on startup** — Toggle, default **on**.
- **Required:** none (step 1 never gates). **Message:** none.

### Storage settings fields (Step 2)
- **Provider*** — `InputDropdown`, default `Amazon S3`. **Region*** — `InputDropdown`, default `US East (N. Virginia)`. **URL*** — text, default `https://s3.amazonaws.com`. **Signature version** — text, default `4`. **Namespace*** — text, default `my-namespace`. **Bucket name*** — `InputDropdown`, default `mybucket-name`. **Account ID*** — text, default `001D000000IRt53`.
- `*` = required to advance (non-empty / selected). **Message:** none.
- **Field sizing rule:** text fields fill **50%** of the container; numeric/static fields (Signature version, Drive letter) use a **fixed** width; dropdown menus match the field width.

---

## 7. States

### Wizard (form) states
- **Step index** `step` (0–3) — drives the stepper and the rendered body. **Resets to 0 on a full page reload** (component-local `useState`).
- **Form values** `f` — a single object holding every field's value (see §6); seeded from the provider and the design's example values.
- **`testState`** — `idle | testing | valid` for the Storage-settings Test connection.
- **Per-field `show`** — local boolean for each password/secret reveal.

### Component states (behavioral)
- **Stepper node:** `current` (brand-filled circle + halo, brand label), `done` (brand-filled circle + white check, clickable), `upcoming` (grey ring + grey dot).
- **Next button:** enabled / disabled per `canNext`.
- **Test connection:** link → "Testing connection…" (disabled) → "Access is valid" (green, static).
- **Password field:** masked / revealed.

### No dedicated loading or error states
Creation is synchronous and in-memory; there is no spinner, no failure path, and no empty state in this flow.

---

## 8. Actions

| Action | Trigger | Effect |
|---|---|---|
| Open wizard | "Add connection" (provider page) or "+" (hub card) | `navigate('/provider/:id/new-connection')` |
| Edit a field | Any input/dropdown/toggle/checkbox | Updates `f` (or `testState` / local `show`) |
| Test connection | "Test connection" link | `testState: testing` → (900 ms) → `valid` |
| Next | Footer primary (steps 0–2) | `setStep(step + 1)` (guarded by `canNext`) |
| Back | Footer secondary (steps 1–3) | `setStep(step - 1)` |
| Cancel | Footer secondary (step 0) | `navigate('/provider/:id')` — discards all input |
| Edit from Review | Section "Edit" button | `setStep(index)` |
| Reveal secret | Eye button (field or review) | Toggles local `show` |
| Confirm & add | Footer primary (step 3) | `addConnection(id, { name, autoConnect })` → `navigate('/provider/:id', { state: { toast } })` |

---

## 9. Data Flow

- The wizard holds all field values in a single component-local `f` object (`useState`). No values are lifted until confirmation.
- On **Confirm & add**, only **two** fields are persisted to the shared store: `name` (from `driveName`) and `autoConnect` (from `connectAuto`). The remaining fields (auth, storage settings) are **collected and reviewed but not stored** in the current model (see §15).
- `addConnection(providerId, data)` lives in `StorageContext` (`storage-hub/StorageContext.jsx`). It appends a new connection to that provider's `connections` array with:
  - `id`: generated (`${providerId}-new-${Date.now()}-${n}`)
  - `name`: `data.name` (trimmed) or a fallback `New-Connection-N`
  - `status`: `active`; `modified`: `—`; `autoConnect`: `data.autoConnect ?? true`
  - plus synthesized `uptime` / `sent` / `received` / `logs` via `connectionExtras()`.
- The provider's derived **connection count** (branch-fork number on the hub) and **Configured** state update automatically because they read `connections.length`.
- The success toast is passed via router `location.state.toast`; `ProviderPage` reads it once, shows it ~3.5 s, then clears the state via `navigate(replace)`.

---

## 10. API / Backend Behavior

**Not determined from the current implementation.** This is a frontend-only prototype with an in-memory store (`StorageContext`). There are no network calls: no credential validation, no real "Test connection", no create request, and no persistence. All state resets on reload.

---

## 11. Success and Error Handling

### Success
- On **Confirm & add**, the connection is appended, the app returns to `/provider/:id`, and a success toast **"'{Drive name}' connection added"** appears (auto-dismiss ~3.5 s).

### Errors
- No error paths exist. Creation cannot fail; "Test connection" always succeeds; there are no field-level errors. **Not determined from the current implementation** how real credential or connectivity errors would surface.

---

## 12. Design-to-Code Mapping

| Design (Figma node) | Screen / element | Implementation |
|---|---|---|
| `3946-92388` | Add connection flow (S3 example, all states) | `AddConnectionWizard.jsx` |
| `3950-93128` | Step 1 — Drive Details (filled) | Step 0 body |
| `4006-77955` | Step 2 — Authentication (filled) | Step 1 body |
| `4006-77978` | AWS Profile Directory (input + trailing Browse) | `.sh-input-row` fused input/button |
| `4002-77669` | Step 3 — Storage Settings (selected bucket) | Step 2 body |
| `3951-126684` | Step 4 — Review & Confirm | Step 3 body / `ReviewCard` |
| `4006-92240` | Review card (24px table padding, Edit w/ icon) | `.sh-app .review-card`/`.kv-*` overrides |
| `4002-76609` | Progress steps (stepper) | `WizardStepper` / `.wz-stepper` |

Design system reused from the main app via the `@shared` alias: `.wizard`/`.form-card`/`.form-field`/`.text-input`/`.info-banner`/`.review-card`/`.kv-table` (wizard.css), `.btn`/`.label`/`.toast` (components.css), and the `Toggle`, `Checkbox`, and `InputDropdown` components.

---

## 13. Acceptance Criteria

### AC-01 — Open the wizard
**Given** a provider page or a hub provider card, **when** the user clicks **Add connection** / **+**, **then** the wizard opens at `Drive Details` for that provider.

### AC-02 — Unknown provider redirects
**Given** a `/provider/:id/new-connection` URL whose `:id` is unknown, **then** the app redirects to the hub (`/`).

### AC-03 — Drive Details required to advance
**Given** Step 0, **when** Drive name is empty or Drive letter is unset, **then** **Next** is disabled.

### AC-04 — Authentication never blocks
**Given** Step 1, **then** **Next** is always enabled regardless of the auth fields.

### AC-05 — Storage Settings required fields gate Next
**Given** Step 2, **when** any of Provider / Region / URL / Namespace / Bucket / Account ID is empty, **then** **Next** is disabled.

### AC-06 — Test connection resolves to valid
**Given** Step 2, **when** the user clicks **Test connection**, **then** it shows "Testing connection…" briefly and then a green **"Access is valid"**.

### AC-07 — Dropdowns use InputDropdown with matching menu width
**Given** any dropdown (Provider / Region / Bucket / Drive letter), **then** it renders the `InputDropdown` (not a native select) and its menu width equals the field width.

### AC-08 — AWS directory has a fused trailing Browse button
**Given** Step 1, **then** the AWS Profile Directory input and the **Browse** button share one rounded border with a divider (no gap).

### AC-09 — Review reflects entries and masks secrets
**Given** Step 3, **then** each section shows the entered values; Access key / Secret key are masked with a reveal eye; booleans read Enabled/Disabled.

### AC-10 — Edit from Review returns to the step
**Given** Step 3, **when** the user clicks a section **Edit**, **then** the wizard returns to that step with values intact.

### AC-11 — Create the connection
**Given** Step 3, **when** the user clicks **Confirm & add**, **then** a connection named after the Drive name (with the auto-connect value) is appended to the provider and the app returns to the provider page with a success toast.

### AC-12 — Cancel discards input
**Given** Step 0, **when** the user clicks **Cancel**, **then** the app returns to the provider page and no connection is created.

### AC-13 — Stepper back-navigation
**Given** a step beyond the first, **when** the user clicks a completed stepper node, **then** the wizard jumps to that step; current/upcoming nodes are not clickable.

---

## 14. Responsive Behavior

The Storage-hub app is **not responsive by design** (no `@media` queries beyond the hub grid). The wizard is laid out for desktop widths inside the shared `.sh-main` frame (max-width 1440, 32px padding). **Not determined from the current implementation** for narrow/mobile widths.

---

## 15. Known Gaps / Ambiguities

- **Storage-settings step is S3-only.** The design (`3946-92388`) specifies the S3 field set; the implementation shows that same set (Provider/Region/URL/Signature version/Namespace/Bucket/Account ID) for **every** provider. Provider-specific field sets (as the main app's Add-New-Share wizard has) are **not** implemented. When per-provider designs exist, Step 2 should branch on the provider.
- **Only name + auto-connect are persisted.** Auth credentials and storage settings are collected and reviewed but discarded on creation (the in-memory model does not store them). A real backend would persist all of them.
- **"Test connection" is simulated.** It always resolves to "Access is valid" on a fixed timer, does not use the entered credentials, and does not gate **Next**.
- **No leave-wizard guard.** Unlike the Add-New-Share wizard, navigating away (top bar, browser back, breadcrumb) does not prompt to confirm losing input.
- **State resets on reload.** Step index and all values are component-local; a full page reload restarts the wizard at Step 0. The shared store also resets on reload.
- **Browse button is non-functional** (no file picker) and the auth checkboxes are decorative (they do not show/hide dependent fields).
- **Stepper connector-line insets** (`left/right`) are pinned to the first/last label widths; changing those labels may require adjusting the values.

---

## 16. Source Files

- `storage-hub/AddConnectionWizard.jsx` — the wizard (stepper, all four steps, review, footer, confirm).
- `storage-hub/StorageContext.jsx` — `addConnection` (and the shared connections store).
- `storage-hub/data.js` — provider catalog, drive-letter/option pools, `connectionExtras`.
- `storage-hub/ProviderPage.jsx` — "Add connection" entry + arrival toast.
- `storage-hub/StorageHubPage.jsx` — provider-card "+" entry.
- `storage-hub/App.jsx` — route `/provider/:id/new-connection`.
- `storage-hub/storage-hub.css` — wizard-specific styles (stepper, fused input, field widths, review padding).
- Shared: `src/styles/wizard.css`, `src/styles/components.css`, `src/ui/InputDropdown.jsx`, `src/ui/Toggle.jsx`, `src/ui/Checkbox.jsx`.
