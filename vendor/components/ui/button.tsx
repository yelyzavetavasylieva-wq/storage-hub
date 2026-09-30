import { Children, type ReactNode, type Ref } from 'react'
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

export const buttonVariants = cva(
  // Figma: button label is weight 400 (regular) at every size — not semibold. Icon↔label flex gap is
  // 4px (spacing-xs); the label itself carries a 2px "Text padding" box, applied in Button below
  // (Figma 27-4975). Icons are 20px, the sm/40px button is the app-wide default.
  'inline-flex items-center justify-center gap-1 rounded-md font-regular whitespace-nowrap outline-none transition-colors data-disabled:pointer-events-none',
  {
    variants: {
      variant: {
        // Figma: Primary keeps its (barely-visible) border-tertiary in every state,
        // including Focused — the ring effect sits outside it, it doesn't replace it.
        primary:
          'border border-tertiary bg-brand-solid text-white data-hovered:bg-brand-solid-hover data-focus-visible:ring-brand data-disabled:border-disabled data-disabled:bg-disabled data-disabled:text-disabled',
        // Figma: Secondary disabled keeps its bg-primary (white) fill — only the
        // border (→ border-disabled) and text change. Do not swap the background.
        secondary:
          'border border-primary bg-primary text-secondary data-hovered:bg-primary-hover data-focus-visible:border-brand data-focus-visible:ring-brand data-disabled:border-disabled data-disabled:text-disabled',
        tertiary:
          'text-secondary data-hovered:bg-primary-hover data-focus-visible:ring-brand data-disabled:text-disabled',
        link: 'text-brand-links underline-offset-2 data-hovered:underline data-focus-visible:ring-brand data-disabled:text-disabled',
        // Disabled state mirrors primary's: same border/bg/text disabled tokens.
        destructive:
          'border border-tertiary bg-error-solid text-white data-hovered:bg-error-solid-hover data-focus-visible:ring-error data-disabled:border-disabled data-disabled:bg-disabled data-disabled:text-disabled',
      },
      // Figma UI Kit scale: xs 6/12px (h32), sm 8/12px (h40), md 10/14px (h44), lg 10/16px (h48),
      // xl 12/18px (h52) — each height is padding+text+padding. xs is the occasional 32px button
      // (e.g. the provider card's icon-only "+", Figma 5417-62269).
      size: {
        xs: 'h-8 py-1.5 px-3 text-text-sm',
        sm: 'h-10 py-2 px-3 text-text-md',
        md: 'h-11 py-2.5 px-3.5 text-text-md',
        lg: 'h-12 py-2.5 px-4 text-text-lg',
        xl: 'h-13 py-3 px-4.5 text-text-lg',
      },
      // Same height/py as the text sizes above — one scale, regardless of iconOnly.
      iconOnly: { true: 'aspect-square px-0', false: '' },
    },
    // sm (40px) is the standard, most-used button size across the app (matches TextField's own
    // default) — callers only need to name a size when they deliberately deviate from it.
    defaultVariants: { variant: 'primary', size: 'sm', iconOnly: false },
  },
)

export interface ButtonProps
  extends Omit<AriaButtonProps, 'className'>,
    VariantProps<typeof buttonVariants> {
  className?: string
  ref?: Ref<HTMLButtonElement>
  // When iconOnly is true there is no visible label — callers MUST supply
  // aria-label (or aria-labelledby) so screen readers can name the button.
  'aria-label'?: string
}

// Figma wraps the button label in a 2px-padded "Text padding" box (px-0.5) so text sits 2px inside
// the 4px flex gap and the button's own edge padding — iconless buttons read a touch wider, and an
// icon+label pair lands 6px apart. Icon children (elements) pass through untouched.
function withTextPadding(children: ReactNode): ReactNode {
  return Children.map(children, (child) =>
    typeof child === 'string' || typeof child === 'number' ? <span className="px-0.5">{child}</span> : child,
  )
}

export function Button({ variant, size, iconOnly, className, ref, children, ...props }: ButtonProps) {
  return (
    <AriaButton
      ref={ref}
      {...props}
      className={cn(buttonVariants({ variant, size, iconOnly }), className)}
    >
      {typeof children === 'function' ? children : withTextPadding(children)}
    </AriaButton>
  )
}
