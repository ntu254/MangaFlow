import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, BriefcaseBusiness, Trash } from "lucide-react";
import type { Region } from "@/features/region/api/region";
import type { Task, TaskType, TaskPriority } from "@/features/task/api/task";
import { taskTypes, taskPriorities } from "@/features/task/api/task";
import { regionColorByType } from "./RegionOverlay";

export type TaskTabContentProps = {
  isEditor: boolean;
  selectedRegion: Region | null;
  taskAssigneeId: string;
  setTaskAssigneeId: (id: string) => void;
  assistants: { id: string; fullName: string; email: string }[];
  taskTitle: string;
  setTaskTitle: (title: string) => void;
  taskDescription: string;
  setTaskDescription: (desc: string) => void;
  taskType: TaskType;
  setTaskType: (type: TaskType) => void;
  taskPriority: TaskPriority;
  setTaskPriority: (priority: TaskPriority) => void;
  taskDueDate: string;
  setTaskDueDate: (date: string) => void;
  taskBaseRate: string;
  setTaskBaseRate: (rate: string) => void;
  taskBonusAmount: string;
  setTaskBonusAmount: (bonus: string) => void;
  assigningTask: boolean;
  handleCreateRegionTask: () => Promise<void>;
  tasks: Task[];
  selectedRegionTasks: Task[];
  deletingTaskId: string | null;
  setConfirmDelete: (confirm: { type: "task"; id: string } | null) => void;
};

