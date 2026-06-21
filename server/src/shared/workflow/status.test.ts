import { describe, expect, it } from "vitest"
import {
  BOARD_VOTE_VALUES,
  CHAPTER_STATUSES,
  COMMENT_STATUSES,
  MANUSCRIPT_STATUSES,
  NOTIFICATION_STATUSES,
  PAGE_STATUSES,
  PUBLICATION_STATUSES,
  REGION_STATUSES,
  SERIES_STATUSES,
  SUBMISSION_STATUSES,
  TASK_STATUSES,
  isSeriesStatus,
} from "./status.js"

describe("workflow status constants", () => {
  it("exposes canonical Series statuses from the workflow contract", () => {
    expect(SERIES_STATUSES).toEqual([
      "DRAFT",
      "EDITOR_REVIEW",
      "REVISION_REQUESTED",
      "BOARD_REVIEW",
      "ONGOING",
      "AT_RISK",
      "CANCELLED",
      "COMPLETED",
      "ARCHIVED",
      "REJECTED",
      "WITHDRAWN",
    ])
  })

  it("exposes every canonical production lifecycle", () => {
    expect(MANUSCRIPT_STATUSES).toEqual(["DRAFT", "SUBMITTED", "REVISION_REQUESTED", "APPROVED", "REJECTED", "ARCHIVED"])
    expect(CHAPTER_STATUSES).toEqual(["DRAFT", "IN_PRODUCTION", "READY_FOR_PUBLICATION", "PUBLISHED", "ARCHIVED"])
    expect(PAGE_STATUSES).toEqual(["PENDING", "UPLOADING", "PROCESSING", "UPLOADED", "PROCESSING_FAILED", "IN_TASK", "APPROVED", "LOCKED"])
    expect(REGION_STATUSES).toEqual(["ACTIVE", "LOCKED", "DELETED"])
    expect(TASK_STATUSES).toEqual(["TODO", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "MANGAKA_APPROVED", "EDITOR_APPROVED", "REJECTED", "CANCELLED"])
    expect(SUBMISSION_STATUSES).toEqual(["DRAFT", "SUBMITTED", "REVISION_REQUESTED", "MANGAKA_APPROVED", "EDITOR_APPROVED", "REJECTED"])
    expect(PUBLICATION_STATUSES).toEqual(["DRAFT", "SCHEDULED", "PUBLISHED", "FAILED", "CANCELLED"])
    expect(COMMENT_STATUSES).toEqual(["OPEN", "FIXED", "RESOLVED", "REOPENED"])
    expect(NOTIFICATION_STATUSES).toEqual(["UNREAD", "READ", "ARCHIVED"])
    expect(BOARD_VOTE_VALUES).toEqual(["APPROVE", "REJECT", "NEEDS_REVISION"])
  })

  it("narrows Series status strings", () => {
    expect(isSeriesStatus("BOARD_REVIEW")).toBe(true)
    expect(isSeriesStatus("PENDING_REVIEW")).toBe(false)
  })
})
