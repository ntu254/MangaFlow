import type { ReactNode } from "react"
import { cn } from "@/shared/lib/utils"

interface MFFieldProps {
  controlId: string
  label?: string
  required?: boolean
  hint?: string
  error?: string
  className?: string
  children: ReactNode
}

export function MFField({
  controlId,
  label,
  required,
  hint,
  error,
  className,
  children,
}: MFFieldProps) {
  return (
    <div className={cn("space-y-sm", className)}>
      {label ? (
        <label className="block text-label-md text-on-surface" htmlFor={controlId}>
          {label}
          {required ? (
            <span className="ml-xs text-error" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p id={`${controlId}-error`} className="text-label-sm text-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${controlId}-hint`} className="text-label-sm text-on-surface-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function getFieldDescriptionId(controlId: string, hint?: string, error?: string) {
  if (error) return `${controlId}-error`
  if (hint) return `${controlId}-hint`
  return undefined
}
