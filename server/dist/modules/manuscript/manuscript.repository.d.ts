import type { ManuscriptStatus, SeriesStatus } from "../../shared/workflow/status.js";
export declare function getManuscriptById(manuscriptId: string): Promise<(import("mongoose").Document<unknown, {}, import("../series/series.model.js").ManuscriptDocument, {}, {}> & import("../series/series.model.js").ManuscriptDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function getSeriesForManuscript(seriesId: string): Promise<(import("mongoose").Document<unknown, {}, import("../series/series.model.js").SeriesDocument, {}, {}> & import("../series/series.model.js").SeriesDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function updateManuscriptReviewStatus(manuscriptId: string, status: ManuscriptStatus, reviewNote?: string): Promise<(import("mongoose").Document<unknown, {}, import("../series/series.model.js").ManuscriptDocument, {}, {}> & import("../series/series.model.js").ManuscriptDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function updateSeriesReviewStatus(seriesId: string, status: SeriesStatus): Promise<(import("mongoose").Document<unknown, {}, import("../series/series.model.js").SeriesDocument, {}, {}> & import("../series/series.model.js").SeriesDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
//# sourceMappingURL=manuscript.repository.d.ts.map