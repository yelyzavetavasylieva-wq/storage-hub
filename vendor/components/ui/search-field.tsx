import {
  SearchField as AriaSearchField,
  type SearchFieldProps as AriaSearchFieldProps,
  Input,
  Button,
} from 'react-aria-components'
import { cn } from '@/lib/cn'
import { SearchIcon } from '@/fluent/SearchIcon.jsx'
import { DismissIcon } from '@/fluent/DismissIcon.jsx'

// Search field. No SearchField ships in the library, so this is authored for the prototype on RAC
// SearchField + the same input tokens as TextField (sm, 40px). Leading 20px Search icon; when there's
// a value, a trailing clear button with the Dismiss icon at the SAME 20px size + fg-quaternary color
// as the search icon. The browser's native search "X" is hidden so only this one shows. RAC also
// clears on Escape.
export interface SearchFieldProps extends Omit<AriaSearchFieldProps, 'className'> {
  placeholder?: string
  className?: string
}

export function SearchField({ placeholder = 'Search', className, ...props }: SearchFieldProps) {
  return (
    <AriaSearchField {...props} className={cn('group relative w-full', className)}>
      <SearchIcon size={20} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 fg-quaternary" />
      <Input
        placeholder={placeholder}
        className={cn(
          'h-10 w-full rounded-md border border-primary bg-primary pr-10 pl-10 text-text-md font-regular text-primary shadow-xs outline-none placeholder:text-placeholder',
          'data-focused:border-brand data-focused:ring-brand',
          '[&::-webkit-search-cancel-button]:appearance-none',
        )}
      />
      <Button
        aria-label="Clear search"
        className="absolute top-1/2 right-3 flex -translate-y-1/2 rounded-sm fg-quaternary outline-none group-data-empty:hidden data-hovered:fg-quaternary-hover data-focus-visible:ring-brand-focus"
      >
        <DismissIcon size={20} />
      </Button>
    </AriaSearchField>
  )
}
