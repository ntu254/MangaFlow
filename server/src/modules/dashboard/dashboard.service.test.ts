import { beforeEach, describe, expect, it, vi } from "vitest"

const countActiveUsers = vi.fn()
const countSeries = vi.fn()
const countActiveTasks = vi.fn()
const countBoardMembers = vi.fn()
const countTaskTypes = vi.fn()
const countSuspendedUsers = vi.fn()
const countSeriesPendingReview = vi.fn()
const countActiveBoardChairs = vi.fn()
const countInactiveTaskTypes = vi.fn()
const countPendingPayrollConfirmations = vi.fn()
const seriesCountDocuments = vi.fn()
const seriesFind = vi.fn()
const seriesMemberFind = vi.fn()
const submissionCountDocuments = vi.fn()
const taskCountDocuments = vi.fn()

vi.mock("./dashboard.repository.js", () => ({
  countActiveUsers,
  countSeries,
  countActiveTasks,
  countBoardMembers,
  countTaskTypes,
  countSuspendedUsers,
  countSeriesPendingReview,
  countActiveBoardChairs,
  countInactiveTaskTypes,
  countPendingPayrollConfirmations,
}))

vi.mock("../series/series.model.js", () => ({
  Series: {
    countDocuments: seriesCountDocuments,
    find: seriesFind,
  },
  SeriesMember: {
    find: seriesMemberFind,
  },
}))

vi.mock("../submission/submission.model.js", () => ({
  Submission: {
    countDocuments: submissionCountDocuments,
  },
}))

vi.mock("../task/task.model.js", () => ({
  Task: {
    countDocuments: taskCountDocuments,
  },
}))

vi.mock("../chapter/chapter.model.js", () => ({
  Chapter: {
    find: vi.fn(),
  },
}))

const { getAdminSidebarSummaryService, getEditorSummaryService } = await import("./dashboard.service.js")

describe("dashboard.service", () => {
  beforeEach(() => vi.clearAllMocks())

  it("builds admin dashboard summary counts and sidebar badges", async () => {
    countActiveUsers.mockResolvedValue(12)
    countSeries.mockResolvedValue(4)
    countActiveTasks.mockResolvedValue(9)
    countBoardMembers.mockResolvedValue(3)
    countTaskTypes.mockResolvedValue(6)
    countSuspendedUsers.mockResolvedValue(2)
    countSeriesPendingReview.mockResolvedValue(5)
    countActiveBoardChairs.mockResolvedValue(0)
    countInactiveTaskTypes.mockResolvedValue(1)
    countPendingPayrollConfirmations.mockResolvedValue(7)

    const result = await getAdminSidebarSummaryService()

    expect(result.stats).toEqual({
      activeUsers: 12,
      totalSeries: 4,
      activeTasks: 9,
      boardMembers: 3,
      activeTaskTypes: 6,
    })
    expect(result.sidebarBadges).toMatchObject({
      suspendedUsers: 2,
      seriesPendingReview: 5,
      missingBoardChair: true,
      inactiveTaskTypes: 1,
      pendingPayrollConfirmations: 7,
      aiUnhealthy: true,
    })
    expect(result.auditPreview).toContain("Admin can view counts but cannot override Board decisions")
  })

  it("counts Editor final reviews from Mangaka-approved submissions and active Editor memberships", async () => {
    seriesMemberFind.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([{ seriesId: "64f000000000000000000001" }]),
      }),
    })
    seriesCountDocuments
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(3)
    submissionCountDocuments.mockResolvedValue(2)
    taskCountDocuments.mockResolvedValue(4)
    seriesFind.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([{ title: "At Risk", status: "AT_RISK" }]),
      }),
    })

    const result = await getEditorSummaryService("64f000000000000000000099")

    expect(seriesMemberFind).toHaveBeenCalledWith({
      userId: expect.anything(),
      role: "EDITOR",
      status: "ACTIVE",
    })
    expect(submissionCountDocuments).toHaveBeenCalledWith({
      seriesId: { $in: ["64f000000000000000000001"] },
      status: "MANGAKA_APPROVED",
    })
    expect(seriesCountDocuments).toHaveBeenLastCalledWith({ status: "EDITOR_REVIEW" })
    expect(result.reviewQueue).toMatchObject({ manuscripts: 3, productions: 2 })
    expect(result.quickStats).toMatchObject({ assignedSeries: 1, pendingApprovals: 2, deadlineSoon: 4 })
  })
})
