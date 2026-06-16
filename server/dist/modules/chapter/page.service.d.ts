import type { UserRole } from "../auth/auth.types.js";
export declare function getPageWorkspaceService(pageId: string, userId: string, role: UserRole): Promise<{
    page: import("mongoose").FlattenMaps<import("./chapter.model.js").PageDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    };
    workingFileAsset: import("mongoose").Types.ObjectId;
    originalFileAsset: import("mongoose").Types.ObjectId | undefined;
    thumbnailFileAsset: import("mongoose").Types.ObjectId | undefined;
    regions: (import("mongoose").FlattenMaps<import("./chapter.model.js").RegionDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[];
    aiResults: (import("mongoose").FlattenMaps<import("./chapter.model.js").AIResultDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[];
    tasks: (import("mongoose").FlattenMaps<import("../task/task.model.js").TaskDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[];
    feedbackPoints: never[];
    collaborators: never[];
}>;
//# sourceMappingURL=page.service.d.ts.map