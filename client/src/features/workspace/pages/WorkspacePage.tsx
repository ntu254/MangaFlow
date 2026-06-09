import { WorkspaceShell } from "@/shared/components/layout/WorkspaceShell"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { CanvasPanel, LeftPanel, RightPanel, WorkspaceToolbar } from "../components/WorkspacePanels"
import { useWorkspacePage } from "../hooks/useWorkspacePage"

export function WorkspacePage() {
  const { taskId, task, comments, submissions, loading, error, isLive, loadTask } = useWorkspacePage()
  usePageTitle("Task Workspace", "Assigned page workspace with read-only context and review history.")

  return (
    <WorkspaceShell
      leftLabel="Task and context"
      canvasLabel="Assigned page canvas"
      rightLabel="Review history"
      toolbar={<WorkspaceToolbar taskId={taskId} isLive={isLive} />}
      leftPanel={<LeftPanel task={task} />}
      canvas={<CanvasPanel task={task} loading={loading} error={error} onRetry={() => void loadTask()} />}
      rightPanel={<RightPanel comments={comments} submissions={submissions} />}
      className="min-h-[calc(100vh-8rem)]"
    />
  )
}
