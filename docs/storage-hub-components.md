# Storage Hub — component cookbook

The vendored UI library Storage Hub screens are built from, with props and a usage snippet for each.
These live in `storage-hub/vendor/components/ui/` and are the React app's real components (React Aria +
Tailwind tokens); `drawer`, `tabs`, and `switch` are authored locally the same way. Import them via the
`@` alias (→ `storage-hub/vendor`).

**Common imports**

```jsx
import { cn } from '@/lib/cn';                         // clsx + tailwind-merge class composer
import { SearchIcon } from '@/fluent/SearchIcon.jsx';  // UI glyphs (size + currentColor)
import { IconEdit } from '@/icons.jsx';                // monochrome glyphs
import { BrandLogo, LogoS3 } from '@/logos.jsx';       // brand + provider logos
```

Style everything with **token utilities** (`bg-primary`, `text-text-sm`, `text-secondary`,
`ring-brand`, `shadow-xs`, `border-secondary`) — never a raw hex/px. The full token vocabulary is the
`@theme`/`@utility` layer in `storage-hub/vendor/styles/globals.css`.

---

## Buttons & actions

### `Button` — `@/components/ui/button`
Props: `variant` `primary | secondary | tertiary | link | destructive` (default `primary`) · `size`
`sm | md | lg | xl` (default `sm`) · `iconOnly` (bool) · plus React Aria Button props (`onPress`,
`isDisabled`, …). `iconOnly` **requires** `aria-label`.

```jsx
import { Button } from '@/components/ui/button';
import { AddIcon } from '@/fluent/AddIcon.jsx';

<Button variant="primary" onPress={save}>Add connection</Button>
<Button variant="secondary" onPress={cancel}>Cancel</Button>
<Button variant="secondary" size="sm" iconOnly aria-label="Add"><AddIcon size={20} /></Button>
<Button variant="link" className="h-auto p-0" onPress={test}>Test connection</Button>
```

---

## Display

### `Badge` — `@/components/ui/badge`
A pill label. Props: `color` `neutral | brand | success | warning | error` (default `neutral`).

```jsx
import { Badge } from '@/components/ui/badge';

<Badge color="success">Active</Badge>
<Badge color="neutral">Stopped</Badge>
<Badge color="error">Failed</Badge>
```

### `SegmentedTabs` — `@/components/ui/tabs`
Controlled segmented control. Props: `aria-label` · `value` · `onChange(value)` · `tabs: {id,label}[]`.

```jsx
import { SegmentedTabs } from '@/components/ui/tabs';

<SegmentedTabs
  aria-label="Provider filter"
  value={tab}
  onChange={setTab}
  tabs={[{ id: 'all', label: 'All (8)' }, { id: 'configured', label: 'Configured (2)' }]}
/>
```

---

## Inputs

### `TextField` — `@/components/ui/text-field`
Props: `label` · `description` · `placeholder` · `errorMessage` · `size` `xs | sm | md` (default `sm`) ·
`isRequired` · `value` · `onChange(string)` · `className` (wrapper width, e.g. `w-full sm:w-1/2`). Renders
its own label + required asterisk.

```jsx
import { TextField } from '@/components/ui/text-field';

<TextField label="Drive name" isRequired value={f.driveName} onChange={(v) => set('driveName', v)} />
```

### `Select` + `SelectItem` — `@/components/ui/select`
Props: `label` · `placeholder` · `selectedKey` · `onSelectionChange(key)` · `isRequired` · `size`. Items
carry an `id` (the key).

```jsx
import { Select, SelectItem } from '@/components/ui/select';

<Select label="Region" isRequired selectedKey={f.region} onSelectionChange={(k) => set('region', String(k))}>
  {REGIONS.map((o) => <SelectItem key={o} id={o}>{o}</SelectItem>)}
</Select>
```

### `Checkbox` — `@/components/ui/checkbox`
Props: `isSelected` · `onChange(bool)` · `size` `sm | md | lg` (default `sm`) · `children` (title) ·
`description`.

```jsx
import { Checkbox } from '@/components/ui/checkbox';

<Checkbox isSelected={f.useAwsProfile} onChange={(v) => set('useAwsProfile', v)}>Use AWS profile</Checkbox>
```

### `Switch` — `@/components/ui/switch`
Toggle. Props: `isSelected` · `onChange(bool)` · `aria-label`.

```jsx
import { Switch } from '@/components/ui/switch';

<Switch isSelected={conn.autoConnect} onChange={(on) => setAutoConnect(id, conn.id, on)} aria-label={`Auto-connect ${conn.name}`} />
```

