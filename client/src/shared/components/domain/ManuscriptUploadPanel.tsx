import type { ChangeEvent } from "react"
import { MFCard } from "@/shared/components/ui/MFCard"
import { MFUploadBox } from "@/shared/components/ui/MFUploadBox"

export interface ManuscriptUploadPanelProps {
  title?: string
  description?: string
  constraints?: string[]
  accept?: string
  multiple?: boolean
  disabled?: boolean
  onFilesSelected?: (files: FileList) => void
}

export function ManuscriptUploadPanel({
  title = "Upload manuscript",
  description = "Attach the initial manuscript file for review.",
  constraints = [],
  accept,
  multiple = false,
  disabled = false,
  onFilesSelected,
}: ManuscriptUploadPanelProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files.length > 0) {
      onFilesSelected?.(event.target.files)
    }
  }

  return (
    <MFCard>
      <div className="mb-lg">
        <h2 className="text-title-lg text-on-surface">{title}</h2>
        <p className="mt-xs text-body-md text-on-surface-muted">{description}</p>
      </div>

      <MFUploadBox
        label="Select manuscript file"
        description="Drag and drop, or browse from your device."
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleChange}
      />

      {constraints.length > 0 ? (
        <div className="mt-lg rounded-xl bg-surface-low p-md">
          <h3 className="text-label-md text-on-surface">Upload constraints</h3>
          <ul className="mt-sm list-disc space-y-xs pl-lg text-body-md text-on-surface-muted">
            {constraints.map((constraint) => (
              <li key={constraint}>{constraint}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </MFCard>
  )
}
