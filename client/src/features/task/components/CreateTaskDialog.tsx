import { useState, type FormEvent } from "react"
import { MFButton } from "@/shared/components/ui/MFButton"
import { MFDialog } from "@/shared/components/ui/MFDialog"
import { MFInput } from "@/shared/components/ui/MFInput"
import { MFSelect } from "@/shared/components/ui/MFSelect"
import { MFTextarea } from "@/shared/components/ui/MFTextarea"

export interface CreateTaskSelectOption {
  id: string
  label: string
  disabled?: boolean
}

export interface CreateTaskFormValues {
  title: string
  taskTypeId: string
  assistantId: string
  priority: string
  dueDate: string
  instructions: string
}

interface CreateTaskDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: CreateTaskFormValues) => void
  assistantOptions: CreateTaskSelectOption[]
  taskTypeOptions: CreateTaskSelectOption[]
  scopeLabel: string
  loading?: boolean
  error?: string
}

const priorityOptions: CreateTaskSelectOption[] = [
  { id: "LOW", label: "Low Priority" },
  { id: "NORMAL", label: "Normal Priority" },
  { id: "HIGH", label: "High Priority" },
  { id: "URGENT", label: "Urgent" },
]

const defaultValues: CreateTaskFormValues = {
  title: "",
  taskTypeId: "",
  assistantId: "",
  priority: "NORMAL",
  dueDate: "",
  instructions: "",
}

export function CreateTaskDialog({
  open,
  onClose,
  onSubmit,
  assistantOptions,
  taskTypeOptions,
  scopeLabel,
  loading = false,
  error,
}: CreateTaskDialogProps) {
  const [values, setValues] = useState<CreateTaskFormValues>(defaultValues)

  function updateValue(field: keyof CreateTaskFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit(values)
  }

  return (
    <MFDialog
      open={open}
      onClose={onClose}
      title="Create task"
      description={`Assign work for ${scopeLabel}.`}
      footer={
        <>
          <MFButton type="button" variant="outline" disabled={loading} onClick={onClose}>
            Cancel
          </MFButton>
          <MFButton type="submit" form="create-task-form" loading={loading}>
            Create task
          </MFButton>
        </>
      }
    >
      <form id="create-task-form" className="space-y-lg" onSubmit={handleSubmit}>
        <MFInput
          label="Task title"
          required
          value={values.title}
          disabled={loading}
          onChange={(event) => updateValue("title", event.target.value)}
          placeholder="Clean up background tones"
        />
        <div className="grid gap-md sm:grid-cols-2">
          <MFSelect
            label="Task type"
            required
            value={values.taskTypeId}
            disabled={loading}
            hint="Options are supplied by the task workflow."
            onChange={(event) => updateValue("taskTypeId", event.target.value)}
          >
            <option value="">Select task type</option>
            {taskTypeOptions.map((option) => (
              <option key={option.id} value={option.id} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </MFSelect>
          <MFSelect
            label="Assistant"
            required
            value={values.assistantId}
            disabled={loading}
            hint="Only caller-supplied Production Team assistants are shown."
            onChange={(event) => updateValue("assistantId", event.target.value)}
          >
            <option value="">Select assistant</option>
            {assistantOptions.map((option) => (
              <option key={option.id} value={option.id} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </MFSelect>
        </div>
        <div className="grid gap-md sm:grid-cols-2">
          <MFSelect
            label="Priority"
            required
            value={values.priority}
            disabled={loading}
            onChange={(event) => updateValue("priority", event.target.value)}
          >
            {priorityOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </MFSelect>
          <MFInput
            label="Due date"
            type="date"
            value={values.dueDate}
            disabled={loading}
            onChange={(event) => updateValue("dueDate", event.target.value)}
          />
        </div>
        <MFTextarea
          label="Instructions"
          value={values.instructions}
          disabled={loading}
          onChange={(event) => updateValue("instructions", event.target.value)}
          placeholder="Describe the requested page or region work."
        />
        {error ? (
          <p className="rounded-xl bg-error-container p-md text-body-md text-on-error-container" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </MFDialog>
  )
}
