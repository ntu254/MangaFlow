import { useQuery } from '@tanstack/react-query'
import { auditLogsApi, type AuditLogsParams } from '@/features/admin/services/audit.api'

export function useAuditLogs(params: AuditLogsParams) {
  return useQuery({
    queryKey: ['admin', 'audit-logs', params],
    queryFn: async () => {
      const { data } = await auditLogsApi.list(params)
      return data.data
    },
  })
}
