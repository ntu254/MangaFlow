import { StatusBadge } from "@/shared/components/domain"
import { MFButton, MFBadge, MFTable, type MFTableColumn } from "@/shared/components/ui"
import { payrollStatusUI } from "@/shared/lib/status-ui"
import type { AdminPayrollEarning } from "../api/admin.api"
import { earningKey } from "../hooks/useAdminPayroll"

interface AdminPayrollTableProps {
  earnings: AdminPayrollEarning[]
  loading: boolean
  updatingEarningId: string
  onConfirm: (earning: AdminPayrollEarning) => void
  onMarkPaid: (earning: AdminPayrollEarning) => void
}

export function AdminPayrollTable({ earnings, loading, updatingEarningId, onConfirm, onMarkPaid }: AdminPayrollTableProps) {
  return (
    <MFTable
      caption="Admin payroll earnings"
      rows={earnings}
      columns={payrollColumns({ updatingEarningId, onConfirm, onMarkPaid })}
      getRowKey={earningKey}
      loading={loading}
      emptyTitle="No payroll earnings found"
      emptyDescription="Backend-calculated assistant earnings will appear here after eligible task approval or rejection."
      tableClassName="min-w-[920px]"
    />
  )
}

interface PayrollColumnsInput {
  updatingEarningId: string
  onConfirm: (earning: AdminPayrollEarning) => void
  onMarkPaid: (earning: AdminPayrollEarning) => void
}

function payrollColumns({ updatingEarningId, onConfirm, onMarkPaid }: PayrollColumnsInput): MFTableColumn<AdminPayrollEarning>[] {
  return [
    {
      id: "task",
      header: "Task",
      cell: (earning) => (
        <div>
          <p className="break-all text-label-md text-on-surface">{earning.taskId}</p>
          <p className="mt-xs break-all text-label-sm text-on-surface-muted">Assistant {earning.assistantId}</p>
        </div>
      ),
    },
    {
      id: "amount",
      header: "Payment",
      cell: (earning) => (
        <div>
          <p className="text-label-md text-on-surface">{earning.finalPayment.toLocaleString()}</p>
          <p className="mt-xs text-label-sm text-on-surface-muted">
            {earning.baseRate.toLocaleString()} x {earning.deadlineMultiplier.toFixed(2)}
          </p>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (earning) => <StatusBadge status={earning.status} mapping={payrollStatusUI} size="md" />,
    },
    {
      id: "late",
      header: "Timing",
      cell: (earning) => earning.isLate ? <MFBadge tone="warning" size="sm">Late</MFBadge> : <MFBadge tone="success" size="sm">On track</MFBadge>,
    },
    {
      id: "calculated",
      header: "Calculated",
      cell: (earning) => earning.calculatedAt ? new Date(earning.calculatedAt).toLocaleDateString() : "Not supplied",
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      cell: (earning) => {
        const key = earningKey(earning)
        const isUpdating = updatingEarningId === key
        return (
          <div className="flex flex-wrap justify-end gap-sm">
            <MFButton type="button" variant="outline" size="sm" loading={isUpdating} disabled={earning.status !== "PENDING"} onClick={() => onConfirm(earning)}>
              Confirm
            </MFButton>
            <MFButton type="button" variant="outline" size="sm" loading={isUpdating} disabled={earning.status !== "CONFIRMED"} onClick={() => onMarkPaid(earning)}>
              Mark paid
            </MFButton>
          </div>
        )
      },
    },
  ]
}
