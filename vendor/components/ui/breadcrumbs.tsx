import { Breadcrumbs as AriaBreadcrumbs, Breadcrumb as AriaBreadcrumb, Link as AriaLink } from 'react-aria-components'
import ChevronRightIcon from '@/assets/icons/chevron-right.svg?react'
import { cn } from '@/lib/cn'

// Breadcrumbs (Figma 1112-22606) built from the `_Breadcrumb button base` (Figma 1112-22533).
// No Breadcrumbs component ships in the library, so this is authored for the prototype on RAC
// Breadcrumbs + the shared tokens:
// - crumb: Text sm/Regular, breadcrumb-fg (slate-600) → breadcrumb-fg_hover (slate-700) on hover
// - current (last) crumb: Text sm/Semibold, text-brand-links, not a link
// - separator: 16px Fluent chevron-right in gray-300 (fg-senary), 12px (spacing-lg) gaps
export interface BreadcrumbItem {
  label: string
  /** Route to navigate to. Omitted on the current (last) crumb. */
  href?: string
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
    <AriaBreadcrumbs className="flex flex-wrap items-center gap-3">
      {items.map((item, i) => {
        const current = i === items.length - 1
        return (
          <AriaBreadcrumb key={`${i}-${item.label}`} id={i} className="flex items-center gap-3">
            <AriaLink
              href={current ? undefined : item.href}
              className={cn(
                'rounded-sm text-text-sm whitespace-nowrap outline-none data-focus-visible:ring-brand-focus',
                current
                  ? 'font-semibold text-brand-links'
                  : 'cursor-pointer font-regular text-slate-600 data-hovered:text-slate-700',
              )}
            >
              {item.label}
            </AriaLink>
            {!current && <ChevronRightIcon aria-hidden="true" className="size-4 shrink-0 fg-senary [&_path]:fill-current" />}
          </AriaBreadcrumb>
        )
      })}
    </AriaBreadcrumbs>
    </nav>
  )
}
