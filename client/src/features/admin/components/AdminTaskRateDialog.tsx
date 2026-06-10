import { useEffect, useState, type FormEvent } from "react"
import { MFButton, MFDialog, MFInput } from "@/shared/components/ui"
import type { AdminTaskType } from "../api/admin.api"

interface AdminTaskRateDialogProps {
  taskType: AdminTaskType | null
  submitting: boolean
  onClose: () => void
  onUpdate: (taskTypeId: string, baseRate: number) => Promise<void>
}

export function AdminTaskRateDialog({ taskType, submitting, onClose, onUpdate }: AdminTaskRateDialogProps) {
  const [baseRate, setBaseRate] = useState("0")

  useEffect(() => {
    setBaseRate(String(taskType?.baseRate ?? 0))
  }, [taskType])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!taskType) return
    await onUpdate(taskType.id, Number(baseRate))
  }

  return (
    <MFDialog
      open={Boolean(taskType)}
      onClose={onClose}
      title="Edit default rate"
      description="Default rate changes affect future assignments only. Existing task payroll keeps the task snapshot."
    >
      <form className="space-y-md" onSubmit={(event) => void handleSubmit(event)}>
        <MFInput label="Task type" value={taskType?.name ?? ""} disabled />
        <MFInput label="Default base rate" type="number" min={0} step={1} value={baseRate} onChange={(event) => setBaseRate(event.target.value)} required />
        <div className="flex flex-col-reverse gap-sm pt-md sm:flex-row sm:justify-end">
          <MFButton type="button" variant="ghost" onClick={onClose}>Cancel</MFButton>
          <MFButton type="submit" loading={submitting}>Save rate</MFButton>
        </div>
      </form>
    </MFDialog>
  )
}
