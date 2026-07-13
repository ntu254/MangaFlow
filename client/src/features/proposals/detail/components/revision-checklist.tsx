import type { SeriesProposal } from "@/entities/proposal/model/proposal-types";

export function RevisionChecklist({ proposal }: { proposal: SeriesProposal }) {
  if (proposal.requestedChanges.length === 0) {
    return (
      <p className="rounded border border-dashed border-border bg-card/40 p-4 text-xs text-muted-foreground">
        No revision rounds yet.
      </p>
    );
  }
  const rounds = [...proposal.requestedChanges].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  return (
    <ol className="space-y-3">
      {rounds.map((rc, idx) => {
        const done = rc.items.filter((it) => it.resolved).length;
        const open = !rc.resolvedAt;
        return (
          <li key={rc.id} className="rounded-lg border border-border bg-card/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold">
                Round {rounds.length - idx} · {rc.editorName}
                {open ? (
                  <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                    Open
                  </span>
                ) : (
                  <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-900">
                    Resolved in v{rc.resolvedInVersion}
                  </span>
                )}
              </p>
              <span className="text-[10px] font-mono text-muted-foreground">
                {done}/{rc.items.length} items
              </span>
            </div>
            {rc.comment ? <p className="mt-1 text-xs text-foreground/80">{rc.comment}</p> : null}
            <ul className="mt-3 space-y-1.5">
              {rc.items.map((it) => (
                <li key={it.id} className="flex items-start gap-2 text-xs">
                  <span
                    className={`mt-0.5 size-3.5 shrink-0 rounded border ${it.resolved ? "border-emerald-700 bg-emerald-600" : "border-border bg-background"}`}
                  >
                    {it.resolved ? (
                      <span className="block translate-x-[1px] translate-y-[-2px] text-[10px] leading-none text-white">
                        ✓
                      </span>
                    ) : null}
                  </span>
                  <div className="flex-1">
                    <p className={it.resolved ? "line-through text-muted-foreground" : ""}>
                      {it.text}
                    </p>
                    {it.response ? (
                      <p className="mt-0.5 rounded border-l-2 border-accent bg-muted/40 px-2 py-1 text-[11px] text-foreground/80">
                        ↳ {it.response}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}
