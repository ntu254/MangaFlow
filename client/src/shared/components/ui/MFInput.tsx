import { forwardRef, useId, type InputHTMLAttributes } from "react"
import { cn } from "@/shared/lib/utils"
import { getFieldDescriptionId, MFField } from "./MFField"

interface MFInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  fieldClassName?: string
}

export const MFInput = forwardRef<HTMLInputElement, MFInputProps>(
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
        <input
          ref={ref}
          id={controlId}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={getFieldDescriptionId(controlId, hint, error)}
          className={cn(
            "min-h-11 w-full rounded-xl border bg-surface-lowest px-md py-sm text-body-md text-on-surface shadow-sm",
            "placeholder:text-outline transition-colors",
            "focus-visible:border-primary focus-visible:outline-none focus-visible:shadow-focus",
            "disabled:cursor-not-allowed disabled:bg-surface-container disabled:text-on-surface-muted",
            error ? "border-error" : "border-outline-variant",
            className,
          )}
          {...props}
        />
      </MFField>
    )
  },
)

MFInput.displayName = "MFInput"
