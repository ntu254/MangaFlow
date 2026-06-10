import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFButton, MFCard } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { AdminTaskTypeDialog } from "../components/AdminTaskTypeDialog"
import { AdminTaskTypesTable } from "../components/AdminTaskTypesTable"
import { useAdminTaskTypes } from "../hooks/useAdminTaskTypes"

export function AdminTaskTypesPage() {
  const taskTypes = useAdminTaskTypes()

  usePageTitle(
    "Task Types",
    "Configure assignment task types and default base rates. Used task types are preserved for existing task and payroll history.",
  )

  function closeDialog() {
    taskTypes.setDialogOpen(false)
    taskTypes.setEditingTaskType(null)
  }

  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <div className="flex flex-col gap-lg lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-sm">
              <MFBadge tone="primary" size="md">Admin only</MFBadge>
              <MFBadge tone="success" size="md">Backend enforced</MFBadge>
            </div>
            <h1 className="mt-md text-headline-lg text-on-surface">Task Types</h1>
            <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">
              Manage workflow task labels and default base rates. Existing tasks keep their own base-rate snapshot, and used task types are deactivated instead of hard-deleted.
            </p>
          </div>
          <MFButton type="button" onClick={() => taskTypes.setDialogOpen(true)}>Create task type</MFButton>
        </div>
      </MFCard>

      <section className="grid gap-lg md:grid-cols-3">
        <MFCard><p className="text-label-sm text-on-surface-muted">Active types</p><p className="mt-sm text-headline-md text-on-surface">{taskTypes.activeCount}</p></MFCard>
        <MFCard><p className="text-label-sm text-on-surface-muted">Inactive</p><p className="mt-sm text-headline-md text-on-surface">{taskTypes.inactiveCount}</p></MFCard>
        <MFCard><p className="text-label-sm text-on-surface-muted">Average base rate</p><p className="mt-sm text-headline-md text-on-surface">{taskTypes.averageBaseRate.toLocaleString()}</p></MFCard>
      </section>

      {taskTypes.error ? <MFErrorState title="Could not load task types" description={taskTypes.error} onRetry={() => void taskTypes.loadTaskTypes()} /> : null}
      {taskTypes.message ? <MFBadge tone="neutral" size="md">{taskTypes.message}</MFBadge> : null}

      <AdminTaskTypesTable
        taskTypes={taskTypes.taskTypes}
        loading={taskTypes.loading}
        updatingTaskTypeId={taskTypes.updatingTaskTypeId}
        onEdit={(taskType) => {
          taskTypes.setEditingTaskType(taskType)
          taskTypes.setDialogOpen(true)
        }}
        onStatusChange={(taskType) => void taskTypes.handleStatusChange(taskType)}
        onDelete={(taskType) => void taskTypes.handleDeleteTaskType(taskType)}
      />

      <AdminTaskTypeDialog
        open={taskTypes.dialogOpen}
        submitting={taskTypes.submitting}
        editingTaskType={taskTypes.editingTaskType}
        onClose={closeDialog}
        onCreate={taskTypes.handleCreateTaskType}
        onUpdate={taskTypes.handleUpdateTaskType}
      />
    </PageShell>
  )
}

