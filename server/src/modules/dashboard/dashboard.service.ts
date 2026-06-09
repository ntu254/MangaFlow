import * as repository from "./dashboard.repository.js"

export async function getAdminSidebarSummaryService() {
  const [
    activeUsers,
    totalSeries,
    activeTasks,
    boardMembers,
    activeTaskTypes,
    suspendedUsers,
    seriesPendingReview,
    activeBoardChairs,
    inactiveTaskTypes,
    pendingPayrollConfirmations,
  ] = await Promise.all([
    repository.countActiveUsers(),
    repository.countSeries(),
    repository.countActiveTasks(),
    repository.countBoardMembers(),
    repository.countTaskTypes(),
    repository.countSuspendedUsers(),
    repository.countSeriesPendingReview(),
    repository.countActiveBoardChairs(),
    repository.countInactiveTaskTypes(),
    repository.countPendingPayrollConfirmations(),
  ])

  const aiStatus: string = "PENDING_INTEGRATION"
  const storageUsagePercent = 0
  const missingBoardChair = activeBoardChairs === 0
  const storageWarning = storageUsagePercent >= 80
  const aiUnhealthy = aiStatus !== "OPERATIONAL"
  const criticalAuditEvents = 0
  const systemWarnings = [missingBoardChair, storageWarning, aiUnhealthy].filter(Boolean).length
  const unreadNotifications = systemWarnings

  return {
    stats: { activeUsers, totalSeries, activeTasks, boardMembers, activeTaskTypes },
    sidebarBadges: {
      suspendedUsers,
      seriesPendingReview,
      missingBoardChair,
      inactiveTaskTypes,
      taskRateWarnings: 0,
      pendingPayrollConfirmations,
      storageWarning,
      aiUnhealthy,
      criticalAuditEvents,
      systemWarnings,
      unreadNotifications,
    },
    systemHealth: [
      { key: "api", label: "API", status: "OPERATIONAL" },
      { key: "db", label: "Database", status: "OPERATIONAL" },
      { key: "storage", label: "Storage", status: storageWarning ? "WARNING" : "CONFIGURED" },
      { key: "ai", label: "AI Service", status: aiStatus },
    ],
    storage: { usedLabel: "MVP monitor", usagePercent: storageUsagePercent },
    auditPreview: [
      "Admin dashboard summary refreshed",
      "Admin can view counts but cannot override Board decisions",
      "Health endpoint remains available at /api/health",
    ],
  }
}
