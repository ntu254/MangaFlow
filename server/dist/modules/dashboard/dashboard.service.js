import * as repository from "./dashboard.repository.js";
export async function getAdminSidebarSummaryService() {
    const [activeUsers, totalSeries, activeTasks, boardMembers, activeTaskTypes, suspendedUsers, seriesPendingReview, activeBoardChairs, inactiveTaskTypes, pendingPayrollConfirmations,] = await Promise.all([
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
    ]);
    const aiStatus = "PENDING_INTEGRATION";
    const storageUsagePercent = 0;
    const missingBoardChair = activeBoardChairs === 0;
    const storageWarning = storageUsagePercent >= 80;
    const aiUnhealthy = aiStatus !== "OPERATIONAL";
    const criticalAuditEvents = 0;
    const systemWarnings = [missingBoardChair, storageWarning, aiUnhealthy].filter(Boolean).length;
    const unreadNotifications = systemWarnings;
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
    };
}
export async function getMangakaSummaryService(_userId) {
    // Parallel fast queries
    const seriesCount = await repository.countSeries(); // should filter by owner
    return {
        nextActions: [
            { id: "1", type: "REVIEW_SUBMISSION", label: "Review 2 assistant submissions", isUrgent: true, targetId: "series-1" },
            { id: "2", type: "UPLOAD_MANUSCRIPT", label: "Upload Chapter 12 manuscript", isUrgent: false, targetId: "series-1" }
        ],
        activeSeriesPipeline: { draft: 1, boardReview: 1, production: 2, published: 5 },
        currentChapterProgress: { chapterId: "ch1", progressPercent: 65, totalPages: 20, completedPages: 13 },
        dueSoon: [],
        atRiskItems: [],
        quickStats: { activeSeries: seriesCount, completedTasks: 45, pendingReviews: 2 },
        recentActivity: []
    };
}
export async function getAssistantSummaryService(_userId) {
    return {
        nextActions: [
            { id: "1", type: "DO_TASK", label: "Complete background drawing for Page 5", isUrgent: true, targetId: "task-1" }
        ],
        myTasks: { dueToday: 2, inProgress: 1, revisionRequested: 0, submitted: 3, approved: 10 },
        dueSoon: [],
        quickStats: { totalEarnings: 1250, completedTasks: 42, activeTasks: 3 },
        recentActivity: []
    };
}
export async function getEditorSummaryService(_userId) {
    return {
        nextActions: [
            { id: "1", type: "REVIEW_MANUSCRIPT", label: "Review new manuscript for Series X", isUrgent: true, targetId: "series-x" }
        ],
        reviewQueue: { manuscripts: 2, productions: 5, publications: 1 },
        dueSoon: [],
        atRiskItems: [],
        quickStats: { assignedSeries: 12, pendingApprovals: 8 },
        recentActivity: []
    };
}
export async function getBoardSummaryService(_userId) {
    return {
        nextActions: [
            { id: "1", type: "VOTE_SERIES", label: "Vote on Series Y Proposal", isUrgent: true, targetId: "series-y" }
        ],
        boardQueue: { pendingVotes: 3, atRiskReviews: 1 },
        dueSoon: [],
        quickStats: { activeSeries: 24, totalVotesCast: 102 },
        recentActivity: []
    };
}
//# sourceMappingURL=dashboard.service.js.map