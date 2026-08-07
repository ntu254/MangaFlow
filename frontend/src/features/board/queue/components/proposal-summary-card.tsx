import { ProposalStatusPill } from "@/entities/proposal";
import type { SeriesProposal } from "@/entities/proposal/model/proposal-types";

export function ProposalSummaryCard({ proposal }: { proposal: SeriesProposal }) {
  return (
    <div className="space-y-4">
      {proposal.logline ? (
        <Meta label="Logline" value={proposal.logline} />
      ) : null}
      {proposal.hook ? (
        <Meta label="Core Hook" value={proposal.hook} />
      ) : null}
      
      <div className="rounded-xl border border-border/50 bg-background/50 p-4 space-y-1">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Full Synopsis
        </span>
        <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">{proposal.synopsis}</p>
      </div>

      {proposal.mainCharacters ? (
        <Meta label="Main Characters" value={proposal.mainCharacters} />
      ) : null}

      {proposal.advanced ? (
        <div className="space-y-3 pt-3 border-t border-border/50">
          {proposal.advanced.worldSetting ? <Meta label="World Setting" value={proposal.advanced.worldSetting} /> : null}
          {proposal.advanced.seriesDirection ? <Meta label="Series Direction" value={proposal.advanced.seriesDirection} /> : null}
          {proposal.advanced.comparableTitles ? <Meta label="Comparable Titles" value={proposal.advanced.comparableTitles} /> : null}
        </div>
      ) : null}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/50 p-3.5 space-y-1">
      <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">{value}</p>
    </div>
  );
}

