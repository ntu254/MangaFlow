import { useCallback, useEffect, useMemo, useState } from "react"
import {
  assignAdminBoardChair,
  createAdminBoardMember,
  listAdminBoardMembers,
  updateAdminBoardMemberStatus,
  type AdminBoardMember,
} from "../api/admin.api"

export function useAdminBoardMembers() {
  const [members, setMembers] = useState<AdminBoardMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState("")

  const loadMembers = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await listAdminBoardMembers()
      if (!response.success || !response.data) {
        setError(response.message ?? "Could not load board members.")
        setMembers([])
        return
      }
      setMembers(response.data)
    } catch {
      setError("Could not reach MangaFlow admin board members API.")
      setMembers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadMembers() }, [loadMembers])

  const handleCreateMember = useCallback(async (userId: string) => {
    setSubmitting(true)
    setMessage("")
    try {
      const response = await createAdminBoardMember(userId)
      if (!response.success || !response.data) {
        setMessage(response.message ?? "Could not add board member.")
        return
      }
      setMembers((current) => [response.data!, ...current])
      setDialogOpen(false)
      setMessage("Board member added. Backend enforced active BOARD user rules.")
    } catch {
      setMessage("Could not reach MangaFlow admin board members API.")
    } finally {
      setSubmitting(false)
    }
  }, [])

  const handleStatusChange = useCallback(async (member: AdminBoardMember) => {
    setUpdatingUserId(member.userId)
    setMessage("")
    try {
      const response = await updateAdminBoardMemberStatus(member.userId, !member.isActive)
      if (!response.success || !response.data) {
        setMessage(response.message ?? "Could not update board member status.")
        return
      }
      setMembers((current) => current.map((item) => item.userId === member.userId ? response.data! : item))
      setMessage(response.message ?? "Board member status updated.")
    } catch {
      setMessage("Could not reach MangaFlow admin board members API.")
    } finally {
      setUpdatingUserId("")
    }
  }, [])

  const handleAssignChair = useCallback(async (member: AdminBoardMember) => {
    setUpdatingUserId(member.userId)
    setMessage("")
    try {
      const response = await assignAdminBoardChair(member.userId)
      if (!response.success || !response.data) {
        setMessage(response.message ?? "Could not assign Board Chair.")
        return
      }
      setMembers((current) => current.map((item) => item.userId === member.userId ? response.data! : item))
      setMessage("Board Chair assigned. Backend enforces single-chair rules.")
    } catch {
      setMessage("Could not reach MangaFlow admin board members API.")
    } finally {
      setUpdatingUserId("")
    }
  }, [])

  const activeCount = useMemo(() => members.filter((member) => member.isActive).length, [members])
  const chair = useMemo(() => members.find((member) => member.isChair), [members])

  return {
    members,
    loading,
    error,
    message,
    dialogOpen,
    submitting,
    updatingUserId,
    activeCount,
    chair,
    setDialogOpen,
    loadMembers,
    handleCreateMember,
    handleStatusChange,
    handleAssignChair,
  }
}
