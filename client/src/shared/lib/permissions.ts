/**
 * MangaFlow permission matrix mock (Flow 00–04 Section 11).
 * Frontend-only: backend would re-enforce. Returns { allowed, reason } so UI
 * can show disabled-state tooltips per spec.
 */
import type { Role } from "@/shared/lib/role";
import type { Series } from "@/entities/series/model";
import type { Page } from "@/entities/page/model";
import { isAssistantEligible } from "@/entities/series-member/model";

export type Verdict = { allowed: boolean; reason?: string };
const ok: Verdict = { allowed: true };
const no = (reason: string): Verdict => ({ allowed: false, reason });

// ---- Flow 00 — Auth / Admin ----
export const canManageUsers = (role: Role): Verdict =>
  role === "admin" ? ok : no("Only Admin can manage users.");

// ---- Flow 01 — Proposal / Editor / Board ----
export const canCreateProposal = (role: Role): Verdict =>
  role === "mangaka" ? ok : no("Only Mangaka can create a Series proposal.");

export const canSubmitProposal = (role: Role, series: Series): Verdict => {
  if (role !== "mangaka") return no("Only Mangaka can submit.");
  if (!["draft", "revision-requested"].includes(series.status))
    return no(`Series is in ${series.status}; cannot submit now.`);
  return ok;
};

export const canEditorReview = (role: Role, series: Series): Verdict => {
  if (role !== "editor") return no("Only Editor can act on review.");
  if (series.status !== "editor-review") return no("Series is not in Editor review.");
  return ok;
};

export const canForwardToBoard = (role: Role, series: Series) =>
  canEditorReview(role, series);

export const canBoardVote = (role: Role, series: Series): Verdict => {
  if (role !== "board") return no("Only Board members can vote.");
  if (series.status !== "board-review") return no("Series is not in Board review.");
  return ok;
};

export const canFinalizeBoardDecision = (role: Role, series: Series): Verdict => {
  const v = canBoardVote(role, series);
  return v.allowed ? ok : v;
};

// ---- Flow 02 — Chapter / Page ----
export const canCreateChapter = (role: Role, series: Series): Verdict => {
  if (!["mangaka", "admin"].includes(role)) return no("Only Mangaka can create Chapters.");
  if (!["approved", "ongoing", "at-risk"].includes(series.status))
    return no("Series must be approved/ongoing.");
  if (!series.publicationType) return no("Series is missing publicationType.");
  return ok;
};

export const canUploadPage = canCreateChapter;

// ---- Flow 03 — Production Team ----
export const canManageTeam = (role: Role): Verdict =>
  role === "mangaka" || role === "admin"
    ? ok
    : no("Only Mangaka can manage the team.");

export const canAssignTaskTo = (
  role: Role,
  assigneeId: string,
  seriesId: string,
): Verdict => {
  if (role !== "mangaka" && role !== "admin") return no("Only Mangaka can assign tasks.");
  if (!isAssistantEligible(assigneeId, seriesId))
    return no("Assistant is not an active member of this Series.");
  return ok;
};

// ---- Flow 04 — Page Studio ----
export const canOpenPageStudio = (
  role: Role,
  page: Page,
  opts?: { hasAssignedTask?: boolean },
): Verdict => {
  if (page.status === "uploading" || page.status === "processing-failed")
    return no("Page is not ready (missing working image).");
  if (role === "mangaka" || role === "editor" || role === "admin") return ok;
  if (role === "assistant" && opts?.hasAssignedTask) return ok;
  return no("You do not have access to this Page.");
};

export const canRunAI = (role: Role): Verdict =>
  role === "mangaka" || role === "admin" || role === "editor"
    ? ok
    : no("Only Mangaka/Editor can run AI segmentation.");
