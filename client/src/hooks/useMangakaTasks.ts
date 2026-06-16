import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { taskApi, type CreateTaskInput } from "@/api/task"
import { adminTaskTypesApi } from "@/api/admin"
import { teamApi } from "@/api/team"
import { toast } from "sonner"

export function useCreateTask(seriesId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateTaskInput) => taskApi.create(input),
    onSuccess: () => {
      toast.success("Task assigned successfully")
      queryClient.invalidateQueries({ queryKey: ["tasks", "series", seriesId] })
      queryClient.invalidateQueries({ queryKey: ["series", seriesId, "summary"] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to assign task")
    },
  })
}

export function useTaskTypes() {
  return useQuery({
    queryKey: ["task-types"],
    queryFn: async () => {
      const { data } = await adminTaskTypesApi.list()
      // Filter active task types
      return data.data.filter((type) => type.isActive)
    },
  })
}

export function useEligibleAssistants(seriesId: string) {
  return useQuery({
    queryKey: ["series", seriesId, "eligible-assistants"],
    queryFn: async () => {
      const { data } = await teamApi.getEligibleAssistants(seriesId)
      return data.data
    },
    enabled: !!seriesId,
  })
}
