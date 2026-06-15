export declare function getAdminDashboardService(): Promise<{
    stats: {
        activeUsers: number;
        totalSeries: number;
        activeTasks: number;
        boardMembers: number;
        activeTaskTypes: number;
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
//# sourceMappingURL=admin-dashboard.service.d.ts.map