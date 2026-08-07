import type { User } from "@/shared/auth";
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
      if (p.claimedByEditorId && p.claimedByEditorId !== user.id && user.role !== "editor")
        return { ok: false, reason: "Proposal has been claimed by another editor." };
      return { ok: true };
    case "FORWARD":
      if (!EDITOR_OR_ADMIN(user)) return { ok: false, reason: "Editor only." };
      if (!EDITOR_REVIEW_STATUSES.includes(p.status))
        return { ok: false, reason: "Can only forward when proposal is under editor review." };
      if (p.claimedByEditorId && p.claimedByEditorId !== user.id && user.role !== "editor")
        return { ok: false, reason: "Proposal has been claimed by another editor." };
      return { ok: true };
    case "REJECT":
      if (!EDITOR_OR_ADMIN(user)) return { ok: false, reason: "Editor only." };
      if (!EDITOR_REVIEW_STATUSES.includes(p.status))
        return { ok: false, reason: "Can only reject when proposal is under editor review." };
      if (p.claimedByEditorId && p.claimedByEditorId !== user.id && user.role !== "editor")
        return { ok: false, reason: "Proposal has been claimed by another editor." };
      return { ok: true };
    case "RELEASE_CLAIM":
      if (user.role !== "editor") return { ok: false, reason: "Editor only." };
      if (!EDITOR_REVIEW_STATUSES.includes(p.status) || p.claimedByEditorId !== user.id)
        return { ok: false, reason: "Only the Editor who claimed it can release it." };
      return { ok: true };
    case "RECALL":
      if (!EDITOR_OR_ADMIN(user)) return { ok: false, reason: "Assigned editor only." };
      if (p.status !== "PENDING_BOARD")
        return { ok: false, reason: "Can only recall when PENDING_BOARD." };
      return { ok: true };
    case "VOTE":
      if (!BOARD_OR_ADMIN(user)) return { ok: false, reason: "Board member only." };
      if (p.status !== "BOARD_REVIEW")
        return { ok: false, reason: "Can only vote in an open Board review." };
      if ((p.votes ?? []).some((v) => v.voterId === user.id))
        return { ok: false, reason: "You have already voted." };
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
    "REQUEST_CHANGES",
    "FORWARD",
    "REJECT",
    "RECALL",
    "VOTE",
  ];
  return all.filter((a) => checkAction(a, user, p).ok);
}
