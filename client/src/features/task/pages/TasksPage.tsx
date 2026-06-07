import { useState } from "react"
import {
  ActionItemList,
  ContextPageList,
  StatusBadge,
  TaskScopeCard,
  TaskStatusBadge,
  type ActionItem,
  type ContextPageItem,
} from "@/shared/components/domain"
import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { PageShell } from "@/shared/components/layout/PageShell"
import {
  MFBadge,
  MFButton,
  MFCard,
  MFPagePreviewCard,
  MFTable,
  type MFTableColumn,
} from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { taskPriorityUI, taskStatusUI } from "@/shared/lib/status-ui"
import {
  CreateTaskDialog,
  type CreateTaskFormValues,
  type CreateTaskSelectOption,
} from "../components"

interface TaskRow {
  id: string
  title: string
  series: string
  scope: string
  status: string
  priority: string
  dueDate: string
  assignee: string
}

const pendingActions: ActionItem[] = [
  {
    id: "action-1",
    title: "Review submitted tone pass",
    description: "Page 12 has a new assistant submission waiting for Mangaka review.",
    metadata: "Moonlit Atelier - Chapter 08",
    icon: "rate_review",
    status: "SUBMITTED",
  },
  {
    id: "action-2",
    title: "Prepare revision notes",
    description: "A background cleanup task needs clearer region instructions.",
    metadata: "Due June 13, 2026",
    icon: "edit_note",
    status: "REVISION_REQUESTED",
  },
]

const featuredTask = {
  title: "Clean tone pass for assigned page",
  status: "IN_PROGRESS",
  scopeType: "page" as const,
  scopeLabel: "Chapter 08 - Page 12",
  description:
    "Local presentation sample for task list composition. Real tasks will come from the task API in a future story.",
  dueDateLabel: "June 14, 2026",
  priority: "HIGH",
  assignedToLabel: "Assistant view",
  taskTypeLabel: "Tone cleanup",
}

const contextPages: ContextPageItem[] = [
  { id: "context-11", pageNumber: 11, status: "APPROVED", label: "Previous page" },
  { id: "context-13", pageNumber: 13, status: "UPLOADED", label: "Next page" },
]

const taskRows: TaskRow[] = [
  {
    id: "task-1",
    title: "Clean tone pass",
    series: "Moonlit Atelier",
    scope: "Ch. 08 - Page 12",
    status: "IN_PROGRESS",
    priority: "HIGH",
    dueDate: "Jun 14, 2026",
    assignee: "Assistant view",
  },
  {
    id: "task-2",
    title: "Lettering alignment",
    series: "Moonlit Atelier",
    scope: "Ch. 08 - Region 4",
    status: "SUBMITTED",
    priority: "NORMAL",
    dueDate: "Jun 12, 2026",
    assignee: "Nari Ito",
  },
  {
    id: "task-3",
    title: "Background cleanup",
    series: "Paper Comet",
    scope: "Ch. 03 - Page 07",
    status: "REVISION_REQUESTED",
    priority: "URGENT",
    dueDate: "Jun 11, 2026",
    assignee: "Sora Min",
  },
]

const assistantOptions: CreateTaskSelectOption[] = [
  { id: "assistant-view", label: "Assistant view" },
  { id: "nari-ito", label: "Nari Ito" },
]

const taskTypeOptions: CreateTaskSelectOption[] = [
  { id: "tone-cleanup", label: "Tone cleanup" },
  { id: "lettering", label: "Lettering alignment" },
  { id: "background-cleanup", label: "Background cleanup" },
]

const taskColumns: MFTableColumn<TaskRow>[] = [
  {
    id: "task",
    header: "Task",
    cell: (task) => (
      <div className="min-w-0">
        <p className="break-words text-label-md text-on-surface">{task.title}</p>
        <p className="mt-xs break-words text-label-sm text-on-surface-muted">
          {task.series}
        </p>
      </div>
    ),
  },
  {
    id: "scope",
    header: "Scope",
    cell: (task) => task.scope,
  },
  {
    id: "status",
    header: "Status",
    cell: (task) => <TaskStatusBadge status={task.status} />,
  },
  {
    id: "priority",
    header: "Priority",
    cell: (task) => <StatusBadge status={task.priority} mapping={taskPriorityUI} />,
  },
  {
    id: "due",
    header: "Due",
    cell: (task) => task.dueDate,
  },
  {
    id: "assignee",
    header: "Assignee",
    cell: (task) => task.assignee,
  },
]

