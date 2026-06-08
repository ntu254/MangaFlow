import { describe, expect, it } from "vitest"
import { SUBMISSION_STATUSES } from "../../shared/workflow/status.js"
import { Submission } from "./submission.model.js"

describe("Submission model", () => {
  it("uses canonical Submission status constants", () => {
    const statusPath = Submission.schema.path("status")

    expect(statusPath.options.enum).toEqual(SUBMISSION_STATUSES)
  })

  it("keeps task submission versions unique", () => {
    const indexes = Submission.schema.indexes()

    expect(indexes).toContainEqual([
      { taskId: 1, version: 1 },
      { unique: true, background: true },
    ])
  })
})
