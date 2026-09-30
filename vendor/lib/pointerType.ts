// Tracks the last pointer interaction's type — click/contextmenu events carry no pointerType, so
// this is the only way to tell touch-driven (e.g. a long-press some browsers surface as
// contextmenu) from a real mouse right-click. Plain module state, not a store: nothing needs to
// re-render, only synchronous reads inside handlers.
let lastPointerType: string | null = null

export function trackPointerType(event: { pointerType: string }): void {
  lastPointerType = event.pointerType
}

export function isLastPointerTouch(): boolean {
  return lastPointerType === 'touch'
}
