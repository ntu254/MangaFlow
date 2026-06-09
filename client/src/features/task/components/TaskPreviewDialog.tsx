import { MFBadge, MFCard } from "@/shared/components/ui"
import type { CreateTaskFormValues } from "./CreateTaskDialog"

interface TaskPreviewDialogProps {
  previewTask: CreateTaskFormValues | null
}

export function TaskPreviewDialog({ previewTask }: TaskPreviewDialogProps) {
  if (!previewTask) return null

  return (
    <MFCard>
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <h2 className="text-title-lg text-on-surface">Local task preview</h2>
          <p className="mt-xs text-body-md text-on-surface-muted">Captured from the dialog only in browser state. No task was created.</p>
        </div>
        <MFBadge tone="neutral" size="md">Local only</MFBadge>
      </div>
      <dl className="mt-lg grid gap-md sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-surface-low p-md">
          <dt className="text-label-sm text-on-surface-muted">Title</dt>
          <dd className="mt-xs text-label-md text-on-surface">{previewTask.title || "Untitled task"}</dd>
        </div>
        <div className="rounded-xl bg-surface-low p-md">
          <dt className="text-label-sm text-on-surface-muted">Task type</dt>
          <dd className="mt-xs text-label-md text-on-surface">{previewTask.taskTypeId || "Not selected"}</dd>
        </div>
        <div className="rounded-xl bg-surface-low p-md">
          <dt className="text-label-sm text-on-surface-muted">Assistant</dt>
          <dd className="mt-xs text-label-md text-on-surface">{previewTask.assistantId || "Not selected"}</dd>
        </div>
        <div className="rounded-xl bg-surface-low p-md">
          <dt className="text-label-sm text-on-surface-muted">Priority</dt>
          <dd className="mt-xs text-label-md text-on-surface">{previewTask.priority}</dd>
        </div>
      </dl>
    </MFCard>
  )
}
