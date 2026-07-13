import { Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProposalStatusPill, VoteTally } from "@/entities/proposal";
import {
  AUDIENCE_LABEL,
  EIC_TIEBREAK_WEIGHT,
  type ProposalStatus,
  type VoteDecision,
} from "@/entities/proposal/model/proposal-types";
import {
  useBoardVotesQuery,
  useCastBoardVoteMutation,
  useFinalizeDecisionMutation,
  useTieBreakMutation,
} from "../../api/board-queries";
import { useProposalQuery } from "@/features/proposals";
import { EDITORS, isEditorInChief, useAuth } from "@/shared/auth";
import { EmptyState } from "@/shared/ui/empty-state";
import { Panel, ResolvedImage } from "@/shared/ui";

const OPTIONS: { value: VoteDecision; label: string; tone: string }[] = [
  { value: "APPROVE", label: "Approve", tone: "bg-emerald-700 hover:bg-emerald-800" },
  { value: "REJECT", label: "Reject", tone: "bg-rose-700 hover:bg-rose-800" },
  { value: "ABSTAIN", label: "Abstain", tone: "bg-zinc-700 hover:bg-zinc-800" },
];

interface BoardVotePageProps {
  id: string;
}

export function BoardVotePage({ id }: BoardVotePageProps) {
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  const [decision, setDecision] = useState<VoteDecision | null>(null);
  const [comment, setComment] = useState("");
  const [finalizeNote, setFinalizeNote] = useState("");
  const [publicationType, setPublicationType] = useState<"WEEKLY" | "MONTHLY" | undefined>();
  const [tantouEditorId, setTantouEditorId] = useState(EDITORS[0]?.id ?? "");

  const { data: proposal } = useProposalQuery(id);
  const { data: voteData, isLoading: votesLoading } = useBoardVotesQuery(id);
  const castVote = useCastBoardVoteMutation();
  const tieBreak = useTieBreakMutation();
  const finalize = useFinalizeDecisionMutation();

  if (!user) return null;

  if (votesLoading) {
    return (
      <div className="mx-auto max-w-5xl py-12 text-center text-sm text-muted-foreground">
        Loading vote data...
      </div>
    );
  }

  if (!voteData) {
    return (
      <EmptyState
        title="Proposal not found"
        description="Back to the Board queue."
        action={
          <Link to="/app/board" className="text-xs underline">
            Board queue
          </Link>
        }
      />
    );
  }

  const { votes, tally, status } = voteData;
  const proposalStatus = status as ProposalStatus;
  const alreadyVoted = votes.find((v) => v.memberId === user.id);
  const eic = user.role === "editor" && isEditorInChief(user);
  const inTieBreak = status === "TIE_BREAK";

  const submitVote = () => {
    if (!decision) {
      toast.error("Choose one of the three options.");
      return;
    }

    if (inTieBreak && eic) {
      tieBreak.mutate(
        { seriesId: id, body: { voteDecision: decision, comment: comment.trim() || undefined } },
        {
          onSuccess: () => {
            toast.success("Tie-break vote recorded.");
            navigate({ to: "/app/board" });
          },
          onError: (e) => {
            toast.error(e instanceof Error ? e.message : "Tie-break error.");
          },
        },
      );
      return;
    }

    castVote.mutate(
      { seriesId: id, body: { voteDecision: decision, comment: comment.trim() || undefined } },
      {
        onSuccess: () => {
          toast.success("Vote recorded.");
          navigate({ to: "/app/board" });
        },
        onError: (e) => {
          toast.error(e instanceof Error ? e.message : "Vote error.");
        },
      },
    );
  };

  const handleFinalize = (dec: "APPROVED" | "REJECTED") => {
    finalize.mutate(
      {
        seriesId: id,
        body: {
          decision: dec,
          note: finalizeNote.trim() || undefined,
          publicationType: dec === "APPROVED" ? publicationType : undefined,
          tantouEditorId: dec === "APPROVED" ? tantouEditorId : undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success(`Final proposal decision: ${dec}.`);
          navigate({ to: "/app/board" });
        },
        onError: (e) => {
          toast.error(e instanceof Error ? e.message : "Finalize error.");
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        to="/app/board"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Board queue
      </Link>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-3">
          {proposal?.coverUrl || proposal?.coverFileKey ? (
            <ResolvedImage
              fileKey={proposal.coverFileKey}
              fallbackUrl={proposal.coverUrl}
              alt=""
              className="aspect-[2/3] w-full rounded-md border border-border object-cover"
              fallback={
                <div className="flex aspect-[2/3] w-full items-center justify-center rounded-md border border-border bg-muted text-xs text-muted-foreground">
                  No cover
                </div>
              }
            />
          ) : (
            <div className="flex aspect-[2/3] w-full items-center justify-center rounded-md border border-border bg-muted text-xs text-muted-foreground">
              No images
            </div>
          )}
          <div className="rounded border border-border bg-card/40 p-3 text-xs">
            <p>
              <span className="text-muted-foreground">Author:</span> {proposal?.authorName ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Editor:</span>{" "}
              {proposal?.assignedEditorName ?? "—"}
            </p>
            {proposal?.targetAudience && (
              <p>
                <span className="text-muted-foreground">Audience:</span>{" "}
                {AUDIENCE_LABEL[proposal.targetAudience]}
              </p>
            )}
            {proposal?.chaptersPlanned && (
              <p>
                <span className="text-muted-foreground">Chapters:</span> {proposal.chaptersPlanned}
              </p>
            )}
          </div>
        </aside>

        <div className="space-y-6">
          <header>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-serif text-3xl">{proposal?.title ?? voteData.seriesId}</h1>
                {eic ? (
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-fuchsia-700">
                    You are the Editor-in-chief{" "}
                    {inTieBreak ? `· tie-break vote weight ${EIC_TIEBREAK_WEIGHT}` : ""}
                  </p>
                ) : null}
              </div>
              <ProposalStatusPill status={proposalStatus} size="lg" />
            </div>
            {proposal?.synopsis && (
              <p className="mt-3 text-sm leading-relaxed">{proposal.synopsis}</p>
            )}
          </header>

          <VoteTally votes={votes} status={proposalStatus} />

          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0 animate-pulse text-amber-600" />
            <div>
              <p className="font-bold">Board Finalization Advisory Notice</p>
              <p className="mt-0.5 leading-tight">
                Board voting is a crucial step but does not constitute a final decision. Decisions
                must still undergo administrative finalization and validation check processes.
              </p>
            </div>
          </div>

          {inTieBreak ? (
            <div className="rounded-lg border border-fuchsia-300 bg-fuchsia-50 p-4 text-xs text-fuchsia-950">
              Proposal is currently in <strong>TIE_BREAK</strong>. Only{" "}
              <strong>Editor-in-chief</strong> can cast the tie-break vote; the vote has weight{" "}
              {EIC_TIEBREAK_WEIGHT} to determine the result.
            </div>
          ) : null}

          {(user.role === "board" || user.role === "admin") &&
            (status === "PENDING_BOARD" || status === "TIE_BREAK") &&
            tally.status !== null && (
              <Panel
                title="Board Decision (Finalize)"
                description={`The Board has completed voting. Preliminary result: ${tally.status}. Board/Admin can officially finalize this proposal decision and persist the status to the database.`}
              >
                <div className="space-y-1.5">
                  <Label
                    htmlFor="finalize-note"
                    className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    Decision note (optional)
                  </Label>
                  <Textarea
                    id="finalize-note"
                    rows={3}
                    value={finalizeNote}
                    onChange={(e) => setFinalizeNote(e.target.value)}
                    placeholder="Note the meeting outcome or official decision..."
                  />
                </div>
                <div className="mt-3 space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Publication type (required when approving)
                  </Label>
                  <div className="grid max-w-xs grid-cols-2 gap-1.5">
                    {(["WEEKLY", "MONTHLY"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setPublicationType(type)}
                        className={`rounded px-2 py-1.5 text-xs font-semibold transition ${
                          publicationType === type
                            ? "bg-foreground text-background"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {type === "WEEKLY" ? "Weekly" : "Monthly"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  <Label
                    htmlFor="tantou-editor"
                    className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    Tantou Editor (required when approving)
                  </Label>
                  <select
                    id="tantou-editor"
                    value={tantouEditorId}
                    onChange={(e) => setTantouEditorId(e.target.value)}
                    className="h-9 w-full max-w-xs rounded-md border border-border bg-background px-2 text-sm"
                  >
                    {EDITORS.map((editor) => (
                      <option key={editor.id} value={editor.id}>
                        {editor.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFinalize("APPROVED")}
                    disabled={
                      finalize.isPending || finalize.isSuccess || !publicationType || !tantouEditorId
                    }
                    className="rounded bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-40"
                  >
                    {finalize.isPending ? "Processing..." : "Approve (APPROVED)"}
                  </button>
                  <button
                    onClick={() => handleFinalize("REJECTED")}
                    disabled={finalize.isPending || finalize.isSuccess}
                    className="rounded bg-rose-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-800 disabled:opacity-40"
                  >
                    {finalize.isPending ? "Processing..." : "Reject (REJECTED)"}
                  </button>
                </div>
              </Panel>
            )}

          <section className="rounded-lg border border-border bg-card/40 p-5">
            <h2 className="font-serif text-xl">Your vote</h2>
            {alreadyVoted ? (
              <p className="mt-3 rounded bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                You voted <strong>{alreadyVoted.decision}</strong> at{" "}
                {new Date(alreadyVoted.createdAt).toLocaleString("vi-VN")}.
              </p>
            ) : tally.status !== null ? (
              <p className="mt-3 rounded bg-muted px-3 py-2 text-xs text-muted-foreground">
                Voting has ended. Status: {tally.status}.
              </p>
            ) : (
              <>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setDecision(o.value)}
                      disabled={castVote.isPending}
                      className={`rounded px-3 py-3 text-sm font-bold text-white transition ${o.tone} ${
                        decision === o.value
                          ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                          : ""
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                <div className="mt-4 space-y-1.5">
                  <Label
                    htmlFor="vote-comment"
                    className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    Comment (optional)
                  </Label>
                  <Textarea
                    id="vote-comment"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Reason or note for the Board..."
                  />
                </div>
                <button
                  onClick={submitVote}
                  disabled={castVote.isPending}
                  className="mt-4 rounded bg-foreground px-4 py-2 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-40"
                >
                  {castVote.isPending ? "Sending..." : "Submit vote"}
                </button>
              </>
            )}
          </section>

          <div className="rounded border border-dashed border-border bg-card/30 p-4 text-xs">
            <p className="font-semibold text-foreground">Materials & History</p>
            <p className="mt-1 text-muted-foreground">
              Material annotation gating is waiting for backend support.
              {/* Follow-up: wire MaterialsViewer when backend material-annotations endpoint exists */}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
