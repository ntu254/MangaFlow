import { toast } from "sonner";
import { findStaff, type Submission, type Task } from "@/entities";
import type { ChapterPerms } from "../../lib/chapterPermissions";

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
  return (
    <div className="rounded border border-foreground/10 bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-medium">
            {task.type} — {findStaff(task.assigneeId)?.name}
          </div>
          <div className="text-[11px] text-foreground/55">
            {task.pageRange} · submitted {sub.submittedAt}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <StepDot done={sub.mangakaApproved} label="① Mangaka" />
          <StepDot done={sub.editorApproved} label="② Editor" />
        </div>
      </div>
      {sub.note && (
        <div className="mt-2 rounded bg-foreground/5 p-2 text-[12px] text-foreground/75">
          {sub.note}
        </div>
      )}
      <div className="mt-3 flex justify-end gap-2">
        <button
          disabled={!canAct}
          onClick={() => toast.success("Revision requested.")}
          className="h-7 rounded-md border border-foreground/15 px-2.5 text-[11px] hover:bg-foreground/5 disabled:opacity-40"
        >
          Request changes
        </button>
        <button
          disabled={!canAct}
          onClick={() =>
            toast.success(step === 1 ? "Mangaka approved." : "Editor approved.")
          }
          className="h-7 rounded-md bg-primary px-2.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 disabled:bg-foreground/10 disabled:text-foreground/40"
        >
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
  const pendingMangaka = subs.filter((s) => !s.mangakaApproved && !s.rejected);
  const pendingEditor = subs.filter(
    (s) => s.mangakaApproved && !s.editorApproved && !s.rejected,
  );
  const done = subs.filter((s) => s.editorApproved || s.rejected);

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
            {pendingMangaka.map((s) => (
              <ReviewCard
                key={s.id}
                sub={s}
                task={taskOf(s.taskId)}
                step={1}
                perms={perms}
              />
            ))}
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
            {pendingEditor.map((s) => (
              <ReviewCard
                key={s.id}
                sub={s}
                task={taskOf(s.taskId)}
                step={2}
                perms={perms}
              />
            ))}
          </div>
        )}
      </section>

      {done.length > 0 && (
        <section>
          <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-foreground/55">
            Completed reviews ({done.length})
          </h3>
          <div className="space-y-2 opacity-80">
            {done.map((s) => (
              <ReviewCard
                key={s.id}
                sub={s}
                task={taskOf(s.taskId)}
                step={2}
                perms={{ ...perms, canApproveMangakaStep: false, canApproveEditorStep: false }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
