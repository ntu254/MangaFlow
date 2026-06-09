import { useEffect, useMemo, useState } from "react"
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
import { useAuth } from "@/shared/components/auth"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { taskPriorityUI, taskStatusUI } from "@/shared/lib/status-ui"
import { listTaskTypes, listTasksByAssignee, type Task, type TaskTypeRef } from "../api/task.api"
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

const assistantOptions: CreateTaskSelectOption[] = [
  { id: "assistant-view", label: "Assistant view" },
  { id: "nari-ito", label: "Nari Ito" },
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

function taskId(task: Task) {
  return task.id ?? task._id ?? `${task.chapterId}-${task.title}`
}

function taskTypeLabel(task: Task) {
  return typeof task.taskTypeId === "string"
    ? "Task type"
    : task.taskTypeId.name ?? "Task type"
}

function scopeLabel(task: Task) {
  if (task.regionId) return `Region ${String(task.regionId).slice(-6)}`
  if (task.pageId) return `Page ${String(task.pageId).slice(-6)}`
  return `Chapter ${String(task.chapterId).slice(-6)}`
}

function toTaskRows(tasks: Task[], currentUserLabel: string): TaskRow[] {
  return tasks.map((task) => ({
    id: taskId(task),
    title: task.title,
    series: `Series ${String(task.seriesId).slice(-6)}`,
    scope: scopeLabel(task),
    status: task.status,
    priority: task.priority,
    dueDate: new Date(task.dueDate).toLocaleDateString(),
    assignee: currentUserLabel,
  }))
}

function toActionItems(tasks: Task[]): ActionItem[] {
  const actionable = tasks.filter((task) => ["SUBMITTED", "REVISION_REQUESTED", "TODO", "IN_PROGRESS"].includes(task.status)).slice(0, 3)
  if (actionable.length === 0) {
    return [{
      id: "task-empty-action",
      title: "No live task actions",
      description: "Assigned task actions will appear after the backend returns actionable tasks.",
      metadata: "GET /api/tasks/assignee/:assigneeId",
      icon: "task",
      status: "TODO",
    }]
  }
  return actionable.map((task) => ({
    id: taskId(task),
    title: task.title,
    description: task.description ?? "Live task from backend assignee query.",
    metadata: `${scopeLabel(task)} - due ${new Date(task.dueDate).toLocaleDateString()}`,
    icon: task.status === "REVISION_REQUESTED" ? "edit_note" : "task",
    status: task.status,
  }))
}

function toContextPages(task: Task | null): ContextPageItem[] {
  return (task?.contextPageIds ?? []).slice(0, 3).map((pageId, index) => ({
    id: pageId,
    pageNumber: index + 1,
    status: "UPLOADED",
    label: `Context ${String(pageId).slice(-6)}`,
  }))
}

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
        <MFBadge tone="success" size="md">
          Task type API connected
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
  const { user, isLoading: authLoading } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [tasksError, setTasksError] = useState("")
  const [taskTypes, setTaskTypes] = useState<TaskTypeRef[]>([])
  const [taskTypesLoading, setTaskTypesLoading] = useState(false)
  const [taskTypesError, setTaskTypesError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [previewTask, setPreviewTask] = useState<CreateTaskFormValues | null>(null)

  usePageTitle(
    "Production Tasks",
    "Track assigned task presentation, read-only context, and workflow states.",
  )

  async function loadTasks() {
    if (!user) {
      setTasks([])
      setTasksLoading(false)
      return
    }

    setTasksLoading(true)
    setTasksError("")
    try {
      const response = await listTasksByAssignee(user.id)
      if (!response.success || !response.data) {
        setTasksError(response.message ?? "Could not load assigned tasks.")
        setTasks([])
        return
      }
      setTasks(response.data)
    } catch {
      setTasksError("Could not reach MangaFlow tasks API.")
      setTasks([])
    } finally {
      setTasksLoading(false)
    }
  }

  async function loadTaskTypes() {
    setTaskTypesLoading(true)
    setTaskTypesError("")
    try {
      const response = await listTaskTypes(true)
      if (!response.success || !response.data) {
        setTaskTypesError(response.message ?? "Could not load task types.")
        setTaskTypes([])
        return
      }
      setTaskTypes(response.data)
    } catch {
      setTaskTypesError("Could not reach MangaFlow task type API.")
      setTaskTypes([])
    } finally {
      setTaskTypesLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      void loadTasks()
      void loadTaskTypes()
    }
  }, [authLoading, user?.id])

  function handleCreateTask(values: CreateTaskFormValues) {
    setPreviewTask(values)
    setDialogOpen(false)
  }

  const currentUserLabel = user?.name ?? "Current user"
  const taskRows = useMemo(() => toTaskRows(tasks, currentUserLabel), [tasks, currentUserLabel])
  const pendingActions = useMemo(() => toActionItems(tasks), [tasks])
  const featuredTask = tasks[0] ?? null
  const contextPages = useMemo(() => toContextPages(featuredTask), [featuredTask])
  const taskTypeOptions = useMemo(() => taskTypes.map((taskType) => ({ id: taskType.id ?? taskType._id ?? taskType.name ?? "task-type", label: taskType.name ?? "Task type", disabled: taskType.isActive === false })), [taskTypes])

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
                <MFBadge tone="success" size="md">
                  Assignee API connected
                </MFBadge>
                <MFBadge tone={taskTypesError ? "warning" : "success"} size="md">
                  {taskTypesError ? "Task type API fallback" : "Task type API connected"}
                </MFBadge>
              </div>
              <h1 className="mt-md text-headline-lg text-on-surface">
                Production task queue
              </h1>
              <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">
                This page loads tasks assigned to the authenticated user through
                backend access checks. Assignment rules, Production Team
                eligibility, active TaskType checks, notifications, and API
                writes remain backend-owned.
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
            Dialog options for task type now come from active backend TaskType records.
            Assistant eligibility remains backend-owned and assistant options stay caller-supplied.
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
          {featuredTask ? (
            <TaskScopeCard
              title={featuredTask.title}
              status={featuredTask.status}
              scopeType={featuredTask.regionId ? "region" : "page"}
              scopeLabel={scopeLabel(featuredTask)}
              description={featuredTask.description ?? "Live task from backend assignee query."}
              dueDateLabel={new Date(featuredTask.dueDate).toLocaleDateString()}
              priority={featuredTask.priority}
              assignedToLabel={currentUserLabel}
              taskTypeLabel={taskTypeLabel(featuredTask)}
            />
          ) : (
            <MFEmptyState
              icon="task"
              title="No featured task"
              description="A task summary appears here after assigned tasks load."
            />
          )}
          <ContextPageList
            pages={contextPages}
            description="Context page ids come from the task payload. Detailed page metadata remains a later workspace API slice."
          />
        </div>
        <MFCard>
          <h2 className="text-title-lg text-on-surface">Assigned page preview</h2>
          <p className="mt-xs text-body-md text-on-surface-muted">
            The task page points to a scoped page or region, not full chapter access.
          </p>
          <div className="mt-lg">
            {featuredTask?.pageId ? (
              <MFPagePreviewCard
                pageNumber={1}
                status={featuredTask.status}
                isSelected
              />
            ) : (
              <MFEmptyState
                icon="image"
                title="No scoped page"
                description="Assigned page metadata appears here after a live task includes page scope."
              />
            )}
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
          {tasksError ? (
            <MFErrorState
              title="Could not load tasks"
              description={tasksError}
              onRetry={() => void loadTasks()}
            />
          ) : (
            <MFTable
              caption="Production task list"
              rows={taskRows}
              columns={taskColumns}
              getRowKey={(task) => task.id}
              loading={tasksLoading || authLoading}
              emptyTitle="No production tasks"
              emptyDescription="Tasks appear here when the backend returns records assigned to the current user."
            />
          )}
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
