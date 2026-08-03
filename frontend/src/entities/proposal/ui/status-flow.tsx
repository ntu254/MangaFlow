import { Check } from "lucide-react";
import type { ProposalStatus } from "@/entities/proposal/model/proposal-types";
import { STATUS_FLOW, STATUS_LABEL } from "@/entities/proposal/model/proposal-types";
import { cn } from "@/shared/lib/cn";

export function StatusFlow({ status }: { status: ProposalStatus }) {
  const terminal = status === "REJECTED" || status === "WITHDRAWN" || status === "ARCHIVED";
  const currentIndex = status === "CHANGES_REQUESTED" ? 2 : STATUS_FLOW.indexOf(status);

  return (
    <div className="rounded-md border border-border bg-card/40 p-4">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Workflow
      </p>
      <ol className="flex items-center gap-1.5">
        {STATUS_FLOW.map((s, i) => {
          const isPast = !terminal && i < currentIndex;
          const isCurrent = s === status || (status === "CHANGES_REQUESTED" && i === currentIndex);
          const isFuture = terminal || i > currentIndex;

          return (
            <li key={s} className="flex flex-1 items-center gap-1.5">
              <div
                className={cn(
                  "relative flex h-8 flex-1 items-center justify-center gap-1.5 rounded text-[10px] font-semibold uppercase tracking-wider transition-all",
                  isCurrent && "bg-foreground text-background shadow-sm",
                  isPast &&
                    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
                  isFuture && "bg-muted text-muted-foreground/50",
                )}
              >
                {isPast && <Check className="size-3 shrink-0 stroke-[2.5]" />}
                <span>{STATUS_LABEL[s]}</span>
              </div>
              {i < STATUS_FLOW.length - 1 ? (
                <span
                  className={cn(
                    "shrink-0 text-[10px]",
                    isPast ? "text-emerald-500 dark:text-emerald-400" : "text-muted-foreground/40",
                  )}
                >
                  →
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>

      {terminal && (
        <p className="mt-3 text-xs text-muted-foreground">
          Terminal status:{" "}
          <span
            className={cn(
              "font-semibold",
              status === "REJECTED" && "text-rose-600",
              status === "WITHDRAWN" && "text-zinc-600",
              status === "ARCHIVED" && "text-stone-500",
            )}
          >
            {STATUS_LABEL[status]}
          </span>
        </p>
      )}

      {status === "CHANGES_REQUESTED" && (
        <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">
          ✏️ Waiting for author to revise and resubmit.
        </p>
      )}
    </div>
  );
}
