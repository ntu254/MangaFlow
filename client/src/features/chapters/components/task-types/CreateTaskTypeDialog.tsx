import { useState, type FormEvent } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { useCreateAdminTaskType } from '@/features/chapters/hooks/useAdminTaskTypes'

function makeCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80)
}

export function CreateTaskTypeDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [codeTouched, setCodeTouched] = useState(false)
  const [description, setDescription] = useState('')
  const [baseRate, setBaseRate] = useState('0')
  const [currency, setCurrency] = useState<'POINT' | 'VND'>('POINT')
  const [allowPageTask, setAllowPageTask] = useState(true)
  const [allowRegionTask, setAllowRegionTask] = useState(true)
  const [requiresFileSubmission, setRequiresFileSubmission] = useState(true)
  const [requiresTextSubmission, setRequiresTextSubmission] = useState(false)
  const [sortOrder, setSortOrder] = useState('0')
  const [error, setError] = useState('')
  const createTaskType = useCreateAdminTaskType()

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

    createTaskType.mutate({
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
    }, {
      onSuccess: () => {
        setName('')
        setCode('')
        setCodeTouched(false)
        setDescription('')
        setBaseRate('0')
        setCurrency('POINT')
        setAllowPageTask(true)
        setAllowRegionTask(true)
        setRequiresFileSubmission(true)
        setRequiresTextSubmission(false)
        setSortOrder('0')
        setError('')
        setOpen(false)
      },
    })
  }

  const onNameChange = (value: string) => {
    setName(value)
    setError('')
    if (!codeTouched) setCode(makeCode(value))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-10 gap-2">
          <Plus size={16} /> Create task type
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Create task type</DialogTitle>
            <DialogDescription>Add a production task type and its submission rules.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="task-type-name">Name</Label>
              <Input id="task-type-name" value={name} onChange={(e) => onNameChange(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-type-code">Code</Label>
              <Input
                id="task-type-code"
                value={code}
                onChange={(e) => {
                  setCodeTouched(true)
                  setCode(makeCode(e.target.value))
                  setError('')
                }}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-type-description">Description</Label>
            <Textarea id="task-type-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="task-type-rate">Base rate</Label>
              <Input id="task-type-rate" type="number" min="0" value={baseRate} onChange={(e) => { setBaseRate(e.target.value); setError('') }} required />
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
              <Label htmlFor="task-type-sort">Sort order</Label>
              <Input id="task-type-sort" type="number" value={sortOrder} onChange={(e) => { setSortOrder(e.target.value); setError('') }} />
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
            <Button type="submit" disabled={createTaskType.isPending}>{createTaskType.isPending ? 'Creating...' : 'Create task type'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
