import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ALERT_STATE, type AlertState } from '@/components/ui/alert'
import { cn } from '@/lib/cn'
import { DismissIcon } from '@/fluent/DismissIcon.jsx'

// Notification banner — layout from Figma Notification (5544-72066), with the Alert's per-state fill
// and Fluent state icon (Figma 2190-105778) so it reads as the same family as Alert.
// Card: border-primary, radius-xl, 16px padding. Content row (16px gap, 32px right padding to clear
// the close button): 20px state icon (aligned to the title line) + a column (12px gap) of
//   title (Text sm/Semibold text-primary) + supporting text (Text sm/Regular text-tertiary), 4px apart,
//   then the actions row (12px gap) of Text md/Regular text-brand-links buttons.
// Optional 20px Dismiss (X) close button pinned 11px from the top-right outer edge (10px + the 1px border).
export interface NotificationAction {
  label: string
  onPress: () => void
}

export interface NotificationProps {
  state?: AlertState
  title: ReactNode
  children?: ReactNode
  actions?: NotificationAction[]
  onDismiss?: () => void
  className?: string
}

export function Notification({ state = 'info', title, children, actions = [], onDismiss, className }: NotificationProps) {
  const { bg, fg, Icon } = ALERT_STATE[state]
  return (
    <div
      role={state === 'error' || state === 'warning' ? 'alert' : 'status'}
      className={cn('relative flex items-start gap-4 overflow-clip rounded-xl border border-primary p-4', bg, className)}
    >
      {onDismiss && (
        <Button
          variant="tertiary"
          iconOnly
          aria-label="Dismiss"
          className="absolute top-2.5 right-2.5 size-5 p-0 fg-quaternary data-hovered:bg-transparent"
          onPress={onDismiss}
        >
          <DismissIcon size={20} />
        </Button>
      )}
      <div className="flex min-w-0 flex-1 items-start gap-4 pr-8">
        <span className={cn('flex shrink-0', fg)}><Icon size={20} /></span>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-col gap-1 text-text-sm">
            <p className="font-semibold text-primary">{title}</p>
            {children && <p className="font-regular text-tertiary">{children}</p>}
          </div>
          {actions.length > 0 && (
            <div className="flex items-start gap-3">
              {actions.map((a) => (
                <Button key={a.label} variant="link" className="h-auto p-0" onPress={a.onPress}>{a.label}</Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
