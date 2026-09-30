import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { CheckmarkCircleIcon } from '@/fluent/CheckmarkCircleIcon.jsx'
import { WarningIcon } from '@/fluent/WarningIcon.jsx'
import { InfoIcon } from '@/fluent/InfoIcon.jsx'
import { DismissCircleIcon } from '@/fluent/DismissCircleIcon.jsx'
import { DismissIcon } from '@/fluent/DismissIcon.jsx'

// Alert (Figma 2190-105778). No Alert component ships in the library, so this is authored for the
// prototype on the shared tokens. One card: state-tinted fill, border-primary, radius-xl, shadow-xs,
// 16px padding/gap; a 20px Fluent state icon + Text sm/Regular text-secondary message (12px gap).
// - type "simple": optional trailing Dismiss (X) close button (Figma closeButton).
// - type "action": trailing Text md/Regular text-brand-links action button.
export type AlertState = 'success' | 'warning' | 'info' | 'error'

// Shared with Notification, which reuses the same per-state fill + icon.
export const ALERT_STATE: Record<AlertState, { bg: string; fg: string; Icon: typeof InfoIcon }> = {
  success: { bg: 'bg-success-primary', fg: 'fg-success-primary', Icon: CheckmarkCircleIcon },
  warning: { bg: 'bg-warning-primary', fg: 'fg-warning-primary', Icon: WarningIcon },
  info: { bg: 'bg-brand-primary', fg: 'fg-brand-primary', Icon: InfoIcon },
  error: { bg: 'bg-error-primary', fg: 'fg-error-primary', Icon: DismissCircleIcon },
}

export interface AlertProps {
  state?: AlertState
  children: ReactNode
  /** Action type: the trailing link-style button's label. */
  actionLabel?: string
  onAction?: () => void
  /** Simple type: shows the trailing close (X) button. */
  onDismiss?: () => void
  className?: string
}

export function Alert({ state = 'info', children, actionLabel, onAction, onDismiss, className }: AlertProps) {
  const { bg, fg, Icon } = ALERT_STATE[state]
  return (
    <div
      role={state === 'error' || state === 'warning' ? 'alert' : 'status'}
      className={cn('flex items-start gap-4 rounded-xl border border-primary p-4 shadow-xs', bg, className)}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className={cn('flex shrink-0 items-center', fg)}><Icon size={20} /></span>
        <p className="min-w-0 flex-1 text-text-sm font-regular text-secondary">{children}</p>
      </div>
      {actionLabel ? (
        <Button variant="link" className="h-auto shrink-0 p-0" onPress={onAction}>{actionLabel}</Button>
      ) : onDismiss ? (
        <Button variant="tertiary" iconOnly className="size-5 shrink-0 p-0 fg-quaternary data-hovered:bg-transparent" aria-label="Dismiss" onPress={onDismiss}>
          <DismissIcon size={20} />
        </Button>
      ) : null}
    </div>
  )
}
