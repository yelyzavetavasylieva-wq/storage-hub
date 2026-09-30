import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Custom font-size scale from the Figma UI Kit (globals.css `@theme`). tailwind-merge can't tell
// `text-text-sm` (font-size) from `text-secondary` (color) apart — both look like `text-{word}` —
// and silently drops one when combined; listing them here keeps font-size in its own group.
// MUST stay in sync with the `--text-*` tokens in globals.css, or the collision resurfaces for the
// missing size — cn.test.ts parses globals.css and fails the build on drift, so this is CI-guarded,
// not memory-guarded.
export const FONT_SIZE_CLASSES = [
  'text-display-2xl',
  'text-display-xl',
  'text-display-lg',
  'text-display-md',
  'text-display-sm',
  'text-display-xs',
  'text-text-xl',
  'text-text-lg',
  'text-text-md',
  'text-text-sm',
  'text-text-xs',
  'text-tile-icon-xl',
  'text-tile-icon-lg',
  'text-tile-icon-md',
]

// width/height/grid-template-columns get no group here: no existing cn() call site combines a
// tile-size w-*/h-*/grid-cols-* class with a conflicting one of the same kind (verified when
// the tile-size tokens were added), so leaving them unmerged is a checked decision, not a gap.
const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: FONT_SIZE_CLASSES.map((c) => c.replace(/^text-/, '')) }],
      shadow: [{ shadow: ['row-divider'] }],
    },
  },
})

// Single class-name composer for all UI primitives: clsx resolves conditionals,
// tailwind-merge dedupes conflicting Tailwind utilities (last one wins).
export function cn(...inputs: ClassValue[]): string {
  return customTwMerge(clsx(inputs))
}
