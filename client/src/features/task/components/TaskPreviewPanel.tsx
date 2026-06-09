import { ContextPageList, TaskScopeCard } from "@/shared/components/domain"
import { MFCard, MFPagePreviewCard } from "@/shared/components/ui"
import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import type { ContextPageItem } from "@/shared/components/domain"
import type { Task } from "../api/task.api"
import { scopeLabel, taskTypeLabel } from "../utils/task-page.mappers"

interface TaskPreviewPanelProps {
  featuredTask: Task | null
  currentUserLabel: string
  contextPages: ContextPageItem[]
}

export function TaskPreviewPanel({ featuredTask, currentUserLabel, contextPages }: TaskPreviewPanelProps) {
  return (
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
  )
}
