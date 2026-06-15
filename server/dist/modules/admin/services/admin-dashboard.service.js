import * as repository from "../admin.repository.js";
export async function getAdminDashboardService() {
    const [activeUsers, totalSeries, activeTasks, boardMembers, activeTaskTypes] = await Promise.all([
        repository.countActiveUsers(),
        repository.countSeries(),
        repository.countActiveTasks(),
        repository.countBoardMembers(),
        repository.countTaskTypes(),
    ]);
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
            "User, Board, and Task Type controls are backend-enforced",
            "Admin cannot override Board decisions",
        ],
    };
}
//# sourceMappingURL=admin-dashboard.service.js.map