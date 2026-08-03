import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { User } from "@/shared/auth";
import { useCreateVotingSessionMutation } from "../../api/board-queries";
import { useProposalsQuery } from "@/features/proposals";
import type { VotingSession } from "@/entities/board/model/voting-types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ResolvedImage } from "@/shared/ui";

export function SessionForm({
  user: _user,
  onCreated,
}: {
  user: User;
  onCreated: (s: VotingSession) => void;
}) {
  const { data: proposals = [], isLoading: isLoadingProposals } = useProposalsQuery({
    status: "PENDING_BOARD",
  });
  const createSessionMutation = useCreateVotingSessionMutation();
  const [title, setTitle] = useState("Board meeting");
  const [selected, setSelected] = useState<string[]>([]);
  const [tiePolicy, setTiePolicy] = useState<"CHAIR_DECIDES" | "REJECT" | "RETURN_TO_BOARD">(
    "CHAIR_DECIDES",
  );

  const eligible = useMemo(
    () => proposals.filter((p) => p.status === "PENDING_BOARD"),
    [proposals],
  );

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? [] : [id]));
  };

  const submit = async () => {
    try {
      const session = await createSessionMutation.mutateAsync({
        title: title.trim() || "Board meeting",
        mode: "AD_HOC",
        proposalIds: selected,
        tiePolicy,
      });
      toast.success("Session created.");
      onCreated(session);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  return (
    <div className="space-y-5 rounded-lg border border-border bg-card/40 p-5">
      <div className="grid gap-3">
        <div className="space-y-1.5">
          <Label
            htmlFor="title"
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
          >
            Title
          </Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tie-policy" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Policy if the re-vote is still tied
        </Label>
        <select
          id="tie-policy"
          value={tiePolicy}
          onChange={(event) => setTiePolicy(event.target.value as typeof tiePolicy)}
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="CHAIR_DECIDES">Chair decides</option>
          <option value="REJECT">Reject proposal</option>
          <option value="RETURN_TO_BOARD">Return to Board queue</option>
        </select>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Select proposals ({selected.length}
          /1)
        </p>
        {isLoadingProposals ? (
          <p className="rounded border border-dashed border-border p-4 text-xs text-muted-foreground">
            Loading proposals...
          </p>
        ) : eligible.length === 0 ? (
          <p className="rounded border border-dashed border-border p-4 text-xs text-muted-foreground">
            No proposals are currently awaiting Board review.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {eligible.map((p) => {
              const active = selected.includes(p.id);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => toggle(p.id)}
                    className={`flex w-full items-start gap-2 rounded border p-2 text-left text-xs ${
                      active
                        ? "border-foreground bg-foreground/5"
                        : "border-border bg-card hover:bg-muted"
                    }`}
                  >
                    <ResolvedImage
                      fileKey={p.coverFileKey}
                      fallbackUrl={p.coverUrl}
                      alt=""
                      className="h-12 w-9 rounded object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{p.title}</p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {p.authorName} - {formatProposalStatus(p.status)} - {(p.votes ?? []).length}
                        /5
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={submit}
          disabled={selected.length === 0 || createSessionMutation.isPending}
          className="rounded bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-40"
        >
          Create session
        </button>
      </div>
    </div>
  );
}

function formatProposalStatus(status: string) {
  switch (status) {
    case "PENDING_BOARD":
      return "Awaiting Board review";
    default:
      return "Other status";
  }
}
