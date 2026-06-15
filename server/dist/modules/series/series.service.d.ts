import type { UserRole } from "../auth/auth.types.js";
export interface CreateSeriesServiceInput {
    title: string;
    synopsis: string;
    logline?: string;
    premise?: string;
    characters?: string;
    conflict?: string;
    targetAudience?: string;
    publicationType?: string;
    tags?: string[];
    genres?: string[];
    ownerId: string;
}
export declare function listSeriesService(userId: string, role: UserRole): Promise<any[]>;
export declare function getSeriesDetailService(seriesId: string, userId: string, role: UserRole): Promise<any>;
export declare function createSeriesService(input: CreateSeriesServiceInput): Promise<import("./series.repository.js").CreateSeriesResult>;
export interface CreateManuscriptUploadServiceInput {
    seriesId: string;
    userId: string;
    originalName: string;
    contentType: string;
    size: number;
    expiresIn?: number;
}
export declare function createManuscriptUploadService(input: CreateManuscriptUploadServiceInput): Promise<{
    uploadUrl: string;
    fileAssetId: any;
    manuscriptId: any;
    expiresIn: number;
}>;
export declare function submitSeriesService(seriesId: string, userId: string): Promise<any>;
export declare function getSeriesSummaryService(seriesId: string, userId: string, role: UserRole): Promise<{
    series: any;
    owner: {
        id: string;
        name: any;
        email: any;
    } | null;
    members: {
        id: string;
        role: any;
        isActive: any;
        accessScope: any;
        user: {
            id: string;
            name: any;
            email: any;
            role: any;
        } | null;
    }[];
    manuscripts: {
        id: string;
        version: any;
        status: any;
        reviewNote: any;
        uploadedBy: {
            id: string;
            name: any;
            email: any;
        } | null;
        file: {
            id: string;
            originalName: any;
            mimeType: any;
            size: any;
            createdAt: any;
        } | null;
        createdAt: any;
        updatedAt: any;
    }[];
    currentManuscript: {
        id: string;
        version: any;
        status: any;
        reviewNote: any;
        uploadedBy: {
            id: string;
            name: any;
            email: any;
        } | null;
        file: {
            id: string;
            originalName: any;
            mimeType: any;
            size: any;
            createdAt: any;
        } | null;
        createdAt: any;
        updatedAt: any;
    };
    chapters: {
        id: string;
        chapterNumber: any;
        title: any;
        status: any;
        draftSchedule: any;
        pageCount: number;
        approvedPages: number;
        updatedAt: any;
    }[];
    currentChapter: {
        id: string;
        chapterNumber: any;
        title: any;
        status: any;
        draftSchedule: any;
        pageCount: number;
        approvedPages: number;
        updatedAt: any;
    };
    chapterSummary: {
        total: number;
        completed: number;
        inProduction: number;
        totalPages: number;
        approvedPages: number;
        readinessPercent: number;
    };
    taskSummary: {
        total: number;
        pending: number;
        completed: number;
        pendingReviews: number;
    };
    recentTasks: {
        id: string;
        title: any;
        status: any;
        priority: any;
        dueDate: any;
        assignee: any;
    }[];
    recentSubmissions: {
        id: string;
        version: any;
        status: any;
        submittedBy: any;
        createdAt: any;
    }[];
    commentSummary: {
        open: number;
        resolved: number;
        blocking: number;
    };
    recentComments: {
        id: string;
        body: any;
        status: any;
        isBlocking: any;
        author: any;
        authorRole: any;
        updatedAt: any;
    }[];
    boardReview: {
        status: any;
        result: any;
        voteCount: number;
        updatedAt: any;
    } | null;
    publicationSummary: {
        isReady: boolean;
        scheduled: number;
        published: number;
        blockers: string[];
    };
    rankingSummary: {
        period: any;
        voteCount: any;
        readerScore: any;
        finalScore: any;
        status: any;
    } | null;
    payrollSummary: {
        totalEarnings: any;
        unpaid: any;
    };
    allowedActions: {
        canEditSeries: boolean;
        canUploadManuscript: boolean;
        canOpenWorkspace: boolean;
    };
}>;
export interface UpdateSeriesServiceInput {
    seriesId: string;
    userId: string;
    patch: {
        title?: string;
        synopsis?: string;
        logline?: string;
        premise?: string;
        characters?: string;
        conflict?: string;
        targetAudience?: string;
        publicationType?: string;
        tags?: string[];
        genres?: string[];
    };
}
export declare function updateSeriesService(input: UpdateSeriesServiceInput): Promise<any>;
//# sourceMappingURL=series.service.d.ts.map