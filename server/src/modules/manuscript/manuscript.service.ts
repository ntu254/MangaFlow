import { AppError } from "../../shared/errors/AppError.js"
import { notifyRole, notifyUsers, recordAuditLog } from "../../shared/workflow/events.js"
import type { ManuscriptStatus, PublicationType, SeriesStatus } from "../../shared/workflow/status.js"
import type { UserRole } from "../auth/auth.types.js"
import { createBoardReviewSession, getOrCreateDecision } from "../board/board.repository.js"
import {
  getLatestManuscriptForSeries,
  getManuscriptById,
  getSeriesForManuscript,
  listEditorReviewQueue,
  updateManuscriptReviewStatus,
  updateSeriesReviewStatus,
} from "./manuscript.repository.js"

interface ManuscriptReviewActor {
  userId: string
  role: UserRole
}

interface ReviewInput {
  manuscriptId?: string
  seriesId?: string
  actor: ManuscriptReviewActor
  reviewNote?: string
  revisionReason?: string
  feedbackSummary?: string
  rejectReason?: string
  editorRecommendation?: string
  feasibilityNote?: string
  suggestedPublicationType?: PublicationType
  riskNote?: string
}

async function assertEditor(actor: ManuscriptReviewActor) {
  if (actor.role !== "EDITOR") {
    throw new AppError("Only Editor can review manuscripts", 403)
  }
}

async function getReviewContext(input: Pick<ReviewInput, "manuscriptId" | "seriesId">) {
  const manuscript = input.manuscriptId
    ? await getManuscriptById(input.manuscriptId)
    : input.seriesId
      ? await getLatestManuscriptForSeries(input.seriesId)
      : null
  if (!manuscript) throw new AppError("Manuscript not found", 404)

  const series = await getSeriesForManuscript(String(manuscript.seriesId))
  if (!series) throw new AppError("Series not found", 404)

  if (input.seriesId && String(series._id) !== input.seriesId) {
    throw new AppError("Manuscript does not belong to this series", 400)
  }

  if (series.status !== "EDITOR_REVIEW") {
    throw new AppError("Series must be in EDITOR_REVIEW for manuscript review", 409)
  }

  if (!["SUBMITTED", "UNDER_EDITOR_REVIEW"].includes(manuscript.status)) {
    throw new AppError("Manuscript must be SUBMITTED or UNDER_EDITOR_REVIEW for this action", 409)
  }

  return { manuscript, series }
}

async function applyReviewDecision(
  input: ReviewInput,
  manuscriptStatus: ManuscriptStatus,
  seriesStatus: SeriesStatus,
) {
  await assertEditor(input.actor)
  const { manuscript, series } = await getReviewContext(input)

  const updatedManuscript = await updateManuscriptReviewStatus(
    String(manuscript._id),
    manuscriptStatus,
    input.reviewNote,
    {
      editorRecommendation: input.editorRecommendation,
      feasibilityNote: input.feasibilityNote,
      suggestedPublicationType: input.suggestedPublicationType,
      riskNote: input.riskNote,
    },
  )
  await updateSeriesReviewStatus(String(series._id), seriesStatus)

  if (seriesStatus === "BOARD_REVIEW") {
    await createBoardReviewSession(String(series._id), input.actor.userId)
    await getOrCreateDecision(String(series._id))
  }

  const ownerId = String(series.ownerId)
  const seriesId = String(series._id)
  if (seriesStatus === "REVISION_REQUESTED") {
    void Promise.all([
      notifyUsers([ownerId], {
        event: "EDITOR_REQUESTED_REVISION",
        title: "Revision requested",
        message: `${series.title} needs manuscript updates before review can continue.`,
        link: `/app/mangaka/series/${seriesId}`,
      }),
      recordAuditLog({ event: "EDITOR_REQUESTED_REVISION", actorId: input.actor.userId, entityType: "Series", entityId: seriesId }),
    ]).catch(() => undefined)
  } else if (seriesStatus === "REJECTED") {
    void Promise.all([
      notifyUsers([ownerId], {
        event: "EDITOR_REJECTED_SERIES",
        title: "Series proposal rejected",
        message: `${series.title} was rejected by the editor.`,
        link: `/app/mangaka/series/${seriesId}`,
      }),
      recordAuditLog({ event: "EDITOR_REJECTED_SERIES", actorId: input.actor.userId, entityType: "Series", entityId: seriesId }),
    ]).catch(() => undefined)
  } else if (seriesStatus === "BOARD_REVIEW") {
    void Promise.all([
      notifyRole("BOARD", {
        event: "SERIES_FORWARDED_TO_BOARD",
        title: "Series ready for Board review",
        message: `${series.title} has been forwarded for Board voting.`,
        link: `/app/board/series/${seriesId}/summary`,
      }),
      recordAuditLog({ event: "SERIES_FORWARDED_TO_BOARD", actorId: input.actor.userId, entityType: "Series", entityId: seriesId }),
    ]).catch(() => undefined)
  }

  return updatedManuscript
}

export async function listEditorReviewQueueService(actor: ManuscriptReviewActor) {
  await assertEditor(actor)
  return listEditorReviewQueue()
}

export async function getEditorSeriesReviewService(seriesId: string, actor: ManuscriptReviewActor) {
  await assertEditor(actor)
  const { manuscript, series } = await getReviewContext({ seriesId })
  if (manuscript.status === "SUBMITTED") {
    await updateManuscriptReviewStatus(String(manuscript._id), "UNDER_EDITOR_REVIEW")
    manuscript.status = "UNDER_EDITOR_REVIEW"
    void recordAuditLog({ event: "EDITOR_STARTED_REVIEW", actorId: actor.userId, entityType: "Series", entityId: seriesId }).catch(() => undefined)
  }
  return { series, manuscript }
}

export async function startEditorReviewService(seriesId: string, actor: ManuscriptReviewActor) {
  return getEditorSeriesReviewService(seriesId, actor)
}

export async function requestManuscriptRevisionService(input: ReviewInput) {
  await assertEditor(input.actor)
  if (!input.revisionReason?.trim() && !input.feedbackSummary?.trim() && !input.reviewNote?.trim()) {
    throw new AppError("Revision reason or feedback summary is required", 400)
  }
  return applyReviewDecision(
    {
      ...input,
      reviewNote: input.reviewNote?.trim() || [input.revisionReason, input.feedbackSummary].filter(Boolean).join("\n"),
    },
    "REVISION_REQUESTED",
    "REVISION_REQUESTED",
  )
}

export async function forwardManuscriptToBoardService(input: ReviewInput) {
  await assertEditor(input.actor)
  if (!input.editorRecommendation?.trim()) throw new AppError("Editor recommendation is required", 400)
  if (!input.feasibilityNote?.trim()) throw new AppError("Feasibility note is required", 400)
  if (!input.suggestedPublicationType) throw new AppError("Suggested publication type is required", 400)

  return applyReviewDecision(
    {
      ...input,
      editorRecommendation: input.editorRecommendation.trim(),
      feasibilityNote: input.feasibilityNote.trim(),
      riskNote: input.riskNote?.trim() || undefined,
    },
    "FORWARDED_TO_BOARD",
    "BOARD_REVIEW",
  )
}

export async function rejectManuscriptService(input: ReviewInput) {
  await assertEditor(input.actor)
  if (!input.rejectReason?.trim() && !input.reviewNote?.trim()) {
    throw new AppError("Reject reason is required", 400)
  }
  return applyReviewDecision(
    {
      ...input,
      reviewNote: input.reviewNote?.trim() || input.rejectReason?.trim(),
    },
    "REJECTED",
    "REJECTED",
  )
}
