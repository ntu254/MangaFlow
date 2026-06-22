import { CheckCircle2, Circle, XCircle, AlertTriangle, ListChecks, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Task, Submission } from "@/entities";
import { computeBlockers, isReadyForPublication, readinessChecklist } from "../lib/readiness";
import { PHASE_LABEL, type ProductionPhase } from "../lib/productionPhase";
import type { ChapterPerms } from "../lib/chapterPermissions";
import { useState } from "react";
import { useChapterReadiness, useMarkChapterReady } from "@/shared/queries/useChapterPages";
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

export function ReadinessRail({
  tasks,
  subs,
  phase,
  perms,
  chapterId,
}: {
  tasks: Task[];
  subs: Submission[];
  phase: ProductionPhase;
  perms: ChapterPerms;
  chapterId?: string;
}) {
  const checklist = readinessChecklist(tasks);
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

  // Choose display sources (server vs local)
  const displayItems = serverReadiness
    ? serverReadiness.items
    : checklist.map((c) => ({
        key: c.id,
        passed: c.state === "done",
        reason: c.label,
      }));

  const displayReady = serverReadiness ? serverReadiness.ready : localReady;
  const displayBlockersCount = serverReadiness
    ? serverReadiness.items.filter((i) => !i.passed).length
    : localBlockers.length;

  const canMark = perms.canMarkReady && displayReady;

  const handleRunCheck = async () => {
    setServerChecked(true);
    if (chapterId) {
      await refetch();
    }
    toast.success(
      displayReady
        ? "Readiness check passed."
        : `${displayBlockersCount} blocker(s) remaining.`
    );
  };

  const handleMarkReady = () => {
    if (!chapterId) return;
    markReady.mutate(chapterId, {
      onSuccess: () => {
        setDialogOpen(false);
        toast.success("Chapter marked as ready for publication.");
      },
    });
  };

  return (
    <aside className="space-y-3 lg:sticky lg:top-4 self-start">
      <section className="rounded-md border border-foreground/10 bg-card p-3">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-foreground/55">
          <ListChecks className="h-3.5 w-3.5" /> Required tasks
        </div>
        {displayItems.length === 0 ? (
          <div className="text-[12px] text-foreground/55">No required tasks defined yet.</div>
        ) : (
          <ul className="space-y-1.5">
            {displayItems.slice(0, 5).map((c) => (
              <li key={c.key} className="flex items-center gap-2 text-[12px]">
                {c.passed ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                )}
                <span className="truncate text-foreground/80">{c.reason}</span>
              </li>
            ))}
            {displayItems.length > 5 && (
              <li className="pl-5 text-[11px] text-foreground/55">+ {displayItems.length - 5} more</li>
            )}
          </ul>
        )}
      </section>

      <section className="rounded-md border border-foreground/10 bg-card p-3">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-foreground/55">
          <AlertTriangle className="h-3.5 w-3.5" /> Blockers
        </div>
        {isCheckLoading ? (
          <div className="flex items-center gap-1.5 text-[11px] text-foreground/45 py-1">
            <Loader2 className="h-3 w-3 animate-spin" /> Checking...
          </div>
        ) : displayBlockersCount === 0 ? (
          <div className="text-[12px] text-emerald-500">No blockers — ready to publish.</div>
        ) : (
          <div className="text-[12px] text-destructive/80">
            {displayBlockersCount} blocker(s) remaining.
          </div>
        )}
        <button
          onClick={handleRunCheck}
          disabled={isCheckLoading}
          className="mt-3 inline-flex h-7 w-full items-center justify-center rounded-md border border-foreground/15 text-[11px] font-medium hover:bg-foreground/5 disabled:opacity-50"
        >
          {isCheckLoading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
          Run readiness check
        </button>
        {perms.canMarkReady && (
          <button
            disabled={!displayReady || markReady.isPending}
            onClick={() => {
              setDialogOpen(true);
            }}
            title={
              !displayReady
                ? "All required tasks must be Editor-approved before marking ready."
                : undefined
            }
            className="mt-2 inline-flex h-8 w-full items-center justify-center rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground hover:bg-primary/90 disabled:bg-foreground/10 disabled:text-foreground/40"
          >
            {markReady.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
            Mark ready for publication
          </button>
        )}
      </section>

      <section className="rounded-md border border-foreground/10 bg-card p-3 text-[12px]">
        <div className="text-[11px] font-medium uppercase tracking-wider text-foreground/55">
          Phase
        </div>
        <div className="mt-1 font-medium">{PHASE_LABEL[phase]}</div>
        <div className="mt-2 text-foreground/55">
          {phase === "draft" && "Upload pages to begin production."}
          {phase === "in-production" && "Continue assigning, submitting, and reviewing tasks."}
          {phase === "ready" && "All tasks approved — chapter can be scheduled or published."}
          {phase === "published" && "This chapter is live."}
        </div>
      </section>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ready for Publication</AlertDialogTitle>
            <AlertDialogDescription>
              Mark this chapter as ready for publication?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={markReady.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkReady}
              disabled={markReady.isPending}
            >
              {markReady.isPending ? "Marking..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
