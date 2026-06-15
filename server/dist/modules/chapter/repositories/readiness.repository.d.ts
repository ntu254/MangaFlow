export declare function getChapterReadinessData(chapterId: string): Promise<{
    chapter: import("mongoose").FlattenMaps<import("../chapter.model.js").ChapterDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    };
    pages: (import("mongoose").FlattenMaps<import("../chapter.model.js").PageDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[];
    tasks: (import("mongoose").FlattenMaps<import("../../task/task.model.js").TaskDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[];
    submissions: (import("mongoose").FlattenMaps<import("../../submission/submission.model.js").SubmissionDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[];
    blockingComments: (import("mongoose").FlattenMaps<import("../../comment/comment.model.js").CommentDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[];
} | null>;
//# sourceMappingURL=readiness.repository.d.ts.map