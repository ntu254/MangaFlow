import { useCallback, useEffect, useMemo, useState } from "react"
import {
  createAdminTaskType,
  deleteAdminTaskType,
  listAdminTaskTypes,
  updateAdminTaskType,
  updateAdminTaskTypeStatus,
  type AdminTaskType,
  type AdminTaskTypeInput,
  type AdminTaskTypeUpdateInput,
} from "../api/admin.api"

export function useAdminTaskTypes() {
  const [taskTypes, setTaskTypes] = useState<AdminTaskType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTaskType, setEditingTaskType] = useState<AdminTaskType | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [updatingTaskTypeId, setUpdatingTaskTypeId] = useState("")

  const loadTaskTypes = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await listAdminTaskTypes()
      if (!response.success || !response.data) {
        setError(response.message ?? "Could not load admin task types.")
        setTaskTypes([])
        return
      }
      setTaskTypes(response.data)
    } catch {
      setError("Could not reach MangaFlow admin task types API.")
      setTaskTypes([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadTaskTypes() }, [loadTaskTypes])

  const handleCreateTaskType = useCallback(async (input: AdminTaskTypeInput) => {
    setSubmitting(true)
    setMessage("")
    try {
      const response = await createAdminTaskType(input)
      if (!response.success || !response.data) {
        setMessage(response.message ?? "Could not create task type.")
        return
      }
      setTaskTypes((current) => [...current, response.data!].sort((a, b) => a.name.localeCompare(b.name)))
      setDialogOpen(false)
      setMessage("Task type created through backend Admin route.")
    } catch {
      setMessage("Could not reach MangaFlow admin task types API.")
    } finally {
      setSubmitting(false)
    }
  }, [])

  const handleUpdateTaskType = useCallback(async (taskTypeId: string, input: AdminTaskTypeUpdateInput) => {
    setSubmitting(true)
    setMessage("")
    try {
      const response = await updateAdminTaskType(taskTypeId, input)
      if (!response.success || !response.data) {
        setMessage(response.message ?? "Could not update task type.")
        return
      }
      setTaskTypes((current) => current.map((taskType) => taskType.id === taskTypeId ? response.data! : taskType))
      setEditingTaskType(null)
      setMessage("Task type updated.")
    } catch {
      setMessage("Could not reach MangaFlow admin task types API.")
    } finally {
      setSubmitting(false)
    }
  }, [])

  const handleStatusChange = useCallback(async (taskType: AdminTaskType) => {
    setUpdatingTaskTypeId(taskType.id)
    setMessage("")
    try {
      const response = await updateAdminTaskTypeStatus(taskType.id, !taskType.isActive)
      if (!response.success || !response.data) {
        setMessage(response.message ?? "Could not update task type status.")
        return
      }
      setTaskTypes((current) => current.map((item) => item.id === taskType.id ? response.data! : item))
      setMessage(response.message ?? "Task type status updated.")
    } catch {
      setMessage("Could not reach MangaFlow admin task types API.")
    } finally {
      setUpdatingTaskTypeId("")
    }
  }, [])

  const handleDeleteTaskType = useCallback(async (taskType: AdminTaskType) => {
    const confirmed = window.confirm(`Delete task type "${taskType.name}"? Used task types are deactivated by the backend instead of hard-deleted.`)
    if (!confirmed) return

    setUpdatingTaskTypeId(taskType.id)
    setMessage("")
    try {
      const response = await deleteAdminTaskType(taskType.id)
      if (!response.success) {
        setMessage(response.message ?? "Could not delete task type.")
        await loadTaskTypes()
        return
      }
      setTaskTypes((current) => current.filter((item) => item.id !== taskType.id))
      setMessage("Unused task type deleted.")
    } catch {
      setMessage("Could not reach MangaFlow admin task types API.")
    } finally {
      setUpdatingTaskTypeId("")
    }
  }, [loadTaskTypes])

  const activeCount = useMemo(() => taskTypes.filter((taskType) => taskType.isActive).length, [taskTypes])
  const inactiveCount = taskTypes.length - activeCount
  const averageBaseRate = useMemo(
    () => taskTypes.length ? Math.round(taskTypes.reduce((sum, taskType) => sum + taskType.baseRate, 0) / taskTypes.length) : 0,
    [taskTypes],
  )

  return {
    taskTypes,
    loading,
    error,
    message,
    dialogOpen,
    editingTaskType,
    submitting,
    updatingTaskTypeId,
    activeCount,
    inactiveCount,
    averageBaseRate,
    setDialogOpen,
    setEditingTaskType,
    loadTaskTypes,
    handleCreateTaskType,
    handleUpdateTaskType,
    handleStatusChange,
    handleDeleteTaskType,
  }
}

