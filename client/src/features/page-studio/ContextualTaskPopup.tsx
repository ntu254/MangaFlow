import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Calendar, Loader2, Tag, User, X } from "lucide-react";
import { toast } from "sonner";
import type { Region } from "@/entities";
import type { PageStudioCollaborator } from "@/shared/api/pages";
import { extractErrorMessage } from "@/shared/api";
import { useActiveTaskTypes, useCreateTask } from "@/shared/queries/useTasks";
import { IMG_W, IMG_H } from "./PageStudioCanvas";
import { useStudioStore, type RegionTask } from "./useStudioStore";

interface Props {
  region: Region;
  seriesId?: string;
  chapterId?: string;
  pageId: string;
  assistants: PageStudioCollaborator[];
  onRegionTypeChange?: (type: string) => void;
  onClose: () => void;
}

const priorityMap: Record<RegionTask["priority"], "LOW" | "NORMAL" | "HIGH"> = {
  low: "LOW",
  medium: "NORMAL",
  high: "HIGH",
};

function defaultDueDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function endOfLocalDayIso(dateValue: string) {
  const date = new Date(`${dateValue}T23:59:00`);
  return date.toISOString();
}

export function ContextualTaskPopup({
  region,
  seriesId,
  chapterId,
  pageId,
  assistants,
  onRegionTypeChange,
  onClose,
}: Props) {
  const { viewport, regionTasks, assignTaskToRegion } = useStudioStore();
  const existingTask = regionTasks[region.id];
  const { data: taskTypes = [], isLoading: isLoadingTaskTypes } = useActiveTaskTypes();
  const createTask = useCreateTask({ seriesId, pageId });

  const regionTaskTypes = useMemo(
    () =>
      taskTypes
        .filter((taskType) => taskType.isActive !== false && taskType.allowRegionTask !== false)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [taskTypes],
  );
  const activeAssistants = useMemo(
    () =>
      assistants.filter(
        (assistant) => assistant.role === "ASSISTANT" && assistant.status === "ACTIVE",
      ),
    [assistants],
  );

  const [regionType, setRegionType] = useState<string>(region.type);
  const [taskTypeId, setTaskTypeId] = useState<string>("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [priority, setPriority] = useState<RegionTask["priority"]>(
    existingTask?.priority ?? "medium",
  );
  const [dueDate, setDueDate] = useState<string>(existingTask?.dueDate ?? defaultDueDate());
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!taskTypeId && regionTaskTypes[0]) {
      setTaskTypeId(regionTaskTypes[0].id);
    }
  }, [regionTaskTypes, taskTypeId]);

  useEffect(() => {
    if (!assigneeId && activeAssistants[0]) {
      setAssigneeId(activeAssistants[0].id);
    }
  }, [activeAssistants, assigneeId]);

  const selectedTaskType = regionTaskTypes.find((taskType) => taskType.id === taskTypeId);
  const selectedAssistant = activeAssistants.find((assistant) => assistant.id === assigneeId);
  const missingContext = !seriesId || !chapterId || !pageId;
  const cannotAssign =
    missingContext ||
    !selectedTaskType ||
    !selectedAssistant ||
    createTask.isPending ||
    isLoadingTaskTypes;

  const rx = region.coords.x * IMG_W;
  const ry = region.coords.y * IMG_H;
  const rw = region.coords.w * IMG_W;
  const screenX = rx * viewport.scale + viewport.x;
  const screenY = ry * viewport.scale + viewport.y;
  const screenW = rw * viewport.scale;
  const popupLeft = screenX + screenW + 16;
  const popupTop = screenY;

  const handleAssign = (event: React.FormEvent) => {
    event.preventDefault();
    if (cannotAssign || !selectedTaskType || !selectedAssistant || !seriesId || !chapterId) return;

    if (regionType !== region.type) {
      onRegionTypeChange?.(regionType);
    }

    createTask.mutate(
      {
        seriesId,
        chapterId,
        pageId,
        regionId: region.id,
        taskTypeId: selectedTaskType.id,
        assignedTo: selectedAssistant.id,
        title: selectedTaskType.name,
        description: description.trim() || undefined,
        priority: priorityMap[priority],
        dueDate: endOfLocalDayIso(dueDate),
      },
      {
        onSuccess: () => {
          assignTaskToRegion(region.id, {
            taskType: selectedTaskType.name,
            assigneeId: selectedAssistant.id,
            priority,
            dueDate,
          });
          toast.success(`Task "${selectedTaskType.name}" assigned to ${selectedAssistant.name}`);
          onClose();
        },
        onError: (error) => {
          toast.error(extractErrorMessage(error));
        },
      },
    );
  };

  const regionIndexStr = region.id.slice(-2).replace("_", "");
  const regionTitle = `${region.type.toUpperCase()} #${regionIndexStr || "1"}`;

  return (
    <div
      className="absolute z-40 flex w-80 flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-zinc-800 shadow-2xl transition-all duration-150 animate-in fade-in zoom-in-95"
      style={{ left: `${popupLeft}px`, top: `${popupTop}px` }}
    >
      <div className="flex items-center justify-between border-b border-zinc-100 pb-1.5">
        <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
          <Tag className="h-3.5 w-3.5 text-zinc-500" />
          {regionTitle}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="flex h-5 w-5 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <form onSubmit={handleAssign} className="flex flex-col gap-3 text-[11px]">
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-zinc-500">Region Type</label>
          <select
            value={regionType}
            onChange={(event) => setRegionType(event.target.value)}
            className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 font-medium text-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="panel">Panel</option>
            <option value="bubble">Speech Bubble</option>
            <option value="sfx">SFX</option>
            <option value="background">Background</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-semibold text-zinc-500">Task Type</label>
          <select
            value={taskTypeId}
            onChange={(event) => setTaskTypeId(event.target.value)}
            disabled={isLoadingTaskTypes || regionTaskTypes.length === 0}
            className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 font-medium text-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
          >
            {regionTaskTypes.map((taskType) => (
              <option key={taskType.id} value={taskType.id}>
                {taskType.name}
              </option>
            ))}
          </select>
          {!isLoadingTaskTypes && regionTaskTypes.length === 0 && (
            <span className="text-[10px] font-semibold text-amber-600">
              No active region task types are configured.
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-1 font-semibold text-zinc-500">
            <User className="h-3 w-3" /> Assignee
          </label>
          <select
            value={assigneeId}
            onChange={(event) => setAssigneeId(event.target.value)}
            disabled={activeAssistants.length === 0}
            className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 font-medium text-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
          >
            {activeAssistants.map((assistant) => (
              <option key={assistant.id} value={assistant.id}>
                {assistant.name}
              </option>
            ))}
          </select>
          {activeAssistants.length === 0 && (
            <span className="text-[10px] font-semibold text-amber-600">
              No active assistant is assigned to this series.
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-1 font-semibold text-zinc-500">
            <AlertCircle className="h-3 w-3" /> Priority
          </label>
          <div className="grid grid-cols-3 gap-1">
            {(["low", "medium", "high"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPriority(value)}
                className={`rounded border py-1 font-semibold capitalize transition-all ${
                  priority === value
                    ? value === "high"
                      ? "border-red-200 bg-red-50 text-red-600"
                      : value === "medium"
                        ? "border-amber-200 bg-amber-50 text-amber-600"
                        : "border-blue-200 bg-blue-50 text-blue-600"
                    : "border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-1 font-semibold text-zinc-500">
            <Calendar className="h-3 w-3" /> Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(event) => setDueDate(event.target.value)}
            className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 font-medium text-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-semibold text-zinc-500">Note</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
            placeholder="Optional instruction for assistant"
            className="w-full resize-none rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 font-medium text-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {missingContext && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-[10px] font-semibold text-amber-700">
            Studio is missing series or chapter context. Reload the page from the chapter preview.
          </div>
        )}

        <div className="mt-1 flex items-center gap-2 border-t border-zinc-100 pt-2">
          <button
            type="submit"
            disabled={cannotAssign}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-center font-bold text-white shadow-sm transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createTask.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
            {existingTask ? "Create New Task" : "Assign Task"}
          </button>
        </div>
      </form>
    </div>
  );
}
