import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import axios from "axios"
import { adminBoardApi, adminTaskTypesApi, adminUsersApi, type CreateTaskTypeInput, type CreateUserInput, type UpdateTaskTypeInput, type UpdateUserInput } from "@/api/admin"
import { dashboardApi } from "@/api/dashboard"

function invalidateAdmin(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ["admin"] })
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError<{ message?: string }>(error)) return fallback
  return error.response?.data?.message || fallback
}

export function useAdminDashboardSummary() {
  return useQuery({
    queryKey: ["admin", "dashboard-summary"],
    queryFn: async () => {
      const { data } = await dashboardApi.getAdminSidebarSummary()
      return data.data
    },
  })
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data } = await adminUsersApi.list()
      return data.data
    },
  })
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateUserInput) => adminUsersApi.create(input),
    onSuccess: () => {
      toast.success("User created")
      invalidateAdmin(queryClient)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to create user")),
  })
}

export function useUpdateAdminUserRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      adminUsersApi.updateRole(userId, { role }),
    onSuccess: () => {
      toast.success("User role updated")
      invalidateAdmin(queryClient)
    },
    onError: () => toast.error("Failed to update user role"),
  })
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: UpdateUserInput }) =>
      adminUsersApi.update(userId, input),
    onSuccess: () => {
      toast.success("User updated")
      invalidateAdmin(queryClient)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to update user")),
  })
}

export function useUpdateAdminUserStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      adminUsersApi.updateStatus(userId, { isActive }),
    onSuccess: () => {
      toast.success("User status updated")
      invalidateAdmin(queryClient)
    },
    onError: () => toast.error("Failed to update user status"),
  })
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => adminUsersApi.delete(userId),
    onSuccess: () => {
      toast.success("User deleted")
      invalidateAdmin(queryClient)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to delete user")),
  })
}

export function useAdminBoardMembers() {
  return useQuery({
    queryKey: ["admin", "board-members"],
    queryFn: async () => {
      const { data } = await adminBoardApi.list()
      return data.data
    },
  })
}

export function useAddAdminBoardMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => adminBoardApi.add({ userId }),
    onSuccess: () => {
      toast.success("Board member added")
      invalidateAdmin(queryClient)
    },
    onError: () => toast.error("Failed to add board member"),
  })
}

export function useUpdateAdminBoardMemberStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      adminBoardApi.updateStatus(userId, { isActive }),
    onSuccess: () => {
      toast.success("Board member status updated")
      invalidateAdmin(queryClient)
    },
    onError: () => toast.error("Failed to update board member status"),
  })
}

export function useSetAdminBoardChair() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => adminBoardApi.setChair(userId, { isChair: true }),
    onSuccess: () => {
      toast.success("Board chair assigned")
      invalidateAdmin(queryClient)
    },
    onError: () => toast.error("Failed to assign board chair"),
  })
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

