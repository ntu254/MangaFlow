import { AppError } from "../../shared/errors/AppError.js"
import { getManuscriptWithSeries, updateProposalReview } from "./manuscript.repository.js"

export type ProposalReviewAction = "REQUEST_REVISION" | "FORWARD_TO_BOARD" | "REJECT"

const ACTION_STATUS = {
  REQUEST_REVISION: { manuscript: "REVISION_REQUESTED", series: "REVISION_REQUESTED" },
  FORWARD_TO_BOARD: { manuscript: "APPROVED_TO_BOARD", series: "BOARD_REVIEW" },
  REJECT: { manuscript: "REJECTED", series: "REJECTED" },
} as const

export async function reviewManuscriptProposalService(manuscriptId: string, action: ProposalReviewAction) {
  const found = await getManuscriptWithSeries(manuscriptId)
  if (!found) throw new AppError("Manuscript not found", 404)
  if (found.manuscript.status !== "EDITOR_REVIEW" || found.series.status !== "EDITOR_REVIEW") {
    throw new AppError("Manuscript proposal is not in editor review", 409)
  }

  const target = ACTION_STATUS[action]
  return updateProposalReview(manuscriptId, target.manuscript, found.series.id, target.series)
}
