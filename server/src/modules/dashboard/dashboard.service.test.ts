import { beforeEach, describe, expect, it, vi } from "vitest"

const countActiveUsers = vi.fn()
const countSeries = vi.fn()
const countActiveTasks = vi.fn()
const countBoardMembers = vi.fn()
const countTaskTypes = vi.fn()

vi.mock("./dashboard.repository.js", () => ({
  countActiveUsers,
  countSeries,
  countActiveTasks,
  countBoardMembers,
  countTaskTypes,
}))

const { getAdminSidebarSummaryService } = await import("./dashboard.service.js")

describe("dashboard.service", () => {
  beforeEach(() => vi.clearAllMocks())

  it("builds admin dashboard summary counts", async () => {
    countActiveUsers.mockResolvedValue(12)
    countSeries.mockResolvedValue(4)
    countActiveTasks.mockResolvedValue(9)
    countBoardMembers.mockResolvedValue(3)
    countTaskTypes.mockResolvedValue(6)

    const result = await getAdminSidebarSummaryService()

    expect(result.stats).toEqual({
      activeUsers: 12,
      totalSeries: 4,
      activeTasks: 9,
      boardMembers: 3,
      activeTaskTypes: 6,
    })
    expect(result.auditPreview).toContain("Admin can view counts but cannot override Board decisions")
  })
})
