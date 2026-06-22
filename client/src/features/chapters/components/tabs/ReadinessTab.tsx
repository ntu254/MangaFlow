import { CheckCircle2, Circle, XCircle, Loader2, RefreshCw } from "lucide-react";
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
import { useChapterReadiness, useMarkChapterReady } from "@/shared/queries/useChapterPages";

export function ReadinessTab({
  tasks,
  subs,
  perms,
  chapterId,
}: {
  tasks: Task[];
  subs: Submission[];
  perms: ChapterPerms;
  chapterId?: string;
}) {
  const localChecklist = readinessChecklist(tasks);
  const localBlockers = computeBlockers(tasks, subs);
  const localReady = isReadyForPublication(tasks);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [serverChecked, setServerChecked] = useState(false);

  const {
    data: serverReadiness,
    isLoading: isCheckLoading,
    refetch,
  } = useChapterReadiness(serverChecked ? chapterId : undefined);

  const markReady = useMarkChapterReady();

  // Use server data if available after explicit check, otherwise use local
  const displayItems = serverReadiness
    ? serverReadiness.items
    : localChecklist.map((c) => ({
        key: c.id,
        passed: c.state === "done",
        reason: c.label,
      }));

  const displayReady = serverReadiness ? serverReadiness.ready : localReady;
  const displayBlockers = serverReadiness
    ? serverReadiness.items.filter((i) => !i.passed)
    : localBlockers.map((b) => ({ key: b.id, passed: false, reason: b.label }));

  const handleRunCheck = async () => {
    setServerChecked(true);
    if (chapterId) {
      await refetch();
    }
  };

  const handleMarkReady = () => {
    if (!chapterId) return;
    markReady.mutate(chapterId, {
      onSuccess: () => setDialogOpen(false),
    });
  };

  return (
    <div className="space-y-5">
      <section>
        <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-foreground/55">
          Required tasks
        </h3>
        {isCheckLoading ? (
          <div className="flex items-center gap-2 py-3 text-[12px] text-foreground/50">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Running readiness check…
          </div>
        ) : displayItems.length === 0 ? (
          <div className="text-[12px] text-foreground/55">No required tasks defined yet.</div>
        ) : (
          <ul className="divide-y divide-foreground/10 rounded border border-foreground/10">
            {displayItems.map((item) => (
              <li key={item.key} className="flex items-start gap-2 px-3 py-2 text-[12px]">
                {item.passed ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                )}
                <span className={item.passed ? "text-foreground/70" : "text-foreground"}>
                  {item.reason}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!isCheckLoading && displayBlockers.length > 0 && (
        <section>
          <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-foreground/55">
            Blockers ({displayBlockers.length})
          </h3>
          <ul className="space-y-1 text-[12px] text-destructive/80">
            {displayBlockers.map((b) => (
              <li key={b.key} className="flex items-start gap-1.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                {b.reason}
              </li>
            ))}
          </ul>
        </section>
      )}

      {!isCheckLoading && displayReady && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-[12px] text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          All readiness checks passed. Chapter is ready for publication.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleRunCheck}
          disabled={isCheckLoading}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-foreground/15 px-3 text-[12px] font-medium hover:bg-foreground/5 disabled:opacity-50"
        >
          {isCheckLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Run readiness check
        </button>

        {perms.canMarkReady && (
          <button
            disabled={!displayReady || markReady.isPending}
            onClick={() => setDialogOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground hover:bg-primary/90 disabled:bg-foreground/10 disabled:text-foreground/40"
          >
            {markReady.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Mark ready for publication
          </button>
        )}
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Chapter Ready for Publication</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the chapter to <strong>READY_FOR_PUBLICATION</strong> status. All
              required tasks must be Editor-approved. This action cannot be undone without admin
              intervention.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={markReady.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkReady}
              disabled={markReady.isPending}
            >
              {markReady.isPending ? "Marking…" : "Confirm — Mark Ready"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
