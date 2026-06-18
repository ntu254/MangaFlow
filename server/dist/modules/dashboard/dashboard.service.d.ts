export declare function getAdminSidebarSummaryService(): Promise<{
    stats: {
        activeUsers: number;
        totalSeries: number;
        activeTasks: number;
        boardMembers: number;
        activeTaskTypes: number;
    };
    sidebarBadges: {
        suspendedUsers: number;
        seriesPendingReview: number;
        missingBoardChair: boolean;
        inactiveTaskTypes: number;
        taskRateWarnings: number;
        pendingPayrollConfirmations: number;
        storageWarning: boolean;
        aiUnhealthy: boolean;
        criticalAuditEvents: number;
        systemWarnings: number;
        unreadNotifications: number;
    };
    systemHealth: {
        key: string;
        label: string;
        status: string;
    }[];
    storage: {
        usedLabel: string;
        usagePercent: number;
    };
    auditPreview: string[];
}>;
export declare function getMangakaSummaryService(_userId: string): Promise<{
    nextActions: {
        id: string;
        type: string;
        label: string;
        isUrgent: boolean;
        targetId: string;
    }[];
    activeSeriesPipeline: {
        draft: number;
        boardReview: number;
        production: number;
        published: number;
    };
    currentChapterProgress: {
        chapterId: string;
        progressPercent: number;
        totalPages: number;
        completedPages: number;
    };
    dueSoon: never[];
    atRiskItems: never[];
    quickStats: {
        activeSeries: number;
        completedTasks: number;
        pendingReviews: number;
    };
    recentActivity: never[];
}>;
export declare function getAssistantSummaryService(_userId: string): Promise<{
    nextActions: {
        id: string;
        type: string;
        label: string;
        isUrgent: boolean;
        targetId: string;
    }[];
    myTasks: {
        dueToday: number;
        inProgress: number;
        revisionRequested: number;
        submitted: number;
        approved: number;
    };
    dueSoon: never[];
    quickStats: {
        totalEarnings: number;
        completedTasks: number;
        activeTasks: number;
    };
    recentActivity: never[];
}>;
export declare function getEditorSummaryService(userId: string): Promise<{
    nextActions: never[];
    reviewQueue: {
        manuscripts: number;
        productions: number;
        publications: number;
    };
    dueSoon: never[];
    atRiskItems: never[];
    quickStats: {
        assignedSeries: number;
        pendingApprovals: number;
    };
    recentActivity: never[];
}>;
export declare function getBoardSummaryService(_userId: string): Promise<{
    nextActions: never[];
    boardQueue: {
        pendingVotes: number;
        atRiskReviews: number;
    };
    dueSoon: never[];
    quickStats: {
        activeSeries: number;
        totalVotesCast: number;
    };
    recentActivity: never[];
}>;
//# sourceMappingURL=dashboard.service.d.ts.map