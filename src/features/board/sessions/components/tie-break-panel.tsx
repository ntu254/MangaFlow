import { useState } from "react";
import { toast } from "sonner";
import type { User } from "@/shared/auth";
import type { SeriesProposal, VoteDecision } from "@/entities/proposal/model/proposal-types";
import { useTieBreakMutation } from "../../api/board-queries";
import type { VotingSession } from "@/entities/board/model/voting-types";
import { Textarea } from "@/components/ui/textarea";

const OPTIONS: { value: VoteDecision; label: string; tone: string }[] = [
  { value: "APPROVE", label: "Phá tie → Approve", tone: "bg-emerald-700 hover:bg-emerald-800" },
  { value: "REJECT", label: "Phá tie → Reject", tone: "bg-rose-700 hover:bg-rose-800" },
];

export function TieBreakPanel({
  session,
  proposal,
  user,
}: {
  session: VotingSession;
  proposal: SeriesProposal;
  user: User;
}) {
  const tieBreak = useTieBreakMutation();
  const [decision, setDecision] = useState<VoteDecision | null>(null);
  const [comment, setComment] = useState("");

  const submit = () => {
    if (!decision) {
      toast.error("Chọn 1 lựa chọn.");
      return;
    }
    tieBreak.mutate(
      {
        seriesId: proposal.id,
        body: {
          voteDecision: decision,
          comment: comment.trim() || undefined,
        },
      },
      {
        onSuccess: () => toast.success("Đã phá tie."),
        onError: (e) => toast.error(e instanceof Error ? e.message : "Lỗi."),
      },
    );
  };

  return (
    <div className="rounded border border-fuchsia-300 bg-background p-3">
      <div className="flex items-center justify-between">
        <p className="font-serif text-base">{proposal.title}</p>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {proposal.votes.filter((v) => v.decision === "APPROVE").length} APPROVE ·{" "}
          {proposal.votes.filter((v) => v.decision === "REJECT").length} REJECT
        </span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => setDecision(o.value)}
            className={`rounded px-3 py-2 text-xs font-bold text-white transition ${o.tone} ${
              decision === o.value
                ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                : ""
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <Textarea
        className="mt-3"
        rows={2}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Lý do quyết định (tuỳ chọn)…"
      />
      <button
        onClick={submit}
        className="mt-2 rounded bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
      >
        Chốt phá tie
      </button>
    </div>
  );
}
