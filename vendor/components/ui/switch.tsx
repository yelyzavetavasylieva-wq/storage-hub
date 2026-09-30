import { Switch as AriaSwitch, type SwitchProps as AriaSwitchProps } from 'react-aria-components'
import { cn } from '@/lib/cn'

// Toggle switch. The React app ships no switch/toggle, so this is authored for the prototype on
// RAC Switch + the shared tokens (Untitled UI: gray track off, brand-solid-icon track on, 16px thumb).
export interface SwitchProps extends Omit<AriaSwitchProps, 'className'> {
  className?: string
}

export function Switch({ className, ...props }: SwitchProps) {
  return (
    <AriaSwitch {...props} className={cn('group inline-flex cursor-pointer items-center outline-none', className)}>
      <span className="flex h-5 w-9 shrink-0 items-center rounded-full bg-quaternary p-0.5 transition-colors group-data-selected:bg-brand-solid-icon group-data-focus-visible:ring-brand group-data-disabled:opacity-50">
        <span className="size-4 rounded-full bg-white shadow-sm transition-transform group-data-selected:translate-x-4" />
      </span>
    </AriaSwitch>
  )
}
