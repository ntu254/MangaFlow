import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateAdminTaskType } from '@/hooks/useAdmin'

export function CreateTaskTypeDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [baseRate, setBaseRate] = useState('0')
  const createTaskType = useCreateAdminTaskType()

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    createTaskType.mutate({ name, description, baseRate: Number(baseRate) }, {
      onSuccess: () => {
        setName('')
        setDescription('')
        setBaseRate('0')
        setOpen(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-10 bg-purple-600 hover:bg-purple-700 text-white gap-2">
          <Plus size={16} /> Create Task Type
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Create task type</DialogTitle>
            <DialogDescription>Add a production task type through the backend admin API.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="task-type-name">Name</Label>
            <Input id="task-type-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-type-description">Description</Label>
            <Textarea id="task-type-description" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-type-rate">Base rate</Label>
            <Input id="task-type-rate" type="number" min="0" value={baseRate} onChange={(e) => setBaseRate(e.target.value)} required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createTaskType.isPending}>{createTaskType.isPending ? 'Creating...' : 'Create task type'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
