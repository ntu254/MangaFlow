import mongoose, { type Document } from "mongoose";
import { type RankingStatus } from "../../shared/workflow/status.js";
export interface RankingDocument extends Document {
    period: string;
    seriesId: mongoose.Types.ObjectId;
    voteCount: number;
    readerScore: number;
    finalScore: number;
    status: RankingStatus;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Ranking: mongoose.Model<RankingDocument, {}, {}, {}, mongoose.Document<unknown, {}, RankingDocument, {}, {}> & RankingDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=ranking.model.d.ts.map