import { useState, useEffect } from "react";
import { X, Calendar, User, Tag, AlertCircle } from "lucide-react";
import { useStudioStore, type RegionTask } from "./useStudioStore";
import { staff } from "@/entities";
import type { Region } from "@/entities";
import { IMG_W, IMG_H } from "./PageStudioCanvas";
import { toast } from "sonner";

interface Props {
  region: Region;
  onClose: () => void;
}

export function ContextualTaskPopup({ region, onClose }: Props) {
  const { viewport, regionTasks, assignTaskToRegion } = useStudioStore();

  const existingTask = regionTasks[region.id];

  // Form states
  const [regionType, setRegionType] = useState<string>(region.type);
  const [taskType, setTaskType] = useState<string>(
    existingTask?.taskType ?? "Tone Work"
  );
  const [assigneeId, setAssigneeId] = useState<string>(
    existingTask?.assigneeId ?? "s_as_jubei"
  );
  const [priority, setPriority] = useState<RegionTask["priority"]>(
    existingTask?.priority ?? "medium"
  );
  const [dueDate, setDueDate] = useState<string>(
    existingTask?.dueDate ?? "2026-06-30"
  );

  // Sync with existing task if it changes
  useEffect(() => {
    if (existingTask) {
      setTaskType(existingTask.taskType);
      setAssigneeId(existingTask.assigneeId);
      setPriority(existingTask.priority);
      setDueDate(existingTask.dueDate);
    }
  }, [existingTask]);

  // Bounding rect calculations
  const rx = region.coords.x * IMG_W;
  const ry = region.coords.y * IMG_H;
  const rw = region.coords.w * IMG_W;

  // Screen coordinates
  const screenX = rx * viewport.scale + viewport.x;
  const screenY = ry * viewport.scale + viewport.y;
  const screenW = rw * viewport.scale;

  // Position popup to the right of the region
  const popupLeft = screenX + screenW + 16;
  const popupTop = screenY;

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    assignTaskToRegion(region.id, {
      taskType,
      assigneeId,
      priority,
      dueDate,
    });
    // Locally mutate region type if changed
    region.type = regionType as any;
    region.status = "linked-to-task";
    toast.success(`Task "${taskType}" assigned to ${staff.find(s => s.id === assigneeId)?.name}`);
    onClose();
  };

  const handleUnassign = () => {
    assignTaskToRegion(region.id, null);
    region.status = "created";
    toast.info("Task removed from region.");
    onClose();
  };

  // Get index-based identifier (e.g. Speech Bubble 02)
  const regionIndexStr = region.id.slice(-2).replace("_", "");
  const regionTitle = `${region.type.toUpperCase()} #${regionIndexStr || "1"}`;

  return (
    <div
      className="absolute z-40 w-72 rounded-xl border border-zinc-200 bg-white p-4 shadow-2xl flex flex-col gap-3 text-zinc-800 transition-all duration-150 animate-in fade-in zoom-in-95"
      style={{
        left: `${popupLeft}px`,
        top: `${popupTop}px`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-zinc-100">
        <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 text-zinc-500" />
          {regionTitle}
        </span>
        <button
          onClick={onClose}
          className="h-5 w-5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 flex items-center justify-center transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <form onSubmit={handleAssign} className="flex flex-col gap-3 text-[11px]">
        {/* Region Type */}
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-zinc-500">Region Type</label>
          <select
            value={regionType}
            onChange={(e) => setRegionType(e.target.value)}
            className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value="panel">Panel</option>
            <option value="bubble">Speech Bubble</option>
            <option value="sfx">SFX</option>
            <option value="background">Background</option>
          </select>
        </div>

        {/* Task Type */}
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-zinc-500">Task Type</label>
          <select
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
            className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value="Tone Work">Tone Work</option>
            <option value="Translation">Translation</option>
            <option value="SFX Work">SFX Work</option>
            <option value="Redraw">Redraw / Cleaning</option>
            <option value="Typesetting">Typesetting</option>
          </select>
        </div>

        {/* Assign To */}
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-zinc-500 flex items-center gap-1">
            <User className="h-3 w-3" /> Assignee
          </label>
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          >
            {staff
              .filter((s) => s.role === "assistant" || s.role === "editor")
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role})
                </option>
              ))}
          </select>
        </div>

        {/* Priority */}
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-zinc-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Priority
          </label>
          <div className="grid grid-cols-3 gap-1">
            {(["low", "medium", "high"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`py-1 rounded border capitalize transition-all font-semibold ${
                  priority === p
                    ? p === "high"
                      ? "bg-red-50 text-red-600 border-red-200"
                      : p === "medium"
                        ? "bg-amber-50 text-amber-600 border-amber-200"
                        : "bg-blue-50 text-blue-600 border-blue-200"
                    : "border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Due Date */}
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-zinc-500 flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 mt-1">
          {existingTask && (
            <button
              type="button"
              onClick={handleUnassign}
              className="flex-1 py-1 px-2.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 font-bold transition-all"
            >
              Remove
            </button>
          )}
          <button
            type="submit"
            className="flex-1 py-1 px-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-sm transition-all text-center"
          >
            {existingTask ? "Save Task" : "Assign Task"}
          </button>
        </div>
      </form>
    </div>
  );
}
