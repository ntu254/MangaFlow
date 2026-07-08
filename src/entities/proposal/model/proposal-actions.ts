import type { User } from "@/shared/auth";
import { isEditorInChief } from "@/shared/auth";
import type { ProposalAction, SeriesProposal } from "./proposal-types";
import { OWNER_OR_ADMIN, EDITOR_OR_ADMIN, BOARD_OR_ADMIN } from "@/shared/lib/permissions";

export type ActionCheck = {
  ok: boolean;
  reason?: string;
};

const EDITOR_REVIEW_STATUSES = ["PENDING_EDITOR", "EDITOR_REVIEWING"];

export function checkAction(action: ProposalAction, user: User, p: SeriesProposal): ActionCheck {
  switch (action) {
    case "EDIT":
      if (!OWNER_OR_ADMIN(user, p)) return { ok: false, reason: "Chỉ tác giả hoặc admin." };
      if (!["DRAFT", "CHANGES_REQUESTED"].includes(p.status))
        return { ok: false, reason: "Chỉ edit khi DRAFT hoặc CHANGES_REQUESTED." };
      return { ok: true };
    case "SUBMIT":
      if (!OWNER_OR_ADMIN(user, p)) return { ok: false, reason: "Chỉ tác giả." };
      if (p.status !== "DRAFT") return { ok: false, reason: "Chỉ submit từ DRAFT." };
      return { ok: true };
    case "RESUBMIT":
      if (!OWNER_OR_ADMIN(user, p)) return { ok: false, reason: "Chỉ tác giả." };
      if (p.status !== "CHANGES_REQUESTED")
        return { ok: false, reason: "Chỉ resubmit khi CHANGES_REQUESTED." };
      return { ok: true };
    case "WITHDRAW":
      if (!OWNER_OR_ADMIN(user, p)) return { ok: false, reason: "Chỉ tác giả." };
      if (!["DRAFT", "PENDING_EDITOR", "CHANGES_REQUESTED"].includes(p.status))
        return { ok: false, reason: "Không thể rút sau khi đã chuyển Board." };
      return { ok: true };
    case "CLAIM":
      if (!EDITOR_OR_ADMIN(user)) return { ok: false, reason: "Chỉ editor." };
      if (p.status !== "PENDING_EDITOR")
        return { ok: false, reason: "Chỉ claim khi PENDING_EDITOR." };
      if (p.claimedByEditorId && p.claimedByEditorId !== user.id)
        return { ok: false, reason: "Item này vừa được Editor khác nhận review." };
      return { ok: true };
    case "REQUEST_CHANGES":
      if (!EDITOR_OR_ADMIN(user)) return { ok: false, reason: "Chỉ editor." };
      if (!EDITOR_REVIEW_STATUSES.includes(p.status))
        return { ok: false, reason: "Chỉ khi proposal đang editor review." };
      if (
        p.claimedByEditorId &&
        p.claimedByEditorId !== user.id &&
        !isEditorInChief(user) &&
        user.role !== "admin"
      )
        return { ok: false, reason: "Proposal đã được Editor khác claim." };
      return { ok: true };
    case "FORWARD":
      if (!EDITOR_OR_ADMIN(user)) return { ok: false, reason: "Chỉ editor." };
      if (!EDITOR_REVIEW_STATUSES.includes(p.status))
        return { ok: false, reason: "Chỉ forward khi proposal đang editor review." };
      if (
        p.claimedByEditorId &&
        p.claimedByEditorId !== user.id &&
        !isEditorInChief(user) &&
        user.role !== "admin"
      )
        return { ok: false, reason: "Proposal đã được Editor khác claim." };
      return { ok: true };
    case "REJECT":
      if (!EDITOR_OR_ADMIN(user)) return { ok: false, reason: "Chỉ editor." };
      if (!EDITOR_REVIEW_STATUSES.includes(p.status))
        return { ok: false, reason: "Chỉ reject khi proposal đang editor review." };
      if (
        p.claimedByEditorId &&
        p.claimedByEditorId !== user.id &&
        !isEditorInChief(user) &&
        user.role !== "admin"
      )
        return { ok: false, reason: "Proposal đã được Editor khác claim." };
      return { ok: true };
    case "RELEASE_CLAIM":
      if (user.role !== "admin" && !(user.role === "editor" && isEditorInChief(user)))
        return { ok: false, reason: "Chỉ Admin hoặc Editor-in-chief." };
      if (!EDITOR_REVIEW_STATUSES.includes(p.status) || !p.claimedByEditorId)
        return { ok: false, reason: "Proposal chưa được claim." };
      return { ok: true };
    case "REASSIGN_CLAIM":
      if (user.role !== "admin" && !(user.role === "editor" && isEditorInChief(user)))
        return { ok: false, reason: "Chỉ Admin hoặc Editor-in-chief." };
      if (!EDITOR_REVIEW_STATUSES.includes(p.status))
        return { ok: false, reason: "Chỉ khi proposal đang editor review." };
      return { ok: true };
    case "RECALL":
      if (!EDITOR_OR_ADMIN(user)) return { ok: false, reason: "Chỉ editor đã assign." };
      if (p.status !== "PENDING_BOARD")
        return { ok: false, reason: "Chỉ recall khi PENDING_BOARD." };
      return { ok: true };
    case "VOTE":
      if (p.status !== "PENDING_BOARD" && p.status !== "TIE_BREAK")
        return { ok: false, reason: "Chỉ vote khi PENDING_BOARD hoặc TIE_BREAK." };
      if (p.status === "PENDING_BOARD") {
        if (!BOARD_OR_ADMIN(user)) return { ok: false, reason: "Chỉ board member." };
      } else {
        // TIE_BREAK
        const isEiC = user.role === "editor" && isEditorInChief(user);
        if (!isEiC && user.role !== "admin")
          return { ok: false, reason: "Chỉ Editor-in-chief có thể bỏ phiếu phá tie." };
      }
      if (p.votes.some((v) => v.memberId === user.id))
        return { ok: false, reason: "Bạn đã vote rồi." };
      return { ok: true };
    case "FORCE_STATUS":
      if (user.role !== "admin") return { ok: false, reason: "Chỉ admin." };
      return { ok: true };
  }
}

export function allowedActions(user: User, p: SeriesProposal): ProposalAction[] {
  const all: ProposalAction[] = [
    "EDIT",
    "SUBMIT",
    "RESUBMIT",
    "WITHDRAW",
    "CLAIM",
    "RELEASE_CLAIM",
    "REASSIGN_CLAIM",
    "REQUEST_CHANGES",
    "FORWARD",
    "REJECT",
    "RECALL",
    "VOTE",
    "FORCE_STATUS",
  ];
  return all.filter((a) => checkAction(a, user, p).ok);
}
