import type { ProposalEvent } from "@/entities/proposal/model/proposal-types";
import { RoleBadge } from "@/entities/user";

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}h`;
  return `${Math.floor(d / 86400)}d`;
}

const TYPE_LABEL: Record<ProposalEvent["type"], string> = {
  CREATE: "created proposal",
  SUBMIT: "submitted to editor",
  RESUBMIT: "resubmitted after edits",
  REQUEST_CHANGES: "requested changes",
  FORWARD: "sent to Board review",
  RECALL: "recalled from Board",
  REJECT: "reject proposal",
  VOTE: "vote",
  DECIDE: "made a decision",
  WITHDRAW: "withdrew proposal",
  CLAIM: "claim review",
  RELEASE_CLAIM: "released claim",
  REASSIGN_CLAIM: "reassigned claim",
  EDIT: "updated",
  TIE_BREAK: "moved to tie-break",
  MANUSCRIPT_UPLOAD: "upload manuscript",
  FINALIZE_BOARD_DECISION: "finalized Board decision",
};

export function Timeline({ events }: { events: ProposalEvent[] }) {
  const sorted = [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <ol className="relative space-y-4 border-l border-border pl-5">
      {sorted.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[27px] top-1.5 size-2.5 rounded-full border-2 border-background bg-foreground" />
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-foreground">{e.actorName}</span>
            <RoleBadge role={e.actorRole} />
            <span className="text-muted-foreground">{TYPE_LABEL[e.type]}</span>
            <span className="ml-auto text-[10px] text-muted-foreground">
              {timeAgo(e.createdAt)}
            </span>
          </div>
          {e.fromStatus || e.toStatus ? (
            <p className="mt-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              {e.fromStatus ?? "—"} → {e.toStatus ?? "—"}
            </p>
          ) : null}
          {e.comment ? (
            <p className="mt-1 rounded border-l-2 border-accent bg-muted/40 px-3 py-1.5 text-xs text-foreground/80">
              {e.comment}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
