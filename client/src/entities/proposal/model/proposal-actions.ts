import type { User } from "@/shared/auth";
import { isEditorInChief } from "@/shared/auth";
import type { ProposalAction, SeriesProposal } from "./proposal-types";
import { IS_AUTHOR, IS_EDITOR, IS_BOARD } from "@/shared/lib/permissions";

export type ActionCheck = {
  ok: boolean;
  reason?: string;
};

const EDITOR_REVIEW_STATUSES = ["PENDING_EDITOR", "EDITOR_REVIEWING"];

export function checkAction(action: ProposalAction, user: User, p: SeriesProposal): ActionCheck {
  switch (action) {
    case "EDIT":
      if (!IS_AUTHOR(user, p)) return { ok: false, reason: "Only the author can do this." };
      if (!["DRAFT", "CHANGES_REQUESTED"].includes(p.status))
        return { ok: false, reason: "Editing is only allowed in DRAFT or CHANGES_REQUESTED." };
      return { ok: true };
    case "SUBMIT":
      if (!IS_AUTHOR(user, p)) return { ok: false, reason: "Only the author can do this." };
      if (p.status !== "DRAFT") return { ok: false, reason: "You can only submit from DRAFT." };
      return { ok: true };
    case "RESUBMIT":
      if (!IS_AUTHOR(user, p)) return { ok: false, reason: "Only the author can do this." };
      if (p.status !== "CHANGES_REQUESTED")
        return { ok: false, reason: "You can only resubmit when changes are requested." };
      return { ok: true };
    case "WITHDRAW":
      if (!IS_AUTHOR(user, p)) return { ok: false, reason: "Only the author can do this." };
      if (!["DRAFT", "PENDING_EDITOR", "CHANGES_REQUESTED"].includes(p.status))
        return { ok: false, reason: "You cannot withdraw after sending to Board." };
      return { ok: true };
    case "CLAIM":
      if (!IS_EDITOR(user)) return { ok: false, reason: "Only an editor can do this." };
      if (p.status !== "PENDING_EDITOR")
        return { ok: false, reason: "You can only claim while PENDING_EDITOR." };
      if (p.claimedByEditorId && p.claimedByEditorId !== user.id)
        return { ok: false, reason: "Another editor has just claimed this item." };
      return { ok: true };
    case "REQUEST_CHANGES":
      if (!IS_EDITOR(user)) return { ok: false, reason: "Only an editor can do this." };
      if (!EDITOR_REVIEW_STATUSES.includes(p.status))
        return { ok: false, reason: "Only while the proposal is under editor review." };
      if (
        p.claimedByEditorId &&
        p.claimedByEditorId !== user.id &&
        !(user.role === "editor" && isEditorInChief(user))
      )
        return { ok: false, reason: "This proposal has been claimed by another editor." };
      return { ok: true };
    case "FORWARD":
      if (!IS_EDITOR(user)) return { ok: false, reason: "Only an editor can do this." };
      if (!EDITOR_REVIEW_STATUSES.includes(p.status))
        return {
          ok: false,
          reason: "You can only forward while the proposal is under editor review.",
        };
      if (
        p.claimedByEditorId &&
        p.claimedByEditorId !== user.id &&
        !(user.role === "editor" && isEditorInChief(user))
      )
        return { ok: false, reason: "This proposal has been claimed by another editor." };
      return { ok: true };
    case "REJECT":
      if (!IS_EDITOR(user)) return { ok: false, reason: "Only an editor can do this." };
      if (!EDITOR_REVIEW_STATUSES.includes(p.status))
        return {
          ok: false,
          reason: "You can only reject while the proposal is under editor review.",
        };
      if (
        p.claimedByEditorId &&
        p.claimedByEditorId !== user.id &&
        !(user.role === "editor" && isEditorInChief(user))
      )
        return { ok: false, reason: "This proposal has been claimed by another editor." };
      return { ok: true };
    case "RELEASE_CLAIM":
      if (!(user.role === "editor" && isEditorInChief(user)))
        return { ok: false, reason: "Only the Editor-in-chief can do this." };
      if (!EDITOR_REVIEW_STATUSES.includes(p.status) || !p.claimedByEditorId)
        return { ok: false, reason: "The proposal has not been claimed." };
      return { ok: true };
    case "REASSIGN_CLAIM":
      if (!(user.role === "editor" && isEditorInChief(user)))
        return { ok: false, reason: "Only the Editor-in-chief can do this." };
      if (!EDITOR_REVIEW_STATUSES.includes(p.status))
        return { ok: false, reason: "Only while the proposal is under editor review." };
      return { ok: true };
    case "RECALL":
      if (!IS_EDITOR(user)) return { ok: false, reason: "Only the assigned editor can do this." };
      if (p.status !== "PENDING_BOARD")
        return { ok: false, reason: "You can only recall while PENDING_BOARD." };
      return { ok: true };
    case "VOTE":
      if (p.status !== "PENDING_BOARD" && p.status !== "TIE_BREAK")
        return { ok: false, reason: "Voting is only allowed in PENDING_BOARD or TIE_BREAK." };
      if (p.status === "PENDING_BOARD") {
        if (!IS_BOARD(user)) return { ok: false, reason: "Only a board member can do this." };
      } else {
        // TIE_BREAK
        const isEiC = user.role === "editor" && isEditorInChief(user);
        if (!isEiC)
          return { ok: false, reason: "Only the Editor-in-chief can cast a tie-break vote." };
      }
      if (p.votes.some((v) => v.memberId === user.id))
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
    "REASSIGN_CLAIM",
    "REQUEST_CHANGES",
    "FORWARD",
    "REJECT",
    "RECALL",
    "VOTE",
  ];
  return all.filter((a) => checkAction(a, user, p).ok);
}