---

## Overlays

### `Menu` — `@/components/ui/menu`
Exports `MenuTrigger`, `Menu`, `MenuItem`, `MenuSeparator`, `Popover`. The trigger opens/closes itself.
`Menu` takes `onAction(key)`; `MenuItem` takes `id`, optional `icon`, and `className` (e.g.
`text-error-primary` for a danger item).

```jsx
import { MenuTrigger, Menu, MenuItem, MenuSeparator, Popover } from '@/components/ui/menu';
import { MoreHorizontalIcon } from '@/fluent/MoreHorizontalIcon.jsx';
import { IconEdit, IconDismiss } from '@/icons.jsx';
import { Button } from '@/components/ui/button';

<MenuTrigger>
  <Button variant="tertiary" size="sm" iconOnly aria-label={`Actions for ${name}`}>
    <MoreHorizontalIcon size={20} />
  </Button>
  <Popover>
    <Menu onAction={(key) => { if (key === 'remove') remove(); }}>
      <MenuItem id="edit" icon={<IconEdit />}>Edit</MenuItem>
      <MenuSeparator />
      <MenuItem id="remove" icon={<IconDismiss />} className="text-error-primary">Remove</MenuItem>
    </Menu>
  </Popover>
</MenuTrigger>
```

### `Dialog` — `@/components/ui/dialog`
A centered modal. Exports `Dialog`, `DialogHeader`, `DialogBody`, `DialogFooter`, `DialogCloseButton`.
`Dialog` props: `isOpen` · `onOpenChange(bool)` · `variant` `dialog | alertdialog` · `maxWidthClassName`
(default `max-w-md`). It renders its own close (✕). `DialogHeader` takes an optional `icon`;
`DialogFooter` takes `fullWidth`; `DialogCloseButton` takes `label`.

```jsx
import { Dialog, DialogHeader, DialogBody, DialogFooter, DialogCloseButton } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

<Dialog variant="alertdialog" isOpen={open} onOpenChange={setOpen}>
  <DialogHeader>Clear all logs?</DialogHeader>
  <DialogBody>This permanently removes all log entries. This can’t be undone.</DialogBody>
  <DialogFooter fullWidth>
    <DialogCloseButton label="Cancel" />
    <Button variant="destructive" onPress={clear}>Clear</Button>
  </DialogFooter>
</Dialog>
```

### `Drawer` — `@/components/ui/drawer`
A right-anchored side sheet. Props: `aria-label` (required) · `isOpen` · `onOpenChange(bool)` ·
`isDismissable` · `widthClassName` (default `w-[520px]`, capped at `max-w-[92vw]`). You compose its
header/body as children. Escape + backdrop dismiss come free.

```jsx
import { Drawer } from '@/components/ui/drawer';

<Drawer aria-label={`Details for ${name}`} isOpen isDismissable onOpenChange={(o) => { if (!o) onClose(); }}>
  <header className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">…</header>
  <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-2 pb-6">…</div>
</Drawer>
```

---

## Feedback — toasts

### `notify` — `@/components/ui/toast`
`notify.success(message)` / `notify.error(message)`. Sonner's `<Toaster>` is already mounted once in
`storage-hub/App.jsx`, so just call `notify` from anywhere.

```jsx
import { notify } from '@/components/ui/toast';

notify.success('“S3 Drive” connection added');
notify.error('Something went wrong');
```

---

## Icons, logos & flags

- **UI glyphs** (sized, `currentColor` — color them with a text/`fg-*` class):
  `import { SearchIcon } from '@/fluent/SearchIcon.jsx'` → `<SearchIcon size={20} className="fg-quaternary" />`
- **Monochrome glyphs:** `import { IconEdit, IconDismiss, IconSortDown } from '@/icons.jsx'`
- **Provider & brand logos** (keep their own colors): `import { BrandLogo, LogoS3, LogoOneDrive } from '@/logos.jsx'`
- **Flags:** `import { FlagGB } from '@/Flags.jsx'`

---

## Adding a new component

Only when the design needs one the library lacks. **If something doesn't exist yet, build it the same
way the existing components are built** — **same folder** (`storage-hub/vendor/components/ui/`), **same
styling approach** (a React Aria primitive + `cn` + token utilities, `cva` for variants, no raw
hex/px), **same naming** (lowercase file, e.g. `switch.tsx`) — then document it here. Keep screens
`.jsx`; the vendored `.tsx` compiles alongside them with no extra setup.
