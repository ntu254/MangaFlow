import { evaluateBoardTally, type TallyResult } from "@/entities/proposal/model/board-tally";
export { evaluateBoardTally, type TallyResult } from "@/entities/proposal/model/board-tally";
export type { ActionCheck } from "@/entities/proposal/model/proposal-actions";
export { checkAction, allowedActions } from "@/entities/proposal/model/proposal-actions";
import type { Role, User } from "@/shared/auth";
import { BOARD_MEMBERS, isBoardChair } from "@/shared/auth";
import type {
  BoardVote,
  ManuscriptVersion,
  ProposalAction,
  ProposalStatus,
  RequestedChange,
  SeriesProposal,
  VoteDecision,
} from "@/entities/proposal/model/proposal-types";
import { BOARD_TOTAL } from "@/entities/proposal/model/proposal-types";
import { checkAction } from "@/entities/proposal/model/proposal-actions";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function tallyDecision(votes: BoardVote[]): ProposalStatus | null {
  const approve = votes
    .filter((v) => v.decision === "APPROVE")
    .reduce((s, v) => s + (v.weight ?? 1), 0);
  const reject = votes
    .filter((v) => v.decision === "REJECT")
    .reduce((s, v) => s + (v.weight ?? 1), 0);
  if (approve >= Math.ceil(BOARD_TOTAL / 2)) return "APPROVED";
  if (reject >= Math.ceil(BOARD_TOTAL / 2)) return "REJECTED";
  return null;
}

export type TransitionPayload = {
  comment?: string;
  voteDecision?: VoteDecision;
  forceStatus?: ProposalStatus;
  manuscript?: Omit<
    ManuscriptVersion,
    "id" | "version" | "uploadedAt" | "uploadedById" | "uploadedByName" | "supersedes"
  >;
  resolvedItems?: Record<string, { resolved: boolean; response?: string }>;
};

export type TransitionResult = {
  proposal: SeriesProposal;
  events: SeriesProposal["history"];
  notify: { userId: string; message: string; kind: string }[];
};

