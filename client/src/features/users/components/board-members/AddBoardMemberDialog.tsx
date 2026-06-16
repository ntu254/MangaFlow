import { useState, type FormEvent } from 'react'
import { Button } from '@/shared/components/ui/button'
import { UserPlus } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { useAddAdminBoardMember, useAdminUsers } from '@/features/users/hooks/useAdminUsers'

export function AddBoardMemberDialog() {
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState('')
  const { data: users } = useAdminUsers()
  const addBoardMember = useAddAdminBoardMember()
  const boardUsers = users?.filter((user) => user.role === 'BOARD' && user.isActive) ?? []

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    addBoardMember.mutate(userId, {
      onSuccess: () => {
        setUserId('')
        setOpen(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-10 bg-purple-600 hover:bg-purple-700 text-white gap-2">
          <UserPlus size={16} /> Add Board Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add board member</DialogTitle>
            <DialogDescription>Only active users with BOARD role can become board members.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Board user</Label>
            <Select value={userId} onValueChange={setUserId} required>
              <SelectTrigger><SelectValue placeholder="Select active BOARD user" /></SelectTrigger>
              <SelectContent>
                {boardUsers.map((user) => <SelectItem key={user.id} value={user.id}>{user.name} - {user.email}</SelectItem>)}
              </SelectContent>
            </Select>
            {boardUsers.length === 0 && <p className="text-xs text-orange-500">Create or activate a BOARD user first.</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!userId || addBoardMember.isPending}>{addBoardMember.isPending ? 'Adding...' : 'Add member'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
