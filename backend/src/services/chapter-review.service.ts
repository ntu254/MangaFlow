import {
  ChapterModel,
  ChapterReviewModel,
  MaterialModel,
  ProposalModel,
  SeriesModel,
  StudioCommentModel,
  StudioRegionModel,
  StudioTaskModel,
  SubmissionModel,
} from "../db/models.js";
import { id, nowIso } from "../domain/ids.js";
import { apiToWebRole } from "../domain/roles.js";
import { AppError } from "../lib/http.js";
import { audit } from "./audit.service.js";
import {
  chapterReviewVersion,
  pageHasUploadedAsset,
  pageReviewVersion,
} from "./chapter-readiness.service.js";
import { runWorkflowTransaction, toObject } from "./workflow-support.service.js";
import type { AuthedRequest } from "../types.js";
import type { ClientSession } from "mongoose";

const CHAPTER_REVIEW_SOURCE_STATUSES: Record<"SUBMIT_REVIEW" | "RESUBMIT", string[]> = {
  SUBMIT_REVIEW: ["IN_PRODUCTION", "PLANNED"],
  RESUBMIT: ["REVISION_REQUIRED"],
};
const APPROVED_TASK_STATUSES = ["MANGAKA_APPROVED"];

function ensureActor(req: AuthedRequest) {
  if (!req.actor) throw new AppError(401, "Missing authenticated user.", "MISSING_AUTH");
  return req.actor;
}

function lowerRole(actor: NonNullable<AuthedRequest["actor"]>) {
  return apiToWebRole[actor.role];
}

export async function findChapterBlockingComments(
  chapter: any,
  tasks: any[],
  submissions: any[],
  acceptedStatuses: string[] = ["ADDRESSED", "RESOLVED"],
) {
  const series = (await SeriesModel.findOne({ id: chapter.seriesId })
    .select({ editorId: 1 })
    .lean()) as any;
  if (!series?.editorId) return [];
  const pageIds = (chapter.pages ?? []).map((page: any) => page.id).filter(Boolean);
  const regions = await StudioRegionModel.find({ chapterId: chapter.id }).select({ id: 1 }).lean();
  const regionIds = regions.map((region: any) => region.id);
  const taskIds = tasks.map((task: any) => task.id);
  const submissionIds = submissions.map((submission: any) => submission.id);

  return StudioCommentModel.find({
    $and: [
      {
        $or: [
          { chapterId: chapter.id },
          { pageId: { $in: pageIds } },
          { regionId: { $in: regionIds } },
          { taskId: { $in: taskIds } },
          { targetType: "CHAPTER", targetId: chapter.id },
          { targetType: "PAGE", targetId: { $in: pageIds } },
          { targetType: "REGION", targetId: { $in: regionIds } },
          { targetType: "TASK", targetId: { $in: taskIds } },
          { targetType: "SUBMISSION", targetId: { $in: submissionIds } },
        ],
      },
      { authorId: series.editorId },
      { $or: [{ isBlocking: true }, { blocking: true }] },
      { status: { $nin: acceptedStatuses } },
    ],
  }).lean();
}

