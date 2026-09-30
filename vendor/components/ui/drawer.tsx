import type { ReactNode } from 'react'
import {
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
  Dialog as AriaDialog,
  type ModalOverlayProps as AriaModalOverlayProps,
} from 'react-aria-components'
import { cn } from '@/lib/cn'

// Right-anchored side sheet. The React app ships an empty drawer.tsx placeholder, so this is
// authored for the Storage Hub prototype the same way the library's Dialog is: RAC
// ModalOverlay/Modal/Dialog + the shared tokens (bg-overlay scrim, bg-primary panel, shadow-xl).
export interface DrawerProps extends Omit<AriaModalOverlayProps, 'className' | 'children'> {
  'aria-label': string
  widthClassName?: string
  className?: string
  children: ReactNode
}

export function Drawer({ 'aria-label': ariaLabel, widthClassName = 'w-[520px]', className, children, ...props }: DrawerProps) {
  return (
    <AriaModalOverlay
      {...props}
      // No scrim: a side panel slides in over the page without dimming it (only modals use bg-overlay).
      className="fixed inset-0 z-50 flex justify-end"
    >
      <AriaModal
        className={cn(
          // Slide + fade in from the right; RAC toggles data-entering on mount.
          'h-full max-w-[92vw] outline-none transition duration-200 ease-out data-entering:translate-x-4 data-entering:opacity-0',
          widthClassName,
        )}
      >
        <AriaDialog
          aria-label={ariaLabel}
          className={cn('flex h-full flex-col border-l border-primary bg-primary shadow-drawer outline-none', className)}
        >
          {children}
        </AriaDialog>
      </AriaModal>
    </AriaModalOverlay>
  )
}
