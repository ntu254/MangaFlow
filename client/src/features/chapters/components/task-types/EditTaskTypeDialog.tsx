import { useState, type FormEvent } from 'react'
import type { AdminTaskType } from '@/features/chapters/services/task-types.api'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { useUpdateAdminTaskType } from '@/features/chapters/hooks/useAdminTaskTypes'

interface EditTaskTypeDialogProps {
  taskType: AdminTaskType | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: (taskType: AdminTaskType) => void
}

function makeCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80)
}

export function EditTaskTypeDialog({ taskType, open, onOpenChange, onSaved }: EditTaskTypeDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => onOpenChange(nextOpen)

  if (!taskType) {
    return <Dialog open={open} onOpenChange={handleOpenChange} />
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <EditTaskTypeDialogContent key={taskType.id} taskType={taskType} onOpenChange={onOpenChange} onSaved={onSaved} />
    </Dialog>
  )
}

function EditTaskTypeDialogContent({
  taskType,
  onOpenChange,
  onSaved,
}: {
  taskType: AdminTaskType
  onOpenChange: (open: boolean) => void
  onSaved?: (taskType: AdminTaskType) => void
}) {
  const updateTaskType = useUpdateAdminTaskType()
  const [name, setName] = useState(() => taskType.name)
  const [code, setCode] = useState(() => taskType.code)
  const [description, setDescription] = useState(() => taskType.description ?? '')
  const [baseRate, setBaseRate] = useState(() => String(taskType.baseRate))
  const [currency, setCurrency] = useState<'POINT' | 'VND'>(() => taskType.currency)
  const [allowPageTask, setAllowPageTask] = useState(() => taskType.allowPageTask)
  const [allowRegionTask, setAllowRegionTask] = useState(() => taskType.allowRegionTask)
  const [requiresFileSubmission, setRequiresFileSubmission] = useState(() => taskType.requiresFileSubmission)
  const [requiresTextSubmission, setRequiresTextSubmission] = useState(() => taskType.requiresTextSubmission)
  const [sortOrder, setSortOrder] = useState(() => String(taskType.sortOrder ?? 0))
  const [error, setError] = useState('')

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()

    const parsedRate = Number(baseRate)
    const parsedSortOrder = Number(sortOrder)
    const normalizedCode = makeCode(code)

    if (!name.trim() || !normalizedCode) {
      setError('Name and code are required.')
      return
    }
    if (!Number.isInteger(parsedRate) || parsedRate < 0) {
      setError('Base rate must be a non-negative whole number.')
      return
    }
    if (!Number.isInteger(parsedSortOrder)) {
      setError('Sort order must be a whole number.')
      return
    }

    updateTaskType.mutate({
      taskTypeId: taskType.id,
      input: {
        name: name.trim(),
        code: normalizedCode,
        description: description.trim() || undefined,
        baseRate: parsedRate,
        currency,
        allowPageTask,
        allowRegionTask,
        requiresFileSubmission,
        requiresTextSubmission,
        sortOrder: parsedSortOrder,
      },
    }, {
      onSuccess: (response) => {
        onSaved?.(response.data.data)
        onOpenChange(false)
      },
    })
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!updateTaskType.isPending) onOpenChange(nextOpen)
  }

  return (
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Edit task type</DialogTitle>
            <DialogDescription>Update identity, payment, and submission rules.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-task-type-name">Name</Label>
              <Input id="edit-task-type-name" value={name} onChange={(event) => { setName(event.target.value); setError('') }} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-task-type-code">Code</Label>
              <Input id="edit-task-type-code" value={code} onChange={(event) => { setCode(makeCode(event.target.value)); setError('') }} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-task-type-description">Description</Label>
            <Textarea id="edit-task-type-description" value={description} onChange={(event) => { setDescription(event.target.value); setError('') }} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="edit-task-type-rate">Base rate</Label>
              <Input id="edit-task-type-rate" type="number" min="0" value={baseRate} onChange={(event) => { setBaseRate(event.target.value); setError('') }} required />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={(value) => setCurrency(value as 'POINT' | 'VND')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="POINT">POINT</SelectItem>
                  <SelectItem value="VND">VND</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-task-type-sort">Sort order</Label>
              <Input id="edit-task-type-sort" type="number" value={sortOrder} onChange={(event) => { setSortOrder(event.target.value); setError('') }} />
            </div>
          </div>
          <div className="grid gap-3 rounded-lg border border-border bg-secondary/40 p-3 sm:grid-cols-2">
            <CapabilityToggle label="Page task" checked={allowPageTask} onCheckedChange={setAllowPageTask} />
            <CapabilityToggle label="Region task" checked={allowRegionTask} onCheckedChange={setAllowRegionTask} />
            <CapabilityToggle label="Requires file" checked={requiresFileSubmission} onCheckedChange={setRequiresFileSubmission} />
            <CapabilityToggle label="Requires text" checked={requiresTextSubmission} onCheckedChange={setRequiresTextSubmission} />
          </div>
          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={updateTaskType.isPending}>Cancel</Button>
            <Button type="submit" disabled={updateTaskType.isPending}>{updateTaskType.isPending ? 'Saving...' : 'Save changes'}</Button>
          </DialogFooter>
        </form>
    </DialogContent>
  )
}

function CapabilityToggle({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-foreground hover:bg-card">
      <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} />
      {label}
    </label>
  )
}
