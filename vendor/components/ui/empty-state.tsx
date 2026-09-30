import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { FolderIcon } from '@/fluent/FolderIcon.jsx'

// Table empty state (Figma 2391-100408). No EmptyState ships in the library, so this is authored for
// the prototype on the shared tokens. Content block (40px top / 24px bottom / 32px side padding) with
// a 400px-wide centered header: 48px bg-tertiary featured-icon circle holding a 24px fg-quaternary
// Fluent icon (Folder by default), 16px gap, then title (Text lg/Semibold text-primary) + supporting
// text (Text sm/Regular text-tertiary) 4px apart. Below, an actions row (40px bottom / 24px side
// padding, 12px gap) with a secondary button.
export interface EmptyStateProps {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  actionLabel?: string
  /** Optional leading icon for the action button (e.g. a 20px Add/plus icon). */
  actionIcon?: ReactNode
  onAction?: () => void
  className?: string
}

export function EmptyState({ title, description, icon, actionLabel, actionIcon, onAction, className }: EmptyStateProps) {
  return (
    <div className={cn('flex w-full flex-col', className)}>
      <div className={cn('flex flex-col items-center justify-center px-8 pt-10', actionLabel ? 'pb-6' : 'pb-10')}>
        <div className="flex w-full max-w-100 flex-col items-center gap-4 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-tertiary fg-quaternary">
            {icon ?? <FolderIcon size={24} />}
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-text-lg font-semibold text-primary">{title}</p>
            {description && <p className="text-text-sm font-regular text-tertiary">{description}</p>}
          </div>
        </div>
      </div>
      {actionLabel && (
        <div className="flex items-start justify-center gap-3 px-6 pb-10">
          <Button variant="secondary" onPress={onAction}>{actionIcon}{actionLabel}</Button>
        </div>
      )}
    </div>
  )
}
