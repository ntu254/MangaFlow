import { useState, type FormEvent } from 'react'
import type { AdminTaskType } from '@/api/admin'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateAdminTaskType } from '@/hooks/useAdmin'

interface EditTaskTypeDialogProps {
  taskType: AdminTaskType | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditTaskTypeDialog({ taskType, open, onOpenChange }: EditTaskTypeDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => onOpenChange(nextOpen)

  if (!taskType) {
    return <Dialog open={open} onOpenChange={handleOpenChange} />
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <EditTaskTypeDialogContent key={taskType.id} taskType={taskType} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function EditTaskTypeDialogContent({ taskType, onOpenChange }: { taskType: AdminTaskType; onOpenChange: (open: boolean) => void }) {
  const updateTaskType = useUpdateAdminTaskType()
  const [name, setName] = useState(() => taskType.name)
  const [description, setDescription] = useState(() => taskType.description)
  const [baseRate, setBaseRate] = useState(() => String(taskType.baseRate))
  const [error, setError] = useState('')

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()

    const parsedRate = Number(baseRate)
    if (!name.trim() || !description.trim()) {
      setError('Name and description are required.')
      return
    }
    if (!Number.isInteger(parsedRate) || parsedRate < 0) {
      setError('Base rate must be a non-negative whole number.')
      return
    }

    updateTaskType.mutate({
      taskTypeId: taskType.id,
      input: {
        name: name.trim(),
        description: description.trim(),
        baseRate: parsedRate,
      },
    }, {
      onSuccess: () => onOpenChange(false),
    })
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!updateTaskType.isPending) onOpenChange(nextOpen)
  }

  return (
    <DialogContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Edit task type</DialogTitle>
            <DialogDescription>Update the task type name, description, and default base rate.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="edit-task-type-name">Name</Label>
            <Input id="edit-task-type-name" value={name} onChange={(event) => { setName(event.target.value); setError('') }} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-task-type-description">Description</Label>
            <Textarea id="edit-task-type-description" value={description} onChange={(event) => { setDescription(event.target.value); setError('') }} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-task-type-rate">Base rate</Label>
            <Input id="edit-task-type-rate" type="number" min="0" value={baseRate} onChange={(event) => { setBaseRate(event.target.value); setError('') }} required />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={updateTaskType.isPending}>Cancel</Button>
            <Button type="submit" disabled={updateTaskType.isPending}>{updateTaskType.isPending ? 'Saving...' : 'Save changes'}</Button>
          </DialogFooter>
        </form>
    </DialogContent>
  )
}
