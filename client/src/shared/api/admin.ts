import { api, unwrap } from "./_client";

export interface AdminTaskRate {
  id: string;
  name: string;
  code: string;
  description?: string;
  baseRate: number;
  currency?: string;
  isActive: boolean;
  allowRegionTask?: boolean;
  allowPageTask?: boolean;
  requiresFileSubmission?: boolean;
  requiresTextSubmission?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminTaskRateInput {
  name: string;
  code: string;
  description?: string;
  baseRate: number;
  currency?: string;
  isActive?: boolean;
  allowRegionTask?: boolean;
  allowPageTask?: boolean;
  requiresFileSubmission?: boolean;
  requiresTextSubmission?: boolean;
  sortOrder?: number;
}

export const taskRatesApi = {
  list: () => api.get("/admin/task-types").then(unwrap<AdminTaskRate[]>),
  create: (body: AdminTaskRateInput) =>
    api.post("/admin/task-types", body).then(unwrap<AdminTaskRate>),
  update: (taskTypeId: string, body: Partial<AdminTaskRateInput>) =>
    api.patch(`/admin/task-types/${taskTypeId}`, body).then(unwrap<AdminTaskRate>),
  updateStatus: (taskTypeId: string, isActive: boolean) =>
    api.patch(`/admin/task-types/${taskTypeId}/status`, { isActive }).then(unwrap<AdminTaskRate>),
};

export interface StorageReconcileResult {
  checked?: number;
  unused?: number;
  missing?: number;
  [key: string]: unknown;
}

export const adminStorageApi = {
  reconcile: () => api.post("/admin/reconcile-files").then(unwrap<StorageReconcileResult>),
};

export interface AuditLogItem {
  _id: string;
  actorId?: string | { _id?: string; id?: string; name?: string; email?: string };
  action: string;
  targetId?: string;
  targetModel?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLogPage {
  logs: AuditLogItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const auditLogsApi = {
  list: (params?: {
    action?: string;
    actorId?: string;
    targetId?: string;
    page?: number;
    limit?: number;
  }) =>
    api.get("/admin/audit-logs", { params: { limit: 20, ...params } }).then(unwrap<AuditLogPage>),
};
