import { MFButton } from "@/shared/components/ui/MFButton"
import { MFIconCircle } from "@/shared/components/ui/MFIconCircle"

interface MFErrorStateProps {
  title?: string
  description?: string
  onRetry: () => void
}

export function MFErrorState({
  title = "Could not load this section",
  description = "Check your connection and try again.",
  onRetry,
}: MFErrorStateProps) {
  return (
    <div
      className="flex min-h-64 flex-col items-center justify-center rounded-3xl bg-error-container/40 p-xl text-center"
      role="alert"
    >
      <MFIconCircle variant="surface" size="lg" className="bg-error-container text-on-error-container">
        <span className="material-symbols-outlined text-[28px]" aria-hidden="true">
          error
        </span>
      </MFIconCircle>
      <h3 className="mt-md text-title-lg text-on-surface">{title}</h3>
      <p className="mt-sm max-w-md text-body-md text-on-surface-muted">{description}</p>
      <MFButton className="mt-lg focus-visible:shadow-focus" variant="outline" onClick={onRetry}>
        Try again
      </MFButton>
    </div>
  )
}
