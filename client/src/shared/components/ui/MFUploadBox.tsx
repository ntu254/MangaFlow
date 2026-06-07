import { type InputHTMLAttributes, type DragEvent, forwardRef, useRef, useState } from "react"
import { cn } from "@/shared/lib/utils"

interface MFUploadBoxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> {
  label?: string
  description?: string
  accept?: string
  multiple?: boolean
}

export const MFUploadBox = forwardRef<HTMLInputElement, MFUploadBoxProps>(
  ({ className, label = "Upload files", description = "Drag & drop or click to browse", accept, multiple, disabled, ...props }, ref) => {
    const [isDragging, setIsDragging] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      if (!disabled) setIsDragging(true)
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
    }

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click()
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 transition-all duration-150",
          "focus-visible:outline-none focus-visible:shadow-focus",
          isDragging
            ? "border-primary bg-primary-container/30 shadow-ambient"
            : "border-outline-variant bg-surface-lowest hover:border-primary hover:bg-surface-low",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
        aria-disabled={disabled}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-primary">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v12m-4-4l4 4 4-4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
          </svg>
        </div>
        <p className="text-label-md font-semibold text-on-surface">{label}</p>
        <p className="mt-1 text-body-md text-on-surface-muted">{description}</p>
        <input
          ref={(node) => {
            inputRef.current = node
            if (typeof ref === "function") ref(node)
            else if (ref) ref.current = node
          }}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="hidden"
          {...props}
        />
      </div>
    )
  },
)

MFUploadBox.displayName = "MFUploadBox"
