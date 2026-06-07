import { MFCard } from "@/shared/components/ui/MFCard"
import { MFBadge } from "@/shared/components/ui/MFBadge"
import { MFSection } from "@/shared/components/ui/MFSection"
import { getStatusUi, taskStatusUI } from "@/shared/lib/status-ui"

const mockTasks = [
  { title: "Ink page 5", assignee: "Assistant A", status: "IN_PROGRESS" },
  { title: "Tone page 3", assignee: "Assistant B", status: "SUBMITTED" },
  { title: "Background page 7", assignee: "Assistant A", status: "TODO" },
  { title: "Lettering page 2", assignee: "Assistant C", status: "EDITOR_APPROVED" },
  { title: "Cleanup page 4", assignee: "Assistant B", status: "REVISION_REQUESTED" },
]

export function TaskListPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-headline-lg text-on-surface">Tasks</h1>
      <MFSection title="All Tasks">
        <div className="space-y-3">
          {mockTasks.map((task) => {
            const status = getStatusUi(task.status, taskStatusUI)
            return (
              <MFCard key={task.title} padding="md" className="flex items-center justify-between">
                <div>
                  <h3 className="text-title-lg text-on-surface">{task.title}</h3>
                  <p className="text-body-md text-on-surface-muted">{task.assignee}</p>
                </div>
                <MFBadge tone={status.tone}>{status.label}</MFBadge>
              </MFCard>
            )
          })}
        </div>
      </MFSection>
    </div>
  )
}
