import { ProposalStatusPill } from "@/entities/proposal";
import type { SeriesProposal } from "@/entities/proposal/model/proposal-types";

export function ProposalSummaryCard({ proposal }: { proposal: SeriesProposal }) {
  return (
    <section className="rounded-md border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Proposal Summary
          </p>
          <h2 className="mt-1 font-serif text-2xl">{proposal.title}</h2>
        </div>
        <ProposalStatusPill status={proposal.status} />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-foreground/80">{proposal.synopsis}</p>
      <div className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
        <Meta label="Author" value={proposal.authorName} />
        <Meta label="Audience" value={proposal.targetAudience} />
        <Meta label="Genres" value={proposal.genres.slice(0, 3).join(" / ")} />
      </div>
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border bg-background px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate font-medium">{value}</p>
    </div>
  );
}
