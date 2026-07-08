import { evaluateBoardTally, type TallyResult } from "@/entities/proposal/model/board-tally";
export { evaluateBoardTally, type TallyResult } from "@/entities/proposal/model/board-tally";
export type { ActionCheck } from "@/entities/proposal/model/proposal-actions";
export { checkAction, allowedActions } from "@/entities/proposal/model/proposal-actions";
import type { Role, User } from "@/shared/auth";
import { BOARD_MEMBERS, isBoardChair, isEditorInChief, findUserById } from "@/shared/auth";
import type {
  BoardVote,
  ManuscriptVersion,
  ProposalAction,
  ProposalStatus,
  RequestedChange,
  SeriesProposal,
  VoteDecision,
} from "@/entities/proposal/model/proposal-types";
import {
  BOARD_QUORUM,
  BOARD_TOTAL,
  EIC_TIEBREAK_WEIGHT,
} from "@/entities/proposal/model/proposal-types";
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
  if (approve >= BOARD_QUORUM) return "APPROVED";
  if (reject >= BOARD_QUORUM) return "REJECTED";
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
  if (!check.ok) throw new Error(check.reason ?? "Action không hợp lệ.");

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
          message: `${p.title} đã submit cho bạn review.`,
        });
      else
        notify.push({
          userId: "u-editor",
          kind: "proposal.submitted",
          message: `Proposal mới chờ editor: ${p.title}.`,
        });
      notify.push({
        userId: "u-admin",
        kind: "proposal.submitted",
        message: `Proposal "${p.title}" vừa submit.`,
      });
      break;
    }
    case "RESUBMIT": {
      if (!payload.manuscript) throw new Error("Phải upload manuscript mới khi resubmit.");
      const openChange = [...next.requestedChanges].reverse().find((rc) => !rc.resolvedAt);
      if (!openChange) throw new Error("Không tìm thấy yêu cầu chỉnh sửa đang mở.");
      const resolvedMap = payload.resolvedItems ?? {};
      const unresolved = openChange.items.filter((it) => !resolvedMap[it.id]?.resolved);
      if (unresolved.length > 0)
        throw new Error(`Còn ${unresolved.length} điểm chưa đánh dấu giải quyết.`);

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
        comment: `Vòng revision ${next.revisionRound} — phản hồi ${openChange.items.length}/${openChange.items.length} điểm.${payload.comment ? ` ${payload.comment}` : ""}`,
      });
      if (next.assignedEditorId)
        notify.push({
          userId: next.assignedEditorId,
          kind: "proposal.resubmitted",
          message: `${p.title} đã resubmit v${newVersion.version} cho bạn review.`,
        });
      notify.push({
        userId: "u-admin",
        kind: "proposal.resubmitted",
        message: `Proposal "${p.title}" resubmit v${newVersion.version}.`,
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
          message: `${p.title} đã được rút lại.`,
        });
      notify.push({
        userId: "u-admin",
        kind: "proposal.withdrawn",
        message: `Proposal "${p.title}" đã withdraw.`,
      });
      break;
    }
    case "CLAIM": {
      next.assignedEditorId = user.id;
      next.assignedEditorName = user.name;
      events.push({
        ...baseEvent,
        type: "CLAIM",
        comment: `Editor ${user.name} đã claim proposal.`,
      });
      notify.push({
        userId: next.authorId,
        kind: "proposal.claimed",
        message: `${user.name} đã nhận review proposal "${p.title}".`,
      });
      break;
    }
    case "REQUEST_CHANGES": {
      if (!payload.comment) throw new Error("Cần ghi rõ điểm cần chỉnh sửa.");
      const items = payload.comment
        .split(/\n+/)
        .map((s) => s.replace(/^[-*\d.)\s]+/, "").trim())
        .filter((s) => s.length > 0)
        .map((text) => ({ id: uid("ci"), text, resolved: false }));
      if (items.length === 0) throw new Error("Cần ít nhất 1 điểm yêu cầu chỉnh sửa.");
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
        comment: `${items.length} điểm cần chỉnh sửa: ${items.map((i) => i.text).join("; ")}`,
      });
      notify.push({
        userId: next.authorId,
        kind: "proposal.changes",
        message: `Editor yêu cầu chỉnh sửa proposal "${p.title}" (${items.length} điểm).`,
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
      fanOutBoard("proposal.board", `Proposal mới cho Board vote: "${p.title}".`);
      notify.push({
        userId: next.authorId,
        kind: "proposal.forwarded",
        message: `Proposal "${p.title}" đã được editor chuyển Board.`,
      });
      notify.push({
        userId: "u-admin",
        kind: "proposal.forwarded",
        message: `Proposal "${p.title}" đã chuyển Board.`,
      });
      break;
    }
    case "REJECT": {
      if (!payload.comment) throw new Error("Cần ghi rõ lý do reject.");
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
        message: `Proposal "${p.title}" bị từ chối ở vòng editor.`,
      });
      notify.push({
        userId: "u-admin",
        kind: "proposal.rejected",
        message: `Proposal "${p.title}" bị editor reject.`,
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
      fanOutBoard("proposal.recalled", `Editor đã recall proposal "${p.title}" khỏi Board.`);
      notify.push({
        userId: next.authorId,
        kind: "proposal.recalled",
        message: `Proposal "${p.title}" đã recall về vòng editor.`,
      });
      break;
    }
    case "VOTE": {
      if (!payload.voteDecision) throw new Error("Thiếu vote decision.");
      const inTieBreak = next.status === "TIE_BREAK";
      const chair = isBoardChair(user.id);
      const eic = user.role === "editor" && isEditorInChief(user);
      const weight =
        inTieBreak && eic && payload.voteDecision !== "ABSTAIN" ? EIC_TIEBREAK_WEIGHT : 1;
      const vote: BoardVote = {
        memberId: user.id,
        memberName: user.name,
        decision: payload.voteDecision,
        comment: payload.comment,
        createdAt: new Date().toISOString(),
        weight,
        isChair: chair,
        isEditorInChief: eic,
      };
      next.votes = [...next.votes, vote];
      events.push({
        ...baseEvent,
        type: "VOTE",
        comment: `${payload.voteDecision}${eic ? ` · Editor-in-chief${weight > 1 ? ` (tie-break weight ${weight})` : ""}` : chair ? ` · Chủ tịch Board` : ""}${payload.comment ? ` — ${payload.comment}` : ""}`,
      });
      notify.push({
        userId: next.authorId,
        kind: "proposal.vote",
        message: `${user.name} đã ${payload.voteDecision === "APPROVE" ? "approve" : payload.voteDecision === "REJECT" ? "reject" : "abstain"} proposal "${p.title}".`,
      });
      if (next.assignedEditorId)
        notify.push({
          userId: next.assignedEditorId,
          kind: "proposal.vote",
          message: `${user.name} đã vote ${payload.voteDecision} cho "${p.title}".`,
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
          `Proposal "${p.title}" đã được Board ${tally.status === "APPROVED" ? "phê duyệt" : "từ chối"}.`,
        );
        notify.push({
          userId: next.authorId,
          kind: "proposal.decided",
          message: `Proposal "${p.title}" đã được Board ${tally.status === "APPROVED" ? "phê duyệt" : "từ chối"}.`,
        });
        notify.push({
          userId: "u-admin",
          kind: "proposal.decided",
          message: `Proposal "${p.title}" → ${tally.status}.`,
        });
      } else if (tally.status === "TIE_BREAK" && from !== "TIE_BREAK") {
        next.status = "TIE_BREAK";
        events.push({
          id: uid("e"),
          proposalId: p.id,
          actorId: "system",
          actorName: "System",
          actorRole: "admin",
          type: "TIE_BREAK",
          fromStatus: from,
          toStatus: "TIE_BREAK",
          comment: tally.reason,
          createdAt: new Date().toISOString(),
        });
        const eicUser = findUserById("u-editor");
        if (eicUser)
          notify.push({
            userId: eicUser.id,
            kind: "proposal.tiebreak",
            message: `Cần phiếu phá tie của Editor-in-chief cho "${p.title}".`,
          });
        notify.push({
          userId: next.authorId,
          kind: "proposal.tiebreak",
          message: `Proposal "${p.title}" đang chờ phiếu phá tie của Editor-in-chief.`,
        });
      }
      break;
    }
    case "FORCE_STATUS": {
      if (!payload.forceStatus) throw new Error("Thiếu forceStatus.");
      const from = next.status;
      next.status = payload.forceStatus;
      events.push({
        ...baseEvent,
        type: "FORCE_STATUS",
        fromStatus: from,
        toStatus: payload.forceStatus,
        comment: payload.comment ?? "Admin force.",
      });
      break;
    }
    case "EDIT":
      events.push({ ...baseEvent, type: "EDIT", comment: payload.comment ?? "Cập nhật nội dung." });
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
        message: `Claim cho "${p.title}" đã được giải phóng.`,
      });
      break;
    }
    case "REASSIGN_CLAIM": {
      next.claimedByEditorId = payload.comment; // overloaded: editorId passed via comment for simplicity
      next.claimedByEditorName = payload.comment;
      next.claimedAt = new Date().toISOString();
      next.reviewStartedAt = new Date().toISOString();
      events.push({
        ...baseEvent,
        type: "REASSIGN_CLAIM",
        comment: payload.comment ?? "Claim reassigned.",
      });
      break;
    }
  }

  next.history = [...next.history, ...events];
  return { proposal: next, events, notify };
}
