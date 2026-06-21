import { beforeEach, describe, expect, it, vi } from "vitest"

const getSeriesForActor = vi.fn()
const getSeriesSummaryData = vi.fn()

vi.mock("./series.repository.js", () => ({
  getSeriesForActor,
  getSeriesSummaryData,
}))

const { getSeriesSummaryService } = await import("./series.service.js")

describe("getSeriesSummaryService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSeriesForActor.mockResolvedValue({
      id: "series-1",
      ownerId: "owner-1",
      status: "ONGOING",
    })
  })

  it("aggregates real production and review metrics", async () => {
    getSeriesSummaryData.mockResolvedValue({
      owner: { _id: "owner-1", name: "Owner", email: "owner@example.com" },
      members: [],
      manuscripts: [{
        _id: "manuscript-1",
        version: 2,
        status: "SUBMITTED",
        fileAssetId: "file-1",
        uploadedBy: { _id: "owner-1", name: "Owner", email: "owner@example.com" },
        createdAt: new Date(),
        updatedAt: new Date(),
      }],
      files: [{ _id: "file-1", originalName: "proposal.pdf", mimeType: "application/pdf", size: 1024, createdAt: new Date() }],
      chapters: [{
        _id: "chapter-1",
        chapterNumber: 1,
        title: "Opening",
        status: "IN_PRODUCTION",
        updatedAt: new Date(),
      }],
      pages: [
        { chapterId: "chapter-1", status: "APPROVED" },
        { chapterId: "chapter-1", status: "IN_TASK" },
      ],
      tasks: [
        { _id: "task-1", title: "Tone", status: "TODO", priority: "NORMAL", dueDate: new Date(), assignedTo: { name: "Assistant" } },
        { _id: "task-2", title: "Letter", status: "EDITOR_APPROVED", priority: "NORMAL", dueDate: new Date(), assignedTo: { name: "Assistant" } },
      ],
      submissions: [{ _id: "submission-1", version: 1, status: "SUBMITTED", createdAt: new Date() }],
      comments: [
        { _id: "comment-1", body: "Fix panel", status: "OPEN", isBlocking: true, updatedAt: new Date() },
        { _id: "comment-2", body: "Done", status: "RESOLVED", isBlocking: true, updatedAt: new Date() },
      ],
      boardDecision: null,
      boardVotes: [],
      ranking: null,
      earnings: [{ finalPayment: 100, status: "PENDING" }, { finalPayment: 200, status: "PAID" }],
      publications: [],
    })

    const result = await getSeriesSummaryService("series-1", "owner-1", "MANGAKA")

    expect(result.currentManuscript).toMatchObject({ version: 2 })
    expect(result.chapterSummary).toMatchObject({ total: 1, totalPages: 2, approvedPages: 1, readinessPercent: 50 })
    expect(result.taskSummary).toMatchObject({ total: 2, pending: 1, completed: 1, pendingReviews: 1 })
    expect(result.commentSummary).toEqual({ open: 1, resolved: 1, blocking: 1 })
    expect(result.payrollSummary).toEqual({ totalEarnings: 300, unpaid: 100 })
    expect(result.allowedActions.canOpenWorkspace).toBe(true)
  })
})