export async function sendChapterToEditorReview(
  req: AuthedRequest,
  chapterId: string,
  action: "SUBMIT_REVIEW" | "RESUBMIT" = "SUBMIT_REVIEW",
) {
  const actor = ensureActor(req);
  if (actor.role !== "MANGAKA") {
    throw new AppError(
      403,
      "Only the Mangaka owner can send this chapter to editor review.",
      "MANGAKA_OWNER_REQUIRED",
    );
  }

  const chapterDoc = await ChapterModel.findOne({ id: chapterId });
  if (!chapterDoc) throw new AppError(404, "Chapter not found.", "CHAPTER_NOT_FOUND");
  const chapter = chapterDoc.toObject() as any;
  const series = (await SeriesModel.findOne({ id: chapter.seriesId }).lean()) as any;
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");
  if (series.authorId !== actor.id) {
    throw new AppError(
      403,
      "Only the Mangaka owner can send this chapter to editor review.",
      "MANGAKA_OWNER_REQUIRED",
    );
  }
  if (String(series.status) !== "ONGOING") {
    throw new AppError(
      409,
      "Series must be ONGOING before normal chapter production review.",
      "SERIES_NOT_IN_PRODUCTION",
    );
  }

  const sourceProposalId = series.sourceProposalId ?? series.proposalId;
  const approvedProposal = sourceProposalId
    ? await ProposalModel.findOne({ id: sourceProposalId, status: "APPROVED" }).lean()
    : null;
  if (!approvedProposal) {
    throw new AppError(
      409,
      "The production series must originate from a Board-approved proposal.",
      "PROPOSAL_NOT_APPROVED",
    );
  }
  if (!CHAPTER_REVIEW_SOURCE_STATUSES[action].includes(chapter.status)) {
    throw new AppError(
      409,
      `Chapter cannot be ${action === "RESUBMIT" ? "resubmitted" : "submitted"} for review from status "${chapter.status}".`,
      "INVALID_TRANSITION",
    );
  }
  if (
    !Array.isArray(chapter.pages) ||
    chapter.pages.length === 0 ||
    chapter.pages.some((page: any) => !pageHasUploadedAsset(page))
  ) {
    throw new AppError(
      409,
      "Page image is required before sending to editor review.",
      "PAGE_IMAGE_REQUIRED",
    );
  }

  const pageIds = chapter.pages.map((page: any) => page.id);
  const [tasks, submissions, reviewMaterials] = await Promise.all([
    StudioTaskModel.find({ chapterId }).lean(),
    SubmissionModel.find({ chapterId }).lean(),
    MaterialModel.find({
      $and: [
        { $or: [{ chapterId }, { pageId: { $in: pageIds } }] },
        {
          $or: [{ fileKey: { $exists: true, $ne: "" } }, { url: { $exists: true, $ne: "" } }],
        },
      ],
    }).lean(),
  ]);
  if (
    reviewMaterials.some(
      (material: any) => !["ACTIVE", "APPROVED"].includes(String(material.status)),
    )
  ) {
    throw new AppError(
      409,
      "Review materials must be ACTIVE or APPROVED before sending to editor review.",
      "REVIEW_MATERIAL_NOT_ACTIVE",
    );
  }
  // CANCELLED and REJECTED tasks are terminal dead-ends (a rejected task cannot
  // be reopened; the region is freed for a replacement task), so they must not
  // block editor review.
  const relevantTasks = tasks.filter(
    (task: any) =>
      task.status !== "CANCELLED" &&
      task.status !== "REJECTED" &&
      task.isRequired !== false,
  );
  if (relevantTasks.some((task: any) => !APPROVED_TASK_STATUSES.includes(String(task.status)))) {
    throw new AppError(
      409,
      "All assistant tasks must be approved by Mangaka before editor review.",
      "TASKS_NOT_MANGAKA_APPROVED",
    );
  }

  const relevantTaskIds = new Set(relevantTasks.map((task: any) => task.id));
  const taskWithoutApprovedSubmission = relevantTasks.find(
    (task: any) =>
      !task.currentSubmissionId ||
      !submissions.some(
        (submission: any) =>
          submission.id === task.currentSubmissionId &&
          submission.taskId === task.id &&
          submission.status === "MANGAKA_APPROVED",
      ),
  );
  if (
    taskWithoutApprovedSubmission ||
    submissions.some(
      (submission: any) =>
        relevantTaskIds.has(submission.taskId) &&
        relevantTasks.some((task: any) => task.currentSubmissionId === submission.id) &&
        !["MANGAKA_APPROVED", "SUPERSEDED"].includes(submission.status),
    )
  ) {
    throw new AppError(
      409,
      "All assistant submissions must be approved by Mangaka before editor review.",
      "SUBMISSIONS_NOT_MANGAKA_APPROVED",
    );
  }

  const blockingComments = await findChapterBlockingComments(chapter, tasks, submissions);
  if (blockingComments.length > 0) {
    throw new AppError(
      409,
      "Blocking comments must be addressed before editor review.",
      "BLOCKING_COMMENTS_UNRESOLVED",
    );
  }

  const now = nowIso();
  const pages = chapter.pages.map((page: any) => ({
    ...page,
    status: "TANTOU_REVIEW",
    updatedAt: now,
  }));
  const event = {
    id: id("ce"),
    chapterId,
    actorId: actor.id,
    actorName: actor.name,
    actorRole: lowerRole(actor),
    type: action,
    fromStatus: chapter.status,
    toStatus: "TANTOU_REVIEW",
    createdAt: now,
  };
  const reviewSnapshot = {
    chapterVersionId: chapterReviewVersion(chapter),
    pageVersionIds: pages.map((page: any) => ({
      pageId: page.id,
      pageVersionId: pageReviewVersion(page),
    })),
    frozenAt: now,
  };

  const persistReviewTransition = async (session?: ClientSession) => {
    const options = session ? { session } : undefined;
    const chapterUpdate = await ChapterModel.updateOne(
      { id: chapterId, status: chapter.status },
      {
        $set: {
          status: "TANTOU_REVIEW",
          pages,
          reviewSnapshot,
          ...(action === "RESUBMIT"
            ? { revisionRound: Number(chapter.revisionRound ?? 0) + 1 }
            : {}),
          updatedAt: now,
        },
        $push: { history: event },
      },
      options,
    );
    if (chapterUpdate.modifiedCount !== 1) {
      throw new AppError(
        409,
        "Chapter status changed while sending to editor review. Please refresh and try again.",
        "CONFLICT",
      );
    }

    await ChapterReviewModel.findOneAndUpdate(
      { chapterId, status: "OPEN" },
      {
        $setOnInsert: {
          id: id("cr"),
          chapterId,
          seriesId: chapter.seriesId,
          chapterVersionId: reviewSnapshot.chapterVersionId,
          pageVersionIds: reviewSnapshot.pageVersionIds,
          status: "OPEN",
          createdById: actor.id,
          snapshot: {
            chapter: {
              id: chapter.id,
              title: chapter.title,
              number: chapter.number,
              status: "TANTOU_REVIEW",
            },
            pages,
            taskIds: relevantTasks.map((task: any) => task.id),
            submissionIds: submissions
              .filter((submission: any) =>
                relevantTasks.some((task: any) => task.currentSubmissionId === submission.id),
              )
              .map((submission: any) => submission.id),
          },
        },
      },
      { upsert: true, returnDocument: "after", ...options },
    );

    await Promise.all([
      StudioTaskModel.updateMany(
        { chapterId, status: "MANGAKA_APPROVED" },
        { $set: { updatedAt: now } },
        options,
      ),
      SubmissionModel.updateMany(
        { chapterId, status: "MANGAKA_APPROVED" },
        { $set: { updatedAt: now } },
        options,
      ),
    ]);

    await audit(
      req,
      action === "RESUBMIT" ? "CHAPTER_RESUBMITTED_FOR_REVIEW" : "CHAPTER_SENT_TO_EDITOR_REVIEW",
      "chapter",
      chapterId,
      {
        action,
        fromStatus: chapter.status,
        toStatus: "TANTOU_REVIEW",
        flow: relevantTasks.length > 0 ? "ASSISTANT_TASK" : "DIRECT",
        pageIds: pages.map((page: any) => page.id),
        taskIds: relevantTasks.map((task: any) => task.id),
      },
      session,
    );
  };
  if (action === "RESUBMIT") {
    await runWorkflowTransaction(persistReviewTransition);
  } else {
    await persistReviewTransition();
  }

  const updatedChapter = toObject(await ChapterModel.findOne({ id: chapterId }).lean()) as any;
  return {
    chapter: updatedChapter,
    pages: updatedChapter.pages,
    nextStatus: "TANTOU_REVIEW",
    flow: relevantTasks.length > 0 ? "ASSISTANT_TASK" : "DIRECT",
    message: "Chapter sent to Tantou Review.",
  };
}
