import { type FormEvent, useMemo, useState } from "react"
import { MFButton, MFDialog, MFSelect } from "@/shared/components/ui"
import type { AdminBoardMember } from "../api/admin.api"

interface AdminBoardMembersDialogProps {
  open: boolean
  submitting: boolean
  members: AdminBoardMember[]
  onAddMember: (userId: string) => void
  onClose: () => void
}

export function AdminBoardMembersDialog({ open, submitting, members, onAddMember, onClose }: AdminBoardMembersDialogProps) {
  const [userId, setUserId] = useState("")

  const candidates = useMemo(
    () =>
      members.filter(
        (member) => member.role === "BOARD" && member.isActive && member.isUserActive && !member.isChair,
      ),
    [members],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!userId) return
    await onAddMember(userId)
    setUserId("")
  }

  return (
    <MFDialog
      open={open}
      onClose={onClose}
      title="Add Board member"
      description="Select an active BOARD user to add. The backend enforces valid BOARD membership and a single Board Chair."
    >
      <form className="space-y-md" onSubmit={(event) => void handleSubmit(event)}>
        <MFSelect label="Board user" value={userId} onChange={(event) => setUserId(event.target.value)} required>
          <option value="">Select active BOARD user</option>
          {candidates.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.name ?? member.email ?? member.userId}
            </option>
          ))}
        </MFSelect>
        <div className="flex flex-col-reverse gap-sm pt-md sm:flex-row sm:justify-end">
          <MFButton type="button" variant="ghost" onClick={onClose}>
            Cancel
          </MFButton>
          <MFButton type="submit" loading={submitting}>
            Add member
          </MFButton>
        </div>
      </form>
    </MFDialog>
  )
}