export function TaskTabContent({
  isEditor,
  selectedRegion,
  taskAssigneeId,
  setTaskAssigneeId,
  assistants,
  taskTitle,
  setTaskTitle,
  taskDescription,
  setTaskDescription,
  taskType,
  setTaskType,
  taskPriority,
  setTaskPriority,
  taskDueDate,
  setTaskDueDate,
  taskBaseRate,
  setTaskBaseRate,
  taskBonusAmount,
  setTaskBonusAmount,
  assigningTask,
  handleCreateRegionTask,
  tasks,
  selectedRegionTasks,
  deletingTaskId,
  setConfirmDelete
}: TaskTabContentProps) {
  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-[#eadff6] bg-white p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#2f243a]">Assign Task</h2>
        </div>

        {!isEditor && (
          <>
            {selectedRegion ? (
              <div className="rounded-lg border border-[#eadff6]/60 bg-[#f8f1ff]/10 p-2.5 space-y-1">
                <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Selected region info</div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#2f243a]">
                  <span
                    className="size-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: regionColorByType[selectedRegion.type] }}
                  />
                  {selectedRegion.type} ({selectedRegion.source})
                </div>
                <div className="text-[10px] font-mono text-[#5f5270]">
                  {Math.round(selectedRegion.x * 1000)}, {Math.round(selectedRegion.y * 1000)} &middot; {Math.round(selectedRegion.width * 1000)} &times; {Math.round(selectedRegion.height * 1000)}
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-4 text-xs text-muted-foreground text-center">
                <BriefcaseBusiness className="size-4 mx-auto mb-1 text-muted-foreground" />
                Please select a region from the Regions tab to assign a task.
              </div>
            )}

            <div className="grid gap-2.5">
              <label className="grid gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Assign assistant
                {assistants.length > 0 ? (
                  <select
                    value={taskAssigneeId}
                    onChange={(event) => setTaskAssigneeId(event.target.value)}
                    disabled={!selectedRegion}
                    className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-normal normal-case text-foreground outline-none focus:border-ring"
                  >
                    <option value="">Select assistant...</option>
                    {assistants.map((assistant) => (
                      <option key={assistant.id} value={assistant.id}>
                        {assistant.fullName} ({assistant.email})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={taskAssigneeId}
                    onChange={(event) => setTaskAssigneeId(event.target.value)}
                    disabled={!selectedRegion}
                    className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-normal normal-case text-foreground outline-none focus:border-ring"
                    placeholder="Assistant User ID"
                  />
                )}
              </label>

              <label className="grid gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Task title
                <input
                  value={taskTitle}
                  onChange={(event) => setTaskTitle(event.target.value)}
                  disabled={!selectedRegion}
                  className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-normal normal-case text-foreground outline-none focus:border-ring"
                  placeholder="e.g. Clean selected bubble"
                  maxLength={160}
                />
              </label>

              <label className="grid gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Description
                <textarea
                  value={taskDescription}
                  onChange={(event) => setTaskDescription(event.target.value)}
                  disabled={!selectedRegion}
                  className="min-h-12 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-normal normal-case text-foreground outline-none focus:border-ring"
                  placeholder="Clean edges and prepare final ink layer"
                  maxLength={1000}
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Type
                  <select
                    value={taskType}
                    onChange={(event) => setTaskType(event.target.value as TaskType)}
                    disabled={!selectedRegion}
                    className="rounded-md border border-input bg-background px-1.5 py-1.5 text-xs font-normal normal-case text-foreground outline-none focus:border-ring"
                  >
                    {taskTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Priority
                  <select
                    value={taskPriority}
                    onChange={(event) => setTaskPriority(event.target.value as TaskPriority)}
                    disabled={!selectedRegion}
                    className="rounded-md border border-input bg-background px-1.5 py-1.5 text-xs font-normal normal-case text-foreground outline-none focus:border-ring"
                  >
                    {taskPriorities.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="grid gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Due date
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(event) => setTaskDueDate(event.target.value)}
                  disabled={!selectedRegion}
                  className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-normal normal-case text-foreground outline-none focus:border-ring"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Base rate
                  <input
                    type="number"
                    min="0"
                    value={taskBaseRate}
                    onChange={(event) => setTaskBaseRate(event.target.value)}
                    disabled={!selectedRegion}
                    className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-normal normal-case text-foreground outline-none focus:border-ring"
                  />
                </label>
                <label className="grid gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Bonus
                  <input
                    type="number"
                    min="0"
                    value={taskBonusAmount}
                    onChange={(event) => setTaskBonusAmount(event.target.value)}
                    disabled={!selectedRegion}
                    className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-normal normal-case text-foreground outline-none focus:border-ring"
                  />
                </label>
              </div>

              <Button
                onClick={() => void handleCreateRegionTask()}
                disabled={
                  !selectedRegion ||
                  assigningTask ||
                  !taskAssigneeId.trim() ||
                  !taskTitle.trim() ||
                  !taskDescription.trim()
                }
                className="mt-2 bg-[#9065d5] text-white hover:bg-[#7f55c7] text-xs h-8"
              >
                {assigningTask ? <Loader2 className="animate-spin size-3.5 mr-1" /> : <Save className="size-3.5 mr-1" />}
                Assign task
              </Button>
            </div>
          </>
        )}
      </section>

      <section className="rounded-lg border border-[#eadff6] bg-white p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#2f243a]">Tasks List</h2>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{tasks.length}</Badge>
        </div>

        <div className="grid gap-2">
          {tasks.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-xs text-muted-foreground text-center">
              No tasks created for this page yet.
            </p>
          ) : (
            tasks.map((task) => {
              const isSelectedRegionTask = selectedRegionTasks.some((item) => item.id === task.id);
              return (
                <div
                  key={task.id}
                  className={`rounded-lg border p-2.5 transition-colors ${
                    isSelectedRegionTask ? "border-[#9065d5] bg-[#f8f1ff]/30" : "bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-semibold text-[#2f243a]">{task.title}</h3>
                      <p className="mt-0.5 text-[9px] text-muted-foreground">
                        {task.assignedToUserInfo?.fullName || task.assignedToUserInfo?.email || task.assignedTo}
                      </p>
                    </div>
                    <Badge variant={task.status === "TODO" ? "outline" : "secondary"} className="text-[9px] px-1.5 py-0 h-4">{task.status}</Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-normal">{task.description}</p>
                  <div className="mt-2 flex flex-wrap gap-x-2 gap-y-0.5 text-[9px] text-[#5f5270] font-medium">
                    <span>{task.type}</span>
                    <span>&middot;</span>
                    <span>{task.priority}</span>
                    {task.dueDate ? (
                      <>
                        <span>&middot;</span>
                        <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                      </>
                    ) : null}
                  </div>
                  {!isEditor && (
                    <Button
                      className="mt-3 w-full text-xs h-7 py-0"
                      size="sm"
                      variant="destructive"
                      onClick={() => setConfirmDelete({ type: "task", id: task.id })}
                      disabled={deletingTaskId === task.id}
                    >
                      {deletingTaskId === task.id ? <Loader2 className="animate-spin size-3 mr-1" /> : <Trash className="size-3 mr-1" />}
                      Delete
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
