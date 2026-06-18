import { useMemo, useState, type FormEvent } from 'react'
import { UserPlus } from 'lucide-react'
import {
  useAddAdminBoardMember,
  useAdminBoardMembers,
  useAdminUsers,
} from '@/features/users/hooks/useAdminUsers'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'

export function AddBoardMemberDialog() {
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState('')
  const { data: users } = useAdminUsers()
  const { data: members = [] } = useAdminBoardMembers()
  const addBoardMember = useAddAdminBoardMember()
  const existingMemberIds = useMemo(() => new Set(members.map((member) => member.userId)), [members])
  const boardUsers = useMemo(
    () => users?.filter((user) => user.role === 'BOARD' && user.isActive && !existingMemberIds.has(user.id)) ?? [],
    [existingMemberIds, users],
  )

  const onOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) setUserId('')
  }

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="h-10 gap-2">
          <UserPlus size={16} /> Add member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add board member</DialogTitle>
            <DialogDescription>Only active users with BOARD role can become board members.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Board user</Label>
            <Select value={userId} onValueChange={setUserId} required>
              <SelectTrigger className="bg-secondary/50">
                <SelectValue placeholder="Select active BOARD user" />
              </SelectTrigger>
              <SelectContent>
                {boardUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} - {user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {boardUsers.length === 0 && (
              <p className="text-xs font-medium text-amber-700">
                Create or activate a BOARD user that is not already on the board.
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button type="button" variant="outline" disabled={addBoardMember.isPending} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!userId || addBoardMember.isPending}>
              {addBoardMember.isPending ? 'Adding...' : 'Add member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
