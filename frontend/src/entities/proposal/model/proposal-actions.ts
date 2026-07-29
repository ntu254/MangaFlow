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
      if (!OWNER_OR_ADMIN(user, p)) return { ok: false, reason: "Author or admin only." };
      if (!["DRAFT", "CHANGES_REQUESTED"].includes(p.status))
        return { ok: false, reason: "Can only edit when DRAFT or CHANGES_REQUESTED." };
      return { ok: true };
    case "SUBMIT":
      if (!OWNER_OR_ADMIN(user, p)) return { ok: false, reason: "Author only." };
      if (p.status !== "DRAFT") return { ok: false, reason: "Can only submit from DRAFT." };
      return { ok: true };
    case "RESUBMIT":
      if (!OWNER_OR_ADMIN(user, p)) return { ok: false, reason: "Author only." };
      if (p.status !== "CHANGES_REQUESTED")
        return { ok: false, reason: "Can only resubmit when CHANGES_REQUESTED." };
      return { ok: true };
    case "WITHDRAW":
      if (!OWNER_OR_ADMIN(user, p)) return { ok: false, reason: "Author only." };
      if (!["DRAFT", "PENDING_EDITOR", "CHANGES_REQUESTED"].includes(p.status))
        return { ok: false, reason: "Cannot withdraw after forwarding to the Board." };
      return { ok: true };
    case "CLAIM":
      if (!EDITOR_OR_ADMIN(user)) return { ok: false, reason: "Editor only." };
      if (p.status !== "PENDING_EDITOR")
        return { ok: false, reason: "Can only claim when PENDING_EDITOR." };
      if (p.claimedByEditorId && p.claimedByEditorId !== user.id)
        return { ok: false, reason: "This item was just claimed by another editor." };
      return { ok: true };
    case "REQUEST_CHANGES":
      if (!EDITOR_OR_ADMIN(user)) return { ok: false, reason: "Editor only." };
      if (!EDITOR_REVIEW_STATUSES.includes(p.status))
        return { ok: false, reason: "Only when proposal is under editor review." };
      if (
        p.claimedByEditorId &&
        p.claimedByEditorId !== user.id &&
        !isEditorInChief(user) &&
        user.role !== "admin"
      )
        return { ok: false, reason: "Proposal has been claimed by another editor." };
      return { ok: true };
    case "FORWARD":
      if (!EDITOR_OR_ADMIN(user)) return { ok: false, reason: "Editor only." };
      if (!EDITOR_REVIEW_STATUSES.includes(p.status))
        return { ok: false, reason: "Can only forward when proposal is under editor review." };
      if (
        p.claimedByEditorId &&
        p.claimedByEditorId !== user.id &&
        !isEditorInChief(user) &&
        user.role !== "admin"
      )
        return { ok: false, reason: "Proposal has been claimed by another editor." };
      return { ok: true };
    case "REJECT":
      if (!EDITOR_OR_ADMIN(user)) return { ok: false, reason: "Editor only." };
      if (!EDITOR_REVIEW_STATUSES.includes(p.status))
        return { ok: false, reason: "Can only reject when proposal is under editor review." };
      if (
        p.claimedByEditorId &&
        p.claimedByEditorId !== user.id &&
        !isEditorInChief(user) &&
        user.role !== "admin"
      )
        return { ok: false, reason: "Proposal has been claimed by another editor." };
      return { ok: true };
    case "RELEASE_CLAIM":
      if (user.role !== "admin" && !(user.role === "editor" && isEditorInChief(user)))
        return { ok: false, reason: "Admin or Editor-in-Chief only." };
      if (!EDITOR_REVIEW_STATUSES.includes(p.status) || !p.claimedByEditorId)
        return { ok: false, reason: "Proposal has not been claimed." };
      return { ok: true };
    case "REASSIGN_CLAIM":
      if (user.role !== "admin" && !(user.role === "editor" && isEditorInChief(user)))
        return { ok: false, reason: "Admin or Editor-in-Chief only." };
      if (!EDITOR_REVIEW_STATUSES.includes(p.status))
        return { ok: false, reason: "Only when proposal is under editor review." };
      return { ok: true };
    case "RECALL":
      if (!EDITOR_OR_ADMIN(user)) return { ok: false, reason: "Assigned editor only." };
      if (p.status !== "PENDING_BOARD")
        return { ok: false, reason: "Can only recall when PENDING_BOARD." };
      return { ok: true };
    case "VOTE":
      if (p.status !== "PENDING_BOARD" && p.status !== "TIE_BREAK")
        return { ok: false, reason: "Can only vote when PENDING_BOARD or TIE_BREAK." };
      if (p.status === "PENDING_BOARD") {
        if (!BOARD_OR_ADMIN(user)) return { ok: false, reason: "Board member only." };
      } else {
        // TIE_BREAK
        const isEiC = user.role === "editor" && isEditorInChief(user);
        if (!isEiC && user.role !== "admin")
          return { ok: false, reason: "Only the Editor-in-Chief can cast the tie-break vote." };
      }
      if (p.votes.some((v) => v.memberId === user.id))
        return { ok: false, reason: "You have already voted." };
      return { ok: true };
    case "FORCE_STATUS":
      if (user.role !== "admin") return { ok: false, reason: "Admin only." };
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