function TaskStatePreview() {
  return (
    <MFCard>
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <h2 className="text-title-lg text-on-surface">Task states</h2>
          <p className="mt-xs text-body-md text-on-surface-muted">
            UI-only previews for loading, empty, error, submitted, and revision states.
          </p>
        </div>
        <MFBadge tone="warning" size="md">
          API not connected
        </MFBadge>
      </div>
      <div className="mt-lg grid gap-md xl:grid-cols-4">
        <div className="rounded-3xl bg-surface-low p-lg" aria-label="Loading tasks preview">
          <div className="h-4 w-28 rounded-full bg-surface-container" />
          <div className="mt-md space-y-sm">
            <div className="h-3 rounded-full bg-surface-container" />
            <div className="h-3 w-2/3 rounded-full bg-surface-container" />
            <div className="h-3 w-1/2 rounded-full bg-surface-container" />
          </div>
          <p className="mt-md text-label-sm text-on-surface-muted">Loading preview</p>
        </div>
        <MFEmptyState
          icon="task"
          title="No tasks assigned"
          description="The live task list will stay empty until the task API supplies records."
        />
        <MFErrorState
          title="Could not load tasks"
          description="Future API failures should remain recoverable and avoid raw stack traces."
          onRetry={() => undefined}
        />
        <div className="rounded-3xl bg-surface-low p-lg">
          <div className="flex flex-wrap gap-sm">
            <TaskStatusBadge status="SUBMITTED" />
            <TaskStatusBadge status="REVISION_REQUESTED" />
          </div>
          <p className="mt-md text-body-md text-on-surface">
            Submitted and revision states stay text-visible and do not rely on color alone.
          </p>
        </div>
      </div>
    </MFCard>
  )
}

export function TasksPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [previewTask, setPreviewTask] = useState<CreateTaskFormValues | null>(null)

  usePageTitle(
    "Production Tasks",
    "Track assigned task presentation, read-only context, and workflow states.",
  )

  function handleCreateTask(values: CreateTaskFormValues) {
    setPreviewTask(values)
    setDialogOpen(false)
  }

  return (
    <PageShell>
      <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_22rem]">
        <MFCard padding="lg" className="rounded-3xl">
          <div className="flex flex-col gap-lg lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-sm">
                <MFBadge tone="primary" size="md">
                  Tasks
                </MFBadge>
                <MFBadge tone="warning" size="md">
                  Presentation only
                </MFBadge>
              </div>
              <h1 className="mt-md text-headline-lg text-on-surface">
                Production task queue
              </h1>
              <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">
                This page composes shared task components with local sample data.
                Assignment rules, Production Team eligibility, active TaskType
                checks, notifications, and API writes remain backend-owned.
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
            Dialog options are caller-supplied samples. This screen does not decide
            whether an assistant is eligible or whether a task type is active.
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
            <MFBadge tone="neutral" size="md">
              Local only
            </MFBadge>
          </div>
          <dl className="mt-lg grid gap-md sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-surface-low p-md">
              <dt className="text-label-sm text-on-surface-muted">Title</dt>
              <dd className="mt-xs text-label-md text-on-surface">
                {previewTask.title || "Untitled task"}
              </dd>
            </div>
            <div className="rounded-xl bg-surface-low p-md">
              <dt className="text-label-sm text-on-surface-muted">Task type</dt>
              <dd className="mt-xs text-label-md text-on-surface">
                {previewTask.taskTypeId || "Not selected"}
              </dd>
            </div>
            <div className="rounded-xl bg-surface-low p-md">
              <dt className="text-label-sm text-on-surface-muted">Assistant</dt>
              <dd className="mt-xs text-label-md text-on-surface">
                {previewTask.assistantId || "Not selected"}
              </dd>
            </div>
            <div className="rounded-xl bg-surface-low p-md">
              <dt className="text-label-sm text-on-surface-muted">Priority</dt>
              <dd className="mt-xs text-label-md text-on-surface">
                {previewTask.priority}
              </dd>
            </div>
          </dl>
        </MFCard>
      ) : null}

      <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-lg">
          <TaskScopeCard {...featuredTask} />
          <ContextPageList
            pages={contextPages}
            description="Only context pages supplied by a future task payload should appear here."
          />
        </div>
        <MFCard>
          <h2 className="text-title-lg text-on-surface">Assigned page preview</h2>
          <p className="mt-xs text-body-md text-on-surface-muted">
            The task page points to a scoped page or region, not full chapter access.
          </p>
          <div className="mt-lg">
            <MFPagePreviewCard pageNumber={12} status="IN_PROGRESS" isSelected />
          </div>
        </MFCard>
      </section>

      <section className="grid gap-lg xl:grid-cols-[24rem_minmax(0,1fr)]">
        <div>
          <h2 className="mb-md text-title-lg text-on-surface">Pending actions</h2>
          <ActionItemList items={pendingActions} statusMapping={taskStatusUI} />
        </div>
        <div>
          <h2 className="mb-md text-title-lg text-on-surface">Task list</h2>
          <MFTable
            caption="Production task list"
            rows={taskRows}
            columns={taskColumns}
            getRowKey={(task) => task.id}
            emptyTitle="No production tasks"
            emptyDescription="Tasks will appear here when a backend task query is connected."
          />
        </div>
      </section>

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
