import { useState } from 'react'
import type { AdminUser } from '@/api/admin'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateAdminUser } from '@/hooks/useAdmin'

const roles = ['ADMIN', 'MANGAKA', 'ASSISTANT', 'EDITOR', 'BOARD']
const teams = ['Editorial', 'Production', 'Management', 'Art', 'Writing']

interface EditUserDialogProps {
  user: AdminUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditUserDialog({ user, open, onOpenChange }: EditUserDialogProps) {
  if (!user) {
    return <Dialog open={open} onOpenChange={onOpenChange} />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <EditUserDialogContent key={user.id} user={user} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function getInitialFormData(user: AdminUser) {
  return {
    name: user.name ?? '',
    email: user.email ?? '',
    displayName: user.displayName ?? user.name ?? '',
    team: user.team ?? '',
    role: user.role ?? '',
    status: user.isActive ? 'Active' : 'Suspended',
    notes: user.notes ?? '',
  }
}

function EditUserDialogContent({ user, onOpenChange }: { user: AdminUser; onOpenChange: (open: boolean) => void }) {
  const updateUser = useUpdateAdminUser()
  const [formData, setFormData] = useState(() => getInitialFormData(user))
  const [error, setError] = useState('')

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.displayName.trim() || !formData.team || !formData.role) {
      setError('Name, email, display name, team, and role are required.')
      return
    }

    updateUser.mutate({
      userId: user.id,
      input: {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        displayName: formData.displayName.trim(),
        team: formData.team,
        role: formData.role,
        isActive: formData.status === 'Active',
        notes: formData.notes.trim(),
      },
    }, {
      onSuccess: () => onOpenChange(false),
    })
  }

  return (
    <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update profile, role, team, and account status.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={formData.name} onChange={(event) => handleChange('name', event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={formData.email} onChange={(event) => handleChange('email', event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input value={formData.displayName} onChange={(event) => handleChange('displayName', event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Team</Label>
            <Select value={formData.team} onValueChange={(value) => handleChange('team', value)}>
              <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
              <SelectContent>
                {teams.map((team) => <SelectItem key={team} value={team}>{team}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={formData.role} onValueChange={(value) => handleChange('role', value)}>
              <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                {roles.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Internal Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(event) => handleChange('notes', event.target.value)}
              maxLength={1000}
              placeholder="Add onboarding or account notes..."
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={updateUser.isPending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={updateUser.isPending}>
            {updateUser.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
    </DialogContent>
  )
}
