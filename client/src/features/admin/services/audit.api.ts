import { apiClient } from '@/shared/lib/axios'
import type { ApiResponse } from '@/shared/types'

export interface AuditActor {
  _id: string
  name?: string
  email?: string
}

export interface AuditLog {
  _id: string
  actorId?: string | AuditActor | null
  action: string
  targetId: string
  targetModel: string
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface AuditLogsPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface AuditLogsResponse {
  logs: AuditLog[]
  pagination: AuditLogsPagination
}

export interface AuditLogsParams {
  page?: number
  limit?: number
  action?: string
  actorId?: string
  targetId?: string
}

export const auditLogsApi = {
  list: (params: AuditLogsParams = {}) =>
    apiClient.get<ApiResponse<AuditLogsResponse>>('/admin/audit-logs', { params }),
}

export function auditActorName(log: AuditLog) {
  if (!log.actorId) return 'System'
  if (typeof log.actorId === 'string') return 'User'
  return log.actorId.name || log.actorId.email || 'User'
}

export function auditActorEmail(log: AuditLog) {
  if (!log.actorId || typeof log.actorId === 'string') return undefined
  return log.actorId.email
}

export function auditActorId(log: AuditLog) {
  if (!log.actorId) return undefined
  return typeof log.actorId === 'string' ? log.actorId : log.actorId._id
}
