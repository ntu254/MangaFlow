import { describe, expect, it } from "vitest"
import { MANUSCRIPT_STATUSES } from "../../shared/workflow/status.js"
import { Manuscript } from "../series/series.model.js"

describe("Manuscript model", () => {
  it("uses canonical manuscript status enum values", () => {
    const enumValues = (Manuscript.schema.path("status") as any).enumValues
    expect(enumValues).toEqual([...MANUSCRIPT_STATUSES])
  })
})
