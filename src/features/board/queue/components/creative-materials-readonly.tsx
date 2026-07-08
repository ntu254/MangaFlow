import { MaterialsViewer } from "@/entities/proposal";
import type { User } from "@/shared/auth";
import type { SeriesProposal } from "@/entities/proposal/model/proposal-types";

export function CreativeMaterialsReadonly({
  proposal,
  user,
}: {
  proposal: SeriesProposal;
  user: User;
}) {
  return (
    <section className="rounded-md border border-border bg-card p-4">
      <div className="mb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Creative Materials
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Board review is read-only. No page editing or task creation here.
        </p>
      </div>
      <MaterialsViewer proposal={proposal} user={user} />
    </section>
  );
}
