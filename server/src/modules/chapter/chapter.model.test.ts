import { describe, it, expect } from "vitest"
import { CHAPTER_STATUSES } from "../../shared/workflow/status.js"

describe("CHAPTER_STATUSES", () => {
  it("contains expected statuses in correct order", () => {
    expect(CHAPTER_STATUSES).toEqual([
      "DRAFT",
      "IN_PRODUCTION",
      "IN_REVIEW",
      "READY_FOR_PUBLICATION",
      "PUBLISHED",
      "REVISION_REQUIRED",
    ])
  })

  it("has correct length", () => {
    expect(CHAPTER_STATUSES).toHaveLength(6)
  })
})