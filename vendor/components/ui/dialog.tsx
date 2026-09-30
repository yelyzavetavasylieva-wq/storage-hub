import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react'
import {
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
  Dialog as AriaDialog,
  Heading,
  Button as AriaButton,
  type ModalOverlayProps as AriaModalOverlayProps,
} from 'react-aria-components'
import { cn } from '@/lib/cn'
import { Button, type ButtonProps } from '@/components/ui/button'
import CloseIcon from '@/assets/icons/close.svg?react'

// ==================== Types ====================

// Same strings as RAC's own `role` values — no separate standard/alert vocabulary to map through.
export type DialogVariant = 'dialog' | 'alertdialog'

export interface DialogCloseGuard {
  isBusy: boolean
  /** Resolves true when it's OK to close (e.g. the user confirmed "Cancel operation?"). */
  onRequestCancel: () => Promise<boolean>
}

export interface DialogProps extends Omit<AriaModalOverlayProps, 'children' | 'className'> {
  variant?: DialogVariant
  className?: string
  /** Where initial focus should land instead of RAC's default pick — required for
   *  variant="alertdialog" so Cancel, not the destructive action, gets focus. */
  initialFocusRef?: RefObject<HTMLElement | null>
  closeGuard?: DialogCloseGuard
  /** Overrides the modal's default max-w-md cap — e.g. the compact confirm/conflict dialog. */
  maxWidthClassName?: string
  children: ReactNode
}

// ==================== Context ====================

const DialogCloseContext = createContext<(() => void) | null>(null)

// Carries the id DialogBody must put on its own element so Dialog can wire it up as aria-describedby.
const DialogDescriptionContext = createContext<string | undefined>(undefined)

// Any button inside a Dialog's children calls this instead of the parent's own close setter —
// that's the only way a "Close" button's click also goes through closeGuard.
export function useDialogClose(): () => void {
  const requestClose = useContext(DialogCloseContext)
  if (!requestClose) throw new Error('useDialogClose must be used inside a Dialog')
  return requestClose
}

// ==================== Responsive layout constants ====================
//
// Padding steps from 16px to 24px at sm: (640px), the same breakpoint DialogFooter switches at —
// close button position and heading clearance are derived from this same step.

// Horizontal content padding, shared by DialogHeader and DialogBody.
const CONTENT_PADDING_X = 'px-4 sm:px-6'

// 44px hit target, absolutely positioned over the content padding rather than sharing it. Offset
// from the corner mirrors CONTENT_PADDING_X's own step (10px/16px) so it sits flush at both sizes.
const CLOSE_BUTTON_POSITION = 'absolute top-2.5 right-2.5 sm:top-4 sm:right-4'

// pr- reserved so heading text never runs under the close button: pr-10/pr-9 cover its 44px hit
// target plus offset at both padding steps.
const HEADING_CLOSE_BUTTON_CLEARANCE = 'pr-10 sm:pr-9'

// Fixed, not auto: row labels and DialogHeader's titleTrailing are separate grids in separate
// boxes, so auto-sizing each independently wouldn't agree on a width. Fixed at both call sites
// keeps their value columns aligned; comfortably fits every current label.
export const DIALOG_LABEL_COLUMN = 'grid-cols-[7.5rem_1fr]'

// flex-col-reverse stacks full-width below sm: with the primary action visually first, without
// reordering the markup. Shared by DialogFooter's container and its button group.
const STACK_FULL_WIDTH_BELOW_SM = 'flex flex-col-reverse gap-3 sm:flex-row'

// ==================== Dialog ====================

// Placeholder sizing/spacing — no Figma sign-off yet, revisit once the redesign lands.
export function Dialog({
  variant = 'dialog',
  className,
  initialFocusRef,
  closeGuard,
  maxWidthClassName = 'max-w-md',
  children,
  isOpen,
  onOpenChange,
  ...overlayProps
}: DialogProps) {
  const descriptionId = useId()
  // Escape/backdrop/close-button all stay live while onRequestCancel is unresolved — without this a
  // second close request raises a duplicate cancel prompt.
  const isAwaitingCancelRef = useRef(false)

  const handleOpenChange = useCallback(
    async (open: boolean) => {
      if (open) {
        onOpenChange?.(open)
        return
      }
      if (!closeGuard?.isBusy) {
        onOpenChange?.(open)
        return
      }
      if (isAwaitingCancelRef.current) return
      isAwaitingCancelRef.current = true
      try {
        const confirmed = await closeGuard.onRequestCancel()
        if (confirmed) onOpenChange?.(open)
      } finally {
        // Released even on a decline, so a later close attempt asks again rather than no-op'ing.
        isAwaitingCancelRef.current = false
      }
    },
    [closeGuard, onOpenChange],
  )

  const requestClose = useCallback(() => {
    handleOpenChange(false)
  }, [handleOpenChange])

  return (
    <AriaModalOverlay
      {...overlayProps}
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      // p-4: gutter against the viewport edges on narrow screens — invisible once max-w-md has
      // room to spare, since the overlay only centers content within whatever space is left.
      className={cn('fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4', className)}
    >
      <AriaModal className={cn('w-full', maxWidthClassName)}>
        <AriaDialog
          role={variant}
          aria-describedby={descriptionId}
          className="relative flex max-h-[85vh] flex-col overflow-hidden rounded-xl bg-primary shadow-xl outline-none"
        >
          <DialogInitialFocus initialFocusRef={initialFocusRef} />
          {/* Not part of DialogHeader's flow — Figma: 44×44 hit target, 16×16 icon. */}
          <AriaButton
            aria-label="Close dialog"
            onPress={requestClose}
            className={cn(
              CLOSE_BUTTON_POSITION,
              'fg-quaternary data-hovered:fg-quaternary-hover data-hovered:bg-tertiary data-focus-visible:fg-quaternary-hover data-focus-visible:bg-tertiary z-10 flex size-11 items-center justify-center rounded-sm outline-none',
            )}
          >
            <CloseIcon aria-hidden="true" className="size-4" />
          </AriaButton>
          <DialogCloseContext.Provider value={requestClose}>
            <DialogDescriptionContext.Provider value={descriptionId}>{children}</DialogDescriptionContext.Provider>
          </DialogCloseContext.Provider>
        </AriaDialog>
      </AriaModal>
    </AriaModalOverlay>
  )
}

