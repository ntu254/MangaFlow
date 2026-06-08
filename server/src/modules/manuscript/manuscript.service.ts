import { AppError } from "../../shared/errors/AppError.js"
import type { ManuscriptStatus, SeriesStatus } from "../../shared/workflow/status.js"
import type { UserRole } from "../auth/auth.types.js"
import {
  getManuscriptById,
  getSeriesForManuscript,
  updateManuscriptReviewStatus,
  updateSeriesReviewStatus,
} from "./manuscript.repository.js"

interface ManuscriptReviewActor {
  userId: string
  role: UserRole
}

interface ReviewInput {
  manuscriptId: string
  actor: ManuscriptReviewActor
  reviewNote?: string
}

async function assertEditor(actor: ManuscriptReviewActor) {
  if (actor.role !== "EDITOR") {
    throw new AppError("Only Editor can review manuscripts", 403)
  }
}

async function getReviewContext(manuscriptId: string) {
  const manuscript = await getManuscriptById(manuscriptId)
  if (!manuscript) {
    throw new AppError("Manuscript not found", 404)
  }

  const series = await getSeriesForManuscript(String(manuscript.seriesId))
  if (!series) {
    throw new AppError("Series not found", 404)
  }

  if (series.status !== "EDITOR_REVIEW") {
    throw new AppError("Series must be in EDITOR_REVIEW for manuscript review", 409)
  }

  if (manuscript.status !== "EDITOR_REVIEW") {
    throw new AppError("Manuscript must be in EDITOR_REVIEW for this action", 409)
  }

  return { manuscript, series }
}

async function applyReviewDecision(
  input: ReviewInput,
  manuscriptStatus: ManuscriptStatus,
  seriesStatus: SeriesStatus,
) {
  await assertEditor(input.actor)
  const { manuscript, series } = await getReviewContext(input.manuscriptId)

  const updatedManuscript = await updateManuscriptReviewStatus(
    String(manuscript._id),
    manuscriptStatus,
    input.reviewNote,
  )
  await updateSeriesReviewStatus(String(series._id), seriesStatus)

  return updatedManuscript
}

export async function requestManuscriptRevisionService(input: ReviewInput) {
  return applyReviewDecision(input, "REVISION_REQUESTED", "REVISION_REQUESTED")
}

export async function forwardManuscriptToBoardService(input: ReviewInput) {
  return applyReviewDecision(input, "APPROVED_TO_BOARD", "BOARD_REVIEW")
}

export async function rejectManuscriptService(input: ReviewInput) {
  return applyReviewDecision(input, "REJECTED", "REJECTED")
}
