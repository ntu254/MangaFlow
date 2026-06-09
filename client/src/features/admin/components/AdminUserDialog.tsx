import { useState, type FormEvent } from "react"
import { MFButton, MFDialog, MFInput, MFSelect } from "@/shared/components/ui"
import type { AdminCreateUserInput, AdminUserRole } from "../api/admin.api"
import { ADMIN_USER_ROLES } from "../utils/admin-users.mappers"

interface AdminUserDialogProps {
  open: boolean
  submitting: boolean
  onClose: () => void
  onSubmit: (input: AdminCreateUserInput) => Promise<void>
}

export function AdminUserDialog({ open, submitting, onClose, onSubmit }: AdminUserDialogProps) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<AdminUserRole>("MANGAKA")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit({ email, name, password, role })
    setEmail("")
    setName("")
    setPassword("")
    setRole("MANGAKA")
  }

  return (
    <MFDialog
      open={open}
      onClose={onClose}
      title="Create Admin-managed user"
      description="Backend Admin routes create users and enforce role validation. Sensitive workflow approvals remain outside Admin authority."
    >
      <form className="space-y-md" onSubmit={(event) => void handleSubmit(event)}>
        <MFInput label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <MFInput label="Name" value={name} onChange={(event) => setName(event.target.value)} required />
        <MFInput label="Initial password" type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required hint="At least 8 characters." />
        <MFSelect label="Role" value={role} onChange={(event) => setRole(event.target.value as AdminUserRole)} required>
          {ADMIN_USER_ROLES.map((item) => <option key={item} value={item}>{item}</option>)}
        </MFSelect>
        <div className="flex flex-col-reverse gap-sm pt-md sm:flex-row sm:justify-end">
          <MFButton type="button" variant="ghost" onClick={onClose}>Cancel</MFButton>
          <MFButton type="submit" loading={submitting}>Create user</MFButton>
        </div>
      </form>
    </MFDialog>
  )
}