// useEffect runs after RAC's useLayoutEffect autofocus, reliably overriding RAC's default pick
// without racing.
function DialogInitialFocus({ initialFocusRef }: { initialFocusRef?: RefObject<HTMLElement | null> }) {
  useEffect(() => {
    initialFocusRef?.current?.focus()
  }, [initialFocusRef])
  return null
}

// ==================== DialogHeader ====================

// No bottom padding — the gap to DialogBody's first line is DialogBody's own 4px pt, not stacked
// padding. `icon` renders above the heading in this same padded box so a caller doesn't have to
// re-derive CONTENT_PADDING_X itself; the caller still controls the icon's look, just not its
// placement. Figma: 16px gap to the heading.
export function DialogHeader({
  children,
  className,
  icon,
  titleTrailing,
}: {
  children: ReactNode
  className?: string
  icon?: ReactNode
  /** Rendered inline after the heading, on the same row, in a value column matching
   *  DIALOG_LABEL_COLUMN — e.g. the subject item's own icon and name, aligned with the body's
   *  own rows. Kept outside the Heading itself so it stays out of the dialog's accessible name. */
  titleTrailing?: ReactNode
}) {
  return (
    <div className={cn(CONTENT_PADDING_X, 'pt-4 sm:pt-6', className)}>
      {icon ? <div className="mb-4">{icon}</div> : null}
      <div className={titleTrailing ? cn('grid items-center gap-x-4', DIALOG_LABEL_COLUMN) : undefined}>
        <Heading slot="title" className={cn(HEADING_CLOSE_BUTTON_CLEARANCE, 'text-lg font-semibold text-primary')}>
          {children}
        </Heading>
        {titleTrailing ? <div className={cn(HEADING_CLOSE_BUTTON_CLEARANCE, 'min-w-0')}>{titleTrailing}</div> : null}
      </div>
    </div>
  )
}

// ==================== DialogBody ====================

// No min-height by default — a flow hook whose body swaps content opts into a stable height via
// its own min-h-* className. overflow-y-auto + max-h keeps long content scrolling here, not the footer.
export function DialogBody({
  children,
  className,
  'aria-busy': ariaBusy,
}: {
  children: ReactNode
  className?: string
  'aria-busy'?: boolean
}) {
  const descriptionId = useContext(DialogDescriptionContext)
  return (
    <div
      id={descriptionId}
      aria-busy={ariaBusy}
      className={cn(
        CONTENT_PADDING_X,
        // pb-1 mirrors pt-1: without it, a focus ring's bottom halo (shadow-ring-brand, a 4px
        // outward box-shadow) on a field flush against this edge gets clipped by overflow-y-auto.
        'max-h-[60vh] flex-1 overflow-y-auto pt-1 pb-1 text-sm text-tertiary',
        className,
      )}
    >
      {children}
    </div>
  )
}

// ==================== DialogFooter ====================

// checkbox (e.g. "Apply to all") and action buttons share one row from sm: up, buttons pushed to
// the end via ml-auto. Lives outside DialogBody's scroll area so it stays visible.
export function DialogFooter({
  checkbox,
  children,
  className,
  fullWidth,
}: {
  checkbox?: ReactNode
  children: ReactNode
  className?: string
  /** Buttons split the row evenly instead of auto-width/pushed-right — e.g. Skip/Continue. */
  fullWidth?: boolean
}) {
  return (
    <div className={cn(STACK_FULL_WIDTH_BELOW_SM, 'p-4 sm:flex-wrap sm:items-center sm:p-6', className)}>
      {checkbox}
      <div className={cn(STACK_FULL_WIDTH_BELOW_SM, fullWidth ? 'w-full sm:*:flex-1' : '*:w-full sm:ml-auto sm:*:w-auto')}>
        {children}
      </div>
    </div>
  )
}

// ==================== DialogCloseButton ====================

// Every modal's footer "Close"/"Cancel" button, wired through useDialogClose() — the only way its
// click also goes through closeGuard, same as the header's own close icon.
export function DialogCloseButton({
  label = 'Close',
  size,
  ref,
}: {
  label?: string
  size?: ButtonProps['size']
  ref?: Ref<HTMLButtonElement>
}) {
  const requestClose = useDialogClose()
  return (
    <Button ref={ref} variant="secondary" size={size} onPress={requestClose}>
      {label}
    </Button>
  )
}
