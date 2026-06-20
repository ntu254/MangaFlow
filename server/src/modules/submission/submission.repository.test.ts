import { describe, expect, it, vi } from "vitest"

const taskMocks = vi.hoisted(() => ({
  findOneAndUpdate: vi.fn(),
}))

vi.mock("../task/task.model.js", () => ({
  Task: { findOneAndUpdate: taskMocks.findOneAndUpdate },
}))
vi.mock("./submission.model.js", () => ({
  Submission: {},
}))

import { updateTaskForNewSubmission } from "./submission.repository.js"

describe("submission repository task handoff", () => {
  it("atomically sets the current submission and SUBMITTED status for a submittable task", async () => {
    taskMocks.findOneAndUpdate.mockResolvedValue({
      id: "task1",
      status: "SUBMITTED",
      currentSubmissionId: "submission2",
    })

    await updateTaskForNewSubmission("task1", "submission2")

    expect(taskMocks.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: "task1",
        status: { $in: ["TODO", "IN_PROGRESS", "REVISION_REQUESTED"] },
      },
      {
        status: "SUBMITTED",
        currentSubmissionId: "submission2",
      },
      { new: true },
    )
  })
})
