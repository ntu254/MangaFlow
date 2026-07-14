import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import type { User } from "@/shared/auth";
import type { ProposalAction, SeriesProposal } from "@/entities/proposal/model/proposal-types";
import { allowedActions, checkAction } from "@/entities/proposal";
import { useProposalActionMutation } from "@/features/proposals";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RequestChangesDialog } from "./request-changes-dialog";
import { ResubmitDialog } from "./resubmit-dialog";
import { useMySeriesQuery } from "@/entities/series";

const LABELS: Record<ProposalAction, string> = {
  EDIT: "Edit",
  SUBMIT: "Send to Editor",
  RESUBMIT: "Resubmit",
  WITHDRAW: "Withdraw",
  CLAIM: "Claim review",
  RELEASE_CLAIM: "Release claim",
  REASSIGN_CLAIM: "Transfer claim",
  REQUEST_CHANGES: "Changes requested",
  FORWARD: "Send to Board",
  REJECT: "Reject",
  RECALL: "Recall from Board",
  VOTE: "Vote",
  FORCE_STATUS: "Force status",
};

const TONES: Partial<Record<ProposalAction, string>> = {
  SUBMIT: "bg-foreground text-background hover:bg-foreground/90",
  RESUBMIT: "bg-foreground text-background hover:bg-foreground/90",
  FORWARD: "bg-emerald-700 text-white hover:bg-emerald-800",
  REQUEST_CHANGES: "bg-amber-600 text-white hover:bg-amber-700",
  REJECT: "bg-rose-700 text-white hover:bg-rose-800",
  WITHDRAW: "bg-zinc-700 text-white hover:bg-zinc-800",
  RECALL: "bg-indigo-700 text-white hover:bg-indigo-800",
  CLAIM: "bg-blue-700 text-white hover:bg-blue-800",
  VOTE: "bg-foreground text-background hover:bg-foreground/90",
  EDIT: "bg-card text-foreground border border-border hover:bg-muted",
  FORCE_STATUS: "bg-card text-foreground border border-border hover:bg-muted",
};

const REQUIRES_COMMENT: ProposalAction[] = ["REJECT"];

export function ActionPanel({ proposal, user }: { proposal: SeriesProposal; user: User }) {
  const navigate = useNavigate();
  const actionMutation = useProposalActionMutation(proposal.id);
  const [open, setOpen] = useState<ProposalAction | null>(null);
  const [comment, setComment] = useState("");
  const [changesOpen, setChangesOpen] = useState(false);
  const [resubmitOpen, setResubmitOpen] = useState(false);
  const { data: seriesList = [] } = useMySeriesQuery();
  const existingSeries = seriesList.find((x) => x.proposalId === proposal.id);
  const canOpenBoardQueue =
    user.role === "board" &&
    (proposal.status === "PENDING_BOARD" || proposal.status === "TIE_BREAK");

  const actions = allowedActions(user, proposal);
  // Admin sees all, others see only allowed.
  const visible = user.role === "admin" ? (Object.keys(LABELS) as ProposalAction[]) : actions;

  const run = (action: ProposalAction) => {
    if (action === "EDIT") {
      navigate({
        to: "/app/submissions/$id",
        params: { id: proposal.id },
        search: { edit: true },
      });
      return;
    }
    if (action === "VOTE") {
      navigate({ to: "/app/board/$id", params: { id: proposal.id } });
      return;
    }
    if (action === "REQUEST_CHANGES") {
      setChangesOpen(true);
      return;
    }
    if (action === "RESUBMIT") {
      setResubmitOpen(true);
      return;
    }
    if (
      REQUIRES_COMMENT.includes(action) ||
      action === "WITHDRAW" ||
      action === "RECALL" ||
      action === "FORWARD"
    ) {
      setComment("");
      setOpen(action);
      return;
    }
    actionMutation.mutate(
      { action },
      {
        onSuccess: () => {
          toast.success(`${LABELS[action]} completed.`);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Unknown error.");
        },
      },
    );
  };

  const confirm = () => {
    if (!open) return;
    if (REQUIRES_COMMENT.includes(open) && comment.trim().length < 8) {
      toast.error("Please enter at least 8 characters.");
      return;
    }
    actionMutation.mutate(
      { action: open, payload: { comment: comment.trim() || undefined } },
      {
        onSuccess: () => {
          toast.success(`${LABELS[open]} completed.`);
          setOpen(null);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Unknown error.");
        },
      },
    );
  };

  return (
    <div className="rounded-md border border-border bg-card/40 p-4">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Actions
      </p>
      {visible.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No actions are available for the current role.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {visible.map((a) => {
            const check = checkAction(a, user, proposal);
            const disabled = !check.ok;
            return (
              <button
                key={a}
                onClick={() => run(a)}
                disabled={disabled}
                title={disabled ? check.reason : LABELS[a]}
                className={`rounded px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${TONES[a] ?? "bg-card text-foreground border border-border hover:bg-muted"}`}
              >
                {LABELS[a]}
              </button>
            );
          })}
        </div>
      )}

      {existingSeries ? (
        <div className="mt-3 border-t border-border pt-3">
          <button
            onClick={() =>
              navigate({
                to: "/app/series/$slug/$tab",
                params: { slug: existingSeries.slug, tab: "overview" },
              })
            }
            className="rounded bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
          >
            In production - open series
          </button>
        </div>
      ) : null}

      {canOpenBoardQueue ? (
        <div className="mt-3 border-t border-border pt-3">
          <button
            onClick={() => navigate({ to: "/app/board/$id", params: { id: proposal.id } })}
            className="rounded bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-800"
          >
            Open Board voting
          </button>
        </div>
      ) : null}

      <Dialog open={open !== null} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{open ? LABELS[open] : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="comment">
              Comment {open && REQUIRES_COMMENT.includes(open) ? "(required)" : "(optional)"}
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                open === "REJECT" ? "Explain the rejection reason..." : "Note (optional)..."
              }
              rows={5}
            />
          </div>
          <DialogFooter>
            <button
              onClick={() => setOpen(null)}
              className="rounded border border-border px-3 py-1.5 text-xs"
            >
              Cancel
            </button>
            <button
              onClick={confirm}
              className="rounded bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
            >
              Confirm
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RequestChangesDialog
        proposal={proposal}
        user={user}
        open={changesOpen}
        onClose={() => setChangesOpen(false)}
        onRequestChanges={async (payload) => {
          await actionMutation.mutateAsync({
            action: "REQUEST_CHANGES",
            payload,
          });
        }}
      />
      <ResubmitDialog
        proposal={proposal}
        user={user}
        open={resubmitOpen}
        onClose={() => setResubmitOpen(false)}
        onResubmit={async (payload) => {
          await actionMutation.mutateAsync({
            action: "RESUBMIT",
            payload,
          });
        }}
      />
    </div>
  );
}
