import type { ProposalStatus } from "@/entities/proposal/model/proposal-types";
import { STATUS_FLOW, STATUS_LABEL } from "@/entities/proposal/model/proposal-types";
import { cn } from "@/shared/lib/cn";

export function StatusFlow({ status }: { status: ProposalStatus }) {
  const terminal = status === "REJECTED" || status === "WITHDRAWN" || status === "ARCHIVED";
  const branchIndex = status === "CHANGES_REQUESTED" ? 2 : STATUS_FLOW.indexOf(status);
  return (
    <div className="rounded-md border border-border bg-card/40 p-4">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Workflow
      </p>
      <ol className="flex items-center gap-2">
        {STATUS_FLOW.map((s, i) => {
          const active = i <= branchIndex && !terminal;
          const current = s === status;
          return (
            <li key={s} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex h-7 flex-1 items-center justify-center rounded text-[10px] font-semibold uppercase tracking-wider",
                  current
                    ? "bg-foreground text-background"
                    : active
                      ? "bg-foreground/15 text-foreground"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {STATUS_LABEL[s]}
              </div>
              {i < STATUS_FLOW.length - 1 ? <span className="text-muted-foreground">→</span> : null}
            </li>
          );
        })}
      </ol>
      {terminal ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Final status:{" "}
          <span className="font-semibold text-foreground">{STATUS_LABEL[status]}</span>
        </p>
      ) : status === "CHANGES_REQUESTED" ? (
        <p className="mt-3 text-xs text-amber-900">
          Waiting for the author to revise and resubmit.
        </p>
      ) : null}
    </div>
  );
}
