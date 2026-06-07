import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import { cn } from "@/shared/lib/utils"
import { MFIconButton } from "./MFIconButton"

interface MFDialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",")

export function MFDialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: MFDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const previousActiveElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    closeButtonRef.current?.focus()

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }

    window.addEventListener("keydown", handleEscape)

    return () => {
      window.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = previousOverflow
      previousActiveElement?.focus()
    }
  }, [onClose, open])

  if (!open) return null

  function handleOverlayClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose()
  }

  function handleTabKey(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab" || !dialogRef.current) return

    const focusableElements = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    )
    if (focusableElements.length === 0) {
      event.preventDefault()
      return
    }

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    if (!firstElement || !lastElement) return

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-inverse-surface/30 p-md backdrop-blur-sm sm:items-center"
      onMouseDown={handleOverlayClick}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          "max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-3xl border border-outline-variant/30 bg-surface-lowest p-lg shadow-dropdown sm:p-xl",
          className,
        )}
        onKeyDown={handleTabKey}
      >
        <div className="flex items-start justify-between gap-md">
          <div className="min-w-0">
            <h2 id={titleId} className="text-headline-md text-on-surface">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-sm text-body-md text-on-surface-muted">
                {description}
              </p>
            ) : null}
          </div>
          <MFIconButton ref={closeButtonRef} aria-label={`Close ${title}`} onClick={onClose}>
            <span className="material-symbols-outlined" aria-hidden="true">
              close
            </span>
          </MFIconButton>
        </div>
        <div className="mt-lg">{children}</div>
        {footer ? (
          <div className="mt-xl flex flex-col-reverse gap-sm border-t border-outline-variant/30 pt-lg sm:flex-row sm:justify-end">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
