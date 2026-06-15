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

const { getAdminSidebarSummaryService } = await import("./dashboard.service.js")

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
})
