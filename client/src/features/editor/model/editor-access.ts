import type { ReviewPriority, DeadlineRisk } from "@/entities/submission/model/review-types";
export type { ReviewPriority, DeadlineRisk } from "@/entities/submission/model/review-types";
import type { Chapter, ProductionSeries } from "@/entities/series/model/series-types";
import type { SeriesProposal } from "@/entities/proposal/model/proposal-types";
import type { StudioComment } from "@/entities/series/model/studio-types";
import type { AssistantSubmission } from "@/entities/submission/model/assistant-types";

export type ReviewKind =
  | "PROPOSAL_PACKAGE"
  | "PROPOSAL"
  | "MANUSCRIPT"
  | "CHAPTER"
  | "PAGE"
  | "SUBMISSION";
export type ReviewInclude = "PROPOSAL" | "MANUSCRIPT" | "SAMPLE_PAGES" | "MATERIALS";
export type ReviewClaimState = "AVAILABLE" | "CLAIMED_BY_ME" | "CLAIMED_BY_OTHER" | "NOT_REQUIRED";

export type ReviewItem = {
  id: string;
  kind: ReviewKind;
  refId: string;
  seriesId?: string;
  seriesTitle?: string;
  seriesContext?: string;
  proposalId?: string;
  proposalTitle?: string;
  chapterId?: string;
  chapterNumber?: number;
  chapterTitle?: string;
  includes?: ReviewInclude[];
  displayType?: string;
  title: string;
  status: string;
  priority: ReviewPriority;
  submittedAt: string;
  submittedBy: string;
  deadline?: string | null;
  revisionReturned?: boolean;
  isCompleted?: boolean;
  claimedByEditorId?: string | null;
  claimedByEditorName?: string | null;
  claimedAt?: string | null;
  claimState?: ReviewClaimState;
};

const ACTIVE_PROPOSAL_REVIEW_STATUSES = new Set([
  "PENDING_EDITOR",
  "EDITOR_REVIEWING",
  "RESUBMITTED",
]);

const COMPLETED_PROPOSAL_REVIEW_STATUSES = new Set([
  "CHANGES_REQUESTED",
  "PENDING_BOARD",
  "APPROVED",
  "REJECTED",
  "WITHDRAWN",
]);

function priorityFromAge(hoursAgo: number, blocking = false): ReviewPriority {
  if (blocking) return "BLOCKING";
  if (hoursAgo > 48) return "HIGH";
  if (hoursAgo > 12) return "MED";
  return "LOW";
}

function hoursSince(iso: string) {
  return (Date.now() - new Date(iso).getTime()) / 3_600_000;
}

export function buildReviewQueue(
  proposals: SeriesProposal[],
  chapters: Chapter[],
  series: ProductionSeries[],
  comments: StudioComment[],
  editorId: string,
): ReviewItem[] {
  const items: ReviewItem[] = [];

  for (const p of proposals) {
    const isActive = ACTIVE_PROPOSAL_REVIEW_STATUSES.has(p.status);
    const isCompleted = COMPLETED_PROPOSAL_REVIEW_STATUSES.has(p.status);
    const claimState: ReviewClaimState = p.claimedByEditorId
      ? p.claimedByEditorId === editorId
        ? "CLAIMED_BY_ME"
        : "CLAIMED_BY_OTHER"
      : "AVAILABLE";

    if (!isActive && !isCompleted) continue;

    const includes: ReviewInclude[] = [
      "PROPOSAL",
      ...(p.manuscripts.length > 0 ? (["MANUSCRIPT"] as const) : []),
      ...(p.sampleChapterUrl ? (["SAMPLE_PAGES"] as const) : []),
      ...(p.materials.length > 0 ? (["MATERIALS"] as const) : []),
    ];
    const latestMs = p.manuscripts[p.manuscripts.length - 1];

    items.push({
      id: `prop-${p.id}`,
      kind: "PROPOSAL_PACKAGE",
      refId: p.id,
      proposalId: p.id,
      proposalTitle: p.title,
      seriesTitle: p.title,
      seriesContext: "Proposal stage",
      title: "Proposal Package",
      includes,
      displayType: "Proposal Package",
      status: p.status,
      priority: priorityFromAge(hoursSince(latestMs?.uploadedAt ?? p.updatedAt)),
      submittedAt: latestMs?.uploadedAt ?? p.updatedAt,
      submittedBy: p.authorName,
      revisionReturned:
        p.revisionRound > 0 || p.status === "CHANGES_REQUESTED" || p.status === "RESUBMITTED",
      isCompleted,
      claimedByEditorId: p.claimedByEditorId,
      claimedByEditorName: p.claimedByEditorName,
      claimedAt: p.claimedAt,
      claimState,
    });
  }

  for (const ch of chapters) {
    const s = series.find((x) => x.id === ch.seriesId);
    if (s && s.editorId && s.editorId !== editorId) continue;
    const blocking = comments.filter(
      (c) => c.chapterId === ch.id && (c.isBlocking || c.blocking) && c.status !== "RESOLVED",
    ).length;

    if (ch.status === "EDITOR_REVIEW") {
      items.push({
        id: `ch-${ch.id}`,
        kind: "CHAPTER",
        refId: ch.id,
        seriesId: ch.seriesId,
        seriesTitle: s?.title ?? "Unknown series",
        seriesContext: s?.authorName ? `by ${s.authorName}` : "Production series",
        chapterId: ch.id,
        chapterNumber: ch.number,
        chapterTitle: ch.title,
        title: `Chapter ${String(ch.number).padStart(2, "0")}: ${ch.title}`,
        status: ch.status,
        priority: priorityFromAge(hoursSince(ch.updatedAt), blocking > 0),
        submittedAt: ch.updatedAt,
        submittedBy: s?.authorName ?? ch.assigneeName,
        deadline: ch.reviewDueAt,
        revisionReturned: ch.revisionRound > 0,
        claimState: "NOT_REQUIRED",
      });
    }
  }

  return items.sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
}

