import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  adminStorageApi,
  auditLogsApi,
  taskRatesApi,
  type AdminTaskRateInput,
} from "@/shared/api/admin";
import { extractErrorMessage } from "@/shared/api";

export function useTaskRates() {
  return useQuery({
    queryKey: ["admin", "task-rates"],
    queryFn: taskRatesApi.list,
  });
}

export function useCreateTaskRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminTaskRateInput) => taskRatesApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "task-rates"] });
      toast.success("Task rate created");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useUpdateTaskRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AdminTaskRateInput> }) =>
      taskRatesApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "task-rates"] });
      toast.success("Task rate updated");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useUpdateTaskRateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      taskRatesApi.updateStatus(id, isActive),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "task-rates"] });
      toast.success("Task rate status updated");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useAuditLogs(filters: {
  action?: string;
  actorId?: string;
  targetId?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["admin", "audit-logs", filters],
    queryFn: () => auditLogsApi.list(filters),
  });
}

export function useReconcileFiles() {
  return useMutation({
    mutationFn: adminStorageApi.reconcile,
    onSuccess: () => toast.success("Storage reconciliation finished"),
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}
