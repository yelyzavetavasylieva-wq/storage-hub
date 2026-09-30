import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

export const badgeVariants = cva(
  // No text-center: centered overflow clips both edges, so ellipsis never shows.
  'inline-flex max-w-full items-center truncate rounded px-1.5 py-px text-left text-text-xs font-regular',
  {
    variants: {
      color: {
        neutral: 'bg-tertiary text-secondary',
        // text-*-primary doesn't clear WCAG AA 4.5:1 against these light *-secondary
        // backgrounds (2.41–4.01:1) — text-*-tertiary is calibrated to pass.
        brand: 'bg-brand-secondary text-brand-tertiary',
        success: 'bg-success-secondary text-success-tertiary',
        warning: 'bg-warning-secondary text-warning-tertiary',
        error: 'bg-error-secondary text-error-tertiary',
      },
    },
    defaultVariants: { color: 'neutral' },
  },
)

export interface BadgeProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'color' | 'dangerouslySetInnerHTML'>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ color, className, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ color }), className)} {...props} />
}
