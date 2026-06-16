import type { PublicationType } from "../../shared/workflow/status.js";
import type { UserRole } from "../auth/auth.types.js";
interface ManuscriptReviewActor {
    userId: string;
    role: UserRole;
}
interface ReviewInput {
    manuscriptId?: string;
    seriesId?: string;
    actor: ManuscriptReviewActor;
    reviewNote?: string;
    revisionReason?: string;
    feedbackSummary?: string;
    rejectReason?: string;
    editorRecommendation?: string;
    feasibilityNote?: string;
    suggestedPublicationType?: PublicationType;
    riskNote?: string;
}
export declare function listEditorReviewQueueService(actor: ManuscriptReviewActor): Promise<{
    series: import("mongoose").FlattenMaps<import("../series/series.model.js").SeriesDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    };
    manuscript: any;
}[]>;
export declare function getEditorSeriesReviewService(seriesId: string, actor: ManuscriptReviewActor): Promise<{
    series: import("mongoose").Document<unknown, {}, import("../series/series.model.js").SeriesDocument, {}, {}> & import("../series/series.model.js").SeriesDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    };
    manuscript: import("mongoose").Document<unknown, {}, import("../series/series.model.js").ManuscriptDocument, {}, {}> & import("../series/series.model.js").ManuscriptDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    };
}>;
export declare function startEditorReviewService(seriesId: string, actor: ManuscriptReviewActor): Promise<{
    series: import("mongoose").Document<unknown, {}, import("../series/series.model.js").SeriesDocument, {}, {}> & import("../series/series.model.js").SeriesDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    };
    manuscript: import("mongoose").Document<unknown, {}, import("../series/series.model.js").ManuscriptDocument, {}, {}> & import("../series/series.model.js").ManuscriptDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    };
}>;
export declare function requestManuscriptRevisionService(input: ReviewInput): Promise<(import("mongoose").Document<unknown, {}, import("../series/series.model.js").ManuscriptDocument, {}, {}> & import("../series/series.model.js").ManuscriptDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function forwardManuscriptToBoardService(input: ReviewInput): Promise<(import("mongoose").Document<unknown, {}, import("../series/series.model.js").ManuscriptDocument, {}, {}> & import("../series/series.model.js").ManuscriptDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function rejectManuscriptService(input: ReviewInput): Promise<(import("mongoose").Document<unknown, {}, import("../series/series.model.js").ManuscriptDocument, {}, {}> & import("../series/series.model.js").ManuscriptDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export {};
//# sourceMappingURL=manuscript.service.d.ts.map