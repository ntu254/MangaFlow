import { beforeEach, describe, expect, it, vi } from "vitest"

const pageFindById = vi.fn()
const pageFindOne = vi.fn()
const chapterFindById = vi.fn()
const fileAssetFindById = vi.fn()
const seriesMemberFindOne = vi.fn()
const submissionFindOne = vi.fn()
const taskFindOne = vi.fn()
const taskFind = vi.fn()

const pageId = "507f1f77bcf86cd799439011"
const chapterId = "507f1f77bcf86cd799439012"
const seriesId = "507f1f77bcf86cd799439013"
const fileAssetId = "507f1f77bcf86cd799439014"

vi.mock("../../modules/chapter/chapter.model.js", () => ({
  Page: { findById: pageFindById, findOne: pageFindOne },
  Chapter: { findById: chapterFindById },
  FileAsset: { findById: fileAssetFindById },
}))

vi.mock("../../modules/series/series.model.js", () => ({
  SeriesMember: { findOne: seriesMemberFindOne },
}))

vi.mock("../../modules/submission/submission.model.js", () => ({
  Submission: { findOne: submissionFindOne },
}))

vi.mock("../../modules/task/task.model.js", () => ({
  Task: { findOne: taskFindOne, find: taskFind },
}))

const { assertCanReadFileAsset, canReadPage } = await import("./accessPolicy.service.js")

describe("AccessPolicyService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    pageFindById.mockResolvedValue({ _id: pageId, chapterId })
    chapterFindById.mockResolvedValue({ _id: chapterId, seriesId })
    fileAssetFindById.mockResolvedValue({ _id: fileAssetId, uploadedBy: "owner1" })
    pageFindOne.mockResolvedValue(null)
    submissionFindOne.mockResolvedValue(null)
    seriesMemberFindOne.mockResolvedValue(null)
    taskFindOne.mockResolvedValue(null)
  })

  it("denies Assistant page access from SeriesMember alone", async () => {
    seriesMemberFindOne.mockResolvedValue({ role: "ASSISTANT", isActive: true, accessScope: "TASK_ONLY" })
    taskFind.mockResolvedValue([])

    await expect(canReadPage({ userId: "assistant1", role: "ASSISTANT" }, pageId)).resolves.toBe(false)
    expect(taskFindOne).toHaveBeenCalledWith({
      seriesId,
      assignedTo: "assistant1",
      status: { $in: ["TODO", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "MANGAKA_APPROVED"] },
      $or: [{ pageId }, { contextPageIds: pageId }],
    })
  })

  it("allows Assistant page access for assigned task or explicit context page", async () => {
    taskFindOne.mockResolvedValue({ _id: "task1", assignedTo: "assistant1" })

    await expect(canReadPage({ userId: "assistant1", role: "ASSISTANT" }, pageId)).resolves.toBe(true)
  })

  it("denies signed file access when file is outside task/page/submission scope", async () => {
    await expect(assertCanReadFileAsset({ userId: "assistant1", role: "ASSISTANT" }, fileAssetId)).rejects.toMatchObject({
      statusCode: 403,
      message: "File access denied",
    })
  })

  it("allows signed file access for a scoped page file", async () => {
    pageFindOne.mockResolvedValue({ _id: pageId, chapterId })
    taskFindOne.mockResolvedValue({ _id: "task1", assignedTo: "assistant1" })

    await expect(assertCanReadFileAsset({ userId: "assistant1", role: "ASSISTANT" }, fileAssetId)).resolves.toBeUndefined()
  })
})
