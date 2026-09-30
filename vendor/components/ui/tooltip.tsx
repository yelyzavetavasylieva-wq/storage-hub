import type { ReactNode } from 'react'
import {
  Tooltip as AriaTooltip,
  type TooltipProps as AriaTooltipProps,
  TooltipTrigger as AriaTooltipTrigger,
  type TooltipTriggerComponentProps,
  OverlayArrow,
} from 'react-aria-components'
import { cn } from '@/lib/cn'

export interface TooltipTriggerProps extends TooltipTriggerComponentProps {}

// Wraps a focusable trigger + its Tooltip. `delay`/`closeDelay` default to a short hover delay so
// the tooltip doesn't flash on a passing cursor; focus always shows it immediately (RAC behaviour).
export function TooltipTrigger({ delay = 500, closeDelay = 0, ...props }: TooltipTriggerProps) {
  return <AriaTooltipTrigger delay={delay} closeDelay={closeDelay} {...props} />
}

export interface TooltipProps extends Omit<AriaTooltipProps, 'children'> {
  children: ReactNode
}

// Figma Tooltip (bg-tertiary, radius-md, xs-semibold, shadow-lg) with a matching caret. `offset`
// leaves room for the arrow between the trigger and the pill.
export function Tooltip({ className, children, offset = 8, ...props }: TooltipProps) {
  return (
    <AriaTooltip
      offset={offset}
      className={cn(
        'rounded-md bg-tertiary px-3 py-2 text-text-xs font-semibold text-primary shadow-lg',
        className,
      )}
      {...props}
    >
      <OverlayArrow>
        {/* Rotated square whose corner pokes past the pill edge as a caret (same bg-tertiary fill). */}
        <div className="size-2 rotate-45 rounded-[1px] bg-tertiary" aria-hidden="true" />
      </OverlayArrow>
      {children}
    </AriaTooltip>
  )
}
