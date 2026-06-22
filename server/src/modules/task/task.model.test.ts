import { describe, it, expect } from "vitest"
import { TASK_STATUSES, TASK_PRIORITIES, TASK_CURRENCIES } from "../../shared/workflow/status.js"
import { SeriesMember } from "../series/series.model.js"
import { Task } from "./task.model.js"

describe("TASK_STATUSES", () => {
  it("contains expected statuses", () => {
    expect(TASK_STATUSES).toEqual([
      "TODO",
      "IN_PROGRESS",
      "SUBMITTED",
      "REVISION_REQUESTED",
      "MANGAKA_APPROVED",
      "EDITOR_APPROVED",
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

describe("Task currency snapshots", () => {
  it("uses the canonical task currency enum and defaults to VND", () => {
    const currencyPath = Task.schema.path("currency")

    expect(currencyPath.options.enum).toEqual(TASK_CURRENCIES)
    expect(currencyPath.options.default).toBe("VND")
  })
})

describe("SeriesMember access scope", () => {
  it("supports TASK_ONLY for Assistant assignment eligibility", () => {
    const accessScopePath = SeriesMember.schema.path("accessScope")

    expect(accessScopePath.options.enum).toEqual(["FULL", "TASK_ONLY"])
  })
})
