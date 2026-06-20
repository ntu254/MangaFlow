import { CheckCircle2, Circle, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { Task, Submission } from "@/entities";
import { computeBlockers, isReadyForPublication, readinessChecklist } from "../../lib/readiness";
import type { ChapterPerms } from "../../lib/chapterPermissions";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/shadcn/alert-dialog";

export function ReadinessTab({
  tasks,
  subs,
  perms,
}: {
  tasks: Task[];
  subs: Submission[];
  perms: ChapterPerms;
}) {
  const checklist = readinessChecklist(tasks);
  const blockers = computeBlockers(tasks, subs);
  const ready = isReadyForPublication(tasks);

  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-5">
      <section>
        <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-foreground/55">
          Required tasks
        </h3>
        {checklist.length === 0 ? (
          <div className="text-[12px] text-foreground/55">No required tasks defined yet.</div>
        ) : (
          <ul className="divide-y divide-foreground/10 rounded border border-foreground/10">
            {checklist.map((c) => (
              <li key={c.id} className="flex items-center gap-2 px-3 py-2 text-[12px]">
                {c.state === "done" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : c.state === "failed" ? (
                  <XCircle className="h-4 w-4 text-destructive" />
                ) : (
                  <Circle className="h-4 w-4 text-foreground/40" />
                )}
                <span>{c.label}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-foreground/55">
          Blockers
        </h3>
        {blockers.length === 0 ? (
          <div className="text-[12px] text-emerald-500">No blockers.</div>
        ) : (
          <ul className="space-y-1 text-[12px] text-foreground/75">
            {blockers.map((b) => (
              <li key={b.id}>· {b.label}</li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex gap-2">
        <button
          onClick={() =>
            toast.success(
              blockers.length === 0
                ? "Readiness check passed."
                : `${blockers.length} blocker(s) remaining.`,
            )
          }
          className="h-8 rounded-md border border-foreground/15 px-3 text-[12px] font-medium hover:bg-foreground/5"
        >
          Run readiness check
        </button>
        {perms.canMarkReady && (
          <button
            disabled={!ready}
            onClick={() => {
              setDialogOpen(true);
            }}
            className="h-8 rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground hover:bg-primary/90 disabled:bg-foreground/10 disabled:text-foreground/40"
          >
            Mark ready for publication
          </button>
        )}
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ready for Publication</AlertDialogTitle>
            <AlertDialogDescription>
              Mark this chapter as ready for publication?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                toast.success("Chapter marked as ready for publication.");
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