export function applyTransition(
  p: SeriesProposal,
  action: ProposalAction,
  user: User,
  payload: TransitionPayload = {},
): TransitionResult {
  const check = checkAction(action, user, p);
  if (!check.ok) throw new Error(check.reason ?? "Invalid action.");

  const baseEvent = {
    id: uid("e"),
    proposalId: p.id,
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role as Role,
    createdAt: new Date().toISOString(),
  };

  const events: SeriesProposal["history"] = [];
  const notify: TransitionResult["notify"] = [];
  const next: SeriesProposal = { ...p, updatedAt: new Date().toISOString() };

  const fanOutBoard = (kind: string, message: string) => {
    BOARD_MEMBERS.forEach((m) => notify.push({ userId: m.id, kind, message }));
  };

  switch (action) {
    case "SUBMIT": {
      const from = next.status;
      next.status = "PENDING_EDITOR";
      events.push({
        ...baseEvent,
        type: "SUBMIT",
        fromStatus: from,
        toStatus: "PENDING_EDITOR",
        comment: payload.comment,
      });
      if (next.assignedEditorId)
        notify.push({
          userId: next.assignedEditorId,
          kind: "proposal.submitted",
          message: `${p.title} has been submitted for your review.`,
        });
      else
        notify.push({
          userId: "u-editor",
          kind: "proposal.submitted",
          message: `New proposal awaiting editor: ${p.title}.`,
        });
      notify.push({
        userId: "u-admin",
        kind: "proposal.submitted",
        message: `Proposal "${p.title}" has been submitted.`,
      });
      break;
    }
    case "RESUBMIT": {
      if (!payload.manuscript)
        throw new Error("A new manuscript must be uploaded when resubmitting.");
      const openChange = [...next.requestedChanges].reverse().find((rc) => !rc.resolvedAt);
      if (!openChange) throw new Error("No open change request found.");
      const resolvedMap = payload.resolvedItems ?? {};
      const unresolved = openChange.items.filter((it) => !resolvedMap[it.id]?.resolved);
      if (unresolved.length > 0) throw new Error(`${unresolved.length} item(s) still unresolved.`);

      const lastVersion = next.manuscripts.reduce((m, mv) => Math.max(m, mv.version), 0);
      const newVersion: ManuscriptVersion = {
        ...payload.manuscript,
        id: uid("mv"),
        version: lastVersion + 1,
        uploadedAt: new Date().toISOString(),
        uploadedById: user.id,
        uploadedByName: user.name,
        supersedes: next.manuscripts.find((mv) => mv.version === lastVersion)?.id,
        note: payload.manuscript.note ?? payload.comment,
      };
      next.manuscripts = [...next.manuscripts, newVersion];
      next.revisionRound = (next.revisionRound ?? 0) + 1;

      const updatedChange: RequestedChange = {
        ...openChange,
        items: openChange.items.map((it) => ({
          ...it,
          resolved: !!resolvedMap[it.id]?.resolved,
          response: resolvedMap[it.id]?.response ?? it.response,
        })),
        resolvedAt: new Date().toISOString(),
        resolvedInVersion: newVersion.version,
      };
      next.requestedChanges = next.requestedChanges.map((rc) =>
        rc.id === openChange.id ? updatedChange : rc,
      );

      events.push({
        ...baseEvent,
        id: uid("e"),
        type: "MANUSCRIPT_UPLOAD",
        comment: `Upload manuscript v${newVersion.version} (${newVersion.fileName}).`,
      });
      const from = next.status;
      next.status = "PENDING_EDITOR";
      events.push({
        ...baseEvent,
        id: uid("e"),
        type: "RESUBMIT",
        fromStatus: from,
        toStatus: "PENDING_EDITOR",
        comment: `Revision round ${next.revisionRound} — addressed ${openChange.items.length}/${openChange.items.length} items.${payload.comment ? ` ${payload.comment}` : ""}`,
      });
      if (next.assignedEditorId)
        notify.push({
          userId: next.assignedEditorId,
          kind: "proposal.resubmitted",
          message: `${p.title} has been resubmitted (v${newVersion.version}) for your review.`,
        });
      notify.push({
        userId: "u-admin",
        kind: "proposal.resubmitted",
        message: `Proposal "${p.title}" resubmitted v${newVersion.version}.`,
      });
      break;
    }
    case "WITHDRAW": {
      const from = next.status;
      next.status = "WITHDRAWN";
      events.push({
        ...baseEvent,
        type: "WITHDRAW",
        fromStatus: from,
        toStatus: "WITHDRAWN",
        comment: payload.comment,
      });
      if (next.assignedEditorId)
        notify.push({
          userId: next.assignedEditorId,
          kind: "proposal.withdrawn",
          message: `${p.title} has been withdrawn.`,
        });
      notify.push({
        userId: "u-admin",
        kind: "proposal.withdrawn",
        message: `Proposal "${p.title}" has been withdrawn.`,
      });
      break;
    }
    case "CLAIM": {
      next.assignedEditorId = user.id;
      next.assignedEditorName = user.name;
      events.push({
        ...baseEvent,
        type: "CLAIM",
        comment: `Editor ${user.name} claimed the proposal.`,
      });
      notify.push({
        userId: next.authorId,
        kind: "proposal.claimed",
        message: `${user.name} has claimed review of proposal "${p.title}".`,
      });
      break;
    }
    case "REQUEST_CHANGES": {
      if (!payload.comment) throw new Error("Please specify the items that need revision.");
      const items = payload.comment
        .split(/\n+/)
        .map((s) => s.replace(/^[-*\d.)\s]+/, "").trim())
        .filter((s) => s.length > 0)
        .map((text) => ({ id: uid("ci"), text, resolved: false }));
      if (items.length === 0) throw new Error("At least 1 revision item is required.");
      const rc: RequestedChange = {
        id: uid("rc"),
        editorId: user.id,
        editorName: user.name,
        items,
        comment: payload.comment,
        createdAt: new Date().toISOString(),
      };
      next.requestedChanges = [...next.requestedChanges, rc];
      next.status = "CHANGES_REQUESTED";
      next.assignedEditorId = next.assignedEditorId ?? user.id;
      next.assignedEditorName = next.assignedEditorName ?? user.name;
      events.push({
        ...baseEvent,
        type: "REQUEST_CHANGES",
        fromStatus: "PENDING_EDITOR",
        toStatus: "CHANGES_REQUESTED",
        comment: `${items.length} revision item(s): ${items.map((i) => i.text).join("; ")}`,
      });
      notify.push({
        userId: next.authorId,
        kind: "proposal.changes",
        message: `Editor requested changes on proposal "${p.title}" (${items.length} item(s)).`,
      });
      break;
    }
    case "FORWARD": {
      next.status = "PENDING_BOARD";
      next.assignedEditorId = next.assignedEditorId ?? user.id;
      next.assignedEditorName = next.assignedEditorName ?? user.name;
      events.push({
        ...baseEvent,
        type: "FORWARD",
        fromStatus: "PENDING_EDITOR",
        toStatus: "PENDING_BOARD",
        comment: payload.comment,
      });
      fanOutBoard("proposal.board", `New proposal for Board vote: "${p.title}".`);
      notify.push({
        userId: next.authorId,
        kind: "proposal.forwarded",
        message: `Proposal "${p.title}" has been forwarded to the Board by the editor.`,
      });
      notify.push({
        userId: "u-admin",
        kind: "proposal.forwarded",
        message: `Proposal "${p.title}" forwarded to the Board.`,
      });
      break;
    }
    case "REJECT": {
      if (!payload.comment) throw new Error("Please provide a reason for rejection.");
      next.status = "REJECTED";
      events.push({
        ...baseEvent,
        type: "REJECT",
        fromStatus: "PENDING_EDITOR",
        toStatus: "REJECTED",
        comment: payload.comment,
      });
      notify.push({
        userId: next.authorId,
        kind: "proposal.rejected",
        message: `Proposal "${p.title}" was rejected at the editor stage.`,
      });
      notify.push({
        userId: "u-admin",
        kind: "proposal.rejected",
        message: `Proposal "${p.title}" rejected by editor.`,
      });
      break;
    }
    case "RECALL": {
      const from = next.status;
      next.status = "PENDING_EDITOR";
      next.votes = [];
      events.push({
        ...baseEvent,
        type: "RECALL",
        fromStatus: from,
        toStatus: "PENDING_EDITOR",
        comment: payload.comment ?? "Editor recall.",
      });
      fanOutBoard("proposal.recalled", `Editor recalled proposal "${p.title}" from the Board.`);
      notify.push({
        userId: next.authorId,
        kind: "proposal.recalled",
        message: `Proposal "${p.title}" has been recalled to the editor stage.`,
      });
      break;
    }
    case "VOTE": {
      if (!payload.voteDecision) throw new Error("Missing vote decision.");
      const chair = isBoardChair(user.id);
      const vote: BoardVote = {
        voterId: user.id,
        voterName: user.name,
        decision: payload.voteDecision,
        comment: payload.comment,
        createdAt: new Date().toISOString(),
        weight: 1,
        isChair: chair,
      };
      next.votes = [...next.votes, vote];
      events.push({
        ...baseEvent,
        type: "VOTE",
        comment: `${payload.voteDecision}${chair ? " · Board Chair" : ""}${payload.comment ? ` — ${payload.comment}` : ""}`,
      });
      notify.push({
        userId: next.authorId,
        kind: "proposal.vote",
        message: `${user.name} ${payload.voteDecision === "APPROVE" ? "approved" : "rejected"} proposal "${p.title}".`,
      });
      if (next.assignedEditorId)
        notify.push({
          userId: next.assignedEditorId,
          kind: "proposal.vote",
          message: `${user.name} voted ${payload.voteDecision} on "${p.title}".`,
        });

      const tally = evaluateBoardTally(next.votes);
      const from = next.status;
      if (tally.status === "APPROVED" || tally.status === "REJECTED") {
        next.status = tally.status;
        events.push({
          id: uid("e"),
          proposalId: p.id,
          actorId: "system",
          actorName: "System",
          actorRole: "admin",
          type: "DECIDE",
          fromStatus: from,
          toStatus: tally.status,
          comment: tally.reason,
          createdAt: new Date().toISOString(),
        });
        fanOutBoard(
          "proposal.decided",
          `Proposal "${p.title}" has been ${tally.status === "APPROVED" ? "approved" : "rejected"} by the Board.`,
        );
        notify.push({
          userId: next.authorId,
          kind: "proposal.decided",
          message: `Proposal "${p.title}" has been ${tally.status === "APPROVED" ? "approved" : "rejected"} by the Board.`,
        });
        notify.push({
          userId: "u-admin",
          kind: "proposal.decided",
          message: `Proposal "${p.title}" → ${tally.status}.`,
        });
      }
      break;
    }
    case "EDIT":
      events.push({ ...baseEvent, type: "EDIT", comment: payload.comment ?? "Content updated." });
      break;
    case "RELEASE_CLAIM": {
      next.claimedByEditorId = null;
      next.claimedByEditorName = null;
      next.claimedAt = null;
      next.reviewStartedAt = null;
      next.assignedEditorId = undefined;
      next.assignedEditorName = undefined;
      events.push({
        ...baseEvent,
        type: "RELEASE_CLAIM",
        comment: payload.comment ?? "Claim released.",
      });
      notify.push({
        userId: next.authorId,
        kind: "proposal.claim_released",
        message: `Claim on "${p.title}" has been released.`,
      });
      break;
    }
  }

  next.history = [...next.history, ...events];
  return { proposal: next, events, notify };
}
