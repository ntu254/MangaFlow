import type { Task } from "@/entities";
import { TaskCard } from "./TaskCard";
import { COLUMN_META, DEFAULT_COLUMNS, type ColumnKey } from "../lib/assistantTaskStatus";
import { Inbox } from "lucide-react";

export function TaskKanban({
  tasks,
  showApproved,
  showPayout,
  showAssignee,
}: {
  tasks: Task[];
  showApproved: boolean;
  showPayout: boolean;
  showAssignee: boolean;
}) {
  const columns: ColumnKey[] = showApproved ? [...DEFAULT_COLUMNS, "approved"] : DEFAULT_COLUMNS;

  return (
    <div className="-mx-2 overflow-x-auto pb-2">
      <div
        className="mx-2 grid gap-3"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(260px, 1fr))` }}
      >
        {columns.map((key) => {
          const meta = COLUMN_META[key];
          const items = tasks.filter((t) => t.status === key);
          return (
            <section
              key={key}
              className="flex min-h-[200px] flex-col rounded-md border border-foreground/10 bg-card"
            >
              <header className="flex items-center justify-between border-b border-foreground/10 px-3 py-2">
                <div>
                  <div className="text-[12px] font-semibold text-foreground">{meta.label}</div>
                  <div className="text-[10px] text-foreground/50">{meta.hint}</div>
                </div>
                <span className="rounded-full border border-foreground/15 bg-muted px-2 py-0.5 text-[11px] tabular-nums text-foreground/70">
                  {items.length}
                </span>
              </header>
              <div className="flex-1 space-y-2 p-2">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-1 py-8 text-foreground/40">
                    <Inbox className="h-4 w-4" />
                    <span className="text-[11px]">No tasks</span>
                  </div>
                ) : (
                  items.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      showPayout={showPayout}
                      showAssignee={showAssignee}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
