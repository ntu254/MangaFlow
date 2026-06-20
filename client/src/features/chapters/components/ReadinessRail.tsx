import { CheckCircle2, Circle, XCircle, AlertTriangle, ListChecks } from "lucide-react";
import { toast } from "sonner";
import type { Task, Submission } from "@/entities";
import { computeBlockers, isReadyForPublication, readinessChecklist } from "../lib/readiness";
import { PHASE_LABEL, type ProductionPhase } from "../lib/productionPhase";
import type { ChapterPerms } from "../lib/chapterPermissions";

export function ReadinessRail({
  tasks,
  subs,
  phase,
  perms,
}: {
  tasks: Task[];
  subs: Submission[];
  phase: ProductionPhase;
  perms: ChapterPerms;
}) {
  const checklist = readinessChecklist(tasks);
  const blockers = computeBlockers(tasks, subs);
  const ready = isReadyForPublication(tasks);
  const canMark = perms.canMarkReady && ready;

  return (
    <aside className="space-y-3 lg:sticky lg:top-4 self-start">
      <section className="rounded-md border border-foreground/10 bg-card p-3">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-foreground/55">
          <ListChecks className="h-3.5 w-3.5" /> Required tasks
        </div>
        {checklist.length === 0 ? (
          <div className="text-[12px] text-foreground/55">No required tasks defined yet.</div>
        ) : (
          <ul className="space-y-1.5">
            {checklist.slice(0, 5).map((c) => (
              <li key={c.id} className="flex items-center gap-2 text-[12px]">
                {c.state === "done" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                ) : c.state === "failed" ? (
                  <XCircle className="h-3.5 w-3.5 text-destructive" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-foreground/40" />
                )}
                <span className="truncate text-foreground/80">{c.label}</span>
              </li>
            ))}
            {checklist.length > 5 && (
              <li className="pl-5 text-[11px] text-foreground/55">
                + {checklist.length - 5} more
              </li>
            )}
          </ul>
        )}
      </section>

      <section className="rounded-md border border-foreground/10 bg-card p-3">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-foreground/55">
          <AlertTriangle className="h-3.5 w-3.5" /> Blockers
        </div>
        {blockers.length === 0 ? (
          <div className="text-[12px] text-emerald-500">No blockers — ready to publish.</div>
        ) : (
          <ul className="space-y-1 text-[12px] text-foreground/75">
            {blockers.slice(0, 3).map((b) => (
              <li key={b.id}>· {b.label}</li>
            ))}
          </ul>
        )}
        <button
          onClick={() =>
            toast.success(
              blockers.length === 0
                ? "Readiness check passed."
                : `${blockers.length} blocker(s) remaining.`,
            )
          }
          className="mt-3 inline-flex h-7 w-full items-center justify-center rounded-md border border-foreground/15 text-[11px] font-medium hover:bg-foreground/5"
        >
          Run readiness check
        </button>
        {perms.canMarkReady && (
          <button
            disabled={!canMark}
            onClick={() => {
              if (!confirm("Mark this chapter as ready for publication?")) return;
              toast.success("Chapter marked as ready for publication.");
            }}
            title={
              !canMark
                ? "All required tasks must be Editor-approved before marking ready."
                : undefined
            }
            className="mt-2 inline-flex h-8 w-full items-center justify-center rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground hover:bg-primary/90 disabled:bg-foreground/10 disabled:text-foreground/40"
          >
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
    </aside>
  );
}
