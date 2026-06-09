import { useCallback, useEffect, useMemo, useState } from "react"
import {
  createAdminUser,
  listAdminUsers,
  updateAdminUserRole,
  updateAdminUserStatus,
  type AdminCreateUserInput,
  type AdminUser,
  type AdminUserRole,
} from "../api/admin.api"

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState("")

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await listAdminUsers()
      if (!response.success || !response.data) {
        setError(response.message ?? "Could not load admin users.")
        setUsers([])
        return
      }
      setUsers(response.data)
    } catch {
      setError("Could not reach MangaFlow admin users API.")
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadUsers() }, [loadUsers])

  const handleCreateUser = useCallback(async (input: AdminCreateUserInput) => {
    setSubmitting(true)
    setMessage("")
    try {
      const response = await createAdminUser(input)
      if (!response.success || !response.data) {
        setMessage(response.message ?? "Could not create user.")
        return
      }
      setUsers((current) => [response.data!, ...current])
      setDialogOpen(false)
      setMessage("User created through backend Admin route.")
    } catch {
      setMessage("Could not reach MangaFlow admin users API.")
    } finally {
      setSubmitting(false)
    }
  }, [])

  const handleRoleChange = useCallback(async (userId: string, role: AdminUserRole) => {
    setUpdatingUserId(userId)
    setMessage("")
    try {
      const response = await updateAdminUserRole(userId, role)
      if (!response.success || !response.data) {
        setMessage(response.message ?? "Could not update role.")
        return
      }
      setUsers((current) => current.map((user) => user.id === userId ? response.data! : user))
      setMessage("User role updated. Existing tokens were revoked by backend service.")
    } catch {
      setMessage("Could not reach MangaFlow admin users API.")
    } finally {
      setUpdatingUserId("")
    }
  }, [])

  const handleStatusChange = useCallback(async (user: AdminUser) => {
    setUpdatingUserId(user.id)
    setMessage("")
    try {
      const response = await updateAdminUserStatus(user.id, !user.isActive)
      if (!response.success || !response.data) {
        setMessage(response.message ?? "Could not update user status.")
        return
      }
      setUsers((current) => current.map((item) => item.id === user.id ? response.data! : item))
      setMessage(response.message ?? "User status updated.")
    } catch {
      setMessage("Could not reach MangaFlow admin users API.")
    } finally {
      setUpdatingUserId("")
    }
  }, [])

  const activeCount = useMemo(() => users.filter((user) => user.isActive).length, [users])
  const suspendedCount = users.length - activeCount

  return { users, loading, error, message, dialogOpen, submitting, updatingUserId, activeCount, suspendedCount, setDialogOpen, loadUsers, handleCreateUser, handleRoleChange, handleStatusChange }
}
