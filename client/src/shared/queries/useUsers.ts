import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usersApi, type CreateUserInput, type ServerRole } from "@/shared/api";
import { extractErrorMessage } from "@/shared/api";
import { qk } from "./keys";

export function useUsers() {
  return useQuery({
    queryKey: qk.users.list(),
    queryFn: usersApi.list,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => usersApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.users.list() });
      toast.success("User created");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: ServerRole }) =>
      usersApi.updateRole(userId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.users.list() });
      toast.success("Role updated");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useUpdateUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      usersApi.updateStatus(userId, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.users.list() }),
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => usersApi.delete(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.users.list() });
      toast.success("User deleted");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}
