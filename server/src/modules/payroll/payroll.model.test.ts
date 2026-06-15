import { describe, expect, it } from "vitest"
import { ASSISTANT_EARNING_STATUSES } from "../../shared/workflow/status.js"
import { AssistantEarning } from "./payroll.model.js"

describe("AssistantEarning model", () => {
  it("uses canonical assistant earning status enum values", () => {
    const enumValues = (AssistantEarning.schema.path("status") as any).enumValues
    expect(enumValues).toEqual([...ASSISTANT_EARNING_STATUSES])
  })
})
