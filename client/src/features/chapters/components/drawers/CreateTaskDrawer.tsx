import { useMemo, useState } from "react";
import { toast } from "sonner";
import { staff, type Task } from "@/entities";
import { isTaskActive } from "../../lib/taskStatus";

const TYPES: Task["type"][] = ["Linework", "Tone", "Background", "Lettering", "FX"];

export function CreateTaskDrawer({
  open,
  onClose,
  existingTasks,
  pageCount,
}: {
  open: boolean;
  onClose: () => void;
  existingTasks: Task[];
  pageCount: number;
}) {
  const [type, setType] = useState<Task["type"]>("Linework");
  const [pageStart, setPageStart] = useState("1");
  const [pageEnd, setPageEnd] = useState(String(Math.max(1, pageCount)));
  const [assigneeId, setAssigneeId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [note, setNote] = useState("");

  const assistants = useMemo(() => staff.filter((s) => s.role === "assistant"), []);

  if (!open) return null;

  const duplicate = existingTasks.some(
    (t) =>
      t.type === type &&
      isTaskActive(t) &&
      t.pageRange.includes(`${pageStart}`) &&
      t.pageRange.includes(`${pageEnd}`),
  );

  const submit = () => {
    if (!assigneeId) return toast.error("Pick an eligible assistant.");
    if (duplicate)
      return toast.error("An active task of this type already covers this page range.");
    toast.success(`Task created: ${type} · p. ${pageStart}–${pageEnd}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto border-l border-foreground/10 bg-background p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold">Create task</h2>
        <p className="mb-4 text-[12px] text-foreground/55">
          Assign a production task to a Studio assistant.
        </p>

        <div className="space-y-3 text-[12px]">
          <label className="block">
            <div className="mb-1 text-foreground/70">Type</div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Task["type"])}
              className="h-8 w-full rounded border border-foreground/15 bg-transparent px-2"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <div className="mb-1 text-foreground/70">Page from</div>
              <input
                value={pageStart}
                onChange={(e) => setPageStart(e.target.value)}
                className="h-8 w-full rounded border border-foreground/15 bg-transparent px-2"
              />
            </label>
            <label className="block">
              <div className="mb-1 text-foreground/70">Page to</div>
              <input
                value={pageEnd}
                onChange={(e) => setPageEnd(e.target.value)}
                className="h-8 w-full rounded border border-foreground/15 bg-transparent px-2"
              />
            </label>
          </div>
          <label className="block">
            <div className="mb-1 text-foreground/70">Assignee (eligible assistants)</div>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="h-8 w-full rounded border border-foreground/15 bg-transparent px-2"
            >
              <option value="">Select assistant…</option>
              {assistants.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <div className="mb-1 text-foreground/70">Deadline</div>
            <input
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              placeholder="e.g. Jun 25"
              className="h-8 w-full rounded border border-foreground/15 bg-transparent px-2"
            />
          </label>
          <label className="block">
            <div className="mb-1 text-foreground/70">Note (optional)</div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded border border-foreground/15 bg-transparent p-2"
            />
          </label>

          {duplicate && (
            <div className="rounded border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] text-amber-600 dark:text-amber-400">
              An active task of this type already covers this page range.
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-8 rounded-md border border-foreground/15 px-3 text-[12px] hover:bg-foreground/5"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="h-8 rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create task
          </button>
        </div>
      </div>
    </div>
  );
}
