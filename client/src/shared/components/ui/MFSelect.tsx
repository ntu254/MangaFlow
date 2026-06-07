import { forwardRef, useId, type SelectHTMLAttributes } from "react"
import { cn } from "@/shared/lib/utils"
import { getFieldDescriptionId, MFField } from "./MFField"

interface MFSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
  fieldClassName?: string
}

export const MFSelect = forwardRef<HTMLSelectElement, MFSelectProps>(
  (
    {
      className,
      fieldClassName,
      id,
      label,
      hint,
      error,
      required,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId()
    const controlId = id ?? generatedId

    return (
      <MFField
        className={fieldClassName}
        controlId={controlId}
        label={label}
        hint={hint}
        error={error}
        required={required}
      >
        <div className="relative">
          <select
            ref={ref}
            id={controlId}
            required={required}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={getFieldDescriptionId(controlId, hint, error)}
            className={cn(
              "min-h-11 w-full appearance-none rounded-xl border bg-surface-lowest px-md py-sm pr-xl text-body-md text-on-surface shadow-sm",
              "transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:shadow-focus",
              "disabled:cursor-not-allowed disabled:bg-surface-container disabled:text-on-surface-muted",
              error ? "border-error" : "border-outline-variant",
              className,
            )}
            {...props}
          >
            {children}
          </select>
          <span
            className="material-symbols-outlined pointer-events-none absolute right-md top-1/2 -translate-y-1/2 text-on-surface-muted"
            aria-hidden="true"
          >
            expand_more
          </span>
        </div>
      </MFField>
    )
  },
)

MFSelect.displayName = "MFSelect"
