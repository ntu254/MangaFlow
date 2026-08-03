import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import type { User } from "@/shared/auth";
import type { ProposalAction, SeriesProposal } from "@/entities/proposal/model/proposal-types";
import { allowedActions, checkAction } from "@/entities/proposal";
import { useProposalActionMutation } from "@/features/proposals";
import { Modal, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RequestChangesModal } from "./request-changes-modal";
import { ResubmitModal } from "./resubmit-modal";
import { useMySeriesQuery } from "@/entities/series";
import {
  useActiveVotingSession,
  useCreateVotingSessionMutation,
  useUpdateVotingSessionMutation,
  useVotingSessionsQuery,
} from "@/features/board";

const LABELS: Record<ProposalAction, string> = {
  EDIT: "Edit",
  SUBMIT: "Submit to Editor",
  RESUBMIT: "Resubmit",
  WITHDRAW: "Withdraw",
  CLAIM: "Claim review",
  RELEASE_CLAIM: "Release claim",
  REQUEST_CHANGES: "Request changes",
  FORWARD: "Forward to Board",
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
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachTarget, setAttachTarget] = useState<string>("__new");
  const { data: seriesList = [] } = useMySeriesQuery();
  const canAccessVotingSessions = user.role === "editor" || user.role === "board";
  const { data: sessions = [] } = useVotingSessionsQuery(canAccessVotingSessions);
  const { hasActiveSession: proposalHasActiveSession } = useActiveVotingSession(
    proposal.id,
    canAccessVotingSessions,
  );
  const createSessionMutation = useCreateVotingSessionMutation();
  const updateSessionMutation = useUpdateVotingSessionMutation();
  const existingSeries = seriesList.find(
    (x) =>
      x.proposalId === proposal.id ||
      x.id === proposal.id ||
      x.slug === proposal.id ||
      x.title.toLowerCase() === proposal.title.toLowerCase(),
  );
  const canOpenProduction =
    proposal.status === "APPROVED" && (user.role === "mangaka" || user.role === "editor");
  const canAttach =
    user.role === "editor" &&
    (proposal.status === "PENDING_BOARD" || proposal.status === "TIE_BREAK") &&
    !sessions.some((vs) => vs.status === "OPEN" && vs.proposalIds.includes(proposal.id));
  const openScheduledSessions = sessions.filter(
    (vs) => vs.status === "OPEN" && vs.mode === "SCHEDULED",
  );

  const actions = allowedActions(user, proposal);
  const visible = actions;

  const run = (action: ProposalAction) => {
    if (action === "EDIT") {
      navigate({
        to: "/app/proposals/$proposalId",
        params: { proposalId: proposal.id },
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
          toast.success(`${LABELS[action]} successful.`);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "An unknown error occurred.");
        },
      },
    );
  };

  const confirm = () => {
    if (!open) return;
    if (REQUIRES_COMMENT.includes(open) && comment.trim().length < 8) {
      toast.error("Please provide at least 8 characters.");
      return;
    }
    actionMutation.mutate(
      { action: open, payload: { comment: comment.trim() || undefined } },
      {
        onSuccess: () => {
          toast.success(`${LABELS[open]} successful.`);
          setOpen(null);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "An unknown error occurred.");
        },
      },
    );
  };

  return (
    <div className="rounded-md border border-border bg-card/40 p-4">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Actions
      </p>
      {visible.length === 0 && !canOpenProduction && !canAttach ? (
        <p className="text-xs text-muted-foreground">No actions available for your current role.</p>
      ) : null}

      {visible.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {visible.map((a) => {
            const check = checkAction(a, user, proposal);
            // VOTE also needs a live VotingSession — proposal.status alone (what
            // checkAction looks at) can say PENDING_BOARD with no session open yet,
            // which the backend would 409 on. useActiveVotingSession is the shared
            // check that agrees with the vote pages themselves.
            const noActiveSession = a === "VOTE" && !proposalHasActiveSession;
            const disabled = !check.ok || noActiveSession;
            const title = noActiveSession
              ? "No VotingSession is open yet for this proposal."
              : disabled
                ? check.reason
                : LABELS[a];
            return (
              <button
                key={a}
                onClick={() => run(a)}
                disabled={disabled}
                title={title}
                className={`rounded px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${TONES[a] ?? "bg-card text-foreground border border-border hover:bg-muted"}`}
              >
                {LABELS[a]}
              </button>
            );
          })}
        </div>
      )}

      {canOpenProduction ? (
        <div className={visible.length > 0 ? "mt-3 border-t border-border pt-3" : ""}>
          <button
            onClick={() => {
              const targetSlug = existingSeries?.slug ?? proposal.id;
              navigate({
                to: "/app/series/$slug/$tab",
                params: { slug: targetSlug, tab: "overview" },
              });
            }}
            className="rounded bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
          >
            Open Production Series
          </button>
        </div>
      ) : null}

      {canAttach ? (
        <div className="mt-3 border-t border-border pt-3">
          <button
            onClick={() => setAttachOpen(true)}
            className="rounded bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-800"
          >
            Attach to voting session
          </button>
        </div>
      ) : null}

      <Modal open={open !== null} onOpenChange={(v) => !v && setOpen(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{open ? LABELS[open] : ""}</ModalTitle>
          </ModalHeader>
          <div className="space-y-2">
            <Label htmlFor="comment">
              Comment {open && REQUIRES_COMMENT.includes(open) ? "(required)" : "(optional)"}
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                open === "REJECT" ? "Provide reason for rejection..." : "Notes (optional)..."
              }
              rows={5}
            />
          </div>
          <ModalFooter>
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
          </ModalFooter>
        </ModalContent>
      </Modal>

      <RequestChangesModal
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
      <ResubmitModal
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
      <Modal open={attachOpen} onOpenChange={(v) => !v && setAttachOpen(false)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Attach Proposal to Voting Session</ModalTitle>
          </ModalHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="att-target">Session</Label>
              <select
                id="att-target"
                value={attachTarget}
                onChange={(e) => setAttachTarget(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
              >
                <option value="__new">+ Create new session (open creation page)</option>
                <option value="__adhoc">+ Quick-create ad-hoc session for this proposal</option>
                {openScheduledSessions.map((vs) => (
                  <option key={vs.id} value={vs.id}>
                    {vs.title} ({vs.proposalIds.length} proposals)
                  </option>
                ))}
              </select>
            </div>
          </div>
          <ModalFooter>
            <button
              onClick={() => setAttachOpen(false)}
              className="rounded border border-border px-3 py-1.5 text-xs"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                try {
                  if (attachTarget === "__new") {
                    setAttachOpen(false);
                    navigate({ to: "/app/board/sessions/new" });
                    return;
                  }
                  if (attachTarget === "__adhoc") {
                    const s = await createSessionMutation.mutateAsync({
                      title: `Ad-hoc - ${proposal.title}`,
                      mode: "AD_HOC",
                      proposalIds: [proposal.id],
                    });
                    toast.success("Ad-hoc session created.");
                    setAttachOpen(false);
                    navigate({ to: "/app/board/sessions/$sid", params: { sid: s.id } });
                    return;
                  }
                  const session = sessions.find((item) => item.id === attachTarget);
                  await updateSessionMutation.mutateAsync({
                    sessionId: attachTarget,
                    body: {
                      proposalIds: Array.from(
                        new Set([...(session?.proposalIds ?? []), proposal.id]),
                      ),
                    },
                  });
                  toast.success("Attached to session.");
                  setAttachOpen(false);
                  navigate({ to: "/app/board/sessions/$sid", params: { sid: attachTarget } });
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Error.");
                }
              }}
              className="rounded bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
            >
              Confirm
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
