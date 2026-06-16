import { describe, it, expect } from "vitest"
import { TASK_STATUSES, TASK_PRIORITIES } from "../../shared/workflow/status.js"
import { SeriesMember } from "../series/series.model.js"
import { Task } from "./task.model.js"

describe("TASK_STATUSES", () => {
  it("contains expected statuses", () => {
    expect(TASK_STATUSES).toEqual([
      "TODO",
      "IN_PROGRESS",
      "SUBMITTED",
      "MANGAKA_APPROVED",
      "EDITOR_APPROVED",
      "REVISION_REQUESTED",
      "REJECTED",
      "CANCELLED",
    ] as const)
  })

  it("is used by the Task model enum", () => {
    const statusPath = Task.schema.path("status")

    expect(statusPath.options.enum).toEqual(TASK_STATUSES)
  })
})

describe("TASK_PRIORITIES", () => {
  it("contains expected priorities", () => {
    expect(TASK_PRIORITIES).toEqual(["LOW", "NORMAL", "HIGH", "URGENT"] as const)
  })
})

describe("SeriesMember access scope", () => {
  it("supports TASK_ONLY for Assistant assignment eligibility", () => {
    const accessScopePath = SeriesMember.schema.path("accessScope")

    expect(accessScopePath.options.enum).toEqual(["FULL", "TASK_ONLY"])
  })
})
