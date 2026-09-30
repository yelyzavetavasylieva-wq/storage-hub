import type { ReactNode, Ref } from 'react'
import CheckIcon from '@/assets/icons/check.svg?react'
import MinusIcon from '@/assets/icons/minus.svg?react'
import {
  CheckboxField as AriaCheckboxField,
  type CheckboxFieldProps as AriaCheckboxFieldProps,
  CheckboxButton as AriaCheckboxButton,
} from 'react-aria-components'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

// Matches boxVariants' size steps exactly (16/20/24px); previously a hardcoded size-3 left the
// glyph looking undersized at md/lg. shrink-0 counters boxVariants' 1px border shrinking the
// flex content on the horizontal axis only, which otherwise rendered a lopsided glyph.
const iconVariants = cva('stroke-current shrink-0', {
  variants: {
    size: { sm: 'size-4', md: 'size-5', lg: 'size-6' },
  },
  defaultVariants: { size: 'sm' },
})

const boxVariants = cva(
  // Focus uses the same shadow-ring-brand halo as Button/TextField; disabled fill is !important
  // so it wins over selected (checked-and-disabled must read as disabled). group-data-indeterminate
  // mirrors group-data-selected — RAC sets it for a mixed "select all" checkbox — without this
  // fill the box stayed unfilled white, hiding MinusIcon's stroke.
  'flex shrink-0 items-center justify-center border border-primary bg-primary text-white transition-colors group-data-selected:border-transparent group-data-selected:bg-brand-solid-icon group-data-indeterminate:border-transparent group-data-indeterminate:bg-brand-solid-icon group-data-focus-visible:ring-brand group-data-disabled:border-disabled group-data-disabled:bg-disabled!',
  {
    variants: {
      // Figma's checkbox uses one constant corner-radius proportion (3.5/16 ≈ 21.9%) at every
      // size, so these scale that proportion to md/lg instead of rounded-sm/md/lg's
      // progressively rounder tokens.
      size: { sm: 'size-4 rounded-[3.5px]', md: 'size-5 rounded-[4.375px]', lg: 'size-6 rounded-[5.25px]' },
    },
    defaultVariants: { size: 'sm' },
  },
)

// Indents the description row to line up under the title text (box width + the row's gap-2).
const descriptionIndent = cva('', {
  variants: { size: { sm: 'pl-6', md: 'pl-7', lg: 'pl-8' } },
  defaultVariants: { size: 'sm' },
})

// Title scales with box size — Figma: sm="Text sm/Semibold" (14/20), md and lg both
// use "Text md/Semibold" (16/24, lg does not get its own larger style).
const titleVariants = cva('font-semibold text-secondary group-data-disabled:text-disabled', {
  variants: { size: { sm: 'text-text-sm', md: 'text-text-md', lg: 'text-text-md' } },
  defaultVariants: { size: 'sm' },
})

// Description scales 1:1 with the title — same size per breakpoint, just Regular not Semibold.
const descriptionVariants = cva('font-regular text-tertiary group-data-disabled:text-disabled', {
  variants: { size: { sm: 'text-text-sm', md: 'text-text-md', lg: 'text-text-md' } },
  defaultVariants: { size: 'sm' },
})

export interface CheckboxProps
  extends Omit<AriaCheckboxFieldProps, 'className' | 'children'>, VariantProps<typeof boxVariants> {
  /** Applied to the outer field wrapper (box + title + description). */
  className?: string
  /** Applied to the clickable `<label>` itself (box + title only) — e.g. padding + a matching
   *  negative margin to grow the tap target past the visible box without shifting layout, for a
   *  dense context like a table row where the visible `sm` box alone is well under the WCAG 2.5.8
   *  24×24px minimum. */
  buttonClassName?: string
  ref?: Ref<HTMLLabelElement>
  /** Title row — Figma "Text sm|md/Semibold" (600), scales with `size`. */
  children?: ReactNode
  /** Optional second row — Figma "Text sm|md/Regular" (400), scales 1:1 with the title. */
  description?: ReactNode
}

export function Checkbox({ size, className, buttonClassName, children, description, ref, ...props }: CheckboxProps) {
  return (
    <AriaCheckboxField {...props} className={cn('group flex flex-col', className)}>
      {/* Own group scope: CheckboxField itself never gets data-focus-visible/hovered/pressed
          (only CheckboxButton does), so the box's group-data-focus-visible:ring-brand needs this
          ancestor. CheckboxButton mirrors CheckboxField's other data-* attributes too. */}
      <AriaCheckboxButton ref={ref} className={cn('group flex items-center gap-2', buttonClassName)}>
        {({ isSelected, isIndeterminate }) => (
          <>
            {/* Box + title share one row, centered against just this line — never against
                the combined title+description block height. */}
            <span className={cn(boxVariants({ size }))} aria-hidden>
              {isIndeterminate ? (
                <MinusIcon className={iconVariants({ size })} fill="none" strokeWidth={2} />
              ) : isSelected ? (
                <CheckIcon className={iconVariants({ size })} fill="none" strokeWidth={2} />
              ) : null}
            </span>
            {children ? <span className={titleVariants({ size })}>{children}</span> : null}
          </>
        )}
      </AriaCheckboxButton>
      {description ? (
        <span className={cn(descriptionVariants({ size }), descriptionIndent({ size }))}>
          {description}
        </span>
      ) : null}
    </AriaCheckboxField>
  )
}