export function getDeadlineRisk(chapter: Chapter): DeadlineRisk {
  const due = chapter.reviewDueAt ?? chapter.draftDueAt;
  if (!due) return { tone: "neutral", label: "-", days: null };
  const d = Math.round((new Date(due).getTime() - Date.now()) / 86_400_000);
  if (d < 0) return { tone: "rose", label: `Tre ${-d}d`, days: d };
  if (d <= 2) return { tone: "rose", label: `${d}d`, days: d };
  if (d <= 5) return { tone: "amber", label: `${d}d`, days: d };
  return { tone: "emerald", label: `${d}d`, days: d };
}

export type PublicationReadiness = {
  ready: boolean;
  pagesUploaded: number;
  pagesTotal: number;
  blockingComments: number;
  hasManuscript: boolean;
  reasons: string[];
};

export function getPublicationReadiness(
  chapter: Chapter,
  comments: StudioComment[],
): PublicationReadiness {
  const blocking = comments.filter(
    (c) => c.chapterId === chapter.id && c.blocking && c.status !== "RESOLVED",
  ).length;
  const pagesUploaded = chapter.pages.length;
  const hasManuscript = (chapter.materials ?? []).length > 0;
  const reasons: string[] = [];
  if (pagesUploaded === 0) reasons.push("Chua upload page");
  if (blocking > 0) reasons.push(`${blocking} blocking comments chua giai quyet`);
  if (
    chapter.status !== "EDITOR_APPROVED" &&
    chapter.status !== "READY_FOR_PUBLICATION" &&
    chapter.status !== "SCHEDULED"
  )
    reasons.push("Chapter chua duoc Approve");
  const ready = reasons.length === 0;
  return {
    ready,
    pagesUploaded,
    pagesTotal: pagesUploaded,
    blockingComments: blocking,
    hasManuscript,
    reasons,
  };
}

export function chaptersForEditor(
  chapters: Chapter[],
  series: ProductionSeries[],
  editorId: string,
): Chapter[] {
  const sids = new Set(series.filter((s) => s.editorId === editorId).map((s) => s.id));
  return chapters.filter((c) => sids.has(c.seriesId));
}

export function seriesForEditor(series: ProductionSeries[], editorId: string): ProductionSeries[] {
  return series.filter((s) => s.editorId === editorId);
}

export function buildSubmissionReviewItems(submissions: AssistantSubmission[]): ReviewItem[] {
  return submissions
    .filter((s) => s.status === "MANGAKA_APPROVED")
    .map((s) => {
      const raw = s as AssistantSubmission & {
        seriesId?: string;
        seriesTitle?: string;
        chapterTitle?: string;
        assistantName?: string;
        taskTitle?: string;
      };
      return {
        id: `sub-${s.id}`,
        kind: "SUBMISSION" as const,
        refId: s.id,
        seriesId: raw.seriesId,
        seriesTitle: raw.seriesTitle ?? "Unknown series",
        seriesContext: raw.chapterTitle ? `Chapter: ${raw.chapterTitle}` : "Final submission",
        chapterId: s.chapterId,
        chapterTitle: raw.chapterTitle,
        title: raw.taskTitle ?? `Submission ${s.versionLabel} - Task ${s.taskId.slice(0, 8)}`,
        status: s.status,
        priority: priorityFromAge(hoursSince(s.submittedAt)),
        submittedAt: s.submittedAt,
        submittedBy: raw.assistantName ?? s.assistantId,
        claimState: "NOT_REQUIRED" as const,
      };
    })
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}
