import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { taskApi } from "@/api/task"
import { submissionApi, type SubmitTaskInput } from "@/api/submission"

export function useAssistantTasks(userId: string | undefined) {
  return useQuery({
    queryKey: ["assistant", "tasks", userId],
    queryFn: async () => {
      if (!userId) return []
      const res = await taskApi.listByAssignee(userId)
      return res.data.data
    },
    enabled: !!userId,
  })
}

export function useAssistantTaskDetail(taskId: string | undefined) {
  return useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const res = await taskApi.get(taskId!)
      return res.data.data
    },
    enabled: !!taskId,
  })
}

export function useAssistantTaskSubmissions(taskId: string | undefined) {
  return useQuery({
    queryKey: ["task-submissions", taskId],
    queryFn: async () => {
      const res = await submissionApi.listByTask(taskId!)
      return res.data.data
    },
    enabled: !!taskId,
  })
}

export function useAssistantActions(taskId: string | undefined) {
  const queryClient = useQueryClient()

  const invalidate = async () => {
    if (taskId) {
      await queryClient.invalidateQueries({ queryKey: ["task", taskId] })
      await queryClient.invalidateQueries({ queryKey: ["task-submissions", taskId] })
    }
    await queryClient.invalidateQueries({ queryKey: ["assistant", "tasks"] })
  }

  const startTask = useMutation({
    mutationFn: () => taskApi.start(taskId!),
    onSuccess: () => {
      toast.success("Task started")
      void invalidate()
    },
    onError: () => toast.error("Failed to start task"),
  })

  const submitWork = useMutation({
    mutationFn: (input: SubmitTaskInput) => submissionApi.create(taskId!, input),
    onSuccess: () => {
      toast.success("Work submitted successfully")
      void invalidate()
    },
    onError: () => toast.error("Failed to submit work"),
  })

  return { startTask, submitWork }
}
