import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  adminTaskTypesApi,
  type CreateTaskTypeInput,
  type UpdateTaskTypeInput,
} from "@/features/chapters/services/task-types.api"

function invalidateAdmin(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ["admin"] })
}

export function useAdminTaskTypes() {
  return useQuery({
    queryKey: ["admin", "task-types"],
    queryFn: async () => {
      const { data } = await adminTaskTypesApi.list()
      return data.data
    },
  })
}

export function useCreateAdminTaskType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTaskTypeInput) => adminTaskTypesApi.create(input),
    onSuccess: () => {
      toast.success("Task type created")
      invalidateAdmin(queryClient)
    },
    onError: () => toast.error("Failed to create task type"),
  })
}

export function useUpdateAdminTaskType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ taskTypeId, input }: { taskTypeId: string; input: UpdateTaskTypeInput }) =>
      adminTaskTypesApi.update(taskTypeId, input),
    onSuccess: () => {
      toast.success("Task type updated")
      invalidateAdmin(queryClient)
    },
    onError: () => toast.error("Failed to update task type"),
  })
}

export function useUpdateAdminTaskTypeStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ taskTypeId, isActive }: { taskTypeId: string; isActive: boolean }) =>
      adminTaskTypesApi.updateStatus(taskTypeId, { isActive }),
    onSuccess: () => {
      toast.success("Task type status updated")
      invalidateAdmin(queryClient)
    },
    onError: () => toast.error("Failed to update task type status"),
  })
}

export function useDeleteAdminTaskType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (taskTypeId: string) => adminTaskTypesApi.delete(taskTypeId),
    onSuccess: () => {
      toast.success("Task type deleted")
      invalidateAdmin(queryClient)
    },
    onError: () => toast.error("Failed to delete task type"),
  })
}
