import { MFBadge, MFButton, MFCard } from "@/shared/components/ui"
import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { PageShell } from "@/shared/components/layout/PageShell"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { ActionItemList } from "@/shared/components/domain"
import { taskStatusUI } from "@/shared/lib/status-ui"
import { CreateTaskDialog, TaskListPanel, TaskPreviewPanel } from "../components"
import { TaskStatePreview } from "../components/TaskStatePreview"
import { useTasksPage } from "../hooks/useTasksPage"

export function TasksPage() {
  const {
    authLoading,
    tasksLoading,
    tasksError,
    taskTypesLoading,
    taskTypesError,
    dialogOpen,
    previewTask,
    featuredTask,
    taskRows,
    pendingActions,
    contextPages,
    taskTypeOptions,
    assistantOptions,
    currentUserLabel,
    setDialogOpen,
    handleCreateTask,
    loadTasks,
    loadTaskTypes,
  } = useTasksPage()

  usePageTitle(
    "Production Tasks",
    "Track assigned task presentation, read-only context, and workflow states.",
  )

  return (
    <PageShell>
      <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_22rem]">
        <MFCard padding="lg" className="rounded-3xl">
          <div className="flex flex-col gap-lg lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-sm">
                <MFBadge tone="primary" size="md">Tasks</MFBadge>
                <MFBadge tone="success" size="md">Assignee API connected</MFBadge>
                <MFBadge tone={taskTypesError ? "warning" : "success"} size="md">
                  {taskTypesError ? "Task type API fallback" : "Task type API connected"}
                </MFBadge>
              </div>
              <h1 className="mt-md text-headline-lg text-on-surface">Production task queue</h1>
              <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">
                This page loads tasks assigned to the authenticated user through backend access checks.
                Assignment rules, Production Team eligibility, active TaskType checks, notifications,
                and API writes remain backend-owned.
              </p>
            </div>
            <MFButton type="button" onClick={() => setDialogOpen(true)}>
              Preview create task
            </MFButton>
          </div>
        </MFCard>

        <MFCard>
          <h2 className="text-title-lg text-on-surface">Assignment boundary</h2>
          <p className="mt-sm text-body-md text-on-surface-muted">
            Dialog options for task type now come from active backend TaskType records. Assistant eligibility remains backend-owned and assistant options stay caller-supplied.
          </p>
        </MFCard>
      </section>

      {previewTask ? (
        <MFCard>
          <div className="flex flex-wrap items-start justify-between gap-md">
            <div>
              <h2 className="text-title-lg text-on-surface">Local task preview</h2>
              <p className="mt-xs text-body-md text-on-surface-muted">
                Captured from the dialog only in browser state. No task was created.
              </p>
            </div>
            <MFBadge tone="neutral" size="md">Local only</MFBadge>
          </div>
          <dl className="mt-lg grid gap-md sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-surface-low p-md">
              <dt className="text-label-sm text-on-surface-muted">Title</dt>
              <dd className="mt-xs text-label-md text-on-surface">{previewTask.title || "Untitled task"}</dd>
            </div>
            <div className="rounded-xl bg-surface-low p-md">
              <dt className="text-label-sm text-on-surface-muted">Task type</dt>
              <dd className="mt-xs text-label-md text-on-surface">{previewTask.taskTypeId || "Not selected"}</dd>
            </div>
            <div className="rounded-xl bg-surface-low p-md">
              <dt className="text-label-sm text-on-surface-muted">Assistant</dt>
              <dd className="mt-xs text-label-md text-on-surface">{previewTask.assistantId || "Not selected"}</dd>
            </div>
            <div className="rounded-xl bg-surface-low p-md">
              <dt className="text-label-sm text-on-surface-muted">Priority</dt>
              <dd className="mt-xs text-label-md text-on-surface">{previewTask.priority}</dd>
            </div>
          </dl>
        </MFCard>
      ) : null}

      <TaskPreviewPanel
        featuredTask={featuredTask}
        currentUserLabel={currentUserLabel}
        contextPages={contextPages}
      />

      <section className="grid gap-lg xl:grid-cols-[24rem_minmax(0,1fr)]">
        <div>
          <h2 className="mb-md text-title-lg text-on-surface">Pending actions</h2>
          <ActionItemList items={pendingActions} statusMapping={taskStatusUI} />
        </div>
        <div>
          <h2 className="mb-md text-title-lg text-on-surface">Task list</h2>
          <TaskListPanel
            rows={taskRows}
            loading={tasksLoading || authLoading}
            error={tasksError}
            onRetry={() => void loadTasks()}
          />
        </div>
      </section>

      {taskTypesError ? (
        <MFErrorState
          title="Could not load task types"
          description={taskTypesError}
          onRetry={() => void loadTaskTypes()}
        />
      ) : null}

      {taskTypesLoading ? (
        <MFCard>
          <p className="text-body-md text-on-surface-muted">Loading task types from backend...</p>
        </MFCard>
      ) : null}

      <TaskStatePreview />

      <CreateTaskDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleCreateTask}
        assistantOptions={assistantOptions}
        taskTypeOptions={taskTypeOptions}
        scopeLabel="Chapter 08 - Page 12"
      />
    </PageShell>
  )
}
