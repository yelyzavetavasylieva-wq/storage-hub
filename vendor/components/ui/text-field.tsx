import type { ReactNode, Ref } from 'react'
import {
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
  type ValidationResult,
  FieldError,
  Input,
  Label,
  Text,
} from 'react-aria-components'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

// Figma UI Kit input sizes: xs=32 (padding 4/12/4/10), sm=40 (8/12/8/10), md=44 (10/14/10/10) 
export const inputSizeVariants = cva('', {
  variants: {
    size: {
      xs: 'h-8 pt-1 pr-3 pb-1 pl-2.5',
      sm: 'h-10 pt-2 pr-3 pb-2 pl-2.5',
      md: 'h-11 pt-2.5 pr-3.5 pb-2.5 pl-2.5',
    },
  }, 
  defaultVariants: { size: 'sm' },
})

export interface TextFieldProps
  extends Omit<AriaTextFieldProps, 'className'>,
    VariantProps<typeof inputSizeVariants> {
  label?: string
  description?: ReactNode
  placeholder?: string
  className?: string
  inputClassName?: string
  /** Forwarded to the underlying `<input>` — e.g. for programmatic focus. */
  inputRef?: Ref<HTMLInputElement>
  /**
   * Text shown by `FieldError` below the input. `FieldError` only renders while
   * `isInvalid` is true — without this, react-aria has no error text to show
   * (it otherwise relies on native HTML constraint validation).
   */
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode)
}

export function TextField({
  label,
  description,
  placeholder,
  className,
  inputClassName,
  inputRef,
  errorMessage,
  size,
  ...props
}: TextFieldProps) {
  return (
    // Figma: Width is Fill (e.g. 432px in the "Rename file" dialog) — the field stretches
    // to its container, it isn't a fixed pixel width. w-full on both wrapper and Input.
    <AriaTextField {...props} className={cn('flex w-full flex-col gap-1.5', className)}>
      {/* Figma: label = Text sm/Semibold (14/20, weight 600), text-secondary (gray-700). */}
      {label ? (
        <Label className="text-text-sm font-semibold text-secondary">
          {label}
          {props.isRequired && <span className="ml-0.5 text-error-primary">*</span>}
        </Label>
      ) : null}
      <Input
        ref={inputRef}
        placeholder={placeholder}
        className={cn(
          // Figma — radius-md (6px): border-radius:6px, background var(--background-bg-primary).
          'w-full rounded-md border border-primary bg-primary text-text-md font-regular text-primary shadow-xs outline-none placeholder:text-placeholder',
          inputSizeVariants({ size }),
          // Focus is a halo effect (shadow-ring-brand), same as Button — not a plain ring-2.
          'data-focused:border-brand data-focused:ring-brand',
          // Invalid wins over the brand focus halo — the ring stays red while focused too.
          'data-invalid:border-error data-invalid:data-focused:ring-error',
          'data-disabled:bg-disabled data-disabled:text-disabled',
          inputClassName,
        )}
      />
      {/* Figma: description = Text sm/Regular (14/20, weight 400), text-tertiary (gray-600). */}
      {description ? (
        <Text slot="description" className="text-text-sm font-regular text-tertiary">
          {description}
        </Text>
      ) : null}
      <FieldError className="text-text-xs font-regular text-error-primary">{errorMessage}</FieldError>
    </AriaTextField>
  )
}
