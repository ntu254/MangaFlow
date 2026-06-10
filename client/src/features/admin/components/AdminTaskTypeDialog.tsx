import { useEffect, useState, type FormEvent } from "react"
import { MFButton, MFDialog, MFInput, MFTextarea } from "@/shared/components/ui"
import type { AdminTaskType, AdminTaskTypeInput } from "../api/admin.api"

interface AdminTaskTypeDialogProps {
  open: boolean
  submitting: boolean
  editingTaskType: AdminTaskType | null
  onClose: () => void
  onCreate: (input: AdminTaskTypeInput) => Promise<void>
  onUpdate: (taskTypeId: string, input: Omit<AdminTaskTypeInput, "name">) => Promise<void>
}

export function AdminTaskTypeDialog({ open, submitting, editingTaskType, onClose, onCreate, onUpdate }: AdminTaskTypeDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [baseRate, setBaseRate] = useState("0")

  useEffect(() => {
    if (!open) return
    setName(editingTaskType?.name ?? "")
    setDescription(editingTaskType?.description ?? "")
    setBaseRate(String(editingTaskType?.baseRate ?? 0))
  }, [editingTaskType, open])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedBaseRate = Number(baseRate)
    if (editingTaskType) {
      await onUpdate(editingTaskType.id, { description, baseRate: parsedBaseRate })
      return
    }
    await onCreate({ name, description, baseRate: parsedBaseRate })
  }

  return (
    <MFDialog
      open={open}
      onClose={onClose}
      title={editingTaskType ? "Edit task type" : "Create task type"}
      description="TaskType configuration controls future assignments. Existing task payroll uses the task snapshot, not later default changes."
    >
      <form className="space-y-md" onSubmit={(event) => void handleSubmit(event)}>
        <MFInput label="Name" value={name} onChange={(event) => setName(event.target.value)} disabled={Boolean(editingTaskType)} required />
        <MFTextarea label="Description" value={description} onChange={(event) => setDescription(event.target.value)} required />
        <MFInput label="Base rate" type="number" min={0} step={1} value={baseRate} onChange={(event) => setBaseRate(event.target.value)} required />
        <div className="flex flex-col-reverse gap-sm pt-md sm:flex-row sm:justify-end">
          <MFButton type="button" variant="ghost" onClick={onClose}>Cancel</MFButton>
          <MFButton type="submit" loading={submitting}>{editingTaskType ? "Save changes" : "Create task type"}</MFButton>
        </div>
      </form>
    </MFDialog>
  )
}

