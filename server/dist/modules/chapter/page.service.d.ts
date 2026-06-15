import type { UserRole } from "../auth/auth.types.js";
export declare function getPageWorkspaceService(pageId: string, _userId: string, _role: UserRole): Promise<{
    page: import("mongoose").Document<unknown, {}, import("./chapter.model.js").PageDocument, {}, {}> & import("./chapter.model.js").PageDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    };
    tasks: (import("mongoose").Document<unknown, {}, import("../task/task.model.js").TaskDocument, {}, {}> & import("../task/task.model.js").TaskDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[];
    regions: never[];
    feedbackPoints: never[];
    collaborators: never[];
}>;
//# sourceMappingURL=page.service.d.ts.map