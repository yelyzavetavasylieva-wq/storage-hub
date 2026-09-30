import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/cn'
import CheckCircleIcon from '@/assets/icons/check-circle.svg?react'
import CloseIcon from '@/assets/icons/close.svg?react'

export type ToastTone = 'success' | 'error'

// toast.custom, not toast.success/error: sonner positions the close button absolutely in a corner,
// but Figma wants it inline at the row end, vertically centered — easier to own the markup.
// Figma: 384×52, 16px padding, 12px gap, 12px radius, shadow-xs. Leading (16px) and close (12px)
// glyphs each sit in their own 20px frame to stay optically centered despite differing sizes.
function ToastCard({ id, tone, message }: { id: string | number; tone: ToastTone; message: string }) {
  return (
    <div
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border border-primary p-4 shadow-xs',
        tone === 'success' ? 'bg-success-primary' : 'bg-error-primary',
      )}
    >
      {tone === 'success' ? (
        <span className="flex size-5 shrink-0 items-center justify-center">
          <CheckCircleIcon aria-hidden="true" className="fg-success-primary size-4" />
        </span>
      ) : null}
      <p className="min-w-0 flex-1 text-text-sm text-secondary">{message}</p>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => toast.dismiss(id)}
        // Plain <button>, not RAC — so a plain `hover:`, and an explicit focus ring in place of the
        // UA outline this drops, since it's the only control a toast has.
        className="fg-quinary hover:fg-quaternary focus-visible:ring-brand flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm outline-none"
      >
        <CloseIcon aria-hidden="true" className="size-3" />
      </button>
    </div>
  )
}

// A determinate progress notification (Figma 4074-151521): a title above a filled bar + percentage,
// with an inline close. It owns a rAF loop that drives the bar 0→100% over `durationMs`, then fires
// `onComplete` and dismisses itself. Dismissing early (the close button) unmounts the card, which
// cancels the loop so `onComplete` never runs — closing the toast cancels the operation.
function ProgressCard({
  id,
  title,
  durationMs,
  onComplete,
}: {
  id: string | number
  title: string
  durationMs: number
  onComplete?: () => void
}) {
  const [pct, setPct] = useState(0)
  // Keep the latest callback without re-arming the loop if the render function re-runs.
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    const start = performance.now()
    let raf = 0
    let finished = false
    const tick = (now: number) => {
      const p = Math.min(100, Math.round(((now - start) / durationMs) * 100))
      setPct(p)
      if (p < 100) {
        raf = requestAnimationFrame(tick)
      } else if (!finished) {
        finished = true
        onCompleteRef.current?.()
        toast.dismiss(id)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [durationMs, id])

  return (
    <div className="flex w-full items-start gap-3 rounded-xl border border-secondary bg-primary p-4 shadow-lg">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-text-sm font-semibold text-primary">{title}</p>
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-tertiary">
            <div className="h-full rounded-full bg-brand-solid transition-[width] duration-100 ease-linear" style={{ width: `${pct}%` }} />
          </div>
          <span className="shrink-0 text-text-sm font-medium text-secondary tabular-nums">{pct}%</span>
        </div>
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => toast.dismiss(id)}
        className="fg-quinary hover:fg-quaternary focus-visible:ring-brand flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm outline-none"
      >
        <CloseIcon aria-hidden="true" className="size-3" />
      </button>
    </div>
  )
}

// An error usually carries the server's own reason for the failure and is the only place the user
// will ever see it, so it gets more than sonner's 4s default to read it in. A success toast is
// pure confirmation of something they just watched happen — the default is plenty.
const ERROR_DURATION_MS = 10_000

// The app's one toast entry point. Prefer this over calling sonner's toast.success/error directly,
// so every notification carries the same chrome.
export const notify = {
  success: (message: string) => toast.custom((id) => <ToastCard id={id} tone="success" message={message} />),
  // Announced politely, like every other toast: sonner hardcodes aria-live="polite" on its one
  // container and offers no per-toast override, so an assertive error would mean a second live
  // region of our own and a double announcement.
  error: (message: string) =>
    toast.custom((id) => <ToastCard id={id} tone="error" message={message} />, { duration: ERROR_DURATION_MS }),
  // A determinate progress notification that runs to 100% then calls onComplete (e.g. to fire the
  // real action + a success toast). Pinned open (duration Infinity) — it dismisses itself on finish.
  progress: (title: string, opts?: { durationMs?: number; onComplete?: () => void }) =>
    toast.custom(
      (id) => <ProgressCard id={id} title={title} durationMs={opts?.durationMs ?? 2200} onComplete={opts?.onComplete} />,
      { duration: Infinity },
    ),
}
