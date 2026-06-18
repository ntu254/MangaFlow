import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { payrollApi } from "@/features/payroll/services/payroll.api"

export function usePayrollEarnings() {
  return useQuery({
    queryKey: ["payroll", "earnings"],
    queryFn: async () => {
      const { data } = await payrollApi.listEarnings()
      return data.data
    },
  })
}

export function useMarkEarningPaid() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (earningId: string) => payrollApi.markPaid(earningId),
    onSuccess: () => {
      toast.success("Earning marked as paid")
      queryClient.invalidateQueries({ queryKey: ["payroll", "earnings"] })
    },
    onError: () => toast.error("Failed to mark earning as paid"),
  })
}
