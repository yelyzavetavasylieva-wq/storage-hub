import type { Key } from 'react'
import { Tabs as AriaTabs, TabList as AriaTabList, Tab as AriaTab } from 'react-aria-components'
import { cn } from '@/lib/cn'

// Segmented control. No Tabs component ships in the library, so this is authored for the prototype
// on RAC Tabs + the shared tokens (bg-secondary track, bg-primary selected pill, shadow-xs).
export interface SegmentedTabsProps {
  'aria-label': string
  value: string
  onChange: (value: string) => void
  tabs: { id: string; label: string }[]
  /** Mirrors the Figma Tabs "Full width" property: the track spans its container and the tabs
   * share the width equally (the hub's provider filter), rather than hugging their labels. */
  fullWidth?: boolean
  className?: string
}

export function SegmentedTabs({ 'aria-label': ariaLabel, value, onChange, tabs, fullWidth = false, className }: SegmentedTabsProps) {
  return (
    <AriaTabs
      selectedKey={value}
      onSelectionChange={(key: Key) => onChange(String(key))}
      className={cn(fullWidth ? 'w-full' : 'w-fit', className)}
    >
      <AriaTabList
        aria-label={ariaLabel}
        className={cn('flex items-center gap-1 rounded-lg border border-secondary bg-secondary p-1', fullWidth ? 'w-full' : 'w-fit')}
      >
        {tabs.map((t) => (
          <AriaTab
            key={t.id}
            id={t.id}
            className={cn(
              'cursor-pointer rounded-md px-3 py-1.5 text-text-sm font-semibold text-quaternary outline-none transition-colors data-hovered:text-tertiary data-selected:bg-primary data-selected:text-secondary data-selected:shadow-xs data-focus-visible:ring-brand',
              fullWidth && 'flex-1 text-center',
            )}
          >
            {t.label}
          </AriaTab>
        ))}
      </AriaTabList>
    </AriaTabs>
  )
}
