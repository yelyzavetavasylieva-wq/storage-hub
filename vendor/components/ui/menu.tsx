import { forwardRef, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { useInteractOutside } from 'react-aria'
import {
  Header as AriaHeader,
  Menu as AriaMenu,
  type MenuProps as AriaMenuProps,
  MenuItem as AriaMenuItem,
  type MenuItemProps as AriaMenuItemProps,
  MenuSection as AriaMenuSection,
  type MenuSectionProps as AriaMenuSectionProps,
  MenuTrigger,
  Popover as AriaPopover,
  PopoverContext,
  type PopoverProps as AriaPopoverProps,
  RootMenuTriggerStateContext,
  Separator as AriaSeparator,
  type SeparatorProps as AriaSeparatorProps,
  useContextProps,
} from 'react-aria-components'
import ChevronRightIcon from '@/assets/icons/chevron-right.svg?react'
import CheckIcon from '@/assets/icons/check.svg?react'
import { isLastPointerTouch } from '@/lib/pointerType'
import { cn } from '@/lib/cn'

export { MenuTrigger }

// Sanity cap on Menu's own trigger-resolution walk (below) — real nesting never approaches this,
// it only guards against an unexpected DOM/id cycle turning into an infinite loop.
const MAX_MENU_NESTING_DEPTH = 20

export interface PopoverProps extends AriaPopoverProps {
  /**
   * Opt-in for a lightweight row-action menu (right-click menu, dot-menu) instead of a dialog
   * popover. A modal Popover marks everything outside itself `inert`, blocking a right-click meant
   * for a different row's menu — this makes it non-modal instead, and reimplements the two dismiss
   * behaviors that turns off: Escape-to-close (non-modal skips the auto-focus Escape relies on) and
   * outside-click-to-close, extended to also treat a right-click as an outside interaction.
   */
  nonModalDismissable?: boolean
}

// forwardRef so a caller can reach the popover's own rendered <div> — purely additive, existing
// callers that don't pass a ref are unaffected.
export const Popover = forwardRef<HTMLElement, PopoverProps>(function Popover(
  { className, nonModalDismissable, onContextMenu, ...props },
  forwardedRef,
) {
  const internalRef = useRef<HTMLElement>(null)
  // Only set when this Popover sits inside a MenuTrigger — null for a standalone Popover (e.g.
  // FileTable's context menu), which passes its own onOpenChange. Same fallback Menu uses for
  // Tab-close.
  const rootMenuTriggerState = useContext(RootMenuTriggerStateContext)
  // A MenuTrigger-driven Popover (every row's own DotMenuButton) is always mounted in the tree,
  // open or not — without this, its listeners below would stay registered globally for every
  // row for as long as the table exists, not just the one row whose menu is actually open.
  const isOpen = props.isOpen ?? rootMenuTriggerState?.isOpen ?? false

  function close() {
    if (props.onOpenChange) props.onOpenChange(false)
    else rootMenuTriggerState?.close()
  }

  // Same context AriaPopover itself reads (via its own internal useContextProps call) to find its
  // trigger's DOM node — read independently here so the outside-click check below can exclude it.
  // internalRef only covers the popover panel, which is portaled away from the trigger button
  // rather than rendered as its DOM descendant, so react-aria's own outside detection can't
  // otherwise tell "clicked the trigger again" apart from "clicked something unrelated".
  const [{ triggerRef }] = useContextProps({} as AriaPopoverProps, null, PopoverContext)

  useInteractOutside({
    ref: internalRef,
    isDisabled: !nonModalDismissable || !isOpen,
    onInteractOutside: (event) => {
      // A second interaction with the trigger while its own menu is open (a fast repeat click
      // before the popover settles, or an accidental double-click) is not an outside interaction —
      // without this check it used to close the menu the instant it opened.
      if (triggerRef?.current?.contains(event.target as Node)) return
      close()
    },
  })

  useEffect(() => {
    if (!nonModalDismissable || !isOpen) return
    function onDocumentContextMenu(event: MouseEvent) {
      // Some mobile browsers ALSO fire a native contextmenu event after a touch long-press-hold,
      // targeting the finger's real position (not this popover's own DOM) — that's the same gesture
      // that just opened this popover a moment earlier via useItemLongPress, not a dismiss request.
      if (isLastPointerTouch()) return
      if (!internalRef.current?.contains(event.target as Node)) close()
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('contextmenu', onDocumentContextMenu, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('contextmenu', onDocumentContextMenu, true)
      document.removeEventListener('keydown', onKeyDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close() reads props/context fresh each call, not captured
  }, [nonModalDismissable, isOpen])

  return (
    <AriaPopover
      ref={(node) => {
        internalRef.current = node
        if (typeof forwardedRef === 'function') forwardedRef(node)
        else if (forwardedRef) forwardedRef.current = node
      }}
      isNonModal={nonModalDismissable || props.isNonModal}
      // A right-click landing directly on this panel (rather than outside it) needs its own
      // preventDefault() — the browser's native menu would otherwise appear on top of this one.
      onContextMenu={
        nonModalDismissable
          ? (event) => {
              event.preventDefault()
              close()
            }
          : onContextMenu
      }
      // react-aria sets an inline maxHeight here (viewport collision detection) — without
      // overflow-y-auto a tall menu overflows past it instead of scrolling, spilling over
      // whatever's underneath.
      className={cn(
        'min-w-40 overflow-y-auto rounded-md border border-primary bg-primary py-1 shadow-md outline-none',
        className,
      )}
      {...props}
    />
  )
})

export function Menu<T extends object>({ className, ...props }: AriaMenuProps<T>) {
  // WAI-ARIA: Tab must close the whole menu stack, not just move focus — RAC only does the
  // latter, so this adds a native listener. `RootMenuTriggerStateContext` closes every nesting
  // level, not just the innermost. Capture-phase on `document`: for a non-modal popover,
  // react-aria's own Tab handling stops propagation before a bubble listener would see it.
  const rootMenuTriggerState = useContext(RootMenuTriggerStateContext)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = menuRef.current
    if (!node) return
    // The popover wrapper, not `node` alone — trailing dialog content (e.g. a filter panel's
    // footer buttons) that Tab must still reach lives outside `node` but inside this.
    const listenTarget = node.closest<HTMLElement>('[data-trigger]') ?? node
    // A standalone Menu (no MenuTrigger ancestor, e.g. FileTable's own ItemContextMenu) has no
    // rootMenuTriggerState to close — it closes via its own `onClose` prop instead, which already
    // returns focus to the right place (see ItemContextMenu's own `onOpenChange`).
    const close = rootMenuTriggerState ? () => rootMenuTriggerState.close() : props.onClose
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !close) return
      // Scoped to keydowns actually inside this popover — a document-level listener would
      // otherwise fire for every Tab press on the page, including unrelated, closed instances.
      if (!listenTarget.contains(e.target as Node)) return

      // If a dialog-style (modal) popover has more focusable content ahead in this direction
      // (e.g. a filter panel's trailing buttons), let Tab reach it instead of closing.
      const dialog = node.closest('[role="dialog"]')
      if (dialog) {
        // `.tabIndex` excludes RAC's invisible-but-enabled DismissButtons, which a plain
        // `:not([disabled])` selector would still miscount as "more content ahead".
        const focusables = Array.from(
          dialog.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]'),
        ).filter(el => el.tabIndex >= 0 && !el.hasAttribute('disabled'))
        const activeIndex = focusables.indexOf(document.activeElement as HTMLElement)
        const hasMoreInDirection = e.shiftKey ? activeIndex > 0 : activeIndex !== -1 && activeIndex < focusables.length - 1
        if (hasMoreInDirection) return
      }

      e.preventDefault()

      // A standalone Menu's own `onClose` already returns focus to the right place (same as
      // Escape/outside-click) — the trigger-walk below only applies to a real MenuTrigger.
      if (!rootMenuTriggerState) {
        flushSync(close)
        return
      }

      // Popover levels aren't DOM descendants of each other, so the root trigger is found by
      // walking a chain: first via each dialog's `aria-labelledby` (what opened it), falling back
      // to `aria-controls` reversed (works for non-dialog/non-modal levels too).
      let trigger: HTMLElement | null = null
      let current: Element | null = node
      for (let level = 0; level < MAX_MENU_NESTING_DEPTH && current; level++) {
        const currentDialog: Element | null = current.closest('[role="dialog"]')
        const labelledBy: string | null = currentDialog?.getAttribute('aria-labelledby') ?? null
        const target: HTMLElement | null = labelledBy ? document.getElementById(labelledBy) : null
        if (!target) break
        if (!target.closest('[role="menu"], [role="menubar"]')) {
          trigger = target
          break
        }
        current = target
      }
      if (!trigger) {
        let controlsScope: Element | null = node
        for (let level = 0; level < MAX_MENU_NESTING_DEPTH && controlsScope; level++) {
          const currentId: string = (controlsScope as HTMLElement).id
          const target: HTMLElement | null = currentId
            ? document.querySelector<HTMLElement>(`[aria-controls="${currentId}"]`)
            : null
          if (!target) break
          const enclosingMenu: Element | null = target.closest('[role="menu"], [role="menubar"]')
          if (!enclosingMenu) {
            trigger = target
            break
          }
          controlsScope = enclosingMenu
        }
      }
      if (!trigger) {
        // No safe fallback target — everything reachable from here is about to unmount with this
        // popover. Logging at least surfaces the edge case; the menu still closes either way.
        console.warn('Menu: could not resolve a trigger element to focus after Tab.')
      }
      // flushSync: forces the close()-triggered unmount to fully commit before trigger.focus()
      // runs, deterministically — a `setTimeout(fn, 0)` would merely tend to run late enough.
      flushSync(close)
      trigger?.focus()
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [rootMenuTriggerState, props.onClose])

  return <AriaMenu ref={menuRef} className={cn('outline-none', className)} {...props} />
}

export interface MenuItemProps extends AriaMenuItemProps {
  /**
   * Leading icon, rendered in a fixed 20×20 box with the icon (typically 16×16) centered inside —
   * so items mix icons of slightly different native sizes without them throwing off row alignment.
   * Ignored for items inside a `selectionMode="single"` section, where the radio indicator takes
   * this same leading slot instead.
   */
  icon?: ReactNode
  /**
   * Trailing secondary text shown right before the chevron — e.g. a drill-down row's own
   * `MenuItem` previewing the currently active choice (Sort: "Ascending (from A to Z)"). Named
   * distinctly from RAC's own `value` prop (the item's underlying data value for typeahead/etc.).
   */
  previewText?: ReactNode
  /**
   * Shows the trailing chevron for a row that drills into an in-place detail view via
   * `useMenuNavigation`/`MenuBackItem` — there's no RAC `hasSubmenu` render prop for these, since
   * the swap happens within the same popover instead of opening a nested one.
   */
  chevron?: boolean
}

export function MenuItem({ className, children, icon, previewText, chevron, ...props }: MenuItemProps) {
  return (
    <AriaMenuItem
      // cursor-pointer: MenuItem is a <div>, not a <button>, so the browser defaults to an I-beam.
      // data-focus-visible reuses the hover bg, not a ring — a ring gets clipped by the Popover's
      // rounded corners. Padding is asymmetric per Figma: 16px left, unchanged right.
      className={cn(
        'flex h-10 cursor-pointer items-center justify-between gap-2 pt-2 pr-3 pb-2 pl-4 text-text-sm font-regular text-primary outline-none select-none data-focus-visible:bg-primary-hover data-hovered:bg-primary-hover data-disabled:cursor-default data-disabled:text-disabled',
        className,
      )}
      {...props}
    >
      {values => (
        <>
          {/* Groups the leading icon/radio + text into one flex unit, so `justify-between` spreads
              just this group vs. the trailing group, not every individual child across the row. */}
          <span className="flex min-w-0 items-center gap-2">
            {values.selectionMode === 'single' ? (
              // Radio visual for single-select sections (RAC already gives role="menuitemradio"/
              // aria-checked); outer span keeps the same 20×20 leading slot as every other item.
              <span className="flex size-5 shrink-0 items-center justify-center" aria-hidden="true">
                <span
                  className={cn(
                    'flex size-4 items-center justify-center rounded-full border',
                    values.isSelected ? 'border-transparent bg-brand-solid-icon' : 'border-primary bg-primary',
                  )}
                >
                  {values.isSelected ? <span className="size-1.5 rounded-full bg-primary" /> : null}
                </span>
              </span>
            ) : values.selectionMode === 'multiple' ? (
              // Checkbox visual for multi-select sections — role="menuitemcheckbox"/aria-checked
              // already come free from RAC; same box treatment as ui/checkbox.tsx's `sm` size.
              <span className="flex size-5 shrink-0 items-center justify-center" aria-hidden="true">
                <span
                  className={cn(
                    'flex size-4 items-center justify-center rounded-sm border',
                    values.isSelected ? 'border-transparent bg-brand-solid-icon text-white' : 'border-primary bg-primary',
                  )}
                >
                  {values.isSelected ? <CheckIcon className="size-3 stroke-current" fill="none" strokeWidth={2} /> : null}
                </span>
              </span>
            ) : icon ? (
              <span className="flex size-5 shrink-0 items-center justify-center">{icon}</span>
            ) : null}
            {typeof children === 'function' ? children(values) : children}
          </span>
          {previewText || chevron ? (
            <span className="flex shrink-0 items-center gap-2">
              {/* aria-hidden: a sighted-only preview — the detail view's own items already expose
                  the real selection state, so this shouldn't fold into the accessible name too. */}
              {previewText ? (
                <span aria-hidden="true" className="truncate text-quaternary">
                  {previewText}
                </span>
              ) : null}
              {/* `chevron` marks "activating this row opens another view" (a drill-down page
                  swap), not selection state. */}
              {chevron ? <ChevronRightIcon aria-hidden="true" className="size-4 shrink-0" /> : null}
            </span>
          ) : null}
        </>
      )}
    </AriaMenuItem>
  )
}

export interface MenuSectionProps<T extends object> extends Omit<AriaMenuSectionProps<T>, 'children'> {
  /** Visible section label (e.g. "Layout", "Sort") — renders as a `Header`, RAC wires it to the
   * section's `aria-labelledby` automatically, so it doubles as the section's accessible name. */
  title?: ReactNode
  children?: ReactNode
}

export function MenuSection<T extends object>({ className, title, children, ...props }: MenuSectionProps<T>) {
  return (
    <AriaMenuSection className={cn('outline-none', className)} {...props}>
      {title ? (
        <AriaHeader className="flex h-9 items-center px-4 text-text-sm font-regular text-quaternary">
          {title}
        </AriaHeader>
      ) : null}
      {children}
    </AriaMenuSection>
  )
}

export function MenuSeparator({ className, ...props }: AriaSeparatorProps) {
  return <AriaSeparator className={cn('border-secondary my-1 border-t', className)} {...props} />
}

/**
 * Backs the app's one nested-menu pattern: a popover's content swaps in place for a detail "page"
 * (root ↔ one level down, via `MenuBackItem`), not a flyout submenu. See `ViewSortButton`.
 * `goTo`/`goBack` also announce the transition — swapping content in place moves focus but doesn't
 * otherwise convey that you're looking at something else now.
 */
export function useMenuNavigation<Page extends string>() {
  const [page, setPage] = useState<Page | null>(null)
  // Decoupled from the app's announcer store for the Storage Hub prototype (no live region here).
  const announce = (_message: string) => {}

  return {
    page,
    goTo: (next: Page, label: string) => {
      setPage(next)
      announce(`${label} menu opened`)
    },
    goBack: (label: string) => {
      setPage(null)
      announce(`Back to ${label} menu`)
    },
    // Wire to the owning MenuTrigger's `onOpenChange` — closing (Escape, click-outside, selecting
    // a leaf item) always resets back to the root page for next time.
    onOpenChange: (isOpen: boolean) => {
      if (!isOpen) setPage(null)
    },
  }
}

export interface MenuBackItemProps {
  onAction: () => void
  /** The detail page's own heading (e.g. a sort field's name) — also this row's visible label. */
  children: ReactNode
}

/** The back row atop a page opened via `useMenuNavigation` — same treatment everywhere it's used. */
export function MenuBackItem({ onAction, children }: MenuBackItemProps) {
  return (
    <MenuItem
      className="h-9 text-quaternary"
      icon={<ChevronRightIcon aria-hidden="true" className="size-4 rotate-180" />}
      onAction={onAction}
      shouldCloseOnSelect={false}
    >
      {children}
    </MenuItem>
  )
}
