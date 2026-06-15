export declare function getSeriesSummaryData(seriesId: string, ownerId: string): Promise<{
    owner: (import("mongoose").FlattenMaps<import("../../auth/auth.model.js").UserDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null;
    members: (import("mongoose").FlattenMaps<import("../series.model.js").SeriesMemberDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[];
    manuscripts: (import("mongoose").FlattenMaps<import("../series.model.js").ManuscriptDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[];
    files: (import("mongoose").FlattenMaps<import("../../chapter/chapter.model.js").FileAssetDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[];
    chapters: (import("mongoose").FlattenMaps<import("../../chapter/chapter.model.js").ChapterDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[];
    pages: (import("mongoose").FlattenMaps<import("../../chapter/chapter.model.js").PageDocument> & Required<{
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
    comments: (import("mongoose").FlattenMaps<import("../../comment/comment.model.js").CommentDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[];
    boardDecision: (import("mongoose").FlattenMaps<import("../../board/board.model.js").BoardDecisionDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null;
    boardVotes: (import("mongoose").FlattenMaps<import("../../board/board.model.js").BoardVoteDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[];
    ranking: (import("mongoose").FlattenMaps<import("../../ranking/ranking.model.js").RankingDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null;
    earnings: (import("mongoose").FlattenMaps<import("../../payroll/payroll.model.js").AssistantEarningDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[];
    publications: (import("mongoose").FlattenMaps<import("../../publication/publication.model.js").PublicationDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[];
}>;
//# sourceMappingURL=series-summary.repository.d.ts.map