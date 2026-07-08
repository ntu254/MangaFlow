import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { PenTool } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { ReviewItem } from "../../model/editor-access";
import { formatDateTime } from "@/shared/lib/format-date";
import { PriorityPill } from "@/entities/submission";
import { ReviewStatusPill } from "@/entities/submission";

export function ReviewDetailDrawer({
  item,
  open,
  onOpenChange,
}: {
  item?: ReviewItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {!item ? null : (
          <div className="space-y-5">
            <header className="border-b border-border pb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Review detail
              </p>
              <h2 className="mt-1 font-serif text-2xl">{item.title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.kind} - {item.submittedBy}
              </p>
            </header>

            <section className="grid grid-cols-2 gap-2 text-xs">
              <Info label="Status" value={<ReviewStatusPill status={item.status} />} />
              <Info label="Priority" value={<PriorityPill p={item.priority} />} />
              <Info label="Submitted" value={formatDateTime(item.submittedAt)} />
              <Info
                label="Deadline"
                value={item.deadline ? formatDateTime(item.deadline) : "No deadline"}
              />
            </section>

            <section className="rounded-md border border-border bg-card p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Review SLA
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">Deadline risk</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {item.deadline ? "Tracked" : "No deadline"}
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Use the full review route for annotations, checklist, feedback, and decision
                actions.
              </p>
            </section>

            {item.seriesId ? (
              <Link
                to="/app/editor/series/$seriesId/studio"
                params={{ seriesId: item.seriesId }}
                search={{ chapterId: item.chapterId }}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold hover:bg-muted"
              >
                <PenTool className="size-3.5" /> Open Studio Canvas
              </Link>
            ) : null}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded border border-border bg-background/60 p-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="mt-1">{value}</div>
    </div>
  );
}
