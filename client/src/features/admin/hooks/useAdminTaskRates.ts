import { useCallback, useEffect, useMemo, useState } from "react"
import {
  listAdminTaskTypes,
  updateAdminTaskType,
  type AdminTaskType,
} from "../api/admin.api"

export function useAdminTaskRates() {
  const [taskTypes, setTaskTypes] = useState<AdminTaskType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [editingTaskType, setEditingTaskType] = useState<AdminTaskType | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const loadTaskRates = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await listAdminTaskTypes()
      if (!response.success || !response.data) {
        setError(response.message ?? "Could not load admin task rates.")
        setTaskTypes([])
        return
      }
      setTaskTypes(response.data)
    } catch {
      setError("Could not reach MangaFlow admin task rates API.")
      setTaskTypes([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadTaskRates() }, [loadTaskRates])

  const handleUpdateRate = useCallback(async (taskTypeId: string, baseRate: number) => {
    setSubmitting(true)
    setMessage("")
    try {
      const response = await updateAdminTaskType(taskTypeId, { baseRate })
      if (!response.success || !response.data) {
        setMessage(response.message ?? "Could not update task rate.")
        return
      }
      setTaskTypes((current) => current.map((taskType) => taskType.id === taskTypeId ? response.data! : taskType))
      setEditingTaskType(null)
      setMessage("Default rate updated for future task assignments.")
    } catch {
      setMessage("Could not reach MangaFlow admin task rates API.")
    } finally {
      setSubmitting(false)
    }
  }, [])

  const activeRateCount = useMemo(
    () => taskTypes.filter((taskType) => taskType.isActive).length,
    [taskTypes],
  )
  const zeroRateCount = useMemo(
    () => taskTypes.filter((taskType) => taskType.baseRate === 0).length,
    [taskTypes],
  )
  const averageBaseRate = useMemo(
    () => taskTypes.length ? Math.round(taskTypes.reduce((sum, taskType) => sum + taskType.baseRate, 0) / taskTypes.length) : 0,
    [taskTypes],
  )

  return {
    taskTypes,
    loading,
    error,
    message,
    editingTaskType,
    submitting,
    activeRateCount,
    zeroRateCount,
    averageBaseRate,
    loadTaskRates,
    setEditingTaskType,
    handleUpdateRate,
  }
}
