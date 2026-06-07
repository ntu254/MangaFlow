import { forwardRef, useId, type TextareaHTMLAttributes } from "react"
import { cn } from "@/shared/lib/utils"
import { getFieldDescriptionId, MFField } from "./MFField"

interface MFTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
  fieldClassName?: string
}

export const MFTextarea = forwardRef<HTMLTextAreaElement, MFTextareaProps>(
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
      rows = 5,
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
        <textarea
          ref={ref}
          id={controlId}
          required={required}
          disabled={disabled}
          rows={rows}
          aria-invalid={error ? true : undefined}
          aria-describedby={getFieldDescriptionId(controlId, hint, error)}
          className={cn(
            "w-full resize-y rounded-xl border bg-surface-lowest px-md py-md text-body-md text-on-surface shadow-sm",
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

MFTextarea.displayName = "MFTextarea"
