import {
  AuditEntryModel,
  ChapterModel,
  ProposalModel,
  SeriesModel,
  StudioCommentModel,
} from "../db/models.js";
import { AppError } from "../lib/http.js";
import type { RequestActor } from "../types.js";

export type EditorActivityArea = "PROPOSAL" | "CHAPTER" | "COMMENT" | "PUBLICATION";

export interface EditorActivityRecord {
  id: string;
  action: string;
  area: EditorActivityArea;
  entityId: string;
  subject: string;
  seriesTitle: string | null;
  chapterNumber: number | null;
  chapterTitle: string | null;
  outcome: string | null;
  occurredAt: string | null;
}

const PUBLICATION_ACTIONS = new Set([
  "PUBLICATION_SCHEDULED",
  "CHAPTER_POSTPONED",
  "CHAPTER_PUBLISHED",
]);

const REDUNDANT_CHAPTER_AUDITS = new Set([
  "CHAPTER_TANTOU_APPROVED",
  "chapter.request_revision",
  "chapter.reject",
  "chapter.editor_approve",
  "chapter.schedule",
  "chapter.postpone",
  "chapter.publish",
  "chapter.publish_early",
]);

const OUTCOME_BY_ACTION: Record<string, string> = {
  PUBLICATION_SCHEDULED: "SCHEDULED",
  CHAPTER_POSTPONED: "POSTPONED",
  CHAPTER_PUBLISHED: "PUBLISHED",
  "comment.create": "OPEN",
  "comment.reply": "OPEN",
  "comment.resolved": "RESOLVED",
  "comment.reopened": "REOPENED",
};

function activityArea(action: string): EditorActivityArea | null {
  if (REDUNDANT_CHAPTER_AUDITS.has(action)) return null;
  if (PUBLICATION_ACTIONS.has(action)) return "PUBLICATION";
  if (/^proposal[._]/i.test(action)) return "PROPOSAL";
  if (/^chapter[._]/i.test(action)) return "CHAPTER";
  if (/^comment[.]/i.test(action)) return "COMMENT";
  return null;
}

function chapterIdForComment(comment: any): string | null {
  if (comment?.chapterId) return String(comment.chapterId);
  if (comment?.targetType === "CHAPTER" && comment?.targetId) return String(comment.targetId);
  return null;
}

function chapterSubject(seriesTitle: string | null, chapter: any): string {
  const chapterNumber = Number(chapter?.number);
  const chapterLabel = Number.isInteger(chapterNumber)
    ? `Chapter ${chapterNumber}`
    : String(chapter?.title ?? chapter?.id ?? "Chapter");
  return seriesTitle ? `${seriesTitle} · ${chapterLabel}` : chapterLabel;
}

export async function getEditorActivity(actor: RequestActor): Promise<EditorActivityRecord[]> {
  if (actor.role !== "EDITOR") {
    throw new AppError(403, "Editor permission is required.", "FORBIDDEN");
  }

  const audits = await AuditEntryModel.find({
    actorId: actor.id,
    action: { $regex: /^(proposal[._]|chapter[._]|comment[.]|publication[._])/i },
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const classified = audits
    .map((audit: any) => ({ audit, area: activityArea(String(audit.action)) }))
    .filter((entry): entry is { audit: any; area: EditorActivityArea } => entry.area !== null);

  const proposalIds = classified
    .filter(({ area }) => area === "PROPOSAL")
    .map(({ audit }) => String(audit.entityId));
  const commentIds = classified
    .filter(({ area }) => area === "COMMENT")
    .map(({ audit }) => String(audit.entityId));
  const directChapterIds = classified
    .filter(({ area }) => area === "CHAPTER" || area === "PUBLICATION")
    .map(({ audit }) => String(audit.entityId));

  const [proposals, comments] = await Promise.all([
    ProposalModel.find({ id: { $in: proposalIds } }).select({ id: 1, title: 1 }).lean(),
    StudioCommentModel.find({ id: { $in: commentIds } })
      .select({ id: 1, seriesId: 1, chapterId: 1, targetType: 1, targetId: 1 })
      .lean(),
  ]);
  const commentById = new Map(comments.map((comment: any) => [String(comment.id), comment]));
  const commentChapterIds = comments
    .map(chapterIdForComment)
    .filter((value): value is string => value !== null);
  const chapters = await ChapterModel.find({
    id: { $in: [...new Set([...directChapterIds, ...commentChapterIds])] },
  })
    .select({ id: 1, seriesId: 1, number: 1, title: 1 })
    .lean();
  const chapterById = new Map(chapters.map((chapter: any) => [String(chapter.id), chapter]));
  const seriesIds = new Set<string>();
  for (const chapter of chapters as any[]) seriesIds.add(String(chapter.seriesId));
  for (const comment of comments as any[]) {
    if (comment.seriesId) seriesIds.add(String(comment.seriesId));
  }
  const series = await SeriesModel.find({ id: { $in: [...seriesIds] } })
    .select({ id: 1, title: 1 })
    .lean();
  const seriesTitleById = new Map(
    series.map((item: any) => [String(item.id), String(item.title ?? item.id)]),
  );
  const proposalTitleById = new Map(
    proposals.map((proposal: any) => [String(proposal.id), String(proposal.title ?? proposal.id)]),
  );

  return classified.map(({ audit, area }) => {
    const entityId = String(audit.entityId);
    const comment = area === "COMMENT" ? commentById.get(entityId) : null;
    const chapterId = comment ? chapterIdForComment(comment) :
      area === "CHAPTER" || area === "PUBLICATION" ? entityId : null;
    const chapter = chapterId ? chapterById.get(chapterId) : null;
    const seriesId = chapter?.seriesId ?? comment?.seriesId ?? null;
    const seriesTitle = seriesId ? seriesTitleById.get(String(seriesId)) ?? null : null;
    const subject = area === "PROPOSAL"
      ? proposalTitleById.get(entityId) ?? `Proposal ${entityId}`
      : chapterSubject(seriesTitle, chapter);
    const metadata = audit.metadata as Record<string, unknown> | undefined;
    const outcome = typeof metadata?.toStatus === "string"
      ? metadata.toStatus
      : OUTCOME_BY_ACTION[String(audit.action)] ?? null;

    return {
      id: String(audit.id),
      action: String(audit.action),
      area,
      entityId,
      subject,
      seriesTitle,
      chapterNumber: Number.isInteger(Number(chapter?.number)) ? Number(chapter.number) : null,
      chapterTitle: chapter?.title ? String(chapter.title) : null,
      outcome,
      occurredAt: audit.createdAt ? new Date(audit.createdAt).toISOString() : null,
    };
  });
}
