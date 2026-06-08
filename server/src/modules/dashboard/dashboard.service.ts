import * as repository from "./dashboard.repository.js"

export async function getAdminSidebarSummaryService() {
  const [activeUsers, totalSeries, activeTasks, boardMembers, activeTaskTypes] = await Promise.all([
    repository.countActiveUsers(),
    repository.countSeries(),
    repository.countActiveTasks(),
    repository.countBoardMembers(),
    repository.countTaskTypes(),
  ])

  return {
    stats: { activeUsers, totalSeries, activeTasks, boardMembers, activeTaskTypes },
    systemHealth: [
      { key: "api", label: "API", status: "OPERATIONAL" },
      { key: "db", label: "Database", status: "OPERATIONAL" },
      { key: "storage", label: "Storage", status: "CONFIGURED" },
      { key: "ai", label: "AI Service", status: "PENDING_INTEGRATION" },
    ],
    storage: { usedLabel: "MVP monitor", usagePercent: 0 },
    auditPreview: [
      "Admin dashboard summary refreshed",
      "Admin can view counts but cannot override Board decisions",
      "Health endpoint remains available at /api/health",
    ],
  }
}
