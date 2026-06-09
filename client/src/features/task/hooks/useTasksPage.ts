import { useCallback, useEffect, useMemo, useState } from "react"
import { useAuth } from "@/shared/components/auth"
import { listTaskTypes, listTasksByAssignee, type Task, type TaskTypeRef } from "../api/task.api"
import type { CreateTaskFormValues, CreateTaskSelectOption } from "../components"
import { toActionItems, toContextPages, toTaskRows } from "../utils/task-page.mappers"

const assistantOptions: CreateTaskSelectOption[] = [
  { id: "assistant-view", label: "Assistant view" },
  { id: "nari-ito", label: "Nari Ito" },
]

export function useTasksPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [tasksError, setTasksError] = useState("")
  const [taskTypes, setTaskTypes] = useState<TaskTypeRef[]>([])
  const [taskTypesLoading, setTaskTypesLoading] = useState(false)
  const [taskTypesError, setTaskTypesError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [previewTask, setPreviewTask] = useState<CreateTaskFormValues | null>(null)

  const loadTasks = useCallback(async () => {
    if (!user) {
      setTasks([])
      setTasksLoading(false)
      return
    }

    setTasksLoading(true)
    setTasksError("")
    try {
      const response = await listTasksByAssignee(user.id)
      if (!response.success || !response.data) {
        setTasksError(response.message ?? "Could not load assigned tasks.")
        setTasks([])
        return
      }
      setTasks(response.data)
    } catch {
      setTasksError("Could not reach MangaFlow tasks API.")
      setTasks([])
    } finally {
      setTasksLoading(false)
    }
  }, [user])

  const loadTaskTypes = useCallback(async () => {
    setTaskTypesLoading(true)
    setTaskTypesError("")
    try {
      const response = await listTaskTypes(true)
      if (!response.success || !response.data) {
        setTaskTypesError(response.message ?? "Could not load task types.")
        setTaskTypes([])
        return
      }
      setTaskTypes(response.data)
    } catch {
      setTaskTypesError("Could not reach MangaFlow task type API.")
      setTaskTypes([])
    } finally {
      setTaskTypesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading) {
      void loadTasks()
      void loadTaskTypes()
    }
  }, [authLoading, loadTasks, loadTaskTypes])

  const handleCreateTask = useCallback((values: CreateTaskFormValues) => {
    setPreviewTask(values)
    setDialogOpen(false)
  }, [])

  const currentUserLabel = user?.name ?? "Current user"
  const taskRows = useMemo(() => toTaskRows(tasks, currentUserLabel), [tasks, currentUserLabel])
  const pendingActions = useMemo(() => toActionItems(tasks), [tasks])
  const featuredTask = tasks[0] ?? null
  const contextPages = useMemo(() => toContextPages(featuredTask), [featuredTask])
  const taskTypeOptions = useMemo(
    () => taskTypes.map((taskType) => ({
      id: taskType.id ?? taskType._id ?? taskType.name ?? "task-type",
      label: taskType.name ?? "Task type",
      disabled: taskType.isActive === false,
    })),
    [taskTypes],
  )

  return {
    authLoading,
    tasksLoading,
    tasksError,
    taskTypesLoading,
    taskTypesError,
    dialogOpen,
    previewTask,
    featuredTask,
    taskRows,
    pendingActions,
    contextPages,
    taskTypeOptions,
    assistantOptions,
    currentUserLabel,
    setDialogOpen,
    handleCreateTask,
    loadTasks,
    loadTaskTypes,
  }
}
