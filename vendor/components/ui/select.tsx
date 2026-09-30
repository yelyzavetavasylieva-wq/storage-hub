import type { ReactNode } from 'react'
import ChevronDownIcon from '@/assets/icons/chevron-down.svg?react'
import CheckIcon from '@/assets/icons/check.svg?react'
import {
  Select as AriaSelect,
  type SelectProps as AriaSelectProps,
  Button,
  FieldError,
  Label,
  ListBox,
  ListBoxItem,
  type ListBoxItemProps,
  SelectValue,
  Text,
  type ValidationResult,
} from 'react-aria-components'
import type { VariantProps } from 'class-variance-authority'
import { Popover } from '@/components/ui/menu'
import { inputSizeVariants } from '@/components/ui/text-field'
import { cn } from '@/lib/cn'

export interface SelectProps<T extends object>
  extends Omit<AriaSelectProps<T>, 'className' | 'children'>,
    VariantProps<typeof inputSizeVariants> {
  label?: string
  placeholder?: string
  description?: ReactNode
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode)
  className?: string
  children: ReactNode
}

export function Select<T extends object>({
  label,
  placeholder,
  description,
  errorMessage,
  className,
  children,
  size,
  ...props
}: SelectProps<T>) {
  return (
    <AriaSelect {...props} autoComplete={props.autoComplete ?? 'off'} className={cn('flex w-full flex-col gap-1.5', className)}>
      {({ isOpen, isInvalid }) => (
        <>
          {label ? (
            <Label className="text-text-sm font-semibold text-secondary">
              {label}
              {props.isRequired && <span className="ml-0.5 text-error-primary">*</span>}
            </Label>
          ) : null}
          <Button
            className={cn(
              // Same input-size scale as TextField (default sm/40px) — the trigger reads as an
              // input box sitting next to real ones, so it has to match their height exactly.
              'flex w-full items-center justify-between gap-2 rounded-md border border-primary bg-primary text-text-md font-regular shadow-xs outline-none',
              inputSizeVariants({ size }),
              // Button derives its own focus/press state independently of the Select wrapper
              // (react-aria-components does not forward data-invalid to the trigger Button),
              // so the invalid/focus pairing has to be resolved here rather than via
              // data-invalid:data-focused: compound selectors like TextField uses.
              isInvalid
                ? 'border-error data-focused:ring-error'
                : 'data-focused:border-brand data-focused:ring-brand',
              isOpen && (isInvalid ? 'ring-error' : 'border-brand ring-brand'),
              'data-disabled:bg-disabled data-disabled:text-disabled',
            )}
          >
            <SelectValue className="data-placeholder:text-placeholder">
              {({ defaultChildren, isPlaceholder }) =>
                isPlaceholder ? (placeholder ?? 'Select...') : defaultChildren
              }
            </SelectValue>
            <ChevronDownIcon
              aria-hidden="true"
              className={cn('shrink-0 transition-transform duration-200', isOpen && 'rotate-180')}
            />
          </Button>
          {/* Popover styling reused from ui/menu.tsx (same shell DotMenuButton/ViewSortButton use)
              — only the trigger-width match is Select-specific. min-w-0 overrides the shared
              Popover's own min-w-40: without it, a trigger narrower than 160px would show a
              dropdown wider than itself, since CSS min-width always wins over a smaller width.
              Popover already supplies py-1 (same as Menu's), so ListBox itself adds no vertical
              padding of its own — otherwise the two would stack into 8px instead of the intended 4px. */}
          <Popover className="min-w-0 w-(--trigger-width)">
            <ListBox className="flex flex-col outline-none">{children}</ListBox>
          </Popover>
          {description ? (
            <Text slot="description" className="text-text-sm font-regular text-tertiary">
              {description}
            </Text>
          ) : null}
          <FieldError className="text-text-xs font-regular text-error-primary">{errorMessage}</FieldError>
        </>
      )}
    </AriaSelect>
  )
}

export function SelectItem({ className, children, ...props }: ListBoxItemProps & { className?: string }) {
  return (
    <ListBoxItem
      {...props}
      className={cn(
        // Same row treatment as MenuItem (ui/menu.tsx) — an option here is the same kind of row,
        // just backed by ListBoxItem. cursor-pointer/select-none: it's a <div>, not a <button>.
        'flex h-10 cursor-pointer items-center justify-between gap-2 pt-2 pr-3 pb-2 pl-2.5 text-text-sm font-regular text-primary outline-none select-none',
        'data-focused:bg-primary-hover',
        'data-selected:font-semibold',
        'data-disabled:text-disabled',
        className,
      )}
    >
      {({ isSelected, isDisabled }) => (
        <>
          {children as ReactNode}
          {isSelected ? (
            <CheckIcon
              aria-hidden="true"
              className={cn('size-3 shrink-0 stroke-current', isDisabled ? 'fg-disabled' : 'fg-brand-primary')}
              fill="none"
              strokeWidth={2}
            />
          ) : null}
        </>
      )}
    </ListBoxItem>
  )
}
