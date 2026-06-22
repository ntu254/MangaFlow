import { toast } from "sonner";
import { findStaff, type Submission, type Task } from "@/entities";
import type { ChapterPerms } from "../../lib/chapterPermissions";
import { useApproveSubmission, useEditorApproveSubmission, useRequestRevision } from "@/shared/queries/useSubmissions";
import { Loader2 } from "lucide-react";

function StepDot({ done, label }: { done: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] ${
        done
          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
          : "bg-foreground/5 text-foreground/55"
      }`}
    >
      {label} {done ? "✓" : "…"}
    </span>
  );
}

function ReviewCard({
  sub,
  task,
  step,
  perms,
}: {
  sub: Submission;
  task: Task;
  step: 1 | 2;
  perms: ChapterPerms;
}) {
  const canAct = step === 1 ? perms.canApproveMangakaStep : perms.canApproveEditorStep;

  const approveMangaka = useApproveSubmission();
  const approveEditor = useEditorApproveSubmission();
  const requestRevision = useRequestRevision();

  const isPending = approveMangaka.isPending || approveEditor.isPending || requestRevision.isPending;

  const handleRequestRevision = () => {
    const note = prompt("Enter revision instructions (required):");
    if (note === null) return; // Cancelled
    if (!note.trim()) {
      toast.error("Revision instructions cannot be empty.");
      return;
    }

    requestRevision.mutate(
      { id: sub.id, note: note.trim() },
      {
        onSuccess: () => {
          toast.success("Revision requested successfully.");
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to request revision.");
        },
      }
    );
  };

  const handleApprove = () => {
    const note = prompt("Enter approval note (optional):") || "";
    if (note === null) return; // Cancelled

    const mutation = step === 1 ? approveMangaka : approveEditor;
    mutation.mutate(
      { id: sub.id, note: note.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(step === 1 ? "Mangaka approved." : "Editor approved.");
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to approve submission.");
        },
      }
    );
  };

  return (
    <div className="rounded border border-foreground/10 bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-medium">
            {task.type} — {findStaff(task.assigneeId)?.name}
          </div>
          <div className="text-[11px] text-foreground/55">
            {task.pageRange} &bull; submitted {new Date(sub.createdAt).toLocaleDateString()} &bull; v{sub.version}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <StepDot done={sub.mangakaApproved || sub.status === "MANGAKA_APPROVED" || sub.status === "EDITOR_APPROVED"} label="① Mangaka" />
          <StepDot done={sub.editorApproved || sub.status === "EDITOR_APPROVED"} label="② Editor" />
        </div>
      </div>
      {sub.resultText && (
        <div className="mt-2 rounded bg-foreground/5 p-2 text-[12px] text-foreground/75">
          <div className="font-semibold text-[10px] text-foreground/45 mb-0.5">ASSISTANT NOTE:</div>
          {sub.resultText}
        </div>
      )}
      {sub.reviewerNote && (
        <div className="mt-2 rounded border border-amber-500/20 bg-amber-500/5 p-2 text-[12px] text-amber-700 dark:text-amber-400">
          <div className="font-semibold text-[10px] opacity-75 mb-0.5">REVIEWER NOTE:</div>
          {sub.reviewerNote}
        </div>
      )}
      <div className="mt-3 flex justify-end gap-2">
        <button
          disabled={!canAct || isPending}
          onClick={handleRequestRevision}
          className="h-7 rounded-md border border-foreground/15 px-2.5 text-[11px] hover:bg-foreground/5 disabled:opacity-40 flex items-center gap-1"
        >
          {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          Request changes
        </button>
        <button
          disabled={!canAct || isPending}
          onClick={handleApprove}
          className="h-7 rounded-md bg-primary px-2.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 disabled:bg-foreground/10 disabled:text-foreground/40 flex items-center gap-1"
        >
          {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          {step === 1 ? "Approve (Mangaka)" : "Approve final (Editor)"}
        </button>
      </div>
    </div>
  );
}

export function ReviewsTab({
  tasks,
  subs,
  perms,
}: {
  tasks: Task[];
  subs: Submission[];
  perms: ChapterPerms;
}) {
  const taskOf = (id: string) => tasks.find((t) => t.id === id)!;

  // Derive approvals from status
  const pendingMangaka = subs.filter((s) => s.status === "SUBMITTED");
  const pendingEditor = subs.filter((s) => s.status === "MANGAKA_APPROVED");
  const done = subs.filter((s) => s.status === "EDITOR_APPROVED" || s.status === "REJECTED" || s.status === "REVISION_REQUESTED");

  return (
    <div className="space-y-5">
      <section>
        <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-foreground/55">
          Pending Mangaka review ({pendingMangaka.length})
        </h3>
        {pendingMangaka.length === 0 ? (
          <div className="text-[12px] text-foreground/55">Nothing waiting on Mangaka.</div>
        ) : (
          <div className="space-y-2">
            {pendingMangaka.map((s) => {
              const t = taskOf(s.taskId);
              if (!t) return null;
              return <ReviewCard key={s.id} sub={s} task={t} step={1} perms={perms} />;
            })}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-foreground/55">
          Pending Editor final review ({pendingEditor.length})
        </h3>
        {pendingEditor.length === 0 ? (
          <div className="text-[12px] text-foreground/55">Nothing waiting on Editor.</div>
        ) : (
          <div className="space-y-2">
            {pendingEditor.map((s) => {
              const t = taskOf(s.taskId);
              if (!t) return null;
              return <ReviewCard key={s.id} sub={s} task={t} step={2} perms={perms} />;
            })}
          </div>
        )}
      </section>

      {done.length > 0 && (
        <section>
          <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-foreground/55">
            Completed reviews ({done.length})
          </h3>
          <div className="space-y-2 opacity-80">
            {done.map((s) => {
              const t = taskOf(s.taskId);
              if (!t) return null;
              return (
                <ReviewCard
                  key={s.id}
                  sub={s}
                  task={t}
                  step={2}
                  perms={{ ...perms, canApproveMangakaStep: false, canApproveEditorStep: false }}
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
